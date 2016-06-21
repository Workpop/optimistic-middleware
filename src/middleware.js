const OPTIMISTIC = {
  START: 'OPTIMISTIC_UPDATE_START',
  ERROR: 'OPTIMISTIC_UPDATE_FAILURE',
  SUCCESS: 'OPTIMISTIC_UPDATE_SUCCESS',
};

export default function optimisticMiddleware() {
  return (store) => {
    return (next) => {
      return (action) => {
        const storeState = store.getState();
        const { onSuccess, onError, errorType, mutation, stateKey, data, type, ...rest } = action;
        // get the previous state before we start
        const previousState = storeState && storeState[stateKey] && storeState[stateKey].data;
        // if we don't have a mutation, proceed like normal
        if (!mutation) {
          return next(action);
        }
        // apply the optimistic update first. This is described in our reducer for this actionType
        next({
          type,
          data,
          optimisticState: OPTIMISTIC.START,
          ...rest,
        });
        // next we're going to call our mutation, because we're in a Meteor context, we are expecting a callback with e,r
        mutation((error, result) => {
          // if there is an error we need to revert our state back to the initial state before middleware ran
          if (error) {
            if (_.isFunction(onError)) {
              onError(error);
            }
            return next({
              error: error.reason,
              data: previousState,
              optimisticState: OPTIMISTIC.ERROR,
              type: errorType || type,
            });
          }
          // apply our update again but this time, change the OPTIMISTIC state
          if (_.isFunction(onSuccess)) {
            onSuccess(result);
          }
          return next({
            type,
            optimisticState: OPTIMISTIC.SUCCESS,
            data,
          });
        });
      };
    };
  };
}
