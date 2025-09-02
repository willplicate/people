// -------------------
// IMPORTANT: REPLACE WITH YOUR SUPABASE CREDENTIALS
// -------------------
const SUPABASE_URL = 'https://tdclhoimzksmqmnsaccw.supabase.co'; // Make sure this is correct
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRkY2xob2ltemtzbXFtbnNhY2N3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY2NzAxMjUsImV4cCI6MjA3MjI0NjEyNX0.lkxHRLuT4liiDJWt4AnSk24rFY5E3sceyApZ7kVTGL4'; // Make sure this is correct

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
        
        // This is inside the fetchContacts function in script.js
row.innerHTML = `
    <td>${contact.full_name}</td>
    <td>${contact.relationship || ''}</td>
    <td>${contact.last_contact_date || 'Never'}</td>
    <td>${birthdayDisplay}</td>
    <td>${contact.phone || ''}<br>${contact.email || ''}</td>
    <td>
        <button onclick="logInteraction('${contact.id}')">Log</button>
        <button onclick="viewLog('${contact.id}')">View Log</button>
    </td>
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
 * Logs an interaction for a specific contact.
 */
const logInteraction = async (contactId) => {
    // 1. Ask the user for notes using a simple popup prompt.
    const notes = prompt("Enter notes for this interaction (e.g., 'Met for coffee, discussed trip to Italy'):");

/**
 * Fetches and displays the interaction log for a specific contact.
 */
const viewLog = async (contactId) => {
    // 1. Fetch all interactions for this specific contact from the database.
    const { data: interactions, error } = await supabaseClient
        .from('interactions')
        .select('created_at, notes') // Only get the columns we need
        .eq('contact_id', contactId) // Filter by the contact's ID
        .order('created_at', { ascending: false }); // Show newest first

    if (error) {
        console.error('Error fetching log:', error);
        alert('Could not retrieve interaction log.');
        return;
    }

    // 2. Format the log for display.
    let logHistory = 'Interaction History:\n\n';
    if (interactions.length === 0) {
        logHistory = 'No interactions have been logged for this contact yet.';
    } else {
        for (const interaction of interactions) {
            // Format the date to be more readable
            const date = new Date(interaction.created_at).toLocaleDateString();
            logHistory += `${date}: ${interaction.notes}\n`; // Add each log entry
        }
    }

    // 3. Display the formatted log in a pop-up alert.
    alert(logHistory);
};
    
    // 2. If the user entered notes (and didn't click cancel)
    if (notes) {
        // 3. Save the new interaction to the 'interactions' table.
        const { error: interactionError } = await supabaseClient
            .from('interactions')
            .insert({
                contact_id: contactId,
                notes: notes
            });
        
        if (interactionError) {
            console.error('Error logging interaction:', interactionError);
            alert('Failed to log interaction.');
            return;
        }

        // 4. Update the 'last_contact_date' for the contact in the 'contacts' table.
        const today = new Date().toISOString().split('T')[0]; // Gets today's date as 'YYYY-MM-DD'
        const { error: updateError } = await supabaseClient
            .from('contacts')
            .update({ last_contact_date: today })
            .eq('id', contactId);

        if (updateError) {
            console.error('Error updating last contact date:', updateError);
            alert('Failed to update contact date.');
            return;
        }
        
        // 5. Refresh the entire table to show the new date.
        alert('Interaction logged successfully!');
        fetchContacts();
    }
};


// --- INITIAL LOAD ---

// Fetch contacts when the page loads
fetchContacts();
