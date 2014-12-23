
/* Logging */
import * as bows from 'bows';
var log = bows('Settings');

import * as _ from 'underscore';
import * as View from 'ampersand-view';
import * as moment from 'moment';
// import * as sexagesimal from 'sexagesimal';

import * as removeClass from 'amp-remove-class';

export default View.extend({

  bindings: {

    'model.time': {
      type: function (el, value) {
        if ( el.contains( document.activeElement ) ) return;
        el.value = moment.utc( value ).format('YYYY-MM-DD HH:mm:ss ZZ');
      },
      hook: 'time'
    },

    'model.longitude': {
      type: function (el, value) {
        if ( el.contains( document.activeElement ) ) return;
        el.value = value.toFixed(5);
      },
      hook: 'longitude'
    },

    'model.latitude': {
      type: function (el, value) {
        if ( el.contains( document.activeElement ) ) return;
        el.value = value.toFixed(5);
      },
      hook: 'latitude'
    },

    'model.height': {
      type: function (el, value) {
        if ( el.contains( document.activeElement ) ) return;
        el.value = value.toFixed(1);
      },
      hook: 'height'
    },

  },

  events: {

    'change [data-hook=coordinates] input': 'changeLocation',
    'change [data-hook=time] input': 'changeTime',

    'click [data-hook=zeroTimeOffset]': 'zeroTimeOffset',
    'click [data-hook=locate]': 'getUserLocation',
    'click [data-hook=share] button': 'share'

  },

  share: function () {

    log('share');

    var el = this.queryByHook('share');
    var btn = el.querySelector('button');

    btn.textContent = 'Share';

    removeClass(el, 'inactive');

    document.location.hash = 'location=' + [
      this.model.position[0].toFixed(5),
      this.model.position[1].toFixed(5),
      this.model.position[2].toFixed(1)
    ].join(',');

    var input = el.querySelector('input');

    input.value = document.location.href;
    input.select();

  },

  getUserLocation: function () {

    log('getUserLocation');

    this.model.getLocationFromAPI();

  },

  changeLocation: function (e) {

    log('changeLocation');

    var position = Array.from( this.model.position );

    var index = ['longitude', 'latitude', 'height'].indexOf(e.target.dataset.hook);

    position[index] = +e.target.value;

    this.model.set('position', position);

  },

  changeTime: function (e) {

    log('changeTime');

    this.model.timeOffset = ( moment.utc(e.target.value, ['YYYY-MM-DD HH:mm:ss ZZ', moment.ISO_8601]).valueOf() - Date.now() ) / 1000;

  },

  zeroTimeOffset: function () {

    log('zeroTimeOffset');

    this.model.timeOffset = 0;

  },

  render: function () {

    log('render');
    // this.renderWithTemplate();

  }

});
