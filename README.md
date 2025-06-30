# FinMate

This project is a personal finance management application.

## Email Configuration

FinMate sends verification and password reset emails using SMTP. Configure the following environment variables in `.env` or your environment:

```
EMAIL_BACKEND=django.core.mail.backends.smtp.EmailBackend
EMAIL_HOST=smtp.example.com
EMAIL_PORT=587
EMAIL_USE_TLS=True
EMAIL_HOST_USER=your_username
EMAIL_HOST_PASSWORD=your_password
DEFAULT_FROM_EMAIL=noreply@finmate.com
```

When running locally without an SMTP server you can use [MailHog](https://github.com/mailhog/MailHog) or another local SMTP service.
