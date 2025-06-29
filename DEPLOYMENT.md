# FinMate Deployment Guide

## Backend Deployment (Render)

### 1. Prepare Django for Production

Create a `.env` file with:
```
SECRET_KEY=your-secret-key-here
DEBUG=False
DATABASE_URL=your-postgres-database-url
```

### 2. Add to requirements.txt
```
gunicorn==21.2.0
whitenoise==6.5.0
dj-database-url==2.1.0
```

### 3. Update settings.py for production
```python
import dj_database_url

ALLOWED_HOSTS = ['your-app-name.onrender.com', 'localhost', '127.0.0.1']

DATABASES = {
    'default': dj_database_url.parse(os.environ.get('DATABASE_URL', 'sqlite:///db.sqlite3'))
}

MIDDLEWARE = [
    'whitenoise.middleware.WhiteNoiseMiddleware',  # Add this
    # ... other middleware
]

STATIC_ROOT = os.path.join(BASE_DIR, 'staticfiles')
STATICFILES_STORAGE = 'whitenoise.storage.CompressedManifestStaticFilesStorage'
```

### 4. Create build script
```bash
#!/usr/bin/env bash
python manage.py collectstatic --no-input
python manage.py migrate
```

## Frontend Deployment (Vercel)

### 1. Add build settings to package.json
```json
{
  "scripts": {
    "build": "vite build",
    "preview": "vite preview"
  }
}
```

### 2. Update API URLs for production
Replace localhost URLs with your Render backend URL.

### 3. Deploy to Vercel
```bash
npm run build
```

## Environment Variables Needed

### Backend (Render)
- SECRET_KEY
- DATABASE_URL
- DEBUG=False
- EMAIL_HOST (optional)
- EMAIL_PORT (optional)
- EMAIL_HOST_USER (optional)
- EMAIL_HOST_PASSWORD (optional)

### Frontend (Vercel)
- VITE_API_URL=https://your-backend.onrender.com
