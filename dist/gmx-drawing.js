'use strict';

function _interopDefault (ex) { return (ex && (typeof ex === 'object') && 'default' in ex) ? ex['default'] : ex; }

var L = _interopDefault(require('leaflet'));
require('leaflet-geomixer-rollup');

var commonjsGlobal = typeof globalThis !== 'undefined' ? globalThis : typeof window !== 'undefined' ? window : typeof global !== 'undefined' ? global : typeof self !== 'undefined' ? self : {};

function createCommonjsModule(fn, basedir, module) {
	return module = {
	  path: basedir,
	  exports: {},
	  require: function (path, base) {
      return commonjsRequire(path, (base === undefined || base === null) ? module.path : base);
    }
	}, fn(module, module.exports), module.exports;
}

function commonjsRequire () {
	throw new Error('Dynamic requires are not currently supported by @rollup/plugin-commonjs');
}

var check = function (it) {
  return it && it.Math == Math && it;
};

// https://github.com/zloirock/core-js/issues/86#issuecomment-115759028
var global_1 =
  // eslint-disable-next-line no-undef
  check(typeof globalThis == 'object' && globalThis) ||
  check(typeof window == 'object' && window) ||
  check(typeof self == 'object' && self) ||
  check(typeof commonjsGlobal == 'object' && commonjsGlobal) ||
  // eslint-disable-next-line no-new-func
  Function('return this')();

var fails = function (exec) {
  try {
    return !!exec();
  } catch (error) {
    return true;
  }
};

// Thank's IE8 for his funny defineProperty
var descriptors = !fails(function () {
  return Object.defineProperty({}, 1, { get: function () { return 7; } })[1] != 7;
});

var nativePropertyIsEnumerable = {}.propertyIsEnumerable;
var getOwnPropertyDescriptor = Object.getOwnPropertyDescriptor;

// Nashorn ~ JDK8 bug
var NASHORN_BUG = getOwnPropertyDescriptor && !nativePropertyIsEnumerable.call({ 1: 2 }, 1);

// `Object.prototype.propertyIsEnumerable` method implementation
// https://tc39.github.io/ecma262/#sec-object.prototype.propertyisenumerable
var f = NASHORN_BUG ? function propertyIsEnumerable(V) {
  var descriptor = getOwnPropertyDescriptor(this, V);
  return !!descriptor && descriptor.enumerable;
} : nativePropertyIsEnumerable;

var objectPropertyIsEnumerable = {
	f: f
};

var createPropertyDescriptor = function (bitmap, value) {
  return {
    enumerable: !(bitmap & 1),
    configurable: !(bitmap & 2),
    writable: !(bitmap & 4),
    value: value
  };
};

var toString = {}.toString;

var classofRaw = function (it) {
  return toString.call(it).slice(8, -1);
};

var split = ''.split;

// fallback for non-array-like ES3 and non-enumerable old V8 strings
var indexedObject = fails(function () {
  // throws an error in rhino, see https://github.com/mozilla/rhino/issues/346
  // eslint-disable-next-line no-prototype-builtins
  return !Object('z').propertyIsEnumerable(0);
}) ? function (it) {
  return classofRaw(it) == 'String' ? split.call(it, '') : Object(it);
} : Object;

// `RequireObjectCoercible` abstract operation
// https://tc39.github.io/ecma262/#sec-requireobjectcoercible
var requireObjectCoercible = function (it) {
  if (it == undefined) throw TypeError("Can't call method on " + it);
  return it;
};

// toObject with fallback for non-array-like ES3 strings



var toIndexedObject = function (it) {
  return indexedObject(requireObjectCoercible(it));
};

var isObject = function (it) {
  return typeof it === 'object' ? it !== null : typeof it === 'function';
};

// `ToPrimitive` abstract operation
// https://tc39.github.io/ecma262/#sec-toprimitive
// instead of the ES6 spec version, we didn't implement @@toPrimitive case
// and the second argument - flag - preferred type is a string
var toPrimitive = function (input, PREFERRED_STRING) {
  if (!isObject(input)) return input;
  var fn, val;
  if (PREFERRED_STRING && typeof (fn = input.toString) == 'function' && !isObject(val = fn.call(input))) return val;
  if (typeof (fn = input.valueOf) == 'function' && !isObject(val = fn.call(input))) return val;
  if (!PREFERRED_STRING && typeof (fn = input.toString) == 'function' && !isObject(val = fn.call(input))) return val;
  throw TypeError("Can't convert object to primitive value");
};

var hasOwnProperty = {}.hasOwnProperty;

var has = function (it, key) {
  return hasOwnProperty.call(it, key);
};

var document$1 = global_1.document;
// typeof document.createElement is 'object' in old IE
var EXISTS = isObject(document$1) && isObject(document$1.createElement);

var documentCreateElement = function (it) {
  return EXISTS ? document$1.createElement(it) : {};
};

// Thank's IE8 for his funny defineProperty
var ie8DomDefine = !descriptors && !fails(function () {
  return Object.defineProperty(documentCreateElement('div'), 'a', {
    get: function () { return 7; }
  }).a != 7;
});

var nativeGetOwnPropertyDescriptor = Object.getOwnPropertyDescriptor;

// `Object.getOwnPropertyDescriptor` method
// https://tc39.github.io/ecma262/#sec-object.getownpropertydescriptor
var f$1 = descriptors ? nativeGetOwnPropertyDescriptor : function getOwnPropertyDescriptor(O, P) {
  O = toIndexedObject(O);
  P = toPrimitive(P, true);
  if (ie8DomDefine) try {
    return nativeGetOwnPropertyDescriptor(O, P);
  } catch (error) { /* empty */ }
  if (has(O, P)) return createPropertyDescriptor(!objectPropertyIsEnumerable.f.call(O, P), O[P]);
};

var objectGetOwnPropertyDescriptor = {
	f: f$1
};

var anObject = function (it) {
  if (!isObject(it)) {
    throw TypeError(String(it) + ' is not an object');
  } return it;
};

var nativeDefineProperty = Object.defineProperty;

// `Object.defineProperty` method
// https://tc39.github.io/ecma262/#sec-object.defineproperty
var f$2 = descriptors ? nativeDefineProperty : function defineProperty(O, P, Attributes) {
  anObject(O);
  P = toPrimitive(P, true);
  anObject(Attributes);
  if (ie8DomDefine) try {
    return nativeDefineProperty(O, P, Attributes);
  } catch (error) { /* empty */ }
  if ('get' in Attributes || 'set' in Attributes) throw TypeError('Accessors not supported');
  if ('value' in Attributes) O[P] = Attributes.value;
  return O;
};

var objectDefineProperty = {
	f: f$2
};

var createNonEnumerableProperty = descriptors ? function (object, key, value) {
  return objectDefineProperty.f(object, key, createPropertyDescriptor(1, value));
} : function (object, key, value) {
  object[key] = value;
  return object;
};

var setGlobal = function (key, value) {
  try {
    createNonEnumerableProperty(global_1, key, value);
  } catch (error) {
    global_1[key] = value;
  } return value;
};

var SHARED = '__core-js_shared__';
var store = global_1[SHARED] || setGlobal(SHARED, {});

var sharedStore = store;

var functionToString = Function.toString;

// this helper broken in `3.4.1-3.4.4`, so we can't use `shared` helper
if (typeof sharedStore.inspectSource != 'function') {
  sharedStore.inspectSource = function (it) {
    return functionToString.call(it);
  };
}

var inspectSource = sharedStore.inspectSource;

var WeakMap = global_1.WeakMap;

var nativeWeakMap = typeof WeakMap === 'function' && /native code/.test(inspectSource(WeakMap));

var shared = createCommonjsModule(function (module) {
(module.exports = function (key, value) {
  return sharedStore[key] || (sharedStore[key] = value !== undefined ? value : {});
})('versions', []).push({
  version: '3.6.5',
  mode:  'global',
  copyright: '© 2020 Denis Pushkarev (zloirock.ru)'
});
});

var id = 0;
var postfix = Math.random();

var uid = function (key) {
  return 'Symbol(' + String(key === undefined ? '' : key) + ')_' + (++id + postfix).toString(36);
};

var keys = shared('keys');

var sharedKey = function (key) {
  return keys[key] || (keys[key] = uid(key));
};

var hiddenKeys = {};

var WeakMap$1 = global_1.WeakMap;
var set, get, has$1;

var enforce = function (it) {
  return has$1(it) ? get(it) : set(it, {});
};

var getterFor = function (TYPE) {
  return function (it) {
    var state;
    if (!isObject(it) || (state = get(it)).type !== TYPE) {
      throw TypeError('Incompatible receiver, ' + TYPE + ' required');
    } return state;
  };
};

if (nativeWeakMap) {
  var store$1 = new WeakMap$1();
  var wmget = store$1.get;
  var wmhas = store$1.has;
  var wmset = store$1.set;
  set = function (it, metadata) {
    wmset.call(store$1, it, metadata);
    return metadata;
  };
  get = function (it) {
    return wmget.call(store$1, it) || {};
  };
  has$1 = function (it) {
    return wmhas.call(store$1, it);
  };
} else {
  var STATE = sharedKey('state');
  hiddenKeys[STATE] = true;
  set = function (it, metadata) {
    createNonEnumerableProperty(it, STATE, metadata);
    return metadata;
  };
  get = function (it) {
    return has(it, STATE) ? it[STATE] : {};
  };
  has$1 = function (it) {
    return has(it, STATE);
  };
}

var internalState = {
  set: set,
  get: get,
  has: has$1,
  enforce: enforce,
  getterFor: getterFor
};

var redefine = createCommonjsModule(function (module) {
var getInternalState = internalState.get;
var enforceInternalState = internalState.enforce;
var TEMPLATE = String(String).split('String');

(module.exports = function (O, key, value, options) {
  var unsafe = options ? !!options.unsafe : false;
  var simple = options ? !!options.enumerable : false;
  var noTargetGet = options ? !!options.noTargetGet : false;
  if (typeof value == 'function') {
    if (typeof key == 'string' && !has(value, 'name')) createNonEnumerableProperty(value, 'name', key);
    enforceInternalState(value).source = TEMPLATE.join(typeof key == 'string' ? key : '');
  }
  if (O === global_1) {
    if (simple) O[key] = value;
    else setGlobal(key, value);
    return;
  } else if (!unsafe) {
    delete O[key];
  } else if (!noTargetGet && O[key]) {
    simple = true;
  }
  if (simple) O[key] = value;
  else createNonEnumerableProperty(O, key, value);
// add fake Function#toString for correct work wrapped methods / constructors with methods like LoDash isNative
})(Function.prototype, 'toString', function toString() {
  return typeof this == 'function' && getInternalState(this).source || inspectSource(this);
});
});

var path = global_1;

var aFunction = function (variable) {
  return typeof variable == 'function' ? variable : undefined;
};

var getBuiltIn = function (namespace, method) {
  return arguments.length < 2 ? aFunction(path[namespace]) || aFunction(global_1[namespace])
    : path[namespace] && path[namespace][method] || global_1[namespace] && global_1[namespace][method];
};

var ceil = Math.ceil;
var floor = Math.floor;

// `ToInteger` abstract operation
// https://tc39.github.io/ecma262/#sec-tointeger
var toInteger = function (argument) {
  return isNaN(argument = +argument) ? 0 : (argument > 0 ? floor : ceil)(argument);
};

var min = Math.min;

// `ToLength` abstract operation
// https://tc39.github.io/ecma262/#sec-tolength
var toLength = function (argument) {
  return argument > 0 ? min(toInteger(argument), 0x1FFFFFFFFFFFFF) : 0; // 2 ** 53 - 1 == 9007199254740991
};

var max = Math.max;
var min$1 = Math.min;

// Helper for a popular repeating case of the spec:
// Let integer be ? ToInteger(index).
// If integer < 0, let result be max((length + integer), 0); else let result be min(integer, length).
var toAbsoluteIndex = function (index, length) {
  var integer = toInteger(index);
  return integer < 0 ? max(integer + length, 0) : min$1(integer, length);
};

// `Array.prototype.{ indexOf, includes }` methods implementation
var createMethod = function (IS_INCLUDES) {
  return function ($this, el, fromIndex) {
    var O = toIndexedObject($this);
    var length = toLength(O.length);
    var index = toAbsoluteIndex(fromIndex, length);
    var value;
    // Array#includes uses SameValueZero equality algorithm
    // eslint-disable-next-line no-self-compare
    if (IS_INCLUDES && el != el) while (length > index) {
      value = O[index++];
      // eslint-disable-next-line no-self-compare
      if (value != value) return true;
    // Array#indexOf ignores holes, Array#includes - not
    } else for (;length > index; index++) {
      if ((IS_INCLUDES || index in O) && O[index] === el) return IS_INCLUDES || index || 0;
    } return !IS_INCLUDES && -1;
  };
};

var arrayIncludes = {
  // `Array.prototype.includes` method
  // https://tc39.github.io/ecma262/#sec-array.prototype.includes
  includes: createMethod(true),
  // `Array.prototype.indexOf` method
  // https://tc39.github.io/ecma262/#sec-array.prototype.indexof
  indexOf: createMethod(false)
};

var indexOf = arrayIncludes.indexOf;


var objectKeysInternal = function (object, names) {
  var O = toIndexedObject(object);
  var i = 0;
  var result = [];
  var key;
  for (key in O) !has(hiddenKeys, key) && has(O, key) && result.push(key);
  // Don't enum bug & hidden keys
  while (names.length > i) if (has(O, key = names[i++])) {
    ~indexOf(result, key) || result.push(key);
  }
  return result;
};

// IE8- don't enum bug keys
var enumBugKeys = [
  'constructor',
  'hasOwnProperty',
  'isPrototypeOf',
  'propertyIsEnumerable',
  'toLocaleString',
  'toString',
  'valueOf'
];

var hiddenKeys$1 = enumBugKeys.concat('length', 'prototype');

// `Object.getOwnPropertyNames` method
// https://tc39.github.io/ecma262/#sec-object.getownpropertynames
var f$3 = Object.getOwnPropertyNames || function getOwnPropertyNames(O) {
  return objectKeysInternal(O, hiddenKeys$1);
};

var objectGetOwnPropertyNames = {
	f: f$3
};

var f$4 = Object.getOwnPropertySymbols;

var objectGetOwnPropertySymbols = {
	f: f$4
};

// all object keys, includes non-enumerable and symbols
var ownKeys = getBuiltIn('Reflect', 'ownKeys') || function ownKeys(it) {
  var keys = objectGetOwnPropertyNames.f(anObject(it));
  var getOwnPropertySymbols = objectGetOwnPropertySymbols.f;
  return getOwnPropertySymbols ? keys.concat(getOwnPropertySymbols(it)) : keys;
};

var copyConstructorProperties = function (target, source) {
  var keys = ownKeys(source);
  var defineProperty = objectDefineProperty.f;
  var getOwnPropertyDescriptor = objectGetOwnPropertyDescriptor.f;
  for (var i = 0; i < keys.length; i++) {
    var key = keys[i];
    if (!has(target, key)) defineProperty(target, key, getOwnPropertyDescriptor(source, key));
  }
};

var replacement = /#|\.prototype\./;

var isForced = function (feature, detection) {
  var value = data[normalize(feature)];
  return value == POLYFILL ? true
    : value == NATIVE ? false
    : typeof detection == 'function' ? fails(detection)
    : !!detection;
};

var normalize = isForced.normalize = function (string) {
  return String(string).replace(replacement, '.').toLowerCase();
};

var data = isForced.data = {};
var NATIVE = isForced.NATIVE = 'N';
var POLYFILL = isForced.POLYFILL = 'P';

var isForced_1 = isForced;

var getOwnPropertyDescriptor$1 = objectGetOwnPropertyDescriptor.f;






/*
  options.target      - name of the target object
  options.global      - target is the global object
  options.stat        - export as static methods of target
  options.proto       - export as prototype methods of target
  options.real        - real prototype method for the `pure` version
  options.forced      - export even if the native feature is available
  options.bind        - bind methods to the target, required for the `pure` version
  options.wrap        - wrap constructors to preventing global pollution, required for the `pure` version
  options.unsafe      - use the simple assignment of property instead of delete + defineProperty
  options.sham        - add a flag to not completely full polyfills
  options.enumerable  - export as enumerable property
  options.noTargetGet - prevent calling a getter on target
*/
var _export = function (options, source) {
  var TARGET = options.target;
  var GLOBAL = options.global;
  var STATIC = options.stat;
  var FORCED, target, key, targetProperty, sourceProperty, descriptor;
  if (GLOBAL) {
    target = global_1;
  } else if (STATIC) {
    target = global_1[TARGET] || setGlobal(TARGET, {});
  } else {
    target = (global_1[TARGET] || {}).prototype;
  }
  if (target) for (key in source) {
    sourceProperty = source[key];
    if (options.noTargetGet) {
      descriptor = getOwnPropertyDescriptor$1(target, key);
      targetProperty = descriptor && descriptor.value;
    } else targetProperty = target[key];
    FORCED = isForced_1(GLOBAL ? key : TARGET + (STATIC ? '.' : '#') + key, options.forced);
    // contained in target
    if (!FORCED && targetProperty !== undefined) {
      if (typeof sourceProperty === typeof targetProperty) continue;
      copyConstructorProperties(sourceProperty, targetProperty);
    }
    // add a flag to not completely full polyfills
    if (options.sham || (targetProperty && targetProperty.sham)) {
      createNonEnumerableProperty(sourceProperty, 'sham', true);
    }
    // extend global
    redefine(target, key, sourceProperty, options);
  }
};

// `IsArray` abstract operation
// https://tc39.github.io/ecma262/#sec-isarray
var isArray = Array.isArray || function isArray(arg) {
  return classofRaw(arg) == 'Array';
};

// `ToObject` abstract operation
// https://tc39.github.io/ecma262/#sec-toobject
var toObject = function (argument) {
  return Object(requireObjectCoercible(argument));
};

var createProperty = function (object, key, value) {
  var propertyKey = toPrimitive(key);
  if (propertyKey in object) objectDefineProperty.f(object, propertyKey, createPropertyDescriptor(0, value));
  else object[propertyKey] = value;
};

var nativeSymbol = !!Object.getOwnPropertySymbols && !fails(function () {
  // Chrome 38 Symbol has incorrect toString conversion
  // eslint-disable-next-line no-undef
  return !String(Symbol());
});

var useSymbolAsUid = nativeSymbol
  // eslint-disable-next-line no-undef
  && !Symbol.sham
  // eslint-disable-next-line no-undef
  && typeof Symbol.iterator == 'symbol';

var WellKnownSymbolsStore = shared('wks');
var Symbol$1 = global_1.Symbol;
var createWellKnownSymbol = useSymbolAsUid ? Symbol$1 : Symbol$1 && Symbol$1.withoutSetter || uid;

var wellKnownSymbol = function (name) {
  if (!has(WellKnownSymbolsStore, name)) {
    if (nativeSymbol && has(Symbol$1, name)) WellKnownSymbolsStore[name] = Symbol$1[name];
    else WellKnownSymbolsStore[name] = createWellKnownSymbol('Symbol.' + name);
  } return WellKnownSymbolsStore[name];
};

var SPECIES = wellKnownSymbol('species');

// `ArraySpeciesCreate` abstract operation
// https://tc39.github.io/ecma262/#sec-arrayspeciescreate
var arraySpeciesCreate = function (originalArray, length) {
  var C;
  if (isArray(originalArray)) {
    C = originalArray.constructor;
    // cross-realm fallback
    if (typeof C == 'function' && (C === Array || isArray(C.prototype))) C = undefined;
    else if (isObject(C)) {
      C = C[SPECIES];
      if (C === null) C = undefined;
    }
  } return new (C === undefined ? Array : C)(length === 0 ? 0 : length);
};

var engineUserAgent = getBuiltIn('navigator', 'userAgent') || '';

var process = global_1.process;
var versions = process && process.versions;
var v8 = versions && versions.v8;
var match, version;

if (v8) {
  match = v8.split('.');
  version = match[0] + match[1];
} else if (engineUserAgent) {
  match = engineUserAgent.match(/Edge\/(\d+)/);
  if (!match || match[1] >= 74) {
    match = engineUserAgent.match(/Chrome\/(\d+)/);
    if (match) version = match[1];
  }
}

var engineV8Version = version && +version;

var SPECIES$1 = wellKnownSymbol('species');

var arrayMethodHasSpeciesSupport = function (METHOD_NAME) {
  // We can't use this feature detection in V8 since it causes
  // deoptimization and serious performance degradation
  // https://github.com/zloirock/core-js/issues/677
  return engineV8Version >= 51 || !fails(function () {
    var array = [];
    var constructor = array.constructor = {};
    constructor[SPECIES$1] = function () {
      return { foo: 1 };
    };
    return array[METHOD_NAME](Boolean).foo !== 1;
  });
};

var IS_CONCAT_SPREADABLE = wellKnownSymbol('isConcatSpreadable');
var MAX_SAFE_INTEGER = 0x1FFFFFFFFFFFFF;
var MAXIMUM_ALLOWED_INDEX_EXCEEDED = 'Maximum allowed index exceeded';

// We can't use this feature detection in V8 since it causes
// deoptimization and serious performance degradation
// https://github.com/zloirock/core-js/issues/679
var IS_CONCAT_SPREADABLE_SUPPORT = engineV8Version >= 51 || !fails(function () {
  var array = [];
  array[IS_CONCAT_SPREADABLE] = false;
  return array.concat()[0] !== array;
});

var SPECIES_SUPPORT = arrayMethodHasSpeciesSupport('concat');

var isConcatSpreadable = function (O) {
  if (!isObject(O)) return false;
  var spreadable = O[IS_CONCAT_SPREADABLE];
  return spreadable !== undefined ? !!spreadable : isArray(O);
};

var FORCED = !IS_CONCAT_SPREADABLE_SUPPORT || !SPECIES_SUPPORT;

// `Array.prototype.concat` method
// https://tc39.github.io/ecma262/#sec-array.prototype.concat
// with adding support of @@isConcatSpreadable and @@species
_export({ target: 'Array', proto: true, forced: FORCED }, {
  concat: function concat(arg) { // eslint-disable-line no-unused-vars
    var O = toObject(this);
    var A = arraySpeciesCreate(O, 0);
    var n = 0;
    var i, k, length, len, E;
    for (i = -1, length = arguments.length; i < length; i++) {
      E = i === -1 ? O : arguments[i];
      if (isConcatSpreadable(E)) {
        len = toLength(E.length);
        if (n + len > MAX_SAFE_INTEGER) throw TypeError(MAXIMUM_ALLOWED_INDEX_EXCEEDED);
        for (k = 0; k < len; k++, n++) if (k in E) createProperty(A, n, E[k]);
      } else {
        if (n >= MAX_SAFE_INTEGER) throw TypeError(MAXIMUM_ALLOWED_INDEX_EXCEEDED);
        createProperty(A, n++, E);
      }
    }
    A.length = n;
    return A;
  }
});

var aFunction$1 = function (it) {
  if (typeof it != 'function') {
    throw TypeError(String(it) + ' is not a function');
  } return it;
};

// optional / simple context binding
var functionBindContext = function (fn, that, length) {
  aFunction$1(fn);
  if (that === undefined) return fn;
  switch (length) {
    case 0: return function () {
      return fn.call(that);
    };
    case 1: return function (a) {
      return fn.call(that, a);
    };
    case 2: return function (a, b) {
      return fn.call(that, a, b);
    };
    case 3: return function (a, b, c) {
      return fn.call(that, a, b, c);
    };
  }
  return function (/* ...args */) {
    return fn.apply(that, arguments);
  };
};

var push = [].push;

// `Array.prototype.{ forEach, map, filter, some, every, find, findIndex }` methods implementation
var createMethod$1 = function (TYPE) {
  var IS_MAP = TYPE == 1;
  var IS_FILTER = TYPE == 2;
  var IS_SOME = TYPE == 3;
  var IS_EVERY = TYPE == 4;
  var IS_FIND_INDEX = TYPE == 6;
  var NO_HOLES = TYPE == 5 || IS_FIND_INDEX;
  return function ($this, callbackfn, that, specificCreate) {
    var O = toObject($this);
    var self = indexedObject(O);
    var boundFunction = functionBindContext(callbackfn, that, 3);
    var length = toLength(self.length);
    var index = 0;
    var create = specificCreate || arraySpeciesCreate;
    var target = IS_MAP ? create($this, length) : IS_FILTER ? create($this, 0) : undefined;
    var value, result;
    for (;length > index; index++) if (NO_HOLES || index in self) {
      value = self[index];
      result = boundFunction(value, index, O);
      if (TYPE) {
        if (IS_MAP) target[index] = result; // map
        else if (result) switch (TYPE) {
          case 3: return true;              // some
          case 5: return value;             // find
          case 6: return index;             // findIndex
          case 2: push.call(target, value); // filter
        } else if (IS_EVERY) return false;  // every
      }
    }
    return IS_FIND_INDEX ? -1 : IS_SOME || IS_EVERY ? IS_EVERY : target;
  };
};

var arrayIteration = {
  // `Array.prototype.forEach` method
  // https://tc39.github.io/ecma262/#sec-array.prototype.foreach
  forEach: createMethod$1(0),
  // `Array.prototype.map` method
  // https://tc39.github.io/ecma262/#sec-array.prototype.map
  map: createMethod$1(1),
  // `Array.prototype.filter` method
  // https://tc39.github.io/ecma262/#sec-array.prototype.filter
  filter: createMethod$1(2),
  // `Array.prototype.some` method
  // https://tc39.github.io/ecma262/#sec-array.prototype.some
  some: createMethod$1(3),
  // `Array.prototype.every` method
  // https://tc39.github.io/ecma262/#sec-array.prototype.every
  every: createMethod$1(4),
  // `Array.prototype.find` method
  // https://tc39.github.io/ecma262/#sec-array.prototype.find
  find: createMethod$1(5),
  // `Array.prototype.findIndex` method
  // https://tc39.github.io/ecma262/#sec-array.prototype.findIndex
  findIndex: createMethod$1(6)
};

var defineProperty = Object.defineProperty;
var cache = {};

var thrower = function (it) { throw it; };

var arrayMethodUsesToLength = function (METHOD_NAME, options) {
  if (has(cache, METHOD_NAME)) return cache[METHOD_NAME];
  if (!options) options = {};
  var method = [][METHOD_NAME];
  var ACCESSORS = has(options, 'ACCESSORS') ? options.ACCESSORS : false;
  var argument0 = has(options, 0) ? options[0] : thrower;
  var argument1 = has(options, 1) ? options[1] : undefined;

  return cache[METHOD_NAME] = !!method && !fails(function () {
    if (ACCESSORS && !descriptors) return true;
    var O = { length: -1 };

    if (ACCESSORS) defineProperty(O, 1, { enumerable: true, get: thrower });
    else O[1] = 1;

    method.call(O, argument0, argument1);
  });
};

var $map = arrayIteration.map;



var HAS_SPECIES_SUPPORT = arrayMethodHasSpeciesSupport('map');
// FF49- issue
var USES_TO_LENGTH = arrayMethodUsesToLength('map');

// `Array.prototype.map` method
// https://tc39.github.io/ecma262/#sec-array.prototype.map
// with adding support of @@species
_export({ target: 'Array', proto: true, forced: !HAS_SPECIES_SUPPORT || !USES_TO_LENGTH }, {
  map: function map(callbackfn /* , thisArg */) {
    return $map(this, callbackfn, arguments.length > 1 ? arguments[1] : undefined);
  }
});

var HAS_SPECIES_SUPPORT$1 = arrayMethodHasSpeciesSupport('splice');
var USES_TO_LENGTH$1 = arrayMethodUsesToLength('splice', { ACCESSORS: true, 0: 0, 1: 2 });

var max$1 = Math.max;
var min$2 = Math.min;
var MAX_SAFE_INTEGER$1 = 0x1FFFFFFFFFFFFF;
var MAXIMUM_ALLOWED_LENGTH_EXCEEDED = 'Maximum allowed length exceeded';

// `Array.prototype.splice` method
// https://tc39.github.io/ecma262/#sec-array.prototype.splice
// with adding support of @@species
_export({ target: 'Array', proto: true, forced: !HAS_SPECIES_SUPPORT$1 || !USES_TO_LENGTH$1 }, {
  splice: function splice(start, deleteCount /* , ...items */) {
    var O = toObject(this);
    var len = toLength(O.length);
    var actualStart = toAbsoluteIndex(start, len);
    var argumentsLength = arguments.length;
    var insertCount, actualDeleteCount, A, k, from, to;
    if (argumentsLength === 0) {
      insertCount = actualDeleteCount = 0;
    } else if (argumentsLength === 1) {
      insertCount = 0;
      actualDeleteCount = len - actualStart;
    } else {
      insertCount = argumentsLength - 2;
      actualDeleteCount = min$2(max$1(toInteger(deleteCount), 0), len - actualStart);
    }
    if (len + insertCount - actualDeleteCount > MAX_SAFE_INTEGER$1) {
      throw TypeError(MAXIMUM_ALLOWED_LENGTH_EXCEEDED);
    }
    A = arraySpeciesCreate(O, actualDeleteCount);
    for (k = 0; k < actualDeleteCount; k++) {
      from = actualStart + k;
      if (from in O) createProperty(A, k, O[from]);
    }
    A.length = actualDeleteCount;
    if (insertCount < actualDeleteCount) {
      for (k = actualStart; k < len - actualDeleteCount; k++) {
        from = k + actualDeleteCount;
        to = k + insertCount;
        if (from in O) O[to] = O[from];
        else delete O[to];
      }
      for (k = len; k > len - actualDeleteCount + insertCount; k--) delete O[k - 1];
    } else if (insertCount > actualDeleteCount) {
      for (k = len - actualDeleteCount; k > actualStart; k--) {
        from = k + actualDeleteCount - 1;
        to = k + insertCount - 1;
        if (from in O) O[to] = O[from];
        else delete O[to];
      }
    }
    for (k = 0; k < insertCount; k++) {
      O[k + actualStart] = arguments[k + 2];
    }
    O.length = len - actualDeleteCount + insertCount;
    return A;
  }
});

// `Object.keys` method
// https://tc39.github.io/ecma262/#sec-object.keys
var objectKeys = Object.keys || function keys(O) {
  return objectKeysInternal(O, enumBugKeys);
};

var FAILS_ON_PRIMITIVES = fails(function () { objectKeys(1); });

// `Object.keys` method
// https://tc39.github.io/ecma262/#sec-object.keys
_export({ target: 'Object', stat: true, forced: FAILS_ON_PRIMITIVES }, {
  keys: function keys(it) {
    return objectKeys(toObject(it));
  }
});

function _classCallCheck(instance, Constructor) {
  if (!(instance instanceof Constructor)) {
    throw new TypeError("Cannot call a class as a function");
  }
}

function _defineProperties(target, props) {
  for (var i = 0; i < props.length; i++) {
    var descriptor = props[i];
    descriptor.enumerable = descriptor.enumerable || false;
    descriptor.configurable = true;
    if ("value" in descriptor) descriptor.writable = true;
    Object.defineProperty(target, descriptor.key, descriptor);
  }
}

function _createClass(Constructor, protoProps, staticProps) {
  if (protoProps) _defineProperties(Constructor.prototype, protoProps);
  if (staticProps) _defineProperties(Constructor, staticProps);
  return Constructor;
}

var GmxDrawingContextMenu = /*#__PURE__*/function () {
  function GmxDrawingContextMenu() {
    var options = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {
      points: [],
      lines: [],
      fill: []
    };

    _classCallCheck(this, GmxDrawingContextMenu);

    this.options = options;
  }

  _createClass(GmxDrawingContextMenu, [{
    key: "insertItem",
    value: function insertItem(obj, index, type) {
      var optKey = type || 'points';

      if (index === undefined) {
        index = this.options[optKey].length;
      }

      this.options[optKey].splice(index, 0, obj);
      return this;
    }
  }, {
    key: "removeItem",
    value: function removeItem(obj, type) {
      var optKey = type || 'points';

      for (var i = 0, len = this.options[optKey].length; i < len; i++) {
        if (this.options[optKey][i].callback === obj.callback) {
          this.options[optKey].splice(i, 1);
          break;
        }
      }

      return this;
    }
  }, {
    key: "removeAllItems",
    value: function removeAllItems(type) {
      if (!type) {
        this.options = {
          points: [],
          lines: []
        };
      } else if (type === 'lines') {
        this.options.lines = [];
      } else {
        this.options.points = [];
      }

      return this;
    }
  }, {
    key: "getItems",
    value: function getItems() {
      return this.options;
    }
  }]);

  return GmxDrawingContextMenu;
}();

L.GmxDrawingContextMenu = GmxDrawingContextMenu;
var GmxDrawingContextMenu$1 = L.GmxDrawingContextMenu;

var rectDelta = 0.0000001;
var stateVersion = '1.0.0';
L.GmxDrawing = L.Class.extend({
  options: {
    type: ''
  },
  includes: L.Evented ? L.Evented.prototype : L.Mixin.Events,
  initialize: function initialize(map) {
    this._map = map;
    this.items = [];
    this.current = null;
    this.contextmenu = new GmxDrawingContextMenu$1({
      // points: [], // [{text: 'Remove point'}, {text: 'Delete feature'}],
      points: [{
        text: 'Move'
      }, {
        text: 'Rotate'
      }, {
        text: 'Remove point'
      }, {
        text: 'Delete feature'
      }],
      // , {text: 'Rotate around Point'}
      bbox: [{
        text: 'Save'
      }, {
        text: 'Cancel'
      }],
      fill: [{
        text: 'Rotate'
      }, {
        text: 'Move'
      }]
    });

    if (L.gmxUtil && L.gmxUtil.prettifyDistance) {
      var svgNS = 'http://www.w3.org/2000/svg';
      var tooltip = document.createElementNS(svgNS, 'g');
      L.DomUtil.addClass(tooltip, 'gmxTooltip');
      var bg = document.createElementNS(svgNS, 'rect');
      bg.setAttributeNS(null, 'rx', 4);
      bg.setAttributeNS(null, 'ry', 4);
      bg.setAttributeNS(null, 'height', 16);
      L.DomUtil.addClass(bg, 'gmxTooltipBG');
      var text = document.createElementNS(svgNS, 'text');
      var userSelectProperty = L.DomUtil.testProp(['userSelect', 'WebkitUserSelect', 'OUserSelect', 'MozUserSelect', 'msUserSelect']);
      text.style[userSelectProperty] = 'none';
      tooltip.appendChild(bg);
      tooltip.appendChild(text);

      this.hideTooltip = function () {
        tooltip.setAttributeNS(null, 'visibility', 'hidden');
      };

      this.showTooltip = function (point, mouseovertext) {
        var x = point.x + 11,
            y = point.y - 14;
        text.setAttributeNS(null, 'x', x);
        text.setAttributeNS(null, 'y', y);
        text.textContent = mouseovertext;

        if (tooltip.getAttributeNS(null, 'visibility') !== 'visible') {
          (this._map._pathRoot || this._map._renderer._container).appendChild(tooltip);

          tooltip.setAttributeNS(null, 'visibility', 'visible');
        }

        var length = text.getComputedTextLength();
        bg.setAttributeNS(null, 'width', length + 8);
        bg.setAttributeNS(null, 'x', x - 4);
        bg.setAttributeNS(null, 'y', y - 12);
      };
    }

    this.on('drawstop drawstart', function (ev) {
      this.drawMode = this._drawMode = ev.mode;

      this._map.doubleClickZoom[this.drawMode === 'edit' ? 'disable' : 'enable']();
    }, this);
  },
  bringToFront: function bringToFront() {
    for (var i = 0, len = this.items.length; i < len; i++) {
      var item = this.items[i];

      if (item._map && 'bringToFront' in item) {
        item.bringToFront();
      }
    }
  },
  addGeoJSON: function addGeoJSON(obj, options) {
    var arr = [],
        isLGeoJSON = obj instanceof L.GeoJSON;

    if (!isLGeoJSON) {
      obj = L.geoJson(obj, options);
    }

    if (obj instanceof L.GeoJSON) {
      var layers = obj.getLayers();

      if (layers) {
        var parseLayer = function parseLayer(it) {
          var _originalStyle = null;

          if (it.setStyle && options && options.lineStyle) {
            _originalStyle = {};

            for (var key in options.lineStyle) {
              _originalStyle[key] = options.lineStyle[key];
            }

            it.setStyle(options.lineStyle);
          }

          var f = this.add(it, options);
          f._originalStyle = _originalStyle;
          arr.push(f);
        };

        for (var i = 0, len = layers.length; i < len; i++) {
          var layer = layers[i];

          if (layer.feature.geometry.type !== 'GeometryCollection') {
            layer = L.layerGroup([layer]);
          }

          layer.eachLayer(parseLayer, this);
        }
      }
    }

    return arr;
  },
  add: function add(obj, options) {
    var item = null;
    options = options || {};

    if (obj) {
      if (obj instanceof L.GmxDrawing.Feature) {
        item = obj;
      } else {
        var calcOptions = {};

        if (obj.feature && obj.feature.geometry) {
          var type = obj.feature.geometry.type;

          if (type === 'Point') {
            obj = new L.Marker(obj._latlng);
          } else if (type === 'MultiPolygon') {
            calcOptions.type = type;
          }
        } // if (!L.MultiPolygon) { L.MultiPolygon = L.Polygon; }
        // if (!L.MultiPolyline) { L.MultiPolyline = L.Polyline; }


        if (!options || !('editable' in options)) {
          calcOptions.editable = true;
        }

        if (obj.geometry) {
          calcOptions.type = obj.geometry.type;
        } else if (obj instanceof L.Rectangle) {
          calcOptions.type = 'Rectangle';
        } else if (obj instanceof L.Polygon) {
          calcOptions.type = calcOptions.type || 'Polygon';
        } else if (L.MultiPolygon && obj instanceof L.MultiPolygon) {
          calcOptions.type = 'MultiPolygon';
        } else if (obj instanceof L.Polyline) {
          calcOptions.type = 'Polyline';
        } else if (L.MultiPolyline && obj instanceof L.MultiPolyline) {
          calcOptions.type = 'MultiPolyline';
        } else if (obj.setIcon || obj instanceof L.Marker) {
          calcOptions.type = 'Point';
          calcOptions.editable = false;
          obj.options.draggable = true;
        }

        options = this._chkDrawOptions(calcOptions.type, options);
        L.extend(options, calcOptions);

        if (obj.geometry) {
          var iconStyle = options.markerStyle && options.markerStyle.iconStyle;

          if (options.type === 'Point' && !options.pointToLayer && iconStyle) {
            options.icon = L.icon(iconStyle);

            options.pointToLayer = function (geojson, latlng) {
              return new L.Marker(latlng, options);
            };
          }

          return this.addGeoJSON(obj, options);
        }

        item = new L.GmxDrawing.Feature(this, obj, options);
      }

      if (!('map' in options)) {
        options.map = true;
      }

      if (options.map && !item._map && this._map) {
        this._map.addLayer(item);
      } else {
        this._addItem(item);
      } //if (!item._map) this._map.addLayer(item);
      //if (item.points) item.points._path.setAttribute('fill-rule', 'inherit');


      if ('setEditMode' in item) {
        item.setEditMode();
      }
    }

    return item;
  },
  _disableDrag: function _disableDrag() {
    if (this._map) {
      this._map.dragging.disable();

      L.DomUtil.disableTextSelection();
      L.DomUtil.disableImageDrag();

      this._map.doubleClickZoom.removeHooks();
    }
  },
  _enableDrag: function _enableDrag() {
    if (this._map) {
      this._map.dragging.enable();

      L.DomUtil.enableTextSelection();
      L.DomUtil.enableImageDrag();

      this._map.doubleClickZoom.addHooks();
    }
  },
  clearCreate: function clearCreate() {
    this._clearCreate();
  },
  _clearCreate: function _clearCreate() {
    if (this._createKey && this._map) {
      if (this._createKey.type === 'Rectangle' && L.Browser.mobile) {
        L.DomEvent.off(this._map._container, 'touchstart', this._createKey.fn, this);
      } else {
        this._map.off(this._createKey.eventName, this._createKey.fn, this);

        this._map.off('mousemove', this._onMouseMove, this);
      }

      this._enableDrag();
    }

    if (this._firstPoint) {
      this._map.removeLayer(this._firstPoint);

      this._firstPoint = null;
    }

    this._createKey = null;
  },
  _chkDrawOptions: function _chkDrawOptions(type, drawOptions) {
    var defaultStyles = L.GmxDrawing.utils.defaultStyles,
        resultStyles = {};

    if (!drawOptions) {
      drawOptions = L.extend({}, defaultStyles);
    }

    if (type === 'Point') {
      L.extend(resultStyles, defaultStyles.markerStyle.options.icon, drawOptions);
    } else {
      L.extend(resultStyles, drawOptions);
      resultStyles.lineStyle = L.extend({}, defaultStyles.lineStyle, drawOptions.lineStyle);
      resultStyles.pointStyle = L.extend({}, defaultStyles.pointStyle, drawOptions.pointStyle);
      resultStyles.holeStyle = L.extend({}, defaultStyles.holeStyle, drawOptions.holeStyle);
    }

    if (resultStyles.iconUrl) {
      var iconStyle = {
        iconUrl: resultStyles.iconUrl
      };
      delete resultStyles.iconUrl;

      if (resultStyles.iconAnchor) {
        iconStyle.iconAnchor = resultStyles.iconAnchor;
        delete resultStyles.iconAnchor;
      }

      if (resultStyles.iconSize) {
        iconStyle.iconSize = resultStyles.iconSize;
        delete resultStyles.iconSize;
      }

      if (resultStyles.popupAnchor) {
        iconStyle.popupAnchor = resultStyles.popupAnchor;
        delete resultStyles.popupAnchor;
      }

      if (resultStyles.shadowSize) {
        iconStyle.shadowSize = resultStyles.shadowSize;
        delete resultStyles.shadowSize;
      }

      resultStyles.markerStyle = {
        iconStyle: iconStyle
      };
    }

    return resultStyles;
  },
  create: function create(type, options) {
    this._clearCreate(null);

    if (type && this._map) {
      var map = this._map,
          drawOptions = this._chkDrawOptions(type, options),
          my = this;

      if (type === 'Rectangle') {
        //map._initPathRoot();
        map.dragging.disable();
      }

      this._createKey = {
        type: type,
        eventName: type === 'Rectangle' ? L.Browser.mobile ? 'touchstart' : 'mousedown' : 'click',
        fn: function fn(ev) {
          var originalEvent = ev && ev.originalEvent,
              ctrlKey = false,
              shiftKey = false,
              altKey = false;

          if (originalEvent) {
            ctrlKey = originalEvent.ctrlKey;
            shiftKey = originalEvent.shiftKey;
            altKey = originalEvent.altKey;
            var clickOnTag = originalEvent.target.tagName;

            if (clickOnTag === 'g' || clickOnTag === 'path') {
              return;
            }
          }

          my._createType = '';
          var obj,
              key,
              opt = {},
              latlng = ev.latlng;

          for (key in drawOptions) {
            if (!(key in L.GmxDrawing.utils.defaultStyles)) {
              opt[key] = drawOptions[key];
            }
          }

          if (ctrlKey && my._firstPoint && my._firstPoint._snaped) {
            latlng = my._firstPoint._snaped;
          }

          if (type === 'Point') {
            var markerStyle = drawOptions.markerStyle || {},
                markerOpt = {
              draggable: true
            };

            if (originalEvent) {
              markerOpt.ctrlKey = ctrlKey;
              markerOpt.shiftKey = shiftKey;
              markerOpt.altKey = altKey;
            }

            if (markerStyle.iconStyle) {
              markerOpt.icon = L.icon(markerStyle.iconStyle);
            }

            obj = my.add(new L.Marker(latlng, markerOpt), opt);
          } else {
            if (drawOptions.pointStyle) {
              opt.pointStyle = drawOptions.pointStyle;
            }

            if (drawOptions.lineStyle) {
              opt.lineStyle = drawOptions.lineStyle;
            }

            if (type === 'Rectangle') {
              // if (L.Browser.mobile) {
              // var downAttr = L.GmxDrawing.utils.getDownType.call(my, ev, my._map);
              // latlng = downAttr.latlng;
              // }
              opt.mode = 'edit';
              obj = my.add(L.rectangle(L.latLngBounds(L.latLng(latlng.lat + rectDelta, latlng.lng - rectDelta), latlng)), opt);

              if (L.Browser.mobile) {
                obj._startTouchMove(ev, true);
              } else {
                obj._pointDown(ev);
              }

              obj.rings[0].ring._drawstop = true;
            } else if (type === 'Polygon') {
              opt.mode = 'add';
              obj = my.add(L.polygon([latlng]), opt);
              obj.setAddMode();
            } else if (type === 'Polyline') {
              opt.mode = 'add';
              obj = my.add(L.polyline([latlng]), opt).setAddMode();
            }
          }

          my._clearCreate();
        }
      };

      if (type === 'Rectangle' && L.Browser.mobile) {
        L.DomEvent.on(map._container, 'touchstart', this._createKey.fn, this);
      } else {
        map.on(this._createKey.eventName, this._createKey.fn, this);
        map.on('mousemove', this._onMouseMove, this);
      }

      this._createType = type;
      L.DomUtil.addClass(map._mapPane, 'leaflet-clickable');
      this.fire('drawstart', {
        mode: type
      });
    }

    this.options.type = type;
  },
  _onMouseMove: function _onMouseMove(ev) {
    var latlngs = [ev.latlng];

    if (!this._firstPoint) {
      this._firstPoint = new L.GmxDrawing.PointMarkers(latlngs, {
        interactive: false
      });

      this._map.addLayer(this._firstPoint);
    } else {
      this._firstPoint.setLatLngs(latlngs);
    }
  },
  extendDefaultStyles: function extendDefaultStyles(drawOptions) {
    var defaultStyles = L.GmxDrawing.utils.defaultStyles;
    drawOptions = drawOptions || {};

    if (drawOptions.iconUrl) {
      var iconStyle = defaultStyles.markerStyle.options.icon;
      iconStyle.iconUrl = drawOptions.iconUrl;
      delete drawOptions.iconUrl;

      if (drawOptions.iconAnchor) {
        iconStyle.iconAnchor = drawOptions.iconAnchor;
        delete drawOptions.iconAnchor;
      }

      if (drawOptions.iconSize) {
        iconStyle.iconSize = drawOptions.iconSize;
        delete drawOptions.iconSize;
      }

      if (drawOptions.popupAnchor) {
        iconStyle.popupAnchor = drawOptions.popupAnchor;
        delete drawOptions.popupAnchor;
      }

      if (drawOptions.shadowSize) {
        iconStyle.shadowSize = drawOptions.shadowSize;
        delete drawOptions.shadowSize;
      }
    }

    if (drawOptions.lineStyle) {
      L.extend(defaultStyles.lineStyle, drawOptions.lineStyle);
      delete drawOptions.lineStyle;
    }

    if (drawOptions.pointStyle) {
      L.extend(defaultStyles.pointStyle, drawOptions.pointStyle);
      delete drawOptions.pointStyle;
    }

    if (drawOptions.holeStyle) {
      L.extend(defaultStyles.holeStyle, drawOptions.holeStyle);
      delete drawOptions.holeStyle;
    }

    L.extend(defaultStyles, drawOptions);
    return this;
  },
  getFeatures: function getFeatures() {
    var out = [];

    for (var i = 0, len = this.items.length; i < len; i++) {
      out.push(this.items[i]);
    }

    return out;
  },
  loadState: function loadState(data) {
    //if (data.version !== stateVersion) return;
    var _this = this,
        featureCollection = data.featureCollection;

    L.geoJson(featureCollection, {
      onEachFeature: function onEachFeature(feature, layer) {
        var options = feature.properties,
            popupOpened = options.popupOpened;

        if (options.type === 'Rectangle') {
          layer = L.rectangle(layer.getBounds());
        } else if (options.type === 'Point') {
          options = options.options;
          var icon = options.icon;

          if (icon) {
            delete options.icon;

            if (icon.iconUrl) {
              options.icon = L.icon(icon);
            }
          }

          layer = L.marker(layer.getLatLng(), options);
        }

        if (layer.setStyle && options && options.lineStyle) {
          layer.setStyle(options.lineStyle);
        }

        _this.add(layer, options);

        if (popupOpened) {
          layer.openPopup();
        }
      }
    });
  },
  saveState: function saveState() {
    var featureGroup = L.featureGroup();
    var points = [];

    for (var i = 0, len = this.items.length; i < len; i++) {
      var it = this.items[i];

      if (it.options.type === 'Point') {
        var geojson = it.toGeoJSON();
        geojson.properties = L.GmxDrawing.utils.getNotDefaults(it.options, L.GmxDrawing.utils.defaultStyles.markerStyle);

        if (!it._map) {
          geojson.properties.map = false;
        } else if (it._map.hasLayer(it.getPopup())) {
          geojson.properties.popupOpened = true;
        }

        var res = L.GmxDrawing.utils.getNotDefaults(it._obj.options, L.GmxDrawing.utils.defaultStyles.markerStyle.options);

        if (Object.keys(res).length) {
          geojson.properties.options = res;
        }

        res = L.GmxDrawing.utils.getNotDefaults(it._obj.options.icon.options, L.GmxDrawing.utils.defaultStyles.markerStyle.options.icon);

        if (Object.keys(res).length) {
          if (!geojson.properties.options) {
            geojson.properties.options = {};
          }

          geojson.properties.options.icon = res;
        }

        points.push(geojson);
      } else {
        featureGroup.addLayer(it);
      }
    }

    var featureCollection = featureGroup.toGeoJSON();
    featureCollection.features = featureCollection.features.concat(points);
    return {
      version: stateVersion,
      featureCollection: featureCollection
    };
  },
  _addItem: function _addItem(item) {
    var addFlag = true;

    for (var i = 0, len = this.items.length; i < len; i++) {
      var it = this.items[i];

      if (it === item) {
        addFlag = false;
        break;
      }
    }

    if (addFlag) {
      this.items.push(item);
    }

    this.fire('add', {
      mode: item.mode,
      object: item
    });
  },
  _removeItem: function _removeItem(obj, remove) {
    for (var i = 0, len = this.items.length; i < len; i++) {
      var item = this.items[i];

      if (item === obj) {
        if (remove) {
          this.items.splice(i, 1);
          var ev = {
            type: item.options.type,
            mode: item.mode,
            object: item
          };
          this.fire('remove', ev);
          item.fire('remove', ev);
        }

        return item;
      }
    }

    return null;
  },
  clear: function clear() {
    for (var i = 0, len = this.items.length; i < len; i++) {
      var item = this.items[i];

      if (item && item._map) {
        item._map.removeLayer(item);
      }

      var ev = {
        type: item.options.type,
        mode: item.mode,
        object: item
      };
      this.fire('remove', ev);
      item.fire('remove', ev);
    }

    this.items = [];
    return this;
  },
  remove: function remove(obj) {
    var item = this._removeItem(obj, true);

    if (item && item._map) {
      item._map.removeLayer(item);
    }

    return item;
  }
});
L.Map.addInitHook(function () {
  this.gmxDrawing = new L.GmxDrawing(this);
});
L.GmxDrawing;

var arrayMethodIsStrict = function (METHOD_NAME, argument) {
  var method = [][METHOD_NAME];
  return !!method && fails(function () {
    // eslint-disable-next-line no-useless-call,no-throw-literal
    method.call(null, argument || function () { throw 1; }, 1);
  });
};

var $forEach = arrayIteration.forEach;



var STRICT_METHOD = arrayMethodIsStrict('forEach');
var USES_TO_LENGTH$2 = arrayMethodUsesToLength('forEach');

// `Array.prototype.forEach` method implementation
// https://tc39.github.io/ecma262/#sec-array.prototype.foreach
var arrayForEach = (!STRICT_METHOD || !USES_TO_LENGTH$2) ? function forEach(callbackfn /* , thisArg */) {
  return $forEach(this, callbackfn, arguments.length > 1 ? arguments[1] : undefined);
} : [].forEach;

// `Array.prototype.forEach` method
// https://tc39.github.io/ecma262/#sec-array.prototype.foreach
_export({ target: 'Array', proto: true, forced: [].forEach != arrayForEach }, {
  forEach: arrayForEach
});

// `RegExp.prototype.flags` getter implementation
// https://tc39.github.io/ecma262/#sec-get-regexp.prototype.flags
var regexpFlags = function () {
  var that = anObject(this);
  var result = '';
  if (that.global) result += 'g';
  if (that.ignoreCase) result += 'i';
  if (that.multiline) result += 'm';
  if (that.dotAll) result += 's';
  if (that.unicode) result += 'u';
  if (that.sticky) result += 'y';
  return result;
};

// babel-minify transpiles RegExp('a', 'y') -> /a/y and it causes SyntaxError,
// so we use an intermediate function.
function RE(s, f) {
  return RegExp(s, f);
}

var UNSUPPORTED_Y = fails(function () {
  // babel-minify transpiles RegExp('a', 'y') -> /a/y and it causes SyntaxError
  var re = RE('a', 'y');
  re.lastIndex = 2;
  return re.exec('abcd') != null;
});

var BROKEN_CARET = fails(function () {
  // https://bugzilla.mozilla.org/show_bug.cgi?id=773687
  var re = RE('^r', 'gy');
  re.lastIndex = 2;
  return re.exec('str') != null;
});

var regexpStickyHelpers = {
	UNSUPPORTED_Y: UNSUPPORTED_Y,
	BROKEN_CARET: BROKEN_CARET
};

var nativeExec = RegExp.prototype.exec;
// This always refers to the native implementation, because the
// String#replace polyfill uses ./fix-regexp-well-known-symbol-logic.js,
// which loads this file before patching the method.
var nativeReplace = String.prototype.replace;

var patchedExec = nativeExec;

var UPDATES_LAST_INDEX_WRONG = (function () {
  var re1 = /a/;
  var re2 = /b*/g;
  nativeExec.call(re1, 'a');
  nativeExec.call(re2, 'a');
  return re1.lastIndex !== 0 || re2.lastIndex !== 0;
})();

var UNSUPPORTED_Y$1 = regexpStickyHelpers.UNSUPPORTED_Y || regexpStickyHelpers.BROKEN_CARET;

// nonparticipating capturing group, copied from es5-shim's String#split patch.
var NPCG_INCLUDED = /()??/.exec('')[1] !== undefined;

var PATCH = UPDATES_LAST_INDEX_WRONG || NPCG_INCLUDED || UNSUPPORTED_Y$1;

if (PATCH) {
  patchedExec = function exec(str) {
    var re = this;
    var lastIndex, reCopy, match, i;
    var sticky = UNSUPPORTED_Y$1 && re.sticky;
    var flags = regexpFlags.call(re);
    var source = re.source;
    var charsAdded = 0;
    var strCopy = str;

    if (sticky) {
      flags = flags.replace('y', '');
      if (flags.indexOf('g') === -1) {
        flags += 'g';
      }

      strCopy = String(str).slice(re.lastIndex);
      // Support anchored sticky behavior.
      if (re.lastIndex > 0 && (!re.multiline || re.multiline && str[re.lastIndex - 1] !== '\n')) {
        source = '(?: ' + source + ')';
        strCopy = ' ' + strCopy;
        charsAdded++;
      }
      // ^(? + rx + ) is needed, in combination with some str slicing, to
      // simulate the 'y' flag.
      reCopy = new RegExp('^(?:' + source + ')', flags);
    }

    if (NPCG_INCLUDED) {
      reCopy = new RegExp('^' + source + '$(?!\\s)', flags);
    }
    if (UPDATES_LAST_INDEX_WRONG) lastIndex = re.lastIndex;

    match = nativeExec.call(sticky ? reCopy : re, strCopy);

    if (sticky) {
      if (match) {
        match.input = match.input.slice(charsAdded);
        match[0] = match[0].slice(charsAdded);
        match.index = re.lastIndex;
        re.lastIndex += match[0].length;
      } else re.lastIndex = 0;
    } else if (UPDATES_LAST_INDEX_WRONG && match) {
      re.lastIndex = re.global ? match.index + match[0].length : lastIndex;
    }
    if (NPCG_INCLUDED && match && match.length > 1) {
      // Fix browsers whose `exec` methods don't consistently return `undefined`
      // for NPCG, like IE8. NOTE: This doesn' work for /(.?)?/
      nativeReplace.call(match[0], reCopy, function () {
        for (i = 1; i < arguments.length - 2; i++) {
          if (arguments[i] === undefined) match[i] = undefined;
        }
      });
    }

    return match;
  };
}

var regexpExec = patchedExec;

_export({ target: 'RegExp', proto: true, forced: /./.exec !== regexpExec }, {
  exec: regexpExec
});

// TODO: Remove from `core-js@4` since it's moved to entry points







var SPECIES$2 = wellKnownSymbol('species');

var REPLACE_SUPPORTS_NAMED_GROUPS = !fails(function () {
  // #replace needs built-in support for named groups.
  // #match works fine because it just return the exec results, even if it has
  // a "grops" property.
  var re = /./;
  re.exec = function () {
    var result = [];
    result.groups = { a: '7' };
    return result;
  };
  return ''.replace(re, '$<a>') !== '7';
});

// IE <= 11 replaces $0 with the whole match, as if it was $&
// https://stackoverflow.com/questions/6024666/getting-ie-to-replace-a-regex-with-the-literal-string-0
var REPLACE_KEEPS_$0 = (function () {
  return 'a'.replace(/./, '$0') === '$0';
})();

var REPLACE = wellKnownSymbol('replace');
// Safari <= 13.0.3(?) substitutes nth capture where n>m with an empty string
var REGEXP_REPLACE_SUBSTITUTES_UNDEFINED_CAPTURE = (function () {
  if (/./[REPLACE]) {
    return /./[REPLACE]('a', '$0') === '';
  }
  return false;
})();

// Chrome 51 has a buggy "split" implementation when RegExp#exec !== nativeExec
// Weex JS has frozen built-in prototypes, so use try / catch wrapper
var SPLIT_WORKS_WITH_OVERWRITTEN_EXEC = !fails(function () {
  var re = /(?:)/;
  var originalExec = re.exec;
  re.exec = function () { return originalExec.apply(this, arguments); };
  var result = 'ab'.split(re);
  return result.length !== 2 || result[0] !== 'a' || result[1] !== 'b';
});

var fixRegexpWellKnownSymbolLogic = function (KEY, length, exec, sham) {
  var SYMBOL = wellKnownSymbol(KEY);

  var DELEGATES_TO_SYMBOL = !fails(function () {
    // String methods call symbol-named RegEp methods
    var O = {};
    O[SYMBOL] = function () { return 7; };
    return ''[KEY](O) != 7;
  });

  var DELEGATES_TO_EXEC = DELEGATES_TO_SYMBOL && !fails(function () {
    // Symbol-named RegExp methods call .exec
    var execCalled = false;
    var re = /a/;

    if (KEY === 'split') {
      // We can't use real regex here since it causes deoptimization
      // and serious performance degradation in V8
      // https://github.com/zloirock/core-js/issues/306
      re = {};
      // RegExp[@@split] doesn't call the regex's exec method, but first creates
      // a new one. We need to return the patched regex when creating the new one.
      re.constructor = {};
      re.constructor[SPECIES$2] = function () { return re; };
      re.flags = '';
      re[SYMBOL] = /./[SYMBOL];
    }

    re.exec = function () { execCalled = true; return null; };

    re[SYMBOL]('');
    return !execCalled;
  });

  if (
    !DELEGATES_TO_SYMBOL ||
    !DELEGATES_TO_EXEC ||
    (KEY === 'replace' && !(
      REPLACE_SUPPORTS_NAMED_GROUPS &&
      REPLACE_KEEPS_$0 &&
      !REGEXP_REPLACE_SUBSTITUTES_UNDEFINED_CAPTURE
    )) ||
    (KEY === 'split' && !SPLIT_WORKS_WITH_OVERWRITTEN_EXEC)
  ) {
    var nativeRegExpMethod = /./[SYMBOL];
    var methods = exec(SYMBOL, ''[KEY], function (nativeMethod, regexp, str, arg2, forceStringMethod) {
      if (regexp.exec === regexpExec) {
        if (DELEGATES_TO_SYMBOL && !forceStringMethod) {
          // The native String method already delegates to @@method (this
          // polyfilled function), leasing to infinite recursion.
          // We avoid it by directly calling the native @@method method.
          return { done: true, value: nativeRegExpMethod.call(regexp, str, arg2) };
        }
        return { done: true, value: nativeMethod.call(str, regexp, arg2) };
      }
      return { done: false };
    }, {
      REPLACE_KEEPS_$0: REPLACE_KEEPS_$0,
      REGEXP_REPLACE_SUBSTITUTES_UNDEFINED_CAPTURE: REGEXP_REPLACE_SUBSTITUTES_UNDEFINED_CAPTURE
    });
    var stringMethod = methods[0];
    var regexMethod = methods[1];

    redefine(String.prototype, KEY, stringMethod);
    redefine(RegExp.prototype, SYMBOL, length == 2
      // 21.2.5.8 RegExp.prototype[@@replace](string, replaceValue)
      // 21.2.5.11 RegExp.prototype[@@split](string, limit)
      ? function (string, arg) { return regexMethod.call(string, this, arg); }
      // 21.2.5.6 RegExp.prototype[@@match](string)
      // 21.2.5.9 RegExp.prototype[@@search](string)
      : function (string) { return regexMethod.call(string, this); }
    );
  }

  if (sham) createNonEnumerableProperty(RegExp.prototype[SYMBOL], 'sham', true);
};

var MATCH = wellKnownSymbol('match');

// `IsRegExp` abstract operation
// https://tc39.github.io/ecma262/#sec-isregexp
var isRegexp = function (it) {
  var isRegExp;
  return isObject(it) && ((isRegExp = it[MATCH]) !== undefined ? !!isRegExp : classofRaw(it) == 'RegExp');
};

var SPECIES$3 = wellKnownSymbol('species');

// `SpeciesConstructor` abstract operation
// https://tc39.github.io/ecma262/#sec-speciesconstructor
var speciesConstructor = function (O, defaultConstructor) {
  var C = anObject(O).constructor;
  var S;
  return C === undefined || (S = anObject(C)[SPECIES$3]) == undefined ? defaultConstructor : aFunction$1(S);
};

// `String.prototype.{ codePointAt, at }` methods implementation
var createMethod$2 = function (CONVERT_TO_STRING) {
  return function ($this, pos) {
    var S = String(requireObjectCoercible($this));
    var position = toInteger(pos);
    var size = S.length;
    var first, second;
    if (position < 0 || position >= size) return CONVERT_TO_STRING ? '' : undefined;
    first = S.charCodeAt(position);
    return first < 0xD800 || first > 0xDBFF || position + 1 === size
      || (second = S.charCodeAt(position + 1)) < 0xDC00 || second > 0xDFFF
        ? CONVERT_TO_STRING ? S.charAt(position) : first
        : CONVERT_TO_STRING ? S.slice(position, position + 2) : (first - 0xD800 << 10) + (second - 0xDC00) + 0x10000;
  };
};

var stringMultibyte = {
  // `String.prototype.codePointAt` method
  // https://tc39.github.io/ecma262/#sec-string.prototype.codepointat
  codeAt: createMethod$2(false),
  // `String.prototype.at` method
  // https://github.com/mathiasbynens/String.prototype.at
  charAt: createMethod$2(true)
};

var charAt = stringMultibyte.charAt;

// `AdvanceStringIndex` abstract operation
// https://tc39.github.io/ecma262/#sec-advancestringindex
var advanceStringIndex = function (S, index, unicode) {
  return index + (unicode ? charAt(S, index).length : 1);
};

// `RegExpExec` abstract operation
// https://tc39.github.io/ecma262/#sec-regexpexec
var regexpExecAbstract = function (R, S) {
  var exec = R.exec;
  if (typeof exec === 'function') {
    var result = exec.call(R, S);
    if (typeof result !== 'object') {
      throw TypeError('RegExp exec method returned something other than an Object or null');
    }
    return result;
  }

  if (classofRaw(R) !== 'RegExp') {
    throw TypeError('RegExp#exec called on incompatible receiver');
  }

  return regexpExec.call(R, S);
};

var arrayPush = [].push;
var min$3 = Math.min;
var MAX_UINT32 = 0xFFFFFFFF;

// babel-minify transpiles RegExp('x', 'y') -> /x/y and it causes SyntaxError
var SUPPORTS_Y = !fails(function () { return !RegExp(MAX_UINT32, 'y'); });

// @@split logic
fixRegexpWellKnownSymbolLogic('split', 2, function (SPLIT, nativeSplit, maybeCallNative) {
  var internalSplit;
  if (
    'abbc'.split(/(b)*/)[1] == 'c' ||
    'test'.split(/(?:)/, -1).length != 4 ||
    'ab'.split(/(?:ab)*/).length != 2 ||
    '.'.split(/(.?)(.?)/).length != 4 ||
    '.'.split(/()()/).length > 1 ||
    ''.split(/.?/).length
  ) {
    // based on es5-shim implementation, need to rework it
    internalSplit = function (separator, limit) {
      var string = String(requireObjectCoercible(this));
      var lim = limit === undefined ? MAX_UINT32 : limit >>> 0;
      if (lim === 0) return [];
      if (separator === undefined) return [string];
      // If `separator` is not a regex, use native split
      if (!isRegexp(separator)) {
        return nativeSplit.call(string, separator, lim);
      }
      var output = [];
      var flags = (separator.ignoreCase ? 'i' : '') +
                  (separator.multiline ? 'm' : '') +
                  (separator.unicode ? 'u' : '') +
                  (separator.sticky ? 'y' : '');
      var lastLastIndex = 0;
      // Make `global` and avoid `lastIndex` issues by working with a copy
      var separatorCopy = new RegExp(separator.source, flags + 'g');
      var match, lastIndex, lastLength;
      while (match = regexpExec.call(separatorCopy, string)) {
        lastIndex = separatorCopy.lastIndex;
        if (lastIndex > lastLastIndex) {
          output.push(string.slice(lastLastIndex, match.index));
          if (match.length > 1 && match.index < string.length) arrayPush.apply(output, match.slice(1));
          lastLength = match[0].length;
          lastLastIndex = lastIndex;
          if (output.length >= lim) break;
        }
        if (separatorCopy.lastIndex === match.index) separatorCopy.lastIndex++; // Avoid an infinite loop
      }
      if (lastLastIndex === string.length) {
        if (lastLength || !separatorCopy.test('')) output.push('');
      } else output.push(string.slice(lastLastIndex));
      return output.length > lim ? output.slice(0, lim) : output;
    };
  // Chakra, V8
  } else if ('0'.split(undefined, 0).length) {
    internalSplit = function (separator, limit) {
      return separator === undefined && limit === 0 ? [] : nativeSplit.call(this, separator, limit);
    };
  } else internalSplit = nativeSplit;

  return [
    // `String.prototype.split` method
    // https://tc39.github.io/ecma262/#sec-string.prototype.split
    function split(separator, limit) {
      var O = requireObjectCoercible(this);
      var splitter = separator == undefined ? undefined : separator[SPLIT];
      return splitter !== undefined
        ? splitter.call(separator, O, limit)
        : internalSplit.call(String(O), separator, limit);
    },
    // `RegExp.prototype[@@split]` method
    // https://tc39.github.io/ecma262/#sec-regexp.prototype-@@split
    //
    // NOTE: This cannot be properly polyfilled in engines that don't support
    // the 'y' flag.
    function (regexp, limit) {
      var res = maybeCallNative(internalSplit, regexp, this, limit, internalSplit !== nativeSplit);
      if (res.done) return res.value;

      var rx = anObject(regexp);
      var S = String(this);
      var C = speciesConstructor(rx, RegExp);

      var unicodeMatching = rx.unicode;
      var flags = (rx.ignoreCase ? 'i' : '') +
                  (rx.multiline ? 'm' : '') +
                  (rx.unicode ? 'u' : '') +
                  (SUPPORTS_Y ? 'y' : 'g');

      // ^(? + rx + ) is needed, in combination with some S slicing, to
      // simulate the 'y' flag.
      var splitter = new C(SUPPORTS_Y ? rx : '^(?:' + rx.source + ')', flags);
      var lim = limit === undefined ? MAX_UINT32 : limit >>> 0;
      if (lim === 0) return [];
      if (S.length === 0) return regexpExecAbstract(splitter, S) === null ? [S] : [];
      var p = 0;
      var q = 0;
      var A = [];
      while (q < S.length) {
        splitter.lastIndex = SUPPORTS_Y ? q : 0;
        var z = regexpExecAbstract(splitter, SUPPORTS_Y ? S : S.slice(q));
        var e;
        if (
          z === null ||
          (e = min$3(toLength(splitter.lastIndex + (SUPPORTS_Y ? 0 : q)), S.length)) === p
        ) {
          q = advanceStringIndex(S, q, unicodeMatching);
        } else {
          A.push(S.slice(p, q));
          if (A.length === lim) return A;
          for (var i = 1; i <= z.length - 1; i++) {
            A.push(z[i]);
            if (A.length === lim) return A;
          }
          q = p = e;
        }
      }
      A.push(S.slice(p));
      return A;
    }
  ];
}, !SUPPORTS_Y);

// iterable DOM collections
// flag - `iterable` interface - 'entries', 'keys', 'values', 'forEach' methods
var domIterables = {
  CSSRuleList: 0,
  CSSStyleDeclaration: 0,
  CSSValueList: 0,
  ClientRectList: 0,
  DOMRectList: 0,
  DOMStringList: 0,
  DOMTokenList: 1,
  DataTransferItemList: 0,
  FileList: 0,
  HTMLAllCollection: 0,
  HTMLCollection: 0,
  HTMLFormElement: 0,
  HTMLSelectElement: 0,
  MediaList: 0,
  MimeTypeArray: 0,
  NamedNodeMap: 0,
  NodeList: 1,
  PaintRequestList: 0,
  Plugin: 0,
  PluginArray: 0,
  SVGLengthList: 0,
  SVGNumberList: 0,
  SVGPathSegList: 0,
  SVGPointList: 0,
  SVGStringList: 0,
  SVGTransformList: 0,
  SourceBufferList: 0,
  StyleSheetList: 0,
  TextTrackCueList: 0,
  TextTrackList: 0,
  TouchList: 0
};

for (var COLLECTION_NAME in domIterables) {
  var Collection = global_1[COLLECTION_NAME];
  var CollectionPrototype = Collection && Collection.prototype;
  // some Chrome versions have non-configurable methods on DOMTokenList
  if (CollectionPrototype && CollectionPrototype.forEach !== arrayForEach) try {
    createNonEnumerableProperty(CollectionPrototype, 'forEach', arrayForEach);
  } catch (error) {
    CollectionPrototype.forEach = arrayForEach;
  }
}

L.GmxDrawing.Feature = L.LayerGroup.extend({
  options: {
    endTooltip: '',
    smoothFactor: 0,
    mode: '' // add, edit

  },
  includes: L.Evented ? L.Evented.prototype : L.Mixin.Events,
  simplify: function simplify() {
    var i, j, len, len1, hole;

    for (i = 0, len = this.rings.length; i < len; i++) {
      var it = this.rings[i],
          ring = it.ring;
      ring.setLatLngs(ring.points.getPathLatLngs());

      for (j = 0, len1 = it.holes.length; j < len1; j++) {
        hole = it.holes[j];
        hole.setLatLngs(hole.points.getPathLatLngs());
      }
    }

    return this;
  },
  bringToFront: function bringToFront() {
    this.rings.forEach(function (it) {
      it.ring.bringToFront();
    });
    return this; // return this.invoke('bringToFront');
  },
  bringToBack: function bringToBack() {
    this.rings.forEach(function (it) {
      it.ring.bringToBack();
    });
    return this; // return this.invoke('bringToBack');
  },
  onAdd: function onAdd(map) {
    L.LayerGroup.prototype.onAdd.call(this, map);

    this._parent._addItem(this);

    if (this.options.type === 'Point') {
      map.addLayer(this._obj);
      requestIdleCallback(function () {
        this._fireEvent('drawstop', this._obj.options);
      }.bind(this), {
        timeout: 0
      });
    } else {
      var svgContainer = this._map._pathRoot || this._map._renderer && this._map._renderer._container;

      if (svgContainer && svgContainer.getAttribute('pointer-events') !== 'visible') {
        svgContainer.setAttribute('pointer-events', 'visible');
      }
    }

    this._fireEvent('addtomap');
  },
  onRemove: function onRemove(map) {
    if ('hideTooltip' in this) {
      this.hideTooltip();
    }

    this._removeStaticTooltip();

    L.LayerGroup.prototype.onRemove.call(this, map);

    if (this.options.type === 'Point') {
      map.removeLayer(this._obj);
    }

    this._fireEvent('removefrommap');
  },
  remove: function remove(ring) {
    if (ring) {
      var i, j, len, len1, hole;

      for (i = 0, len = this.rings.length; i < len; i++) {
        if (ring.options.hole) {
          for (j = 0, len1 = this.rings[i].holes.length; j < len1; j++) {
            hole = this.rings[i].holes[j];

            if (ring === hole) {
              this.rings[i].holes.splice(j, 1);

              if (hole._map) {
                hole._map.removeLayer(hole);
              }

              break;
            }
          }

          if (!ring._map) {
            break;
          }
        } else if (ring === this.rings[i].ring) {
          for (j = 0, len1 = this.rings[i].holes.length; j < len1; j++) {
            hole = this.rings[i].holes[j];

            if (hole._map) {
              hole._map.removeLayer(hole);
            }
          }

          this.rings.splice(i, 1);

          if (ring._map) {
            ring._map.removeLayer(ring);
          }

          break;
        }
      }
    } else {
      this.rings = [];
    }

    if (this.rings.length < 1) {
      if (this._originalStyle) {
        this._obj.setStyle(this._originalStyle);
      }

      this._parent.remove(this);
    }

    return this;
  },
  _fireEvent: function _fireEvent(name, options) {
    //console.log('_fireEvent', name);
    if (name === 'removefrommap' && this.rings.length > 1) {
      return;
    }

    var event = L.extend({}, {
      mode: this.mode || '',
      object: this
    }, options);
    this.fire(name, event);

    this._parent.fire(name, event);

    if (name === 'drawstop' && this._map) {
      L.DomUtil.removeClass(this._map._mapPane, 'leaflet-clickable');
    }
  },
  getStyle: function getStyle() {
    var resultStyles = L.extend({}, this._drawOptions);
    delete resultStyles.holeStyle;

    if (resultStyles.type === 'Point') {
      L.extend(resultStyles, resultStyles.markerStyle.iconStyle);
      delete resultStyles.markerStyle;
    }

    return resultStyles;
  },
  setOptions: function setOptions(options) {
    if (options.lineStyle) {
      this._setStyleOptions(options.lineStyle, 'lines');
    }

    if (options.pointStyle) {
      this._setStyleOptions(options.pointStyle, 'points');
    }

    if ('editable' in options) {
      if (options.editable) {
        this.enableEdit();
      } else {
        this.disableEdit();
      }
    }

    L.setOptions(this, options);

    this._fireEvent('optionschange');

    return this;
  },
  _setStyleOptions: function _setStyleOptions(options, type) {
    for (var i = 0, len = this.rings.length; i < len; i++) {
      var it = this.rings[i].ring[type];
      it.setStyle(options);
      it.redraw();

      for (var j = 0, len1 = this.rings[i].holes.length; j < len1; j++) {
        it = this.rings[i].holes[j][type];
        it.setStyle(options);
        it.redraw();
      }
    }

    this._fireEvent('stylechange');
  },
  _setLinesStyle: function _setLinesStyle(options) {
    this._setStyleOptions(options, 'lines');
  },
  _setPointsStyle: function _setPointsStyle(options) {
    this._setStyleOptions(options, 'points');
  },
  getOptions: function getOptions() {
    var options = this.options,
        data = L.extend({}, options);
    data.lineStyle = options.lineStyle;
    data.pointStyle = options.pointStyle;
    var res = L.GmxDrawing.utils.getNotDefaults(data, L.GmxDrawing.utils.defaultStyles);

    if (!Object.keys(res.lineStyle).length) {
      delete res.lineStyle;
    }

    if (!Object.keys(res.pointStyle).length) {
      delete res.pointStyle;
    }

    if (!this._map) {
      res.map = false;
    }

    if (options.type === 'Point') {
      var opt = L.GmxDrawing.utils.getNotDefaults(this._obj.options, L.GmxDrawing.utils.defaultStyles.markerStyle.options);

      if (Object.keys(opt).length) {
        res.options = opt;
      }

      opt = L.GmxDrawing.utils.getNotDefaults(this._obj.options.icon.options, L.GmxDrawing.utils.defaultStyles.markerStyle.options.icon);

      if (Object.keys(opt).length) {
        res.options.icon = opt;
      }
    }

    return res;
  },
  _latLngsToCoords: function _latLngsToCoords(latlngs, closed) {
    var coords = L.GeoJSON.latLngsToCoords(L.GmxDrawing.utils.isOldVersion ? latlngs : latlngs[0]);

    if (closed) {
      var lastCoord = coords[coords.length - 1];

      if (lastCoord[0] !== coords[0][0] || lastCoord[1] !== coords[0][1]) {
        coords.push(coords[0]);
      }
    }

    return coords;
  },
  _latlngsAddShift: function _latlngsAddShift(latlngs, shiftPixel) {
    var arr = [];

    for (var i = 0, len = latlngs.length; i < len; i++) {
      arr.push(L.GmxDrawing.utils.getShiftLatlng(latlngs[i], this._map, shiftPixel));
    }

    return arr;
  },
  getPixelOffset: function getPixelOffset() {
    var p = this.shiftPixel;

    if (!p && this._map) {
      var mInPixel = 256 / L.gmxUtil.tileSizes[this._map._zoom];
      p = this.shiftPixel = new L.Point(Math.floor(mInPixel * this._dx), -Math.floor(mInPixel * this._dy));
    }

    return p || new L.Point(0, 0);
  },
  setOffsetToGeometry: function setOffsetToGeometry(dx, dy) {
    var i,
        len,
        j,
        len1,
        ring,
        latlngs,
        mInPixel = 256 / L.gmxUtil.tileSizes[this._map._zoom],
        shiftPixel = new L.Point(mInPixel * (this._dx || dx || 0), -mInPixel * (this._dy || dy || 0));

    for (i = 0, len = this.rings.length; i < len; i++) {
      var it = this.rings[i];
      ring = it.ring;
      latlngs = ring.points.getLatLngs();
      ring.setLatLngs(this._latlngsAddShift(latlngs, shiftPixel));

      if (it.holes && it.holes.length) {
        for (j = 0, len1 = it.holes.length; j < len1; j++) {
          ring = it.holes[j].ring;
          latlngs = ring.points.getLatLngs();
          ring.setLatLngs(this._latlngsAddShift(latlngs, shiftPixel));
        }
      }
    }

    this.setPositionOffset();
    return this;
  },
  setPositionOffset: function setPositionOffset(mercX, mercY) {
    this._dx = mercX || 0;
    this._dy = mercY || 0;

    if (this._map) {
      this.shiftPixel = null;
      var p = this.getPixelOffset();

      for (var i = 0, len = this.rings.length; i < len; i++) {
        this.rings[i].ring.setPositionOffset(p);

        for (var j = 0, len1 = this.rings[i].holes.length; j < len1; j++) {
          this.rings[i].holes[j].setPositionOffset(p);
        }
      }
    }
  },
  _getCoords: function _getCoords(withoutShift) {
    var type = this.options.type,
        closed = type === 'Polygon' || type === 'Rectangle' || type === 'MultiPolygon',
        shiftPixel = withoutShift ? null : this.shiftPixel,
        coords = [];

    for (var i = 0, len = this.rings.length; i < len; i++) {
      var it = this.rings[i],
          arr = this._latLngsToCoords(it.ring.points.getLatLngs(), closed, shiftPixel);

      if (closed) {
        arr = [arr];
      }

      if (it.holes && it.holes.length) {
        for (var j = 0, len1 = it.holes.length; j < len1; j++) {
          arr.push(this._latLngsToCoords(it.holes[j].points.getLatLngs(), closed, shiftPixel));
        }
      }

      coords.push(arr);
    }

    if (type === 'Polyline' || closed && type !== 'MultiPolygon') {
      coords = coords[0];
    }

    return coords;
  },
  _geoJsonToLayer: function _geoJsonToLayer(geoJson) {
    return L.geoJson(geoJson).getLayers()[0];
  },
  setGeoJSON: function setGeoJSON(geoJson) {
    this._initialize(this._parent, geoJson);

    return this;
  },
  toGeoJSON: function toGeoJSON() {
    return this._toGeoJSON(true);
  },
  _toGeoJSON: function _toGeoJSON(withoutShift) {
    var type = this.options.type,
        properties = this.getOptions(),
        coords;
    delete properties.mode;

    if (!this.options.editable || type === 'Point') {
      var obj = this._obj;

      if (obj instanceof L.GeoJSON) {
        obj = L.GmxDrawing.utils._getLastObject(obj).getLayers()[0];
      }

      var geojson = obj.toGeoJSON();
      geojson.properties = properties;
      return geojson;
    } else if (this.rings) {
      coords = this._getCoords(withoutShift);

      if (type === 'Rectangle') {
        type = 'Polygon';
      } else if (type === 'Polyline') {
        type = 'LineString';
      } else if (type === 'MultiPolyline') {
        type = 'MultiLineString';
      }
    }

    return L.GeoJSON.getFeature({
      feature: {
        type: 'Feature',
        properties: properties
      }
    }, {
      type: type,
      coordinates: coords
    });
  },
  getType: function getType() {
    return this.options.type;
  },
  hideFill: function hideFill() {
    if (this._fill._map) {
      this._map.removeLayer(this._fill);
    }
  },
  showFill: function showFill() {
    var geoJSON = this.toGeoJSON(),
        obj = L.GeoJSON.geometryToLayer(geoJSON, null, null, {
      weight: 0
    });

    this._fill.clearLayers();

    if (obj instanceof L.LayerGroup) {
      obj.eachLayer(function (layer) {
        this._fill.addLayer(layer);
      }, this);
    } else {
      obj.setStyle({
        smoothFactor: 0,
        weight: 0,
        fill: true,
        fillColor: '#0033ff'
      });

      this._fill.addLayer(obj);
    }

    if (!this._fill._map) {
      this._map.addLayer(this._fill);

      this._fill.bringToBack();
    }

    return this;
  },
  getBounds: function getBounds() {
    var bounds = new L.LatLngBounds();

    if (this.options.type === 'Point') {
      var latLng = this._obj.getLatLng();

      bounds.extend(latLng);
    } else {
      bounds = this._getBounds();
    }

    return bounds;
  },
  _getBounds: function _getBounds(item) {
    var layer = item || this,
        bounds = new L.LatLngBounds(),
        latLng;

    if (layer instanceof L.LayerGroup) {
      layer.eachLayer(function (it) {
        latLng = this._getBounds(it);
        bounds.extend(latLng);
      }, this);
      return bounds;
    } else if (layer instanceof L.Marker) {
      latLng = layer.getLatLng();
    } else {
      latLng = layer.getBounds();
    }

    bounds.extend(latLng);
    return bounds;
  },
  initialize: function initialize(parent, obj, options) {
    options = options || {};
    this.contextmenu = new L.GmxDrawingContextMenu();
    options.mode = '';
    this._drawOptions = L.extend({}, options);
    var type = options.type;

    if (type === 'Point') {
      delete options.pointStyle;
      delete options.lineStyle;
    } else {
      delete options.iconUrl;
      delete options.iconAnchor;
      delete options.iconSize;
      delete options.popupAnchor;
      delete options.shadowSize;
      delete options.markerStyle;
    }

    delete options.holeStyle;
    L.setOptions(this, options);
    this._layers = {};
    this._obj = obj;
    this._parent = parent;
    this._dx = 0;
    this._dy = 0;

    this._initialize(parent, obj);
  },
  enableEdit: function enableEdit() {
    this.options.mode = 'edit';
    var type = this.options.type;

    if (type !== 'Point') {
      // for (var i = 0, len = this.rings.length; i < len; i++) {
      // var it = this.rings[i];
      // it.ring.options.editable = this.options.editable;
      // it.ring.setEditMode();
      // for (var j = 0, len1 = it.holes.length; j < len1; j++) {
      // var hole = it.holes[j];
      // hole.options.editable = this.options.editable;
      // hole.setEditMode();
      // }
      // }
      var geojson = L.geoJson(this.toGeoJSON()),
          items = geojson.getLayers();
      this.options.editable = true;

      if (items.length) {
        this._initialize(this._parent, items[0]);
      }
    }

    return this;
  },
  disableEdit: function disableEdit() {
    var type = this.options.type;

    if (type !== 'Point') {
      this._originalStyle = this.options.lineStyle;
      var geojson = L.geoJson(this.toGeoJSON().geometry, this._originalStyle).getLayers()[0];

      for (var i = 0, len = this.rings.length; i < len; i++) {
        var it = this.rings[i];
        it.ring.removeEditMode();
        it.ring.options.editable = false;

        for (var j = 0, len1 = it.holes.length; j < len1; j++) {
          var hole = it.holes[j];
          hole.removeEditMode();
          hole.options.editable = false;
        }
      }

      this._obj = geojson;
      this.options.editable = false;

      this._initialize(this._parent, this._obj);
    }

    return this;
  },
  getArea: function getArea() {
    var out = 0;

    if (L.gmxUtil.geoJSONGetArea) {
      out = L.gmxUtil.geoJSONGetArea(this.toGeoJSON());
    }

    return out;
  },
  getLength: function getLength() {
    var out = 0;

    if (L.gmxUtil.geoJSONGetLength) {
      out = L.gmxUtil.geoJSONGetLength(this.toGeoJSON());
    }

    return out;
  },
  getLatLng: function getLatLng() {
    return this.lastAddLatLng;
  },
  _getTooltipAnchor: function _getTooltipAnchor() {
    return this.lastAddLatLng;
  },
  getSummary: function getSummary() {
    var str = '',
        mapOpt = this._map ? this._map.options : {},
        type = this.options.type;

    if (type === 'Polyline' || type === 'MultiPolyline') {
      str = L.gmxUtil.prettifyDistance(this.getLength(), mapOpt.distanceUnit);
    } else if (type === 'Polygon' || type === 'MultiPolygon' || type === 'Rectangle') {
      str = L.gmxUtil.prettifyArea(this.getArea(), mapOpt.squareUnit);
    } else if (type === 'Point') {
      var latLng = this._obj.getLatLng();

      str = L.gmxUtil.formatCoordinates(latLng);
    }

    return str;
  },
  _initialize: function _initialize(parent, obj) {
    var _this2 = this;

    this.clearLayers();
    this.rings = [];
    this.mode = '';
    this.lastAddLatLng = L.latLng(0, 0); // последняя из добавленных точек

    this._fill = L.featureGroup();

    if (this._fill.options) {
      this._fill.options.smoothFactor = 0;
    }

    if (this.options.editable) {
      var arr = [];

      if (L.GmxDrawing.utils.isOldVersion) {
        arr = obj.getLayers ? L.GmxDrawing.utils._getLastObject(obj).getLayers() : [obj];
      } else {
        arr = obj.getLayers ? L.GmxDrawing.utils._getLastObject(obj) : [obj];

        if (obj.type && obj.coordinates) {
          var type = obj.type;
          obj = this._geoJsonToLayer(obj);

          if (type === 'Polygon') {
            var it1 = obj.getLatLngs();
            arr = [{
              _latlngs: it1.shift(),
              _holes: it1
            }];
          } else if (type === 'MultiPolygon') {
            arr = obj.getLatLngs().map(function (it) {
              return {
                _latlngs: it.shift(),
                _holes: it
              };
            });
          } else if (type === 'LineString') {
            arr = [{
              _latlngs: obj.getLatLngs()
            }];
          } else if (type === 'MultiLineString') {
            arr = obj.getLatLngs().map(function (it) {
              return {
                _latlngs: it
              };
            });
          } else if (type === 'Point') {
            this._obj = new L.Marker(obj.getLatLng(), {
              draggable: true
            });

            this._setMarker(this._obj);

            return;
          } else if (type === 'MultiPoint') {
            obj.getLayers().forEach(function (it) {
              this._setMarker(new L.Marker(it.getLatLng(), {
                draggable: true
              }));
            }.bind(this));
            return;
          }
        } else if (this.options.type === 'MultiPolygon') {
          arr = (obj.getLayers ? obj.getLayers()[0] : obj).getLatLngs().map(function (it) {
            return {
              _latlngs: it.shift(),
              _holes: it
            };
          });
        } else if (this.options.type === 'Polygon') {
          var _latlngs = (obj.getLayers ? obj.getLayers()[0] : obj).getLatLngs();

          arr = [{
            _latlngs: _latlngs.shift(),
            _holes: _latlngs
          }];
        }
      }

      for (var i = 0, len = arr.length; i < len; i++) {
        var it = arr[i],
            holes = [],
            ring = new L.GmxDrawing.Ring(this, it._latlngs, {
          ring: true,
          editable: this.options.editable
        });
        ring.on('click', function (e) {
          _this2.fire('click', e);
        });
        this.addLayer(ring);

        if (it._holes) {
          for (var j = 0, len1 = it._holes.length; j < len1; j++) {
            var hole = new L.GmxDrawing.Ring(this, it._holes[j], {
              hole: true,
              editable: this.options.editable
            });
            this.addLayer(hole);
            holes.push(hole);
          }
        }

        this.rings.push({
          ring: ring,
          holes: holes
        });
      }

      if (this.options.endTooltip && L.tooltip) {
        this._initStaticTooltip();
      }

      if (L.gmxUtil && L.gmxUtil.prettifyDistance && !this._showTooltip) {
        var _gtxt = L.GmxDrawing.utils.getLocale;
        var my = this;

        this._showTooltip = function (type, ev) {
          var ring = ev.ring,
              originalEvent = ev.originalEvent,
              down = type !== 'angle' && (originalEvent.buttons || originalEvent.button);

          if (ring && (ring.downObject || !down)) {
            var mapOpt = my._map ? my._map.options : {},
                distanceUnit = mapOpt.distanceUnit,
                squareUnit = mapOpt.squareUnit,
                azimutUnit = mapOpt.azimutUnit || false,
                str = '';

            if (type === 'Area' && ring.mode === 'add') {
              type = 'Length';
            }

            if (type === 'Area') {
              if (!L.gmxUtil.getArea) {
                return;
              }

              if (originalEvent && originalEvent.ctrlKey) {
                str = _gtxt('Perimeter') + ': ' + L.gmxUtil.prettifyDistance(my.getLength(), distanceUnit);
              } else {
                str = _gtxt(type) + ': ' + L.gmxUtil.prettifyArea(my.getArea(), squareUnit);
              }

              my._parent.showTooltip(ev.layerPoint, str);
            } else if (type === 'Length') {
              var downAttr = L.GmxDrawing.utils.getDownType.call(my, ev, my._map, my),
                  angleLeg = azimutUnit ? ring.getAngleLength(downAttr) : null;

              if (angleLeg && angleLeg.length && (my.options.type === 'Polyline' || ring.mode === 'add')) {
                str = _gtxt('angleLength') + ': ' + angleLeg.angle + '(' + L.gmxUtil.prettifyDistance(angleLeg.length, distanceUnit) + ')';
              } else {
                var length = ring.getLength(downAttr),
                    titleName = (downAttr.mode === 'edit' || downAttr.num > 1 ? downAttr.type : '') + type,
                    title = _gtxt(titleName);

                str = (title === titleName ? _gtxt(type) : title) + ': ' + L.gmxUtil.prettifyDistance(length, distanceUnit);
              }

              my._parent.showTooltip(ev.layerPoint, str);
            } else if (type === 'angle') {
              str = _gtxt('Angle') + ': ' + Math.floor(180.0 * ring._angle / Math.PI) + '°';

              my._parent.showTooltip(ev.layerPoint, str);
            }

            my._fireEvent('onMouseOver');
          }
        };

        this.hideTooltip = function () {
          this._parent.hideTooltip();

          this._fireEvent('onMouseOut');
        };

        this.getTitle = _gtxt;
      }
    } else if (this.options.type === 'Point') {
      this._setMarker(obj);
    } else {
      this.addLayer(obj);
    }
  },
  _initStaticTooltip: function _initStaticTooltip() {
    this.on('drawstop editstop', function (ev) {
      if (this.staticTooltip) {
        this._removeStaticTooltip();
      }

      var latlng = ev.latlng,
          map = this._map,
          mapOpt = map ? map.options : {},
          distanceUnit = mapOpt.distanceUnit,
          squareUnit = mapOpt.squareUnit,
          tCont = L.DomUtil.create('div', 'content'),
          info = L.DomUtil.create('div', 'infoTooltip', tCont),
          closeBtn = L.DomUtil.create('div', 'closeBtn', tCont),
          polygon = this.options.type === 'Polygon',
          tOptions = {
        interactive: true,
        sticky: true,
        permanent: true,
        className: 'staticTooltip'
      };

      if (polygon) {
        if (this.options.endTooltip === 'center') {
          tOptions.direction = 'center';
          latlng = this.getBounds().getCenter();
        }

        info.innerHTML = L.gmxUtil.prettifyArea(this.getArea(), squareUnit);
      } else {
        tOptions.offset = L.point(10, 0);
        var arr = this.rings[0].ring.points.getLatLngs()[0];
        latlng = arr[arr.length - 1];
        info.innerHTML = L.gmxUtil.prettifyDistance(this.getLength(), distanceUnit);
      }

      closeBtn.innerHTML = '×';
      L.DomEvent.on(closeBtn, 'click', function () {
        this._removeStaticTooltip();

        this.remove();
      }, this);
      this.staticTooltip = L.tooltip(tOptions).setLatLng(latlng).setContent(tCont).addTo(this._map);
      requestIdleCallback(function () {
        this.on('edit', this._removeStaticTooltip, this);
      }.bind(this), {
        timeout: 0
      });
    }, this);
  },
  _removeStaticTooltip: function _removeStaticTooltip() {
    if (this.staticTooltip) {
      this._map.removeLayer(this.staticTooltip);

      this.staticTooltip = null;
    }
  },
  _enableDrag: function _enableDrag() {
    this._parent._enableDrag();
  },
  _disableDrag: function _disableDrag() {
    this._parent._disableDrag();
  },
  _setMarker: function _setMarker(marker) {
    var _this = this,
        _parent = this._parent,
        _map = _parent._map,
        mapOpt = _map ? _map.options : {};

    marker.bindPopup(null, {
      maxWidth: 1000,
      closeOnClick: mapOpt.maxPopupCount > 1 ? false : true
    }).on('dblclick', function () {
      if (_map) {
        _map.removeLayer(this);
      }

      _this.remove(); //_parent.remove(this);

    }).on('dragstart', function () {
      _this._fireEvent('dragstart');
    }).on('drag', function (ev) {
      if (ev.originalEvent && ev.originalEvent.ctrlKey) {
        marker.setLatLng(L.GmxDrawing.utils.snapPoint(marker.getLatLng(), marker, _map));
      }

      _this._fireEvent('drag');

      _this._fireEvent('edit');
    }).on('dragend', function () {
      _this._fireEvent('dragend');
    }).on('popupopen', function (ev) {
      var popup = ev.popup;

      if (!popup._input) {
        popup._input = L.DomUtil.create('textarea', 'leaflet-gmx-popup-textarea', popup._contentNode); // popup._input.placeholder = _this.options.title || marker.options.title || '';

        popup._input.value = _this.options.title || marker.options.title || '';
        popup._contentNode.style.width = 'auto';
      }

      L.DomEvent.on(popup._input, 'keyup', function () {
        var rows = this.value.split('\n'),
            cols = this.cols || 0;
        rows.forEach(function (str) {
          if (str.length > cols) {
            cols = str.length;
          }
        });
        this.rows = rows.length;

        if (cols) {
          this.cols = cols;
        }

        popup.update();
        _this.options.title = marker.options.title = this.value;
        this.focus();
      }, popup._input);
      popup.update();
    });

    _map.addLayer(marker);

    _this.openPopup = marker.openPopup = function () {
      if (marker._popup && marker._map && !marker._map.hasLayer(marker._popup)) {
        marker._popup.setLatLng(marker._latlng);

        var gmxDrawing = marker._map.gmxDrawing;

        if (gmxDrawing._drawMode) {
          marker._map.fire(gmxDrawing._createType ? 'click' : 'mouseup', {
            latlng: marker._latlng,
            delta: 1
          });
        } else {
          marker._popup.addTo(marker._map);

          marker._popup._isOpen = true;
        }
      }

      return marker;
    };
  },
  setAddMode: function setAddMode() {
    if (this.rings.length) {
      this.rings[0].ring.setAddMode();
    }

    return this;
  },
  _pointDown: function _pointDown(ev) {
    if (this.rings.length) {
      this.rings[0].ring._pointDown(ev);
    }
  },
  getPopup: function getPopup() {
    if (this.options.type === 'Point') {
      return this._obj.getPopup();
    }
  }
});
L.GmxDrawing.Feature;

// `Array.prototype.fill` method implementation
// https://tc39.github.io/ecma262/#sec-array.prototype.fill
var arrayFill = function fill(value /* , start = 0, end = @length */) {
  var O = toObject(this);
  var length = toLength(O.length);
  var argumentsLength = arguments.length;
  var index = toAbsoluteIndex(argumentsLength > 1 ? arguments[1] : undefined, length);
  var end = argumentsLength > 2 ? arguments[2] : undefined;
  var endPos = end === undefined ? length : toAbsoluteIndex(end, length);
  while (endPos > index) O[index++] = value;
  return O;
};

// `Object.defineProperties` method
// https://tc39.github.io/ecma262/#sec-object.defineproperties
var objectDefineProperties = descriptors ? Object.defineProperties : function defineProperties(O, Properties) {
  anObject(O);
  var keys = objectKeys(Properties);
  var length = keys.length;
  var index = 0;
  var key;
  while (length > index) objectDefineProperty.f(O, key = keys[index++], Properties[key]);
  return O;
};

var html = getBuiltIn('document', 'documentElement');

var GT = '>';
var LT = '<';
var PROTOTYPE = 'prototype';
var SCRIPT = 'script';
var IE_PROTO = sharedKey('IE_PROTO');

var EmptyConstructor = function () { /* empty */ };

var scriptTag = function (content) {
  return LT + SCRIPT + GT + content + LT + '/' + SCRIPT + GT;
};

// Create object with fake `null` prototype: use ActiveX Object with cleared prototype
var NullProtoObjectViaActiveX = function (activeXDocument) {
  activeXDocument.write(scriptTag(''));
  activeXDocument.close();
  var temp = activeXDocument.parentWindow.Object;
  activeXDocument = null; // avoid memory leak
  return temp;
};

// Create object with fake `null` prototype: use iframe Object with cleared prototype
var NullProtoObjectViaIFrame = function () {
  // Thrash, waste and sodomy: IE GC bug
  var iframe = documentCreateElement('iframe');
  var JS = 'java' + SCRIPT + ':';
  var iframeDocument;
  iframe.style.display = 'none';
  html.appendChild(iframe);
  // https://github.com/zloirock/core-js/issues/475
  iframe.src = String(JS);
  iframeDocument = iframe.contentWindow.document;
  iframeDocument.open();
  iframeDocument.write(scriptTag('document.F=Object'));
  iframeDocument.close();
  return iframeDocument.F;
};

// Check for document.domain and active x support
// No need to use active x approach when document.domain is not set
// see https://github.com/es-shims/es5-shim/issues/150
// variation of https://github.com/kitcambridge/es5-shim/commit/4f738ac066346
// avoid IE GC bug
var activeXDocument;
var NullProtoObject = function () {
  try {
    /* global ActiveXObject */
    activeXDocument = document.domain && new ActiveXObject('htmlfile');
  } catch (error) { /* ignore */ }
  NullProtoObject = activeXDocument ? NullProtoObjectViaActiveX(activeXDocument) : NullProtoObjectViaIFrame();
  var length = enumBugKeys.length;
  while (length--) delete NullProtoObject[PROTOTYPE][enumBugKeys[length]];
  return NullProtoObject();
};

hiddenKeys[IE_PROTO] = true;

// `Object.create` method
// https://tc39.github.io/ecma262/#sec-object.create
var objectCreate = Object.create || function create(O, Properties) {
  var result;
  if (O !== null) {
    EmptyConstructor[PROTOTYPE] = anObject(O);
    result = new EmptyConstructor();
    EmptyConstructor[PROTOTYPE] = null;
    // add "__proto__" for Object.getPrototypeOf polyfill
    result[IE_PROTO] = O;
  } else result = NullProtoObject();
  return Properties === undefined ? result : objectDefineProperties(result, Properties);
};

var UNSCOPABLES = wellKnownSymbol('unscopables');
var ArrayPrototype = Array.prototype;

// Array.prototype[@@unscopables]
// https://tc39.github.io/ecma262/#sec-array.prototype-@@unscopables
if (ArrayPrototype[UNSCOPABLES] == undefined) {
  objectDefineProperty.f(ArrayPrototype, UNSCOPABLES, {
    configurable: true,
    value: objectCreate(null)
  });
}

// add a key to Array.prototype[@@unscopables]
var addToUnscopables = function (key) {
  ArrayPrototype[UNSCOPABLES][key] = true;
};

// `Array.prototype.fill` method
// https://tc39.github.io/ecma262/#sec-array.prototype.fill
_export({ target: 'Array', proto: true }, {
  fill: arrayFill
});

// https://tc39.github.io/ecma262/#sec-array.prototype-@@unscopables
addToUnscopables('fill');

var $indexOf = arrayIncludes.indexOf;



var nativeIndexOf = [].indexOf;

var NEGATIVE_ZERO = !!nativeIndexOf && 1 / [1].indexOf(1, -0) < 0;
var STRICT_METHOD$1 = arrayMethodIsStrict('indexOf');
var USES_TO_LENGTH$3 = arrayMethodUsesToLength('indexOf', { ACCESSORS: true, 1: 0 });

// `Array.prototype.indexOf` method
// https://tc39.github.io/ecma262/#sec-array.prototype.indexof
_export({ target: 'Array', proto: true, forced: NEGATIVE_ZERO || !STRICT_METHOD$1 || !USES_TO_LENGTH$3 }, {
  indexOf: function indexOf(searchElement /* , fromIndex = 0 */) {
    return NEGATIVE_ZERO
      // convert -0 to +0
      ? nativeIndexOf.apply(this, arguments) || 0
      : $indexOf(this, searchElement, arguments.length > 1 ? arguments[1] : undefined);
  }
});

var $filter = arrayIteration.filter;



var HAS_SPECIES_SUPPORT$2 = arrayMethodHasSpeciesSupport('filter');
// Edge 14- issue
var USES_TO_LENGTH$4 = arrayMethodUsesToLength('filter');

// `Array.prototype.filter` method
// https://tc39.github.io/ecma262/#sec-array.prototype.filter
// with adding support of @@species
_export({ target: 'Array', proto: true, forced: !HAS_SPECIES_SUPPORT$2 || !USES_TO_LENGTH$4 }, {
  filter: function filter(callbackfn /* , thisArg */) {
    return $filter(this, callbackfn, arguments.length > 1 ? arguments[1] : undefined);
  }
});

var aPossiblePrototype = function (it) {
  if (!isObject(it) && it !== null) {
    throw TypeError("Can't set " + String(it) + ' as a prototype');
  } return it;
};

// `Object.setPrototypeOf` method
// https://tc39.github.io/ecma262/#sec-object.setprototypeof
// Works with __proto__ only. Old v8 can't work with null proto objects.
/* eslint-disable no-proto */
var objectSetPrototypeOf = Object.setPrototypeOf || ('__proto__' in {} ? function () {
  var CORRECT_SETTER = false;
  var test = {};
  var setter;
  try {
    setter = Object.getOwnPropertyDescriptor(Object.prototype, '__proto__').set;
    setter.call(test, []);
    CORRECT_SETTER = test instanceof Array;
  } catch (error) { /* empty */ }
  return function setPrototypeOf(O, proto) {
    anObject(O);
    aPossiblePrototype(proto);
    if (CORRECT_SETTER) setter.call(O, proto);
    else O.__proto__ = proto;
    return O;
  };
}() : undefined);

// makes subclassing work correct for wrapped built-ins
var inheritIfRequired = function ($this, dummy, Wrapper) {
  var NewTarget, NewTargetPrototype;
  if (
    // it can work only with native `setPrototypeOf`
    objectSetPrototypeOf &&
    // we haven't completely correct pre-ES6 way for getting `new.target`, so use this
    typeof (NewTarget = dummy.constructor) == 'function' &&
    NewTarget !== Wrapper &&
    isObject(NewTargetPrototype = NewTarget.prototype) &&
    NewTargetPrototype !== Wrapper.prototype
  ) objectSetPrototypeOf($this, NewTargetPrototype);
  return $this;
};

// a string of all valid unicode whitespaces
// eslint-disable-next-line max-len
var whitespaces = '\u0009\u000A\u000B\u000C\u000D\u0020\u00A0\u1680\u2000\u2001\u2002\u2003\u2004\u2005\u2006\u2007\u2008\u2009\u200A\u202F\u205F\u3000\u2028\u2029\uFEFF';

var whitespace = '[' + whitespaces + ']';
var ltrim = RegExp('^' + whitespace + whitespace + '*');
var rtrim = RegExp(whitespace + whitespace + '*$');

// `String.prototype.{ trim, trimStart, trimEnd, trimLeft, trimRight }` methods implementation
var createMethod$3 = function (TYPE) {
  return function ($this) {
    var string = String(requireObjectCoercible($this));
    if (TYPE & 1) string = string.replace(ltrim, '');
    if (TYPE & 2) string = string.replace(rtrim, '');
    return string;
  };
};

var stringTrim = {
  // `String.prototype.{ trimLeft, trimStart }` methods
  // https://tc39.github.io/ecma262/#sec-string.prototype.trimstart
  start: createMethod$3(1),
  // `String.prototype.{ trimRight, trimEnd }` methods
  // https://tc39.github.io/ecma262/#sec-string.prototype.trimend
  end: createMethod$3(2),
  // `String.prototype.trim` method
  // https://tc39.github.io/ecma262/#sec-string.prototype.trim
  trim: createMethod$3(3)
};

var getOwnPropertyNames = objectGetOwnPropertyNames.f;
var getOwnPropertyDescriptor$2 = objectGetOwnPropertyDescriptor.f;
var defineProperty$1 = objectDefineProperty.f;
var trim = stringTrim.trim;

var NUMBER = 'Number';
var NativeNumber = global_1[NUMBER];
var NumberPrototype = NativeNumber.prototype;

// Opera ~12 has broken Object#toString
var BROKEN_CLASSOF = classofRaw(objectCreate(NumberPrototype)) == NUMBER;

// `ToNumber` abstract operation
// https://tc39.github.io/ecma262/#sec-tonumber
var toNumber = function (argument) {
  var it = toPrimitive(argument, false);
  var first, third, radix, maxCode, digits, length, index, code;
  if (typeof it == 'string' && it.length > 2) {
    it = trim(it);
    first = it.charCodeAt(0);
    if (first === 43 || first === 45) {
      third = it.charCodeAt(2);
      if (third === 88 || third === 120) return NaN; // Number('+0x1') should be NaN, old V8 fix
    } else if (first === 48) {
      switch (it.charCodeAt(1)) {
        case 66: case 98: radix = 2; maxCode = 49; break; // fast equal of /^0b[01]+$/i
        case 79: case 111: radix = 8; maxCode = 55; break; // fast equal of /^0o[0-7]+$/i
        default: return +it;
      }
      digits = it.slice(2);
      length = digits.length;
      for (index = 0; index < length; index++) {
        code = digits.charCodeAt(index);
        // parseInt parses a string to a first unavailable symbol
        // but ToNumber should return NaN if a string contains unavailable symbols
        if (code < 48 || code > maxCode) return NaN;
      } return parseInt(digits, radix);
    }
  } return +it;
};

// `Number` constructor
// https://tc39.github.io/ecma262/#sec-number-constructor
if (isForced_1(NUMBER, !NativeNumber(' 0o1') || !NativeNumber('0b1') || NativeNumber('+0x1'))) {
  var NumberWrapper = function Number(value) {
    var it = arguments.length < 1 ? 0 : value;
    var dummy = this;
    return dummy instanceof NumberWrapper
      // check on 1..constructor(foo) case
      && (BROKEN_CLASSOF ? fails(function () { NumberPrototype.valueOf.call(dummy); }) : classofRaw(dummy) != NUMBER)
        ? inheritIfRequired(new NativeNumber(toNumber(it)), dummy, NumberWrapper) : toNumber(it);
  };
  for (var keys$1 = descriptors ? getOwnPropertyNames(NativeNumber) : (
    // ES3:
    'MAX_VALUE,MIN_VALUE,NaN,NEGATIVE_INFINITY,POSITIVE_INFINITY,' +
    // ES2015 (in case, if modules with ES2015 Number statics required before):
    'EPSILON,isFinite,isInteger,isNaN,isSafeInteger,MAX_SAFE_INTEGER,' +
    'MIN_SAFE_INTEGER,parseFloat,parseInt,isInteger'
  ).split(','), j = 0, key; keys$1.length > j; j++) {
    if (has(NativeNumber, key = keys$1[j]) && !has(NumberWrapper, key)) {
      defineProperty$1(NumberWrapper, key, getOwnPropertyDescriptor$2(NativeNumber, key));
    }
  }
  NumberWrapper.prototype = NumberPrototype;
  NumberPrototype.constructor = NumberWrapper;
  redefine(global_1, NUMBER, NumberWrapper);
}

L.GmxDrawing.utils = {
  snaping: 10,
  // snap distance
  isOldVersion: L.version.substr(0, 3) === '0.7',
  defaultStyles: {
    mode: '',
    map: true,
    editable: true,
    holeStyle: {
      opacity: 0.5,
      color: '#003311'
    },
    lineStyle: {
      opacity: 1,
      weight: 2,
      clickable: false,
      className: 'leaflet-drawing-lines',
      color: '#0033ff',
      dashArray: null,
      lineCap: null,
      lineJoin: null,
      fill: false,
      fillColor: null,
      fillOpacity: 0.2,
      smoothFactor: 0,
      noClip: true,
      stroke: true
    },
    pointStyle: {
      className: 'leaflet-drawing-points',
      smoothFactor: 0,
      noClip: true,
      opacity: 1,
      shape: 'circle',
      fill: true,
      fillColor: '#ffffff',
      fillOpacity: 1,
      size: L.Browser.mobile ? 40 : 8,
      weight: 2,
      clickable: true,
      color: '#0033ff',
      dashArray: null,
      lineCap: null,
      lineJoin: null,
      stroke: true
    },
    markerStyle: {
      mode: '',
      editable: false,
      title: 'Text example',
      options: {
        alt: '',
        //title: '',
        clickable: true,
        draggable: false,
        keyboard: true,
        opacity: 1,
        zIndexOffset: 0,
        riseOffset: 250,
        riseOnHover: false,
        icon: {
          className: '',
          iconUrl: '',
          iconAnchor: [12, 41],
          iconSize: [25, 41],
          popupAnchor: [1, -34],
          shadowSize: [41, 41]
        }
      }
    }
  },
  getClosestOnGeometry: function getClosestOnGeometry(latlng, gmxGeoJson, map) {
    if (L.GeometryUtil && map) {
      return L.GeometryUtil.closestLayerSnap(map, [L.geoJson(L.gmxUtil.geometryToGeoJSON(gmxGeoJson, true, true))], latlng, Number(map.options.snaping || L.GmxDrawing.utils.snaping), true);
    }

    return null;
  },
  snapPoint: function snapPoint(latlng, obj, map) {
    var res = latlng;

    if (L.GeometryUtil) {
      var drawingObjects = map.gmxDrawing.getFeatures().filter(function (it) {
        return it !== obj._parent && it._obj !== obj;
      }).map(function (it) {
        return it.options.type === 'Point' ? it._obj : it;
      }),
          snaping = Number(map.options.snaping || L.GmxDrawing.utils.snaping),
          closest = L.GeometryUtil.closestLayerSnap(map, drawingObjects, latlng, snaping, true);

      if (closest) {
        res = closest.latlng;
      }
    }

    return res;
  },
  getNotDefaults: function getNotDefaults(from, def) {
    var res = {};

    for (var key in from) {
      if (key === 'icon' || key === 'map') {
        continue;
      } else if (key === 'iconAnchor' || key === 'iconSize' || key === 'popupAnchor' || key === 'shadowSize') {
        if (!def[key]) {
          continue;
        }

        if (def[key][0] !== from[key][0] || def[key][1] !== from[key][1]) {
          res[key] = from[key];
        }
      } else if (key === 'lineStyle' || key === 'pointStyle' || key === 'markerStyle') {
        res[key] = this.getNotDefaults(from[key], def[key]);
      } else if (!def || def[key] !== from[key] || key === 'fill') {
        res[key] = from[key];
      }
    }

    return res;
  },
  getShiftLatlng: function getShiftLatlng(latlng, map, shiftPixel) {
    if (shiftPixel && map) {
      var p = map.latLngToLayerPoint(latlng)._add(shiftPixel);

      latlng = map.layerPointToLatLng(p);
    }

    return latlng;
  },
  getDownType: function getDownType(ev, map, feature) {
    var layerPoint = ev.layerPoint,
        originalEvent = ev.originalEvent,
        ctrlKey = false,
        shiftKey = false,
        altKey = false,
        latlng = ev.latlng;

    if (originalEvent) {
      ctrlKey = originalEvent.ctrlKey;
      shiftKey = originalEvent.shiftKey;
      altKey = originalEvent.altKey;
    }

    if (ev.touches && ev.touches.length === 1) {
      var first = ev.touches[0],
          containerPoint = map.mouseEventToContainerPoint(first);
      layerPoint = map.containerPointToLayerPoint(containerPoint);
      latlng = map.layerPointToLatLng(layerPoint);
    }

    var out = {
      type: '',
      latlng: latlng,
      ctrlKey: ctrlKey,
      shiftKey: shiftKey,
      altKey: altKey
    },
        ring = this.points ? this : ev.ring || ev.relatedEvent,
        points = ring.points._originalPoints || ring.points._parts[0] || [],
        len = points.length;

    if (len === 0) {
      return out;
    }

    var size = (ring.points.options.size || 10) / 2;
    size += 1 + (ring.points.options.weight || 2);
    var cursorBounds = new L.Bounds(L.point(layerPoint.x - size, layerPoint.y - size), L.point(layerPoint.x + size, layerPoint.y + size)),
        prev = points[len - 1],
        lastIndex = len - (ring.mode === 'add' ? 2 : 1);
    out = {
      mode: ring.mode,
      layerPoint: ev.layerPoint,
      ctrlKey: ctrlKey,
      shiftKey: shiftKey,
      altKey: altKey,
      latlng: latlng
    };

    for (var i = 0; i < len; i++) {
      var point = points[i];

      if (feature.shiftPixel) {
        point = points[i].add(feature.shiftPixel);
      }

      if (cursorBounds.contains(point)) {
        out.type = 'node';
        out.num = i;
        out.end = i === 0 || i === lastIndex ? true : false;
        break;
      }

      var dist = L.LineUtil.pointToSegmentDistance(layerPoint, prev, point);

      if (dist < size) {
        out.type = 'edge';
        out.num = i === 0 ? len : i;
      }

      prev = point;
    }

    return out;
  },
  _getLastObject: function _getLastObject(obj) {
    if (obj.getLayers) {
      var layer = obj.getLayers().shift();
      return layer.getLayers ? this._getLastObject(layer) : obj;
    }

    return obj;
  },
  getMarkerByPos: function getMarkerByPos(pos, features) {
    for (var i = 0, len = features.length; i < len; i++) {
      var feature = features[i],
          fobj = feature._obj ? feature._obj : null,
          mpos = fobj && fobj._icon ? fobj._icon._leaflet_pos : null;

      if (mpos && mpos.x === pos.x && mpos.y === pos.y) {
        return fobj._latlng;
      }
    }

    return null;
  },
  getLocale: function getLocale(key) {
    var res = L.gmxLocale ? L.gmxLocale.getText(key) : null;
    return res || key;
  }
};
var Utils = L.GmxDrawing.utils;

L.GmxDrawing.Ring = L.LayerGroup.extend({
  options: {
    className: 'leaflet-drawing-ring',
    //noClip: true,
    maxPoints: 0,
    smoothFactor: 0,
    noClip: true,
    opacity: 1,
    shape: 'circle',
    fill: true,
    fillColor: '#ffffff',
    fillOpacity: 1,
    size: L.Browser.mobile ? 40 : 8,
    weight: 2
  },
  includes: L.Evented ? L.Evented.prototype : L.Mixin.Events,
  initialize: function initialize(parent, coords, options) {
    options = options || {};
    this.contextmenu = new GmxDrawingContextMenu$1();
    options.mode = '';
    this._activeZIndex = options.activeZIndex || 7;
    this._notActiveZIndex = options.notActiveZIndex || 6;
    this.options = L.extend({}, this.options, parent.getStyle(), options);
    this._layers = {};
    this._coords = coords;
    this._legLength = [];
    this._parent = parent;

    this._initialize(parent, coords);
  },
  _initialize: function _initialize(parent, coords) {
    var _this2 = this;

    this.clearLayers();
    delete this.lines;
    delete this.fill;
    delete this.points;
    this.downObject = false;
    this.mode = '';
    this.lineType = this.options.type.indexOf('Polyline') !== -1;

    if (this.options.type === 'Rectangle') {
      this.options.disableAddPoints = true;
    }

    var pointStyle = this.options.pointStyle;
    var lineStyle = {
      opacity: 1,
      weight: 2,
      noClip: true,
      clickable: false,
      className: 'leaflet-drawing-lines'
    };

    if (!this.lineType) {
      lineStyle.fill = 'fill' in this.options ? this.options.fill : true;
    }

    if (this.options.lineStyle) {
      for (var key in this.options.lineStyle) {
        if (key !== 'fill' || !this.lineType) {
          lineStyle[key] = this.options.lineStyle[key];
        }
      }
    }

    if (this.options.hole) {
      lineStyle = L.extend({}, lineStyle, Utils.defaultStyles.holeStyle);
      pointStyle = L.extend({}, pointStyle, Utils.defaultStyles.holeStyle);
    }

    var latlngs = coords,
        _this = this,
        mode = this.options.mode || (latlngs.length ? 'edit' : 'add');

    this.fill = new L.Polyline(latlngs, {
      className: 'leaflet-drawing-lines-fill',
      opacity: 0,
      smoothFactor: 0,
      noClip: true,
      fill: false,
      size: 10,
      weight: 10
    });
    this.fill.on('click', function (e) {
      _this2._parent.fire('click', e);
    });
    this.addLayer(this.fill);
    this.lines = new L.Polyline(latlngs, lineStyle);
    this.addLayer(this.lines);

    if (!this.lineType && mode === 'edit') {
      var latlng = latlngs[0][0] || latlngs[0];
      this.lines.addLatLng(latlng);
      this.fill.addLatLng(latlng);
    }

    this.mode = mode;
    this.points = new L.GmxDrawing.PointMarkers(latlngs, pointStyle);
    this.points._parent = this;
    this.addLayer(this.points);
    this.points.on('mouseover', function (ev) {
      this.toggleTooltip(ev, true, _this.lineType ? 'Length' : 'Area');

      if (ev.type === 'mouseover') {
        _this._recheckContextItems('points', _this._map);
      }
    }, this).on('mouseout', this.toggleTooltip, this);
    this.fill.on('mouseover mousemove', function (ev) {
      this.toggleTooltip(ev, true);
    }, this).on('mouseout', this.toggleTooltip, this);

    if (this.points.bindContextMenu) {
      this.points.bindContextMenu({
        contextmenu: false,
        contextmenuInheritItems: false,
        contextmenuItems: []
      });
    }

    if (this.fill.bindContextMenu) {
      this.fill.bindContextMenu({
        contextmenu: false,
        contextmenuInheritItems: false,
        contextmenuItems: []
      });
      this.fill.on('mouseover', function (ev) {
        if (ev.type === 'mouseover') {
          this._recheckContextItems('fill', this._map);
        }
      }, this);
    }

    this._parent.on('rotate', function (ev) {
      this.toggleTooltip(ev, true, 'angle');
    }, this);

    L.DomEvent.on(document, 'keydown keyup', this._toggleBboxClass, this);
  },
  bringToFront: function bringToFront() {
    if (this.lines) {
      this.lines.bringToFront();
    }

    if (this.fill) {
      this.fill.bringToFront();
    }

    if (this.points) {
      this.points.bringToFront();
    }

    return this;
  },
  bringToBack: function bringToBack() {
    if (this.lines) {
      this.lines.bringToBack();
    }

    if (this.fill) {
      this.fill.bringToBack();
    }

    if (this.points) {
      this.points.bringToBack();
    }

    return this;
  },
  _toggleBboxClass: function _toggleBboxClass(ev) {
    if (ev.type === 'keydown' && this.mode === 'add') {
      var key = ev.key,
          points = this._getLatLngsArr();

      if (key === 'Backspace') {
        this._legLength = [];
        points.splice(points.length - 1, 1);

        this._setPoint(points[0], 0);
      }

      if (key === 'Escape' || key === 'Backspace' && points.length < 2) {
        this._parent.remove(this);

        this._parent._parent._clearCreate();

        this._fireEvent('drawstop');
      }
    }

    if (this.bbox) {
      var flagRotate = this._needRotate;

      if (!ev.altKey) {
        flagRotate = !flagRotate;
      }

      if (ev.type === 'keyup' && !ev.altKey) {
        flagRotate = !this._needRotate;
      }

      L.DomUtil[flagRotate ? 'removeClass' : 'addClass'](this.bbox._path, 'Rotate');
    }
  },
  toggleTooltip: function toggleTooltip(ev, flag, type) {
    if ('hideTooltip' in this._parent) {
      ev.ring = this;

      if (flag) {
        type = type || 'Length';

        this._parent._showTooltip(type, ev);
      } else if (this.mode !== 'add') {
        this._parent.hideTooltip(ev);
      }
    }
  },
  _recheckContextItems: function _recheckContextItems(type, map) {
    var _this = this;

    this[type].options.contextmenuItems = (map.gmxDrawing.contextmenu.getItems()[type] || []).concat(this._parent.contextmenu.getItems()[type] || []).concat(this.contextmenu.getItems()[type] || []).map(function (obj) {
      var ph = {
        id: obj.text,
        text: Utils.getLocale(obj.text),
        icon: obj.icon,
        retinaIcon: obj.retinaIcon,
        iconCls: obj.iconCls,
        retinaIconCls: obj.retinaIconCls,
        callback: function callback(ev) {
          _this._eventsCmd(obj, ev);
        },
        context: obj.context || _this,
        disabled: 'disabled' in obj ? obj.disabled : false,
        separator: obj.separator,
        hideOnSelect: 'hideOnSelect' in obj ? obj.hideOnSelect : true
      };
      return ph;
    });
    return this[type].options.contextmenuItems;
  },
  _eventsCmd: function _eventsCmd(obj, ev) {
    var ring = ev.relatedTarget && ev.relatedTarget._parent || this;
    var downAttr = Utils.getDownType.call(this, ev, this._map, this._parent);

    if (downAttr) {
      var type = obj.text;

      if (obj.callback) {
        obj.callback(downAttr, this._parent);
      } else if (type === 'Delete feature') {
        this._parent.remove(this); // this._parent._parent._clearCreate();


        this._fireEvent('drawstop');
      } else if (type === 'Remove point') {
        ring._removePoint(downAttr.num);

        this._fireEvent('editstop', ev);
      } else if (type === 'Save' || type === 'Move' || type === 'Rotate' || type === 'Rotate around Point') {
        this._toggleRotate(type, downAttr);
      } else if (type === 'Cancel' && this._editHistory.length) {
        if (this._editHistory.length) {
          this.setLatLngs(this._editHistory[0]);
          this._editHistory = [];
        }

        this._toggleRotate('Save', downAttr);
      }
    }
  },
  getFeature: function getFeature() {
    return this._parent;
  },
  onAdd: function onAdd(map) {
    L.LayerGroup.prototype.onAdd.call(this, map);
    this.setEditMode();

    if (this.points.bindContextMenu) {
      var contextmenuItems = this._recheckContextItems('points', map);

      this.points.bindContextMenu({
        contextmenu: true,
        contextmenuInheritItems: false,
        contextmenuItems: contextmenuItems
      });
    }
  },
  onRemove: function onRemove(map) {
    if (this.points) {
      this._pointUp();

      this.removeAddMode();
      this.removeEditMode();

      if ('hideTooltip' in this._parent) {
        this._parent.hideTooltip();
      }
    }

    L.LayerGroup.prototype.onRemove.call(this, map);

    if (this.options.type === 'Point') {
      map.removeLayer(this._obj);
    }

    this._fireEvent('removefrommap');
  },
  getAngleLength: function getAngleLength(downAttr) {
    if (L.GeometryUtil && downAttr && downAttr.num) {
      var num = downAttr.num,
          latlngs = this.points._latlngs[0],
          prev = latlngs[num - 1],
          curr = latlngs[num] || downAttr.latlng,
          _parts = this.points._parts[0],
          angle = L.GeometryUtil.computeAngle(_parts[num - 1], _parts[num] || downAttr.layerPoint);
      angle += 90;
      angle %= 360;
      angle += angle < 0 ? 360 : 0;
      return {
        length: L.gmxUtil.distVincenty(prev.lng, prev.lat, curr.lng, curr.lat),
        angle: L.gmxUtil.formatDegrees(angle, 0)
      };
    }

    return null;
  },
  getLength: function getLength(downAttr) {
    var length = 0,
        latlngs = this._getLatLngsArr(),
        len = latlngs.length;

    if (len) {
      var beg = 1,
          prev = latlngs[0];

      if (downAttr) {
        if (downAttr.type === 'node') {
          len = downAttr.num + 1;
        } else {
          beg = downAttr.num;

          if (beg === len) {
            prev = latlngs[beg - 1];
            beg = 0;
          } else {
            prev = latlngs[beg - 1];
          }

          len = beg + 1;
        }
      }

      for (var i = beg; i < len; i++) {
        var leg = this._legLength[i] || null;

        if (leg === null) {
          leg = L.gmxUtil.distVincenty(prev.lng, prev.lat, latlngs[i].lng, latlngs[i].lat);
          this._legLength[i] = leg;
        }

        prev = latlngs[i];
        length += leg;
      }
    }

    return length;
  },
  _setPoint: function _setPoint(latlng, nm, type) {
    if (!this.points) {
      return;
    }

    var latlngs = this._getLatLngsArr();

    if (this.options.type === 'Rectangle') {
      if (type === 'edge') {
        nm--;

        if (nm === 0) {
          latlngs[0].lng = latlngs[1].lng = latlng.lng;
        } else if (nm === 1) {
          latlngs[1].lat = latlngs[2].lat = latlng.lat;
        } else if (nm === 2) {
          latlngs[2].lng = latlngs[3].lng = latlng.lng;
        } else if (nm === 3) {
          latlngs[0].lat = latlngs[3].lat = latlng.lat;
        }
      } else {
        latlngs[nm] = latlng;

        if (nm === 0) {
          latlngs[3].lat = latlng.lat;
          latlngs[1].lng = latlng.lng;
        } else if (nm === 1) {
          latlngs[2].lat = latlng.lat;
          latlngs[0].lng = latlng.lng;
        } else if (nm === 2) {
          latlngs[1].lat = latlng.lat;
          latlngs[3].lng = latlng.lng;
        } else if (nm === 3) {
          latlngs[0].lat = latlng.lat;
          latlngs[2].lng = latlng.lng;
        }
      }

      this._legLength = [];
    } else {
      latlngs[nm] = latlng;
      this._legLength[nm] = null;
      this._legLength[nm + 1] = null;
    }

    this.setLatLngs(latlngs);
  },
  addLatLng: function addLatLng(point, delta) {
    this._legLength = [];

    if (this.points) {
      var points = this._getLatLngsArr(),
          maxPoints = this.options.maxPoints,
          len = points.length,
          lastPoint = points[len - 2],
          flag = !lastPoint || !lastPoint.equals(point);

      if (maxPoints && len >= maxPoints) {
        this.setEditMode();

        this._fireEvent('drawstop', {
          latlng: point
        });

        len--;
      }

      if (flag) {
        if (delta) {
          len -= delta;
        } // reset existing point


        this._setPoint(point, len, 'node');
      }

      this._parent.lastAddLatLng = point;
    } else if ('addLatLng' in this._obj) {
      this._obj.addLatLng(point);
    }
  },
  setPositionOffset: function setPositionOffset(p) {
    L.DomUtil.setPosition(this.points._container, p);
    L.DomUtil.setPosition(this.fill._container, p);
    L.DomUtil.setPosition(this.lines._container, p);
  },
  setLatLngs: function setLatLngs(latlngs) {
    // TODO: latlngs не учитывает дырки полигонов
    if (this.points) {
      var points = this.points;
      this.fill.setLatLngs(latlngs);
      this.lines.setLatLngs(latlngs);

      if (!this.lineType && this.mode === 'edit' && latlngs.length > 2) {
        this.lines.addLatLng(latlngs[0]);
        this.fill.addLatLng(latlngs[0]);
      }

      if (this.bbox) {
        this.bbox.setBounds(this.lines._bounds);
      }

      points.setLatLngs(latlngs);
    } else if ('setLatLngs' in this._obj) {
      this._obj.setLatLngs(latlngs);
    }

    this._fireEvent('edit');
  },
  _getLatLngsArr: function _getLatLngsArr() {
    return Utils.isOldVersion ? this.points._latlngs : this.points._latlngs[0];
  },
  // edit mode
  _pointDown: function _pointDown(ev) {
    if (!this._map) {
      return;
    }

    if (L.Browser.ie || L.gmxUtil && L.gmxUtil.gtIE11) {
      this._map.dragging._draggable._onUp(ev); // error in IE

    }

    if (ev.originalEvent) {
      var originalEvent = ev.originalEvent;

      if (originalEvent.altKey) {
        // altKey, shiftKey
        this._onDragStart(ev);

        return;
      } else if (originalEvent.which !== 1 && originalEvent.button !== 1) {
        return;
      }
    }

    var downAttr = Utils.getDownType.call(this, ev, this._map, this._parent),
        type = downAttr.type,
        opt = this.options;
    this._lastDownTime = Date.now() + 100;
    this.down = downAttr;

    if (type === 'edge' && downAttr.ctrlKey && opt.type !== 'Rectangle') {
      if (opt.disableAddPoints) {
        return;
      }

      this._legLength = [];

      var num = downAttr.num,
          points = this._getLatLngsArr();

      points.splice(num, 0, points[num]);

      this._setPoint(ev.latlng, num, type);
    }

    this.downObject = true;

    this._parent._disableDrag();

    this._map.on('mousemove', this._pointMove, this).on('mouseup', this._mouseupPoint, this);
  },
  _mouseupPoint: function _mouseupPoint(ev) {
    this._pointUp(ev);

    if (this.__mouseupPointTimer) {
      cancelIdleCallback(this.__mouseupPointTimer);
    }

    this.__mouseupPointTimer = requestIdleCallback(function () {
      this._fireEvent('editstop', ev);
    }.bind(this), {
      timeout: 250
    });
  },
  _pointMove: function _pointMove(ev) {
    if (this.down && this._lastDownTime < Date.now()) {
      if (!this.lineType) {
        this._parent.showFill();
      }

      this._clearLineAddPoint();

      this._moved = true;
      var latlng = ev.originalEvent.ctrlKey ? Utils.snapPoint(ev.latlng, this, this._map) : ev.latlng;

      this._setPoint(latlng, this.down.num, this.down.type);

      if ('_showTooltip' in this._parent) {
        ev.ring = this;

        this._parent._showTooltip(this.lineType ? 'Length' : 'Area', ev);
      }
    }
  },
  _pointUp: function _pointUp(ev) {
    this.downObject = false;

    this._parent._enableDrag();

    if (!this.points) {
      return;
    }

    if (this._map) {
      this._map.off('mousemove', this._pointMove, this).off('mouseup', this._mouseupPoint, this);

      var target = ev && ev.originalEvent ? ev.originalEvent.target : null;

      if (target && target._leaflet_pos && /leaflet-marker-icon/.test(target.className)) {
        var latlng = Utils.getMarkerByPos(target._leaflet_pos, this._map.gmxDrawing.getFeatures());

        this._setPoint(latlng, this.down.num, this.down.type);
      }

      this._map._skipClick = true; // for EventsManager
    }

    if (this._drawstop) {
      this._fireEvent('drawstop', ev);
    }

    this._drawstop = false;
    this.down = null;
    var lineStyle = this.options.lineStyle || {};

    if (!lineStyle.fill && !this.lineType) {
      this._parent.hideFill();
    }
  },
  _lastPointClickTime: 0,
  // Hack for emulate dblclick on Point
  _removePoint: function _removePoint(num) {
    var points = this._getLatLngsArr();

    if (points.length > num) {
      this._legLength = [];
      points.splice(num, 1);

      if (this.options.type === 'Rectangle' || points.length < 2 || points.length < 3 && !this.lineType) {
        this._parent.remove(this);
      } else {
        this._setPoint(points[0], 0);
      }
    }
  },
  _clearLineAddPoint: function _clearLineAddPoint() {
    if (this._lineAddPointID) {
      clearTimeout(this._lineAddPointID);
    }

    this._lineAddPointID = null;
  },
  _pointDblClick: function _pointDblClick(ev) {
    this._clearLineAddPoint();

    if (!this.options.disableAddPoints && (!this._lastAddTime || Date.now() > this._lastAddTime)) {
      var downAttr = Utils.getDownType.call(this, ev, this._map, this._parent);

      this._removePoint(downAttr.num);
    }
  },
  _pointClick: function _pointClick(ev) {
    if (ev.originalEvent && ev.originalEvent.ctrlKey) {
      return;
    }

    var clickTime = Date.now(),
        prevClickTime = this._lastPointClickTime;
    this._lastPointClickTime = clickTime + 300;

    if (this._moved || clickTime < prevClickTime) {
      this._moved = false;
      return;
    }

    var downAttr = Utils.getDownType.call(this, ev, this._map, this._parent),
        mode = this.mode;

    if (downAttr.type === 'node') {
      var num = downAttr.num;

      if (downAttr.end) {
        // this is click on first or last Point
        if (mode === 'add') {
          this._pointUp();

          this.setEditMode();

          if (this.lineType && num === 0) {
            this._parent.options.type = this.options.type = 'Polygon';
            this.lineType = false;

            this._removePoint(this._getLatLngsArr().length - 1);
          }

          this._fireEvent('drawstop', downAttr);

          this._fireEvent('editstop', downAttr);

          this._removePoint(num);
        } else if (this.lineType) {
          this._clearLineAddPoint();

          this._lineAddPointID = setTimeout(function () {
            if (num === 0) {
              this._getLatLngsArr().reverse();
            }

            this.points.addLatLng(downAttr.latlng);
            this.setAddMode();

            this._fireEvent('drawstop', downAttr);
          }.bind(this), 250);
        }
      } else if (mode === 'add') {
        // this is add pont
        this.addLatLng(ev.latlng);
      }
    }
  },
  _editHistory: [],
  // _dragType: 'Save',
  _needRotate: false,
  _toggleRotate: function _toggleRotate(type, downAttr) {
    this._needRotate = type === 'Rotate' || type === 'Rotate around Point';
    this._editHistory = [];

    if (this.bbox) {
      this.bbox.off('contextmenu', this._onContextmenu, this).off('mousedown', this._onRotateStart, this);
      this.removeLayer(this.bbox);
      this.bbox = null;
    } else {
      L.DomUtil.TRANSFORM_ORIGIN = L.DomUtil.TRANSFORM_ORIGIN || L.DomUtil.testProp(['transformOrigin', 'WebkitTransformOrigin', 'OTransformOrigin', 'MozTransformOrigin', 'msTransformOrigin']);
      this.bbox = L.rectangle(this.lines.getBounds(), {
        color: this.lines.options.color,
        //||'rgb(51, 136, 255)',
        opacity: this.lines.options.opacity,
        className: 'leaflet-drawing-bbox ' + type,
        dashArray: '6, 3',
        smoothFactor: 0,
        noClip: true,
        fillOpacity: 0,
        fill: true,
        weight: 1
      });
      this.addLayer(this.bbox);
      this.bbox.on('contextmenu', this._onContextmenu, this).on('mousedown', this._onRotateStart, this);

      if (this.bbox.bindContextMenu) {
        this.bbox.bindContextMenu({
          contextmenu: false,
          contextmenuInheritItems: false,
          contextmenuItems: []
        });
      }

      this._recheckContextItems('bbox', this._map);

      this._rotateCenterPoint = type === 'Rotate' ? this.bbox.getCenter() : downAttr.latlng;
    }
  },
  _onContextmenu: function _onContextmenu() {
    this.bbox.options.contextmenuItems[1].disabled = this._editHistory.length < 1;
  },
  _isContextMenuEvent: function _isContextMenuEvent(ev) {
    var e = ev.originalEvent;
    return e.which !== 1 && e.button !== 1 && !e.touches;
  },
  _onRotateStart: function _onRotateStart(ev) {
    if (this._isContextMenuEvent(ev)) {
      return;
    }

    this._editHistory.push(this._getLatLngsArr().map(function (it) {
      return it.clone();
    }));

    var flagRotate = this._needRotate;

    if (ev.originalEvent.altKey) {
      flagRotate = !flagRotate;
    }

    if (this._map.contextmenu) {
      this._map.contextmenu.hide();
    }

    if (flagRotate) {
      this._rotateStartPoint = ev.latlng;
      this._rotateCenter = this._rotateCenterPoint;

      this._map.on('mouseup', this._onRotateEnd, this).on('mousemove', this._onRotate, this);

      this._parent._disableDrag();

      this._fireEvent('rotatestart', ev);
    } else {
      this._onDragStart(ev);
    }
  },
  _onRotateEnd: function _onRotateEnd(ev) {
    // TODO: не учитывает дырки полигонов
    this._map.off('mouseup', this._onRotateEnd, this).off('mousemove', this._onRotate, this);

    this.toggleTooltip(ev);

    if (this._center) {
      var center = this._center,
          shiftPoint = this._map.getPixelOrigin().add(center),
          cos = Math.cos(-this._angle),
          sin = Math.sin(-this._angle),
          map = this._map,
          _latlngs = this.points._parts[0].map(function (p) {
        var ps = p.subtract(center);
        return map.unproject(L.point(ps.x * cos + ps.y * sin, ps.y * cos - ps.x * sin).add(shiftPoint));
      });

      this.setLatLngs(_latlngs);

      this._rotateItem();

      this.bbox.setBounds(this.lines._bounds); // console.log('_onRotateEnd', this.mode, this.points._latlngs, _latlngs);
    }

    this._parent._enableDrag();

    this._fireEvent('rotateend', ev);
  },
  _onRotate: function _onRotate(ev) {
    var pos = ev.latlng,
        // текущая точка
    s = this._rotateStartPoint,
        // точка начала вращения
    c = this._rotateCenter; // центр объекта

    this._rotateItem(Math.atan2(s.lat - c.lat, s.lng - c.lng) - Math.atan2(pos.lat - c.lat, pos.lng - c.lng), this._map.project(c).subtract(this._map.getPixelOrigin()));

    this._fireEvent('rotate', ev);
  },
  _rotateItem: function _rotateItem(angle, center) {
    var originStr = '',
        rotate = '';

    if (center) {
      originStr = center.x + 'px ' + center.y + 'px';
      rotate = 'rotate(' + angle + 'rad)';
    }

    this._angle = angle;
    this._center = center;
    [this.bbox, this.lines, this.fill, this.points].forEach(function (it) {
      it._path.style[L.DomUtil.TRANSFORM_ORIGIN] = originStr;
      it._path.style.transform = rotate;
    });
  },
  _onDragEnd: function _onDragEnd() {
    this._map.off('mouseup', this._onDragEnd, this).off('mousemove', this._onDrag, this);

    this._parent._enableDrag();

    this._fireEvent('dragend');
  },
  _onDragStart: function _onDragStart(ev) {
    this._dragstartPoint = ev.latlng;

    this._map.on('mouseup', this._onDragEnd, this).on('mousemove', this._onDrag, this);

    this._parent._disableDrag();

    this._fireEvent('dragstart');
  },
  _onDrag: function _onDrag(ev) {
    var lat = this._dragstartPoint.lat - ev.latlng.lat,
        lng = this._dragstartPoint.lng - ev.latlng.lng,
        points = this._getLatLngsArr();

    points.forEach(function (item) {
      item.lat -= lat;
      item.lng -= lng;
    });
    this._dragstartPoint = ev.latlng;
    this._legLength = [];
    this.setLatLngs(points);

    this._fireEvent('drag');
  },
  _fireEvent: function _fireEvent(name, options) {
    this._parent._fireEvent(name, options);
  },
  _startTouchMove: function _startTouchMove(ev, drawstop) {
    var downAttr = Utils.getDownType.call(this, ev, this._map, this._parent);

    if (downAttr.type === 'node') {
      this._parent._disableDrag();

      this.down = downAttr; //var num = downAttr.num;

      var my = this;

      var _touchmove = function _touchmove(ev) {
        downAttr = Utils.getDownType.call(my, ev, my._map, this._parent);

        if (ev.touches.length === 1) {
          // Only deal with one finger
          my._pointMove(downAttr);
        }
      };

      var _touchend = function _touchend() {
        L.DomEvent.off(my._map._container, 'touchmove', _touchmove, my).off(my._map._container, 'touchend', _touchend, my);

        my._parent._enableDrag();

        if (drawstop) {
          my._parent.fire('drawstop', {
            mode: my.options.type,
            object: my
          });
        }
      };

      L.DomEvent.on(my._map._container, 'touchmove', _touchmove, my).on(my._map._container, 'touchend', _touchend, my);
    }
  },
  _editHandlers: function _editHandlers(flag) {
    //if (!this.points) { return; }
    var stop = L.DomEvent.stopPropagation,
        prevent = L.DomEvent.preventDefault;

    if (this.touchstart) {
      L.DomEvent.off(this.points._container, 'touchstart', this.touchstart, this);
    }

    if (this.touchstartFill) {
      L.DomEvent.off(this.fill._container, 'touchstart', this.touchstartFill, this);
    }

    this.touchstart = null;
    this.touchstartFill = null;

    if (flag) {
      this.points.on('dblclick click', stop, this).on('dblclick click', prevent, this).on('dblclick', this._pointDblClick, this).on('click', this._pointClick, this);

      if (L.Browser.mobile) {
        if (this._EditOpacity) {
          this._parent._setPointsStyle({
            fillOpacity: this._EditOpacity
          });
        }

        var my = this;

        this.touchstart = function (ev) {
          my._startTouchMove(ev);
        };

        L.DomEvent.on(this.points._container, 'touchstart', this.touchstart, this);

        this.touchstartFill = function (ev) {
          var downAttr = Utils.getDownType.call(my, ev, my._map, this._parent);

          if (downAttr.type === 'edge' && my.options.type !== 'Rectangle') {
            var points = my.points._latlngs;
            points.splice(downAttr.num, 0, points[downAttr.num]);
            my._legLength = [];

            my._setPoint(downAttr.latlng, downAttr.num, downAttr.type);
          }
        };

        L.DomEvent.on(this.fill._container, 'touchstart', this.touchstartFill, this);
      } else {
        this.points.on('mousemove', stop).on('mousedown', this._pointDown, this);
        this.lines.on('mousedown', this._pointDown, this);
        this.fill.on('dblclick click', stop, this).on('mousedown', this._pointDown, this);

        this._fireEvent('editmode');
      }
    } else {
      this._pointUp();

      this.points.off('dblclick click', stop, this).off('dblclick click', prevent, this).off('dblclick', this._pointDblClick, this).off('click', this._pointClick, this);

      if (!L.Browser.mobile) {
        this.points.off('mousemove', stop).off('mousedown', this._pointDown, this);
        this.lines.off('mousedown', this._pointDown, this);
        this.fill.off('dblclick click', stop, this).off('mousedown', this._pointDown, this);
      }
    }
  },
  _createHandlers: function _createHandlers(flag) {
    if (!this.points || !this._map) {
      return;
    }

    var stop = L.DomEvent.stopPropagation;

    if (flag) {
      if (this._map.contextmenu) {
        this._map.contextmenu.disable();
      }

      this._parent._enableDrag();

      this._map.on('dblclick', stop).on('mousedown', this._mouseDown, this).on('mouseup', this._mouseUp, this).on('mousemove', this._moseMove, this);

      this.points.on('click', this._pointClick, this);

      this._fireEvent('addmode');

      if (!this.lineType) {
        this.lines.setStyle({
          fill: true
        });
      }
    } else {
      if (this._map) {
        this._map.off('dblclick', stop).off('mouseup', this._mouseUp, this).off('mousemove', this._moseMove, this);

        this.points.off('click', this._pointClick, this);
      }

      var lineStyle = this.options.lineStyle || {};

      if (!this.lineType && !lineStyle.fill) {
        this.lines.setStyle({
          fill: false
        });
      }
    }
  },
  setEditMode: function setEditMode() {
    if (this.options.editable) {
      this._editHandlers(false);

      this._createHandlers(false);

      this._editHandlers(true);

      this.mode = 'edit';
    }

    return this;
  },
  setAddMode: function setAddMode() {
    if (this.options.editable) {
      this._editHandlers(false);

      this._createHandlers(false);

      this._createHandlers(true);

      this.mode = 'add';
    }

    return this;
  },
  removeAddMode: function removeAddMode() {
    this._createHandlers(false);

    this.mode = '';
  },
  removeEditMode: function removeEditMode() {
    this._editHandlers(false);

    this.mode = '';
  },
  // add mode
  _moseMove: function _moseMove(ev) {
    if (this.points) {
      var points = this._getLatLngsArr(),
          latlng = ev.latlng;

      if (ev.originalEvent.ctrlKey) {
        latlng = Utils.snapPoint(latlng, this, this._map);
      }

      if (points.length === 1) {
        this._setPoint(latlng, 1);
      }

      this._setPoint(latlng, points.length - 1);

      this.toggleTooltip(ev, true, this.lineType ? 'Length' : 'Area');
    }
  },
  _mouseDown: function _mouseDown() {
    this._lastMouseDownTime = Date.now() + 200;

    if (this._map && this._map.contextmenu) {
      this._map.contextmenu.hide();
    }

    if ('hideTooltip' in this._parent) {
      this._parent.hideTooltip();
    }
  },
  _mouseUp: function _mouseUp(ev) {
    var timeStamp = Date.now();

    if (ev.delta || timeStamp < this._lastMouseDownTime) {
      this._lastAddTime = timeStamp + 1000;

      var _latlngs = this._getLatLngsArr();

      if (ev.originalEvent && ev.originalEvent.which === 3 && this.points && _latlngs && _latlngs.length) {
        // for click right button
        this.setEditMode();

        this._removePoint(_latlngs.length - 1);

        this._pointUp();

        this._fireEvent('drawstop');

        if (this._map && this._map.contextmenu) {
          requestIdleCallback(this._map.contextmenu.enable.bind(this._map.contextmenu), {
            timeout: 250
          });
        }
      } else {
        var latlng = ev._latlng || ev.latlng;

        if (ev.delta) {
          this.addLatLng(latlng, ev.delta);
        } // for click on marker


        this.addLatLng(latlng);
      }

      this._parent._parent._clearCreate();
    }
  }
});
L.GmxDrawing.Ring;

L.GmxDrawing.PointMarkers = L.Polygon.extend({
  options: {
    className: 'leaflet-drawing-points',
    noClip: true,
    smoothFactor: 0,
    opacity: 1,
    shape: 'circle',
    fill: true,
    fillColor: '#ffffff',
    fillOpacity: 1,
    size: L.Browser.mobile ? 40 : 8,
    weight: 2
  },
  _convertLatLngs: function _convertLatLngs(latlngs) {
    return L.Polyline.prototype._convertLatLngs.call(this, latlngs);
  },
  getRing: function getRing() {
    return this._parent;
  },
  getFeature: function getFeature() {
    return this.getRing()._parent;
  },
  getPathLatLngs: function getPathLatLngs() {
    var out = [],
        size = this.options.size,
        dontsmooth = this._parent.options.type === 'Rectangle',
        points = this._parts[0],
        prev;

    for (var i = 0, len = points.length, p; i < len; i++) {
      p = points[i];

      if (i === 0 || dontsmooth || Math.abs(prev.x - p.x) > size || Math.abs(prev.y - p.y) > size) {
        out.push(this._latlngs[i]);
        prev = p;
      }
    }

    return out;
  },
  _getPathPartStr: function _getPathPartStr(points) {
    var round = L.Path.VML,
        size = this.options.size / 2,
        dontsmooth = this._parent && this._parent.options.type === 'Rectangle',
        skipLastPoint = this._parent && this._parent.mode === 'add' && !L.Browser.mobile ? 1 : 0,
        radius = this.options.shape === 'circle' ? true : false,
        prev;

    for (var j = 0, len2 = points.length - skipLastPoint, str = '', p; j < len2; j++) {
      p = points[j];

      if (round) {
        p._round();
      }

      if (j === 0 || dontsmooth || Math.abs(prev.x - p.x) > this.options.size || Math.abs(prev.y - p.y) > this.options.size) {
        if (radius) {
          str += 'M' + p.x + ',' + (p.y - size) + ' A' + size + ',' + size + ',0,1,1,' + (p.x - 0.1) + ',' + (p.y - size) + ' ';
        } else {
          var px = p.x,
              px1 = px - size,
              px2 = px + size,
              py = p.y,
              py1 = py - size,
              py2 = py + size;
          str += 'M' + px1 + ' ' + py1 + 'L' + px2 + ' ' + py1 + 'L' + px2 + ' ' + py2 + 'L' + px1 + ' ' + py2 + 'L' + px1 + ' ' + py1;
        }

        prev = p;
      }
    }

    return str;
  },
  _onMouseClick: function _onMouseClick(e) {
    //if (this._map.dragging && this._map.dragging.moved()) { return; }
    this._fireMouseEvent(e);
  },
  _updatePath: function _updatePath() {
    if (Utils.isOldVersion) {
      if (!this._map) {
        return;
      }

      this._clipPoints();

      this.projectLatlngs();
      var pathStr = this.getPathString();

      if (pathStr !== this._pathStr) {
        this._pathStr = pathStr;

        if (this._path.getAttribute('fill-rule') !== 'inherit') {
          this._path.setAttribute('fill-rule', 'inherit');
        }

        this._path.setAttribute('d', this._pathStr || 'M0 0');
      }
    } else {
      var str = this._parts.length ? this._getPathPartStr(this._parts[0]) : '';

      this._renderer._setPath(this, str);
    }
  }
});
L.GmxDrawing.PointMarkers;

L.GmxDrawing.utils = {
  snaping: 10,
  // snap distance
  isOldVersion: L.version.substr(0, 3) === '0.7',
  defaultStyles: {
    mode: '',
    map: true,
    editable: true,
    holeStyle: {
      opacity: 0.5,
      color: '#003311'
    },
    lineStyle: {
      opacity: 1,
      weight: 2,
      clickable: false,
      className: 'leaflet-drawing-lines',
      color: '#0033ff',
      dashArray: null,
      lineCap: null,
      lineJoin: null,
      fill: false,
      fillColor: null,
      fillOpacity: 0.2,
      smoothFactor: 0,
      noClip: true,
      stroke: true
    },
    pointStyle: {
      className: 'leaflet-drawing-points',
      smoothFactor: 0,
      noClip: true,
      opacity: 1,
      shape: 'circle',
      fill: true,
      fillColor: '#ffffff',
      fillOpacity: 1,
      size: L.Browser.mobile ? 40 : 8,
      weight: 2,
      clickable: true,
      color: '#0033ff',
      dashArray: null,
      lineCap: null,
      lineJoin: null,
      stroke: true
    },
    markerStyle: {
      mode: '',
      editable: false,
      title: 'Text example',
      options: {
        alt: '',
        //title: '',
        clickable: true,
        draggable: false,
        keyboard: true,
        opacity: 1,
        zIndexOffset: 0,
        riseOffset: 250,
        riseOnHover: false,
        icon: {
          className: '',
          iconUrl: '',
          iconAnchor: [12, 41],
          iconSize: [25, 41],
          popupAnchor: [1, -34],
          shadowSize: [41, 41]
        }
      }
    }
  },
  getClosestOnGeometry: function getClosestOnGeometry(latlng, gmxGeoJson, map) {
    if (L.GeometryUtil && map) {
      return L.GeometryUtil.closestLayerSnap(map, [L.geoJson(L.gmxUtil.geometryToGeoJSON(gmxGeoJson, true, true))], latlng, Number(map.options.snaping || L.GmxDrawing.utils.snaping), true);
    }

    return null;
  },
  snapPoint: function snapPoint(latlng, obj, map) {
    var res = latlng;

    if (L.GeometryUtil) {
      var drawingObjects = map.gmxDrawing.getFeatures().filter(function (it) {
        return it !== obj._parent && it._obj !== obj;
      }).map(function (it) {
        return it.options.type === 'Point' ? it._obj : it;
      }),
          snaping = Number(map.options.snaping || L.GmxDrawing.utils.snaping),
          closest = L.GeometryUtil.closestLayerSnap(map, drawingObjects, latlng, snaping, true);

      if (closest) {
        res = closest.latlng;
      }
    }

    return res;
  },
  getNotDefaults: function getNotDefaults(from, def) {
    var res = {};

    for (var key in from) {
      if (key === 'icon' || key === 'map') {
        continue;
      } else if (key === 'iconAnchor' || key === 'iconSize' || key === 'popupAnchor' || key === 'shadowSize') {
        if (!def[key]) {
          continue;
        }

        if (def[key][0] !== from[key][0] || def[key][1] !== from[key][1]) {
          res[key] = from[key];
        }
      } else if (key === 'lineStyle' || key === 'pointStyle' || key === 'markerStyle') {
        res[key] = this.getNotDefaults(from[key], def[key]);
      } else if (!def || def[key] !== from[key] || key === 'fill') {
        res[key] = from[key];
      }
    }

    return res;
  },
  getShiftLatlng: function getShiftLatlng(latlng, map, shiftPixel) {
    if (shiftPixel && map) {
      var p = map.latLngToLayerPoint(latlng)._add(shiftPixel);

      latlng = map.layerPointToLatLng(p);
    }

    return latlng;
  },
  getDownType: function getDownType(ev, map, feature) {
    var layerPoint = ev.layerPoint,
        originalEvent = ev.originalEvent,
        ctrlKey = false,
        shiftKey = false,
        altKey = false,
        latlng = ev.latlng;

    if (originalEvent) {
      ctrlKey = originalEvent.ctrlKey;
      shiftKey = originalEvent.shiftKey;
      altKey = originalEvent.altKey;
    }

    if (ev.touches && ev.touches.length === 1) {
      var first = ev.touches[0],
          containerPoint = map.mouseEventToContainerPoint(first);
      layerPoint = map.containerPointToLayerPoint(containerPoint);
      latlng = map.layerPointToLatLng(layerPoint);
    }

    var out = {
      type: '',
      latlng: latlng,
      ctrlKey: ctrlKey,
      shiftKey: shiftKey,
      altKey: altKey
    },
        ring = this.points ? this : ev.ring || ev.relatedEvent,
        points = ring.points._originalPoints || ring.points._parts[0] || [],
        len = points.length;

    if (len === 0) {
      return out;
    }

    var size = (ring.points.options.size || 10) / 2;
    size += 1 + (ring.points.options.weight || 2);
    var cursorBounds = new L.Bounds(L.point(layerPoint.x - size, layerPoint.y - size), L.point(layerPoint.x + size, layerPoint.y + size)),
        prev = points[len - 1],
        lastIndex = len - (ring.mode === 'add' ? 2 : 1);
    out = {
      mode: ring.mode,
      layerPoint: ev.layerPoint,
      ctrlKey: ctrlKey,
      shiftKey: shiftKey,
      altKey: altKey,
      latlng: latlng
    };

    for (var i = 0; i < len; i++) {
      var point = points[i];

      if (feature.shiftPixel) {
        point = points[i].add(feature.shiftPixel);
      }

      if (cursorBounds.contains(point)) {
        out.type = 'node';
        out.num = i;
        out.end = i === 0 || i === lastIndex ? true : false;
        break;
      }

      var dist = L.LineUtil.pointToSegmentDistance(layerPoint, prev, point);

      if (dist < size) {
        out.type = 'edge';
        out.num = i === 0 ? len : i;
      }

      prev = point;
    }

    return out;
  },
  _getLastObject: function _getLastObject(obj) {
    if (obj.getLayers) {
      var layer = obj.getLayers().shift();
      return layer.getLayers ? this._getLastObject(layer) : obj;
    }

    return obj;
  },
  getMarkerByPos: function getMarkerByPos(pos, features) {
    for (var i = 0, len = features.length; i < len; i++) {
      var feature = features[i],
          fobj = feature._obj ? feature._obj : null,
          mpos = fobj && fobj._icon ? fobj._icon._leaflet_pos : null;

      if (mpos && mpos.x === pos.x && mpos.y === pos.y) {
        return fobj._latlng;
      }
    }

    return null;
  },
  getLocale: function getLocale(key) {
    var res = L.gmxLocale ? L.gmxLocale.getText(key) : null;
    return res || key;
  }
};
L.GmxDrawing.utils;
//# sourceMappingURL=gmx-drawing.js.map
