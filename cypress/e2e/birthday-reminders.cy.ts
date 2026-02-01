describe('Birthday Reminder System', () => {
  beforeEach(() => {
    // Setup test data - create a contact with upcoming birthday
    cy.visit('/contacts/new')

    // Calculate a birthday that's in 5 days
    const futureDate = new Date()
    futureDate.setDate(futureDate.getDate() + 5)
    const birthday = `${String(futureDate.getMonth() + 1).padStart(2, '0')}-${String(futureDate.getDate()).padStart(2, '0')}`

    cy.get('[data-cy="first-name"]').type('Birthday')
    cy.get('[data-cy="last-name"]').type('Person')
    cy.get('[data-cy="birthday"]').type(birthday)
    cy.get('[data-cy="communication-frequency"]').select('monthly')
    cy.get('[data-cy="save-contact"]').click()
  })

  it('should display upcoming birthdays on dashboard', () => {
    cy.visit('/')

    // Check dashboard for upcoming birthdays section
    cy.contains('Upcoming Birthdays').should('be.visible')

    // Should show the contact we just created
    cy.contains('Birthday Person').should('be.visible')
    cy.contains('5 days').should('be.visible')
  })

  it('should show birthday reminders in reminders page', () => {
    // Visit reminders page
    cy.visit('/reminders')

    // Should see birthday reminder types explained
    cy.contains('Birthday Soon').should('be.visible')
    cy.contains('7-day advance warning').should('be.visible')
    cy.contains('Birthday Today').should('be.visible')

    // May or may not have active reminders depending on system state
    // This would require more sophisticated test data setup
  })

  it('should filter contacts by upcoming birthdays', () => {
    cy.visit('/contacts')

    // Open filters
    cy.get('[data-cy="filters-toggle"]').click()

    // Enable upcoming birthday filter
    cy.get('[data-cy="upcoming-birthday-filter"]').check()

    // Should show our test contact
    cy.contains('Birthday Person').should('be.visible')

    // Disable filter
    cy.get('[data-cy="upcoming-birthday-filter"]').uncheck()
  })

  it('should handle birthday date validation', () => {
    cy.visit('/contacts/new')

    // Test invalid birthday format
    cy.get('[data-cy="first-name"]').type('Test')
    cy.get('[data-cy="birthday"]').type('invalid-date')
    cy.get('[data-cy="save-contact"]').click()

    // Should show validation error
    cy.contains('Birthday must be in MM-DD format').should('be.visible')

    // Test valid format
    cy.get('[data-cy="birthday"]').clear().type('01-15')
    cy.get('[data-cy="save-contact"]').click()

    // Should save successfully
    cy.url().should('match', /\/contacts\/[a-f0-9-]+$/)
  })

  it('should display birthday information in contact details', () => {
    // Visit the contact we created
    cy.visit('/contacts')
    cy.contains('Birthday Person').click()

    // Should show birthday in contact details
    cy.contains('Birthday:').should('be.visible')

    // Birthday should be displayed in MM-DD format
    cy.get('[data-cy="contact-birthday"]').should('contain', '-')
  })

  afterEach(() => {
    // Clean up - delete the test contact
    // This would require implementing a cleanup mechanism
    // or using a test database that gets reset
  })
})