import {Result} from '../../api/search/search/result';
import {
  PartialDocumentInformation,
  DocumentIdentifier,
} from 'coveo.analytics/dist/definitions/searchPage/searchPageEvents';
import {SearchAppState} from '../../state/search-app-state';
import {getPipelineInitialState} from '../pipeline/pipeline-state';
import {
  isNullOrUndefined,
  RecordValue,
  Schema,
  StringValue,
} from '@coveo/bueno';
import {Raw} from '../../api/search/search/raw';
import {
  AnalyticsProvider,
  configureAnalytics,
  configureCaseAssistAnalytics,
  StateNeededByAnalyticsProvider,
  StateNeededByCaseAssistAnalytics,
} from '../../api/analytics/analytics';
import {
  CoveoSearchPageClient,
  SearchPageClientProvider,
  CaseAssistClient,
  EventBuilder,
  AnalyticsClientSendEventHook,
} from 'coveo.analytics';
import {SearchEventResponse} from 'coveo.analytics/dist/definitions/events';
import {AsyncThunk, AsyncThunkAction, createAsyncThunk} from '@reduxjs/toolkit';
import {requiredNonEmptyString} from '../../utils/validate-payload';
import {ThunkExtraArguments} from '../../app/thunk-extra-arguments';
import {
  ConfigurationSection,
  PipelineSection,
} from '../../state/state-sections';
import {RecommendationAppState} from '../../state/recommendation-app-state';
import {ResultWithFolding} from '../folding/folding-slice';
import {getAllIncludedResultsFrom} from '../folding/folding-utils';
import {CaseAssistAppState} from '../../state/case-assist-app-state';
import P from 'pino';
import {PreprocessRequest} from '../../api/preprocess-request';
import {analyticsDescription} from '../configuration/configuration-actions';

export enum AnalyticsType {
  Search,
  Custom,
  Click,
}

export type SearchAction = AsyncThunkAction<
  {analyticsType: AnalyticsType.Search},
  void | {},
  AsyncThunkAnalyticsOptions<StateNeededByAnalyticsProvider>
>;

export type CustomAction = AsyncThunkAction<
  {analyticsType: AnalyticsType.Custom},
  void | {},
  AsyncThunkAnalyticsOptions<StateNeededByAnalyticsProvider>
>;

export type ClickAction = AsyncThunkAction<
  {analyticsType: AnalyticsType.Click},
  void | {},
  AsyncThunkAnalyticsOptions<StateNeededByAnalyticsProvider>
>;

export type AnyAnalyticsAction<T extends AnalyticsType> = AsyncThunkAction<
  {analyticsType: T},
  void | {},
  AsyncThunkAnalyticsOptions<StateNeededByAnalyticsProvider>
>;

export type AnalyticsDescriptionThunk = AsyncThunk<
  void,
  void,
  AsyncThunkAnalyticsOptions<StateNeededByAnalyticsProvider>
>;

export interface AnyAnalyticsPayload<T extends AnalyticsType> {
  logAnalyticsAction: AnyAnalyticsAction<T>;
  analyticsDescriptionThunk: AnalyticsDescriptionThunk;
}

export type SearchAnalyticsPayload = AnyAnalyticsPayload<AnalyticsType.Search>;
export type ClickAnalyticsPayload = AnyAnalyticsPayload<AnalyticsType.Click>;
export type CustomAnalyticsPayload = AnyAnalyticsPayload<AnalyticsType.Custom>;

const searchPageState = (getState: () => unknown) =>
  getState() as SearchAppState;

export interface AsyncThunkAnalyticsOptions<
  T extends Partial<StateNeededByAnalyticsProvider>
> {
  state: T;
  extra: ThunkExtraArguments;
}

export const makeAnalyticsActionWithDescription = <T extends AnalyticsType>(
  prefix: string,
  analyticsType: T,
  builder: (
    client: CoveoSearchPageClient,
    state: ConfigurationSection & Partial<SearchAppState>
  ) => EventBuilder,
  provider: (state: Partial<SearchAppState>) => SearchPageClientProvider = (
    s
  ) => new AnalyticsProvider(s as StateNeededByAnalyticsProvider)
): AnyAnalyticsPayload<T> => {
  const getBuilder = (
    getState: () => StateNeededByAnalyticsProvider,
    logger: P.Logger,
    analyticsClientMiddleware: AnalyticsClientSendEventHook,
    preprocessRequest?: PreprocessRequest
  ) => {
    const state = searchPageState(getState);
    const client = configureAnalytics({
      state,
      logger,
      analyticsClientMiddleware,
      preprocessRequest,
      provider: provider(state),
    });
    return {builder: builder(client, state), client};
  };

  const logAnalyticsAction = createAsyncThunk<
    {analyticsType: T},
    void,
    AsyncThunkAnalyticsOptions<StateNeededByAnalyticsProvider>
  >(
    prefix,
    async (
      _,
      {getState, extra: {analyticsClientMiddleware, preprocessRequest, logger}}
    ) => {
      const {builder, client} = getBuilder(
        getState,
        logger,
        analyticsClientMiddleware,
        preprocessRequest
      );
      const response = await builder.log();
      logger.info(
        {client: client.coveoAnalyticsClient, response},
        'Analytics response'
      );
      return {analyticsType};
    }
  )();

  const analyticsDescriptionThunk = createAsyncThunk<
    void,
    void,
    AsyncThunkAnalyticsOptions<StateNeededByAnalyticsProvider>
  >(
    `${prefix}/description`,
    async (
      _,
      {
        getState,
        extra: {analyticsClientMiddleware, preprocessRequest, logger},
        dispatch,
      }
    ) => {
      const state = searchPageState(getState);
      const client = configureAnalytics({
        state,
        logger,
        analyticsClientMiddleware,
        preprocessRequest,
        provider: provider(state),
      });
      const {description} = builder(client, state);
      dispatch(analyticsDescription(description));
    }
  );

  return {
    logAnalyticsAction,
    analyticsDescriptionThunk,
  };
};

/**
 * @deprecated Please use makeAnalyticsActionWithDescription instead
 * @param prefix
 * @param analyticsType
 * @param log
 * @param provider
 * @returns
 */
export const makeAnalyticsAction = <T extends AnalyticsType>(
  prefix: string,
  analyticsType: T,
  log: (
    client: CoveoSearchPageClient,
    state: ConfigurationSection & Partial<SearchAppState>
  ) => Promise<void | SearchEventResponse> | void,
  provider: (state: Partial<SearchAppState>) => SearchPageClientProvider = (
    s
  ) => new AnalyticsProvider(s as StateNeededByAnalyticsProvider)
) => {
  return createAsyncThunk<
    {analyticsType: T},
    void,
    AsyncThunkAnalyticsOptions<StateNeededByAnalyticsProvider>
  >(
    prefix,
    async (
      _,
      {getState, extra: {analyticsClientMiddleware, preprocessRequest, logger}}
    ) => {
      const state = searchPageState(getState);
      logger.warn(
        'Using deprecated analytics action. By using this, we some analytics properties will not be passed to the Coveo platform. Please migrate.'
      );
      const client = configureAnalytics({
        state,
        logger,
        analyticsClientMiddleware,
        preprocessRequest,
        provider: provider(state),
      });
      const response = await log(client, state);
      logger.info(
        {client: client.coveoAnalyticsClient, response},
        'Analytics response'
      );
      return {analyticsType};
    }
  );
};

export const makeNoopAnalyticsAction = <T extends AnalyticsType>(
  analyticsType: T
) => {
  return createAsyncThunk<
    {analyticsType: T},
    void,
    AsyncThunkAnalyticsOptions<StateNeededByAnalyticsProvider>
  >('analytics/noop', async () => {
    return {analyticsType};
  });
};

export const noopSearchAnalyticsAction = makeNoopAnalyticsAction(
  AnalyticsType.Search
);

export const makeCaseAssistAnalyticsAction = (
  prefix: string,
  log: (
    client: CaseAssistClient,
    state: ConfigurationSection & Partial<CaseAssistAppState>
  ) => Promise<void | SearchEventResponse> | void
) => {
  return createAsyncThunk<
    void,
    void,
    AsyncThunkAnalyticsOptions<StateNeededByCaseAssistAnalytics>
  >(
    prefix,
    async (
      _,
      {getState, extra: {analyticsClientMiddleware, preprocessRequest, logger}}
    ) => {
      const state = getState();
      const client = configureCaseAssistAnalytics({
        state,
        logger,
        analyticsClientMiddleware,
        preprocessRequest,
      });
      const response = await log(client, state);
      logger.info(
        {client: client.coveoAnalyticsClient, response},
        'Analytics response'
      );
    }
  );
};

export const partialDocumentInformation = (
  result: Result,
  state: Partial<SearchAppState>
): PartialDocumentInformation => {
  const paginationBasedIndex = (index: number) =>
    index + (state.pagination?.firstResult ?? 0);

  let resultIndex = -1;

  const parentResults = state.search?.results as ResultWithFolding[];
  resultIndex = findPositionWithUniqueId(result, parentResults);

  if (resultIndex < 0) {
    resultIndex = findPositionInChildResults(result, parentResults);
  }

  if (resultIndex < 0) {
    // ¯\_(ツ)_/¯
    resultIndex = 0;
  }

  return buildPartialDocumentInformation(
    result,
    paginationBasedIndex(resultIndex),
    state
  );
};

export const partialRecommendationInformation = (
  result: Result,
  state: Partial<RecommendationAppState>
): PartialDocumentInformation => {
  const resultIndex =
    state.recommendation?.recommendations.findIndex(
      ({uniqueId}) => result.uniqueId === uniqueId
    ) || 0;

  return buildPartialDocumentInformation(result, resultIndex, state);
};

function buildPartialDocumentInformation(
  result: Result,
  resultIndex: number,
  state: Partial<PipelineSection>
): PartialDocumentInformation {
  const collection = result.raw.collection;
  const collectionName =
    typeof collection === 'string' ? collection : 'default';

  return {
    collectionName,
    documentAuthor: getDocumentAuthor(result),
    documentPosition: resultIndex + 1,
    documentTitle: result.title,
    documentUri: result.uri,
    documentUriHash: result.raw.urihash,
    documentUrl: result.clickUri,
    rankingModifier: result.rankingModifier || '',
    sourceName: getSourceName(result),
    queryPipeline: state.pipeline || getPipelineInitialState(),
  };
}

export const documentIdentifier = (result: Result): DocumentIdentifier => {
  return {
    contentIDKey: '@permanentid',
    contentIDValue: result.raw.permanentid || '',
  };
};

const rawPartialDefinition = {
  urihash: new StringValue(),
  sourcetype: new StringValue(),
  permanentid: new StringValue(),
};

export const resultPartialDefinition = {
  uniqueId: requiredNonEmptyString,
  raw: new RecordValue({values: rawPartialDefinition}),
  title: requiredNonEmptyString,
  uri: requiredNonEmptyString,
  clickUri: requiredNonEmptyString,
  rankingModifier: new StringValue({required: false, emptyAllowed: true}),
};

function partialRawPayload(raw: Raw): Partial<Raw> {
  return Object.assign(
    {},
    ...Object.keys(rawPartialDefinition).map((key) => ({[key]: raw[key]}))
  );
}

function partialResultPayload(result: Result): Partial<Result> {
  return Object.assign(
    {},
    ...Object.keys(resultPartialDefinition).map((key) => ({
      [key]: result[key as keyof typeof resultPartialDefinition],
    })),
    {raw: partialRawPayload(result.raw)}
  );
}

function getDocumentAuthor(result: Result) {
  const author = result.raw['author'];
  if (isNullOrUndefined(author)) {
    return 'unknown';
  }

  return Array.isArray(author) ? author.join(';') : `${author}`;
}

function getSourceName(result: Result) {
  const source = result.raw['source'];
  if (isNullOrUndefined(source)) {
    return 'unknown';
  }
  return source;
}

export const validateResultPayload = (result: Result) =>
  new Schema(resultPartialDefinition).validate(partialResultPayload(result));

function findPositionInChildResults(
  targetResult: Result,
  parentResults: ResultWithFolding[]
) {
  for (const [i, parent] of parentResults.entries()) {
    const children = getAllIncludedResultsFrom(parent);
    const childIndex = findPositionWithUniqueId(targetResult, children);
    if (childIndex !== -1) {
      return i;
    }
  }

  return -1;
}

function findPositionWithUniqueId(
  targetResult: Result,
  results: ResultWithFolding[] = []
) {
  return results.findIndex(({uniqueId}) => uniqueId === targetResult.uniqueId);
}
