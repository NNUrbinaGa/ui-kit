import defaultStory from '../../../../../../utils/atomic-storybook/.storybook/default-story';

const {defaultModuleExport, exportedStory} = defaultStory(
  'Atomic/ResultsPerPage',
  'atomic-results-per-page',
  {}
);

export default defaultModuleExport;
export const DefaultResultsPerPage = exportedStory;
