from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from api.models import Account
from decimal import Decimal

User = get_user_model()

class Command(BaseCommand):
    help = 'Create default accounts for users who do not have any accounts'

    def handle(self, *args, **options):
        users_without_accounts = User.objects.filter(accounts__isnull=True).distinct()
        
        created_count = 0
        for user in users_without_accounts:
            account = Account.objects.create(
                user=user,
                name="Default Account",
                account_type="checking",
                balance=Decimal('0.00'),
                currency="USD"
            )
            created_count += 1
            self.stdout.write(f"Created default account for user: {user.email}")
        
        self.stdout.write(
            self.style.SUCCESS(f'Successfully created {created_count} default accounts')
        )
