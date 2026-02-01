describe('Interaction Logging and Reminder Updates', () => {
  let contactId: string

  beforeEach(() => {
    // Create a test contact
    cy.visit('/contacts/new')
    cy.get('[data-cy="first-name"]').type('Interaction')
    cy.get('[data-cy="last-name"]').type('Test')
    cy.get('[data-cy="communication-frequency"]').select('weekly')
    cy.get('[data-cy="save-contact"]').click()

    // Extract contact ID from URL
    cy.url().then((url) => {
      const match = url.match(/\/contacts\/([a-f0-9-]+)$/)
      if (match) {
        contactId = match[1]
      }
    })
  })

  it('should log interactions and update last contacted date', () => {
    // Should be on contact detail page
    cy.url().should('match', /\/contacts\/[a-f0-9-]+$/)

    // Initially, last contacted should be empty or show 'Never'
    cy.contains('Last contacted:').should('be.visible')

    // Add an interaction
    cy.get('[data-cy="add-interaction"]').click()

    // Fill interaction form
    cy.get('[data-cy="interaction-type"]').select('call')
    cy.get('[data-cy="interaction-notes"]').type('Called to catch up on recent events')

    // Set interaction date to today
    const today = new Date().toISOString().slice(0, 16)
    cy.get('[data-cy="interaction-date"]').clear().type(today)

    // Save interaction
    cy.get('[data-cy="save-interaction"]').click()

    // Verify interaction appears in list
    cy.contains('Called to catch up on recent events').should('be.visible')
    cy.contains('call').should('be.visible')

    // Verify last contacted date is updated
    const todayFormatted = new Date().toLocaleDateString()
    cy.contains(`Last contacted: ${todayFormatted}`).should('be.visible')
  })

  it('should handle different interaction types', () => {
    const interactionTypes = [
      { type: 'call', notes: 'Had a phone conversation' },
      { type: 'text', notes: 'Exchanged text messages' },
      { type: 'email', notes: 'Sent an email update' },
      { type: 'meetup', notes: 'Met for coffee downtown' },
      { type: 'other', notes: 'Connected on social media' }
    ]

    interactionTypes.forEach((interaction, index) => {
      // Add interaction
      cy.get('[data-cy="add-interaction"]').click()

      // Fill form
      cy.get('[data-cy="interaction-type"]').select(interaction.type)
      cy.get('[data-cy="interaction-notes"]').type(interaction.notes)

      // Save
      cy.get('[data-cy="save-interaction"]').click()

      // Verify it appears
      cy.contains(interaction.notes).should('be.visible')
      cy.contains(interaction.type).should('be.visible')
    })

    // Should have all 5 interactions
    cy.get('[data-cy="interaction-item"]').should('have.length', 5)
  })

  it('should validate interaction form fields', () => {
    cy.get('[data-cy="add-interaction"]').click()

    // Try to save without notes
    cy.get('[data-cy="save-interaction"]').click()

    // Should show validation error
    cy.contains('Notes are required').should('be.visible')

    // Should not save the interaction
    cy.get('[data-cy="interaction-item"]').should('not.exist')
  })

  it('should update reminder timers when interaction is logged', () => {
    // This test would require integration with the reminder system
    // and might involve checking the API response or database state

    // Log an interaction
    cy.get('[data-cy="add-interaction"]').click()
    cy.get('[data-cy="interaction-type"]').select('call')
    cy.get('[data-cy="interaction-notes"]').type('Regular check-in call')
    cy.get('[data-cy="save-interaction"]').click()

    // Navigate to dashboard to check if reminder status changed
    cy.visit('/')

    // Contact should not appear in "Needs Attention" section
    // (This assumes the reminder calculation works correctly)
    cy.contains('Needs Attention').should('be.visible')
    cy.contains('Interaction Test').should('not.exist')
  })

  it('should handle interaction editing', () => {
    // First create an interaction
    cy.get('[data-cy="add-interaction"]').click()
    cy.get('[data-cy="interaction-type"]').select('call')
    cy.get('[data-cy="interaction-notes"]').type('Original notes')
    cy.get('[data-cy="save-interaction"]').click()

    // Edit the interaction (if edit functionality exists)
    cy.get('[data-cy="edit-interaction"]').first().click()
    cy.get('[data-cy="interaction-notes"]').clear().type('Updated notes after editing')
    cy.get('[data-cy="save-interaction"]').click()

    // Verify update
    cy.contains('Updated notes after editing').should('be.visible')
    cy.contains('Original notes').should('not.exist')
  })

  it('should sort interactions by date (newest first)', () => {
    // Create interactions with different dates
    const interactions = [
      { notes: 'Oldest interaction', daysAgo: 5 },
      { notes: 'Middle interaction', daysAgo: 2 },
      { notes: 'Newest interaction', daysAgo: 0 }
    ]

    interactions.forEach((interaction) => {
      cy.get('[data-cy="add-interaction"]').click()
      cy.get('[data-cy="interaction-type"]').select('call')
      cy.get('[data-cy="interaction-notes"]').type(interaction.notes)

      // Set date
      const date = new Date()
      date.setDate(date.getDate() - interaction.daysAgo)
      const dateString = date.toISOString().slice(0, 16)
      cy.get('[data-cy="interaction-date"]').clear().type(dateString)

      cy.get('[data-cy="save-interaction"]').click()
    })

    // Verify order (newest first)
    cy.get('[data-cy="interaction-item"]').first().should('contain', 'Newest interaction')
    cy.get('[data-cy="interaction-item"]').last().should('contain', 'Oldest interaction')
  })

  afterEach(() => {
    // Cleanup would go here
    // Delete the test contact to keep test environment clean
  })
})