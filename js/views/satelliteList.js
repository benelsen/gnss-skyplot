
/* Logging */
import bows from 'bows';
var log = bows('SatelliteList');

import View from 'ampersand-view';

import SatelliteView from './satelliteListItem';

export default View.extend({

  events: {
    'click th': 'sortBy',
  },

  sortBy (e) {

    this.collection.setSortMode( e.target.dataset.hook );
    this.collection.sort();

  },

  render () {

    log.info('render');

    // this.renderWithTemplate();
    this.renderCollection(this.collection, SatelliteView, this.query('tbody'));

  },

});
