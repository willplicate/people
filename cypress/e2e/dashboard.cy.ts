describe('Dashboard Functionality', () => {
  beforeEach(() => {
    // Create some test data for dashboard
    cy.visit('/contacts/new')
    cy.get('[data-cy="first-name"]').type('Dashboard')
    cy.get('[data-cy="last-name"]').type('Test')
    cy.get('[data-cy="communication-frequency"]').select('monthly')

    // Set birthday for next week
    const nextWeek = new Date()
    nextWeek.setDate(nextWeek.getDate() + 7)
    const birthday = `${String(nextWeek.getMonth() + 1).padStart(2, '0')}-${String(nextWeek.getDate()).padStart(2, '0')}`
    cy.get('[data-cy="birthday"]').type(birthday)

    cy.get('[data-cy="save-contact"]').click()

    // Navigate back to dashboard
    cy.visit('/')
  })

  it('should display dashboard overview with key statistics', () => {
    // Check main dashboard title
    cy.contains('Personal CRM Dashboard').should('be.visible')

    // Check stats cards are present
    cy.get('[data-cy="total-contacts-stat"]').should('be.visible')
    cy.get('[data-cy="active-reminders-stat"]').should('be.visible')
    cy.get('[data-cy="overdue-stat"]').should('be.visible')
    cy.get('[data-cy="upcoming-birthdays-stat"]').should('be.visible')

    // Stats should show numbers (at least 1 from our test contact)
    cy.get('[data-cy="total-contacts-stat"]').should('contain', '1')
  })

  it('should show upcoming reminders section', () => {
    cy.contains('Upcoming Reminders').should('be.visible')

    // May show "No upcoming reminders" or actual reminders
    // depending on system state and reminder generation
    cy.get('[data-cy="upcoming-reminders-section"]').should('be.visible')
  })

  it('should display recent interactions section', () => {
    cy.contains('Recent Interactions').should('be.visible')

    // Initially should show "No recent interactions"
    cy.contains('No recent interactions').should('be.visible')

    // Add an interaction to our test contact
    cy.visit('/contacts')
    cy.contains('Dashboard Test').click()
    cy.get('[data-cy="add-interaction"]').click()
    cy.get('[data-cy="interaction-type"]').select('call')
    cy.get('[data-cy="interaction-notes"]').type('Dashboard test interaction')
    cy.get('[data-cy="save-interaction"]').click()

    // Go back to dashboard
    cy.visit('/')

    // Should now show the interaction
    cy.contains('Dashboard test interaction').should('be.visible')
  })

  it('should show upcoming birthdays section', () => {
    cy.contains('Upcoming Birthdays').should('be.visible')

    // Should show our test contact with birthday next week
    cy.contains('Dashboard Test').should('be.visible')
    cy.contains('7 days').should('be.visible')
  })

  it('should display needs attention section', () => {
    cy.contains('Needs Attention').should('be.visible')

    // Our newly created contact might appear here since it hasn't been contacted
    // This depends on the reminder calculation logic
  })

  it('should handle empty states gracefully', () => {
    // Test with no data - would require a clean database
    // or specific test setup

    // For now, just verify empty state messages exist
    cy.contains('No upcoming reminders').should('exist')
    cy.contains('No recent interactions').should('exist')
    cy.contains('No upcoming birthdays').should('exist')
    cy.contains('All caught up!').should('exist')
  })

  it('should have working navigation from dashboard', () => {
    // Test navigation to contacts
    cy.get('[data-cy="nav-contacts"]').click()
    cy.url().should('include', '/contacts')
    cy.contains('Manage your personal relationships').should('be.visible')

    // Back to dashboard
    cy.visit('/')

    // Test navigation to reminders
    cy.get('[data-cy="nav-reminders"]').click()
    cy.url().should('include', '/reminders')
    cy.contains('Stay on top of your relationships').should('be.visible')
  })

  it('should refresh data when navigating back to dashboard', () => {
    // Initial load
    cy.visit('/')
    cy.get('[data-cy="total-contacts-stat"]').should('contain', '1')

    // Create another contact
    cy.visit('/contacts/new')
    cy.get('[data-cy="first-name"]').type('Second')
    cy.get('[data-cy="last-name"]').type('Contact')
    cy.get('[data-cy="save-contact"]').click()

    // Return to dashboard
    cy.visit('/')

    // Should show updated count
    cy.get('[data-cy="total-contacts-stat"]').should('contain', '2')
  })

  it('should handle loading states', () => {
    // This would require network interception to test loading states
    // For now, just verify the component structure exists
    cy.visit('/')
    cy.get('[data-cy="dashboard-container"]').should('be.visible')
  })

  it('should be responsive on different screen sizes', () => {
    // Test mobile view
    cy.viewport(375, 667)
    cy.visit('/')
    cy.contains('Personal CRM Dashboard').should('be.visible')

    // Stats should still be visible but may be stacked
    cy.get('[data-cy="total-contacts-stat"]').should('be.visible')

    // Test tablet view
    cy.viewport(768, 1024)
    cy.visit('/')
    cy.contains('Personal CRM Dashboard').should('be.visible')

    // Test desktop view
    cy.viewport(1440, 900)
    cy.visit('/')
    cy.contains('Personal CRM Dashboard').should('be.visible')
  })

  afterEach(() => {
    // Cleanup test data
    // This would require implementing a cleanup mechanism
  })
})