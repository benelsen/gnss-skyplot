
/* Logging */
import * as bows from 'bows';
var log = bows('User');

import * as AmpersandState from 'ampersand-state';
import * as localforage from 'localforage';
import * as orb from 'orbjs';

window.localforage = localforage;

localforage.config({
  name: 'skyplot'
});

// localforage.clear();

var GPS_EPOCH_0 = new Date('1980-01-06T00:00:00.000Z').getTime();

export default AmpersandState.extend({

  props: {

    position: {
      type: 'array',
      default: () => [0, 0, 0]
    },

    animation: {
      type: 'boolean',
      default: false
    }

  },

  session: {

    timeOffset: {
      type: 'number',
      default: 0
    },

    pulseRate: {
      type: 'number',
      default: 1000
    },

  },

  derived: {

    time: {
      deps: ['timeOffset'],
      cache: false,
      fn: function () {
        return Date.now() + this.timeOffset * 1000;
      }
    },

    gpsTime: {
      deps: ['time'],
      cache: false,
      fn: function () {
        return orb.time.UTCtoGPS( this.time / 1000 ) - GPS_EPOCH_0 / 1000;
      }
    },

    longitude: {
      deps: ['position'],
      fn: function () {
        return this.position[0];
      }
    },

    latitude: {
      deps: ['position'],
      fn: function () {
        return this.position[1];
      }
    },

    height: {
      deps: ['position'],
      fn: function () {
        return this.position[2];
      }
    },

  },

  initialize: function () {

    log.info('Initializing user');

    this.pulsar = setInterval( () => {
      this.trigger('pulse');
      this.trigger('change:time');
    }, this.pulseRate);

    this.on('change', this.save.bind(this));

    this.on('change:pulseRate', () => {

      clearInterval( this.pulsar );

      this.pulsar = setInterval( () => {
        this.trigger('pulse');
        this.trigger('change:time');
      }, this.pulseRate);

    });

  },

  save: function () {

    log.info('Trying to save the user to local storage');

    return localforage.setItem( 'user', this.toJSON() )
      .then(function () {
        log.info('Saved user to local storage');
      });

  },

  load: function () {

    log.info('Trying to load the user from local storage');

    return localforage.getItem('user')
      .then( (user) => {

        if ( user ) {
          this.set(user);
          log.info('Loaded user from local storage');
        } else {
          log.warn('Couldn’t find user in local storage');
        }

      })
      .catch(function (err) {
        log.warn('Error loading user from local storage', err.stack);
      });

  },

  getUserLocation: function () {

    log.info('Trying to get the user’s location from geolocation API');

    return getCurrentPosition()
      .then( (position) => {

        this.position = [
          position.coords.longitude,
          position.coords.latitude,
          position.coords.altitude || 0,
        ];

        log.info('Got the user’s location from geolocation API');

      })
      .catch(function (err) {
        log.warn('Couldn’t get user from geolocation API', err.stack);
      });

  }

});

function getCurrentPosition () {

  return new Promise(function (resolve, reject) {
    navigator.geolocation.getCurrentPosition(resolve, reject);
  });

}
