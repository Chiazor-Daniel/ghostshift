# Mailtrap Setup Instructions

## Issue

The API token you provided (`ba39912a147d84997b5f003935e6f321`) appears to be the **SMTP password**, not the **API token**.

## Solution

To get the correct API token:

1. **Go to Mailtrap Dashboard**: https://mailtrap.io
2. **Click on "Settings"** in the left sidebar
3. **Copy the "API Token"** (format: `token_XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX`)
4. **Update the `.env` file** with the correct API token

## Current `.env` Configuration

```env
# Email (SMTP) - Mailtrap (Free testing)
SMTP_USER=ba39912a147d84997b5f003935e6f321
SMTP_PASSWORD=ba39912a147d84997b5f003935e6f321
SMTP_FROM=noreply@ghostshift.com
```

## What You Need to Do

1. **Get the API token from Mailtrap**:
   - Go to https://mailtrap.io
   - Click on "Settings" in the left sidebar
   - Copy the "API Token" (format: `token_XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX`)

2. **Update the `.env` file**:
   ```env
   SMTP_USER=ba39912a147d84997b5f003935e6f321
   SMTP_PASSWORD=token_your-actual-api-token-here
   SMTP_FROM=noreply@ghostshift.com
   ```

3. **Test the email**:
   ```bash
   source venv/bin/activate
   python test_email.py
   ```

## Alternative: Use Gmail SMTP

If you want to use Gmail instead:

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
SMTP_FROM=noreply@ghostshift.com
```

To get a Gmail App Password:
1. Go to Google Account settings
2. Enable 2-Step Verification
3. Generate App Password: https://support.google.com/accounts/answer/185833
