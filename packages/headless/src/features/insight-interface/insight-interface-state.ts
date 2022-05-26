export const getInsightInterfaceInitialState = (): InsightInterfaceState => ({
  loading: false,
  config: undefined,
});

export interface InsightInterfaceState {
  loading: boolean;
  config?: {
    contextFields: Record<string, string | number | string[]>;
    interface?: any; // TODO: strong type this section
  };
}
