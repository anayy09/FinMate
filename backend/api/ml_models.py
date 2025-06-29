"""
Machine Learning models for expense prediction and anomaly detection.
"""
import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestRegressor, IsolationForest
from sklearn.linear_model import LinearRegression
from sklearn.preprocessing import StandardScaler, LabelEncoder
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_absolute_error, mean_squared_error
import joblib
import os
from datetime import datetime, timedelta
from decimal import Decimal
from django.conf import settings
from .models import Transaction, Category


class ExpensePredictionModel:
    """Model for predicting future expenses based on historical data."""
    
    def __init__(self):
        self.model = RandomForestRegressor(n_estimators=100, random_state=42)
        self.scaler = StandardScaler()
        self.category_encoder = LabelEncoder()
        self.model_path = os.path.join(settings.BASE_DIR, 'ml_models')
        os.makedirs(self.model_path, exist_ok=True)
    
    def prepare_features(self, transactions_df):
        """Prepare features for the ML model."""
        if transactions_df.empty:
            return pd.DataFrame()
            
        # Create time-based features
        transactions_df['transaction_date'] = pd.to_datetime(transactions_df['transaction_date'])
        transactions_df['day_of_week'] = transactions_df['transaction_date'].dt.dayofweek
        transactions_df['day_of_month'] = transactions_df['transaction_date'].dt.day
        transactions_df['month'] = transactions_df['transaction_date'].dt.month
        transactions_df['quarter'] = transactions_df['transaction_date'].dt.quarter
        transactions_df['is_weekend'] = transactions_df['day_of_week'].isin([5, 6]).astype(int)
        
        # Category encoding
        if 'category_name' in transactions_df.columns:
            transactions_df['category_encoded'] = self.category_encoder.fit_transform(
                transactions_df['category_name'].fillna('Unknown')
            )
        else:
            transactions_df['category_encoded'] = 0
        
        # Calculate rolling averages
        transactions_df = transactions_df.sort_values('transaction_date')
        transactions_df['rolling_7_avg'] = transactions_df['amount'].rolling(7, min_periods=1).mean()
        transactions_df['rolling_30_avg'] = transactions_df['amount'].rolling(30, min_periods=1).mean()
        
        # Select features for prediction
        feature_columns = [
            'day_of_week', 'day_of_month', 'month', 'quarter', 'is_weekend',
            'category_encoded', 'rolling_7_avg', 'rolling_30_avg'
        ]
        
        return transactions_df[feature_columns].fillna(0)
    
    def train(self, user_id):
        """Train the model using user's transaction history."""
        try:
            # Get user's expense transactions
            transactions = Transaction.objects.filter(
                user_id=user_id,
                transaction_type='expense'
            ).select_related('category').values(
                'amount', 'transaction_date', 'category__name'
            )
            
            if not transactions:
                return False, "No transaction data available for training"
            
            # Convert to DataFrame
            df = pd.DataFrame(transactions)
            df.rename(columns={'category__name': 'category_name'}, inplace=True)
            df['amount'] = df['amount'].astype(float)
            
            if len(df) < 10:
                return False, "Insufficient transaction data for training (minimum 10 transactions required)"
            
            # Prepare features
            features = self.prepare_features(df.copy())
            if features.empty:
                return False, "Could not prepare features from transaction data"
            
            # Prepare target variable
            target = df['amount'].values
            
            # Split data
            X_train, X_test, y_train, y_test = train_test_split(
                features, target, test_size=0.2, random_state=42
            )
            
            # Scale features
            X_train_scaled = self.scaler.fit_transform(X_train)
            X_test_scaled = self.scaler.transform(X_test)
            
            # Train model
            self.model.fit(X_train_scaled, y_train)
            
            # Evaluate model
            y_pred = self.model.predict(X_test_scaled)
            mae = mean_absolute_error(y_test, y_pred)
            rmse = np.sqrt(mean_squared_error(y_test, y_pred))
            
            # Save model
            model_file = os.path.join(self.model_path, f'expense_model_user_{user_id}.joblib')
            scaler_file = os.path.join(self.model_path, f'scaler_user_{user_id}.joblib')
            encoder_file = os.path.join(self.model_path, f'encoder_user_{user_id}.joblib')
            
            joblib.dump(self.model, model_file)
            joblib.dump(self.scaler, scaler_file)
            joblib.dump(self.category_encoder, encoder_file)
            
            return True, {
                'mae': round(mae, 2),
                'rmse': round(rmse, 2),
                'training_samples': len(df),
                'model_saved': model_file
            }
            
        except Exception as e:
            return False, f"Training failed: {str(e)}"
    
    def predict_next_month_expenses(self, user_id, category_name=None):
        """Predict expenses for the next month."""
        try:
            # Load trained model
            model_file = os.path.join(self.model_path, f'expense_model_user_{user_id}.joblib')
            scaler_file = os.path.join(self.model_path, f'scaler_user_{user_id}.joblib')
            encoder_file = os.path.join(self.model_path, f'encoder_user_{user_id}.joblib')
            
            if not all(os.path.exists(f) for f in [model_file, scaler_file, encoder_file]):
                return None, "Model not trained for this user"
            
            self.model = joblib.load(model_file)
            self.scaler = joblib.load(scaler_file)
            self.category_encoder = joblib.load(encoder_file)
            
            # Create prediction features for next 30 days
            today = datetime.now()
            predictions = []
            
            for i in range(30):
                future_date = today + timedelta(days=i)
                
                # Create feature vector
                features = {
                    'day_of_week': future_date.weekday(),
                    'day_of_month': future_date.day,
                    'month': future_date.month,
                    'quarter': (future_date.month - 1) // 3 + 1,
                    'is_weekend': int(future_date.weekday() >= 5),
                    'category_encoded': 0,  # Default category
                    'rolling_7_avg': 0,  # Will be updated based on historical data
                    'rolling_30_avg': 0
                }
                
                # Encode category if provided
                if category_name:
                    try:
                        features['category_encoded'] = self.category_encoder.transform([category_name])[0]
                    except ValueError:
                        features['category_encoded'] = 0
                
                # Get recent transaction averages for rolling features
                recent_transactions = Transaction.objects.filter(
                    user_id=user_id,
                    transaction_type='expense',
                    transaction_date__gte=today - timedelta(days=30)
                ).aggregate(
                    avg_amount=models.Avg('amount')
                )
                
                if recent_transactions['avg_amount']:
                    features['rolling_7_avg'] = float(recent_transactions['avg_amount'])
                    features['rolling_30_avg'] = float(recent_transactions['avg_amount'])
                
                # Make prediction
                feature_vector = np.array(list(features.values())).reshape(1, -1)
                feature_vector_scaled = self.scaler.transform(feature_vector)
                predicted_amount = self.model.predict(feature_vector_scaled)[0]
                
                predictions.append({
                    'date': future_date.strftime('%Y-%m-%d'),
                    'predicted_amount': round(max(0, predicted_amount), 2)
                })
            
            # Calculate total monthly prediction
            total_predicted = sum(p['predicted_amount'] for p in predictions)
            
            return {
                'total_monthly_prediction': round(total_predicted, 2),
                'daily_predictions': predictions,
                'category': category_name or 'All Categories'
            }, None
            
        except Exception as e:
            return None, f"Prediction failed: {str(e)}"


class AnomalyDetectionModel:
    """Model for detecting unusual spending patterns."""
    
    def __init__(self):
        self.model = IsolationForest(contamination=0.1, random_state=42)
        self.scaler = StandardScaler()
        self.model_path = os.path.join(settings.BASE_DIR, 'ml_models')
        os.makedirs(self.model_path, exist_ok=True)
    
    def prepare_features(self, transactions_df):
        """Prepare features for anomaly detection."""
        if transactions_df.empty:
            return pd.DataFrame()
        
        transactions_df['transaction_date'] = pd.to_datetime(transactions_df['transaction_date'])
        
        # Time-based features
        transactions_df['hour'] = transactions_df['transaction_date'].dt.hour
        transactions_df['day_of_week'] = transactions_df['transaction_date'].dt.dayofweek
        transactions_df['day_of_month'] = transactions_df['transaction_date'].dt.day
        transactions_df['is_weekend'] = transactions_df['day_of_week'].isin([5, 6]).astype(int)
        
        # Amount-based features
        transactions_df['amount_log'] = np.log1p(transactions_df['amount'])
        
        # Rolling statistics
        transactions_df = transactions_df.sort_values('transaction_date')
        transactions_df['rolling_mean'] = transactions_df['amount'].rolling(7, min_periods=1).mean()
        transactions_df['rolling_std'] = transactions_df['amount'].rolling(7, min_periods=1).std().fillna(0)
        transactions_df['amount_vs_avg'] = transactions_df['amount'] / (transactions_df['rolling_mean'] + 1)
        
        feature_columns = [
            'amount', 'amount_log', 'hour', 'day_of_week', 'day_of_month', 
            'is_weekend', 'amount_vs_avg'
        ]
        
        return transactions_df[feature_columns].fillna(0)
    
    def train(self, user_id):
        """Train anomaly detection model."""
        try:
            # Get user's transactions
            transactions = Transaction.objects.filter(
                user_id=user_id,
                transaction_type='expense'
            ).values('amount', 'transaction_date')
            
            if not transactions:
                return False, "No transaction data available"
            
            df = pd.DataFrame(transactions)
            df['amount'] = df['amount'].astype(float)
            
            if len(df) < 20:
                return False, "Insufficient data for anomaly detection (minimum 20 transactions)"
            
            # Prepare features
            features = self.prepare_features(df.copy())
            if features.empty:
                return False, "Could not prepare features"
            
            # Scale features
            features_scaled = self.scaler.fit_transform(features)
            
            # Train model
            self.model.fit(features_scaled)
            
            # Save model
            model_file = os.path.join(self.model_path, f'anomaly_model_user_{user_id}.joblib')
            scaler_file = os.path.join(self.model_path, f'anomaly_scaler_user_{user_id}.joblib')
            
            joblib.dump(self.model, model_file)
            joblib.dump(self.scaler, scaler_file)
            
            return True, {
                'training_samples': len(df),
                'model_saved': model_file
            }
            
        except Exception as e:
            return False, f"Training failed: {str(e)}"
    
    def detect_anomalies(self, user_id, days_back=30):
        """Detect anomalous transactions in recent history."""
        try:
            # Load model
            model_file = os.path.join(self.model_path, f'anomaly_model_user_{user_id}.joblib')
            scaler_file = os.path.join(self.model_path, f'anomaly_scaler_user_{user_id}.joblib')
            
            if not all(os.path.exists(f) for f in [model_file, scaler_file]):
                return None, "Anomaly detection model not trained"
            
            self.model = joblib.load(model_file)
            self.scaler = joblib.load(scaler_file)
            
            # Get recent transactions
            cutoff_date = datetime.now() - timedelta(days=days_back)
            transactions = Transaction.objects.filter(
                user_id=user_id,
                transaction_type='expense',
                transaction_date__gte=cutoff_date
            ).values('id', 'amount', 'transaction_date', 'description')
            
            if not transactions:
                return [], None
            
            df = pd.DataFrame(transactions)
            df['amount'] = df['amount'].astype(float)
            
            # Prepare features
            features = self.prepare_features(df.copy())
            if features.empty:
                return [], None
            
            # Scale and predict
            features_scaled = self.scaler.transform(features)
            anomaly_scores = self.model.decision_function(features_scaled)
            anomaly_labels = self.model.predict(features_scaled)
            
            # Find anomalies (label -1 indicates anomaly)
            anomalies = []
            for i, (idx, row) in enumerate(df.iterrows()):
                if anomaly_labels[i] == -1:
                    anomalies.append({
                        'transaction_id': row['id'],
                        'amount': float(row['amount']),
                        'date': row['transaction_date'].strftime('%Y-%m-%d'),
                        'description': row['description'],
                        'anomaly_score': float(anomaly_scores[i])
                    })
            
            # Sort by anomaly score (most anomalous first)
            anomalies.sort(key=lambda x: x['anomaly_score'])
            
            return anomalies, None
            
        except Exception as e:
            return None, f"Anomaly detection failed: {str(e)}"


def generate_ai_insights(user_id):
    """Generate comprehensive AI insights for a user."""
    insights = {
        'spending_patterns': [],
        'budget_suggestions': [],
        'savings_opportunities': [],
        'anomalies': [],
        'predictions': {}
    }
    
    try:
        from django.db import models
        from django.utils import timezone
        
        # Get recent transactions
        thirty_days_ago = timezone.now() - timedelta(days=30)
        recent_transactions = Transaction.objects.filter(
            user_id=user_id,
            transaction_date__gte=thirty_days_ago
        ).select_related('category')
        
        if not recent_transactions.exists():
            return insights
        
        # Spending pattern analysis
        expense_transactions = recent_transactions.filter(transaction_type='expense')
        if expense_transactions.exists():
            # Category analysis
            category_spending = {}
            for transaction in expense_transactions:
                category_name = transaction.category.name if transaction.category else 'Uncategorized'
                category_spending[category_name] = category_spending.get(category_name, 0) + float(transaction.amount)
            
            # Find top spending categories
            top_categories = sorted(category_spending.items(), key=lambda x: x[1], reverse=True)[:3]
            
            for category, amount in top_categories:
                insights['spending_patterns'].append({
                    'type': 'high_spending_category',
                    'message': f"Your highest spending category is {category} with ${amount:.2f} in the last 30 days",
                    'category': category,
                    'amount': amount
                })
            
            # Weekend vs weekday spending
            weekend_spending = sum(
                float(t.amount) for t in expense_transactions 
                if t.transaction_date.weekday() >= 5
            )
            weekday_spending = sum(
                float(t.amount) for t in expense_transactions 
                if t.transaction_date.weekday() < 5
            )
            
            if weekend_spending > weekday_spending * 0.4:  # Weekend spending > 40% of weekday
                insights['spending_patterns'].append({
                    'type': 'weekend_spending',
                    'message': f"You tend to spend more on weekends (${weekend_spending:.2f}) compared to weekdays",
                    'weekend_amount': weekend_spending,
                    'weekday_amount': weekday_spending
                })
            
            # Budget suggestions based on historical data
            avg_monthly_spending = sum(float(t.amount) for t in expense_transactions)
            suggested_budget = avg_monthly_spending * 1.1  # 10% buffer
            
            insights['budget_suggestions'].append({
                'type': 'monthly_budget',
                'message': f"Based on your spending, consider setting a monthly budget of ${suggested_budget:.2f}",
                'suggested_amount': suggested_budget,
                'current_spending': avg_monthly_spending
            })
            
            # Savings opportunities
            if category_spending.get('Food & Dining', 0) > 500:
                insights['savings_opportunities'].append({
                    'type': 'food_spending',
                    'message': "Consider meal planning to reduce dining expenses",
                    'potential_savings': category_spending.get('Food & Dining', 0) * 0.2,
                    'category': 'Food & Dining'
                })
            
            if category_spending.get('Subscriptions', 0) > 50:
                insights['savings_opportunities'].append({
                    'type': 'subscription_audit',
                    'message': "Review your subscriptions to cancel unused services",
                    'potential_savings': category_spending.get('Subscriptions', 0) * 0.3,
                    'category': 'Subscriptions'
                })
        
        # Train and run prediction model
        prediction_model = ExpensePredictionModel()
        success, result = prediction_model.train(user_id)
        
        if success:
            predictions, error = prediction_model.predict_next_month_expenses(user_id)
            if predictions:
                insights['predictions'] = predictions
        
        # Train and run anomaly detection
        anomaly_model = AnomalyDetectionModel()
        success, result = anomaly_model.train(user_id)
        
        if success:
            anomalies, error = anomaly_model.detect_anomalies(user_id)
            if anomalies:
                insights['anomalies'] = anomalies[:5]  # Top 5 anomalies
        
        return insights
        
    except Exception as e:
        print(f"Error generating AI insights: {str(e)}")
        return insights
