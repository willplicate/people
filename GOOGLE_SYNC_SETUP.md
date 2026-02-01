# Google Contacts Sync Setup Guide

This guide will help you set up Google Contacts synchronization for your Personal CRM.

## Prerequisites

1. **Google Cloud Project**: You need a Google Cloud Project with the People API enabled
2. **OAuth Credentials**: OAuth 2.0 Client ID and Secret for web application
3. **Environment Variables**: Properly configured authentication settings

## Step 1: Google Cloud Console Setup

### 1.1 Create a Google Cloud Project
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Note down your Project ID

### 1.2 Enable People API
1. In the Google Cloud Console, navigate to "APIs & Services" > "Library"
2. Search for "People API"
3. Click on "Google People API" and click "Enable"

### 1.3 Create OAuth 2.0 Credentials
1. Go to "APIs & Services" > "Credentials"
2. Click "Create Credentials" > "OAuth 2.0 Client IDs"
3. Configure the OAuth consent screen if prompted:
   - Application type: External
   - App name: "Personal CRM"
   - User support email: Your email
   - Developer contact email: Your email
4. For Application type, select "Web application"
5. Add authorized redirect URIs:
   - `http://localhost:3000/api/auth/callback/google` (for development)
   - `https://yourdomain.com/api/auth/callback/google` (for production)
6. Save and note down your Client ID and Client Secret

## Step 2: Environment Configuration

### 2.1 Update Environment Variables
Add the following to your `.env.local` file:

```bash
# Google OAuth Configuration (for Contacts sync)
GOOGLE_CLIENT_ID=your_google_oauth_client_id_here
GOOGLE_CLIENT_SECRET=your_google_oauth_client_secret_here

# NextAuth Configuration
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your_nextauth_secret_key_here
```

### 2.2 Generate NextAuth Secret
Generate a random secret for NextAuth:

```bash
# Method 1: Using OpenSSL
openssl rand -base64 32

# Method 2: Using Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

## Step 3: Testing the Setup

### 3.1 Start the Development Server
```bash
npm run dev
```

### 3.2 Test OAuth Flow
1. Navigate to `http://localhost:3000/sync`
2. Click "Sign in with Google"
3. Complete the OAuth authorization
4. You should be redirected back to the sync page

### 3.3 Test Contact Sync
1. After successful authentication, click "Sync Now"
2. Monitor the console for sync progress
3. Check your contacts list for imported contacts

## Step 4: Understanding the Sync Process

### 4.1 What Gets Synced
- **Contact Names**: First name, last name, display name
- **Phone Numbers**: Primary phone number
- **Email Addresses**: Primary email address
- **Addresses**: Primary address
- **Birthdays**: If available in MM-DD format

### 4.2 Sync Behavior
- **New Contacts**: Imported with reminders paused by default
- **Existing Contacts**: Skipped to avoid duplicates
- **Contact Info**: Automatically linked to contacts
- **CRM Control**: You decide which contacts get active CRM management

### 4.3 Post-Sync Workflow
1. Review imported contacts in the Contacts page
2. Set communication frequency for contacts you want to actively manage
3. Enable reminders for important contacts
4. Mark emergency contacts as needed

## Step 5: Production Deployment

### 5.1 Update OAuth Settings
1. Add your production domain to authorized redirect URIs
2. Update `NEXTAUTH_URL` in production environment variables

### 5.2 Security Considerations
- Keep your Google Client Secret secure
- Use HTTPS in production
- Regularly rotate your NextAuth secret
- Monitor API usage and quotas

## Step 6: Troubleshooting

### Common Issues

#### "Redirect URI Mismatch"
- Ensure your redirect URI exactly matches what's configured in Google Cloud Console
- Check for trailing slashes and protocol (http vs https)

#### "Invalid Client ID"
- Verify your `GOOGLE_CLIENT_ID` environment variable
- Ensure the Client ID is for a web application, not other types

#### "Scope Not Authorized"
- Make sure the People API is enabled in your Google Cloud Project
- Check that contacts.readonly scope is requested

#### "No Contacts Imported"
- Verify your Google account has contacts
- Check browser console for error messages
- Review server logs for detailed error information

### Debug Mode
Enable debug logging by adding to your environment:

```bash
NEXTAUTH_DEBUG=true
```

## Step 7: Advanced Features

### 7.1 Automatic Sync (Future Enhancement)
The current implementation supports manual sync. For automatic sync:

1. Set up a cron job to call `/api/sync/cron`
2. Implement token refresh logic
3. Store user preferences for auto-sync frequency

### 7.2 Selective Sync (Future Enhancement)
- Sync only contacts from specific Google contact groups
- Filter contacts by labels or custom criteria
- Two-way sync capabilities

## API Endpoints

- `GET /api/sync/google/auth` - Check authentication status
- `POST /api/sync/google/contacts` - Manual sync trigger
- `GET /api/sync/google/contacts` - Get sync status
- `POST /api/sync/cron` - Background sync endpoint

## Security & Privacy

- **Minimal Permissions**: Only requests read access to contacts
- **Local Storage**: All contact data is stored in your own database
- **No Data Sharing**: No contact information is shared with third parties
- **OAuth Standard**: Uses industry-standard OAuth 2.0 flow

## Support

For issues or questions:
1. Check the troubleshooting section above
2. Review browser console and server logs
3. Verify your Google Cloud Console configuration
4. Ensure all environment variables are correctly set

---

**Note**: This is a prototype implementation. For production use, consider adding:
- User management and multi-tenant support
- Automatic token refresh
- More robust error handling
- Sync conflict resolution
- Rate limiting and quota management