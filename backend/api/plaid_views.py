"""
Plaid Integration Views
Handles bank account connection and transaction syncing
"""
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.utils import timezone
from datetime import datetime, timedelta
import json
import logging

from .plaid_service import plaid_service
from .models import Account, PlaidItem, Transaction, Category
from .serializers import AccountSerializer, TransactionSerializer

logger = logging.getLogger(__name__)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_link_token(request):
    """Create a link token for Plaid Link initialization"""
    try:
        result = plaid_service.create_link_token(request.user.id)
        return Response(result, status=status.HTTP_200_OK)
    except Exception as e:
        logger.error(f"Error creating link token for user {request.user.id}: {e}")
        return Response(
            {'error': 'Failed to create link token'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def exchange_public_token(request):
    """Exchange public token for access token and create accounts"""
    public_token = request.data.get('public_token')
    if not public_token:
        return Response(
            {'error': 'Public token is required'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    try:
        # Exchange public token for access token
        exchange_result = plaid_service.exchange_public_token(public_token)
        access_token = exchange_result['access_token']
        item_id = exchange_result['item_id']
        
        # Get institution and account information
        accounts = plaid_service.get_accounts(access_token)
        item_status = plaid_service.get_item_status(access_token)
        
        # Create PlaidItem record
        plaid_item, created = PlaidItem.objects.get_or_create(
            plaid_item_id=item_id,
            defaults={
                'user': request.user,
                'access_token': access_token,
                'institution_id': item_status['institution_id'],
                'institution_name': 'Bank',  # We'll get the real name later
                'available_products': item_status['available_products'],
                'billed_products': item_status['billed_products'],
            }
        )
        
        if not created:
            # Update existing item
            plaid_item.access_token = access_token
            plaid_item.available_products = item_status['available_products']
            plaid_item.billed_products = item_status['billed_products']
            plaid_item.save()
        
        # Create or update Account records
        created_accounts = []
        for account_data in accounts:
            account, account_created = Account.objects.get_or_create(
                user=request.user,
                plaid_account_id=account_data['account_id'],
                defaults={
                    'name': account_data['name'],
                    'account_type': _map_plaid_account_type(account_data['type']),
                    'balance': account_data['balance']['current'] or 0,
                    'currency': account_data['balance']['iso_currency_code'] or 'USD',
                    'plaid_access_token': access_token,
                    'plaid_item_id': item_id,
                    'institution_name': plaid_item.institution_name,
                    'account_mask': account_data.get('mask', ''),
                }
            )
            
            if not account_created:
                # Update existing account
                account.balance = account_data['balance']['current'] or 0
                account.plaid_access_token = access_token
                account.plaid_item_id = item_id
                account.save()
            
            created_accounts.append(account)
        
        # Serialize the accounts to return
        serializer = AccountSerializer(created_accounts, many=True)
        
        return Response({
            'message': 'Accounts connected successfully',
            'accounts': serializer.data,
            'institution': plaid_item.institution_name
        }, status=status.HTTP_201_CREATED)
        
    except Exception as e:
        logger.error(f"Error exchanging public token for user {request.user.id}: {e}")
        return Response(
            {'error': 'Failed to connect accounts'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def sync_transactions(request):
    """Sync transactions for user's connected accounts"""
    account_id = request.data.get('account_id')
    days = request.data.get('days', 30)  # Default to last 30 days
    
    try:
        # Get user's accounts
        accounts = Account.objects.filter(
            user=request.user,
            plaid_access_token__isnull=False,
            is_active=True
        )
        
        if account_id:
            accounts = accounts.filter(id=account_id)
        
        if not accounts.exists():
            return Response(
                {'error': 'No connected accounts found'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        synced_transactions = []
        sync_summary = {
            'accounts_synced': 0,
            'transactions_added': 0,
            'transactions_updated': 0,
            'errors': []
        }
        
        for account in accounts:
            try:
                # Sync transactions for this account
                if account.sync_cursor:
                    # Use cursor-based sync for incremental updates
                    sync_result = plaid_service.sync_transactions(
                        account.plaid_access_token,
                        account.sync_cursor
                    )
                    
                    # Process added transactions
                    for transaction_data in sync_result['added']:
                        if transaction_data['account_id'] == account.plaid_account_id:
                            transaction = _create_or_update_transaction(
                                transaction_data, account, request.user
                            )
                            if transaction:
                                synced_transactions.append(transaction)
                                sync_summary['transactions_added'] += 1
                    
                    # Process modified transactions
                    for transaction_data in sync_result['modified']:
                        if transaction_data['account_id'] == account.plaid_account_id:
                            transaction = _create_or_update_transaction(
                                transaction_data, account, request.user
                            )
                            if transaction:
                                sync_summary['transactions_updated'] += 1
                    
                    # Process removed transactions
                    for removed_id in sync_result['removed']:
                        Transaction.objects.filter(
                            plaid_transaction_id=removed_id
                        ).delete()
                    
                    # Update cursor
                    account.sync_cursor = sync_result['next_cursor']
                
                else:
                    # Initial sync - get transactions for the specified period
                    start_date = datetime.now() - timedelta(days=days)
                    end_date = datetime.now()
                    
                    transactions = plaid_service.get_transactions(
                        account.plaid_access_token,
                        start_date,
                        end_date,
                        [account.plaid_account_id]
                    )
                    
                    for transaction_data in transactions:
                        transaction = _create_or_update_transaction(
                            transaction_data, account, request.user
                        )
                        if transaction:
                            synced_transactions.append(transaction)
                            sync_summary['transactions_added'] += 1
                
                # Update last sync time
                account.last_sync = timezone.now()
                account.save()
                sync_summary['accounts_synced'] += 1
                
            except Exception as e:
                error_msg = f"Error syncing account {account.name}: {str(e)}"
                logger.error(error_msg)
                sync_summary['errors'].append(error_msg)
        
        # Serialize synced transactions
        serializer = TransactionSerializer(synced_transactions, many=True)
        
        return Response({
            'message': 'Transaction sync completed',
            'summary': sync_summary,
            'transactions': serializer.data
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        logger.error(f"Error syncing transactions for user {request.user.id}: {e}")
        return Response(
            {'error': 'Failed to sync transactions'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def disconnect_account(request, account_id):
    """Disconnect a Plaid account"""
    try:
        account = Account.objects.get(
            id=account_id,
            user=request.user,
            plaid_access_token__isnull=False
        )
        
        # Remove the item from Plaid
        try:
            plaid_service.remove_item(account.plaid_access_token)
        except Exception as e:
            logger.warning(f"Error removing Plaid item: {e}")
        
        # Remove Plaid data from account
        account.plaid_access_token = None
        account.plaid_account_id = None
        account.plaid_item_id = None
        account.sync_cursor = None
        account.save()
        
        # Remove PlaidItem if no other accounts use it
        if account.plaid_item_id:
            remaining_accounts = Account.objects.filter(
                user=request.user,
                plaid_item_id=account.plaid_item_id,
                plaid_access_token__isnull=False
            ).exclude(id=account_id)
            
            if not remaining_accounts.exists():
                PlaidItem.objects.filter(
                    plaid_item_id=account.plaid_item_id
                ).delete()
        
        return Response({
            'message': 'Account disconnected successfully'
        }, status=status.HTTP_200_OK)
        
    except Account.DoesNotExist:
        return Response(
            {'error': 'Account not found'},
            status=status.HTTP_404_NOT_FOUND
        )
    except Exception as e:
        logger.error(f"Error disconnecting account {account_id}: {e}")
        return Response(
            {'error': 'Failed to disconnect account'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

def _map_plaid_account_type(plaid_type):
    """Map Plaid account type to our account type"""
    mapping = {
        'depository': 'checking',
        'credit': 'credit_card',
        'loan': 'loan',
        'investment': 'investment',
    }
    return mapping.get(plaid_type, 'checking')

def _create_or_update_transaction(transaction_data, account, user):
    """Create or update a transaction from Plaid data"""
    try:
        # Try to find existing transaction
        transaction, created = Transaction.objects.get_or_create(
            plaid_transaction_id=transaction_data['transaction_id'],
            defaults={
                'user': user,
                'account': account,
                'amount': abs(transaction_data['amount']),  # Plaid amounts are negative for expenses
                'transaction_type': transaction_data['transaction_type'],
                'description': transaction_data['name'],
                'merchant_name': transaction_data.get('merchant_name', ''),
                'transaction_date': datetime.fromisoformat(transaction_data['date']).date(),
                'location': _format_location(transaction_data.get('location', {})),
            }
        )
        
        if not created:
            # Update existing transaction
            transaction.amount = abs(transaction_data['amount'])
            transaction.transaction_type = transaction_data['transaction_type']
            transaction.description = transaction_data['name']
            transaction.merchant_name = transaction_data.get('merchant_name', '')
            transaction.location = _format_location(transaction_data.get('location', {}))
            transaction.save()
        
        # Auto-categorize if no category is set
        if not transaction.category and transaction_data.get('category'):
            category = _get_or_create_category(transaction_data['category'])
            if category:
                transaction.category = category
                transaction.save()
        
        return transaction
        
    except Exception as e:
        logger.error(f"Error creating/updating transaction: {e}")
        return None

def _format_location(location_data):
    """Format location data into a string"""
    if not location_data:
        return ''
    
    parts = []
    if location_data.get('city'):
        parts.append(location_data['city'])
    if location_data.get('region'):
        parts.append(location_data['region'])
    if location_data.get('country'):
        parts.append(location_data['country'])
    
    return ', '.join(parts)

def _get_or_create_category(plaid_categories):
    """Get or create category from Plaid category list"""
    if not plaid_categories:
        return None
    
    # Use the most specific category (last in the list)
    category_name = plaid_categories[-1] if isinstance(plaid_categories, list) else plaid_categories
    
    try:
        category, created = Category.objects.get_or_create(
            name=category_name,
            defaults={
                'category_type': 'expense',
                'description': f'Auto-created from Plaid: {category_name}',
                'is_default': False,
            }
        )
        return category
    except Exception as e:
        logger.error(f"Error creating category {category_name}: {e}")
        return None
