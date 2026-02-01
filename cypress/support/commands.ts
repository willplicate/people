/// <reference types="cypress" />

// Custom commands for Personal CRM E2E tests

declare global {
  namespace Cypress {
    interface Chainable {
      // Add custom command types here
      // example: login(email: string, password: string): Chainable<void>
    }
  }
}

// Example custom command
// Cypress.Commands.add('login', (email, password) => { ... })