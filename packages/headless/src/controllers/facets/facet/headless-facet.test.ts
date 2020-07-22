import {buildFacet, Facet, ValidatedFacetOptions} from './headless-facet';
import {MockEngine, buildMockEngine} from '../../../test/mock-engine';
import {
  registerFacet,
  toggleSelectFacetValue,
  deselectAllFacetValues,
  updateFacetSortCriterion,
  updateFacetNumberOfValues,
} from '../../../features/facets/facet-set/facet-set-actions';
import {SearchPageState} from '../../../state';
import {createMockState} from '../../../test/mock-state';
import {buildMockFacetResponse} from '../../../test/mock-facet-response';
import {buildMockFacetValue} from '../../../test/mock-facet-value';
import {executeSearch} from '../../../features/search/search-actions';
import {FacetRequest} from '../../../features/facets/facet-set/facet-set-interfaces';
import {buildFacetRequest} from '../../../features/facets/facet-set/facet-set-slice';

describe('facet', () => {
  let options: ValidatedFacetOptions;
  let state: SearchPageState;
  let engine: MockEngine;
  let facet: Facet;

  function initFacet() {
    engine = buildMockEngine({state});
    facet = buildFacet(engine, {options});
  }

  function setFacetRequest(config: Partial<FacetRequest> = {}) {
    const facetId = options.facetId;
    const request = buildFacetRequest({facetId, ...config});
    state.facetSet[facetId] = request;
  }

  beforeEach(() => {
    options = {
      facetId: '',
      field: '',
      sortCriteria: 'score',
      facetSearch: {},
    };

    state = createMockState();
    setFacetRequest();

    initFacet();
  });

  it('renders', () => {
    expect(facet).toBeTruthy();
  });

  it('registers a facet with the passed options and the default values of unspecified options', () => {
    options = {
      facetId: '1',
      field: 'author',
      sortCriteria: 'alphanumeric',
      facetSearch: {},
    };
    initFacet();

    const action = registerFacet({
      ...options,
      delimitingCharacter: '>',
      filterFacetCount: true,
      injectionDepth: 1000,
      numberOfValues: 8,
    });

    expect(engine.actions).toContainEqual(action);
  });

  it('registering a facet with #numberOfValues less than 1 throws', () => {
    options.numberOfValues = 0;
    expect(() => initFacet()).toThrow();
  });

  it('when the search response is empty, the facet #state.values is an empty array', () => {
    expect(state.search.response.facets).toEqual([]);
    expect(facet.state.values).toEqual([]);
  });

  it('when the search response has a facet, the facet #state.values contains the same values', () => {
    const values = [buildMockFacetValue()];
    const facetResponse = buildMockFacetResponse({
      facetId: options.facetId,
      values,
    });

    state.search.response.facets = [facetResponse];
    expect(facet.state.values).toBe(values);
  });

  it('#toggleSelect dispatches a toggleSelect action with the passed facet value', () => {
    const facetValue = buildMockFacetValue({value: 'TED'});
    facet.toggleSelect(facetValue);

    expect(engine.actions).toContainEqual(
      toggleSelectFacetValue({facetId: options.facetId, selection: facetValue})
    );
  });

  it('#toggleSelect dispatches a search', () => {
    const facetValue = buildMockFacetValue({value: 'TED'});
    facet.toggleSelect(facetValue);

    const action = engine.actions.find(
      (a) => a.type === executeSearch.pending.type
    );
    expect(action).toBeTruthy();
  });

  it('#isValueSelected returns true when the passed value is selected', () => {
    const facetValue = buildMockFacetValue({state: 'selected'});
    expect(facet.isValueSelected(facetValue)).toBe(true);
  });

  it('#isValueSelected returns false when the passed value is not selected (e.g. idle)', () => {
    const facetValue = buildMockFacetValue({state: 'idle'});
    expect(facet.isValueSelected(facetValue)).toBe(false);
  });

  it('#deselectAll dispatches a deselectAllFacetValues action with the facet id', () => {
    facet.deselectAll();
    expect(engine.actions).toContainEqual(
      deselectAllFacetValues(options.facetId)
    );
  });

  it('#deselectAll dispatches a search', () => {
    facet.deselectAll();

    const action = engine.actions.find(
      (a) => a.type === executeSearch.pending.type
    );
    expect(engine.actions).toContainEqual(action);
  });

  it('when #state.values has a value with a non-idle state, #hasActiveValues returns true', () => {
    const facetResponse = buildMockFacetResponse({facetId: options.facetId});
    facetResponse.values = [buildMockFacetValue({state: 'selected'})];
    state.search.response.facets = [facetResponse];

    expect(facet.hasActiveValues).toBe(true);
  });

  it('when #state.values only has idle values, #hasActiveValues returns false', () => {
    const facetResponse = buildMockFacetResponse({facetId: options.facetId});
    facetResponse.values = [buildMockFacetValue({state: 'idle'})];
    state.search.response.facets = [facetResponse];

    expect(facet.hasActiveValues).toBe(false);
  });

  it('#sortBy dispatches a #updateFacetSortCriterion action with the passed value', () => {
    const criterion = 'score';
    facet.sortBy(criterion);

    const action = updateFacetSortCriterion({
      facetId: options.facetId,
      criterion,
    });

    expect(engine.actions).toContainEqual(action);
  });

  it('#sortBy dispatches a search', () => {
    facet.sortBy('score');
    const action = engine.actions.find(
      (a) => a.type === executeSearch.pending.type
    );

    expect(engine.actions).toContainEqual(action);
  });

  it('when the passed criterion matches the active sort criterion, #isSortedBy returns true', () => {
    const criterion = 'score';
    setFacetRequest({sortCriteria: criterion});

    expect(facet.isSortedBy(criterion)).toBe(true);
  });

  it('when the passed criterion does not match the active sort criterion, #isSortedBy returns false', () => {
    setFacetRequest({sortCriteria: 'alphanumeric'});

    expect(facet.isSortedBy('score')).toBe(false);
  });

  describe('#showMoreValues', () => {
    it('dispatches increases the number of values on the request by the configured amount', () => {
      const numberOfValuesInState = 10;
      const configuredNumberOfValues = 5;
      options.numberOfValues = configuredNumberOfValues;

      setFacetRequest({numberOfValues: numberOfValuesInState});
      initFacet();

      facet.showMoreValues();

      const expectedNumber = numberOfValuesInState + configuredNumberOfValues;
      const action = updateFacetNumberOfValues({
        facetId: options.facetId,
        numberOfValues: expectedNumber,
      });

      expect(engine.actions).toContainEqual(action);
    });

    it(`when the numberOfValues on the request is not a multiple of the configured number,
    it increases the number to make it a multiple`, () => {
      const numberOfValuesInState = 7;
      const configuredNumberOfValues = 5;
      options.numberOfValues = configuredNumberOfValues;

      setFacetRequest({numberOfValues: numberOfValuesInState});
      initFacet();

      facet.showMoreValues();

      const action = updateFacetNumberOfValues({
        facetId: options.facetId,
        numberOfValues: 10,
      });

      expect(engine.actions).toContainEqual(action);
    });

    it('updates the sortCriteria to alphanumeric', () => {
      setFacetRequest({sortCriteria: 'score'});
      initFacet();

      facet.showMoreValues();

      const action = updateFacetSortCriterion({
        facetId: options.facetId,
        criterion: 'alphanumeric',
      });

      expect(engine.actions).toContainEqual(action);
    });

    it('executes a search', () => {
      setFacetRequest();
      initFacet();

      facet.showMoreValues();

      const action = engine.actions.find(
        (a) => a.type === executeSearch.pending.type
      );
      expect(action).toBeTruthy();
    });
  });

  describe('#canShowMoreValues', () => {
    it('when there is no response, it returns false', () => {
      expect(facet.canShowMoreValues).toBe(false);
    });

    it('when #moreValuesAvailable on the response is true, it returns true', () => {
      const facetResponse = buildMockFacetResponse({
        facetId: options.facetId,
        moreValuesAvailable: true,
      });

      state.search.response.facets = [facetResponse];
      expect(facet.canShowMoreValues).toBe(true);
    });

    it('when #moreValuesAvailable on the response is false, it returns false', () => {
      const facetResponse = buildMockFacetResponse({
        facetId: options.facetId,
        moreValuesAvailable: false,
      });

      state.search.response.facets = [facetResponse];
      expect(facet.canShowMoreValues).toBe(false);
    });
  });

  describe('#showLessValues', () => {
    it('sets the number of values to the origial number', () => {
      const originalNumberOfValues = 8;
      options.numberOfValues = originalNumberOfValues;

      setFacetRequest({numberOfValues: 25});
      initFacet();

      facet.showLessValues();

      const action = updateFacetNumberOfValues({
        facetId: options.facetId,
        numberOfValues: originalNumberOfValues,
      });

      expect(engine.actions).toContainEqual(action);
    });

    it(`when the number of non-idle values is greater than the original number,
    it sets the number of values to the non-idle number`, () => {
      options.numberOfValues = 1;
      const selectedValue = buildMockFacetValue({state: 'selected'});
      const currentValues = [selectedValue, selectedValue];

      setFacetRequest({currentValues, numberOfValues: 5});
      initFacet();

      facet.showLessValues();

      const action = updateFacetNumberOfValues({
        facetId: options.facetId,
        numberOfValues: currentValues.length,
      });

      expect(engine.actions).toContainEqual(action);
    });

    it('updates the sortCriteria to score', () => {
      const facetId = options.facetId;
      setFacetRequest({sortCriteria: 'alphanumeric'});
      initFacet();

      facet.showLessValues();
      const action = updateFacetSortCriterion({facetId, criterion: 'score'});
      expect(engine.actions).toContainEqual(action);
    });

    it('executes a search', () => {
      facet.showLessValues();
      const action = engine.actions.find(
        (a) => a.type === executeSearch.pending.type
      );
      expect(action).toBeTruthy();
    });
  });

  describe('#canShowLessValues', () => {
    it('when the number of currentValues is equal to the configured number, it returns false', () => {
      options.numberOfValues = 1;

      const currentValues = [buildMockFacetValue()];
      setFacetRequest({currentValues});

      initFacet();

      expect(facet.canShowLessValues).toBe(false);
    });

    it('when the number of currentValues is greater than the configured number, it returns true', () => {
      options.numberOfValues = 1;
      const value = buildMockFacetValue();

      setFacetRequest({currentValues: [value, value]});
      initFacet();

      expect(facet.canShowLessValues).toBe(true);
    });

    it(`when the number of currentValues is greater than the configured number,
    when there are no idle values, it returns false`, () => {
      options.numberOfValues = 1;
      const selectedValue = buildMockFacetValue({state: 'selected'});

      setFacetRequest({currentValues: [selectedValue, selectedValue]});
      initFacet();

      expect(facet.canShowLessValues).toBe(false);
    });
  });

  it('exposes a #facetSearch property', () => {
    expect(facet.facetSearch).toBeTruthy();
  });
});
