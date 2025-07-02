# 💰 FinMate - Personal Finance Management System

[![Django](https://img.shields.io/badge/Django-4.2.19-green.svg)](https://djangoproject.com/)
[![React](https://img.shields.io/badge/React-18.2.0-blue.svg)](https://reactjs.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Database-blue.svg)](https://postgresql.org/)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

A comprehensive personal finance management application that helps users track expenses, analyze spending patterns, and receive AI-driven financial insights. Built with modern web technologies and integrated with real banking APIs for seamless transaction management.

## 🚀 Features

### 🔐 **Secure Authentication & User Management**

- Email/password authentication with JWT tokens
- Two-factor authentication (2FA) with TOTP
- Email verification and password reset functionality
- Device management (track and manage logged-in devices)
- User profile management with customizable preferences

### 💳 **Advanced Transaction Management**

- Manual transaction entry with rich categorization
- **Plaid API integration** for automatic bank account syncing
- Real-time transaction import from connected banks
- Smart auto-categorization using machine learning
- Recurring transaction tracking (subscriptions, bills, EMIs)
- Support for multiple account types (checking, savings, credit cards, cash)

### 📊 **Financial Analytics & Visualization**

- Interactive dashboards with comprehensive charts and graphs
- Category-wise expense breakdowns with pie charts
- Monthly and weekly spending trends using bar and line charts
- Spending heatmaps for peak spending time analysis
- **Recharts, Chart.js, D3.js, and Plotly.js** for rich visualizations
- Budget vs actual spending comparisons

### 🤖 **AI-Powered Financial Insights**

- **Machine Learning models** for expense prediction and anomaly detection
- Personalized saving strategies based on spending patterns
- Unusual spending spike detection
- Smart budget recommendations
- Financial goal tracking and achievement insights

### 💰 **Budget Management**

- Flexible monthly budget creation for different categories
- Real-time budget tracking with progress indicators
- Overspending alerts and notifications
- Budget performance analytics
- Automated budget suggestions based on historical data

### 📈 **Comprehensive Reporting**

- **Automated PDF and CSV report generation**
- Weekly and monthly financial summaries
- Email delivery of financial reports
- Export capabilities for external analysis
- Detailed cash flow analysis

### 🔔 **Smart Notification System**

- Customizable notification preferences
- Budget alerts and overspending warnings
- Email notifications for important financial events
- In-app notification center
- Weekly/monthly automated report delivery

### 🏦 **Banking Integration**

- **Plaid API** for secure bank account connections
- Support for major US financial institutions
- Automatic transaction synchronization
- Account balance tracking
- Institution-level security and encryption

## 🛠️ Tech Stack

### **Frontend**

- **React 18.2.0** - Modern UI framework
- **Chakra UI** - Component library for consistent design
- **Vite** - Fast build tool and development server
- **React Router DOM** - Client-side routing
- **Axios** - HTTP client for API communication
- **Framer Motion** - Smooth animations and transitions
- **Recharts, Chart.js, D3.js, Plotly.js** - Data visualization libraries
- **React Plaid Link** - Secure bank account linking

### **Backend**

- **Django 4.2.19** - Robust web framework
- **Django REST Framework** - API development
- **PostgreSQL** - Primary database
- **Redis** - Caching and session storage
- **Celery** - Background task processing
- **JWT Authentication** - Secure token-based auth

### **Machine Learning & Analytics**

- **Scikit-learn** - ML algorithms for prediction and anomaly detection
- **Pandas & NumPy** - Data processing and analysis
- **Random Forest & Isolation Forest** - Expense prediction and anomaly detection
- **Feature engineering** for time-series financial data

### **Third-Party Integrations**

- **Plaid API** - Banking data integration
- **TOTP (pyotp)** - Two-factor authentication
- **ReportLab** - PDF report generation
- **QR Code generation** - For 2FA setup

### **DevOps & Deployment**

- **Environment-based configuration** with python-decouple
- **CORS handling** for cross-origin requests
- **Logging and monitoring** capabilities
- **Docker-ready** configuration

## 📁 Project Structure

```text
FinMate/
├── backend/                    # Django backend application
│   ├── api/                   # Main API application
│   │   ├── models.py         # Database models
│   │   ├── views.py          # API endpoints
│   │   ├── serializers.py    # Data serialization
│   │   ├── ml_models.py      # Machine learning models
│   │   ├── plaid_service.py  # Plaid API integration
│   │   ├── reports.py        # Report generation
│   │   └── notification_models.py # Notification system
│   ├── finmate_backend/      # Django project settings
│   └── ml_models/            # Stored ML models
├── frontend/                  # React frontend application
│   ├── src/
│   │   ├── components/       # Reusable UI components
│   │   ├── pages/           # Application pages
│   │   ├── api/             # API integration
│   │   └── context/         # React context providers
│   └── public/              # Static assets
└── README.md
```

## 🚀 Quick Start

### Prerequisites

- Python 3.9+
- Node.js 16+
- PostgreSQL 12+
- Redis server

### Backend Setup

1. **Clone the repository**

   ```bash
   git clone https://github.com/anayy09/FinMate.git
   cd FinMate
   ```

2. **Set up Python environment**

   ```bash
   cd backend
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   pip install -r requirements.txt
   ```

3. **Configure environment variables**

   Create a `.env` file in the backend directory:

   ```env
   DEBUG=True
   SECRET_KEY=your-secret-key
   DATABASE_URL=postgresql://username:password@localhost:5432/finmate_db
   REDIS_URL=redis://localhost:6379/0
   PLAID_CLIENT_ID=your-plaid-client-id
   PLAID_SECRET=your-plaid-secret
   PLAID_ENV=sandbox
   EMAIL_HOST_USER=your-email
   EMAIL_HOST_PASSWORD=your-email-password
   ```

4. **Set up database**

   ```bash
   python manage.py makemigrations
   python manage.py migrate
   python manage.py createsuperuser
   ```

5. **Start the development server**

   ```bash
   python manage.py runserver
   ```

### Frontend Setup

1. **Navigate to frontend directory**

   ```bash
   cd frontend
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Start development server**

   ```bash
   npm run dev
   ```

The application will be available at:

- Frontend: `http://localhost:5173`
- Backend API: `http://localhost:8000`
- API Documentation: `http://localhost:8000/api/`

## 🔧 Configuration

### Plaid Integration

1. Sign up for a [Plaid account](https://plaid.com/)
2. Get your Client ID and Secret keys
3. Add them to your environment variables
4. Configure webhook endpoints for real-time updates

### Email Notifications

Configure SMTP settings in your environment:

```env
EMAIL_BACKEND=django.core.mail.backends.smtp.EmailBackend
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USE_TLS=True
EMAIL_HOST_USER=your-email@gmail.com
EMAIL_HOST_PASSWORD=your-app-password
```

## 📊 Key Features in Detail

### Machine Learning Capabilities

- **Expense Prediction**: Uses Random Forest algorithms to predict future spending
- **Anomaly Detection**: Isolation Forest models identify unusual transactions
- **Smart Categorization**: Automatic transaction categorization with confidence scores
- **Trend Analysis**: Time-series analysis for spending pattern recognition

### Security Features

- JWT token authentication with refresh capabilities
- Two-factor authentication support
- Device session management
- Secure API endpoints with proper authorization
- Encrypted sensitive data storage

### Data Visualization

- Interactive charts and graphs using multiple visualization libraries
- Real-time dashboard updates
- Customizable date ranges and filters
- Export capabilities for charts and reports

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
