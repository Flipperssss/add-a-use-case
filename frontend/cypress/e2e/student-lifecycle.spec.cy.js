/* global describe, beforeEach, it, cy */

describe('Student deactivation', () => {
  beforeEach(() => {
    cy.login('b.gates@abc.edu', '123456')
    cy.visit('/students')
  })

  it('cancelling the confirmation leaves the account unchanged and sends no request', () => {
    cy.intercept('POST', '**/students/4/deactivate').as('deactivate')

    cy.contains('.el-table__row', 'j.smith@abc.edu').within(() => {
      cy.get('button').click()
    })
    cy.get('[data-cy=student-deactivate]').click()
    cy.get('[data-cy=student-deactivation-confirmation]')
      .should('contain', 'previously issued tokens')
      .and('contain', 'will be retained')
    cy.get('[data-cy=student-deactivation-cancel]').click()

    cy.get('[data-cy=student-deactivation-confirmation]').should('not.exist')
    cy.get('[data-cy=student-status]').should('contain', 'Active')
    cy.get('@deactivate.all').should('have.length', 0)
  })

  it('confirms deactivation through the lifecycle endpoint', () => {
    cy.intercept('POST', '**/students/4/deactivate', {
      body: {
        flag: true,
        code: 200,
        message: 'Student deactivated successfully',
        data: null
      }
    }).as('deactivate')

    cy.contains('.el-table__row', 'j.smith@abc.edu').within(() => {
      cy.get('button').click()
    })
    cy.get('[data-cy=student-deactivate]').click()
    cy.get('[data-cy=student-deactivation-submit]').click()

    cy.wait('@deactivate').its('request.url').should('include', '/students/4/deactivate')
    cy.contains('Student deactivated successfully').should('be.visible')
  })
})

describe('Peer evaluation of deactivated teammates', () => {
  beforeEach(() => {
    cy.login('j.smith@abc.edu', '123456')
    cy.intercept('GET', '**/students/teams/1', {
      body: {
        flag: true,
        code: 200,
        message: 'Find students by team id successfully',
        data: [
          {
            id: 4,
            username: 'j.smith@abc.edu',
            firstName: 'John',
            lastName: 'Smith',
            email: 'j.smith@abc.edu',
            enabled: true
          },
          {
            id: 5,
            username: 'e.hudson@abc.edu',
            firstName: 'Withdrawn',
            lastName: 'Teammate',
            email: 'e.hudson@abc.edu',
            enabled: false
          }
        ]
      }
    })
    cy.intercept('GET', '**/sections/2', {
      body: {
        flag: true,
        code: 200,
        message: 'Find section successfully',
        data: { sectionId: 2, rubricId: 1 }
      }
    })
    cy.intercept('GET', '**/rubrics/1', {
      body: { flag: true, code: 200, message: 'Find rubric successfully', data: { criteria: [] } }
    })
    cy.intercept('GET', '**/evaluations/evaluators/4/week/*', {
      body: { flag: true, code: 200, message: 'Get peer evaluations successfully', data: [] }
    })
  })

  it('omits a deactivated teammate as a new evaluation target', () => {
    cy.visit('/evaluations/submit-evaluations')

    cy.contains('John Smith').should('be.visible')
    cy.contains('Withdrawn Teammate').should('not.exist')
  })

  it('keeps an existing evaluation for a deactivated teammate editable', () => {
    cy.intercept('GET', '**/evaluations/evaluators/4/week/*', {
      body: {
        flag: true,
        code: 200,
        message: 'Get peer evaluations successfully',
        data: [
          {
            peerEvaluationId: 99,
            week: '2023-W33',
            evaluatorId: 4,
            evaluateeId: 5,
            evaluateeName: 'Withdrawn Teammate',
            ratings: [],
            totalScore: 0,
            publicComment: '',
            privateComment: ''
          }
        ]
      }
    })

    cy.visit('/evaluations/submit-evaluations')

    cy.contains('Withdrawn Teammate').should('be.visible')
    cy.contains('button', 'Update').should('be.visible')
  })
})
