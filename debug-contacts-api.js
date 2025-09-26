// Quick debug script to check what the contacts API returns
const fetch = require('node-fetch')

async function debugContactsAPI() {
  try {
    console.log('🔍 Testing contacts API...')

    const response = await fetch('http://localhost:3000/api/contacts')
    const data = await response.json()

    console.log('📊 Response status:', response.status)
    console.log('📋 Response data structure:')
    console.log(JSON.stringify(data, null, 2))

    if (data.contacts) {
      console.log(`\n✅ Found ${data.contacts.length} contacts`)
      data.contacts.forEach((contact, i) => {
        console.log(`  ${i + 1}. ${contact.first_name} ${contact.last_name || ''}`)
      })
    } else {
      console.log('❌ No contacts array found in response')
    }

  } catch (error) {
    console.error('❌ Error:', error.message)
  }
}

debugContactsAPI()