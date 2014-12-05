
/* Logging */
import * as bows from 'bows';
var log = bows('DOP');

import * as View from 'ampersand-view';

export default View.extend({

  template: function (context) {
    var html = [
      '<table class="table table-condensed" data-hook="dop">',
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

  render: function () {

    this.renderWithTemplate();

  },

});
