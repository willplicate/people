# Data Model: Personal CRM System

**Date**: 2025-09-11  
**Feature**: Personal CRM System  
**Status**: Design Phase

## Core Entities

### Contact
Represents a person in the user's personal network.

**Fields**:
- `id`: UUID (Primary Key)
- `firstName`: string (required)
- `lastName`: string (optional)
- `nickname`: string (optional)
- `birthday`: Date (month/day only, optional)
- `communicationFrequency`: enum (weekly|monthly|quarterly|biannually|annually, optional)
- `lastContactedAt`: DateTime (optional)
- `remindersPaused`: boolean (default: false)
- `notes`: string (general notes about person, optional)
- `createdAt`: DateTime (auto)
- `updatedAt`: DateTime (auto)

**Validation Rules**:
- firstName must be 1-50 characters
- lastName must be 0-50 characters  
- nickname must be 0-30 characters
- birthday stored as MM-DD format (timezone independent)
- communicationFrequency defaults to null (no reminders)

### ContactInfo
Stores multiple contact methods per person (phone, email, address).

**Fields**:
- `id`: UUID (Primary Key)
- `contactId`: UUID (Foreign Key → Contact.id, cascade delete)
- `type`: enum (phone|email|address)
- `label`: string (home|work|mobile|other)
- `value`: string (phone number, email, or formatted address)
- `isPrimary`: boolean (default: false)
- `createdAt`: DateTime (auto)
- `updatedAt`: DateTime (auto)

**Validation Rules**:
- Only one primary contact info per type per contact
- Phone numbers stored in E.164 format
- Email addresses validated via regex
- Addresses stored as formatted strings

### Interaction
Records of communication or meetings with contacts.

**Fields**:
- `id`: UUID (Primary Key)
- `contactId`: UUID (Foreign Key → Contact.id, cascade delete)
- `type`: enum (call|text|email|meetup|other)
- `notes`: text (required, what was discussed)
- `interactionDate`: DateTime (when interaction occurred, required)
- `createdAt`: DateTime (auto)
- `updatedAt`: DateTime (auto)

**Validation Rules**:
- notes must be 1-2000 characters
- interactionDate cannot be in the future
- interactionDate updates Contact.lastContactedAt

### Reminder
Scheduled notifications for communication and birthdays.

**Fields**:
- `id`: UUID (Primary Key)
- `contactId`: UUID (Foreign Key → Contact.id, cascade delete)
- `type`: enum (communication|birthday_week|birthday_day)
- `scheduledFor`: DateTime (when reminder should fire)
- `status`: enum (pending|sent|dismissed)
- `message`: string (reminder text)
- `createdAt`: DateTime (auto)
- `sentAt`: DateTime (optional)

**Validation Rules**:
- scheduledFor must be in the future for pending reminders
- message must be 1-200 characters
- Birthday reminders auto-generated from Contact.birthday

## Relationships

### One-to-Many
- **Contact** → **ContactInfo** (one contact has multiple contact methods)
- **Contact** → **Interaction** (one contact has multiple interaction records)
- **Contact** → **Reminder** (one contact has multiple reminders)

### Business Rules

#### Communication Frequency Logic
- When `communicationFrequency` is set, system calculates next reminder date based on `lastContactedAt`
- Frequency intervals:
  - weekly: 7 days
  - monthly: 30 days  
  - quarterly: 90 days
  - biannually: 180 days
  - annually: 365 days

#### Birthday Reminder Logic
- If Contact has birthday, system generates two reminders annually:
  - 7 days before: birthday_week reminder
  - On birthday: birthday_day reminder
- Handles leap year birthdays (Feb 29 → Feb 28 on non-leap years)

#### Interaction Updates
- Creating new Interaction updates Contact.lastContactedAt
- This resets communication reminder schedule
- System recalculates next communication reminder

#### Reminder Management
- Reminders with status 'pending' are eligible for notification
- When reminder is sent, status changes to 'sent', sentAt is set
- Users can dismiss reminders (status changes to 'dismissed')
- Birthday reminders regenerate annually

## State Transitions

### Contact States
```
New Contact → Has Communication Frequency → Generates Communication Reminders
New Contact → Has Birthday → Generates Birthday Reminders  
Contact → Interaction Added → lastContactedAt Updated → Communication Reminders Reset
Contact → Reminders Paused → No New Reminders Generated
```

### Reminder States
```
Pending → Sent (when notification delivered)
Pending → Dismissed (when user dismisses)
Sent → [Terminal State]
Dismissed → [Terminal State]
```

## Database Indexes

### Performance Indexes
- `Contact.communicationFrequency` + `Contact.lastContactedAt` (reminder queries)
- `Contact.birthday` (birthday reminder queries)
- `Reminder.scheduledFor` + `Reminder.status` (notification queries)
- `Interaction.contactId` + `Interaction.interactionDate` (interaction history)
- `ContactInfo.contactId` + `ContactInfo.isPrimary` (primary contact lookup)

### Search Indexes
- Full-text search on `Contact.firstName`, `Contact.lastName`, `Contact.nickname`
- `Interaction.notes` for interaction search

## Data Integrity

### Constraints
- Contact must have at least firstName
- Only one primary ContactInfo per type per Contact
- Interaction.interactionDate triggers Contact.lastContactedAt update
- Birthday reminders only created if Contact.birthday exists
- Communication reminders only created if Contact.communicationFrequency exists

### Cascade Rules
- Delete Contact → Delete all ContactInfo, Interactions, Reminders
- Soft delete option for Contacts (for data retention)
- Archive old Reminders (status 'sent' older than 1 year)