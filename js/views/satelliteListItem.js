
/* Logging */
// import bows from 'bows';
// var log = bows('SatelliteListItem');

import View from 'ampersand-view';

import toggleClass from 'amp-toggle-class';

export default View.extend({

  template: [
    '<tr>',
    '  <td data-hook="prn" class="prn"></td>',
    '  <td data-hook="elevation" class="elevation"><span class="degrees"></span></td>',
    '  <td data-hook="azimuth" class="azimuth"><span class="degrees"></span></td>',
    '  <td data-hook="range" class="range"><span class="kilometre"></span></td>',
    '</tr>'
  ].join('\n'),

  bindings: {

    'model.prn': {
      hook: 'prn'
    },

    'model.healthy': {
      type: 'booleanClass',
      selector: 'tr',
      yes: 'healthy',
      no: 'unhealthy'
    },

    'model.visible': {
      type: 'booleanClass',
      selector: 'tr',
      yes: 'visible',
      no: 'invisible'
    },

    'model.selected': {
      type: 'booleanClass'
    },

    'model.elevation': {
      type: function (el, value, prevValue) {
        el.querySelector('span').textContent = value.toFixed(1);

        if ( Number.isFinite(value) && Number.isFinite(prevValue) ) {
          toggleClass(el, 'increase', value > prevValue);
          toggleClass(el, 'decrease', value < prevValue);
        }
      },
      hook: 'elevation'
    },

    'model.azimuth': {
      type: function (el, value, prevValue) {
        el.querySelector('span').textContent = value.toFixed(1);

        if ( Number.isFinite(value) && Number.isFinite(prevValue) ) {
          toggleClass(el, 'increase', value > prevValue);
          toggleClass(el, 'decrease', value < prevValue);
        }
      },
      hook: 'azimuth'
    },

    'model.range': {
      type: function (el, value, prevValue) {
        prevValue *= 1e-3;
        value *= 1e-3;
        el.querySelector('span').textContent = value.toFixed(0);

        if ( Number.isFinite(value) && Number.isFinite(prevValue) ) {
          toggleClass(el, 'increase', value > prevValue);
          toggleClass(el, 'decrease', value < prevValue);
        }
      },
      hook: 'range'
    }

  },

  events: {
    click: 'select'
  },

  render () {
    // log.info('render');
    this.renderWithTemplate();
  },

  select () {
    this.model.selected = !this.model.selected;
  }

});
