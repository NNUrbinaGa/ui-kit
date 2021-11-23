import {StaticFilterSlice} from '../features/static-filter-set/static-filter-set-state';

export function buildMockStaticFilterSlice(
  config: Partial<StaticFilterSlice> = {}
): StaticFilterSlice {
  return {
    id: '',
    values: [],
    ...config,
  };
}
