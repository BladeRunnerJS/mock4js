var Mock = require('..').Mock;
var Mock4JS = require('..').Mock4JS;
var Mock4JSException = require('..').Mock4JSException;
var expect = require('expectations');

describe('Mock4JS messages', function() {
	var mockObject;

	function TestObject() {
	}

	TestObject.prototype = {
		aMethod: function() {
		},
		anotherMethod: function() {
		}
	}

	beforeEach(function() {
		Mock4JS.addMockSupport(this);
		Mock4JS.clearMocksToVerify();
		mockObject = this.mock(TestObject);
	});

	/**
	 * Tests to check that the mock failure messages are correct and helpful
	 */
	it('throws message when expected method is not called', function() {
		mockObject.expects(this.once()).aMethod();
		mockObject.expects(this.once()).anotherMethod("someArg");

		mockObject.proxy().aMethod();

		var invocation = function() { mockObject.verify() };
		var failMsg = executeAndGetExpectedError(invocation, "Should fail because anotherMethod() was not called as expected");

		expect(failMsg).toContain("expected method was not invoked: anotherMethod(eq(\"\" + this._expectedValue + \"\"))");
	});

	it('throws message when method not used the exact number of expected times', function() {
		mockObject.expects(this.exactly(2)).aMethod();

		mockObject.proxy().aMethod();

		var invocation = function() { mockObject.verify() };
		var failMsg = executeAndGetExpectedError(invocation, "Should fail because too many calls aMethod()");
		expect(failMsg).toContain("expected method was only invoked 1 time but was expected to be invoked 2 times: aMethod()");
	});

	it('throws message when method expected to be called at least onced but not it is not', function() {
		mockObject.expects(this.atLeastOnce()).aMethod();

		var invocation = function() { mockObject.verify() };
		var failMsg = executeAndGetExpectedError(invocation, "Should fail because not enough calls to aMethod()");

		expect(failMsg).toContain("expected at least once: aMethod()");
	});

	it('throws message when method is unused', function() {
		mockObject.expects(this.once()).aMethod(this.and(this.stringContains("foo"), this.stringContains("bar")));

		var invocation = function() { mockObject.verify() };
		var failMsg = executeAndGetExpectedError(invocation, "Should fail because aMethod() not called");
		expect(failMsg).toContain("expected once: aMethod(and(a string containing \"foo\", a string containing \"bar\")");
	});

	it('throws message when message mock has stubs', function() {
		mockObject.expects(this.once()).aMethod();
		mockObject.stubs().anotherMethod("arg1");

		var invocation = function() { mockObject.verify() };
		var failMsg = executeAndGetExpectedError(invocation, "Should fail");
		expect(failMsg).toContain("stub: anotherMethod(eq(\"\" + this._expectedValue + \"\"))");
	});

	it('throws message when unexpected method called', function() {
		mockObject.expects(this.once()).aMethod();
		mockObject.expects(this.once()).anotherMethod("someArg");

		mockObject.proxy().aMethod();

		var invocation = function() { mockObject.proxy().anotherMethod("unexpected arg"); };

		var failMsg = executeAndGetExpectedError(invocation, "Should fail because of unexpected call to anotherMethod()");

		expect(failMsg).toContain("unexpected invocation: anotherMethod(\"unexpected arg\")");
		expect(failMsg).toContain("anotherMethod(eq(\"\" + this._expectedValue + \"\"))");
	});

	it('throws message when method never used', function() {
		mockObject.expects(this.never()).aMethod();

		var invocation = function() { mockObject.proxy().aMethod() };
		var failMsg = executeAndGetExpectedError(invocation, "Should fail because aMethod() was called more than 0 times");
		expect(failMsg).toContain("unexpected invocation: aMethod()");
		expect(failMsg).toContain("not expected: aMethod()");
	});

	it('throws message when method called too many times', function() {
		mockObject.expects(this.once()).aMethod();
		mockObject.expects(this.once()).anotherMethod("someArg");

		mockObject.proxy().aMethod();

		var invocation = function() { mockObject.proxy().aMethod(); };
		var failMsg = executeAndGetExpectedError(invocation, "Should fail because too many calls aMethod()");

		expect(failMsg).toContain("unexpected invocation: aMethod()");
	});
});

function executeAndGetExpectedError(functionToExecute, messageIfNoError) {
	var exceptionThrown;
	var exceptionMessage;

	try {
		functionToExecute.call();
		exceptionThrown = false;
	} catch(e) {
		exceptionMessage = e.message;
		exceptionThrown = true;
	}
	if(exceptionThrown) {
		return exceptionMessage;
	} else {
		fail(messageIfNoError);
	}
}
