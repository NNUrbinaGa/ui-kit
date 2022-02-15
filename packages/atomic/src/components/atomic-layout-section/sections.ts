export type Section = 'search' | 'facets' | 'status' | 'main' | 'pagination';

export function findSection(element: HTMLElement, section: Section) {
  return element.querySelector(
    sectionSelector(section)
  ) as HTMLAtomicLayoutSectionElement | null;
}

export function sectionSelector(section: Section) {
  return `atomic-layout-section[section="${section}"]`;
}
