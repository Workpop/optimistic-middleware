v2.0.0
Middleware changes:
* middleware requires either a simulate object with `type` and `data` or a `simulate` function
* `simulate` denotes the optimistic middleware to run
* dispatches without `stateKey` will throw
* `simulate` functions without corresponding `onError` functions will throw
* `onError` functions arguments have changed. `prevState` is now the last argument.

v1.0.0

Middleware will change quite a bit. Here are the API changes:
* the middleware accepts a `simulate` function that binds `dispatch` and `data` from the action creator. 
* `mutation` will not be a key the middleware uses to determine an optimistic update, rather users will need to pass a boolean `optimistic` as true and pass in an key named `async` which holds their mutation/remote call.
* `onError` now binds the `dispatch`, `previousState`, and `error` to the function passed in. This will allow you to write more flexible error conditions.
* `onSuccess` now binds the `dispatch`, and the `result` of the async call to the function. This will allow you to write more power onSuccess handlers to continue the dispatch chain.
* if no `onError` is sent with the `action`, the store will restore `previousState` to the action passed in.
* if no `onSuccess` is sent with the `action`, the middleware will exit.

