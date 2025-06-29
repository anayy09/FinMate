# Generated migration for Sprint 4 features - only new fields

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0006_aiinsight_notification_savingsgoal_budgetalert_and_more'),
    ]

    operations = [
        # Only add fields that don't exist yet
        migrations.AddField(
            model_name='account',
            name='auto_sync_enabled',
            field=models.BooleanField(default=True, help_text='Enable automatic transaction sync for Plaid accounts'),
        ),
        migrations.AddField(
            model_name='account',
            name='sync_frequency',
            field=models.CharField(
                max_length=20,
                choices=[
                    ('daily', 'Daily'),
                    ('weekly', 'Weekly'), 
                    ('manual', 'Manual Only')
                ],
                default='daily',
                help_text='How often to sync transactions'
            ),
        ),
        migrations.AddField(
            model_name='account',
            name='plaid_institution_name',
            field=models.CharField(max_length=255, blank=True, help_text='Name of the bank/institution from Plaid'),
        ),
        migrations.AddField(
            model_name='transaction',
            name='is_plaid_transaction',
            field=models.BooleanField(default=False, help_text='Whether this transaction was imported from Plaid'),
        ),
        migrations.AddField(
            model_name='user',
            name='report_email_frequency',
            field=models.CharField(
                max_length=20,
                choices=[
                    ('never', 'Never'),
                    ('weekly', 'Weekly'),
                    ('monthly', 'Monthly'),
                    ('quarterly', 'Quarterly')
                ],
                default='monthly',
                help_text='How often to receive email reports'
            ),
        ),
        migrations.AddField(
            model_name='user',
            name='auto_sync_enabled',
            field=models.BooleanField(default=True, help_text='Enable automatic Plaid sync for all accounts'),
        ),
    ]
