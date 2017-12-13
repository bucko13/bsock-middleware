'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = bsockMiddleware;

var _bsock = require('bsock');

var _bsock2 = _interopRequireDefault(_bsock);

var _assert = require('assert');

var _assert2 = _interopRequireDefault(_assert);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; } /* eslint-disable consistent-return */

// With help from the following examples:
// https://exec64.co.uk/blog/websockets_with_redux/
// https://github.com/quirinpa/redux-socket

function bsockMiddleware(options) {
  var _this = this;

  var socket = null;
  var debug = options.debug;


  return function (_ref) {
    var dispatch = _ref.dispatch;
    return function (next) {
      return function () {
        var _ref2 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee2(action) {
          var _action$bsock, port, host, ssl, protocols, listeners, _action$bsock2, type, message, acknowledge, ack, _action$bsock3, _type, _message;

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
                  _context2.next = _context2.t0 === 'CONNECT' ? 5 : _context2.t0 === 'DISCONNECT' ? 11 : _context2.t0 === 'CALL' ? 15 : _context2.t0 === 'FIRE' ? 31 : 33;
                  break;

                case 5:
                  // Start a new connection to the server
                  if (socket !== null) {
                    socket.close();
                  }
                  // if it has a `connect` action then we connect to the bcoin socket
                  _action$bsock = action.bsock, port = _action$bsock.port, host = _action$bsock.host, ssl = _action$bsock.ssl, protocols = _action$bsock.protocols, listeners = _action$bsock.listeners;

                  socket = _bsock2.default.connect(port, host, ssl, protocols);

                  socket.on('error', function (err) {
                    if (debug) console.log('There was an error with bsock: ', err);
                    dispatch({ type: 'BSOCK_ERROR', payload: err });
                  });

                  socket.on('connect', function () {
                    // setup the listeners
                    listeners.forEach(function (listener) {
                      var event = listener.event,
                          actionType = listener.actionType,
                          ack = listener.ack;

                      (0, _assert2.default)(typeof event === 'string', 'Event listener was not a string');
                      (0, _assert2.default)(actionType && typeof actionType === 'string', 'Need an action type to create the action');

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
                        socket.bind(event, function (payload) {
                          return dispatch({ type: actionType, payload: payload });
                        });
                      }
                    });
                  });

                  return _context2.abrupt('break', 34);

                case 11:
                  if (socket !== null) socket.close();

                  socket = null;

                  dispatch({ type: 'BSOCK_DISCONNECT' });
                  return _context2.abrupt('break', 34);

                case 15:
                  // then get the type and message to send from action props and emit
                  _action$bsock2 = action.bsock, type = _action$bsock2.type, message = _action$bsock2.message, acknowledge = _action$bsock2.acknowledge;

                  if (!(socket !== null)) {
                    _context2.next = 29;
                    break;
                  }

                  _context2.prev = 17;
                  _context2.next = 20;
                  return socket.call(type, message);

                case 20:
                  ack = _context2.sent;

                  if (ack) {
                    dispatch(acknowledge(ack));
                  }
                  _context2.next = 27;
                  break;

                case 24:
                  _context2.prev = 24;
                  _context2.t1 = _context2['catch'](17);

                  if (debug) console.log('There was a problem calling the socket:', _context2.t1);

                case 27:
                  _context2.next = 30;
                  break;

                case 29:
                  if (debug) {
                    console.log('Please connect bsock before trying to call server');
                  }

                case 30:
                  return _context2.abrupt('break', 34);

                case 31:
                  if (socket !== null) {
                    _action$bsock3 = action.bsock, _type = _action$bsock3.type, _message = _action$bsock3.message;

                    socket.fire(_type, _message);
                  } else if (debug) {
                    console.log('Please connect bsock before trying to fire a message');
                  }

                  return _context2.abrupt('break', 34);

                case 33:
                  return _context2.abrupt('return', next(action));

                case 34:
                case 'end':
                  return _context2.stop();
              }
            }
          }, _callee2, _this, [[17, 24]]);
        }));

        return function (_x) {
          return _ref2.apply(this, arguments);
        };
      }();
    };
  };
};
