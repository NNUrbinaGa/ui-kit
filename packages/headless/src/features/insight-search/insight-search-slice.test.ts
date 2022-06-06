import {insightSearchReducer} from './insight-search-slice';
import {buildMockInsightSearch} from '../../test/mock-insight-search';
import {
  buildMockInsightQueryResponse,
  buildMockSearchResult,
} from '../../test/mock-query-response';
import {logSearchboxSubmit} from '../query/query-analytics-actions';
import {
  insightExecuteSearch,
  insightFetchMoreResults,
} from './insight-search-actions';
import {
  getInsightSearchInitialState,
  InsightSearchState,
} from './insight-search-state';
import {
  buildMockInsightEngine,
  MockInsightEngine,
} from '../../test/mock-engine';
import {buildMockInsightState} from '../../test/mock-insight-state';
import {PlatformClient} from '../../api/platform-client';

jest.mock('../../api/platform-client');
let e: MockInsightEngine;
function buildMockInsightEngineError() {
  //e = buildMockInsightEngine({state: buildMockInsightState()});
  PlatformClient.call = jest.fn().mockImplementation(() => {
    const body = JSON.stringify({
      message: 'message',
      statusCode: 500,
      type: 'type',
    });
    const response = new Response(body);

    return Promise.resolve(response);
  });
}

describe('insight search slice', () => {
  let state: InsightSearchState;

  beforeEach(() => {
    state = getInsightSearchInitialState();
  });

  it('loads with an initial state', () => {
    const finalState = insightSearchReducer(undefined, {type: ''});
    expect(finalState).toEqual(getInsightSearchInitialState());
  });

  it('the initial isloading state is set to false', () => {
    expect(state.isLoading).toBe(false);
  });

  describe('insightExecuteSearch', () => {
    beforeEach(() => {
      state = getInsightSearchInitialState();
    });

    it('when the action fulfilled is received, it updates the state to the received payload', () => {
      const result = buildMockSearchResult();
      const response = buildMockInsightQueryResponse({results: [result]});
      const insightSearchState = buildMockInsightSearch({
        response: response,
        duration: 123,
        queryExecuted: 'foo',
      });

      const action = insightExecuteSearch.fulfilled(
        insightSearchState,
        '',
        logSearchboxSubmit()
      );
      const finalState = insightSearchReducer(state, action);

      expect(finalState.response).toEqual(response);
      expect(finalState.duration).toEqual(123);
      expect(finalState.queryExecuted).toEqual('foo');
      expect(finalState.isLoading).toBe(false);
    });

    it('with an existing result , when the action fulfilled is received, it overwrites the old search results', () => {
      const initialResult = buildMockSearchResult({title: 'initial result'});
      const newResult = buildMockSearchResult({title: 'new result'});
      state.results = [initialResult];

      const finalState = insightSearchReducer(
        state,
        insightExecuteSearch.fulfilled(
          buildMockInsightSearch({
            response: buildMockInsightQueryResponse({results: [newResult]}),
          }),
          '',
          logSearchboxSubmit()
        )
      );

      expect(finalState.results).toEqual([newResult]);
    });

    it('with an existing result , when the action fulfilled is received, it overwrites the #searchResponseId', () => {
      const initialResult = buildMockSearchResult({title: 'initial result'});
      const newResult = buildMockSearchResult({title: 'new result'});
      state.results = [initialResult];
      state.searchResponseId = 'an_initial_id';
      const response = buildMockInsightQueryResponse({results: [newResult]});
      response.searchUid = 'a_new_id';
      const search = buildMockInsightSearch({
        response,
      });

      const finalState = insightSearchReducer(
        state,
        insightExecuteSearch.fulfilled(search, '', logSearchboxSubmit())
      );

      expect(finalState.searchResponseId).toBe('a_new_id');
    });

    it('when the action rejected is received with an error', () => {
      const err = {
        message: 'message',
        statusCode: 500,
        type: 'type',
      };
      const action = {
        type: 'insight/search/executeSearch/rejected',
        payload: err,
      };
      const finalState = insightSearchReducer(state, action);

      expect(finalState.response).toEqual(
        getInsightSearchInitialState().response
      );
      expect(finalState.results).toEqual([]);
      expect(finalState.isLoading).toBe(false);
      expect(finalState.error).toEqual(err);
    });

    it('when the action rejected is received without an error', () => {
      const action = {
        type: 'insight/search/executeSearch/rejected',
        payload: null,
      };
      const finalState = insightSearchReducer(state, action);

      expect(finalState.response).toEqual(
        getInsightSearchInitialState().response
      );
      expect(finalState.results).toEqual(
        getInsightSearchInitialState().results
      );
      expect(finalState.isLoading).toBe(false);
      expect(finalState.error).toEqual(undefined);
    });

    it('when thw action rejected is received, it should dispatch a logQueryError action', async () => {
      buildMockInsightEngineError();
      await e.dispatch(insightExecuteSearch(logSearchboxSubmit()));
      expect(e.actions).toContainEqual(
        expect.objectContaining({
          type: 'search/queryError/pending',
        })
      );
    });

    it('set the isloading state to true during executeSearch.pending', () => {
      const pendingAction = insightExecuteSearch.pending(
        'asd',
        logSearchboxSubmit()
      );
      const finalState = insightSearchReducer(state, pendingAction);
      expect(finalState.isLoading).toBe(true);
    });
  });

  describe('insightFetchMoreResults', () => {
    beforeEach(() => {
      state = getInsightSearchInitialState();
    });

    it('when the action fulfilled is received, it updates the state to the received payload', () => {
      state.searchResponseId = 'the_initial_id';
      const result = buildMockSearchResult();
      const response = buildMockInsightQueryResponse({results: [result]});
      const searchState = buildMockInsightSearch({
        response,
        duration: 123,
        queryExecuted: 'foo',
        searchResponseId: 'a_new_id',
      });

      const action = insightFetchMoreResults.fulfilled(searchState, '');
      const finalState = insightSearchReducer(state, action);

      expect(finalState.response).toEqual(response);
      expect(finalState.duration).toEqual(123);
      expect(finalState.queryExecuted).toEqual('foo');
      expect(finalState.isLoading).toBe(false);
      expect(finalState.searchResponseId).toBe('the_initial_id');
    });

    it('when a fetchMoreResults rejected is received with an error', () => {
      const err = {
        message: 'message',
        statusCode: 500,
        type: 'type',
      };
      const action = {
        type: 'insight/search/fetchMoreResults/rejected',
        payload: err,
      };
      const finalState = insightSearchReducer(state, action);

      expect(finalState.response).toEqual(
        getInsightSearchInitialState().response
      );
      expect(finalState.results).toEqual([]);
      expect(finalState.isLoading).toBe(false);
      expect(finalState.error).toEqual(err);
    });
  });

  describe('insightFetchFacetValues', () => {});
});
