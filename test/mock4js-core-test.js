var Mock4JS = require('..');
var Mock = require('../src/mock4js').Mock;
var Mock4JSException = require('../src/mock4js').Mock4JSException;
var expect = require('expectations');

describe('Mock4JS core', function() {
	var mockObject;

	function TestObject() {
	}

	TestObject.prototype = {
		publicMethodWithNoArgs: function() {
		},
		publicMethodWithArgs: function(arg1, arg2) {
		},
		_aPrivateMethod: function() {
		}
	}

	beforeEach(function() {
		Mock4JS.addMockSupport(this);
		Mock4JS.clearMocksToVerify();
		mockObject = this.mock(TestObject);
	});

	it('passes verify method with args succeeeds with some args specified as anything', function() {
		debugger;
		mockObject.expects(this.once()).publicMethodWithArgs(this.ANYTHING, 222);

		mockObject.proxy().publicMethodWithArgs("something", 222);	// fulfil the expectation
		mockObject.verify();								// do not expect an exception
	});

	/**
	 *	tests for mock creation
	 */
	it('creates a mock with the same interface as the mocked type', function() {
		expect(mockObject.publicMethodWithNoArgs).toBeDefined();
		expect(mockObject.publicMethodWithArgs).toBeDefined();
		expect(mockObject._aPrivateMethod).toBeUndefined();
		expect(mockObject.proxy() instanceof TestObject).toBe(true);
	});

	it('fails to create a mock with undefined and fails with nice message', function() {
		var invocation = function() { new Mock(undefined) };
		var failMsg = executeAndGetExpectedError(invocation, "Should have failed to create Mock with TestObject because it should have been created with TestObject.prototype");
	 	expect(failMsg).toContain("must create Mock using a class not prototype");
	});

	it('failts to create mock for type that has constructor', function() {
		function TestObjectWithFailingConstructor(arg1, arg2) {
			throw new Error("TestObjectWithFailingConstructor constructor called - threw error to simulate mandatory constructor args not being passed in");
		}

		var mockObject = this.mock(TestObjectWithFailingConstructor);
		expect(mockObject.proxy() instanceof TestObjectWithFailingConstructor).toBe(true);
	});

	/**
	 *	basic tests for this.once() and methods with and without args
	 */
	it('passes verify method with no args fails when expectation is not met', function() {
		mockObject.expects(this.once()).publicMethodWithNoArgs();

		var invocation = function() { mockObject.verify() };
		expect(invocation).toThrow(Mock4JSException);
	});

	it('passes verify method with no args succeeds when expectations met', function() {
		mockObject.expects(this.once()).publicMethodWithNoArgs();

		mockObject.proxy().publicMethodWithNoArgs();	// fulfil the expectation
		mockObject.verify(); 					// do not expect an exception
	});

	it('passes verify method with args succeeds when expected args match', function() {
		mockObject.expects(this.once()).publicMethodWithArgs("ARG1", 222);

		mockObject.proxy().publicMethodWithArgs("ARG1", 222);	// fulfil the expectation
		mockObject.verify();							// do not expect an exception
	});

	it('passes verify method with args fail when expected args do not match', function() {
		mockObject.expects(this.once()).publicMethodWithArgs("ARG1", 222);

		var invocation = function() { mockObject.proxy().publicMethodWithArgs("SOME OTHER ARG", 222) };
		expect(invocation).toThrow(Mock4JSException);
	});

	/**
	 * test this.never() invocation constraint
	 */
	it('passes if method explicitly not expected and is not called', function() {
		mockObject.expects(this.never()).publicMethodWithNoArgs();

		mockObject.verify();	// should pass because publicMethodWithNoArgs() was not called
	});

	it('fails if method call explicitly not expected', function() {
		mockObject.expects(this.never()).publicMethodWithNoArgs();

		var invocation = function() { mockObject.proxy().publicMethodWithNoArgs() };
		expect(invocation).toThrow(Mock4JSException);
	});

	it('fails if method call with args explicitly not expected', function() {
		mockObject.expects(this.never()).publicMethodWithArgs();

		var invocation = function() { mockObject.proxy().publicMethodWithArgs("ARG1", 111) };
		expect(invocation).toThrow(Mock4JSException);
	});

	/**
	 * test exactly() invocation constraint
	 */
	it('passes if method called exact number of times', function() {
		mockObject.expects(this.exactly(2)).publicMethodWithNoArgs();

		mockObject.proxy().publicMethodWithNoArgs();
		mockObject.proxy().publicMethodWithNoArgs();

		mockObject.verify();
	});

	it('fails if method called less than exact number of times', function() {
		mockObject.expects(this.exactly(2)).publicMethodWithNoArgs();

		mockObject.proxy().publicMethodWithNoArgs();

		var invocation = function() { mockObject.verify() };
		var failMessage = executeAndGetExpectedError(invocation, "should get error on verify() because method called once but expected twice");
	});

	it('fails if method called more than exact number of times', function() {
		mockObject.expects(this.exactly(2)).publicMethodWithNoArgs();

		mockObject.proxy().publicMethodWithNoArgs();
		mockObject.proxy().publicMethodWithNoArgs();

		var invocation = function() { mockObject.proxy().publicMethodWithNoArgs(); };
		expect(invocation).toThrow(Mock4JSException);
	});


	/**
	 * test atLeastOnce() invocation constraint
	 */
	it('passes if method expected at least once and actually called once', function() {
		mockObject.expects(this.atLeastOnce()).publicMethodWithNoArgs();

		mockObject.proxy().publicMethodWithNoArgs();

		mockObject.verify();
	});

	it('passes if method expected at least once and actually called more than once', function() {
		mockObject.expects(this.atLeastOnce()).publicMethodWithNoArgs();

		mockObject.proxy().publicMethodWithNoArgs();
		mockObject.proxy().publicMethodWithNoArgs();

		mockObject.verify();
	});

	it('fails when method expected at least once and actually called zero times', function() {
		mockObject.expects(this.atLeastOnce()).publicMethodWithNoArgs();

		var invocation = function() { mockObject.verify() };
		expect(invocation).toThrow(Mock4JSException);
	});

	/**
	 * test method actions
	 */
	it('returns value when expectation matched', function() {
		mockObject.expects(this.once()).publicMethodWithNoArgs().will(this.returnValue("resultFromPublicMethod"));
		mockObject.expects(this.once()).publicMethodWithArgs("ARG1", 222).will(this.returnValue("resultFromPublicMethodWithArgs"));

		var result = mockObject.proxy().publicMethodWithArgs("ARG1", 222);

		expect("resultFromPublicMethodWithArgs").toBe(result);
	});

	it('throws exception when method is setup to do so', function() {
		mockObject.expects(this.once()).publicMethodWithNoArgs().will(this.throwException(new Error("some exception")));

		var exceptionThrown;
		try {
			mockObject.proxy().publicMethodWithNoArgs();
			exceptionThrown = false;
		} catch(e) {
			exceptionThrown = true;
			expect("some exception").toBe(e.message);
		}
		if(!exceptionThrown) {
			fail(messageIfNoError);
		}
	});

	it('returns multiple values when expectation matched', function() {
		mockObject.expects(this.atLeastOnce()).publicMethodWithArgs("ARG1", 222).will(this.returnValue("result1"), this.returnValue("result2"));
		var result1 = mockObject.proxy().publicMethodWithArgs("ARG1", 222);
		var result2 = mockObject.proxy().publicMethodWithArgs("ARG1", 222);

		expect("result1").toBe(result1);
		expect("result2").toBe(result2);

		var invocation = function() { mockObject.proxy().publicMethodWithArgs("ARG1", 222) };
		expect(invocation).toThrow(Mock4JSException);
	});

	/**
	 * test when expected arg is array
	 */
	it('passes verify when an expected arg is an array', function() {
		mockObject.expects(this.once()).publicMethodWithArgs(["foo", "bar"]);

		var result = mockObject.proxy().publicMethodWithArgs(["foo", "bar"]);

		mockObject.verify();
	});

	it('fails verify when actual arg is array with same length but different values', function() {
		mockObject.expects(this.once()).publicMethodWithArgs(["foo", "bar"]);

		var invocation = function() { mockObject.proxy().publicMethodWithArgs(["different", "values"]) };
		expect(invocation).toThrow(Mock4JSException);
	});

	it('fails verify when actual arg is array of different length', function() {
		mockObject.expects(this.once()).publicMethodWithArgs(["foo", "bar"]);

		var invocation = function() { mockObject.proxy().publicMethodWithArgs(["foo"]) };
		expect(invocation).toThrow(Mock4JSException);
	});

	/**
	 * complex test combining multiple expectations with multiple methods with different args
	 */
	it('passes when has multiple expectations', function() {
		mockObject.expects(this.once()).publicMethodWithNoArgs().will(this.returnValue("resultFromPublicMethod"));
		mockObject.expects(this.atLeastOnce()).publicMethodWithArgs("ARG1", 222);
		mockObject.expects(this.exactly(1)).publicMethodWithArgs("ARG2", 333);

		var result = mockObject.proxy().publicMethodWithNoArgs();
		mockObject.proxy().publicMethodWithArgs("ARG1", 222);
		mockObject.proxy().publicMethodWithArgs("ARG2", 333);

		expect("resultFromPublicMethod").toBe(result);

		var invocation = function() { mockObject.proxy().publicMethodWithArgs("NOT EXPECTED ARG", 222) };
		expect(invocation).toThrow(Mock4JSException);
	});

	/**
	 * test the this.stringContains() argument constraint
	 */
	it('passes when argument string contains expected substrings', function() {
		mockObject.expects(this.atLeastOnce()).publicMethodWithArgs(this.stringContains("NI!"));

		mockObject.proxy().publicMethodWithArgs("We are the knights that say NI!!!!!");

		mockObject.verify();	// should pass because "NI!" is present
	});

	it('fails whenargument string does not contain expected substring', function() {
		mockObject.expects(this.atLeastOnce()).publicMethodWithArgs(this.stringContains("NI!"));

		var invocation = function() { mockObject.proxy().publicMethodWithArgs("We are the knights that say Ekke Ekke Ekke Ptang Zoo Boing!!!!!") };
		expect(invocation).toThrow(Mock4JSException);
	});

	it('fails when stringContains does not receive a string', function() {
		mockObject.expects(this.atLeastOnce()).publicMethodWithArgs(this.stringContains("NI!"));

		var invocation = function() { mockObject.proxy().publicMethodWithArgs(666) };

		var failMessage = executeAndGetExpectedError(invocation, "should have failed because 666 is not a string");
		expect(failMessage).toContain("publicMethodWithArgs(a string containing \"NI!\"");
		expect(failMessage).toContain("stringContains() must be given a string, actually got a number");
	});

	/**
	 * test the composite argument constraints
	 */
	it('can constraint with not', function() {
		mockObject.expects(this.atLeastOnce()).publicMethodWithArgs(this.not("a shrubbery"), 222);

		mockObject.proxy().publicMethodWithArgs("a bush", 222);			// this is ok because a bush is not a shrubbery

		var invocation = function() { publicMethodWithArgs("a shrubbery", 222) };
		expect(invocation).toThrow(Mock4JSException);
	});

	it('can constaint with and', function() {
		mockObject.expects(this.atLeastOnce()).publicMethodWithArgs(this.and(this.stringContains("hello"), this.stringContains("world")), 222);

		mockObject.proxy().publicMethodWithArgs("hello world", 222);			// this is ok because it contains both 'hello' and 'world'

		var invocation = function() { publicMethodWithArgs("goodbye world", 222) };
		expect(invocation).toThrow(Mock4JSException);
	});

	it('can constraint with or', function() {
		mockObject.expects(this.atLeastOnce()).publicMethodWithArgs(this.or(this.stringContains("hello"), this.stringContains("world")), 222);

		mockObject.proxy().publicMethodWithArgs("hello world", 222);			// this is ok because it contains both 'hello' and 'world'
		mockObject.proxy().publicMethodWithArgs("goodbye world", 222);			// this is ok because it contains 'hello'

		var invocation = function() { publicMethodWithArgs("goodbye planet", 222) };
		expect(invocation).toThrow(Mock4JSException);
	});

	/**
	 * test special argument values
	 */
	it('can expect undefined argument', function() {
		mockObject.expects(this.once()).publicMethodWithArgs("foo", undefined);

		mockObject.proxy().publicMethodWithArgs("foo", undefined);	// fulfil expectation

		mockObject.verify();
	});

	it('can expect a not-undefined metho argument', function() {
		mockObject.expects(this.once()).publicMethodWithArgs(this.NOT_UNDEFINED);

		var invocation = function() { mockObject.proxy().publicMethodWithArgs(undefined) };
		var failMsg = executeAndGetExpectedError(invocation, "method call should have failed because arg is undefined");
	});

	it('can expect a null method argument', function() {
		mockObject.expects(this.once()).publicMethodWithArgs("foo", null);

		mockObject.proxy().publicMethodWithArgs("foo", null);	// fulfil expectation

		mockObject.verify();
	});

	it('can expect not a null method argument', function() {
		mockObject.expects(this.once()).publicMethodWithArgs(this.NOT_NULL);

		var invocation = function() { mockObject.proxy().publicMethodWithArgs(null) };
		expect(invocation).toThrow(Mock4JSException);
	});

	/**
	 * test stubs() rather expects()
	 */
	it('stubs', function() {
		mockObject.stubs().publicMethodWithNoArgs().will(this.returnValue(123));
		mockObject.stubs().publicMethodWithArgs("foo", 111).will(this.returnValue("FOO"));
		mockObject.stubs().publicMethodWithArgs("bar", 111).will(this.returnValue("BAR"));
		mockObject.stubs().publicMethodWithArgs("wont be matched", 111).will(this.returnValue("BAR"));

		expect(123).toBe(mockObject.proxy().publicMethodWithNoArgs());
		expect("FOO").toBe(mockObject.proxy().publicMethodWithArgs("foo", 111));
		expect("BAR").toBe(mockObject.proxy().publicMethodWithArgs("bar", 111));
		mockObject.verify();	// should not throw exception even though last stub method was not called.
	});

	it('expects overriding stubs', function() {
		mockObject.stubs().publicMethodWithNoArgs().will(this.returnValue(123));
		mockObject.expects(this.once()).publicMethodWithNoArgs().will(this.returnValue(456));
		var result = mockObject.proxy().publicMethodWithNoArgs();

		expect(456).toBe(result);
	});

	it('can override stubs with stubs', function() {
		mockObject.stubs().publicMethodWithNoArgs().will(this.returnValue(123));
		mockObject.stubs().publicMethodWithNoArgs().will(this.returnValue(456));

		var result = mockObject.proxy().publicMethodWithNoArgs();

		expect(456).toBe(result);
	});

	it('stubs will keep performing same action', function() {
		mockObject.stubs().publicMethodWithNoArgs().will(this.returnValue(123));

		var result1 = mockObject.proxy().publicMethodWithNoArgs();
		var result2 = mockObject.proxy().publicMethodWithNoArgs();

		expect(123).toBe(result1);
		expect(123).toBe(result2);
	});

	it('stubs will return multiple values', function() {
		mockObject.stubs().publicMethodWithNoArgs().will(this.returnValue(111), this.returnValue(222));

		var result1 = mockObject.proxy().publicMethodWithNoArgs();
		var result2 = mockObject.proxy().publicMethodWithNoArgs();

		expect(111).toBe(result1);
		expect(222).toBe(result2);

		var invocation = function() { mockObject.proxy().publicMethodWithNoArgs() };
		var failMsg = executeAndGetExpectedError(invocation, "method call should have failed because there are no more values to return");
		expect(failMsg).toContain("no more values to return");
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
};
