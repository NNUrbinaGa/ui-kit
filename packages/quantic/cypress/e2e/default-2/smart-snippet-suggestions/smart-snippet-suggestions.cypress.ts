import {configure} from '../../../page-objects/configurator';
import {
  interceptSearch,
  mockSearchWithSmartSnippetSuggestions,
  mockSearchWithoutSmartSnippetSuggestions,
} from '../../../page-objects/search';
import {scope} from '../../../reporters/detailed-collector';
import {stubConsoleError} from '../../console-selectors';
import {SmartSnippetSuggestionsActions as Actions} from './smart-snippet-suggestions-actions';
import {SmartSnippetSuggestionsExpectations as Expect} from './smart-snippet-suggestions-expectations';

const inactiveLink = 'javascript:void(0);';
const exampleInlineLinkText = 'Example inline link';
const exampleInlineLinkUrl = inactiveLink;
const exampleSmartSnippetAnswer = `
  <div>
    <p>Example smart snippet answer</p>
    <a data-cy="smart-snippet__inline-link" href="${exampleInlineLinkUrl}">${exampleInlineLinkText}</a>
  </div>
`;

const exampleRelatedQuestions = [
  {
    question: 'first example question',
    answerSnippet: exampleSmartSnippetAnswer,
    title: 'first example title',
    uri: inactiveLink,
    documentId: {
      contentIdKey: 'permanentid',
      contentIdValue: '123',
    },
  },
  {
    question: 'second example question',
    answerSnippet: exampleSmartSnippetAnswer,
    title: 'second example title',
    uri: inactiveLink,
    documentId: {
      contentIdKey: 'permanentid',
      contentIdValue: '456',
    },
  },
];

describe('quantic-smart-snippet-suggestions', () => {
  const pageUrl = 's/quantic-smart-snippet-suggestions';

  function visitPage(withoutSmartSnippet = false) {
    interceptSearch();
    if (withoutSmartSnippet) {
      mockSearchWithoutSmartSnippetSuggestions();
    } else {
      mockSearchWithSmartSnippetSuggestions(exampleRelatedQuestions);
    }
    cy.visit(pageUrl, {
      onBeforeLoad(win) {
        stubConsoleError(win);
      },
    });
    configure();
  }

  describe('when the query does not return any smart snippet suggestions', () => {
    it('should not display the smart snippet suggestions', () => {
      visitPage(true);

      scope('when loading the page', () => {
        Expect.displaySmartSnippetSuggestionsCard(false);
      });
    });
  });

  describe('when the query returns smart snippet suggestions', () => {
    it('should properly display the smart snippet suggestions', () => {
      visitPage();

      scope('when loading the page', () => {
        Expect.displaySmartSnippetSuggestionsCard(true);
        exampleRelatedQuestions.forEach((suggestion, index) => {
          Actions.toggleSuggestion(index);
          Expect.logExpandSmartSnippetSuggestion({
            answerSnippet: suggestion.answerSnippet,
            question: suggestion.question,
            documentId: suggestion.documentId,
          });
          Expect.displaySmartSnippetSuggestionsQuestion(
            index,
            suggestion.question
          );
          Expect.displaySmartSnippetSuggestionsAnswer(
            index,
            suggestion.answerSnippet
          );
          Expect.displaySmartSnippetSuggestionsSourceUri(index, suggestion.uri);
          Expect.displaySmartSnippetSuggestionsSourceTitle(
            index,
            suggestion.title
          );
          Actions.toggleSuggestion(index);
          Expect.logCollapseSmartSnippetSuggestion({
            answerSnippet: suggestion.answerSnippet,
            question: suggestion.question,
            documentId: suggestion.documentId,
          });
        });
      });

      scope(
        'when the source title of one of the suggestions is clicked',
        () => {
          const index = 0;
          Actions.toggleSuggestion(index);
          Actions.clickSmartSnippetSuggestionsSourceTitle(index);
          Expect.logOpenSmartSnippetSuggestionSource({
            ...exampleRelatedQuestions[index],
            position: index + 1,
          });
        }
      );

      scope('when the source uri of one of the suggestions is clicked', () => {
        const index = 0;
        visitPage();
        Actions.toggleSuggestion(index);
        Actions.clickSmartSnippetSuggestionsSourceUri(index);
        Expect.logOpenSmartSnippetSuggestionSource({
          ...exampleRelatedQuestions[index],
          position: index + 1,
        });
      });

      scope('when an inline link of one of the suggestions is clicked', () => {
        const index = 0;
        Actions.clickSmartSnippetSuggestionsInlineLink(index);
        Expect.logOpenSmartSnippetSuggestionInlineLink({
          ...exampleRelatedQuestions[index],
          position: index + 1,
          linkUrl: exampleInlineLinkUrl,
          linkText: exampleInlineLinkText,
        });
      });
    });
  });
});
