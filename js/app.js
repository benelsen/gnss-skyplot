'use strict';

/* Polyfills */
import 'es5-shim/es5-shim';
import '6to5/polyfill';
import 'isomorphic-fetch';

/* Logging */
import bows from 'bows';
var log = bows('App');

import domReady from 'domready';

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
          this.user.getLocationFromAPI()
            .then(() => {
              this.satellites.at(0).selected = true;
            });
        }

        this.satellites.reset(result[1].satellites);
        log.info('Added ephemerides');

        this.satellites.save();
        this.satellites.at(0).selected = true;

      });

    });

  }

};

app.inititalize();

export default app;
