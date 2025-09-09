# Database Schema

## Contacts Table
```sql
CREATE TABLE contacts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100),
  email VARCHAR(255),
  phone VARCHAR(20),
  birthday DATE,
  relationship_type VARCHAR(50), -- 'family', 'friend', 'colleague', 'other'
  contact_frequency VARCHAR(20), -- 'weekly', 'monthly', 'quarterly', 'annually'
  last_contacted DATE,
  next_contact_due DATE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
