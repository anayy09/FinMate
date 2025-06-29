import os
import csv
import io
from datetime import datetime, timedelta
from decimal import Decimal
from typing import List, Dict, Any

from django.http import HttpResponse, FileResponse
from django.template.loader import render_to_string
from django.conf import settings
from django.utils import timezone
from django.db.models import Sum, Count, Q, Avg
from django.db.models.functions import TruncMonth, TruncWeek

import pandas as pd
from reportlab.lib import colors
from reportlab.lib.pagesizes import letter, A4
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer, Image
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.pdfgen import canvas
from reportlab.graphics.shapes import Drawing
from reportlab.graphics.charts.piecharts import Pie
from reportlab.graphics.charts.barcharts import VerticalBarChart
from reportlab.lib.colors import HexColor

from .models import Transaction, Account, Budget, Category
from .notification_models import AIInsight


class FinancialReportGenerator:
    """Generate comprehensive financial reports in PDF and CSV formats."""
    
    def __init__(self, user, start_date=None, end_date=None):
        self.user = user
        self.start_date = start_date or timezone.now().replace(day=1)  # First day of current month
        self.end_date = end_date or timezone.now()
        
    def get_report_data(self) -> Dict[str, Any]:
        """Gather all data needed for financial reports."""
        transactions = Transaction.objects.filter(
            user=self.user,
            transaction_date__range=[self.start_date, self.end_date]
        ).select_related('category', 'account')
        
        # Basic metrics
        total_income = transactions.filter(transaction_type='income').aggregate(
            total=Sum('amount'))['total'] or Decimal('0')
        total_expenses = transactions.filter(transaction_type='expense').aggregate(
            total=Sum('amount'))['total'] or Decimal('0')
        net_income = total_income - total_expenses
        
        # Category breakdown
        expense_by_category = transactions.filter(transaction_type='expense').values(
            'category__name').annotate(
            total=Sum('amount'),
            count=Count('id')
        ).order_by('-total')
        
        income_by_category = transactions.filter(transaction_type='income').values(
            'category__name').annotate(
            total=Sum('amount'),
            count=Count('id')
        ).order_by('-total')
        
        # Account balances
        accounts = Account.objects.filter(user=self.user)
        account_summary = []
        for account in accounts:
            account_summary.append({
                'name': account.name,
                'type': account.get_account_type_display(),
                'balance': account.balance,
                'transaction_count': transactions.filter(account=account).count()
            })
        
        # Monthly trends (last 6 months)
        six_months_ago = timezone.now() - timedelta(days=180)
        monthly_trends = Transaction.objects.filter(
            user=self.user,
            transaction_date__gte=six_months_ago
        ).annotate(
            month=TruncMonth('transaction_date')
        ).values('month', 'transaction_type').annotate(
            total=Sum('amount')
        ).order_by('month')
        
        # Budget vs actual
        budgets = Budget.objects.filter(
            user=self.user,
            month=self.start_date.replace(day=1)
        )
        
        budget_analysis = []
        for budget in budgets:
            actual_spent = transactions.filter(
                transaction_type='expense',
                category_id=budget.category_id
            ).aggregate(total=Sum('amount'))['total'] or Decimal('0')
            
            budget_analysis.append({
                'category': budget.category.name,
                'budgeted': budget.amount,
                'actual': actual_spent,
                'variance': budget.amount - actual_spent,
                'percentage': (actual_spent / budget.amount * 100) if budget.amount > 0 else 0
            })
        
        # Top transactions
        top_expenses = transactions.filter(transaction_type='expense').order_by('-amount')[:10]
        top_income = transactions.filter(transaction_type='income').order_by('-amount')[:10]
        
        # Recent AI insights
        ai_insights = AIInsight.objects.filter(
            user=self.user,
            created_at__range=[self.start_date, self.end_date]
        ).order_by('-created_at')[:5]
        
        return {
            'period': {
                'start_date': self.start_date,
                'end_date': self.end_date,
                'days': (self.end_date - self.start_date).days + 1
            },
            'summary': {
                'total_income': total_income,
                'total_expenses': total_expenses,
                'net_income': net_income,
                'transaction_count': transactions.count()
            },
            'expense_by_category': list(expense_by_category),
            'income_by_category': list(income_by_category),
            'account_summary': account_summary,
            'monthly_trends': list(monthly_trends),
            'budget_analysis': budget_analysis,
            'top_expenses': list(top_expenses.values(
                'description', 'amount', 'transaction_date', 'category__name'
            )),
            'top_income': list(top_income.values(
                'description', 'amount', 'transaction_date', 'category__name'
            )),
            'ai_insights': list(ai_insights.values(
                'insight_type', 'title', 'description', 'confidence_score'
            )),
            'transactions': list(transactions.values(
                'id', 'description', 'amount', 'transaction_type', 'transaction_date',
                'category__name', 'account__name'
            ))
        }
    
    def generate_csv_report(self) -> HttpResponse:
        """Generate comprehensive CSV report."""
        data = self.get_report_data()
        
        response = HttpResponse(content_type='text/csv')
        response['Content-Disposition'] = f'attachment; filename="financial_report_{self.start_date.strftime("%Y%m%d")}_to_{self.end_date.strftime("%Y%m%d")}.csv"'
        
        # Create a CSV with multiple sheets worth of data
        output = io.StringIO()
        
        # Summary section
        output.write("FINANCIAL REPORT SUMMARY\n")
        output.write(f"Period: {self.start_date.strftime('%Y-%m-%d')} to {self.end_date.strftime('%Y-%m-%d')}\n")
        output.write(f"Generated: {timezone.now().strftime('%Y-%m-%d %H:%M:%S')}\n\n")
        
        output.write("INCOME & EXPENSES\n")
        output.write(f"Total Income,${data['summary']['total_income']}\n")
        output.write(f"Total Expenses,${data['summary']['total_expenses']}\n")
        output.write(f"Net Income,${data['summary']['net_income']}\n")
        output.write(f"Total Transactions,{data['summary']['transaction_count']}\n\n")
        
        # Expense by category
        output.write("EXPENSES BY CATEGORY\n")
        output.write("Category,Amount,Transaction Count\n")
        for item in data['expense_by_category']:
            output.write(f"{item['category__name']},${item['total']},{item['count']}\n")
        output.write("\n")
        
        # Income by category
        output.write("INCOME BY CATEGORY\n")
        output.write("Category,Amount,Transaction Count\n")
        for item in data['income_by_category']:
            output.write(f"{item['category__name']},${item['total']},{item['count']}\n")
        output.write("\n")
        
        # Account summary
        output.write("ACCOUNT SUMMARY\n")
        output.write("Account Name,Type,Balance,Transactions\n")
        for account in data['account_summary']:
            output.write(f"{account['name']},{account['type']},${account['balance']},{account['transaction_count']}\n")
        output.write("\n")
        
        # Budget analysis
        if data['budget_analysis']:
            output.write("BUDGET ANALYSIS\n")
            output.write("Category,Budgeted,Actual,Variance,Percentage Used\n")
            for budget in data['budget_analysis']:
                output.write(f"{budget['category']},${budget['budgeted']},${budget['actual']},${budget['variance']},{budget['percentage']:.1f}%\n")
            output.write("\n")
        
        # All transactions
        output.write("ALL TRANSACTIONS\n")
        output.write("Date,Description,Type,Amount,Category,Account\n")
        for transaction in data['transactions']:
            output.write(f"{transaction['transaction_date']},{transaction['description']},{transaction['transaction_type']},${transaction['amount']},{transaction['category__name']},{transaction['account__name']}\n")
        
        response.write(output.getvalue())
        return response
    
    def generate_pdf_report(self) -> FileResponse:
        """Generate comprehensive PDF report."""
        data = self.get_report_data()
        
        # Create PDF buffer
        buffer = io.BytesIO()
        doc = SimpleDocTemplate(buffer, pagesize=A4, rightMargin=72, leftMargin=72,
                              topMargin=72, bottomMargin=18)
        
        # Container for the 'Flowable' objects
        elements = []
        
        # Styles
        styles = getSampleStyleSheet()
        title_style = ParagraphStyle(
            'CustomTitle',
            parent=styles['Heading1'],
            fontSize=24,
            spaceAfter=30,
            textColor=colors.HexColor('#2D3748')
        )
        
        heading_style = ParagraphStyle(
            'CustomHeading',
            parent=styles['Heading2'],
            fontSize=16,
            spaceAfter=12,
            textColor=colors.HexColor('#4A5568')
        )
        
        # Title
        elements.append(Paragraph("Financial Report", title_style))
        elements.append(Paragraph(
            f"Period: {self.start_date.strftime('%B %d, %Y')} to {self.end_date.strftime('%B %d, %Y')}",
            styles['Normal']
        ))
        elements.append(Paragraph(
            f"Generated: {timezone.now().strftime('%B %d, %Y at %I:%M %p')}",
            styles['Normal']
        ))
        elements.append(Spacer(1, 20))
        
        # Summary section
        elements.append(Paragraph("Executive Summary", heading_style))
        
        summary_data = [
            ['Metric', 'Amount'],
            ['Total Income', f"${data['summary']['total_income']:,.2f}"],
            ['Total Expenses', f"${data['summary']['total_expenses']:,.2f}"],
            ['Net Income', f"${data['summary']['net_income']:,.2f}"],
            ['Total Transactions', f"{data['summary']['transaction_count']:,}"],
        ]
        
        summary_table = Table(summary_data, colWidths=[2*inch, 2*inch])
        summary_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#4299E1')),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, 0), 12),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
            ('BACKGROUND', (0, 1), (-1, -1), colors.HexColor('#F7FAFC')),
            ('GRID', (0, 0), (-1, -1), 1, colors.black)
        ]))
        
        elements.append(summary_table)
        elements.append(Spacer(1, 20))
        
        # Expense breakdown
        if data['expense_by_category']:
            elements.append(Paragraph("Expenses by Category", heading_style))
            
            expense_data = [['Category', 'Amount', 'Transactions']]
            for item in data['expense_by_category']:
                expense_data.append([
                    item['category__name'],
                    f"${item['total']:,.2f}",
                    str(item['count'])
                ])
            
            expense_table = Table(expense_data, colWidths=[2*inch, 1.5*inch, 1*inch])
            expense_table.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#48BB78')),
                ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
                ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
                ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                ('FONTSIZE', (0, 0), (-1, 0), 10),
                ('BOTTOMPADDING', (0, 0), (-1, 0), 8),
                ('BACKGROUND', (0, 1), (-1, -1), colors.HexColor('#F0FFF4')),
                ('GRID', (0, 0), (-1, -1), 1, colors.black)
            ]))
            
            elements.append(expense_table)
            elements.append(Spacer(1, 20))
        
        # Account summary
        if data['account_summary']:
            elements.append(Paragraph("Account Summary", heading_style))
            
            account_data = [['Account', 'Type', 'Balance', 'Transactions']]
            for account in data['account_summary']:
                account_data.append([
                    account['name'],
                    account['type'],
                    f"${account['balance']:,.2f}",
                    str(account['transaction_count'])
                ])
            
            account_table = Table(account_data, colWidths=[2*inch, 1.5*inch, 1.5*inch, 1*inch])
            account_table.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#9F7AEA')),
                ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
                ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
                ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                ('FONTSIZE', (0, 0), (-1, 0), 10),
                ('BOTTOMPADDING', (0, 0), (-1, 0), 8),
                ('BACKGROUND', (0, 1), (-1, -1), colors.HexColor('#FAF5FF')),
                ('GRID', (0, 0), (-1, -1), 1, colors.black)
            ]))
            
            elements.append(account_table)
            elements.append(Spacer(1, 20))
        
        # Budget analysis
        if data['budget_analysis']:
            elements.append(Paragraph("Budget vs Actual", heading_style))
            
            budget_data = [['Category', 'Budgeted', 'Actual', 'Variance', '% Used']]
            for budget in data['budget_analysis']:
                variance_color = 'green' if budget['variance'] >= 0 else 'red'
                budget_data.append([
                    budget['category'],
                    f"${budget['budgeted']:,.2f}",
                    f"${budget['actual']:,.2f}",
                    f"${budget['variance']:,.2f}",
                    f"{budget['percentage']:.1f}%"
                ])
            
            budget_table = Table(budget_data, colWidths=[1.5*inch, 1.2*inch, 1.2*inch, 1.2*inch, 0.8*inch])
            budget_table.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#ED8936')),
                ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
                ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
                ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                ('FONTSIZE', (0, 0), (-1, 0), 10),
                ('BOTTOMPADDING', (0, 0), (-1, 0), 8),
                ('BACKGROUND', (0, 1), (-1, -1), colors.HexColor('#FFFAF0')),
                ('GRID', (0, 0), (-1, -1), 1, colors.black)
            ]))
            
            elements.append(budget_table)
            elements.append(Spacer(1, 20))
        
        # AI Insights
        if data['ai_insights']:
            elements.append(Paragraph("AI Financial Insights", heading_style))
            for insight in data['ai_insights']:
                elements.append(Paragraph(
                    f"<b>{insight['title']}</b> (Confidence: {insight['confidence_score']:.1f}%)",
                    styles['Normal']
                ))
                elements.append(Paragraph(
                    insight['description'],
                    styles['Normal']
                ))
                elements.append(Spacer(1, 8))
        
        # Build PDF
        doc.build(elements)
        
        # Get the value of the BytesIO buffer and create response
        buffer.seek(0)
        response = FileResponse(
            buffer,
            as_attachment=True,
            filename=f'financial_report_{self.start_date.strftime("%Y%m%d")}_to_{self.end_date.strftime("%Y%m%d")}.pdf',
            content_type='application/pdf'
        )
        
        return response


class WeeklyReportGenerator(FinancialReportGenerator):
    """Generate weekly financial reports."""
    
    def __init__(self, user, week_offset=0):
        # Calculate start and end of the week
        today = timezone.now().date()
        start_of_week = today - timedelta(days=today.weekday() + 7 * week_offset)
        end_of_week = start_of_week + timedelta(days=6)
        
        super().__init__(user, start_of_week, end_of_week)


class MonthlyReportGenerator(FinancialReportGenerator):
    """Generate monthly financial reports."""
    
    def __init__(self, user, month_offset=0):
        # Calculate start and end of the month
        today = timezone.now().date()
        if month_offset == 0:
            start_of_month = today.replace(day=1)
            if today.month == 12:
                end_of_month = today.replace(year=today.year + 1, month=1, day=1) - timedelta(days=1)
            else:
                end_of_month = today.replace(month=today.month + 1, day=1) - timedelta(days=1)
        else:
            # Handle previous months
            year = today.year
            month = today.month + month_offset
            if month <= 0:
                month += 12
                year -= 1
            elif month > 12:
                month -= 12
                year += 1
            
            start_of_month = today.replace(year=year, month=month, day=1)
            if month == 12:
                end_of_month = start_of_month.replace(year=year + 1, month=1, day=1) - timedelta(days=1)
            else:
                end_of_month = start_of_month.replace(month=month + 1, day=1) - timedelta(days=1)
        
        super().__init__(user, start_of_month, end_of_month)
