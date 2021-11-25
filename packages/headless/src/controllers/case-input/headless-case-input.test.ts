import {
  CaseInput,
  CaseInputOptions,
  buildCaseInput,
} from './headless-case-input';
import {
  buildMockCaseAssistEngine,
  MockCaseAssistEngine,
} from '../../test/mock-engine';
import {caseField, caseInput, documentSuggestion} from '../../app/reducers';
import {updateCaseInput} from '../../features/case-input/case-input-actions';
import {fetchCaseClassifications} from '../../features/case-field/case-field-actions';
import {fetchDocumentSuggestions} from '../../features/document-suggestion/document-suggestion-actions';

describe('Case Input', () => {
  let engine: MockCaseAssistEngine;
  let options: CaseInputOptions;
  let input: CaseInput;

  const testFieldName = 'testfield';

  function initCaseInput() {
    input = buildCaseInput(engine, {options});
  }

  beforeEach(() => {
    options = {
      field: testFieldName,
    };
    engine = buildMockCaseAssistEngine();
    initCaseInput();
  });

  it('adds the correct reducers to the engine', () => {
    expect(engine.addReducers).toHaveBeenCalledWith({
      caseInput,
      caseField,
      documentSuggestion,
    });
  });

  it('building a case input registers the input field in the state', () => {
    expect(engine.actions).toContainEqual(
      updateCaseInput({fieldName: testFieldName, fieldValue: ''})
    );
  });

  it('building a case input without specifying an empty field name throws', () => {
    options.field = '';
    expect(() => initCaseInput()).toThrow(
      'Check the options of buildCaseInput'
    );
  });

  describe('#update', () => {
    it('dispatches a #updateCaseInput action with the passed input value', () => {
      const testValue = 'test input value';
      input.update(testValue);

      expect(engine.actions).toContainEqual(
        updateCaseInput({fieldName: testFieldName, fieldValue: testValue})
      );
    });

    /*it('dispatches a #logCaseFieldUpdate analytics action', () => {
      const testValue = 'test input value';
      caseInput.update(testValue);

      expect(engine.actions).toContainEqual(
        logCaseFieldUpdate({fieldName: testFieldName, fieldValue: testValue})
      );
    });*/
  });

  describe('#fetchCaseClassifications', () => {
    it('dispatches a #fetchCaseClassifications action', () => {
      input.fetchCaseClassifications();

      expect(engine.actions).toContainEqual(
        expect.objectContaining({
          type: fetchCaseClassifications.pending.type,
        })
      );
    });
  });

  describe('#fetchDocumentSuggestions', () => {
    it('dispatches a #fetchDocumentSuggestions', () => {
      input.fetchDocumentSuggestions();

      expect(engine.actions).toContainEqual(
        expect.objectContaining({
          type: fetchDocumentSuggestions.pending.type,
        })
      );
    });
  });
});
