from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from api.models import Category, Account, Transaction
from decimal import Decimal
from datetime import datetime, timedelta
import random

User = get_user_model()

class Command(BaseCommand):
    help = 'Create sample transactions for testing'

    def add_arguments(self, parser):
        parser.add_argument(
            '--email',
            type=str,
            help='Email of the user to create transactions for',
            required=True,
        )

    def handle(self, *args, **options):
        email = options['email']
        
        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            self.stdout.write(
                self.style.ERROR(f'User with email {email} does not exist')
            )
            return

        # Get user's accounts
        accounts = Account.objects.filter(user=user)
        if not accounts.exists():
            self.stdout.write(
                self.style.ERROR(f'No accounts found for user {email}')
            )
            return

        # Get categories
        expense_categories = Category.objects.filter(category_type='expense')
        income_categories = Category.objects.filter(category_type='income')

        if not expense_categories.exists() or not income_categories.exists():
            self.stdout.write(
                self.style.ERROR('No categories found. Run create_default_categories first.')
            )
            return

        account = accounts.first()
        created_count = 0

        # Sample expense transactions
        expense_samples = [
            {'description': 'Starbucks Coffee', 'amount': 12.50, 'category': 'Food & Dining'},
            {'description': 'Uber Ride', 'amount': 25.00, 'category': 'Transportation'},
            {'description': 'Amazon Purchase', 'amount': 89.99, 'category': 'Shopping'},
            {'description': 'Netflix Subscription', 'amount': 15.99, 'category': 'Subscriptions'},
            {'description': 'Grocery Store', 'amount': 156.78, 'category': 'Groceries'},
            {'description': 'Gas Station', 'amount': 45.00, 'category': 'Transportation'},
            {'description': 'Restaurant Dinner', 'amount': 78.50, 'category': 'Food & Dining'},
            {'description': 'Movie Theater', 'amount': 24.00, 'category': 'Entertainment'},
            {'description': 'Electricity Bill', 'amount': 120.00, 'category': 'Bills & Utilities'},
            {'description': 'Pharmacy', 'amount': 35.67, 'category': 'Healthcare'},
            {'description': 'Gym Membership', 'amount': 29.99, 'category': 'Personal Care'},
            {'description': 'Book Store', 'amount': 19.99, 'category': 'Education'},
            {'description': 'Target Shopping', 'amount': 67.89, 'category': 'Shopping'},
            {'description': 'Spotify Premium', 'amount': 9.99, 'category': 'Subscriptions'},
            {'description': 'Fast Food', 'amount': 8.99, 'category': 'Food & Dining'},
        ]

        # Sample income transactions
        income_samples = [
            {'description': 'Monthly Salary', 'amount': 3500.00, 'category': 'Salary'},
            {'description': 'Freelance Project', 'amount': 800.00, 'category': 'Freelancing'},
            {'description': 'Investment Dividend', 'amount': 125.50, 'category': 'Investment Returns'},
            {'description': 'Performance Bonus', 'amount': 500.00, 'category': 'Bonus'},
        ]

        # Create expense transactions for the last 30 days
        for i in range(30):
            transaction_date = datetime.now().date() - timedelta(days=i)
            
            # Random number of transactions per day (0-3)
            num_transactions = random.randint(0, 3)
            
            for _ in range(num_transactions):
                sample = random.choice(expense_samples)
                
                try:
                    category = expense_categories.get(name=sample['category'])
                except Category.DoesNotExist:
                    category = expense_categories.first()
                
                # Add some variation to amounts
                amount = Decimal(str(sample['amount'] * random.uniform(0.8, 1.2)))
                
                transaction = Transaction.objects.create(
                    user=user,
                    account=account,
                    category=category,
                    amount=amount,
                    transaction_type='expense',
                    description=sample['description'],
                    transaction_date=transaction_date,
                )
                created_count += 1

        # Create some income transactions
        for i in range(0, 30, 7):  # Weekly income
            transaction_date = datetime.now().date() - timedelta(days=i)
            sample = random.choice(income_samples)
            
            try:
                category = income_categories.get(name=sample['category'])
            except Category.DoesNotExist:
                category = income_categories.first()
            
            transaction = Transaction.objects.create(
                user=user,
                account=account,
                category=category,
                amount=Decimal(str(sample['amount'])),
                transaction_type='income',
                description=sample['description'],
                transaction_date=transaction_date,
            )
            created_count += 1

        self.stdout.write(
            self.style.SUCCESS(f'Successfully created {created_count} sample transactions for {email}')
        )
