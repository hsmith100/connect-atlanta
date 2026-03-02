# Google Sheets Integration Setup

This document explains how to set up Google Sheets integration for form submissions.

## Overview

The Connect Events website submits form data to **both** the PostgreSQL database AND Google Sheets spreadsheets. This provides a backup and allows the client to view submissions in a familiar spreadsheet interface.

## Google Sheets URLs

- **Vendor Applications**: https://docs.google.com/spreadsheets/d/1SUbvzglTqd6iFmAe69XRB__0APhSKfRUHl1zpHUGs-A
- **Volunteer Applications**: https://docs.google.com/spreadsheets/d/1-V9HV0AJWqdz0yqIrNQuC2quzGGBFGsRGW5hjfbqZCA
- **DJ Applications**: https://docs.google.com/spreadsheets/d/1EF3DzG4OjayDjsZtWNezsPh6EwDKKMJWKIAr67LtGls

## Setup Instructions

### 1. Create a Google Cloud Project

1. Go to the [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project (or select an existing one)
3. Enable the **Google Sheets API** and **Google Drive API**

### 2. Create Service Account Credentials

1. In Google Cloud Console, go to **IAM & Admin** > **Service Accounts**
2. Click **Create Service Account**
3. Give it a name like "Connect Events Forms"
4. Click **Create and Continue**
5. Skip granting roles (click **Continue**)
6. Click **Done**
7. Click on the service account you just created
8. Go to the **Keys** tab
9. Click **Add Key** > **Create New Key**
10. Choose **JSON** format
11. Click **Create** - this will download a JSON file

### 3. Share Spreadsheets with Service Account

1. Open the JSON file you downloaded
2. Copy the `client_email` value (looks like `xxxxx@xxxxx.iam.gserviceaccount.com`)
3. Open each of the three Google Sheets (vendor, volunteer, DJ)
4. Click the **Share** button
5. Paste the service account email
6. Give it **Editor** permissions
7. Click **Send**

### 4. Configure Environment Variables

You have two options:

#### Option A: Use JSON File (Recommended for local development)

1. Save the JSON file to a secure location (e.g., `/etc/secrets/google-credentials.json`)
2. Add to your `.env` file:

```bash
GOOGLE_CREDENTIALS_PATH=/path/to/google-credentials.json
```

#### Option B: Use JSON String (Recommended for production/Docker)

1. Copy the entire contents of the JSON file
2. Minify it (remove line breaks and extra spaces)
3. Add to your `.env` file:

```bash
GOOGLE_CREDENTIALS_JSON='{"type":"service_account","project_id":"your-project",...}'
```

### 5. Expected Spreadsheet Format

Each spreadsheet should have the following columns in the first row:

#### Vendor Applications
- Timestamp
- Business Name
- Contact Name
- Email
- Phone
- Business Type
- Description
- Website
- Instagram
- Previous Experience

#### Volunteer Applications
- Timestamp
- Name
- Email
- Phone
- Availability
- Skills
- Previous Experience
- Why Volunteer
- Emergency Contact Name
- Emergency Contact Phone

#### DJ Applications
- Timestamp
- Artist Name
- Real Name
- Email
- Phone
- Genre
- Subgenres
- Experience Years
- Bio
- SoundCloud
- Spotify
- Instagram
- Facebook
- YouTube
- Mixcloud
- Website
- Equipment
- Past Performances
- References

## Testing

1. Restart your backend server
2. Submit a test form through the website
3. Check that the data appears in both:
   - PostgreSQL database
   - Corresponding Google Sheet

## Troubleshooting

### Forms work but Google Sheets not updating

- Check that the service account email has Editor access to all three sheets
- Verify the credentials file path is correct
- Check backend logs for Google Sheets errors

### "No Google Sheets credentials configured" warning

- Make sure either `GOOGLE_CREDENTIALS_PATH` or `GOOGLE_CREDENTIALS_JSON` is set in your `.env` file
- The application will still work (saving to database only) without Google Sheets credentials

### Permission denied errors

- Make sure you shared all three spreadsheets with the service account email
- Ensure Editor permissions were granted (not just Viewer)

## Security Notes

- **Never** commit the Google credentials JSON file to git
- Add `google-credentials.json` to your `.gitignore`
- In production, use environment variables or secrets management
- Rotate credentials if they are ever exposed
