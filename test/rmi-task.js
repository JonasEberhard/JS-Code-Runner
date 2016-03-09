'use strict';

const should        = require('should'),
      events        = require('../lib/server-code/events'),
      json          = require('../lib/util/json'),
      DATA          = events.providers.DATA,
      executor      = require('../lib/server-code/runners/tasks/executor'),
      resultWrapper = require('../lib/server-code/runners/tasks/util/result-wrapper');

var INVOKE_METHOD_TASK = 'com.backendless.coderunner.commons.protocol.RequestMethodInvocation';

require('mocha');

function stringToBytes(s) {
  return s.split('').map((c, i) => s.charCodeAt(i));
}

function encodeArgs(args) {
  return (args && args.length && stringToBytes(json.stringify(args))) || [];
}

function decodeArgs(args) {
  return (args && args.length && json.parse(String.fromCharCode.apply(String, args))) || [];
}

function modelStub(handlerFn, classMappings) {
  return {
    invokeEventHandler: (eventId, target, args) => handlerFn.apply(null, args),
    classMappings     : classMappings
  };
}

function createTask(event, args, async) {
  return {
    ___jsonclass: INVOKE_METHOD_TASK,
    eventId     : event.id,
    async       : !!async,
    initAppData: {},
    arguments   : encodeArgs(args || [])
  }
}

function invokeAndParse(task, model) {
  return executor.execute(task, {}, model)
    .then(res => res && json.parse(res))
    .then(res => {
      if (res && res.arguments) {
        res.arguments = res.arguments && decodeArgs(res.arguments);
      }
      return res;
    });
}

describe('[invoke-method] task executor', function() {
  it('should fill [request] params', function() {
    const task = createTask(DATA.beforeCreate, [{}, {name: 'John'}]);
    const handler = (req, res) => {
      should.exist(req.item);
      req.item.should.be.eql({name: 'John'});
    };

    return invokeAndParse(task, modelStub(handler)).should.be.fulfilled();
  });

  describe('should perform class mapping', function() {
    it('for persistence items', function() {
      class Foo {
      }
      class Bar {
      }
      class Baz {
      }

      function handler(req, res) {
        req.item.should.be.instanceof(Foo);
        should.equal(req.item.a, 'a');

        req.item.bar.should.be.instanceof(Bar);
        should.equal(req.item.bar.b, 'b');

        res.result[0].should.be.instanceof(Baz);
        res.result[1].should.be.instanceof(Baz);
      }

      const item = {a: 'a', bar: {___class: 'Bar', b: 'b'}, ___class: 'Foo'};
      const result = resultWrapper.executionResult(null, [{___class: 'Baz'}, {___class: 'Baz'}]);

      return invokeAndParse(createTask(DATA.afterCreate, [{}, item, result]), modelStub(handler, {Foo, Bar, Baz}))
        .then((res) => {
          should.not.exists(res.exception);

          should.equal(res.arguments[1].___class, 'Foo');
          should.equal(res.arguments[1].bar.___class, 'Bar');
          should.equal(res.arguments[2].result[0].___class, 'Baz');
          should.equal(res.arguments[2].result[1].___class, 'Baz');
        });
    });
  });

  describe('should handle', function() {
    it('unsupported event error', function() {
      return invokeAndParse(createTask({id: -1}), {handlers: []}).then(res => {
        should.exist(res.exception);
        res.exception.exceptionMessage.should.startWith('Integrity violation');
      })
    });

    it('errors raised in the event handler', function() {
      const erroredModel = {
        invokeEventHandler: () => {
          throw new Error('Error');
        }
      };

      return invokeAndParse(createTask(DATA.beforeCreate), erroredModel).then(res => {
        should.exist(res.exception);
        res.exception.exceptionMessage.should.equal('Error');
      })
    });

    it('async errors raised in the event handler behind the promise', function() {
      const erroredModel = {
        invokeEventHandler: () => {
          process.nextTick(() => {
            throw new Error('Async Error');
          }, 0);

          return new Promise(() => {}); //never resolved promise
        }
      };

      return invokeAndParse(createTask(DATA.beforeCreate), erroredModel).then(res => {
        should.exist(res.exception);
        res.exception.exceptionMessage.should.equal('Async Error');
      })
    });

    it('handler execution timeout', function() {
      const task = createTask(DATA.beforeCreate);
      task.timeout = 1;

      const handler = function() {
        return new Promise((resolve) => {
          setTimeout(() => resolve('buba'), 20);
        })
      };

      return invokeAndParse(task, modelStub(handler)).then(res => {
        should.exist(res.exception);
        res.exception.exceptionMessage.should.equal('Task execution aborted due to timeout');
      });
    });

    it('errors thrown from handler', function() {
      const handler = () => {
        throw new Error('Error in Handler!');
      };

      return invokeAndParse(createTask(DATA.beforeCreate), modelStub(handler)).then(res => {
        should.exist(res.exception);
        res.exception.exceptionMessage.should.be.eql('Error in Handler!');
      });
    });
  });

  describe('in [before] event phase', function() {
    it('should allow input parameters modifying', function() {
      const task = createTask(DATA.beforeCreate, [{}, {name: 'John'}]);
      const handler = function(req, res) {
        req.item = {name: 'Dou'};
      };

      return invokeAndParse(task, modelStub(handler)).then(res => {
        res.arguments[1].should.be.eql({name: 'Dou'});
      });
    });

    it('should allow short circuit feature (stopping the event propagation and returning its own result to the client)', function() {
      const task = createTask(DATA.beforeCreate, [{}, {}, {name: 'John', id: 1}]);
      const handler = () => ({name: 'Dou', id: 2});

      return invokeAndParse(task, modelStub(handler)).then(res => {
        res.arguments[0].prematureResult.should.be.eql({name: 'Dou', id: 2});
      });
    });
  });

  describe('in [after] event phase', function() {
    it('should provide succeeded server result in {response} handler argument', function() {
      const result = {name: 'John', id: 1};
      const wrappedResult = resultWrapper.executionResult(null, result);
      const task = createTask(DATA.afterCreate, [{}, {}, wrappedResult]);

      const handler = function(req, res) {
        should.not.exist(res.error);
        should.exist(res.result);
        res.result.should.be.eql(result);
      };

      return invokeAndParse(task, modelStub(handler)).then(res => {
        res.arguments[2].should.be.eql(wrappedResult);
      });
    });

    it('should provide errored server result in {response} handler argument', function() {
      const error = 'error';
      const erroredResult = resultWrapper.executionResult(error);
      const task = createTask(DATA.afterCreate, [{}, {}, erroredResult]);

      const handler = function(req, res) {
        should.not.exist(res.result);
        should.exist(res.error);
        res.error.exceptionMessage.should.be.eql(error);

        throw new Error(error);
      };

      return invokeAndParse(task, modelStub(handler)).then(res => {
        res.arguments.should.be.empty();
        res.exception.exceptionMessage.should.be.eql(error);
      });
    });

    it('should allow modifying server result by returning new value', function() {
      const task = createTask(DATA.afterCreate, [{}, {}, resultWrapper.executionResult(null, {name: 'John', id: 1})]);
      const handler = (req, res) => ({name: 'Dou', id: 2});

      return invokeAndParse(task, modelStub(handler)).then(res => {
        res.arguments[2].result.should.be.eql({name: 'Dou', id: 2});
      });
    });

    it('should allow result modifying via setting {res.result} a new value', function() {
      const task = createTask(DATA.afterCreate, [{}, {}, resultWrapper.executionResult({name: 'John', id: 1})]);
      const handler = function(req, res) {
        res.result = {name: 'Dou', id: 2};
      };

      return invokeAndParse(task, modelStub(handler)).then(res => {
        res.arguments[2].result.should.be.eql({name: 'Dou', id: 2});
      });
    });
  });

  describe('for async events', function() {
    it('should not provide [success] and [error] callbacks', function() {
      const handler = (req, res) => {
        should.not.exist(res.success);
        should.not.exist(res.error);
      };

      return invokeAndParse(createTask(DATA.afterCreate, [], true), modelStub(handler));
    });

    it('should not return any result', function() {
      return invokeAndParse(createTask(DATA.afterCreate, [], true), modelStub(() => {
      }))
        .should.be.fulfilledWith(undefined);
    });
  });
});