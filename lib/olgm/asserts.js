'use babel';

/**
 * @module olgm/asserts
 */
/* Based on https://github.com/openlayers/openlayers/blob/master/src/ol/asserts.js */
/**
 * @param {*} assertion Assertion we expected to be truthy
 * @param {string=} opt_message Error message in case of failure
 */
module.exports.assert = assert;
function assert(assertion, opt_message) {
  if (!assertion) {
    let message = 'Assertion failed';
    if (opt_message) {
      message += ': ' + opt_message;
    }
    throw new Error(message);
  }
}
