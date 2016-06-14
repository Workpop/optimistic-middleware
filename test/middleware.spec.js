import { expect } from 'chai';
import { createStore, combineReducers, applyMiddleware } from 'redux';
import optimisticMiddleware from '../src/middleware';
const partial = require('lodash.partial');

function optimisticUpdate(store) {
  return store.dispatch({
    type: 'UPDATE',
    stateKey: 'test',
    mutation(cb) {
      return cb();
    },
    data: 'FOO',
  });
}

function optimisticFail(store) {
  return store.dispatch({
    type: 'UPDATE',
    stateKey: 'test',
    mutation(cb) {
      const partialCb = partial(cb, { reason: 'you suck' });
      return partialCb();
    },
    data: 'FOO',
  });
}

function testReducer(state = { data: 'BAR' }, action = {}) {
  const { data, type, ...rest } = action;
  if (type === 'UPDATE') {
    return {
      data,
      ...rest,
    };
  }
  return state;
}

const rootReducer = combineReducers({
  test: testReducer,
});


describe('Optimistic Middleware', function () {
  it('should apply the update with an Optimistc flag', function () {
    const store = createStore(rootReducer, {}, applyMiddleware(optimisticMiddleware));
    optimisticUpdate(store);
    expect(store.getState().test.optimisticState).to.eql('OPTIMISTIC_UPDATE_SUCCESS');
    expect(store.getState().test.data).to.eql('FOO');
  });
  it('should should not update state and have a failed optimistic state', function () {
    const store = createStore(rootReducer, {}, applyMiddleware(optimisticMiddleware));
    optimisticFail(store);
    expect(store.getState().test.optimisticState).to.eql('OPTIMISTIC_UPDATE_FAILURE');
    expect(store.getState().test.data).to.eql('BAR');
  });
});
