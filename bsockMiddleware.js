/* eslint-disable consistent-return */

// With help from the following examples:
// https://exec64.co.uk/blog/websockets_with_redux/
// https://github.com/quirinpa/redux-socket

import bsock from 'bsock';
import assert from 'assert';

export default function bsockMiddleware (options) {
  let socket = null;
  const { debug } = options;

  return ({ dispatch }) => next => async (action) => {
    // check if action has a bsock property
    if (!action.bsock)
      return next(action);

    switch (action.type) {
      case 'CONNECT': {
        // Start a new connection to the server
        if(socket !== null) {
          socket.close();
        }
        // if it has a `connect` action then we connect to the bcoin socket
        const { port, host, ssl, protocols, listeners } = action.bsock;
        socket = bsock.connect(port, host, ssl, protocols);

        socket.on('error', (err) => {
          if (debug)
            console.log('There was an error with bsock: ', err);
          dispatch({ type: 'BSOCK_ERROR', payload: err });
        });

        socket.on('connect', () => {
          // setup the listeners
          listeners.forEach((listener) => {
            const { event, actionType, ack } = listener;
            assert(typeof event === 'string',
              'Event listener was not a string');
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
              socket.bind(event, payload =>
                dispatch({ type: actionType, payload })
              );
            }
          });
        });

        break;
      }

      case 'DISCONNECT': {
        if (socket !== null)
          socket.close();

        socket = null;

        dispatch({ type: 'BSOCK_DISCONNECT' });
        break;
      }

      // A CALL in bsock expects an acknowledgement
      case 'CALL': {
        // then get the type and message to send from action props and emit
        const { type, message, acknowledge } = action.bsock;

        if (socket !== null) {
          try {
            const ack = await socket.call(type, message);
            if (ack) {
              dispatch(acknowledge(ack));
            }
          } catch(error) {
            if (debug)
              console.log('There was a problem calling the socket:', error);
          }
        } else if (debug) {
            console.log('Please connect bsock before trying to call server');
          }

        break;
      }

      case 'FIRE': {
        if (socket !== null) {
          const { type, message } = action.bsock;
          socket.fire(type, message);
        } else if (debug) {
          console.log('Please connect bsock before trying to fire a message');
        }

        break;
      }

      default:
        return next(action);
    }
  };
};
