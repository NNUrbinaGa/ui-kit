import {SearchPageClientProvider} from 'coveo.analytics';
import {SearchEventRequest} from 'coveo.analytics/dist/definitions/events';
import {getQueryInitialState} from '../../features/query/query-state';
import {getRecommendationInitialState} from '../../features/recommendation/recommendation-state';
import {
  ConfigurationSection,
  ContextSection,
  PipelineSection,
  RecommendationSection,
  SearchHubSection,
} from '../../state/state-sections';
import {BaseAnalyticsProvider} from './base-analytics';

export type StateNeededByRecommendationAnalyticsProvider =
  ConfigurationSection &
    Partial<
      SearchHubSection &
        PipelineSection &
        ContextSection &
        RecommendationSection
    >;

export class RecommendationAnalyticsProvider
  extends BaseAnalyticsProvider
  implements SearchPageClientProvider
{
  constructor(private state: StateNeededByRecommendationAnalyticsProvider) {
    super(state);
  }

  public getPipeline(): string {
    return (
      this.state.pipeline || this.state.recommendation?.pipeline || 'default'
    );
  }

  public getSearchEventRequestPayload(): Omit<
    SearchEventRequest,
    'actionCause' | 'searchQueryUid'
  > {
    return {
      queryText: getQueryInitialState().q,
      responseTime: this.responseTime,
      results: this.mapResultsToAnalyticsDocument(),
      numberOfResults: this.numberOfResults,
    };
  }

  public getSearchUID(): string {
    return (
      this.state.recommendation?.searchUid ||
      getRecommendationInitialState().searchUid
    );
  }

  public getSplitTestRunName(): string | undefined {
    return this.state.recommendation?.splitTestRun;
  }

  public getSplitTestRunVersion(): string | undefined {
    const hasSplitTestRun = !!this.getSplitTestRunName();
    const effectivePipelineWithSplitTestRun =
      this.state.recommendation?.pipeline || this.state.pipeline || 'default';

    return hasSplitTestRun ? effectivePipelineWithSplitTestRun : undefined;
  }

  private get responseTime() {
    return (
      this.state.recommendation?.duration ||
      getRecommendationInitialState().duration
    );
  }

  private mapResultsToAnalyticsDocument() {
    return this.state.recommendation?.recommendations.map((r) => ({
      documentUri: r.uri,
      documentUriHash: r.raw.urihash,
    }));
  }

  private get numberOfResults() {
    return (
      this.state.recommendation?.recommendations.length ||
      getRecommendationInitialState().recommendations.length
    );
  }
}
