from django.core.management.base import BaseCommand
from api.models import Category

class Command(BaseCommand):
    help = 'Create default transaction categories'

    def handle(self, *args, **options):
        default_categories = [
            # Expense Categories
            {'name': 'Food & Dining', 'category_type': 'expense', 'icon': 'fas fa-utensils', 'color': '#E53E3E'},
            {'name': 'Groceries', 'category_type': 'expense', 'icon': 'fas fa-shopping-cart', 'color': '#38A169'},
            {'name': 'Transportation', 'category_type': 'expense', 'icon': 'fas fa-car', 'color': '#3182CE'},
            {'name': 'Shopping', 'category_type': 'expense', 'icon': 'fas fa-shopping-bag', 'color': '#D69E2E'},
            {'name': 'Entertainment', 'category_type': 'expense', 'icon': 'fas fa-film', 'color': '#805AD5'},
            {'name': 'Bills & Utilities', 'category_type': 'expense', 'icon': 'fas fa-file-invoice', 'color': '#E53E3E'},
            {'name': 'Healthcare', 'category_type': 'expense', 'icon': 'fas fa-stethoscope', 'color': '#38A169'},
            {'name': 'Travel', 'category_type': 'expense', 'icon': 'fas fa-plane', 'color': '#3182CE'},
            {'name': 'Education', 'category_type': 'expense', 'icon': 'fas fa-graduation-cap', 'color': '#D69E2E'},
            {'name': 'Personal Care', 'category_type': 'expense', 'icon': 'fas fa-spa', 'color': '#805AD5'},
            {'name': 'Insurance', 'category_type': 'expense', 'icon': 'fas fa-shield-alt', 'color': '#E53E3E'},
            {'name': 'Housing', 'category_type': 'expense', 'icon': 'fas fa-home', 'color': '#38A169'},
            {'name': 'Subscriptions', 'category_type': 'expense', 'icon': 'fas fa-sync', 'color': '#3182CE'},
            {'name': 'Gifts & Donations', 'category_type': 'expense', 'icon': 'fas fa-gift', 'color': '#D69E2E'},
            {'name': 'Other Expenses', 'category_type': 'expense', 'icon': 'fas fa-ellipsis-h', 'color': '#805AD5'},
            
            # Income Categories
            {'name': 'Salary', 'category_type': 'income', 'icon': 'fas fa-briefcase', 'color': '#38A169'},
            {'name': 'Freelancing', 'category_type': 'income', 'icon': 'fas fa-laptop', 'color': '#3182CE'},
            {'name': 'Investment Returns', 'category_type': 'income', 'icon': 'fas fa-chart-line', 'color': '#D69E2E'},
            {'name': 'Business Income', 'category_type': 'income', 'icon': 'fas fa-store', 'color': '#805AD5'},
            {'name': 'Rental Income', 'category_type': 'income', 'icon': 'fas fa-building', 'color': '#E53E3E'},
            {'name': 'Bonus', 'category_type': 'income', 'icon': 'fas fa-award', 'color': '#38A169'},
            {'name': 'Refunds', 'category_type': 'income', 'icon': 'fas fa-undo', 'color': '#3182CE'},
            {'name': 'Other Income', 'category_type': 'income', 'icon': 'fas fa-plus-circle', 'color': '#D69E2E'},
            
            # Transfer Categories
            {'name': 'Account Transfer', 'category_type': 'transfer', 'icon': 'fas fa-exchange-alt', 'color': '#718096'},
            {'name': 'Credit Card Payment', 'category_type': 'transfer', 'icon': 'fas fa-credit-card', 'color': '#718096'},
        ]

        created_count = 0
        for category_data in default_categories:
            category, created = Category.objects.get_or_create(
                name=category_data['name'],
                category_type=category_data['category_type'],
                defaults={
                    'description': f"Default {category_data['category_type']} category",
                    'icon': category_data['icon'],
                    'color': category_data['color'],
                    'is_default': True
                }
            )
            if created:
                created_count += 1
                self.stdout.write(f"Created category: {category.name}")

        self.stdout.write(
            self.style.SUCCESS(f'Successfully created {created_count} default categories')
        )
