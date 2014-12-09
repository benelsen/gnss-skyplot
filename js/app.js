/* global app */

/* Polyfills */
import 'fetch';
import '6to5/polyfill';

/* Logging */
try {
  localStorage.debug = true; //['localhost', 'dev'].indexOf(document.domain) !== -1 ? true : false;
} catch(e) {
  console.info(e);
}
import * as bows from 'bows';
var log = bows('App');

import * as domReady from 'domready';
import * as AmpersandState from 'ampersand-state';

import Satellites from './models/satellites';
import User from './models/user';

import MainView from './pages/home';

var app = {

  inititalize: function () {

    window.app = this;

    // window.onerror = function (err) {
    //   console.error(err);
    //   console.error(err.stack);
    // }

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
      this.satellites.load.call(this.satellites)
    ])
    .then( (result) => {

      var ephemerides = result[1];

      this.satellites.reset(ephemerides.satellites);
      log.info('Added ephemerides');

      this.satellites.save();

    })
    .catch(function (err) {
      throw err;
    });

  }

}

app.inititalize();

export default app;
