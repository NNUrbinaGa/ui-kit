import {html} from 'lit-html';
import defaultStory from '../../../.storybook/default-story';
import SortDropdownDoc from './atomic-sort-dropdown.mdx';

const {defaultModuleExport, exportedStory} = defaultStory(
  'Atomic/SortDropdown',
  'atomic-sort-dropdown',
  {},
  SortDropdownDoc,
  {
    additionalChildMarkup: () => html`
      <atomic-sort-expression
        label="relevance"
        expression="relevancy"
      ></atomic-sort-expression>
      <atomic-sort-expression
        label="most-recent"
        expression="date descending"
      ></atomic-sort-expression>
    `,
  }
);

export default defaultModuleExport;
export const DefaultSortDropdown = exportedStory;
