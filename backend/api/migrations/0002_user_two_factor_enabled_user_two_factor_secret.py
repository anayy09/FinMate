# Generated by Django 5.2.3 on 2025-06-29 07:33

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0001_initial'),
    ]

    operations = [
        migrations.AddField(
            model_name='user',
            name='two_factor_enabled',
            field=models.BooleanField(default=False),
        ),
        migrations.AddField(
            model_name='user',
            name='two_factor_secret',
            field=models.CharField(blank=True, max_length=32, null=True),
        ),
    ]
