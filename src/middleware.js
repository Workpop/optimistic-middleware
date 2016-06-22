const isFunction = require('lodash.isfunction');

export default function optimisticMiddleware(store) {
  return (next) => {
    return (action) => {
      const { simulate, onSuccess, onError, async, stateKey } = action;
      // if we don't have a mutation, proceed like normal
      if (!simulate) {
        return next(action);
      }

      if (!stateKey) {
        throw new Error('Must include a stateKey to process actions via Optimistic Middleware');
      }
      // get state of the world before mutation
      const storeState = store.getState();
      // get the previous state before we start
      const previousState = storeState && storeState[stateKey] && storeState[stateKey].data;

      // apply the optimistic update first. This is described in our reducer for this actionType
      // if there is a simulation function, run the simulation with dispatch and data from the action bound to it.
      if (isFunction(simulate)) {
        simulate(next, previousState);
      } else {
        // otherwise dispatch the type with the data passed to the action creator
        next(simulate);
      }
      // next we're going to call our mutation, because we're in a Meteor context, we are expecting a callback with e,r
      return async((error, result) => {
        // if there is an error we need to revert our state back to the initial state before middleware ran
        if (error) {
          // if the user supplies an onError callback as a function, call their function with
          // dispatch, the previousState, and the error we received
          if (isFunction(onError)) {
            return onError(next, error, previousState);
          }
          if (isFunction(simulate)) {
            throw new Error('You passed a simulation function without an onError callback. Simulation functions must use onError callbacks for reverting state');
          }
          // if not, automatically pass the original type action the previousState as data
          return next({
            data: previousState,
            type: simulate.type,
          });
        }
        // apply our update again but this time, change the OPTIMISTIC state
        // if the user supplies a onSuccess callback as a function, call their function with
        // dispatch and the result of our async cal
        if (!isFunction(onSuccess)) {
          return false;
        }
        return onSuccess(next, result);
      });
    };
  };
}
