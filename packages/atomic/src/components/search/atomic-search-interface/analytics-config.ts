import {
  AnalyticsConfiguration,
  SearchEngineConfiguration,
} from '@coveo/headless';
import {
  AnalyticsPayload,
  augmentAnalyticsWithAtomicVersion,
  augmentWithExternalMiddleware,
  augmentAnalyticsConfigWithDocument,
} from '../../common/interface/analytics-config';
import {createAtomicStore} from './store';

export function getAnalyticsConfig(
  searchEngineConfig: SearchEngineConfiguration,
  enabled: boolean,
  store: ReturnType<typeof createAtomicStore>
): AnalyticsConfiguration {
  const analyticsClientMiddleware = (
    event: string,
    payload: AnalyticsPayload
  ) => augmentAnalytics(event, payload, store, searchEngineConfig);

  const defaultConfiguration: AnalyticsConfiguration = {
    analyticsClientMiddleware,
    enabled,
    ...augmentAnalyticsConfigWithDocument(),
  };

  if (searchEngineConfig.analytics) {
    return {
      ...defaultConfiguration,
      ...searchEngineConfig.analytics,
    };
  }
  return defaultConfiguration;
}

function augmentAnalytics(
  event: string,
  payload: AnalyticsPayload,
  store: ReturnType<typeof createAtomicStore>,
  config: SearchEngineConfiguration
) {
  let result = augmentWithExternalMiddleware(event, payload, config);
  result = augmentAnalyticsWithAtomicVersion(result);
  result = augmentAnalyticsWithFacetTitles(result, store);
  return result;
}

function augmentAnalyticsWithFacetTitles(
  payload: AnalyticsPayload,
  store: ReturnType<typeof createAtomicStore>
) {
  const allFacets = store.getAllFacets();
  const getAtomicFacetLabelOrOriginalTitle = (
    facetId: string,
    originalTitle: string
  ) => (allFacets[facetId] ? allFacets[facetId].label() : originalTitle);

  if (payload.facetState) {
    payload.facetState = payload.facetState.map(
      (analyticsFacetState: {id: string; title: string}) => {
        const {id, title: originalTitle} = analyticsFacetState;
        return {
          ...analyticsFacetState,
          title: getAtomicFacetLabelOrOriginalTitle(id, originalTitle),
        };
      }
    );
  }

  if (
    payload.customData &&
    payload.customData.facetTitle &&
    payload.customData.facetId &&
    payload.customData.facetTitle
  ) {
    payload.customData.facetTitle = getAtomicFacetLabelOrOriginalTitle(
      payload.customData.facetId,
      payload.customData.facetTitle
    );
  }
  return payload;
}
