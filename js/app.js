
/* Polyfills and Shims */
import 'es5-shim/es5-shim'; // +13kb
import 'babel/polyfill'; // +26kb
import 'isomorphic-fetch';

/* Logging */
import bows from 'bows';
var log = bows('App');

/* Imports */
import app from 'ampersand-app';
import domReady from './lib/domreadyPromise';

/* Models */
import Satellites from './models/satellites';
import User from './models/user';

/* Views */
import MainView from './views/main';

// Expose app as globel when debugging.
if ( localStorage && localStorage.debug ) {
  window.app = app;
}

app.extend({

  user: new User(),
  satellites: new Satellites(),

  /**
   * Starting point for the app
   */
  initialize () {

    // Wait until the DOM is ready to build the UI.
    domReady().then( () => {

      this.mainView = new MainView({
        el: document.querySelector('div.cont')
      });

      this.mainView.render();

    });

    // Load user settings and satellite ephemerides before
    Promise.all([
      this.user.load(),
      this.satellites.load(),
      domReady()
    ])
    .then( (result) => {

      // If hash/fragment contains a location then use it (sync),
      // if not try to get it from the browser (async)
      if ( !this.user.setLocationFromHash() ) {

        this.user.getLocationFromAPI().then(() => {
          this.satellites.at(0).selected = true;
        });

      }

      this.satellites.reset(result[1].satellites);
      log.info('Added ephemerides');

      // Start updating
      this.startPulse();

      this.satellites.save();
      this.satellites.at(0).selected = true;

    });

  },

  /**
   * Starts an interval timer that sends an event every x milliseconds to
   * recalculate the satellites position and update the UI.
   */
  startPulse () {

    if ( this.pulsar ) {
      this.stopPulse();
    }

    this.pulsar = setInterval( () => {
      this.trigger('pulse');
      this.user.trigger('change:time');
    }, this.user.pulseRate);

  },

  /**
   * Stop sending out the update event.
   */
  stopPulse () {
    clearInterval( this.pulsar );
  }

});

/* Blast-off! */
app.initialize();
