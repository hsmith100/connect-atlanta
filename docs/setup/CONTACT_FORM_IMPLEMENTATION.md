# Contact Form Email Implementation

## Summary

Implemented email functionality for the "Send us a message" contact form on the Contact page. Messages are now sent via SMTP to `info@connectevents.co`.

## Changes Made

### Backend

1. **Created `backend/services/email_service.py`**
   - EmailService class for sending emails via SMTP
   - HTML and plain-text email templates
   - Connection testing functionality
   - Error handling and logging

2. **Updated `backend/routes/forms.py`**
   - Added `ContactFormRequest` Pydantic model
   - Created `/api/forms/contact` POST endpoint
   - Integrated EmailService for sending notifications
   - Returns success even if email fails (graceful degradation)

3. **Created `backend/EMAIL_SETUP.md`**
   - Complete setup guide for SMTP configuration
   - Instructions for Gmail, SendGrid, and other providers
   - Troubleshooting tips
   - Security best practices

### Frontend

4. **Updated `frontend/pages/contact.js`**
   - Added contact form state management (`contactData`)
   - Created `handleContactSubmit` function
   - Created `handleContactInputChange` function
   - Connected all form inputs to state (controlled components)
   - Added success/error message displays
   - Added loading states and button disable during submission
   - Auto-scroll to form on submission
   - Auto-clear form after successful submission (5s delay)

5. **Updated `frontend/pages/gallery.js`**
   - Removed "Photos (13)" title header from gallery

## Environment Variables Required

Add to `backend/.env`:

```bash
# SMTP Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-specific-password
SMTP_FROM_EMAIL=noreply@connectevents.co
CONTACT_EMAIL=info@connectevents.co
```

## How It Works

1. User fills out contact form (name, email, subject, message)
2. Frontend sends POST request to `/api/forms/contact`
3. Backend validates data with Pydantic
4. EmailService sends formatted email via SMTP
5. Email arrives at `info@connectevents.co` with:
   - Beautiful HTML template
   - Sender's information
   - Reply-To header set to sender's email (for easy replies)
   - Plain text fallback

## Testing

### Local Testing

1. Configure SMTP credentials in `backend/.env`
2. Restart backend: `docker-compose restart backend`
3. Visit http://localhost:3000/contact
4. Fill out and submit the contact form
5. Check inbox at `info@connectevents.co`

### Test SMTP Connection

```bash
docker-compose exec backend python -c "
from services.email_service import EmailService
email = EmailService()
print('✅ Success' if email.test_connection() else '❌ Failed')
"
```

## Deployment Steps

1. **Add environment variables** to production server:
   ```bash
   # SSH into server
   ssh -i ~/.ssh/basb-ec2-key ubuntu@98.81.74.242
   
   # Edit backend .env file
   nano /opt/custom-build/backend/.env
   
   # Add SMTP variables (see above)
   ```

2. **Deploy changes**:
   ```bash
   # From local machine
   ./scripts/deploy.sh
   ```

3. **Test on production**:
   - Visit https://connectevents.co/contact
   - Submit test message
   - Verify email received

4. **Monitor logs**:
   ```bash
   # SSH into server
   docker-compose logs -f backend | grep "Contact form"
   ```

## Email Providers

### Gmail (Good for Testing)
- Free, easy setup
- Requires App Password (2FA must be enabled)
- Daily limit: ~500 emails
- May go to spam if not configured properly

### SendGrid (Recommended for Production)
- Free tier: 100 emails/day
- Professional email infrastructure
- Better deliverability
- Detailed analytics
- Easy setup with API key

### Mailgun
- Free tier: 5,000 emails/month
- Good for high-volume sending
- Requires domain verification

## Security Considerations

- ✅ SMTP credentials stored in environment variables (never in code)
- ✅ Pydantic validation prevents malicious input
- ✅ Rate limiting should be added to prevent spam (future enhancement)
- ✅ Email template escapes HTML to prevent XSS
- ✅ Reply-To header allows easy customer replies
- ✅ Graceful failure if SMTP not configured (form still submits)

## Future Enhancements

1. **Rate Limiting**: Limit form submissions per IP (prevent spam)
2. **Captcha**: Add reCAPTCHA v3 for bot protection
3. **Database Storage**: Store contact form submissions in database
4. **Admin Dashboard**: View all contact form submissions
5. **Auto-Reply**: Send confirmation email to user
6. **Notification Options**: Slack/Discord webhooks for instant notifications

## Files Changed

- `backend/services/email_service.py` (NEW)
- `backend/routes/forms.py` (UPDATED)
- `backend/EMAIL_SETUP.md` (NEW)
- `frontend/pages/contact.js` (UPDATED)
- `frontend/pages/gallery.js` (UPDATED - removed photo count title)

## Cloudinary Fix

- Moved 13 manually uploaded JPG photos from root to `events/photos/` folder
- Gallery now displays all 13 photos correctly
- Photos are accessible at `/gallery` page

## Status

✅ Implementation Complete
⏳ Awaiting SMTP Configuration
⏳ Awaiting Production Deployment
⏳ Awaiting Testing

## Support

For SMTP setup help, see: `backend/EMAIL_SETUP.md`

For issues:
1. Check backend logs: `docker-compose logs backend`
2. Test SMTP connection (see above)
3. Verify environment variables are set correctly
