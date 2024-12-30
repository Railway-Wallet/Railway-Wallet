if (globalThis.CustomEvent != null) return;
// This file is only required for node version < 19
// The source is lifted from Node internals

// Node internals do not use globals directly but instead reference premordials, which we will define here
const ObjectFreeze = Object.freeze;
const ObjectDefineProperties = Object.defineProperties;
const SymbolToStringTag = Symbol.toStringTag;

// https://github.com/nodejs/node/blob/b17a1fb1cec919c09aa3401c040b79e35c5ed82e/lib/internal/util.js#L720-L722
const kEnumerableProperty = { __proto__: null };
kEnumerableProperty.enumerable = true;
ObjectFreeze(kEnumerableProperty);

// https://github.com/nodejs/node/blob/b17a1fb1cec919c09aa3401c040b79e35c5ed82e/lib/internal/event_target.js#L77-L78
const kType = Symbol('type');
const kDetail = Symbol('detail');

// https://github.com/nodejs/node/blob/b17a1fb1cec919c09aa3401c040b79e35c5ed82e/lib/internal/event_target.js#L94-L96
function isEvent(value) {
  // Unfortunately we cannot use private symbols so we try to do the next best thing
  // return typeof value?.[kType] === 'string';
  
  // Which is to just check the prototype chain for Event
  return value instanceof Event;
}

// https://github.com/nodejs/node/blob/b17a1fb1cec919c09aa3401c040b79e35c5ed82e/lib/internal/event_target.js#L372-L413
function isCustomEvent(value) {
  return isEvent(value) && (value?.[kDetail] !== undefined);
}

class CustomEvent extends Event {
  /**
   * @constructor
   * @param {string} type
   * @param {{
   *   bubbles?: boolean,
   *   cancelable?: boolean,
   *   composed?: boolean,
   *   detail?: any,
   * }} [options]
   */
  constructor(type, options = {}) {
    if (arguments.length === 0)
      throw new TypeError('type must be specified');
    super(type, options);
    this[kDetail] = options?.detail ?? null;
  }

  /**
   * @type {any}
   */
  get detail() {
    if (!isCustomEvent(this))
      throw new TypeError('Value of "this" must be of type CustomEvent');
    return this[kDetail];
  }
}

ObjectDefineProperties(CustomEvent.prototype, {
  [SymbolToStringTag]: {
    __proto__: null,
    writable: false,
    enumerable: false,
    configurable: true,
    value: 'CustomEvent',
  },
  detail: kEnumerableProperty,
});

globalThis.CustomEvent = CustomEvent;
