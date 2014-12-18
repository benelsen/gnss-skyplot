
/* Logging */
import * as bows from 'bows';
var log = bows('SatelliteList');

import * as _ from 'underscore';
import * as View from 'ampersand-view';

import SatelliteView from './satelliteListItem';

export default View.extend({

  events: {
    'click th': 'sortBy',
  },

  sortBy: function (e) {

    this.collection.setSortMode( e.target.dataset.hook );
    this.collection.sort();

  },

  render: function () {

    log('render');

    // this.renderWithTemplate();
    this.renderCollection(this.collection, SatelliteView, this.query('tbody'));

  },

});
