import defaultStory from 'atomic-storybook/default-story';

const {defaultModuleExport, exportedStory} = defaultStory(
  'Atomic/ResultList',
  'atomic-result-list',
  {}
);
export default defaultModuleExport;
export const DefaultResultList = exportedStory;
