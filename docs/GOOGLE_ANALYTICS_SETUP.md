# Google Analytics 4 Setup Guide

## Overview
Google Analytics 4 (GA4) has been integrated into the Connect Events website to track visitor behavior, form submissions, and site performance.

## What's Already Implemented

### ✅ Tracking Features
1. **Page View Tracking** - Automatically tracks every page visit
2. **Form Submission Tracking** - Tracks all form completions:
   - DJ/Artist Applications
   - Vendor Applications
   - Volunteer Applications
   - Email Signup
   - Contact Form submissions
3. **Event Tracking** - Ready for custom events
4. **Route Change Tracking** - Tracks navigation between pages

### ✅ Performance Optimized
- Async loading (doesn't block page rendering)
- Conditional loading (only loads if GA ID is configured)
- No impact on Core Web Vitals

---

## Setup Instructions

### Step 1: Create Google Analytics 4 Property

1. Go to [Google Analytics](https://analytics.google.com/)
2. Sign in with your Google account
3. Click **Admin** (gear icon in bottom left)
4. Under "Property" column, click **Create Property**
5. Fill in:
   - **Property name**: Connect Events - Beats on the Beltline
   - **Reporting time zone**: (GMT-05:00) Eastern Time
   - **Currency**: USD - US Dollar
6. Click **Next**
7. Choose business details:
   - **Industry**: Arts & Entertainment
   - **Business size**: Small (1-10 employees)
8. Choose objectives: Select **Generate leads** and **Examine user behavior**
9. Click **Create**
10. Accept Terms of Service

### Step 2: Get Your Measurement ID

1. In Admin, under **Property**, click **Data Streams**
2. Click **Add stream** → **Web**
3. Enter:
   - **Website URL**: https://connectevents.co
   - **Stream name**: Connect Events Website
4. Click **Create stream**
5. Copy your **Measurement ID** (format: `G-XXXXXXXXXX`)

### Step 3: Add Measurement ID to Production Server

**On your production server:**

```bash
# SSH into server
ssh -i ~/.ssh/basb-ec2-key ubuntu@98.81.74.242

# Navigate to frontend directory
cd /opt/custom-build/Connect_site/frontend

# Edit the .env file
sudo nano .env

# Add this line (replace with your actual Measurement ID):
NEXT_PUBLIC_GA_ID=G-XXXXXXXXXX

# Save and exit (Ctrl+X, Y, Enter)
```

**Rebuild and restart the frontend container:**

```bash
cd /opt/custom-build/Connect_site
sudo docker-compose -f docker-compose.prod.yml up -d --build frontend
```

### Step 4: Verify Tracking is Working

1. Go to Google Analytics
2. Click **Reports** → **Realtime**
3. Visit your website: https://connectevents.co
4. You should see your visit appear in the Realtime report within 30 seconds
5. Test a form submission and check if the event appears

---

## What You Can Track

### Key Metrics Available

1. **Traffic Sources**
   - See where visitors come from (Instagram, TikTok, Google, Direct)
   - Track social media campaign effectiveness
   - Monitor referrals from other websites

2. **Popular Pages**
   - Which pages get the most visits
   - How long people stay on each page
   - Page exit rates

3. **Form Conversions**
   - DJ Application submissions
   - Vendor Application submissions
   - Volunteer signups
   - Email list growth
   - Contact form inquiries

4. **User Behavior**
   - New vs returning visitors
   - Geographic location (cities/countries)
   - Device types (mobile vs desktop)
   - Browser and OS

5. **Event Flow**
   - See the path users take through your site
   - Identify drop-off points
   - Understand user journey

### Important Reports to Check

**Weekly:**
- **Reports** → **Acquisition** → **Traffic acquisition**
  - See which social platforms drive the most traffic
  
- **Reports** → **Engagement** → **Events**
  - Track form submissions by type
  - See which forms convert best

**Monthly:**
- **Reports** → **User** → **Demographics**
  - Age and gender of audience
  
- **Reports** → **User** → **Tech** → **Devices**
  - Mobile vs desktop usage

**Before Each Event:**
- **Reports** → **Realtime**
  - Watch live traffic spikes
  - Monitor event page visits

---

## Custom Events Tracked

All form submissions send custom events to GA4:

| Event Name | Category | Label |
|------------|----------|-------|
| form_submission | Forms | DJ Application |
| form_submission | Forms | Vendor Application |
| form_submission | Forms | Volunteer Application |
| form_submission | Forms | Email Signup |
| form_submission | Forms | Contact Form |

You can find these under **Reports** → **Engagement** → **Events** → **form_submission**

---

## Troubleshooting

### Not Seeing Data?

1. **Check the Measurement ID is correct**
   ```bash
   ssh -i ~/.ssh/basb-ec2-key ubuntu@98.81.74.242
   cat /opt/custom-build/Connect_site/frontend/.env | grep GA_ID
   ```

2. **Verify container was rebuilt**
   ```bash
   ssh -i ~/.ssh/basb-ec2-key ubuntu@98.81.74.242
   sudo docker logs connect-frontend-nextjs | grep "GA"
   ```

3. **Check browser console** 
   - Open your website
   - Press F12 to open Developer Tools
   - Check Console tab for any errors
   - Look for network requests to `googletagmanager.com`

4. **Clear cache and cookies**
   - Hard refresh the page (Ctrl+Shift+R or Cmd+Shift+R)
   - Try in incognito/private browsing mode

### Data Showing But Forms Not Tracked?

- Forms are tracked on **successful submission**
- Test by actually submitting a form
- Check **Reports** → **Engagement** → **Events** (may take 24-48 hours for first events)
- Use **Reports** → **Realtime** → **Event count by Event name** for immediate validation

---

## Privacy & Compliance

### Already Configured
- ✅ IP Anonymization enabled by default in GA4
- ✅ Privacy Policy page includes GA4 disclosure
- ✅ Cookie Policy page explains analytics cookies
- ✅ No personally identifiable information (PII) is sent to GA

### Best Practices
- Don't manually add user emails or names to custom dimensions
- The integration automatically respects Do Not Track signals
- Consider adding a cookie consent banner if expanding to EU traffic

---

## Next Steps (Optional Enhancements)

1. **Enhanced E-commerce Tracking** (if you sell merch online in the future)
2. **Google Search Console Integration** - Connect for SEO insights
3. **Google Ads Integration** - If running paid campaigns
4. **Custom Dashboards** - Create focused views for specific metrics
5. **Microsoft Clarity** - Add visual behavior tracking (heatmaps, recordings)

---

## Support

- **Google Analytics Help**: https://support.google.com/analytics
- **GA4 Documentation**: https://developers.google.com/analytics/devguides/collection/ga4
- **Community Forum**: https://support.google.com/analytics/community

---

## Files Modified

- `/frontend/lib/gtag.js` - GA utility functions
- `/frontend/pages/_app.js` - Page view tracking
- `/frontend/pages/_document.js` - GA4 script injection
- `/frontend/pages/contact.js` - Contact form & email signup tracking
- `/frontend/pages/join.js` - DJ, Vendor, Volunteer form tracking
- `/frontend/.env` - Measurement ID configuration
