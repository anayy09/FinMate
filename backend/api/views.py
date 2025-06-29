from rest_framework import status, generics, permissions
from rest_framework.response import Response
from rest_framework.views import APIView
from django.contrib.auth import get_user_model
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import authenticate
from .serializers import UserSerializer, LoginSerializer
from .utils import send_verification_email
from rest_framework.permissions import AllowAny
from django.shortcuts import get_object_or_404
from .utils import send_verification_email, send_password_reset_email
import uuid
import pyotp
import qrcode
import io
import base64
from .models import UserSession

User = get_user_model()

class SignupView(generics.CreateAPIView):
    """API to register a new user."""
    queryset = User.objects.all()
    serializer_class = UserSerializer

class LoginView(APIView):
    """Authenticate user and issue JWT token."""
    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        if serializer.is_valid():
            email = serializer.validated_data["email"]
            password = serializer.validated_data["password"]
            
            try:
                user = User.objects.get(email=email)
            except User.DoesNotExist:
                return Response({"error": "Invalid Credentials"}, status=status.HTTP_401_UNAUTHORIZED)
            
            # Check if email is verified
            if not user.email_verified:
                return Response({
                    "error": "Email not verified", 
                    "message": "Please verify your email before logging in. Check your inbox for the verification link."
                }, status=status.HTTP_401_UNAUTHORIZED)
            
            # Check password
            if not user.check_password(password):
                return Response({"error": "Invalid Credentials"}, status=status.HTTP_401_UNAUTHORIZED)
            
            # Check if 2FA is enabled
            if user.two_factor_enabled:
                token_2fa = request.data.get("two_factor_token")
                if not token_2fa:
                    return Response({
                        "requires_2fa": True,
                        "message": "2FA token required"
                    }, status=status.HTTP_200_OK)
                
                # Verify 2FA token
                totp = pyotp.TOTP(user.two_factor_secret)
                if not totp.verify(token_2fa):
                    return Response({"error": "Invalid 2FA token"}, status=status.HTTP_401_UNAUTHORIZED)

            refresh = RefreshToken.for_user(user)

            # Create a session entry
            session_id = str(uuid.uuid4())
            ip_address = request.META.get("REMOTE_ADDR")
            device_info = request.META.get("HTTP_USER_AGENT")

            UserSession.objects.create(
                user=user,
                session_id=session_id,
                ip_address=ip_address,
                device_info=device_info
            )

            return Response(
                {
                    "refresh": str(refresh),
                    "access": str(refresh.access_token),
                    "session_id": session_id,
                    "user": {
                        "id": user.id,
                        "email": user.email,
                        "name": user.name,
                        "two_factor_enabled": user.two_factor_enabled
                    }
                },
                status=status.HTTP_200_OK,
            )
        return Response({"error": "Invalid Credentials"}, status=status.HTTP_401_UNAUTHORIZED)

class LogoutView(APIView):
    """API to logout user and revoke refresh token."""
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        try:
            refresh_token = request.data["refresh"]
            token = RefreshToken(refresh_token)
            token.blacklist()
            return Response({"message": "Logged out"}, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({"error": "Invalid token"}, status=status.HTTP_400_BAD_REQUEST)
        
class SignupView(generics.CreateAPIView):
    """API to register a new user and send verification email."""
    queryset = User.objects.all()
    serializer_class = UserSerializer

    def post(self, request, *args, **kwargs):
        response = super().post(request, *args, **kwargs)
        user = User.objects.get(email=request.data["email"])
        send_verification_email(user)
        return Response({"message": "User registered. Please verify your email."}, status=status.HTTP_201_CREATED)
    
class VerifyEmailView(APIView):
    """API to verify a user's email."""
    # permission_classes = [AllowAny]

    def get(self, request, token):
        user = get_object_or_404(User, verification_token=token)
        if user.email_verified:
            return Response({"message": "Email already verified"}, status=status.HTTP_400_BAD_REQUEST)
        user.email_verified = True
        user.is_active = True
        user.verification_token = uuid.uuid4()
        user.save()
        return Response({"message": "Email verified successfully"}, status=status.HTTP_200_OK)
    
class PasswordResetRequestView(APIView):
    """Request password reset by sending an email."""
    permission_classes = [AllowAny]

    def post(self, request):
        email = request.data.get("email")
        user = get_object_or_404(User, email=email)
        send_password_reset_email(user)
        return Response({"message": "Password reset email sent."}, status=status.HTTP_200_OK)

class PasswordResetView(APIView):
    """Reset password using verification token."""
    permission_classes = [AllowAny]

    def post(self, request, token):
        user = get_object_or_404(User, verification_token=token)
        new_password = request.data.get("password")
        user.set_password(new_password)
        user.verification_token = uuid.uuid4()  # Reset token after use
        user.save()
        return Response({"message": "Password reset successfully."}, status=status.HTTP_200_OK)

class ActiveSessionsView(APIView):
    """List all active sessions for the logged-in user."""
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        sessions = UserSession.objects.filter(user=request.user)
        session_data = [
            {
                "session_id": session.session_id,
                "ip_address": session.ip_address,
                "device_info": session.device_info,
                "created_at": session.created_at,
            }
            for session in sessions
        ]
        return Response(session_data, status=status.HTTP_200_OK)

class LogoutDeviceView(APIView):
    """Log out from a specific session."""
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        session_id = request.data.get("session_id")
        try:
            session = UserSession.objects.get(user=request.user, session_id=session_id)
            session.delete()  # Remove session
            return Response({"message": "Logged out from device"}, status=status.HTTP_200_OK)
        except UserSession.DoesNotExist:
            return Response({"error": "Session not found"}, status=status.HTTP_404_NOT_FOUND)

class Setup2FAView(APIView):
    """Set up 2FA for user."""
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        user = request.user
        if user.two_factor_enabled:
            return Response({"error": "2FA is already enabled"}, status=status.HTTP_400_BAD_REQUEST)
        
        # Generate secret
        secret = pyotp.random_base32()
        user.two_factor_secret = secret
        user.save()

        # Generate QR code
        totp = pyotp.TOTP(secret)
        provisioning_uri = totp.provisioning_uri(
            name=user.email,
            issuer_name="FinMate"
        )
        
        qr = qrcode.QRCode(version=1, box_size=10, border=5)
        qr.add_data(provisioning_uri)
        qr.make(fit=True)
        
        img = qr.make_image(fill_color="black", back_color="white")
        buffer = io.BytesIO()
        img.save(buffer, format='PNG')
        qr_code_data = base64.b64encode(buffer.getvalue()).decode()

        return Response({
            "secret": secret,
            "qr_code": f"data:image/png;base64,{qr_code_data}",
            "manual_entry_key": secret
        }, status=status.HTTP_200_OK)

class Verify2FAView(APIView):
    """Verify 2FA setup."""
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        user = request.user
        token = request.data.get("token")
        
        if not user.two_factor_secret:
            return Response({"error": "2FA not set up"}, status=status.HTTP_400_BAD_REQUEST)
        
        totp = pyotp.TOTP(user.two_factor_secret)
        if totp.verify(token):
            user.two_factor_enabled = True
            user.save()
            return Response({"message": "2FA enabled successfully"}, status=status.HTTP_200_OK)
        else:
            return Response({"error": "Invalid token"}, status=status.HTTP_400_BAD_REQUEST)

class Disable2FAView(APIView):
    """Disable 2FA for user."""
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        user = request.user
        password = request.data.get("password")
        
        if not user.check_password(password):
            return Response({"error": "Invalid password"}, status=status.HTTP_400_BAD_REQUEST)
        
        user.two_factor_enabled = False
        user.two_factor_secret = None
        user.save()
        
        return Response({"message": "2FA disabled successfully"}, status=status.HTTP_200_OK)
