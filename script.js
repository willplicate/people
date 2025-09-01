// -------------------
// IMPORTANT: REPLACE WITH YOUR SUPABASE CREDENTIALS
// -------------------
const SUPABASE_URL = 'YOUR_SUPABASE_URL'; // Make sure this is correct
const SUPABASE_ANON_KEY = 'YOUR_SUPABASE_ANON_KEY'; // Make sure this is correct

// Initialize the Supabase client
// FIX: Renamed the variable to 'supabaseClient' to avoid conflict
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// DOM elements
const contactsTableBody = document.getElementById('contacts-tbody');
const addContactForm = document.getElementById('add-contact-form');

// --- FUNCTIONS ---

/**
 * Fetches all contacts from the database and displays them in the table.
 */
const fetchContacts = async () => {
    // Clear the table first
    contactsTableBody.innerHTML = '';

    // FIX: Used 'supabaseClient' to make the database call
    const { data: contacts, error } = await supabaseClient
        .from('contacts')
        .select('*')
        .order('last_contact_date', { ascending: true, nullsFirst: true });

    if (error) {
        console.error('Error fetching contacts:', error);
        return;
    }

    // Populate the table with contacts
    for (const contact of contacts) {
        const row = document.createElement('tr');

        // Apply highlighting based on last contact date
        if (contact.last_contact_date) {
            const lastContact = new Date(contact.last_contact_date);
            const now = new Date();
            const daysSinceContact = (now - lastContact) / (1000 * 60 * 60 * 24);

            if (daysSinceContact > 120) {
                row.classList.add('highlight-red');
            } else if (daysSinceContact > 60) {
                row.classList.add('highlight-yellow');
            }
        } else {
             row.classList.add('highlight-red'); // Highlight if never contacted
        }
        
        // Birthday emoji logic
        let birthdayDisplay = contact.birthday || 'N/A';
        if (contact.birthday) {
            const birthday = new Date(contact.birthday + 'T00:00:00'); // Treat as local timezone
            const today = new Date();
            birthday.setFullYear(today.getFullYear()); // Check for this year's birthday
            const daysUntilBirthday = (birthday - today) / (1000 * 60 * 60 * 24);

            if (daysUntilBirthday >= 0 && daysUntilBirthday <= 30) {
                birthdayDisplay += ' 🎂';
            }
        }
        
        row.innerHTML = `
            <td>${contact.full_name}</td>
            <td>${contact.relationship || ''}</td>
            <td>${contact.last_contact_date || 'Never'}</td>
            <td>${birthdayDisplay}</td>
            <td>${contact.phone || ''}<br>${contact.email || ''}</td>
            <td><button onclick="logInteraction('${contact.id}')">Log Interaction</button></td>
        `;
        contactsTableBody.appendChild(row);
    }
};


/**
 * Handles the submission of the "Add Contact" form. (This includes the frequency dropdown)
 */
addContactForm.addEventListener('submit', async (event) => {
    event.preventDefault();

    const fullName = document.getElementById('full-name').value;
    const relationship = document.getElementById('relationship').value;
    const phone = document.getElementById('phone').value;
    const email = document.getElementById('email').value;
    const birthday = document.getElementById('birthday').value;
    const contactFrequency = document.getElementById('contact-frequency').value;

    // FIX: Used 'supabaseClient' to insert data
    const { error } = await supabaseClient
        .from('contacts')
        .insert({
            full_name: fullName,
            relationship: relationship,
            phone: phone,
            email: email,
            birthday: birthday || null,
            contact_frequency: contactFrequency,
        });

    if (error) {
        console.error('Error adding contact:', error);
    } else {
        addContactForm.reset();
        fetchContacts(); // Refresh the table
    }
});


/**
 * Placeholder function for logging an interaction.
 */
const logInteraction = (contactId) => {
    alert(`This will log an interaction for contact ID: ${contactId}`);
};


// --- INITIAL LOAD ---

// Fetch contacts when the page loads
fetchContacts();
