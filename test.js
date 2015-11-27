

test = {
	test_field: "hello",
	test_func: function() {
		console.log("hello");
	},
	nested_func: function() {
		test.test_func();
	}
}

test.test_func();
test.nested_func();