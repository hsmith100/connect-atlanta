# Contact Form Implementation

## Overview

The contact form on `/contact` saves submissions to DynamoDB and sends an email notification via AWS SES. There is no separate backend service — everything runs inside the FormsLambda.

## How It Works

1. User submits the form (name, email, subject, message)
2. Frontend `POST`s to `/api/forms/contact` (API Gateway → FormsLambda)
3. Lambda handler saves a record to the `connect-email-signups` DynamoDB table with `source: 'contact-form'`
4. Lambda sends an SES email notification to `info@connectevents.co`
5. The submission is visible in the admin page under **Submissions → Contacts & Signups**

## Key Files

| File | Purpose |
|------|---------|
| `lambda/src/handlers/formSubmissions.ts` | `contactForm()` handler |
| `lambda/src/lib/formShared.ts` | `sendEmail()`, DynamoDB client, table constants |
| `frontend/pages/contact.tsx` | Contact form UI |
| `frontend/lib/api/forms.ts` | `submitContactForm()` API call |
| `frontend/components/admin/submissions/EmailSignupsSection.tsx` | Admin view |

## DynamoDB Record Shape

Saved to table: `connect-email-signups` (staging: `connect-staging-email-signups`)

```json
{
  "id": "<uuid>",
  "source": "contact-form",
  "name": "Jane Smith",
  "email": "jane@example.com",
  "subject": "Sponsorship question",
  "message": "Hello...",
  "status": "new",
  "createdAt": "2026-03-16T12:00:00Z"
}
```

## Email Configuration

Email is sent via AWS SES from `info@connectevents.co` to `info@connectevents.co`.

SES is configured in `ConnectBackendStack` (CDK). The sender domain (`connectevents.co`) is verified in SES — no additional setup is needed unless the domain or sending address changes.

There are no SMTP credentials or third-party email providers involved.

## Environment Differences

| Environment | DynamoDB Table | API Gateway |
|-------------|---------------|-------------|
| Dev | `connect-dev-email-signups` | `https://xfsvqay2a7.execute-api.us-east-1.amazonaws.com` |
| Staging | `connect-staging-email-signups` | `https://io4y5nj3dg.execute-api.us-east-1.amazonaws.com` |
| Production | `connect-email-signups` | (via CloudFront rewrite) |

## Admin Access

Submissions are visible at `/admin` → **Submissions** tab → **Contacts & Signups** section. Filter by date and export to CSV from there.

## Troubleshooting

**Form submits successfully but no email arrives**
- Check SES sending limits and suppression list in the AWS console (us-east-1)
- Verify `info@connectevents.co` is not on the SES suppression list
- Check FormsLambda CloudWatch logs for SES errors

**Submission not appearing in admin**
- Confirm the record exists in DynamoDB (`connect-email-signups`, `source = 'contact-form'`)
- Check the date filter in the admin Submissions tab
