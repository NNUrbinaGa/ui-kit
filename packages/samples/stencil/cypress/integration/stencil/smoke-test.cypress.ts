describe('smoke test', () => {
  beforeEach(() => {
    cy.window().then((win) => {
      cy.stub(win.console, 'error').as('consoleError');
    });
  });

  function setup() {
    cy.intercept({
      method: 'POST',
      path: '**/rest/ua/v15/analytics/*',
    }).as('analytics');
    cy.visit('http://localhost:3666/search').wait('@analytics');
  }

  function setupHSP() {
    cy.intercept({
      method: 'POST',
      path: '**/rest/ua/v15/analytics/*',
    }).as('analytics');
    cy.visit('http://localhost:3666/hsp.html').wait('@analytics');
  }

  function assertions() {
    it('should load', () => {
      cy.get('atomic-search-box')
        .should('exist')
        .shadow()
        .find('input')
        .type('test{enter}');

      cy.get('atomic-facet').should('exist');
      cy.get('atomic-query-summary')
        .should('exist')
        .shadow()
        .find('div[part="container"]')
        .contains('Results 1-10')
        .contains('for test');

      cy.get('atomic-result-list')
        .should('exist')
        .shadow()
        .find('atomic-result')
        .should('exist');
    });

    it('should load custom components', () => {
      cy.get('sample-component')
        .should('exist')
        .shadow()
        .find('button')
        .first()
        .click();

      cy.get('atomic-result-list')
        .shadow()
        .find('atomic-result')
        .shadow()
        .find('sample-result-component')
        .should('exist')
        .shadow()
        .contains('Written by:');
    });

    it('should load the facets in the interface', () => {
      cy.get('atomic-facet-manager atomic-facet').should('have.length', 2);
    });

    it(
      'should load the facets inside the refine modal properly',
      {viewportWidth: 720},
      () => {
        cy.get('atomic-refine-toggle').should('exist').click();
        cy.get('atomic-refine-modal atomic-facet').should('have.length', 2);
      }
    );

    it('should not log an error to the console', () => {
      cy.get('@consoleError').should('not.be.called');
    });
  }

  describe('when navigating directly to the /search', () => {
    before(() => {
      setup();
    });

    assertions();
  });

  describe('when navigating back to the /search', () => {
    before(() => {
      setup();

      cy.get('a#home').click();
      cy.get('a#search').click();
      cy.wait('@analytics');
    });

    assertions();
  });

  describe('testing the /hsp sample', () => {
    before(() => {
      setupHSP();
    });

    it('should not log an error to the console', () => {
      cy.get('@consoleError').should('not.be.called');
    });
  });
});
