
/* Logging */
import * as bows from 'bows';
var log = bows('DOP');

import * as View from 'ampersand-view';

export default View.extend({

  template: function (context) {
    var html = [
      '<table class="table table-condensed horizontal dop" data-hook="dop">',
      '  <thead>',
      '    <tr>',
      '      <th>GDOP</th>',
      '      <th>PDOP</th>',
      '      <th>HDOP</th>',
      '      <th>VDOP</th>',
      '      <th>TDOP</th>',
      '    </tr>',
      '  </thead>',
      '  <tbody>',
      '    <td data-hook="gdop"></td>',
      '    <td data-hook="pdop"></td>',
      '    <td data-hook="hdop"></td>',
      '    <td data-hook="vdop"></td>',
      '    <td data-hook="tdop"></td>',
      '  </tbody>',
      '</table>',
    ].join('\n');

    return html;
  },

  events: {
  },

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

  render: function () {

    this.renderWithTemplate();

  },

});

function setToFixed (n, el, value) {
  if ( !value ) return;
  el.textContent = value.toFixed(n);
}
