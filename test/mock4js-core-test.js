var Mock = require('..').Mock;
var Mock4JS = require('..').Mock4JS;
var Mock4JSException = require('..').Mock4JSException;
var expect = require('expectations');

describe('Mock4JS', function() {
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

	/**
	 *	tests for mock creation
	 */
	it('MockCreatedWithSameInterfaceAsMockedType', function() {
		expect(mockObject.publicMethodWithNoArgs).toBeDefined();
		expect(mockObject.publicMethodWithArgs).toBeDefined();
		expect(mockObject._aPrivateMethod).toBeUndefined();
		expect(mockObject.proxy() instanceof TestObject).toBe(true);
	});

	it('TryingToCreateMockWithUndefinedFailsWithNiceMessage', function() {
		debugger;
		var invocation = function() { new Mock(undefined) };
		var failMsg = executeAndGetExpectedError(invocation, "Should have failed to create Mock with TestObject because it should have been created with TestObject.prototype");
	 	expect(failMsg).toContain("must create Mock using a class not prototype");
	});

	it('CreateMockForTypeThatHasConstructorThatFails', function() {
		function TestObjectWithFailingConstructor(arg1, arg2) {
			throw new Error("TestObjectWithFailingConstructor constructor called - threw error to simulate mandatory constructor args not being passed in");
		}

		var mockObject = this.mock(TestObjectWithFailingConstructor);
		expect(mockObject.proxy() instanceof TestObjectWithFailingConstructor).toBe(true);
	});

	/**
	 *	basic tests for this.once() and methods with and without args
	 */
	it('VerifiesMethodWithNoArgsFailsWhenExpectationsNotMet', function() {
		mockObject.expects(this.once()).publicMethodWithNoArgs();

		var invocation = function() { mockObject.verify() };
		expect(invocation).toThrow(Mock4JSException);
	});

	it('VerifiesMethodWithNoArgsSucceedsWhenExpectationsMet', function() {
		mockObject.expects(this.once()).publicMethodWithNoArgs();

		mockObject.proxy().publicMethodWithNoArgs();	// fulfil the expectation
		mockObject.verify(); 					// do not expect an exception
	});

	it('VerifiesMethodWithArgsSucceedsWhenExpectedArgsMatch', function() {
		mockObject.expects(this.once()).publicMethodWithArgs("ARG1", 222);

		mockObject.proxy().publicMethodWithArgs("ARG1", 222);	// fulfil the expectation
		mockObject.verify();							// do not expect an exception
	});

	it('VerifiesMethodWithArgsFailsWhenExpectedArgsDoNotMatch', function() {
		mockObject.expects(this.once()).publicMethodWithArgs("ARG1", 222);

		var invocation = function() { mockObject.proxy().publicMethodWithArgs("SOME OTHER ARG", 222) };
		expect(invocation).toThrow(Mock4JSException);
	});

	/**
	 * test this.never() invocation constraint
	 */
	it('PassesIfMethodCallExplicitlyNotExpectedAndIsNotCalled', function() {
		mockObject.expects(this.never()).publicMethodWithNoArgs();

		mockObject.verify();	// should pass because publicMethodWithNoArgs() was not called
	});

	it('FailsIfMethodCallExplicitlyNotExpected', function() {
		mockObject.expects(this.never()).publicMethodWithNoArgs();

		var invocation = function() { mockObject.proxy().publicMethodWithNoArgs() };
		expect(invocation).toThrow(Mock4JSException);
	});

	it('FailsIfMethodCallWithArgsExplicitlyNotExpected', function() {
		mockObject.expects(this.never()).publicMethodWithArgs();

		var invocation = function() { mockObject.proxy().publicMethodWithArgs("ARG1", 111) };
		expect(invocation).toThrow(Mock4JSException);
	});

	/**
	 * test exactly() invocation constraint
	 */
	it('PassesIfMethodCalledExactNumberOfTimes', function() {
		mockObject.expects(this.exactly(2)).publicMethodWithNoArgs();

		mockObject.proxy().publicMethodWithNoArgs();
		mockObject.proxy().publicMethodWithNoArgs();

		mockObject.verify();
	});

	it('FailsIfMethodCalledLessThanExactNumberOfTimes', function() {
		mockObject.expects(this.exactly(2)).publicMethodWithNoArgs();

		mockObject.proxy().publicMethodWithNoArgs();

		var invocation = function() { mockObject.verify() };
		var failMessage = executeAndGetExpectedError(invocation, "should get error on verify() because method called once but expected twice");
	});

	it('FailsIfMethodCalledMoreThanExactNumberOfTimes', function() {
		mockObject.expects(this.exactly(2)).publicMethodWithNoArgs();

		mockObject.proxy().publicMethodWithNoArgs();
		mockObject.proxy().publicMethodWithNoArgs();

		var invocation = function() { mockObject.proxy().publicMethodWithNoArgs(); };
		expect(invocation).toThrow(Mock4JSException);
	});


	/**
	 * test atLeastOnce() invocation constraint
	 */
	it('PassesIfMethodExpectedAtLeastOnceAndActuallyCalledOnce', function() {
		mockObject.expects(this.atLeastOnce()).publicMethodWithNoArgs();

		mockObject.proxy().publicMethodWithNoArgs();

		mockObject.verify();
	});

	it('PassesIfMethodExpectedAtLeastOnceAndActuallyCalledMoreThanOnce', function() {
		mockObject.expects(this.atLeastOnce()).publicMethodWithNoArgs();

		mockObject.proxy().publicMethodWithNoArgs();
		mockObject.proxy().publicMethodWithNoArgs();

		mockObject.verify();
	});

	it('FailsIfMethodExpectedAtLeastOnceAndActuallyCalledZeroTimes', function() {
		mockObject.expects(this.atLeastOnce()).publicMethodWithNoArgs();

		var invocation = function() { mockObject.verify() };
		expect(invocation).toThrow(Mock4JSException);
	});

	/**
	 * test method actions
	 */
	it('ReturnsValueWhenExpectationMatched', function() {
		mockObject.expects(this.once()).publicMethodWithNoArgs().will(this.returnValue("resultFromPublicMethod"));
		mockObject.expects(this.once()).publicMethodWithArgs("ARG1", 222).will(this.returnValue("resultFromPublicMethodWithArgs"));

		var result = mockObject.proxy().publicMethodWithArgs("ARG1", 222);

		expect("resultFromPublicMethodWithArgs").toBe(result);
	});

	it('MethodThatIsSetupToThrowException', function() {
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

	it('ReturnsMultipleValuesWhenExpectationMatched', function() {
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
	it('VerifyPassesWhenAnExpectedArgIsArray', function() {
		mockObject.expects(this.once()).publicMethodWithArgs(["foo", "bar"]);

		var result = mockObject.proxy().publicMethodWithArgs(["foo", "bar"]);

		mockObject.verify();
	});

	it('VerifyFailsWhenActualArgIsArrayWithSameLengthButDifferentValues', function() {
		mockObject.expects(this.once()).publicMethodWithArgs(["foo", "bar"]);

		var invocation = function() { mockObject.proxy().publicMethodWithArgs(["different", "values"]) };
		expect(invocation).toThrow(Mock4JSException);
	});

	it('VerifyFailsWhenActualArgIsArrayIsDifferentLength', function() {
		mockObject.expects(this.once()).publicMethodWithArgs(["foo", "bar"]);

		var invocation = function() { mockObject.proxy().publicMethodWithArgs(["foo"]) };
		expect(invocation).toThrow(Mock4JSException);
	});

	/**
	 * complex test combining multiple expectations with multiple methods with different args
	 */
	it('MultipleExpectations', function() {
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
	it('PassesWithWhenArgumentStringContainsExpectedSubstring', function() {
		mockObject.expects(this.atLeastOnce()).publicMethodWithArgs(this.stringContains("NI!"));

		mockObject.proxy().publicMethodWithArgs("We are the knights that say NI!!!!!");

		mockObject.verify();	// should pass because "NI!" is present
	});

	it('FailsWhenArgumentStringDoesntContainExpectedSubString', function() {
		mockObject.expects(this.atLeastOnce()).publicMethodWithArgs(this.stringContains("NI!"));

		var invocation = function() { mockObject.proxy().publicMethodWithArgs("We are the knights that say Ekke Ekke Ekke Ptang Zoo Boing!!!!!") };
		expect(invocation).toThrow(Mock4JSException);
	});

	it('FailsWhenStringContainsDoesntReceiveAString', function() {
		mockObject.expects(this.atLeastOnce()).publicMethodWithArgs(this.stringContains("NI!"));

		var invocation = function() { mockObject.proxy().publicMethodWithArgs(666) };

		var failMessage = executeAndGetExpectedError(invocation, "should have failed because 666 is not a string");
		expect(failMessage).toContain("publicMethodWithArgs(a string containing \"NI!\"");
		expect(failMessage).toContain("stringContains() must be given a string, actually got a number");
	});

	/**
	 * test the ANYTHING argument constraint
	 */
	// TODO: Doesn't work, and it depends on jsUnitExtensions
	it('VerifiesMethodWithArgsSucceedsWithSomeArgsSpecifiedAsAnything', function() {
		mockObject.expects(this.once()).publicMethodWithArgs(this.ANYTHING, 222);

		mockObject.proxy().publicMethodWithArgs("something", 222);	// fulfil the expectation
		mockObject.verify();								// do not expect an exception
	});

	/**
	 * test the composite argument constraints
	 */
	it('ArgumentConstraintsWithNot', function() {
		mockObject.expects(this.atLeastOnce()).publicMethodWithArgs(this.not("a shrubbery"), 222);

		mockObject.proxy().publicMethodWithArgs("a bush", 222);			// this is ok because a bush is not a shrubbery

		var invocation = function() { publicMethodWithArgs("a shrubbery", 222) };
		expect(invocation).toThrow(Mock4JSException);
	});

	it('ArgumentConstraintsWithAnd', function() {
		mockObject.expects(this.atLeastOnce()).publicMethodWithArgs(this.and(this.stringContains("hello"), this.stringContains("world")), 222);

		mockObject.proxy().publicMethodWithArgs("hello world", 222);			// this is ok because it contains both 'hello' and 'world'

		var invocation = function() { publicMethodWithArgs("goodbye world", 222) };
		expect(invocation).toThrow(Mock4JSException);
	});

	it('ArgumentConstraintsWithOr', function() {
		mockObject.expects(this.atLeastOnce()).publicMethodWithArgs(this.or(this.stringContains("hello"), this.stringContains("world")), 222);

		mockObject.proxy().publicMethodWithArgs("hello world", 222);			// this is ok because it contains both 'hello' and 'world'
		mockObject.proxy().publicMethodWithArgs("goodbye world", 222);			// this is ok because it contains 'hello'

		var invocation = function() { publicMethodWithArgs("goodbye planet", 222) };
		expect(invocation).toThrow(Mock4JSException);
	});

	/**
	 * test special argument values
	 */
	it('ExpectsUndefinedMethodArgument', function() {
		mockObject.expects(this.once()).publicMethodWithArgs("foo", undefined);

		mockObject.proxy().publicMethodWithArgs("foo", undefined);	// fulfil expectation

		mockObject.verify();
	});

	it('ExpectsNotUndefinedMethodArgument', function() {
		mockObject.expects(this.once()).publicMethodWithArgs(this.NOT_UNDEFINED);

		var invocation = function() { mockObject.proxy().publicMethodWithArgs(undefined) };
		var failMsg = executeAndGetExpectedError(invocation, "method call should have failed because arg is undefined");
	});

	it('ExpectsNullMethodArgument', function() {
		mockObject.expects(this.once()).publicMethodWithArgs("foo", null);

		mockObject.proxy().publicMethodWithArgs("foo", null);	// fulfil expectation

		mockObject.verify();
	});

	it('ExpectsNotNullMethodArgument', function() {
		mockObject.expects(this.once()).publicMethodWithArgs(this.NOT_NULL);

		var invocation = function() { mockObject.proxy().publicMethodWithArgs(null) };
		expect(invocation).toThrow(Mock4JSException);
	});

	/**
	 * test stubs() rather expects()
	 */
	it('Stubs', function() {
		mockObject.stubs().publicMethodWithNoArgs().will(this.returnValue(123));
		mockObject.stubs().publicMethodWithArgs("foo", 111).will(this.returnValue("FOO"));
		mockObject.stubs().publicMethodWithArgs("bar", 111).will(this.returnValue("BAR"));
		mockObject.stubs().publicMethodWithArgs("wont be matched", 111).will(this.returnValue("BAR"));

		expect(123).toBe(mockObject.proxy().publicMethodWithNoArgs());
		expect("FOO").toBe(mockObject.proxy().publicMethodWithArgs("foo", 111));
		expect("BAR").toBe(mockObject.proxy().publicMethodWithArgs("bar", 111));
		mockObject.verify();	// should not throw exception even though last stub method was not called.
	});

	it('ExpectsOverridingStubs', function() {
		mockObject.stubs().publicMethodWithNoArgs().will(this.returnValue(123));
		mockObject.expects(this.once()).publicMethodWithNoArgs().will(this.returnValue(456));
		var result = mockObject.proxy().publicMethodWithNoArgs();

		expect(456).toBe(result);
	});

	it('StubsOverridingStubs', function() {
		mockObject.stubs().publicMethodWithNoArgs().will(this.returnValue(123));
		mockObject.stubs().publicMethodWithNoArgs().will(this.returnValue(456));

		var result = mockObject.proxy().publicMethodWithNoArgs();

		expect(456).toBe(result);
	});

	it('StubsWithMultipleReturnValues', function() {
		mockObject.stubs().publicMethodWithNoArgs().will(this.returnValue(111), this.returnValue(222));

		var result1 = mockObject.proxy().publicMethodWithNoArgs();
		var result2 = mockObject.proxy().publicMethodWithNoArgs();

		expect(111).toBe(result1);
		expect(222).toBe(result2);

		var invocation = function() { mockObject.proxy().publicMethodWithNoArgs() };
		var failMsg = executeAndGetExpectedError(invocation, "method call should have failed because there are no more values to return");
		// assertThat(failMsg, this.stringContains("no more values to return"));
	});

	it('StubsWillKeepPerformingSameAction', function() {
		mockObject.stubs().publicMethodWithNoArgs().will(this.returnValue(123));

		var result1 = mockObject.proxy().publicMethodWithNoArgs();
		var result2 = mockObject.proxy().publicMethodWithNoArgs();

		expect(123).toBe(result1);
		expect(123).toBe(result2);
	});

	/**
	 * testing ordering
	 */
	it('PassesWhenOrderMatched', function() {
		mockObject.expects(this.once()).publicMethodWithArgs(666).will(this.returnValue(123)).id("called publicMethodWithArgs");
		mockObject.expects(this.once()).publicMethodWithNoArgs().after("called publicMethodWithNoArgs");

		var result = mockObject.proxy().publicMethodWithArgs(666);
		mockObject.proxy().publicMethodWithNoArgs();	// should not throw exception because order is correct

		expect(result).toBe(123);
	});

	/**
	 * disabled until code written for it
	 */
	// function DISABLEDtestPassesWhenOrderNotMatched() {
	// 	mockObject.expects(this.once()).publicMethodWithArgs(666).will(this.returnValue(123)).id("called publicMethodWithArgs");
	// 	mockObject.expects(this.once()).publicMethodWithNoArgs().after("called publicMethodWithNoArgs");

	// 	var invocation = function() { mockObject.proxy().publicMethodWithNoArgs() };
	// 	var failMsg = executeAndGetExpectedError(invocation, "method call should have failed because another method was expected to be called first");
	// 	expect(failMsg).toContain("");
	// };
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
