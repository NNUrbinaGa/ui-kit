import defaultStory from 'atomic-storybook/default-story';

const {defaultModuleExport, exportedStory} = defaultStory(
  'Atomic/QuerySummary',
  'atomic-query-summary',
  {}
);
export default defaultModuleExport;
export const DefaultQuerySummary = exportedStory;
