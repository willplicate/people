/**
 * Generate the correct authorization URL for Google Photos
 */
const { google } = require('googleapis')
const fs = require('fs')
const path = require('path')

const SCOPES = ['https://www.googleapis.com/auth/photoslibrary.readonly']
const CREDENTIALS_PATH = path.join(__dirname, 'google-photos-credentials.json')

// Load credentials
const credentials = JSON.parse(fs.readFileSync(CREDENTIALS_PATH))
const { client_secret, client_id, redirect_uris } = credentials.installed || credentials.web

console.log('Using credentials:')
console.log('  Client ID:', client_id)
console.log('  Redirect URI:', redirect_uris[0])
console.log()

const oAuth2Client = new google.auth.OAuth2(
  client_id,
  client_secret,
  redirect_uris[0]
)

const authUrl = oAuth2Client.generateAuthUrl({
  access_type: 'offline',
  scope: SCOPES,
})

console.log('Authorization URL:')
console.log(authUrl)
