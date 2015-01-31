
/* Logging */
import bows from 'bows';
var log = bows('DOP');

import View from 'ampersand-view';

export default View.extend({

  bindings: {

    'model.dop.gdop': {
      hook: 'gdop',
      type: setToFixed.bind(null, 2)
    },

    'model.dop.pdop': {
      hook: 'pdop',
      type: setToFixed.bind(null, 2)
    },

    'model.dop.hdop': {
      hook: 'hdop',
      type: setToFixed.bind(null, 2)
    },

    'model.dop.vdop': {
      hook: 'vdop',
      type: setToFixed.bind(null, 2)
    },

    'model.dop.tdop': {
      hook: 'tdop',
      type: setToFixed.bind(null, 2)
    },

  },

  render () {

    log('render');

    // this.renderWithTemplate();

  },

});

function setToFixed (n, el, value) {
  if ( !value ) return;
  el.textContent = value.toFixed(n);
}
