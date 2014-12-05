
/* Logging */
import * as bows from 'bows';
var log = bows('SatelliteList');

import * as _ from 'underscore';
import * as View from 'ampersand-view';

import SatelliteView from './satelliteListItem';

export default View.extend({

  template: function (context) {
    var html = [
      '<table data-hook="satellite-list" class="table table-condensed horizontal satellite-list">',
      ' <thead>',
      '   <tr>',
      '     <th data-hook="prn">PRN</th>',
      '     <th data-hook="elevation">Elevation</th>',
      '     <th data-hook="azimuth">Azimuth</th>',
      '     <th data-hook="range">Range</th>',
      '   </tr>',
      ' </thead>',
      ' <tbody>',
      ' </tbody>',
      '</table>',
    ].join('\n');

    return html;
  },

  events: {
    'click th': 'sortBy',
  },

  sortBy: function (e) {

    this.collection.setSortMode( e.target.dataset.hook );
    this.collection.sort();

  },

  render: function () {

    this.renderWithTemplate();
    this.renderCollection(this.collection, SatelliteView, this.query('tbody'));

  },

});
