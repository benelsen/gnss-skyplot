
/* Logging */
import bows from 'bows';
var log = bows('User');

import AmpersandState from 'ampersand-state';
import localforage from 'localforage';
import orb from 'orbjs';

localforage.config({
  name: 'skyplot'
});

const GPS_EPOCH_0 = new Date('1980-01-06T00:00:00.000Z').getTime();

export default AmpersandState.extend({

  props: {

    position: {
      type: 'array',
      default: () => [0, 0, 0]
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

    metadata: {
      type: 'object',
    },

    dop: {
      type: 'object',
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

  initialize () {

    log.info('Initializing user');

    this.on('change:position', () => {
      app.trigger('change:position');
      this.save.bind(this);
    });

    this.on('change:timeOffset', () => {
      app.trigger('change:timeOffset');
    });

  },

  save () {

    log.info('Trying to save the user to local storage');

    return localforage.setItem( 'user', this.toJSON() )
      .then(function () {
        log.info('Saved user to local storage');
      });

  },

  load () {

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

  setLocationFromHash () {

    var locationMatch = /location=([\d.\-+]+)\,([\d.\-+]+)\,([\d.\-+]+)/.exec(document.location.hash);
    log.info('Location from hash:', locationMatch);
    if ( locationMatch ) {
      this.position = locationMatch.slice(1,4).map(Number);
      return true;
    }

    return false;

  },

  getLocationFromAPI () {

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
