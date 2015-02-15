'use strict';

/* Polyfills */
import 'es5-shim/es5-shim';
import 'babel/polyfill';
import 'isomorphic-fetch';

/* Logging */
import bows from 'bows';
var log = bows('App');

import domReady from 'domready';

import app from 'ampersand-app';

import Satellites from './models/satellites';
import User from './models/user';

import MainView from './views/main';

if ( localStorage && localStorage.debug ) {
  window._app = app;
}

app.extend({

  user: new User(),
  satellites: new Satellites(),

  initialize () {

    domReady( () => {

      this.mainView = new MainView({
        el: document.querySelector('div.cont')
      });

      this.mainView.render();

    });

    Promise.all([
      this.user.load(),
      this.satellites.load()
    ])
    .then( (result) => {

      domReady( () => {

        if ( ! this.user.setLocationFromHash() ) {
          this.user.getLocationFromAPI()
            .then(() => {
              this.satellites.at(0).selected = true;
            });
        }

        this.satellites.reset(result[1].satellites);
        log.info('Added ephemerides');

        this.startPulse();

        this.satellites.save();
        this.satellites.at(0).selected = true;

      });

    });

  },

  startPulse () {

    if ( this.pulsar ) {
      this.stopPulse();
    }

    this.pulsar = setInterval( () => {
      this.trigger('pulse');
      this.user.trigger('change:time');
    }, this.user.pulseRate);

  },

  stopPulse () {
    clearInterval( this.pulsar );
  },

});

app.initialize();
