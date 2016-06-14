const OPTIMISTIC = {
  START: 'OPTIMISTIC_UPDATE_START',
  ERROR: 'OPTIMISTIC_UPDATE_FAILURE',
  SUCCESS: 'OPTIMISTIC_UPDATE_SUCCESS',
};

export default function optimisticMiddleware(store) {
  return (next) => {
    return (action) => {
      const storeState = store.getState();
      const { mutation, stateKey, ...rest } = action;
      // get the previous state before we start
      const previousState = storeState && storeState[stateKey] && storeState[stateKey].data;
      // if we don't have a mutation, proceed like normal
      if (!mutation) {
        return next(action);
      }
      // apply the optimistic update first. This is described in our reducer for this actionType
      next({
        ...rest,
        optimisticState: OPTIMISTIC.START,
      });
      // next we're going to call our mutation, because we're in a Meteor context, we are expecting a callback with e,r
      return mutation((error) => {
        // if there is an error we need to revert our state back to the initial state before middleware ran
        if (error) {
          return next({
            error: error.reason,
            data: previousState,
            optimisticState: OPTIMISTIC.ERROR,
            type: action.type,
          });
        }
        // apply our update again but this time, change the OPTIMISTIC state
        return next({
          ...rest,
          optimisticState: OPTIMISTIC.SUCCESS,
        });
      });
    };
  };
}
