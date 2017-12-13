# bsock-middleware
This package is a redux middleware implementation for websocket actions using the bsock client.

**QUICK START**

`npm install --save bsock-middleware`

```javascript
import { createStore, applyMiddleware } from 'redux';
import thunkMiddleware from 'redux-thunk';
import bsockMiddleware from 'bsock-middleware';

import rootReducer from './reducers';

export default function configureStore(initialState) {
  return createStore(rootReducer, initialState,
    applyMiddleware(thunkMiddleware, bsockMiddleware)
  )
}
```
## What is bsock?
bsock is a minimal websocket-only implementation of the socket.io protocol, complete with ES6/ES7 features. It is extremely performant and lightweight. It is also compatible with the socket.io api so this can be used to communicate with a socket.io server if necessary. More information on bsock, see the official [repo on GitHub](https://github.com/bcoin-org/bsock)

## Redux Middleware and Websockets
This redux middleware implementation is based off the following resources and examples:
- [Redux WebSocket Integration](https://medium.com/@ianovenden/redux-websocket-integration-c1a0d22d3189)
- [redux-socket](https://github.com/quirinpa/redux-socket)
- [Websockets with Redux](https://exec64.co.uk/blog/websockets_with_redux/)

To get a detailed overview of how middlewares work in redux, check out the [official docs](https://redux.js.org/docs/advanced/Middleware.html). The basic idea is that through some JavaScript currying magic and leveraging the predictablity of state changes you can intercept actions to operate on from middleware (and pass along to subsequent middleware if necessary). From the docs:

> One of the benefits of Redux is that it makes state changes predictable and transparent. Every time an action is dispatched, the new state is computed and saved. The state cannot change by itself, it can only change as a consequence of a specific action

> [Middleware] provides a third-party extension point between dispatching an action, and the moment it reaches the reducer. People use Redux middleware for logging, crash reporting, talking to an asynchronous API, routing, and more.


Middleware is particularly useful when dealing with networking and async operations that operate on the store. For situations when we want websocket interactions to update the state of the store, say we receive a message that should update the state or want to send a message and change the state upon acknowledgement from the server, we have middleware.

The important things that a piece of middleware gets access to are the actions and the store. This means we can do things like `dispatch` or `getState` from our middleware, or check what a `action.type` is that has been dispatched.

## Usage
bsock-middleware checks for a few things when it intercepts actions. If an action does not have a `bsock` property at all, it just passes the action on to the next middleware in the chain via `return next(action)`.

### Action Types
If it does have a bsock property then these are the action types it reacts to:
- `CONNECT_SOCKET`
- `DISCONNECT_SOCKET`
- `EMIT_SOCKET`

(Notice there is nothing for listeners. We'll get to that next).

Options for each are sent as properties in the bsock property on the action.

`CONNECT_SOCKET` accepts `port`, `host`, `ssl`, and `protocols`

`DISCONNECT_SOCKET` takes no properties

`EMIT_SOCKET` takes `type`, `message`, and an optional `acknowledge` function. If there is an `acknowledge` function passed, bsock will use the `call` method instead of `fire` and wait to receive an acknowledgement which will then be passed to the passed `acknowledge` function. This should be an action creator as it gets passed to the store's `dispatch` function.

### Options and Listeners
`bsockMiddleware` returns a function. To add the middleware you call it and can optionally pass in an `options` object which currently takes only two properties: `debug` (bool) and `listeners`. `debug` is self-explanatory (true will log status messages to your console). `listeners` is an array of listener objects with properties `event` and `actionType` (both _strings_) and an optional `ack` property.

When you connect a socket, any listeners passed in the options are added to the socket. What happens is that when an `event` is "heard", the payload is received and then passed to an action creator with type `actionType` and payload `payload` which is then dispatched. If there is an `ack` property, then the `hook` method is used which returns an acknowledgement message of `Buffer.from(ack)` after dispatching the action creator.

### Simple Example
First install the package with npm:

```bash
npm install --save bsock-middleware
```

#### Middleware
```javascript
/* store/index.js */

import { combineReducers, createStore, applyMiddleware } from 'redux';
import thunkMiddleware from 'redux-thunk';
import bsockMiddleware from 'bsock-middleware';

import * as reducers from './reducers';

const listeners = [
  {
    event: 'foo bar',
    actionType: 'FOO_BAR_RECEIVED'
  }
];

const options = { debug: true, listeners };

const rootReducer = combineReducers(reducers);
const middleware = [thunkMiddleware, bsockMiddleware(options)]

const store = createStore(rootReducer, applyMiddleware(...middleware));

export default store;
```

#### Action Creators
```javascript
/* store/actions/socketActions.js */

export function connectSocket() {
  return {
    type: 'CONNECT_SOCKET',
    bsock: {
      host: 'localhost',
      port: 5000
    }
  };
};

export function emitFizz() {
  return {
    type: 'EMIT_SOCKET',
    bsock: {
      type: 'fizz',
      message: Buffer.from('buzz'),
      acknowledge: acknowledgeFizzBuzz
    }
  }
}

export function acknowledgeFizzBuzz(ack) {
  return {
    type: 'ACKNOWLEDGE_FIZZ_BUZZ',
    payload: ack
  }
}
```

#### Reducer
```javascript
/* store/reducers/index.js */

export const fooState(state = {}, action){
  let newState = { ...state };
  switch (action.type) {
    case 'FOO_BAR_RECEIVED': {
      newState.fooBar = action.payload
      return newState;
    }
    default:
      return state;
  }
}
```

Then at the entry point of your app simply dispatch `connectSocket()`. After that, you can start listening for `foo bar` via the `FOO_BAR_RECEIVED` action type, emitting by dispatching `emitFizz`, and even catch erros with `SOCKET_ERROR` (dispatched by the middleware).

## Contribution and License Agreement

If you contribute code to this project, you are implicitly allowing your code
to be distributed under the MIT license. You are also implicitly verifying that
all code is your original work. `</legalese>`

## License

- Copyright (c) 2017, Buck Perley (MIT License).
