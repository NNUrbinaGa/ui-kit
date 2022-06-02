import {createMockState} from './mock-state';
import configureStore from 'redux-mock-store';
import {
  AnyAction,
  ThunkDispatch,
  getDefaultMiddleware,
  ActionCreatorWithPreparedPayload,
} from '@reduxjs/toolkit';
import thunk from 'redux-thunk';
import {analyticsMiddleware} from '../app/analytics-middleware';
import {SearchAppState} from '../state/search-app-state';
import {RecommendationAppState} from '../state/recommendation-app-state';
import {createMockRecommendationState} from './mock-recommendation-state';
import {ProductRecommendationsAppState} from '../state/product-recommendations-app-state';
import {buildMockProductRecommendationsState} from './mock-product-recommendations-state';
import pino, {Logger} from 'pino';
import {
  logActionErrorMiddleware,
  logActionMiddleware,
} from '../app/logger-middlewares';
import {validatePayloadAndThrow} from '../utils/validate-payload';
import {buildMockSearchAPIClient} from './mock-search-api-client';
import {SearchEngine} from '../app/search-engine/search-engine';
import {RecommendationEngine} from '../app/recommendation-engine/recommendation-engine';
import {CoreEngine} from '../app/engine';
import {ProductRecommendationEngine} from '../app/product-recommendation-engine/product-recommendation-engine';
import {ProductListingEngine} from '../app/product-listing-engine/product-listing-engine';
import {ProductListingAppState} from '../state/product-listing-app-state';
import {buildMockProductListingState} from './mock-product-listing-state';
import {SearchThunkExtraArguments} from '../app/search-thunk-extra-arguments';
import {CaseAssistAppState} from '../state/case-assist-app-state';
import {CaseAssistEngine} from '../case-assist.index';
import {buildMockCaseAssistState} from './mock-case-assist-state';
import {InsightEngine} from '../app/insight-engine/insight-engine';
import {InsightAppState} from '../state/insight-app-state';
import {buildMockInsightState} from './mock-insight-state';

type AsyncActionCreator<ThunkArg> = ActionCreatorWithPreparedPayload<
  [string, ThunkArg],
  undefined,
  string,
  never,
  {arg: ThunkArg; requestId: string}
>;

type AppState =
  | SearchAppState
  | RecommendationAppState
  | ProductRecommendationsAppState
  | ProductListingAppState
  | CaseAssistAppState
  | InsightAppState;

interface MockEngine {
  actions: AnyAction[];
  findAsyncAction: <ThunkArg>(
    action: AsyncActionCreator<ThunkArg>
  ) => ReturnType<AsyncActionCreator<ThunkArg>> | undefined;
}

type DispatchExts = ThunkDispatch<AppState, void, AnyAction>;

export interface MockSearchEngine
  extends SearchEngine<SearchAppState>,
    MockEngine {}

/**
 * For internal use only.
 *
 * Returns a non-functionnal `SearchEngine`.
 * To be used only for unit testing controllers, not for functionnal tests.
 */
export function buildMockSearchAppEngine(
  config: Partial<SearchEngine<SearchAppState>> = {}
): MockSearchEngine {
  const engine = buildMockCoreEngine(config, createMockState);
  return {
    ...engine,
    executeFirstSearch: jest.fn(),
    executeFirstSearchAfterStandaloneSearchBoxRedirect: jest.fn(),
  };
}

export interface MockRecommendationEngine
  extends RecommendationEngine,
    MockEngine {}

/**
 * For internal use only.
 *
 * Returns a non-functionnal `RecommendationEngine`.
 * To be used only for unit testing controllers, not for functionnal tests.
 */
export function buildMockRecommendationAppEngine(
  config: Partial<RecommendationEngine<RecommendationAppState>> = {}
): MockRecommendationEngine {
  return buildMockCoreEngine(config, createMockRecommendationState);
}

export interface MockProductRecommendationEngine
  extends ProductRecommendationEngine,
    MockEngine {}

/**
 * For internal use only.
 *
 * Returns a non-functionnal `ProductRecommendationEngine`.
 * To be used only for unit testing controllers, not for functionnal tests.
 */
export function buildMockProductRecommendationsAppEngine(
  config: Partial<
    ProductRecommendationEngine<ProductRecommendationsAppState>
  > = {}
): MockProductRecommendationEngine {
  return buildMockCoreEngine(config, buildMockProductRecommendationsState);
}

export interface MockProductListingEngine
  extends ProductListingEngine<ProductListingAppState>,
    MockEngine {}

/**
 * For internal use only.
 *
 * Returns a non-functionnal `ProductListingEngine`.
 * To be used only for unit testing controllers, not for functionnal tests.
 */
export function buildMockProductListingEngine(
  config: Partial<ProductListingEngine<ProductListingAppState>> = {}
): MockProductListingEngine {
  return buildMockCoreEngine(config, buildMockProductListingState);
}

export interface MockCaseAssistEngine
  extends CaseAssistEngine<CaseAssistAppState>,
    MockEngine {}

/**
 * For internal use only.
 *
 * Returns a non-functionnal `CaseAssistEngine`.
 * To be used only for unit testing controllers, not for functionnal tests.
 */
export function buildMockCaseAssistEngine(
  config: Partial<CaseAssistEngine<CaseAssistAppState>> = {}
): MockCaseAssistEngine {
  return buildMockCoreEngine(config, buildMockCaseAssistState);
}

export interface MockInsightEngine
  extends InsightEngine<InsightAppState>,
    MockEngine {
    }

export function buildMockInsightEngine(
  config: Partial<InsightEngine<InsightAppState>> = {}
): MockInsightEngine {
  const engine = buildMockCoreEngine(config, buildMockInsightState);
  return {
    ...engine,
    executeFirstSearch: jest.fn(),
  }
}

interface MockCoreEngine<T extends object> extends CoreEngine<T>, MockEngine {}

function buildMockCoreEngine<T extends AppState>(
  config: Partial<CoreEngine<T>> = {},
  mockState: () => T
): MockCoreEngine<T> {
  const logger = pino({level: 'silent'});
  const storeConfiguration = configureMockStore(logger);
  const coreState = buildCoreState(config, mockState);
  const store = storeConfiguration(coreState);
  const unsubscribe = () => {};

  const {state, ...rest} = config;

  return {
    store,
    state: buildCoreState(config, mockState),
    subscribe: jest.fn(() => unsubscribe),
    get dispatch() {
      return store.dispatch;
    },
    get actions() {
      return store.getActions();
    },
    findAsyncAction<ThunkArg>(actionCreator: AsyncActionCreator<ThunkArg>) {
      const action = this.actions.find((a) => a.type === actionCreator.type);
      return isAsyncAction<ThunkArg>(action) ? action : undefined;
    },
    logger,
    addReducers: jest.fn(),
    enableAnalytics: jest.fn(),
    disableAnalytics: jest.fn(),
    ...rest,
  };
}

function buildCoreState<T extends AppState>(
  config: Partial<CoreEngine<T>>,
  mockState: () => T
) {
  const state = config.state || mockState();
  state.configuration.analytics.enabled = false;
  return state;
}

const configureMockStore = (logger: Logger) => {
  const thunkExtraArguments: Omit<
    SearchThunkExtraArguments,
    'analyticsClientMiddleware'
  > = {
    searchAPIClient: buildMockSearchAPIClient({logger}),
    apiClient: buildMockSearchAPIClient({logger}),
    validatePayload: validatePayloadAndThrow,
    logger,
  };
  return configureStore<AppState, DispatchExts>([
    logActionErrorMiddleware(logger),
    analyticsMiddleware,
    thunk.withExtraArgument(thunkExtraArguments),
    ...getDefaultMiddleware(),
    logActionMiddleware(logger),
  ]);
};

function isAsyncAction<ThunkArg>(
  action: AnyAction | undefined
): action is ReturnType<AsyncActionCreator<ThunkArg>> {
  return action ? 'meta' in action : false;
}
