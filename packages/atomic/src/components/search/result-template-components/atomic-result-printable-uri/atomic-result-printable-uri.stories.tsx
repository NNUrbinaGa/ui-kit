import {defaultResultComponentStory} from '@coveo/atomic-storybook';

const {defaultModuleExport, exportedStory} = defaultResultComponentStory(
  'Atomic/ResultList/ResultPrintableUri',
  'atomic-result-printable-uri',
  {}
);

export default defaultModuleExport;
export const DefaultResultPrintableUri = exportedStory;
