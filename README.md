# Optimistic Middleware

Optimistically apply actions that will be reverted on error.

## Installation

`npm install --save @workpop/optimistic-middleware`

`import { optimisticMiddleware } from '@workpop/optimistic-middleware';`

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

#### Generic Optimistic Action Creator
```js
function optimisticAddTodo(text) {
    return {
        simulate: {
            type: 'ADD_TODO',
            data: text,
        },
        stateKey: 'todos',
        async(cb) {
            return Meteor.call('addTodo', text, cb);
        }
    }
}

```

#### Functional Simulation
the simulate function will allow you to customize your simulations.

```js
function optimisticAddTodo(text) {
    return {
        simulate(dispatch, data) {
            dispatch({
               type: 'ADD_TODO_ID',
               data: _.get(data, '_id');
            });
            return dispatch({
                type: 'ALL_TODOS',
                data
            });
        }
        stateKey: 'todos',
        async(cb) {
            return Meteor.call('addTodo', text, cb);
        }
    }
}
```

#### Custom Errors

```js
function optimisticAddTodo(text) {
    return {
        simulate: {
            type: 'ADD_TODO',
            data: text,
        },
        onError(dispatch, prevState, error) {
            if (error.reason === 'you suck') {
                dispatch({
                    type: 'TODO_ERROR',
                    data: error.reason
                }); 
            }
            
            return dispatch({
                type: 'ADD_TODO',
                data: prevState
            });
        }
        stateKey: 'todos',
        async(cb) {
            return Meteor.call('addTodo', text, cb);
        }
    }
}
```

#### Custom onSuccess
```js
function someThunk(result) {
    return (dispatch) => {
        someOtherAsync(result,(e, result) => {
            if (e) {
                console.error('ERROR');
            }
            dispatch({
                type: 'TOGGLE_TODO_LIST',
                data: result
            });
        });
    }
}
function optimisticAddTodo(text) {
    return {
        simulate: {
            type: 'ADD_TODO',
            data: text,
        },
        onSuccess(dispatch, result) {
            dispatch(someThunk(result));
        },
        stateKey: 'todos',
        async(cb) {
            return Meteor.call('addTodo', text, cb);
        }
    }
}
```


Let's break down our action shape:

```js
type OptimisticActionType = {
    simulate: {
        type: string,
        data: any
    }
    stateKey: !string,
    async: Function,
    onError: ?Function,
    onSuccess: ?Function,
}
```

```js
type OptimisticActionSimulateFuncType = {
    simulate: Function
    stateKey: !string,
    async: Function,
    onError: ?Function,
    onSuccess: ?Function,
}
```

Parameters:

1. `[simulate] - object or function to handle simulation. type/data if object, if function  dispatch, data`
2. `[stateKey] - key of reducer related to action`
3. `[async] - asynchronous function intended to make mutation/remote call to the server`
4. `[onSuccess] - function to be called when async function returns *optional`
6. `[onError] - function to be called when the async function returns an error *optional`


## How this works:

When you dispatch an OptimisticAction, the action is intercepted by Redux middleware. Immediately we save the previous state of the passed in `stateKey` in case our action throws an error. 

We start the dispatch process immediately executing the data change in the action to the reducer.
From there, we call our asynchronous method. 

If the method returns an error, we append several pieces of meta data with the error reason.

 ```js
 type OptimisticErrorType = {
    data: any
    type: string
 }
 ```
## Caveats

Because we are reverting our state when errors occur based on the reducer state, this middleware is confined to the reducer `stateKey` passed into the action. Optimistic Middleware does not currently support updates that affect multiple stateKeys.
