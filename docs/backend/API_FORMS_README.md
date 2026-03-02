# Forms API Documentation

This directory contains API endpoints for form submissions on the Connect Events website.

## Sponsor Inquiry Form Integration

The `sponsor-inquiry.js` endpoint is currently set up as a placeholder. To fully integrate it with your database and Google Sheets, follow these steps:

### Database Integration

1. **Install a database client** (if not already installed):
   ```bash
   npm install mongodb
   # OR for PostgreSQL
   npm install pg
   ```

2. **Add environment variables** to your `.env.local` file:
   ```
   DATABASE_URL=your_database_connection_string
   ```

3. **Update the endpoint** to save to your database:
   ```javascript
   // Example for MongoDB
   import { MongoClient } from 'mongodb'
   
   const client = new MongoClient(process.env.DATABASE_URL)
   await client.connect()
   const db = client.db('connect_events')
   await db.collection('sponsor_inquiries').insertOne({
     name,
     email,
     phone,
     company,
     productIndustry,
     submittedAt: new Date(),
   })
   await client.close()
   ```

### Google Sheets Integration

1. **Install the Google Sheets library**:
   ```bash
   npm install google-spreadsheet
   ```

2. **Set up Google Service Account**:
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Create a new project or select an existing one
   - Enable the Google Sheets API
   - Create a Service Account and download the JSON key
   - Share your Google Sheet with the service account email

3. **Add environment variables**:
   ```
   GOOGLE_SHEET_ID=your_google_sheet_id
   GOOGLE_SERVICE_ACCOUNT_EMAIL=your_service_account_email
   GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
   ```

4. **Update the endpoint**:
   ```javascript
   import { GoogleSpreadsheet } from 'google-spreadsheet'
   
   const doc = new GoogleSpreadsheet(process.env.GOOGLE_SHEET_ID)
   await doc.useServiceAccountAuth({
     client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
     private_key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
   })
   await doc.loadInfo()
   const sheet = doc.sheetsByTitle['Sponsor Inquiries'] // Or create a new sheet
   await sheet.addRow({
     Name: name,
     Email: email,
     Phone: phone,
     Company: company,
     'Product/Industry': productIndustry,
     Timestamp: new Date().toISOString(),
   })
   ```

### Email Notification Integration

To send email notifications when a sponsor inquiry is submitted:

1. **Install an email service**:
   ```bash
   npm install @sendgrid/mail
   # OR
   npm install nodemailer
   ```

2. **Add environment variables**:
   ```
   SENDGRID_API_KEY=your_api_key
   NOTIFICATION_EMAIL=info@connectevents.co
   ```

3. **Update the endpoint**:
   ```javascript
   import sgMail from '@sendgrid/mail'
   
   sgMail.setApiKey(process.env.SENDGRID_API_KEY)
   
   await sgMail.send({
     to: process.env.NOTIFICATION_EMAIL,
     from: process.env.NOTIFICATION_EMAIL,
     subject: 'New Sponsor Inquiry',
     html: `
       <h2>New Sponsor Inquiry Submission</h2>
       <p><strong>Name:</strong> ${name}</p>
       <p><strong>Email:</strong> ${email}</p>
       <p><strong>Phone:</strong> ${phone}</p>
       <p><strong>Company:</strong> ${company}</p>
       <p><strong>Product/Industry:</strong> ${productIndustry}</p>
     `,
   })
   ```

## Other Form Endpoints

The following endpoints may also need integration (check their respective files):
- `artist-application.js`
- `vendor-application.js`
- `volunteer-application.js`
- `email-signup.js`
- `contact.js`

## Security Notes

- Always validate and sanitize user input
- Use environment variables for sensitive data
- Implement rate limiting to prevent spam
- Consider adding CAPTCHA for form submissions
- Keep your service account keys secure and never commit them to version control
