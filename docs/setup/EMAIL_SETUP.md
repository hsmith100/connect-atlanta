# Email Service Setup

The contact form uses SMTP to send email notifications when someone submits a message.

## Environment Variables

Add these variables to your `backend/.env` file:

```bash
# SMTP Configuration (Required for contact form)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-specific-password
SMTP_FROM_EMAIL=noreply@connectevents.co
CONTACT_EMAIL=info@connectevents.co
```

## Gmail Setup (Recommended for Testing)

If using Gmail:

1. **Enable 2-Factor Authentication** on your Gmail account
2. **Generate an App Password**:
   - Go to: https://myaccount.google.com/apppasswords
   - Select "Mail" and "Other (Custom name)"
   - Name it "Connect Events Contact Form"
   - Copy the 16-character password
3. **Use the App Password** as `SMTP_PASSWORD` (not your regular Gmail password)

### Gmail Example:
```bash
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your.email@gmail.com
SMTP_PASSWORD=abcd efgh ijkl mnop  # 16-char app password
SMTP_FROM_EMAIL=your.email@gmail.com
CONTACT_EMAIL=info@connectevents.co
```

## SendGrid Setup (Recommended for Production)

SendGrid is more reliable for production use:

1. **Sign up** at https://sendgrid.com (Free tier: 100 emails/day)
2. **Create an API Key**:
   - Go to Settings > API Keys
   - Create API Key with "Mail Send" permission
3. **Configure**:

```bash
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASSWORD=SG.your-sendgrid-api-key-here
SMTP_FROM_EMAIL=noreply@connectevents.co
CONTACT_EMAIL=info@connectevents.co
```

## Other SMTP Providers

### Mailgun
```bash
SMTP_HOST=smtp.mailgun.org
SMTP_PORT=587
SMTP_USER=postmaster@your-domain.mailgun.org
SMTP_PASSWORD=your-mailgun-password
```

### Amazon SES
```bash
SMTP_HOST=email-smtp.us-east-1.amazonaws.com
SMTP_PORT=587
SMTP_USER=your-ses-smtp-username
SMTP_PASSWORD=your-ses-smtp-password
```

### Custom SMTP Server
```bash
SMTP_HOST=mail.yourdomain.com
SMTP_PORT=587
SMTP_USER=noreply@yourdomain.com
SMTP_PASSWORD=your-password
```

## Testing the Setup

After configuring environment variables, test the email service:

```bash
# In the backend container
docker-compose exec backend python -c "
from services.email_service import EmailService
email_service = EmailService()
print('Testing SMTP connection...')
if email_service.test_connection():
    print('✅ SMTP connection successful!')
else:
    print('❌ SMTP connection failed. Check your credentials.')
"
```

## Troubleshooting

### "Authentication failed"
- Gmail: Make sure you're using an App Password, not your regular password
- Check that 2FA is enabled on Gmail
- Verify SMTP_USER and SMTP_PASSWORD are correct

### "Connection refused" or "Timeout"
- Check SMTP_HOST and SMTP_PORT
- Ensure your server allows outbound connections on port 587
- Some hosting providers block SMTP; check their documentation

### "Sender address rejected"
- Make sure SMTP_FROM_EMAIL matches SMTP_USER (for Gmail)
- For custom domains, verify domain authentication with your provider

### Emails going to spam
- Use SendGrid or another professional email service
- Configure SPF and DKIM records for your domain
- Avoid using free email providers (Gmail/Yahoo) as sender in production

## Production Deployment

1. **Add to server's `.env` file**: Copy variables to `/opt/custom-build/backend/.env`
2. **Restart backend**: `docker-compose restart backend`
3. **Test**: Submit a test message via the contact form
4. **Monitor**: Check backend logs for email send confirmation

```bash
# Check if email was sent
docker-compose logs -f backend | grep "Contact form email"
```

## Security Notes

- Never commit `.env` files to git
- Use App Passwords or API keys, never regular passwords
- Rotate credentials regularly
- Monitor email sending quotas to prevent abuse
- Consider adding rate limiting to the contact form endpoint

## Email Template

The contact form email includes:
- Sender's name and email (with reply-to set to sender's email)
- Subject line
- Message content
- HTML-formatted email for better readability
- Plain text fallback

Recipients can simply click "Reply" to respond directly to the form submitter.
