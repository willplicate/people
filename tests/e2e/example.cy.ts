describe('Personal CRM', () => {
  it('should display the home page', () => {
    cy.visit('/')
    cy.contains('Personal CRM')
    cy.contains('Manage your personal relationships')
  })
})