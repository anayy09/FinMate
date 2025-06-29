from rest_framework import status, generics, permissions, viewsets, filters
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.decorators import action
from django.contrib.auth import get_user_model
from django.utils import timezone
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import authenticate
from django_filters.rest_framework import DjangoFilterBackend
from .serializers import (
    UserSerializer, LoginSerializer, CategorySerializer, AccountSerializer,
    TransactionSerializer, BudgetSerializer, RecurringTransactionSerializer,
    NotificationSerializer, NotificationPreferenceSerializer, AIInsightSerializer,
    SavingsGoalSerializer, ExpensePredictionSerializer, WeeklySummarySerializer
)
from .models import User, Category, Account, Transaction, Budget, RecurringTransaction
from .notification_models import Notification, NotificationPreference, AIInsight, SavingsGoal
from .utils import send_verification_email, send_password_reset_email
from rest_framework.permissions import AllowAny
from django.shortcuts import get_object_or_404
from decimal import Decimal
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

# Transaction Management Views
# Removed duplicate import - already imported at the top
from rest_framework.decorators import action
from django_filters.rest_framework import DjangoFilterBackend
from django.db.models import Sum, Count
from django.db.models.functions import TruncMonth, TruncDay
from datetime import datetime, timedelta
from decimal import Decimal
from .models import Category, Account, Transaction, Budget, RecurringTransaction
from .serializers import (
    CategorySerializer, AccountSerializer, TransactionSerializer, 
    TransactionCreateSerializer, BudgetSerializer, RecurringTransactionSerializer,
    TransactionAnalyticsSerializer, CategoryAnalyticsSerializer
)

class CategoryViewSet(viewsets.ModelViewSet):
    """ViewSet for managing transaction categories."""
    serializer_class = CategorySerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [filters.SearchFilter, DjangoFilterBackend]
    search_fields = ['name', 'description']
    filterset_fields = ['category_type']
    
    def get_queryset(self):
        # Return only default categories (shared across all users)
        return Category.objects.filter(is_default=True).order_by('name')

class AccountViewSet(viewsets.ModelViewSet):
    """ViewSet for managing user accounts."""
    serializer_class = AccountSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [filters.SearchFilter, DjangoFilterBackend]
    search_fields = ['name']
    filterset_fields = ['account_type', 'is_active']
    
    def get_queryset(self):
        return Account.objects.filter(user=self.request.user)
    
    def perform_create(self, serializer):
        serializer.save(user=self.request.user)
    
    @action(detail=True, methods=['post'])
    def update_balance(self, request, pk=None):
        """Update account balance."""
        account = self.get_object()
        new_balance = request.data.get('balance')
        
        if new_balance is not None:
            try:
                account.balance = Decimal(str(new_balance))
                account.save()
                return Response({'message': 'Balance updated successfully'})
            except (ValueError, TypeError):
                return Response({'error': 'Invalid balance amount'}, 
                              status=status.HTTP_400_BAD_REQUEST)
        
        return Response({'error': 'Balance is required'}, 
                       status=status.HTTP_400_BAD_REQUEST)

class TransactionViewSet(viewsets.ModelViewSet):
    """ViewSet for managing transactions."""
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [filters.SearchFilter, DjangoFilterBackend, filters.OrderingFilter]
    search_fields = ['description', 'merchant_name', 'notes']
    filterset_fields = ['transaction_type', 'category', 'account']
    ordering_fields = ['transaction_date', 'amount', 'created_at']
    ordering = ['-transaction_date', '-created_at']
    
    def get_queryset(self):
        queryset = Transaction.objects.filter(user=self.request.user).select_related(
            'category', 'account'
        )
        
        # Date filtering
        start_date = self.request.query_params.get('start_date')
        end_date = self.request.query_params.get('end_date')
        
        if start_date:
            queryset = queryset.filter(transaction_date__gte=start_date)
        if end_date:
            queryset = queryset.filter(transaction_date__lte=end_date)
            
        return queryset
    
    def get_serializer_class(self):
        if self.action == 'create':
            return TransactionCreateSerializer
        return TransactionSerializer
    
    def perform_create(self, serializer):
        # Ensure user has at least one account
        if not self.request.user.accounts.exists():
            from .models import Account
            Account.objects.create(
                user=self.request.user,
                name="Default Account",
                account_type="checking",
                balance=Decimal('0.00'),
                currency="USD"
            )
        
        transaction = serializer.save(user=self.request.user)
        
        # Update account balance
        account = transaction.account
        if transaction.transaction_type == 'expense':
            account.balance -= transaction.amount
        elif transaction.transaction_type == 'income':
            account.balance += transaction.amount
        account.save()
        
        # Auto-categorize if no category is provided
        if not transaction.category:
            self.auto_categorize_transaction(transaction)
    
    def perform_update(self, serializer):
        old_transaction = self.get_object()
        new_transaction = serializer.save()
        
        # Update account balance (reverse old transaction and apply new one)
        account = new_transaction.account
        
        # Reverse old transaction
        if old_transaction.transaction_type == 'expense':
            account.balance += old_transaction.amount
        elif old_transaction.transaction_type == 'income':
            account.balance -= old_transaction.amount
            
        # Apply new transaction
        if new_transaction.transaction_type == 'expense':
            account.balance -= new_transaction.amount
        elif new_transaction.transaction_type == 'income':
            account.balance += new_transaction.amount
            
        account.save()
    
    def perform_destroy(self, instance):
        # Update account balance
        account = instance.account
        if instance.transaction_type == 'expense':
            account.balance += instance.amount
        elif instance.transaction_type == 'income':
            account.balance -= instance.amount
        account.save()
        
        instance.delete()
    
    def auto_categorize_transaction(self, transaction):
        """Auto-categorize transaction using simple ML logic."""
        description = transaction.description.lower()
        merchant = (transaction.merchant_name or '').lower()
        text = f"{description} {merchant}"
        
        # Simple keyword-based categorization
        category_keywords = {
            'food': ['restaurant', 'food', 'pizza', 'burger', 'coffee', 'starbucks', 'mcdonalds'],
            'transport': ['uber', 'lyft', 'gas', 'fuel', 'parking', 'metro', 'bus'],
            'shopping': ['amazon', 'walmart', 'target', 'store', 'shop', 'market'],
            'entertainment': ['netflix', 'spotify', 'movie', 'cinema', 'game'],
            'utilities': ['electric', 'water', 'internet', 'phone', 'utility'],
            'healthcare': ['pharmacy', 'doctor', 'hospital', 'medical', 'health'],
            'groceries': ['grocery', 'supermarket', 'whole foods', 'kroger'],
        }
        
        best_category = None
        best_confidence = 0.0
        
        for category_name, keywords in category_keywords.items():
            confidence = sum(1 for keyword in keywords if keyword in text) / len(keywords)
            if confidence > best_confidence:
                best_confidence = confidence
                best_category = category_name
        
        if best_category and best_confidence > 0.1:
            try:
                category = Category.objects.get(
                    name__icontains=best_category,
                    category_type='expense'
                )
                transaction.category = category
                transaction.categorization_confidence = best_confidence
                transaction.save()
            except Category.DoesNotExist:
                pass
    
    @action(detail=False, methods=['get'])
    def analytics(self, request):
        """Get transaction analytics."""
        user = request.user
        
        # Date range (default to current month)
        end_date = datetime.now().date()
        start_date = end_date.replace(day=1)
        
        # Override with query params if provided
        if request.query_params.get('start_date'):
            start_date = datetime.strptime(request.query_params.get('start_date'), '%Y-%m-%d').date()
        if request.query_params.get('end_date'):
            end_date = datetime.strptime(request.query_params.get('end_date'), '%Y-%m-%d').date()
        
        # Get transactions in date range
        transactions = Transaction.objects.filter(
            user=user,
            transaction_date__range=[start_date, end_date]
        )
        
        # Calculate totals
        income_total = transactions.filter(transaction_type='income').aggregate(
            total=Sum('amount'))['total'] or Decimal('0')
        expense_total = transactions.filter(transaction_type='expense').aggregate(
            total=Sum('amount'))['total'] or Decimal('0')
        
        # Category breakdown
        category_breakdown = transactions.filter(
            transaction_type='expense'
        ).values(
            'category__id', 'category__name', 'category__color'
        ).annotate(
            total_amount=Sum('amount'),
            transaction_count=Count('id')
        ).order_by('-total_amount')
        
        # Calculate percentages
        for item in category_breakdown:
            if expense_total > 0:
                item['percentage'] = float(item['total_amount'] / expense_total * 100)
            else:
                item['percentage'] = 0
        
        # Monthly trends (last 6 months)
        six_months_ago = end_date - timedelta(days=180)
        monthly_data = transactions.filter(
            transaction_date__gte=six_months_ago
        ).annotate(
            month=TruncMonth('transaction_date')
        ).values('month', 'transaction_type').annotate(
            total=Sum('amount')
        ).order_by('month')
        
        # Recent transactions
        recent_transactions = transactions.order_by('-transaction_date', '-created_at')[:10]
        
        analytics_data = {
            'total_income': income_total,
            'total_expenses': expense_total,
            'net_worth': income_total - expense_total,
            'transaction_count': transactions.count(),
            'category_breakdown': list(category_breakdown),
            'monthly_trends': list(monthly_data),
            'recent_transactions': recent_transactions
        }
        
        serializer = TransactionAnalyticsSerializer(analytics_data)
        return Response(serializer.data)

class BudgetViewSet(viewsets.ModelViewSet):
    """ViewSet for managing budgets."""
    serializer_class = BudgetSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['category', 'month']
    
    def get_queryset(self):
        return Budget.objects.filter(user=self.request.user).select_related('category')
    
    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

class RecurringTransactionViewSet(viewsets.ModelViewSet):
    """ViewSet for managing recurring transactions."""
    serializer_class = RecurringTransactionSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [filters.SearchFilter, DjangoFilterBackend]
    search_fields = ['description']
    filterset_fields = ['frequency', 'is_active', 'transaction_type']
    
    def get_queryset(self):
        return RecurringTransaction.objects.filter(user=self.request.user).select_related(
            'category', 'account'
        )
    
    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

# AI Insights and Notification Views
class NotificationViewSet(viewsets.ModelViewSet):
    """ViewSet for managing user notifications."""
    serializer_class = NotificationSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['notification_type', 'status']
    ordering = ['-created_at']
    
    def get_queryset(self):
        return Notification.objects.filter(user=self.request.user)
    
    @action(detail=True, methods=['post'])
    def mark_as_read(self, request, pk=None):
        """Mark a notification as read."""
        notification = self.get_object()
        notification.mark_as_read()
        return Response({'status': 'marked as read'})
    
    @action(detail=False, methods=['post'])
    def mark_all_as_read(self, request):
        """Mark all notifications as read."""
        unread_notifications = self.get_queryset().filter(read_at__isnull=True)
        count = unread_notifications.count()
        
        for notification in unread_notifications:
            notification.mark_as_read()
        
        return Response({'marked_as_read': count})
    
    @action(detail=False, methods=['get'])
    def unread_count(self, request):
        """Get count of unread notifications."""
        count = self.get_queryset().filter(read_at__isnull=True).count()
        return Response({'unread_count': count})


class NotificationPreferenceViewSet(viewsets.ModelViewSet):
    """ViewSet for managing notification preferences."""
    serializer_class = NotificationPreferenceSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        return NotificationPreference.objects.filter(user=self.request.user)
    
    def perform_create(self, serializer):
        serializer.save(user=self.request.user)
    
    @action(detail=False, methods=['post'])
    def bulk_update(self, request):
        """Bulk update notification preferences."""
        preferences_data = request.data.get('preferences', [])
        
        for pref_data in preferences_data:
            notification_type = pref_data.get('notification_type')
            if notification_type:
                preference, created = NotificationPreference.objects.get_or_create(
                    user=request.user,
                    notification_type=notification_type,
                    defaults=pref_data
                )
                if not created:
                    for key, value in pref_data.items():
                        setattr(preference, key, value)
                    preference.save()
        
        return Response({'status': 'preferences updated'})


class AIInsightViewSet(viewsets.ReadOnlyModelViewSet):
    """ViewSet for viewing AI insights."""
    serializer_class = AIInsightSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['insight_type', 'is_actionable', 'action_taken']
    ordering = ['-created_at']
    
    def get_queryset(self):
        return AIInsight.objects.filter(user=self.request.user)
    
    @action(detail=True, methods=['post'])
    def mark_action_taken(self, request, pk=None):
        """Mark an insight as acted upon."""
        insight = self.get_object()
        insight.action_taken = True
        insight.action_date = timezone.now()
        insight.save()
        return Response({'status': 'action marked'})
    
    @action(detail=True, methods=['post'])
    def provide_feedback(self, request, pk=None):
        """Provide feedback on insight relevance."""
        insight = self.get_object()
        insight.is_relevant = request.data.get('is_relevant')
        insight.feedback = request.data.get('feedback', '')
        insight.save()
        return Response({'status': 'feedback recorded'})
    
    @action(detail=False, methods=['post'])
    def generate_insights(self, request):
        """Trigger AI insights generation for current user."""
        from .tasks import generate_user_ai_insights
        
        # Queue the task
        task = generate_user_ai_insights.delay(request.user.id)
        
        return Response({
            'status': 'insights generation queued',
            'task_id': task.id
        })


class SavingsGoalViewSet(viewsets.ModelViewSet):
    """ViewSet for managing savings goals."""
    serializer_class = SavingsGoalSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['status']
    ordering = ['-created_at']
    
    def get_queryset(self):
        return SavingsGoal.objects.filter(user=self.request.user).prefetch_related('target_categories')
    
    def perform_create(self, serializer):
        serializer.save(user=self.request.user)
    
    @action(detail=True, methods=['post'])
    def add_savings(self, request, pk=None):
        """Add money to a savings goal."""
        goal = self.get_object()
        amount = request.data.get('amount', 0)
        
        if amount <= 0:
            return Response({'error': 'Amount must be positive'}, status=400)
        
        progress = goal.add_savings(amount)
        
        # Check if goal completed
        if goal.status == 'completed':
            # Create completion notification
            Notification.objects.create(
                user=goal.user,
                notification_type='goal_achievement',
                title=f"Goal Completed: {goal.title}",
                message=f"Congratulations! You've achieved your savings goal of ${goal.target_amount:.2f}!",
                data={'goal_id': goal.id, 'final_amount': float(goal.current_amount)}
            )
        
        return Response({
            'current_amount': goal.current_amount,
            'progress_percentage': progress,
            'status': goal.status
        })
    
    @action(detail=True, methods=['post'])
    def update_status(self, request, pk=None):
        """Update goal status (pause, resume, cancel)."""
        goal = self.get_object()
        new_status = request.data.get('status')
        
        if new_status in ['active', 'paused', 'cancelled']:
            goal.status = new_status
            goal.save()
            return Response({'status': f'goal {new_status}'})
        
        return Response({'error': 'Invalid status'}, status=400)


class ExpensePredictionView(APIView):
    """API view for expense predictions."""
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request):
        """Get expense predictions for the user."""
        from .ml_models import ExpensePredictionModel
        
        category_name = request.query_params.get('category', None)
        
        # Initialize and train model
        model = ExpensePredictionModel()
        success, result = model.train(request.user.id)
        
        if not success:
            return Response({'error': result}, status=400)
        
        # Make predictions
        predictions, error = model.predict_next_month_expenses(request.user.id, category_name)
        
        if error:
            return Response({'error': error}, status=400)
        
        serializer = ExpensePredictionSerializer(predictions)
        return Response(serializer.data)
    
    def post(self, request):
        """Train prediction model with latest data."""
        from .ml_models import ExpensePredictionModel
        
        model = ExpensePredictionModel()
        success, result = model.train(request.user.id)
        
        if success:
            return Response({
                'status': 'model trained successfully',
                'metrics': result
            })
        else:
            return Response({'error': result}, status=400)


class AnomalyDetectionView(APIView):
    """API view for anomaly detection."""
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request):
        """Get detected anomalies for the user."""
        from .ml_models import AnomalyDetectionModel
        
        days_back = int(request.query_params.get('days_back', 30))
        
        # Initialize and train model
        model = AnomalyDetectionModel()
        success, result = model.train(request.user.id)
        
        if not success:
            return Response({'error': result}, status=400)
        
        # Detect anomalies
        anomalies, error = model.detect_anomalies(request.user.id, days_back)
        
        if error:
            return Response({'error': error}, status=400)
        
        return Response({'anomalies': anomalies})
    
    def post(self, request):
        """Trigger anomaly detection task."""
        from .tasks import detect_anomalies_for_user
        
        task = detect_anomalies_for_user.delay(request.user.id)
        
        return Response({
            'status': 'anomaly detection queued',
            'task_id': task.id
        })


class BudgetInsightsView(APIView):
    """API view for budget insights and recommendations."""
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request):
        """Get budget insights and recommendations."""
        from datetime import datetime, timedelta
        from django.db.models import Sum, Avg
        from decimal import Decimal
        
        current_month = timezone.now().replace(day=1).date()
        
        # Get current month's spending by category
        current_spending = Transaction.objects.filter(
            user=request.user,
            transaction_type='expense',
            transaction_date__gte=current_month
        ).values('category__name').annotate(
            total=Sum('amount')
        ).order_by('-total')
        
        # Get historical averages (last 3 months)
        three_months_ago = current_month - timedelta(days=90)
        historical_avg = Transaction.objects.filter(
            user=request.user,
            transaction_type='expense',
            transaction_date__range=[three_months_ago, current_month]
        ).values('category__name').annotate(
            avg_amount=Avg('amount')
        )
        
        # Create historical lookup
        hist_lookup = {item['category__name']: item['avg_amount'] for item in historical_avg}
        
        insights = []
        recommendations = []
        
        for spending in current_spending:
            category = spending['category__name'] or 'Uncategorized'
            current_amount = spending['total']
            historical_amount = hist_lookup.get(category, Decimal('0.00'))
            
            if historical_amount and current_amount > historical_amount * Decimal('1.2'):
                insights.append({
                    'type': 'increased_spending',
                    'category': category,
                    'current_amount': float(current_amount),
                    'historical_average': float(historical_amount),
                    'increase_percentage': float((current_amount / historical_amount - 1) * 100),
                    'message': f"Your {category} spending is {float((current_amount / historical_amount - 1) * 100):.1f}% higher than usual"
                })
                
                # Suggest budget
                suggested_budget = historical_amount * Decimal('1.1')  # 10% buffer
                recommendations.append({
                    'type': 'budget_suggestion',
                    'category': category,
                    'suggested_amount': float(suggested_budget),
                    'message': f"Consider setting a ${suggested_budget:.2f} monthly budget for {category}"
                })
        
        return Response({
            'insights': insights,
            'recommendations': recommendations,
            'current_month_total': float(sum(s['total'] for s in current_spending)),
            'analysis_date': current_month.isoformat()
        })


class WeeklySummaryView(APIView):
    """API view for weekly spending summary."""
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request):
        """Get weekly summary for the user."""
        from datetime import datetime, timedelta
        from django.db.models import Sum
        
        # Calculate date range
        end_date = timezone.now().date()
        start_date = end_date - timedelta(days=7)
        
        # Get week's transactions
        transactions = Transaction.objects.filter(
            user=request.user,
            transaction_date__range=[start_date, end_date]
        )
        
        # Calculate summary
        total_income = transactions.filter(transaction_type='income').aggregate(
            total=Sum('amount')
        )['total'] or Decimal('0.00')
        
        total_expenses = transactions.filter(transaction_type='expense').aggregate(
            total=Sum('amount')
        )['total'] or Decimal('0.00')
        
        # Get category breakdown
        category_breakdown = {}
        for transaction in transactions.filter(transaction_type='expense'):
            category = transaction.category.name if transaction.category else 'Uncategorized'
            category_breakdown[category] = category_breakdown.get(category, Decimal('0.00')) + transaction.amount
        
        # Get previous week for comparison
        prev_start = start_date - timedelta(days=7)
        prev_end = start_date
        
        prev_transactions = Transaction.objects.filter(
            user=request.user,
            transaction_date__range=[prev_start, prev_end]
        )
        
        prev_expenses = prev_transactions.filter(transaction_type='expense').aggregate(
            total=Sum('amount')
        )['total'] or Decimal('0.00')
        
        data = {
            'start_date': start_date,
            'end_date': end_date,
            'total_income': total_income,
            'total_expenses': total_expenses,
            'net_cash_flow': total_income - total_expenses,
            'top_categories': dict(sorted(category_breakdown.items(), key=lambda x: x[1], reverse=True)[:5]),
            'transaction_count': transactions.count(),
            'comparison_previous_week': {
                'expense_change': float(total_expenses - prev_expenses),
                'expense_change_percentage': float((total_expenses / prev_expenses - 1) * 100) if prev_expenses > 0 else 0
            }
        }
        
        serializer = WeeklySummarySerializer(data)
        return Response(serializer.data)
    
    def post(self, request):
        """Generate and send weekly summary email."""
        from .tasks import send_weekly_summary
        
        task = send_weekly_summary.delay(request.user.id)
        
        return Response({
            'status': 'weekly summary generation queued',
            'task_id': task.id
        })
