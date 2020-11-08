'use babel';

/**
 * @module olgm/listener/Listener
 */
import AbstractListener from './AbstractListener.js';
import ol from '../../ol';

const { unByKey } = ol.Observable;

class Listener extends AbstractListener {
  /**
   * Listener for OL events.
   * @param {module:ol/events~EventsKey|Array<module:ol/events~EventsKey>} listenerKey OL events key
   */
  constructor(listenerKey) {
    super();

    /**
     * @type {module:ol/events~EventsKey|Array<module:ol/events~EventsKey>}
     * @private
     */
    this.listenerKey_ = listenerKey;
  }

  /**
   * @inheritdoc
   */
  unlisten() {
    unByKey(this.listenerKey_);
  }
}

module.exports = Listener;
