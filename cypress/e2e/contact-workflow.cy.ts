describe('Contact Workflow', () => {
  beforeEach(() => {
    // Visit the contacts page
    cy.visit('/contacts')
  })

  it('should complete full contact creation and management workflow', () => {
    // Navigate to create new contact
    cy.contains('Add Contact').click()
    cy.url().should('include', '/contacts/new')

    // Fill out contact form
    cy.get('[data-cy="first-name"]').type('John')
    cy.get('[data-cy="last-name"]').type('Doe')
    cy.get('[data-cy="nickname"]').type('Johnny')
    cy.get('[data-cy="birthday"]').type('12-25')
    cy.get('[data-cy="communication-frequency"]').select('monthly')
    cy.get('[data-cy="notes"]').type('Met at the coffee shop downtown')

    // Submit form
    cy.get('[data-cy="save-contact"]').click()

    // Should redirect to contact detail page
    cy.url().should('match', /\/contacts\/[a-f0-9-]+$/)

    // Verify contact details are displayed
    cy.contains('John "Johnny" Doe').should('be.visible')
    cy.contains('Birthday: 12-25').should('be.visible')
    cy.contains('Frequency: monthly').should('be.visible')
    cy.contains('Met at the coffee shop downtown').should('be.visible')

    // Add an interaction
    cy.get('[data-cy="add-interaction"]').click()
    cy.get('[data-cy="interaction-type"]').select('call')
    cy.get('[data-cy="interaction-notes"]').type('Caught up over coffee, discussed vacation plans')
    cy.get('[data-cy="save-interaction"]').click()

    // Verify interaction appears
    cy.contains('Caught up over coffee, discussed vacation plans').should('be.visible')
    cy.contains('call').should('be.visible')

    // Edit contact
    cy.get('[data-cy="edit-contact"]').click()
    cy.get('[data-cy="notes"]').clear().type('Updated notes - friend from college')
    cy.get('[data-cy="save-contact"]').click()

    // Verify update
    cy.contains('Updated notes - friend from college').should('be.visible')

    // Navigate back to contacts list
    cy.contains('Back to Contacts').click()
    cy.url().should('include', '/contacts')

    // Verify contact appears in list
    cy.contains('John "Johnny" Doe').should('be.visible')

    // Search for contact
    cy.get('[data-cy="search-input"]').type('Johnny')
    cy.contains('John "Johnny" Doe').should('be.visible')

    // Clear search
    cy.get('[data-cy="search-input"]').clear()

    // Filter by communication frequency
    cy.get('[data-cy="filters-toggle"]').click()
    cy.get('[data-cy="frequency-filter"]').select('monthly')
    cy.contains('John "Johnny" Doe').should('be.visible')
  })

  it('should handle contact deletion', () => {
    // This test assumes a contact exists from the previous test
    // In a real scenario, you'd want to create test data in beforeEach

    cy.contains('John').click()
    cy.get('[data-cy="delete-contact"]').click()

    // Confirm deletion
    cy.get('[data-cy="confirm-delete"]').click()

    // Should redirect to contacts list
    cy.url().should('include', '/contacts')

    // Contact should no longer exist
    cy.contains('John "Johnny" Doe').should('not.exist')
  })

  it('should validate required fields', () => {
    cy.contains('Add Contact').click()

    // Try to submit without required fields
    cy.get('[data-cy="save-contact"]').click()

    // Should show validation error
    cy.contains('First name is required').should('be.visible')

    // Should not navigate away
    cy.url().should('include', '/contacts/new')
  })

  it('should handle navigation between pages', () => {
    // Test navigation from dashboard
    cy.visit('/')
    cy.contains('Personal CRM Dashboard').should('be.visible')

    // Navigate to contacts
    cy.visit('/contacts')
    cy.contains('Manage your personal relationships').should('be.visible')

    // Navigate to reminders
    cy.visit('/reminders')
    cy.contains('Stay on top of your relationships').should('be.visible')
  })
})