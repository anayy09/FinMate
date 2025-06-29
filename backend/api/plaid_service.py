"""
Plaid API Integration Service - Simplified Version
Handles bank account connection and transaction syncing
"""
import os
import json
import logging
from datetime import datetime, timedelta
from typing import Dict, List, Optional
from django.conf import settings

logger = logging.getLogger(__name__)

class PlaidService:
    def __init__(self):
        """Initialize Plaid client"""
        self.client_id = getattr(settings, 'PLAID_CLIENT_ID', os.getenv('PLAID_CLIENT_ID'))
        self.secret = getattr(settings, 'PLAID_SECRET', os.getenv('PLAID_SECRET'))
        self.env = getattr(settings, 'PLAID_ENV', os.getenv('PLAID_ENV', 'sandbox'))
        
        # For now, we'll create a placeholder service
        # In production, you would initialize the actual Plaid client here
        self.client = None
        
        # Environment URLs
        self.host_mapping = {
            'sandbox': 'https://sandbox.api.plaid.com',
            'development': 'https://development.api.plaid.com',
            'production': 'https://production.api.plaid.com'
        }
        self.base_url = self.host_mapping.get(self.env, self.host_mapping['sandbox'])
    
    def create_link_token(self, user_id: str) -> Dict:
        """Create a link token for Plaid Link initialization"""
        try:
            # This is a mock implementation
            # In production, you would call the actual Plaid API
            return {
                'link_token': f'link-sandbox-mock-token-{user_id}',
                'expiration': (datetime.now() + timedelta(hours=4)).isoformat()
            }
        except Exception as e:
            logger.error(f"Error creating link token: {e}")
            raise
    
    def exchange_public_token(self, public_token: str) -> Dict:
        """Exchange public token for access token"""
        try:
            # Mock implementation
            return {
                'access_token': f'access-sandbox-mock-token-{public_token[:10]}',
                'item_id': f'item-mock-{public_token[:8]}'
            }
        except Exception as e:
            logger.error(f"Error exchanging public token: {e}")
            raise
    
    def get_accounts(self, access_token: str) -> List[Dict]:
        """Get bank accounts for the access token"""
        try:
            # Mock implementation
            return [
                {
                    'account_id': 'mock_checking_account_1',
                    'name': 'Mock Checking Account',
                    'official_name': 'Mock Bank Checking Account',
                    'type': 'depository',
                    'subtype': 'checking',
                    'balance': {
                        'available': 2500.00,
                        'current': 2543.21,
                        'iso_currency_code': 'USD',
                    },
                    'mask': '0000'
                }
            ]
        except Exception as e:
            logger.error(f"Error getting accounts: {e}")
            raise
    
    def get_transactions(self, access_token: str, start_date: datetime = None, end_date: datetime = None, account_ids: List[str] = None) -> List[Dict]:
        """Get transactions for the access token"""
        try:
            if not start_date:
                start_date = datetime.now() - timedelta(days=30)
            if not end_date:
                end_date = datetime.now()
            
            # Mock implementation
            mock_transactions = [
                {
                    'transaction_id': 'mock_transaction_1',
                    'account_id': 'mock_checking_account_1',
                    'amount': 12.50,
                    'iso_currency_code': 'USD',
                    'date': (datetime.now() - timedelta(days=1)).date().isoformat(),
                    'name': 'Starbucks Coffee',
                    'merchant_name': 'Starbucks',
                    'category': ['Food and Drink', 'Restaurants', 'Coffee Shop'],
                    'category_id': 'food_and_drink',
                    'location': {
                        'address': '123 Main St',
                        'city': 'New York',
                        'region': 'NY',
                        'postal_code': '10001',
                        'country': 'US',
                    },
                    'payment_meta': {},
                    'pending': False,
                    'transaction_type': 'expense'
                },
                {
                    'transaction_id': 'mock_transaction_2',
                    'account_id': 'mock_checking_account_1',
                    'amount': 1200.00,
                    'iso_currency_code': 'USD',
                    'date': (datetime.now() - timedelta(days=3)).date().isoformat(),
                    'name': 'Direct Deposit',
                    'merchant_name': 'Employer Inc',
                    'category': ['Deposit'],
                    'category_id': 'deposit',
                    'location': {},
                    'payment_meta': {},
                    'pending': False,
                    'transaction_type': 'income'
                }
            ]
            
            return mock_transactions
        except Exception as e:
            logger.error(f"Error getting transactions: {e}")
            raise
    
    def sync_transactions(self, access_token: str, cursor: str = None) -> Dict:
        """Sync transactions using the new sync endpoint"""
        try:
            # Mock implementation
            return {
                'added': self.get_transactions(access_token),
                'modified': [],
                'removed': [],
                'next_cursor': f'cursor-{datetime.now().timestamp()}',
                'has_more': False
            }
        except Exception as e:
            logger.error(f"Error syncing transactions: {e}")
            raise
    
    def get_item_status(self, access_token: str) -> Dict:
        """Get item status and error information"""
        try:
            # Mock implementation
            return {
                'item_id': 'item-mock-12345',
                'institution_id': 'ins_mock_1',
                'available_products': ['transactions'],
                'billed_products': ['transactions'],
                'error': None,
                'update_type': 'background',
                'status': 'GOOD'
            }
        except Exception as e:
            logger.error(f"Error getting item status: {e}")
            raise
    
    def remove_item(self, access_token: str) -> bool:
        """Remove/unlink an item"""
        try:
            # Mock implementation
            return True
        except Exception as e:
            logger.error(f"Error removing item: {e}")
            raise

# Singleton instance
plaid_service = PlaidService()
