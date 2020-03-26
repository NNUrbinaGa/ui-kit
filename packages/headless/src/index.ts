import {configureStore} from './app/store';
import {RootState} from './app/rootReducer';
import {Store, bindActionCreators} from 'redux';
import {performSearch} from './features/search/searchSlice';

class CoveoHeadlessEngine {
  private store: Store<RootState>;
  constructor() {
    this.store = configureStore();
  }

  get reduxStore() {
    return this.store;
  }

  get state(): RootState {
    return this.store.getState();
  }

  get performSearch() {
    return bindActionCreators(performSearch, this.store.dispatch);
  }
}

export {CoveoHeadlessEngine, RootState as CoveoHeadlessState};
