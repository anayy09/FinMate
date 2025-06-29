#!/usr/bin/env python3
"""
Database setup and migration script for FinMate
This script helps set up PostgreSQL and run Django migrations
"""

import os
import sys
import subprocess
import psycopg2
from psycopg2 import OperationalError
import django
from django.core.management import execute_from_command_line
from django.conf import settings

def test_postgresql_connection():
    """Test PostgreSQL connection with the configured settings"""
    try:
        # Database connection parameters
        connection_params = {
            'host': 'localhost',
            'database': 'finmate_db',
            'user': 'postgres',
            'password': 'postgres',
            'port': '5432'
        }
        
        print("🔄 Testing PostgreSQL connection...")
        connection = psycopg2.connect(**connection_params)
        cursor = connection.cursor()
        cursor.execute("SELECT version();")
        version = cursor.fetchone()
        print(f"✅ PostgreSQL connection successful!")
        print(f"   Version: {version[0]}")
        cursor.close()
        connection.close()
        return True
    except OperationalError as e:
        print(f"❌ PostgreSQL connection failed: {e}")
        return False

def run_django_migrations():
    """Run Django migrations"""
    try:
        print("\n🔄 Running Django migrations...")
        
        # Make migrations
        print("   Creating migrations...")
        result = subprocess.run([sys.executable, 'manage.py', 'makemigrations'], 
                              capture_output=True, text=True, cwd=os.getcwd())
        if result.returncode != 0 and "No changes detected" not in result.stdout:
            print(f"   Warning: makemigrations output: {result.stdout}")
            if result.stderr:
                print(f"   Error: {result.stderr}")
        else:
            print("   ✅ Migrations created successfully")
        
        # Apply migrations
        print("   Applying migrations...")
        result = subprocess.run([sys.executable, 'manage.py', 'migrate'], 
                              capture_output=True, text=True, cwd=os.getcwd())
        if result.returncode != 0:
            print(f"   ❌ Error: migrate failed: {result.stderr}")
            return False
        else:
            print("   ✅ Migrations applied successfully")
        
        print("✅ Django migrations completed successfully!")
        return True
    except Exception as e:
        print(f"❌ Django migrations failed: {e}")
        return False

def test_django_models():
    """Test Django models and database connectivity"""
    try:
        print("\n🔄 Testing Django models...")
        
        # Test model import and database connectivity
        test_script = '''
import os
import django
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "finmate_backend.settings")
django.setup()

from api.models import User, UserSession
from django.db import connection

# Test database connection
with connection.cursor() as cursor:
    cursor.execute("SELECT 1")
    result = cursor.fetchone()
    print(f"✅ Database query test: {result[0] == 1}")

# Test model access
user_count = User.objects.count()
session_count = UserSession.objects.count()
print(f"✅ User model accessible - Count: {user_count}")
print(f"✅ UserSession model accessible - Count: {session_count}")
'''
        
        result = subprocess.run([sys.executable, '-c', test_script], 
                              capture_output=True, text=True, cwd=os.getcwd())
        if result.returncode == 0:
            print("✅ Django models test successful!")
            print(result.stdout.strip())
            return True
        else:
            print(f"❌ Django models test failed: {result.stderr}")
            return False
    except Exception as e:
        print(f"❌ Django models test failed: {e}")
        return False

def main():
    print("=" * 50)
    print("FinMate Database Setup & Migration Tool")
    print("=" * 50)
    
    # Change to backend directory
    backend_dir = os.path.join(os.path.dirname(__file__), 'backend')
    if os.path.exists(backend_dir):
        os.chdir(backend_dir)
        print(f"📁 Changed to backend directory: {os.getcwd()}")
    else:
        print("❌ Backend directory not found!")
        sys.exit(1)
    
    # Test PostgreSQL connection
    if not test_postgresql_connection():
        print("\n📋 Database Setup Instructions:")
        print("1. Install PostgreSQL from: https://www.postgresql.org/download/")
        print("2. Create database and user using these commands:")
        print("   psql -U postgres")
        print("   CREATE DATABASE finmate_db;")
        print("   CREATE USER finmate_user WITH PASSWORD 'finmate_password';")
        print("   GRANT ALL PRIVILEGES ON DATABASE finmate_db TO finmate_user;")
        print("   ALTER USER finmate_user CREATEDB;")
        print("   \\q")
        print("\n3. Run this script again after setup")
        sys.exit(1)
    
    # Run Django migrations
    if not run_django_migrations():
        sys.exit(1)
    
    # Test Django models
    if not test_django_models():
        print("⚠️  Warning: Django models test failed, but migrations completed")
    
    print("\n🎉 Database setup completed successfully!")
    print("\nNext steps:")
    print("1. Create a superuser: python manage.py createsuperuser")
    print("2. Start the development server: python manage.py runserver")
    print("3. Access admin panel: http://127.0.0.1:8000/admin/")
    print("4. Test API endpoints: http://127.0.0.1:8000/api/auth/signup/")

if __name__ == "__main__":
    main()
