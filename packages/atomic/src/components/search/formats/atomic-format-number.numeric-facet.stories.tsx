import {defaultStory} from '@coveo/atomic-storybook';

const {defaultModuleExport, exportedStory} = defaultStory(
  'Atomic/NumericFacet/Format/Number',
  'atomic-format-number',
  {},
  {
    parentElement: () => {
      const numericFacetElement = document.createElement(
        'atomic-numeric-facet'
      );
      numericFacetElement.setAttribute('field', 'size');
      return numericFacetElement;
    },
  }
);

export default defaultModuleExport;
export const DefaultFormatNumber = exportedStory;
