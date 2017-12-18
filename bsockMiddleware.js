/* eslint-disable consistent-return */

// With help from the following:
// https://exec64.co.uk/blog/websockets_with_redux/
// https://github.com/quirinpa/redux-socket
import 'babel-polyfill';
import bsock from 'bsock';
import assert from 'assert';

export default function bsockMiddleware (options) {
  let socket = null;
  const { listeners, debug } = options;
  return ({ dispatch }) => next => async (action) => {
    // check if action has a bsock property
    if (!action.bsock)
      return next(action);

    switch (action.type) {
      case 'CONNECT_SOCKET': {
        if (debug)
          console.log('Connecting bsock client');
        // Start a new connection to the server
        if(socket !== null) {
          socket.close();
        }
        // if it has a `connect` action then we connect to the bcoin socket
        const { port, host, ssl, protocols } = action.bsock;
        socket = bsock.connect(port, host, ssl, protocols);

        socket.on('error', (err) => {
          if (debug)
            console.log('There was an error with bsock: ', err);
          dispatch({ type: 'SOCKET_ERROR', payload: err });
        });

        socket.on('connect', () => {
          if (debug)
            console.log('bsock client connected');
          // setup the listeners
          if (listeners && listeners.length) {
            listeners.forEach((listener) => {
              const { event, actionType, ack } = listener;

              assert(typeof event === 'string',
                'Event listener was not a string');
              // actionType is required to dispatch the action when msg received
              assert(actionType && (typeof actionType === 'string'),
                'Need an action type to create the action');

              if (ack) {
                // for listeners that need to acknowledge, use `bsock.hook`
                socket.hook(event, async (payload) => {
                  if (payload) {
                    dispatch({ type: actionType, payload});
                  }
                  return Buffer.from(ack);
                });
              } else {
                if (debug)
                  console.log('dispatch: ', typeof dispatch);
                socket.bind(event, payload =>
                  dispatch({ type: actionType, payload })
                );
              }
            });
          }
        });

        break;
      }

      case 'DISCONNECT_SOCKET': {
        if (socket !== null)
          socket.close();

        socket = null;

        dispatch({ type: 'SOCKET_DISCONNECTED' });
        break;
      }

      case 'EMIT_SOCKET': {
        if (socket === null) {
            console.log('Please connect bsock before trying to call server');
            return next(action);
        }

        const { type, message, acknowledge } = action.bsock;

        try {
          if (acknowledge) {
            assert(typeof acknowledge === 'function',
              'acknowledge property must be a function'
            );
            const ack = await socket.call(type, message);
            if (ack) {
              dispatch(acknowledge(ack));
            }
          } else {
            // if there's no acknowledge function then just use the fire method
            socket.fire(type, message);
          }
        } catch(error) {
          if (debug)
            console.log('There was a problem calling the socket:', error);
        }

        break;
      }

      default:
        return next(action);
    }
  };
};
