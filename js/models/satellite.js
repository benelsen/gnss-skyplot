
/* Logging */
import * as bows from 'bows';
var log = bows('Satellite');

import * as AmpersandState from 'ampersand-state';
import * as orb from 'orbjs';

export default AmpersandState.extend({

  props: {

    t0: 'number', // epoch (GPS Time) of right ascension
    T0: 'number', // epoch (GPS Time) of ephemeris
    week: 'number', // GPS Week
    toa: 'number', // Time of Applicability (seconds since begin of week)

    system: 'string',
    prn: 'any',
    svn: 'any',
    config: 'string',
    ura: 'number',
    eccentricity: 'number',
    inclination: 'number',
    rightAscensionDot: 'number',
    semimajorAxis: 'number',
    rightAscension: 'number',
    argumentOfPeriapsis: 'number',
    meanAnomaly: 'number',
    clockBias: 'number',
    clockDrift: 'number',
    health: 'number',

  },

  session: {

    azimuth: {
      type: 'number', default: 0
    },

    elevation: {
      type: 'number', default: 0
    },

    range: {
      type: 'number', default: 0
    },

    topocentric: {
      type: 'array'
    }

  },

  derived: {

    period: {
      deps: ['semimajorAxis'],
      fn: function () {
        return 2 * Math.PI * Math.sqrt( Math.pow( this.semimajorAxis, 3) / orb.constants.earth.GM );
      }
    },

    visible: {
      deps: ['elevation'],
      fn: function () {
        return this.elevation > 0;
      }
    },

    elevationApparent: {
      deps: ['elevation'],
      fn: function () {
        // Sæmundsson, Þorsteinn (1986)
        // https://en.wikipedia.org/wiki/Atmospheric_refraction#Calculating_refraction
        return this.elevation + 1.02 / Math.tan( this.elevation + 10.3 / (this.elevation + 5.11) ) / 60;
      }
    }

  },

  initialize: function () {

    this.topocentricPosition(null, true);

  },

  topocentricPosition: function (t, set, quiet) {

    if ( !t ) {
      t = app.user.gpsTime;
    }

    var obs = [
      orb.common.deg2rad( app.user.position[0] ),
      orb.common.deg2rad( app.user.position[1] ),
      app.user.position[2]
    ];

    // All elements of the almanac are expressed relative to epoch T0,
    // except the right ascension which is relative to t0.
    // Calculate Right Ascension at epoch t
    var rightAscension = this.rightAscension + this.rightAscensionDot * (t - this.t0);

    // Position in Earth Centric Inertial frame (X,Y,Z)
    var xECI = orb.position.simple( this.semimajorAxis,
                                    this.eccentricity,
                                    this.inclination,
                                    rightAscension,
                                    this.argumentOfPeriapsis,
                                    t,
                                    this.T0,
                                    this.meanAnomaly )[0];

    // Position in Earth Centric Earth Fixed frame (X,Y,Z)
    var xECEF = orb.transformations.inertialToFixed(xECI, t - this.t0);

    // Position in Topocentric frame (X,Y,Z)
    var xTopo = orb.transformations.fixedToTopocentric(xECEF, obs, orb.constants.earth.wgs84.a, orb.constants.earth.wgs84.e);

    this.set('topocentric', xTopo, {silent: true});

    // Position in Horizontal frame (azimuth, elevation, distance)
    var xHorz = orb.transformations.topocentricToHorizontal(xTopo);

    var position = {
      azimuth: orb.common.rad2deg( xHorz[0] ),
      elevation: orb.common.rad2deg( xHorz[1] ),
      range: xHorz[2]
    };

    if ( set ) {
      this.set(position, {silent: quiet ? true : false});
    }

    return position;

  }

});
