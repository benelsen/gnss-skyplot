
/* Logging */
import bows from 'bows';
var log = bows('Home');

import View from 'ampersand-view';

import SkyplotView from '../views/skyplot';
import SatelliteListView from '../views/satelliteList';
import SettingsView from '../views/settings';
import DOPView from '../views/dop';

export default View.extend({

  pageTitle: 'home',

  initialize: function () {

    this.skyplotView = new SkyplotView({
      el: this.queryByHook('skyplot'),
      collection: app.satellites
    });

    this.listView = new SatelliteListView({
      el: document.querySelector('table[data-hook=satellite-list]'),
      collection: app.satellites
    });

    this.settingsView = new SettingsView({
      el: document.querySelector('[data-hook=form]'),
      model: app.user
    });

    this.dopView = new DOPView({
      el: document.querySelector('[data-hook=dop]'),
      model: app.user
    });

  },

  render: function () {

    log('render');

    this.registerSubview(this.skyplotView);
    this.skyplotView.render();

    this.registerSubview(this.listView);
    this.listView.render();

    this.registerSubview(this.settingsView);
    this.settingsView.render();

    this.registerSubview(this.dopView);
    this.dopView.render();

  }

});
