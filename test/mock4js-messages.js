var Mock = require('..').Mock;
var Mock4JS = require('..').Mock4JS;
var Mock4JSException = require('..').Mock4JSException;
var expect = require('expectations');


describe('Mock4JS', function() {
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
	it('testMessageWhenExpectedMethodNotCalled', function() {
		mockObject.expects(this.once()).aMethod();
		mockObject.expects(this.once()).anotherMethod("someArg");

		mockObject.proxy().aMethod();

		var invocation = function() { mockObject.verify() };
		var failMsg = executeAndGetExpectedError(invocation, "Should fail because anotherMethod() was not called as expected");

		expect(failMsg).toContain("expected method was not invoked the expected number of times: anotherMethod(eq(\"someArg\"))");
	});

	it('testMessageWhenUnexpectedMethodCalled', function() {
		mockObject.expects(this.once()).aMethod();
		mockObject.expects(this.once()).anotherMethod("someArg");

		mockObject.proxy().aMethod();

		var invocation = function() { mockObject.proxy().anotherMethod("unexpected arg"); };
		debugger;
		var failMsg = executeAndGetExpectedError(invocation, "Should fail because of unexpected call to anotherMethod()");
		expect(failMsg).toContain("unexpected invocation: anotherMethod(\"unexpected arg\")");
		expect(failMsg).toContain("Allowed:\n"
			+ "expected once and has been invoked: aMethod()\n"
			+ "expected once: anotherMethod(eq(\"someArg\"))");
	});

	it('testMessageWhenMethodCalledTooManyTimes', function() {
		mockObject.expects(this.once()).aMethod();
		mockObject.expects(this.once()).anotherMethod("someArg");

		mockObject.proxy().aMethod();

		var invocation = function() { mockObject.proxy().aMethod(); };
		var failMsg = executeAndGetExpectedError(invocation, "Should fail because too many calls aMethod()");
		expect(failMsg).toContain("unexpected invocation: aMethod()");
		expect(failMsg).toContain("Allowed:\n"
			+ "expected once and has been invoked: aMethod()\n"
			+ "expected once: anotherMethod(eq(\"someArg\"))");
	});

	it('testMessageWhenExactlyUsed', function() {
		mockObject.expects(this.exactly(2)).aMethod();

		mockObject.proxy().aMethod();

		var invocation = function() { mockObject.verify() };
		var failMsg = executeAndGetExpectedError(invocation, "Should fail because too many calls aMethod()");
		expect(failMsg).toContain("expected method was not invoked the expected number of times");
		expect(failMsg).toContain("expected 2 times, invoked 1 times: aMethod()");
	});

	it('testMessageWhenAtLeastOnceUsed', function() {
		mockObject.expects(this.atLeastOnce()).aMethod();

		var invocation = function() { mockObject.verify() };
		var failMsg = executeAndGetExpectedError(invocation, "Should fail because not enough calls to aMethod()");
		expect(failMsg).toContain("expected method was not invoked");
		expect(failMsg).toContain("expected at least once: aMethod()");
	});

	it('testMessageWhenNeverUsed', function() {
		mockObject.expects(this.never()).aMethod();

		var invocation = function() { mockObject.proxy().aMethod() };
		var failMsg = executeAndGetExpectedError(invocation, "Should fail because aMethod() was called more than 0 times");
		expect(failMsg).toContain("unexpected invocation: aMethod()");
		expect(failMsg).toContain("Allowed:\nnot expected: aMethod()");
	});

	it('testMessageWhenAndUsed', function() {
		mockObject.expects(this.once()).aMethod(this.and(this.stringContains("foo"), this.stringContains("bar")));

		var invocation = function() { mockObject.verify() };
		var failMsg = executeAndGetExpectedError(invocation, "Should fail because aMethod() not called");
		expect(failMsg).toContain("expected once: aMethod(and(a string containing \"foo\", a string containing \"bar\")");
	});

	it('testMessageWhenMockHasStubs', function() {
		mockObject.expects(this.once()).aMethod();
		mockObject.stubs().anotherMethod("arg1");

		var invocation = function() { mockObject.verify() };
		var failMsg = executeAndGetExpectedError(invocation, "Should fail");
		expect(failMsg).toContain("stub: anotherMethod(eq(\"arg1\"))");
	});

	// it('XtestMessageWhenExpectedMethodHasReturnValue', function() {
	// 	mockObject.expects(this.once()).aMethod().will(this.returnValue("aResult"));

	// 	var invocation = function() { mockObject.verify() };
	// 	var failMsg = executeAndGetExpectedError(invocation, "Should fail");
	// 	expect(failMsg).toContain("expects once: anotherMethod(eq(\"arg1\")), returns \"aResult\"");
	// });

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
});
