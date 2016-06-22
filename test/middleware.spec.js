import { expect } from 'chai';
import { test } from 'sinon';
import { createStore, combineReducers, applyMiddleware } from 'redux';
import optimisticMiddleware from '../src/middleware';
const partial = require('lodash.partial');

function optimisticUpdate(store) {
  return store.dispatch({
    optimistic: true,
    type: 'UPDATE',
    stateKey: 'test',
    async(cb) {
      return cb();
    },
    data: 'FOO',
  });
}

function optimisticUpdateWithSuccess(store, onSuccess) {
  return store.dispatch({
    optimistic: true,
    type: 'UPDATE',
    stateKey: 'test',
    async(cb) {
      return cb();
    },
    data: 'FOO',
    onSuccess,
  });
}

function optimisticFail(store) {
  store.dispatch({
    type: 'UPDATE',
    data: 'BAR',
  });
  return store.dispatch({
    type: 'UPDATE',
    optimistic: true,
    stateKey: 'test',
    async(cb) {
      const partialCb = partial(cb, { reason: 'you suck' });
      return partialCb();
    },
    data: 'FOO',
  });
}

function optimisticSimulation(store, simulate) {
  return store.dispatch({
    type: 'UPDATE',
    data: 'FOO',
    optimistic: true,
    simulate,
    stateKey: 'test',
    async(cb) {
      const partialCb = partial(cb, { reason: 'you suck' });
      return partialCb();
    },
  });
}

function optimisticFailWithError(store, onError) {
  return store.dispatch({
    type: 'UPDATE',
    stateKey: 'test',
    optimistic: true,
    async(cb) {
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


  it('should apply the update optimistically', function () {
    optimisticUpdate(store);
    expect(store.getState().test.data).to.eql('FOO');
  });
  it('should not update state if method fails', function () {
    optimisticFail(store);
    expect(store.getState().test.data).to.eql('BAR');
  });
  it('should call the onError handler if present when update is successful', test(function () {
    const simulate = this.spy();
    optimisticSimulation(store, simulate);
    expect(simulate).to.have.been.called;
  }));
  it('should call the onSuccess handler if present when update is successful', test(function () {
    const onSuccess = this.spy();
    optimisticUpdateWithSuccess(store, onSuccess);
    expect(onSuccess).to.have.been.called;
  }));

  it('should call the simulate handler if present', test(function () {
    const simulate = this.spy();
    optimisticFailWithError(store, simulate);
    expect(simulate).to.have.been.called;
  }));
});
