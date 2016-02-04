[![Build Status](https://travis-ci.org/BladeRunnerJS/mock4js.png)](https://travis-ci.org/BladeRunnerJS/mock4js)

## mock4js

Mock4JS is a dynamic-mock library for Javascript. It enables developers to write tests that exercise and verify the interactions between the objects in the application. Its syntax is very expressive and is closely based on jMock 1.

This library has been made available on NPM for legacy code that still depends on mock4js. If you are looking for a mocking library for new code than you should look at either [Sinon.jS](http://sinonjs.org/) or [mochito](https://www.npmjs.com/package/mochito).

Here's an example of what a mock4js test might look like:

~~~js
var Mock4JS = require('mock4js');
var TestClass = require('./TestClass');
var CollaboratorClass = require('./CollaboratorClass');

describe('A mock4js test',  function() {
    beforeEach(function() {
      Mock4JS.addMockSupport(global);
    });

    afterEach(function() {
      Mock4JS.verifyAndClearAllMocks();
    });

    it('allows us to mock stuff', function() {
      var mockCollaborator = mock(CollaboratorClass);
      var testObj = new TestClass(mockCollaborator.proxy());

      // _poking_ the test object causes the collaborator to be _prodded_
      mockCollaborator.expects(once()).prod();
      testObj.poke();
    });
});
~~~
