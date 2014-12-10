
/* Logging */
import * as bows from 'bows';
var log = bows('Settings');

import * as _ from 'underscore';
import * as View from 'ampersand-view';
import * as moment from 'moment';
// import * as sexagesimal from 'sexagesimal';

export default View.extend({

  template: [
    '<form class="form-horizontal settings" data-hook="form">',
    '  ',
    '  <div class="form-group">',
    '    <label for="inputDate" class="control-label">Time (yyyy-mm-dd hh:mm:ss offset)</label>',
    '    <div class="input-group">',
    '      <input type="text" class="form-control" data-hook="time" id="inputDate" placeholder="yyyy-mm-dd hh:mm:ss +0000">',
    '      <span class="input-group-btn">',
    '        <button class="btn btn-info" data-hook="zeroTimeOffset" type="button">Now</button>',
    '      </span>',
    '    </div>',
    '  </div>',
    '  ',
    '  <div class="form-group">',
    '    <label for="inputLatitude" class="control-label">Latitude (decimal degrees)</label>',
    '    <input type="text" class="form-control" name="latitude" data-hook="latitude" id="inputLatitude" value="48.15">', // min="-90" max="90" step="0.05"
    '  </div>',
    '  ',
    '  <div class="form-group">',
    '    <label for="inputLongitude" class="control-label">Longitude (decimal degrees)</label>',
    '    <input type="text" class="form-control" data-hook="longitude" id="inputLongitude" value="11.567">', // min="-180" max="180" step="0.05"
    '  </div>',
    '  ',
    '  <div class="form-group">',
    '    <label for="inputHeight" class="control-label">Height (above ellipsoid)</label>',
    '    <input type="text" class="form-control" data-hook="height" id="inputHeight" value="520.0">', // min="-6378136" max="20000000"
    '  </div>',
    // '  ',
    // '  <div class="form-group">',
    // '    <label class="control-label">Transitions',
    // '      <input type="checkbox" data-hook="animation">',
    // '    </label>',
    // '  </div>',
    // '  <div class="form-group">',
    // '    <label class="control-label">Update rate',
    // '      <input type="number" data-hook="update-rate" value=2 min=1 max=60 step=1>',
    // '    </label>',
    // '  </div>',
    '  ',
    '  <div class="form-group">',
    // '    <button type="button" class="btn btn-primary" data-hook="calculate">Calculate Positions</button>',
    '    <button type="button" class="btn btn-info" data-hook="locate">Locate Me</button>',
    '  </div>',
    '  ',
    '</form>'
  ].join('\n'),

  bindings: {

    'model.time': {
      type: function (el, value, prevValue) {

        if ( el === document.activeElement ) return;

        if ( app.user.animation ) {

          d3.select(el)
            .interrupt().transition()
            .duration(app.user.pulseRate)
            .ease('linear')
            .tween('value', function () {
              var interpolate = d3.interpolateNumber(value, value+app.user.pulseRate);
              return function (t) {
                this.value = moment.utc( interpolate(t) ).format('YYYY-MM-DD HH:mm:ss ZZ');
              }
            });

        } else {

          el.value = moment.utc( value ).format('YYYY-MM-DD HH:mm:ss ZZ');

        }

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

  },

  getUserLocation: function () {
    app.user.getUserLocation();
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
    this.renderWithTemplate();
  }

});
