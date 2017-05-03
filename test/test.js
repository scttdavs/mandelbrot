"use strict"; 

var chai = require("chai");
var expect = chai.expect;
var type = require("../typist");
var jsdom = require("jsdom").jsdom;
var doc = jsdom("<html><body></body></html>");

var values = {
  error: new Error(),
  date: new Date(),
  object: {},
  string: "",
  array: [],
  regexp: /abcd/,
  boolean: true,
  function: function() {},
  number: 9
};

describe("Basics", function() {
  it("should check many types and return true", function() {
    var arr = [1, 2, 3];
    var str = "str";

    expect(type.check([Array, arr], [String, str])).to.be.true;
  });

  it("should check many types and throw an error", function() {
    var arr = [1, 2, 3];
    var curry = function() {
      type.check([Array, arr], [String, arr]);
    }
    
    expect(curry).to.throw("TypistError: Expected " + arr + " to be of type String");
  });

  it("should type check a function and its inputs", function() {
    var makeArray = type(Array, function(input, foo, bar) {
      type.check([Array, input], [String, foo], [Number, bar]);
      input.push(foo, bar);
      return input;
    });

    expect(makeArray([], "1", 2)).to.eql(["1", 2]);
  });

  it("should type check a function and its inputs and return error", function() {
    var makeArray = type(Array, function(input, foo, bar) {
      type.check([Array, input], [String, foo], [Number, bar]);
      input.push(foo, bar);
      return input;
    });

    var curry = function() {
      makeArray([], 1, 2);
    };

    expect(curry).to.throw("TypistError: Expected " + 1 + " to be of type String");
  });

  it("should type check a function and its inputs from the start", function() {
    var makeArray1 = type.returns(Array).takes(Array, String, Number).does(function(input, foo, bar) {
      input.push(foo, bar);
      return input;
    }).done();

    var makeArray2 = type.takes(Array, String, Number).returns(Array).does(function(input, foo, bar) {
      input.push(foo, bar);
      return input;
    }).done();

    expect(makeArray1([], "1", 2)).to.eql(["1", 2]);
    expect(makeArray2([], "1", 2)).to.eql(["1", 2]);
  });

  it("should type check a function and its inputs from the start and throw an error", function() {
    var makeArray1 = type.takes(Array, String, Number)
                         .does(function(input, foo, bar) {
                            input.push(foo, bar);
                            return input;
                         })
                         .returns(Array)
                         .done();

    var makeArray2 = type.returns(Array).takes(Array, String, Number).does(function(input, foo, bar) {
      input.push(foo, bar);
      return input;
    }).done();

    var curry1 = function() {
      makeArray1([], 1, 2);
    };

    var curry2 = function() {
      makeArray2([], 1, 2);
    };

    //expect(curry1).to.throw("TypistError: Expected " + 1 + " to be of type String");
    expect(curry2).to.throw("TypistError: Expected " + 1 + " to be of type String");
  });

  it("should check a custom type", function() {
    var Test = function() {};
    var result = new Test();
    
    expect(type.is(Test, result)).to.be.true;
  });
});

type.allTypes.forEach(function(value, i) {
  var name = value.name.toLowerCase();
  var test = values[name];
  var testCtor = new value();

  describe(value.name, function() {
    it("should check a type and return the value", function() {
      expect(type[name](test)).to.equal(test);
      expect(type[name](testCtor)).to.equal(testCtor);
    });

    it("should check a type and return an error", function() {
      var curry = function() {
        type[name]();
      }

      expect(curry).to.throw("TypistError: Expected variable to be of type " + value.name);
    });

    it("should check a type and return a boolean", function() {
      expect(type.is[name]()).to.be.false;
      expect(type.is[name](test)).to.be.true;
      expect(type.is[name](testCtor)).to.be.true;
    });

    it("should 'annotate' a function return type", function() {
      var temp = type(value, function(input) {
        return input;
      });
      
      expect(temp(test)).to.be.equal(test);
      expect(temp(testCtor)).to.be.equal(testCtor);
    });

    it("should 'annotate' a function return error", function() {
      var test = type(value, function(input) {
        return input;
      });
      
      var curry = function() {
        test();
      }
      
      expect(curry).to.throw("TypistError: Expected a return value to be of type " + value.name);
    });
  });
});

describe("Edge Cases", function() {
  it("return true for an array of iframes", function() {
    var win = doc.defaultView;

    var iframeEl = doc.createElement('iframe');
    doc.body.appendChild(iframeEl);
    var iframeArray = win.frames[win.frames.length - 1].Array;

    var arr = new iframeArray(1,1,1,1);

    expect(type.is.array(arr)).to.be.true;
  });
});
