
/* Logging */
import * as bows from 'bows';
var log = bows('Satellites');
import * as Collection from 'ampersand-collection';
import * as localforage from 'localforage';

import Satellite from './satellite';

export default Collection.extend({

  mainIndex: 'prn',
  model: Satellite,

  sortBy: {
    field: 'elevation',
    direction: 1
  },

  initialize: function () {

    this.setSortMode('elevation');

    this.on('reset', () => {
      log.info('Collection reset event', this.toJSON());
      this.update();
    });

    app.user.on('pulse', () => {
      // log.info('Pulse');
      this.update( app.user.gpsTime + app.user.pulseRate / 1000 );
      this.trigger('change:time');
    });

    app.user.on('change:position', (e) => {
      log.info('User position change event', e);
      this.update();
    });

    app.user.on('change:timeOffset', (e) => {
      log.info('User timeOffset change event', e);

      this.fetch()
      .then( (ephemerides) => {
        this.reset(ephemerides.satellites);
      });

    });

  },

  update: function (t, silent) {

    // log.info('Calculating', app.user.gpsTime, t, silent);

    this.forEach( function (s) {
      s.topocentricPosition( t, true, silent );
    });
    this.sort();

  },

  comparator: function (a, b) {
    return (a[this.sortBy.field] > b[this.sortBy.field] ? 1 : -1) * this.sortBy.direction;
  },

  setSortMode: function (field, direction) {

    if ( !['elevation', 'azimuth', 'prn'].indexOf(field) ) {
      field = 'elevation';
    }

    if ( this.sortBy.field === field ) {
      this.sortBy.direction *= -1;
    } else {
      this.sortBy.field = field;
      this.sortBy.direction = 1;
    }

    if ( direction ) {
      this.sortBy.direction = direction;
    }

  },

  save: function () {

    log.info('Trying to save ephemerides to local storage');

    var data = {
      epoch: this.at(0).T0,
      satellites: this.toJSON()
    };

    return localforage.setItem('ephemerides', data)
      .then(function () {
        log.info('Saved ephemerides to local storage');
      });

  },

  load: function () {

    log.info('Trying to load ephemerides from local storage');

    return localforage.getItem('ephemerides')
      .catch( (err) => {
        log.error('Error while loading from local storage:', err);
      })
      .then( (ephemerides) => {

        if ( ephemerides && ephemerides.length !== 0 && Math.abs( app.user.gpsTime - ephemerides.epoch ) < 86400 ) {

          log.info('Loaded ephemerides from local storage', 'Age', Math.abs( app.user.gpsTime - ephemerides.epoch ), ephemerides);
          return ephemerides;

        }

        log.warn('Couldn’t load ephemerides from local storage');
        log.info('Trying to load ephemerides from API');

        return this.fetch()
          .catch(function (err) {

            log.warn('Couldn’t load ephemerides from API', err.stack);

            if ( ephemerides && ephemerides.length !== 0 ) {
              log.info('Using outdated ephemerides from local storage');
              return ephemerides;
            }

            throw err;

          });

      })
      .then( (ephemerides) => {

        if ( !ephemerides || ephemerides.length === 0 ) {
          throw new Error('Failed to load ephemerides');
        }

        log.info('Loaded ephemerides');

        return ephemerides;

      });

  },

  fetch: function () {

    return fetch( 'https://benelsen.com/gps-skyplot/api/almanac/' + app.user.gpsTime )
      .then( function ( response ) {
        return response.json();
      })
      .then( (ephemerides) => {

        var t0 = ephemerides.gpsWeek * 604800;
        var T0 = t0 + ephemerides.toa;

        ephemerides.satellites.forEach(function (sat) {

          sat.t0 = t0;
          sat.T0 = T0;
          sat.week = ephemerides.gpsWeek;
          sat.toa = ephemerides.toa;
          sat.year = ephemerides.year;
          sat.epoch = ephemerides.epoch;
          sat.prn = 'G' + pad(sat.prn, 2);

        });

        log.info('Fetched from API');

        return ephemerides;

      });

  },

});

function pad(x, n, p) {

  if ( !p ) {
    p = '0'
  }

  x = x.toString();

  return p.repeat( n - x.length ) + x;

}
