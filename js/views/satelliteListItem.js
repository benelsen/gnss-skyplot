
/* Logging */
import * as bows from 'bows';
var log = bows('SatelliteListItem');

import * as View from 'ampersand-view';
import * as d3 from 'd3';

export default View.extend({

  template: [
    '<tr>',
    '  <td data-hook="prn"></td>',
    '  <td data-hook="elevation" class="elevation"><span class="degrees"></span></td>',
    '  <td data-hook="azimuth" class="azimuth"><span class="degrees"></span></td>',
    '  <td data-hook="range" class="range"><span class="kilometre"></span></td>',
    '</tr>'
  ].join('\n'),

  bindings: {

    'model.prn': {
      hook: 'prn'
    },

    'model.visible':  {
      type: 'booleanClass',
      selector: 'tr',
      yes: 'visible',
      no: 'invisible'
    },

    'model.elevation': {
      type: function (el, value, prevValue) {

        var span = el.querySelector('span');

        if ( (!prevValue && prevValue !== 0) /*|| Math.abs( value - prevValue ) > 5*/ ) {
          return span.textContent = value.toFixed(1);
        }

        d3.select(el)
          .classed('inc', function () {
            return value > prevValue;
          });

        if ( app.user.animation ) {
          d3.select(span)
            .interrupt().transition()
            .duration(app.user.pulseRate-10)
            .ease('linear')
            .tween('text', tweenDegree.bind(span, value, prevValue, 1));
        } else {
          span.textContent = value.toFixed(1);
        }

      },
      hook: 'elevation'
    },

    'model.azimuth': {
      type: function (el, value, prevValue) {

        var span = el.querySelector('span');

        if ( (!prevValue && prevValue !== 0) /*|| Math.abs( value - prevValue ) > 5*/ ) {
          return span.textContent = value.toFixed(1);
        }

        d3.select(el)
          .classed('inc', function () {
            return value > prevValue;
          });

        if ( app.user.animation ) {
          d3.select(span)
            .interrupt().transition()
            .duration(app.user.pulseRate-10)
            .ease('linear')
            .tween('text', tweenDegree.bind(span, value, prevValue, 1));
        } else {
          span.textContent = value.toFixed(1);
        }

      },
      hook: 'azimuth'
    },

    'model.range': {
      type: function (el, value, prevValue) {

        prevValue *= 1e-3;
        value *= 1e-3;

        var span = el.querySelector('span');

        if ( (!prevValue && prevValue !== 0) ) {
          return span.textContent = value.toFixed(0);
        }

        d3.select(el)
          .classed('inc', function () {
            return value > prevValue;
          });

        if ( app.user.animation ) {
          d3.select(span)
            .interrupt().transition()
            .duration(app.user.pulseRate-10)
            .ease('linear')
            .tween('text', tweenDegree.bind(span, value, prevValue, 0));
        } else {
          span.textContent = value.toFixed(0);
        }

      },
      hook: 'range'
    },

  }

});

function tweenDegree (value, prevValue, precision) {
  var interpolate = d3.interpolateNumber(prevValue, value);
  return function (t) {
    this.textContent = interpolate(t).toFixed(precision);
  }
}
