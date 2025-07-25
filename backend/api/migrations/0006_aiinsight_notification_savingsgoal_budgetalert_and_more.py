# Generated by Django 5.2.3 on 2025-06-29 14:26

import django.db.models.deletion
from decimal import Decimal
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0005_account_account_mask_account_institution_name_and_more'),
    ]

    operations = [
        migrations.CreateModel(
            name='AIInsight',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('insight_type', models.CharField(choices=[('spending_pattern', 'Spending Pattern'), ('budget_suggestion', 'Budget Suggestion'), ('savings_opportunity', 'Savings Opportunity'), ('prediction', 'Expense Prediction'), ('anomaly', 'Anomaly Detection'), ('goal_recommendation', 'Goal Recommendation')], max_length=20)),
                ('title', models.CharField(max_length=255)),
                ('description', models.TextField()),
                ('data', models.JSONField(default=dict, help_text='Structured insight data')),
                ('confidence_score', models.DecimalField(blank=True, decimal_places=2, help_text='AI confidence score (0-100)', max_digits=5, null=True)),
                ('is_actionable', models.BooleanField(default=True)),
                ('action_taken', models.BooleanField(default=False)),
                ('action_date', models.DateTimeField(blank=True, null=True)),
                ('is_relevant', models.BooleanField(blank=True, help_text='User feedback on relevance', null=True)),
                ('feedback', models.TextField(blank=True, help_text='User feedback on the insight')),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('user', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='ai_insights', to=settings.AUTH_USER_MODEL)),
            ],
            options={
                'ordering': ['-created_at'],
            },
        ),
        migrations.CreateModel(
            name='Notification',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('notification_type', models.CharField(choices=[('budget_warning', 'Budget Warning'), ('budget_exceeded', 'Budget Exceeded'), ('weekly_summary', 'Weekly Summary'), ('monthly_report', 'Monthly Report'), ('ai_insight', 'AI Insight'), ('anomaly_alert', 'Anomaly Alert'), ('goal_achievement', 'Goal Achievement'), ('saving_suggestion', 'Saving Suggestion')], max_length=20)),
                ('title', models.CharField(max_length=255)),
                ('message', models.TextField()),
                ('status', models.CharField(choices=[('pending', 'Pending'), ('sent', 'Sent'), ('failed', 'Failed'), ('read', 'Read')], default='pending', max_length=10)),
                ('sent_at', models.DateTimeField(blank=True, null=True)),
                ('read_at', models.DateTimeField(blank=True, null=True)),
                ('data', models.JSONField(default=dict, help_text='Additional notification data')),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('budget', models.ForeignKey(blank=True, help_text='Related budget if this is a budget alert', null=True, on_delete=django.db.models.deletion.CASCADE, to='api.budget')),
                ('transaction', models.ForeignKey(blank=True, help_text='Related transaction if this is an anomaly alert', null=True, on_delete=django.db.models.deletion.CASCADE, to='api.transaction')),
                ('user', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='notifications', to=settings.AUTH_USER_MODEL)),
            ],
            options={
                'ordering': ['-created_at'],
            },
        ),
        migrations.CreateModel(
            name='SavingsGoal',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('title', models.CharField(max_length=255)),
                ('description', models.TextField(blank=True)),
                ('target_amount', models.DecimalField(decimal_places=2, max_digits=12)),
                ('current_amount', models.DecimalField(decimal_places=2, default=Decimal('0.00'), max_digits=12)),
                ('target_date', models.DateField()),
                ('status', models.CharField(choices=[('active', 'Active'), ('completed', 'Completed'), ('paused', 'Paused'), ('cancelled', 'Cancelled')], default='active', max_length=10)),
                ('progress_percentage', models.DecimalField(decimal_places=2, default=Decimal('0.00'), max_digits=5)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('target_categories', models.ManyToManyField(blank=True, help_text='Categories where savings will come from', to='api.category')),
                ('user', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='savings_goals', to=settings.AUTH_USER_MODEL)),
            ],
            options={
                'ordering': ['-created_at'],
            },
        ),
        migrations.CreateModel(
            name='BudgetAlert',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('alert_type', models.CharField(choices=[('warning', 'Warning (80% spent)'), ('critical', 'Critical (100% spent)'), ('exceeded', 'Exceeded (>100% spent)')], max_length=10)),
                ('month', models.DateField()),
                ('is_sent', models.BooleanField(default=False)),
                ('sent_at', models.DateTimeField(blank=True, null=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('budget', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='alerts', to='api.budget')),
                ('user', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='budget_alerts', to=settings.AUTH_USER_MODEL)),
            ],
            options={
                'unique_together': {('budget', 'alert_type', 'month')},
            },
        ),
        migrations.CreateModel(
            name='NotificationPreference',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('notification_type', models.CharField(choices=[('budget_alert', 'Budget Alert'), ('overspending', 'Overspending Warning'), ('weekly_summary', 'Weekly Summary'), ('monthly_report', 'Monthly Report'), ('ai_insights', 'AI Insights'), ('anomaly_detection', 'Unusual Spending Alert'), ('goal_achievement', 'Goal Achievement')], max_length=20)),
                ('is_enabled', models.BooleanField(default=True)),
                ('delivery_method', models.CharField(choices=[('email', 'Email'), ('in_app', 'In-App Notification'), ('both', 'Email and In-App')], default='both', max_length=10)),
                ('budget_alert_threshold', models.DecimalField(decimal_places=2, default=Decimal('80.00'), help_text='Percentage of budget used before alert (default 80%)', max_digits=5)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('user', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='notification_preferences', to=settings.AUTH_USER_MODEL)),
            ],
            options={
                'unique_together': {('user', 'notification_type')},
            },
        ),
    ]
