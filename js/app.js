/* global app */

/* Polyfills */
import '6to5/polyfill';
import 'isomorphic-fetch';

/* Logging */
try {

  if ( ['localhost', 'dev', '.local'].indexOf(document.domain) !== -1 ) {
    localStorage.setItem('debug', true);
  } else {
    localStorage.removeItem('debug');
  }

} catch(e) {
  console.info(e);
}

import * as bows from 'bows';
var log = bows('App');

import * as domReady from 'domready';
import * as AmpersandState from 'ampersand-state';

import Satellites from './models/satellites';
import User from './models/user';

import MainView from './views/main';

var app = {

  inititalize: function () {

    window.app = this;

    this.user = new User();
    this.satellites = new Satellites();

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
          this.user.getLocationFromAPI();
        }

        this.satellites.reset(result[1].satellites);
        log.info('Added ephemerides');

        this.satellites.save();

      });

    });

  }

}

app.inititalize();

export default app;
