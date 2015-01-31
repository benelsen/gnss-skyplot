
/* Logging */
import bows from 'bows';
var log = bows('Satellites');

import Collection from 'ampersand-collection';
import localforage from 'localforage';

import * as matrix from './../lib/matrix';

import app from 'ampersand-app';

import Satellite from './satellite';

export default Collection.extend({

  mainIndex: 'prn',
  model: Satellite,

  sortBy: {
    field: 'elevation',
    direction: 1
  },

  deselect () {

    this.forEach(function (satellite) {
      satellite.selected = false;
    });

  },

  initialize () {

    this.on('change:selected', (model, value) => {

      if ( !value ) {
        return;
      }

      this.forEach(function (satellite) {
        if ( satellite.selected && model.cid !== satellite.cid ) {
          satellite.selected = false;
        }
      });

    });

    this.setSortMode('elevation');

    this.on('reset', () => {
      log.info('Collection reset event', this.toJSON());
      this.update();
    });

    app.on('pulse', () => {
      this.update( app.user.gpsTime + app.user.pulseRate / 1000 );
      this.trigger('change:time');
    });

    app.on('user:change:position', (e) => {
      log.info('User position change event', e);
      this.update();
    });

    app.on('user:change:timeOffset', (e) => {
      log.info('User timeOffset change event', e);

      this.fetch()
        .then( (ephemerides) => {
          this.reset(ephemerides.satellites);
        })
        .catch(function (err) {
          log.warn('Couldn’t load ephemerides from API', err.stack);
        });

    });

  },

  update (t, silent) {

    // log.info('Calculating', app.user.gpsTime, t, silent);

    this.forEach( function (s) {
      s.topocentricPosition( t, true, silent );
    });
    this.sort();

    this.dop();

  },

  dop () {

    if ( this.length === 0 ) return;

    let U = [];

    this.forEach(function (sat) {

      if ( sat.elevation < 0 || !sat.healthy ) return;

      let x = sat.topocentric;
      let r = sat.range;

      U.push([ 1, x[0] / r, x[1] / r, x[2] / r ]);

    });

    let dop = matrix.invert( matrix.mult(matrix.transpose(U), U) );

    app.user.dop = {
      gdop: Math.sqrt( dop[0][0] + dop[1][1] + dop[2][2] + dop[3][3] ),
      tdop: Math.sqrt( dop[0][0] ),
      pdop: Math.sqrt( dop[1][1] + dop[2][2] + dop[3][3] ),
      hdop: Math.sqrt( dop[1][1] + dop[2][2] ),
      vdop: Math.sqrt( dop[3][3] ),
      xdop: Math.sqrt( dop[1][1] ),
      ydop: Math.sqrt( dop[2][2] )
    };

  },

  comparator (a, b) {
    return (a[this.sortBy.field] > b[this.sortBy.field] ? 1 : -1) * this.sortBy.direction;
  },

  setSortMode (field, direction) {

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

  save () {

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

  load () {

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

  fetch () {

    var url = 'https://benelsen.com/gps-skyplot/api/almanac/';

    if ( app.user.timeOffset !== 0 ) {
      url += app.user.gpsTime;
    }

    return fetch( url )
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
    p = '0';
  }

  x = x.toString();

  return p.repeat( n - x.length ) + x;

}
