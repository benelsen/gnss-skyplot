/* global app */

/* Polyfills */
import 'fetch';
import '6to5/polyfill';

/* Logging */
localStorage.debug = ['localhost', 'dev'].indexOf(document.domain) !== -1 ? true : false;
import * as bows from 'bows';
var log = bows('App');

import * as domReady from 'domready';

import Satellites from './models/satellites';
import User from './models/user';

import MainView from './pages/home';

var app = {

  inititalize: function () {

    window.app = this;

    this.user = new User();
    this.satellites = new Satellites();
    this.satellites.load()
      .catch(function (err) {
        log.error( err, err.stack );
        throw err;
      });

    domReady( () => {

      this.mainView = new MainView({
        el: document.querySelector('body')
      });

      this.mainView.render();

    });

  }

}

app.inititalize();

export default app;
