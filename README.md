# Optimistic Middleware

Optimistically apply actions that will be reverted on error.

## Installation

`npm install --save @workpop/optimistic-middleware`

## Usage

### Step 1: Create your Reducer

Optimistic updates require your reducer to have a certain state shape. 

```js
type OptimisticStateType = {
    data: any,
    optimisticState: string
}
```

```js
function todos(state = {}, action = {}) {
    const { type, data, ...rest } = action;
    switch(type) {
        case 'ADD_TODO':
            const todos = state.data;
            return {
                data: todos.concat([data.text]),
                ...rest
            };
        default:
            return state;
    }
}
```

### Step 2: Build your Action Creator

```js
function optimisticAddTodo(text) {
    return {
        type: 'ADD_TODO',
        stateKey: 'todos',
        mutation(cb) {
            return Meteor.call('addTodo', cb);
        },
        data: text
    }
}
```

Let's break down our action shape:

```js
type OptimisticActionType = {
    type: string,
    stateKey: string,
    mutation: Function,
    data: any
}
```

Parameters:

1. `[type] - action type corresponding to reducer state change`
2. `[stateKey] - key of reducer related to action`
3. `[mutation] - asynchronous function intended to mutate some data on the server`
4. `[data] - data needed to change the state in the reducer`

## How this works:

When you dispatch an OptimisticAction, the action is intercepted by Redux middleware. Immediately we save the previous state of the passed in `stateKey` in case our action throws an error. 

We start the dispatch process immediately executing the data change in the action to the reducer. The state is appended with `OPTIMISTIC_UPDATE_START`, to signal the start of our dispatch.

From there, we call our asynchronous method. 

If the method returns an error, we append several pieces of meta data with the error reason and `OPTIMISTIC_UPDATE_FAILURE` (helpful for development).

 ```js
 type OptimisticErrorType = {
    error: string,
    data: any
    optimisticState: string,
    type: string
 }
 ```
If successful, we append `OPTIMISTIC_UPDATE_SUCCESS` and finish the dispatch process.

## Caveats

Because we are reverting our state when errors occur based on the reducer state, this middleware is confined to the reducer `stateKey` passed into the action. Optimistic Middleware does not currently support updates that affect multiple stateKeys.
