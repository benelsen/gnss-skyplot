
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
      type: function (el, value, prevValue) {
        if ( el === document.activeElement ) return;
        el.value = moment.utc( value ).format('YYYY-MM-DD HH:mm:ss ZZ');
      },
      hook: 'time'
    },

    'model.longitude': {
      type: function (el, value) {
        // el.value = sexagesimal.format(value, 'lon'); //.toFixed(5);
        el.value = value.toFixed(5);
      },
      hook: 'longitude'
    },

    'model.latitude': {
      type: function (el, value) {
        // el.value = sexagesimal.format(value, 'lat'); //.toFixed(5);
        el.value = value.toFixed(5);
      },
      hook: 'latitude'
    },

    'model.height': {
      type: function (el, value) {
        el.value = value.toFixed(1);
      },
      hook: 'height'
    },

    'model.animation': {
      type: 'booleanAttribute',
      hook: 'animation',
      name: 'checked'
    },

    'model.pulseRate': {
      type: function (el, value) {
        el.value = value/1000;
      },
      hook: 'update-rate'
    },

  },

  events: {

    'change input': 'change',
    'focus input': 'focus',
    'click [data-hook=zeroTimeOffset]': 'zeroTimeOffset',
    'click [data-hook=locate]': 'getUserLocation',
    'click [data-hook=share] button': 'share'

  },

  share: function () {

    var el = this.queryByHook('share');

    el.querySelector('button').textContent = 'Share';

    removeClass(el, 'inactive');

    document.location.hash = 'location=' + [
      app.user.position[0].toFixed(5),
      app.user.position[1].toFixed(5),
      app.user.position[2].toFixed(1)
    ].join(',');

    var input = el.querySelector('input');

    input.value = document.location.href;
    input.select();

  },

  getUserLocation: function () {
    app.user.getLocationFromAPI();
  },

  focus: function (e) {

    d3.select(e.target).interrupt();
    d3.select(e.target).select('span').interrupt();

  },

  change: function (e) {

    var index = ['longitude', 'latitude', 'height'].indexOf(e.target.dataset.hook);

    if ( index > -1 ) {

      var position = Array.from( this.model.position );

      // if ( index < 2 ) {
        // console.log( e.target.value, sexagesimal( e.target.value ) );
        // position[index] = sexagesimal( e.target.value );
      // } else {
      position[index] = +e.target.value;
      // }
      //

      this.model.set('position', position);

    } else if ( e.target.dataset.hook === 'time' ) {

      this.model.timeOffset = ( moment.utc(e.target.value, ['YYYY-MM-DD HH:mm:ss ZZ', moment.ISO_8601]).valueOf() - Date.now() ) / 1000;

    } else if ( e.target.dataset.hook === 'animation' ) {

      this.model.animation = e.target.checked;

    } else if ( e.target.dataset.hook === 'update-rate' ) {

      this.model.pulseRate = e.target.value * 1e3;

    }

  },

  zeroTimeOffset: function () {
    this.model.timeOffset = 0;
  },

  render: function () {
    // this.renderWithTemplate();
  }

});
