function _objectWithoutProperties(obj, keys) { var target = {}; for (var i in obj) { if (keys.indexOf(i) >= 0) continue; if (!Object.prototype.hasOwnProperty.call(obj, i)) continue; target[i] = obj[i]; } return target; }

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

/* eslint-disable consistent-return */

// With help from the following:
// https://exec64.co.uk/blog/websockets_with_redux/
// https://github.com/quirinpa/redux-socket
import 'babel-polyfill';
import bsock from 'bsock';
import assert from 'assert';

export default function bsockMiddleware(options) {
  var _this = this;

  var socket = null;
  var listeners = options.listeners,
      debug = options.debug,
      disconnectedAction = options.disconnectedAction;

  return function (_ref) {
    var dispatch = _ref.dispatch;
    return function (next) {
      return function () {
        var _ref2 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee2(action) {
          var _action$bsock, port, host, ssl, protocols, _action$bsock2, type, message, acknowledge, rest, args, _socket, ack, _socket2;

          return regeneratorRuntime.wrap(function _callee2$(_context2) {
            while (1) {
              switch (_context2.prev = _context2.next) {
                case 0:
                  if (action.bsock) {
                    _context2.next = 2;
                    break;
                  }

                  return _context2.abrupt('return', next(action));

                case 2:
                  _context2.t0 = action.type;
                  _context2.next = _context2.t0 === 'CONNECT_SOCKET' ? 5 : _context2.t0 === 'DISCONNECT_SOCKET' ? 12 : _context2.t0 === 'EMIT_SOCKET' ? 18 : 40;
                  break;

                case 5:
                  if (debug) console.log('Connecting bsock client');
                  // Start a new connection to the server
                  if (socket !== null) {
                    socket.close();
                  }
                  // if it has a `connect` action then we connect to the bcoin socket
                  _action$bsock = action.bsock, port = _action$bsock.port, host = _action$bsock.host, ssl = _action$bsock.ssl, protocols = _action$bsock.protocols;

                  socket = bsock.connect(port, host, ssl, protocols);

                  socket.on('error', function (err) {
                    if (debug) console.error('There was an error with bsock: ', err);
                    if (disconnectedAction) return next(disconnectedAction);
                    dispatch({ type: 'SOCKET_ERROR', payload: err });
                  });

                  socket.on('connect', function () {
                    if (debug) console.log('bsock client connected');

                    // setup the listeners
                    if (listeners && listeners.length) {
                      listeners.forEach(function (listener) {
                        var event = listener.event,
                            actionType = listener.actionType,
                            ack = listener.ack;


                        assert(typeof event === 'string', 'Event listener was not a string');
                        // actionType is required to dispatch the action when msg received
                        assert(actionType && typeof actionType === 'string', 'Need an action type to create the action');

                        if (ack) {
                          // for listeners that need to acknowledge, use `bsock.hook`
                          socket.hook(event, function () {
                            var _ref3 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee(payload) {
                              return regeneratorRuntime.wrap(function _callee$(_context) {
                                while (1) {
                                  switch (_context.prev = _context.next) {
                                    case 0:
                                      if (payload) {
                                        dispatch({ type: actionType, payload: payload });
                                      }
                                      return _context.abrupt('return', Buffer.from(ack));

                                    case 2:
                                    case 'end':
                                      return _context.stop();
                                  }
                                }
                              }, _callee, _this);
                            }));

                            return function (_x2) {
                              return _ref3.apply(this, arguments);
                            };
                          }());
                        } else {
                          if (debug) console.log('binding event: ', event);
                          socket.bind(event, function () {
                            for (var _len = arguments.length, data = Array(_len), _key = 0; _key < _len; _key++) {
                              data[_key] = arguments[_key];
                            }

                            return dispatch({ type: actionType, payload: data });
                          });
                        }
                      });
                    }

                    dispatch({
                      type: 'SOCKET_CONNECTED'
                    });
                  });

                  return _context2.abrupt('break', 41);

                case 12:
                  if (socket !== null) socket.close();

                  socket = null;

                  if (!disconnectedAction) {
                    _context2.next = 16;
                    break;
                  }

                  return _context2.abrupt('return', next(disconnectedAction));

                case 16:

                  dispatch({ type: 'SOCKET_DISCONNECTED' });
                  return _context2.abrupt('break', 41);

                case 18:
                  if (!(socket === null)) {
                    _context2.next = 21;
                    break;
                  }

                  console.log('Please connect bsock before trying to call server');
                  return _context2.abrupt('return', next(action));

                case 21:
                  _action$bsock2 = action.bsock, type = _action$bsock2.type, message = _action$bsock2.message, acknowledge = _action$bsock2.acknowledge, rest = _objectWithoutProperties(_action$bsock2, ['type', 'message', 'acknowledge']);
                  args = [];

                  if (Object.keys(rest).length) {
                    args = Object.keys(rest).map(function (key) {
                      return rest[key];
                    });
                  }

                  _context2.prev = 24;

                  if (!acknowledge) {
                    _context2.next = 33;
                    break;
                  }

                  assert(typeof acknowledge === 'function', 'acknowledge property must be a function');
                  _context2.next = 29;
                  return (_socket = socket).call.apply(_socket, [type, message].concat(args));

                case 29:
                  ack = _context2.sent;

                  if (ack) {
                    acknowledge(ack);
                  }
                  _context2.next = 34;
                  break;

                case 33:
                  // if there's no acknowledge function then just use the fire method
                  (_socket2 = socket).fire.apply(_socket2, [type, message].concat(args));

                case 34:
                  _context2.next = 39;
                  break;

                case 36:
                  _context2.prev = 36;
                  _context2.t1 = _context2['catch'](24);

                  if (debug) console.error('There was a problem calling the socket:', _context2.t1);

                case 39:
                  return _context2.abrupt('break', 41);

                case 40:
                  return _context2.abrupt('return', next(action));

                case 41:
                case 'end':
                  return _context2.stop();
              }
            }
          }, _callee2, _this, [[24, 36]]);
        }));

        return function (_x) {
          return _ref2.apply(this, arguments);
        };
      }();
    };
  };
};
