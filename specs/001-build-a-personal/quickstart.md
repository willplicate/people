# Quickstart Guide: Personal CRM System

**Version**: 1.0.0  
**Date**: 2025-09-11  
**Purpose**: Validate core user stories through end-to-end testing

## Prerequisites

- Node.js 18+
- PostgreSQL database (local or Supabase)
- Environment variables configured
- Application deployed and running

## Core User Journey Validation

### Story 1: Contact Creation and Management

**Test**: Create a new contact with communication frequency
```bash
# Via API
curl -X POST http://localhost:3000/api/contacts \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "John",
    "lastName": "Doe", 
    "birthday": "1990-06-15",
    "communicationFrequency": "monthly",
    "notes": "College friend, works at tech company"
  }'
```

**Expected Result**: Contact created with ID returned, communication reminder scheduled for 30 days from now

**Via Web UI**:
1. Navigate to `/contacts/new`
2. Fill in contact form with required fields
3. Set communication frequency to "monthly"
4. Click "Save Contact"
5. Verify contact appears in contacts list
6. Verify reminder appears in dashboard

### Story 2: Add Contact Information

**Test**: Add multiple contact methods
```bash
# Add phone number
curl -X POST http://localhost:3000/api/contacts/{contactId}/contact-info \
  -H "Content-Type: application/json" \
  -d '{
    "type": "phone",
    "label": "mobile",
    "value": "+1-555-0123",
    "isPrimary": true
  }'

# Add email
curl -X POST http://localhost:3000/api/contacts/{contactId}/contact-info \
  -H "Content-Type: application/json" \
  -d '{
    "type": "email", 
    "label": "work",
    "value": "john@example.com",
    "isPrimary": true
  }'
```

**Expected Result**: Contact information stored, primary flags set correctly

### Story 3: Birthday Reminder System

**Test**: Verify birthday reminders are generated
```bash
# Check reminders for contact with birthday
curl http://localhost:3000/api/reminders?type=birthday_week

# Check today's birthday reminders  
curl http://localhost:3000/api/reminders?type=birthday_day
```

**Expected Result**: 
- 7-day advance reminder created for contacts with upcoming birthdays
- Day-of reminder created for today's birthdays
- Reminders include contact details and appropriate messaging

**Manual Test**:
1. Create contact with birthday in 6 days
2. Run birthday reminder job
3. Verify reminder appears in dashboard
4. Verify reminder notification is sent

### Story 4: Interaction Logging

**Test**: Log interaction and verify reminder reset
```bash
# Add interaction
curl -X POST http://localhost:3000/api/contacts/{contactId}/interactions \
  -H "Content-Type: application/json" \
  -d '{
    "type": "call",
    "notes": "Caught up about work and family. Plans to visit next month.",
    "interactionDate": "2025-09-11T14:30:00Z"
  }'

# Verify contact lastContactedAt updated
curl http://localhost:3000/api/contacts/{contactId}
```

**Expected Result**: 
- Interaction saved with timestamp
- Contact.lastContactedAt updated to interaction date
- Communication reminder rescheduled based on frequency
- Interaction visible in contact detail view

### Story 5: Dashboard Overview

**Test**: Verify dashboard shows relevant data
```bash
curl http://localhost:3000/api/dashboard
```

**Expected Result**:
```json
{
  "upcomingReminders": [
    {
      "id": "uuid",
      "type": "communication", 
      "contact": {...},
      "scheduledFor": "2025-09-15T10:00:00Z",
      "message": "Time to reach out to John Doe"
    }
  ],
  "overdueContacts": [...],
  "upcomingBirthdays": [...],
  "recentInteractions": [...],
  "stats": {
    "totalContacts": 1,
    "pendingReminders": 2,
    "interactionsThisWeek": 1
  }
}
```

### Story 6: Search and Filter

**Test**: Search contacts by name
```bash
# Search by name
curl "http://localhost:3000/api/contacts?search=John"

# Filter overdue contacts
curl "http://localhost:3000/api/contacts?filter=overdue"

# Filter contacts with upcoming birthdays
curl "http://localhost:3000/api/contacts?filter=upcoming_birthday"
```

**Expected Result**: 
- Search returns matching contacts
- Filters return appropriate subsets
- Results include contact details and status

### Story 7: Reminder Management

**Test**: Dismiss and manage reminders
```bash
# Dismiss a reminder
curl -X POST http://localhost:3000/api/reminders/{reminderId}/dismiss

# Check reminder status updated
curl http://localhost:3000/api/reminders
```

**Expected Result**:
- Reminder status changed to 'dismissed'
- Dismissed reminder no longer appears in pending list
- Contact reminder schedule remains intact

### Story 8: Data Export

**Test**: Export complete data
```bash
curl http://localhost:3000/api/export > backup.json
```

**Expected Result**:
- Complete data export in JSON format
- Includes all contacts, interactions, and reminders
- File can be used for backup/restore

## Performance Validation

### Response Time Tests
```bash
# Test API response times
time curl http://localhost:3000/api/contacts
time curl http://localhost:3000/api/dashboard
time curl http://localhost:3000/api/reminders
```

**Expected Result**: All API calls complete in <200ms

### Load Test (Optional)
```bash
# Test with multiple contacts
for i in {1..50}; do
  curl -X POST http://localhost:3000/api/contacts \
    -H "Content-Type: application/json" \
    -d "{\"firstName\":\"Contact\",\"lastName\":\"$i\",\"communicationFrequency\":\"monthly\"}"
done

# Verify dashboard still loads quickly
time curl http://localhost:3000/api/dashboard
```

**Expected Result**: Dashboard loads in <2s even with 50+ contacts

## Notification System Validation

### Email Notifications (if configured)
1. Set up test contact with birthday tomorrow
2. Run reminder job
3. Verify email sent to configured address
4. Check email contains contact details and appropriate message

### Web Push Notifications (if configured)
1. Subscribe to push notifications in browser
2. Create overdue contact reminder
3. Run reminder job  
4. Verify push notification received
5. Click notification to navigate to contact

## Error Handling Tests

### Invalid Data
```bash
# Test invalid contact creation
curl -X POST http://localhost:3000/api/contacts \
  -H "Content-Type: application/json" \
  -d '{"firstName":"","lastName":"Doe"}'
```

**Expected Result**: 400 error with validation message

### Missing Resources
```bash
# Test nonexistent contact
curl http://localhost:3000/api/contacts/00000000-0000-0000-0000-000000000000
```

**Expected Result**: 404 error with appropriate message

## Success Criteria

- ✅ All API endpoints return expected data structures
- ✅ Contact creation triggers appropriate reminders
- ✅ Birthday reminders generated at correct times
- ✅ Interaction logging updates reminder schedules
- ✅ Dashboard provides meaningful overview
- ✅ Search and filtering work correctly
- ✅ Data export produces complete backup
- ✅ Response times meet performance goals
- ✅ Error handling provides clear feedback
- ✅ Notification system delivers alerts reliably

## Troubleshooting

### Common Issues

**Reminders not generating**: 
- Check background job scheduler is running
- Verify database triggers are properly configured
- Check reminder calculation logic for edge cases

**Birthday reminders wrong dates**:
- Verify timezone configuration
- Check leap year handling (Feb 29 → Feb 28)
- Confirm date parsing and storage format

**Performance issues**:
- Check database indexes are created
- Verify connection pooling is configured
- Monitor query execution times

**Notifications not sending**:
- Verify email/push notification service configuration
- Check service credentials and permissions
- Test notification services independently

This quickstart validates that the Personal CRM system meets all functional requirements and provides a reliable foundation for long-term relationship management.