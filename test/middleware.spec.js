import { expect } from 'chai';
import { test } from 'sinon';
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

function optimisticUpdateWithSuccess(store, onSuccess) {
  return store.dispatch({
    type: 'UPDATE',
    stateKey: 'test',
    mutation(cb) {
      return cb();
    },
    data: 'FOO',
    onSuccess,
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

function optimisticFailWithErrorType(store) {
  return store.dispatch({
    errorType: 'ERROR',
    type: 'UPDATE',
    stateKey: 'test',
    mutation(cb) {
      const partialCb = partial(cb, { reason: 'you suck' });
      return partialCb();
    },
    data: 'FOO',
  });
}

function optimisticFailWithError(store, onError) {
  return store.dispatch({
    type: 'UPDATE',
    stateKey: 'test',
    mutation(cb) {
      const partialCb = partial(cb, { reason: 'you suck' });
      return partialCb();
    },
    data: 'FOO',
    onError,
  });
}

function testReducer(state = { data: 'BAR' }, action = {}) {
  const { data, type, ...rest } = action;
  if (type === 'UPDATE') {
    return {
      data,
      ...rest,
    };
  } else if (type === 'ERROR') {
    return {
      data: 'ERROR',
      ...rest
    }
  }
  return state;
}

const rootReducer = combineReducers({
  test: testReducer,
});


describe('Optimistic Middleware', function () {
  let store;
  beforeEach(function () {
    store = createStore(rootReducer, {}, applyMiddleware(optimisticMiddleware));
  });
  it('should apply the update with an Optimistc flag', function () {
    optimisticUpdate(store);
    expect(store.getState().test.optimisticState).to.eql('OPTIMISTIC_UPDATE_SUCCESS');
    expect(store.getState().test.data).to.eql('FOO');
  });
  it('should not update state and have a failed optimistic state', function () {
    optimisticFail(store);
    expect(store.getState().test.optimisticState).to.eql('OPTIMISTIC_UPDATE_FAILURE');
    expect(store.getState().test.data).to.eql('BAR');
  });
  it('should call the onSuccess handler if present when update is successful', test(function () {
    const onSuccess = this.spy();
    optimisticUpdateWithSuccess(store, onSuccess);
    expect(store.getState().test.optimisticState).to.eql('OPTIMISTIC_UPDATE_SUCCESS');
    expect(onSuccess).to.have.been.called;
  }));

  it('should call the onError handler if present when update is successful', test(function () {
    const onError = this.spy();
    optimisticFailWithError(store, onError);
    expect(store.getState().test.optimisticState).to.eql('OPTIMISTIC_UPDATE_FAILURE');
    expect(onError).to.have.been.called;
  }));

  it('should update the store differently if an errorType is passed in', function () {
    optimisticFailWithErrorType(store);
    expect(store.getState().test.optimisticState).to.eql('OPTIMISTIC_UPDATE_FAILURE');
    expect(store.getState().test.data).to.eql('ERROR');
  });
});
