import {ArrayValue, isArray, Schema} from '@coveo/bueno';
import {CoreEngine} from '../../../app/engine';
import {configuration, sortCriteria} from '../../../app/reducers';
import {updatePage} from '../../../features/pagination/pagination-actions';
import {
  buildCriterionExpression,
  SortCriterion,
  criterionDefinition,
} from '../../../features/sort-criteria/criteria';
import {
  registerSortCriterion,
  updateSortCriterion,
} from '../../../features/sort-criteria/sort-criteria-actions';
import {ConfigurationSection, SortSection} from '../../../state/state-sections';
import {loadReducerError} from '../../../utils/errors';
import {validateInitialState} from '../../../utils/validate-payload';
import {
  buildController,
  Controller,
} from '../../controller/headless-controller';

export interface SortProps {
  /**
   * The initial state that should be applied to this `Sort` controller.
   */
  initialState?: SortInitialState;
}

export interface SortInitialState {
  /**
   * The initial sort criterion to register in state.
   */
  criterion?: SortCriterion | SortCriterion[];
}

function validateSortInitialState(
  engine: CoreEngine<ConfigurationSection & SortSection>,
  state: Partial<SortInitialState> | undefined
) {
  if (!state) {
    return;
  }

  const schema = new Schema<SortInitialState>({
    criterion: new ArrayValue({each: criterionDefinition}) as never,
  });
  const criterion = getCriterionAsArray(state);
  const initialState: SortInitialState = {...state, criterion};

  validateInitialState(engine, schema, initialState, 'buildSort');
}

function getCriterionAsArray(state: Partial<SortInitialState>) {
  if (!state.criterion) {
    return [];
  }

  return isArray(state.criterion) ? state.criterion : [state.criterion];
}

/**
 * The `Sort` controller manages how the results are sorted.
 */
export interface Sort extends Controller {
  /**
   * Updates the sort criterion and executes a new search.
   *
   * @param criterion - The new sort criterion.
   */
  sortBy(criterion: SortCriterion | SortCriterion[]): void;

  /**
   * Checks whether the specified sort criterion matches the value in state.
   *
   * @param criterion - The criterion to compare.
   * @returns `true` if the passed sort criterion matches the value in state, and `false` otherwise.
   */
  isSortedBy(criterion: SortCriterion | SortCriterion[]): boolean;

  /**
   * A scoped and simplified part of the headless state that is relevant to the `Sort` controller.
   */
  state: SortState;
}

export interface SortState {
  /**
   * The current sort criteria.
   */
  sortCriteria: string;
}

/**
 * Creates a `Sort` controller instance.
 *
 * @param engine - The headless engine.
 * @param props - The configurable `Sort` controller properties.
 * @returns A `Sort` controller instance.
 */
export function buildCoreSort(engine: CoreEngine, props: SortProps): Sort {
  if (!loadSortReducers(engine)) {
    throw loadReducerError;
  }

  const controller = buildController(engine);
  const {dispatch} = engine;
  const getState = () => engine.state;

  validateSortInitialState(engine, props.initialState);

  const criterion = props.initialState?.criterion;

  if (criterion) {
    dispatch(registerSortCriterion(criterion));
  }

  return {
    ...controller,

    sortBy(criterion: SortCriterion | SortCriterion[]) {
      dispatch(updateSortCriterion(criterion));
      dispatch(updatePage(1));
    },

    isSortedBy(criterion: SortCriterion | SortCriterion[]) {
      return this.state.sortCriteria === buildCriterionExpression(criterion);
    },

    get state() {
      return {
        sortCriteria: getState().sortCriteria,
      };
    },
  };
}

function loadSortReducers(
  engine: CoreEngine
): engine is CoreEngine<ConfigurationSection & SortSection> {
  engine.addReducers({configuration, sortCriteria});
  return true;
}
