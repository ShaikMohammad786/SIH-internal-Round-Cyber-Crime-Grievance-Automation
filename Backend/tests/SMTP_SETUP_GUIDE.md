# 📧 SMTP Configuration Guide for FraudLens

## 🚀 Quick Setup (Gmail)

### Step 1: Enable 2-Factor Authentication
1. Go to [Google Account Security](https://myaccount.google.com/security)
2. Enable 2-Step Verification
3. This is required for App Passwords

### Step 2: Generate App Password
1. Go to [Google App Passwords](https://myaccount.google.com/apppasswords)
2. Select "Mail" as the app
3. Generate a 16-character password
4. Copy this password (you'll need it for the .env file)

### Step 3: Configure Environment Variables
Update your `.env` file with the following:

```env
# SMTP Configuration for Gmail
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-16-character-app-password

# Email Recipients
TELECOM_EMAIL=telecom@fraud.gov.in
BANKING_EMAIL=banking@fraud.gov.in
NODAL_EMAIL=nodal@fraud.gov.in
```

### Step 4: Test Configuration
Run the test script:
```bash
node test-smtp-config.js
```

## 🔧 Alternative SMTP Providers

### Outlook/Hotmail
```env
SMTP_HOST=smtp-mail.outlook.com
SMTP_PORT=587
SMTP_USER=your-email@outlook.com
SMTP_PASS=your-password
```

### Yahoo Mail
```env
SMTP_HOST=smtp.mail.yahoo.com
SMTP_PORT=587
SMTP_USER=your-email@yahoo.com
SMTP_PASS=your-app-password
```

### Custom SMTP Server
```env
SMTP_HOST=your-smtp-server.com
SMTP_PORT=587
SMTP_USER=your-username
SMTP_PASS=your-password
```

## 🛠️ Troubleshooting

### Common Issues:

1. **Authentication Failed (535)**
   - Check if 2FA is enabled
   - Verify App Password is correct
   - Ensure using App Password, not regular password

2. **Connection Timeout**
   - Check internet connection
   - Verify SMTP host and port
   - Check firewall settings

3. **TLS/SSL Errors**
   - Try port 465 with secure: true
   - Check TLS configuration

### Testing Commands:

```bash
# Test SMTP configuration
node test-smtp-config.js

# Test email sending in the app
node test-form-submission.js
```

## 📋 Production Setup

For production deployment:

1. **Use Environment Variables**: Never hardcode credentials
2. **Use Dedicated Email Service**: Consider SendGrid, Mailgun, or AWS SES
3. **Rate Limiting**: Implement email rate limiting
4. **Monitoring**: Set up email delivery monitoring
5. **Backup SMTP**: Configure backup SMTP servers

### Example Production Configuration:
```env
# Primary SMTP (SendGrid)
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASS=your-sendgrid-api-key

# Backup SMTP (Gmail)
BACKUP_SMTP_HOST=smtp.gmail.com
BACKUP_SMTP_PORT=587
BACKUP_SMTP_USER=backup@gmail.com
BACKUP_SMTP_PASS=backup-app-password
```

## 🔒 Security Best Practices

1. **Never commit .env files** to version control
2. **Use App Passwords** instead of regular passwords
3. **Rotate credentials** regularly
4. **Monitor email usage** for suspicious activity
5. **Use dedicated email accounts** for the application

## 📊 Email Templates

The system includes pre-configured email templates for:
- Telecom Regulatory Authority
- Banking Authority (RBI)
- Nodal Officer (Cyber Crime Division)

Templates are automatically populated with case details and scammer information.

## 🎯 Next Steps

1. Configure your SMTP settings in `.env`
2. Run `node test-smtp-config.js` to verify
3. Test the complete workflow with `node test-form-submission.js`
4. Deploy with proper environment variables

---

**Need Help?** Check the console output for detailed error messages and troubleshooting tips.
