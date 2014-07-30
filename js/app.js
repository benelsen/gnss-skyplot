'use strict';

var d3 = require('d3'),
    Matrix = require('sylvester').Matrix,
    orb = require('orbjs');

var almanac = {};

document.querySelector('button.calculate').onclick = draw;
document.querySelector('button.locate').onclick = getLocation;
document.querySelector('button.now').onclick = setTimeToNow;

getLocation();

var width = document.querySelector('.svg-container').getBoundingClientRect().width - 30,
    width = width > 600 ? 600 : width,
    height = width;

var projection = d3.geo.stereographic()
    .rotate([180, -90, 0])
    .clipAngle(90 + 1e-12)
    .scale(width/2.25)
    .translate([width / 2, height / 2])
    .precision(0.1);

var path = d3.geo.path()
    .projection(projection);

var svg = d3.select("svg.skyplot")
  .attr("width", width)
  .attr("height", height);

svg.append("path")
  .datum(d3.geo.graticule().step([15, 10]))
  .attr("class", "graticule minor")
  .attr("d", path);

svg.append("path")
  .datum(d3.geo.graticule().step([45, 30]))
  .attr("class", "graticule major")
  .attr("d", path);

var satelliteGroup = svg.append("g")
  .attr("class", "satellites");

var ticks = svg.append("g")
  .attr('class', 'ticks')
  .attr('transform', 'translate( '+ width / 2 +', '+ height / 2 +')');

ticks.append("text")
  .text('N')
  .attr('transform', 'translate( 0, -'+ (height / 2 / 1.10 ) +')')
  .attr('text-anchor',  'middle')
  .attr('dy', 0);

ticks.append("text")
  .text('E')
  .attr('transform', 'rotate(90)translate( 0, -'+ (height / 2 / 1.10) +')rotate(-90)')
  .attr('text-anchor',  'start')
  .attr('dy', 5);

ticks.append("text")
  .text('S')
  .attr('transform', 'rotate(180)translate( 0, -'+ (height / 2 / 1.10) +')rotate(-180)')
  .attr('text-anchor',  'middle')
  .attr('dy', 10);

ticks.append("text")
  .text('W')
  .attr('transform', 'rotate(270)translate( 0, -'+ (height / 2 / 1.10) +')rotate(-270)')
  .attr('text-anchor',  'end')
  .attr('dy', 5);

setTimeToNow();
draw();

function getLocation() {

  if ( navigator.geolocation ) {
    navigator.geolocation.getCurrentPosition(function(location) {

      document.querySelector('input.latitude').value = location.coords.latitude.toFixed(6);
      document.querySelector('input.longitude').value = location.coords.longitude.toFixed(6);
      document.querySelector('input.height').value = (location.coords.altitude || 0).toFixed(1);

      draw();

    }, function(err) {
    });
  }

}

var autoRefresh;
var utcOffset;

function draw() {
  var requestedTime = new Date( document.querySelector('input.datetime').value );

  refresh(requestedTime);

  return;

  // utcOffset = requestedTime.getTime() - Date.now();

  // if ( Math.abs(utcOffset < 1000) ) utcOffset = 0;

  // refresh(utcOffset);

  // clearInterval(autoRefresh);

  // autoRefresh = setInterval(function() {
  //   refresh(utcOffset);
  // }, 10000);

}

function refresh(utc) {

  // var utc = new Date( Date.now() + utcOffset );

  // document.querySelector('input.datetime').value = utc.getUTCFullYear() + '/' + pad(utc.getUTCMonth()+1, 2) +
  //   '/' + pad(utc.getUTCDate(), 2) + ' ' + pad(utc.getUTCHours(), 2) +
  //   ':' + pad(utc.getUTCMinutes(), 2) + ':' + pad(utc.getUTCSeconds(), 2) + ' +0000';

  // var t = ( utc.getTime() - new Date("1980-01-06T00:00:00.000Z").getTime() ) / 1000 + (orb.time.leapSeconds(utc) - 19);
  var t = orb.time.UTCtoGPS( utc.getTime() / 1000 ) - new Date("1980-01-06T00:00:00.000Z").getTime() / 1000;

  var B = +document.querySelector('input.latitude').value * Math.PI/180,
      L = +document.querySelector('input.longitude').value * Math.PI/180,
      h = +document.querySelector('input.height').value;

  loadAlmanac(t, function(err) {

    var toa = +almanac.toa,
        week = +almanac.gpsWeek;

    var t0 = week * 7*24*3600;
    var T0 = t0 + toa;

    almanac.satellites.forEach(function(d) {
      calculateTopoPosition(d, [L, B, h], t, t0, T0);
    });

    render(almanac);

    dop(almanac.satellites);

  });

}

function loadAlmanac(t, cb) {

  if ( !almanac.requestedFor || Math.abs( almanac.requestedFor - t ) > 3600 ) {

    d3.json('https://benelsen.com/gps-skyplot/api/almanac/'+ t, function(err, data) {
      almanac = data;
      almanac.requestedFor = t;
      cb(err);
    });

  } else {
    cb(null);
  }

}

function calculateTopoPosition(sat, obs, t, t0, T0) {

  var rightAscension = sat.rightAscension + sat.rightAscensionDot * (t - t0);

  sat.xECI = orb.position.simple( sat.semimajorAxis,
                                  sat.eccentricity,
                                  sat.inclination,
                                  rightAscension,
                                  sat.argumentOfPeriapsis,
                                  t,
                                  T0,
                                  sat.meanAnomaly )[0];

  sat.xECEF = orb.transformations.inertialToFixed(sat.xECI, t - t0);
  sat.xTopo = orb.transformations.fixedToTopocentric(sat.xECEF, obs, orb.constants.earth.wgs84.a, orb.constants.earth.wgs84.e);
  sat.xHorz = orb.transformations.topocentricToHorizontal(sat.xTopo);

  sat.xHorzDeg = {
    range: sat.xHorz[2],
    elevation: orb.common.rad2deg( sat.xHorz[1] ),
    azimuth: orb.common.rad2deg( sat.xHorz[0] )
  };

}

function dop(satellites) {

  var visibleSatellites = satellites.filter( function(sat) {
    return sat.xHorz[1] >= 0;
  });

  var c = visibleSatellites.map( function(sat) {

    var r = [];

    r.push(1);
    r.push( sat.xTopo[0] / sat.xHorz[2] );
    r.push( sat.xTopo[1] / sat.xHorz[2] );
    r.push( sat.xTopo[2] / sat.xHorz[2] );

    return r;

  });

  var A = Matrix.create(c),
      AT = A.transpose(),
      ATA = AT.multiply( A );

  var Q = ATA.inverse();

  var diag = Q.diagonal();

  var gdop = Math.sqrt( diag.e(1) + diag.e(2) + diag.e(3) + diag.e(4) ),
      pdop = Math.sqrt( diag.e(2) + diag.e(3) + diag.e(4) ),
      hdop = Math.sqrt( diag.e(2) + diag.e(3) ),
      vdop = Math.sqrt( diag.e(4) ),
      tdop = Math.sqrt( diag.e(1) );

  if ( gdop > 10 ) {
    document.querySelector('table.dop > tbody td.gdop').classList.remove('warning');
    document.querySelector('table.dop > tbody td.gdop').classList.add('danger');
  } else if ( gdop > 5 ) {
    document.querySelector('table.dop > tbody td.gdop').classList.remove('danger');
    document.querySelector('table.dop > tbody td.gdop').classList.add('warning');
  } else {
    document.querySelector('table.dop > tbody td.gdop').classList.remove('danger');
    document.querySelector('table.dop > tbody td.gdop').classList.remove('warning');
  }

  document.querySelector('table.dop > tbody td.gdop').innerHTML = gdop.toFixed(2);
  document.querySelector('table.dop > tbody td.pdop').innerHTML = pdop.toFixed(2);
  document.querySelector('table.dop > tbody td.hdop').innerHTML = hdop.toFixed(2);
  document.querySelector('table.dop > tbody td.vdop').innerHTML = vdop.toFixed(2);
  document.querySelector('table.dop > tbody td.tdop').innerHTML = tdop.toFixed(2);

}

function render(data) {

  var sats = satelliteGroup.selectAll(".satellite")
      .data( data.satellites );

  sats
    .transition()
      .duration(750)
      .style("opacity", function(d) {
        if ( d.xHorzDeg.elevation > 0 ) {
          return 1;
        } else {
          return 0;
        }
      })
      .attr("transform", function(d) {
        var ele = d.xHorzDeg.elevation < -2.5 ? -2.5 : d.xHorzDeg.elevation;
        var xy = projection([ -d.xHorzDeg.azimuth, ele ]);
        return "translate(" + xy[0] + "," + xy[1] + ")";
      });

  var groups = sats.enter()
      .append("g")
      .attr("class", "satellite")
      .style("opacity", function(d) {
        if ( d.xHorzDeg.elevation > 0 ) {
          return 1;
        } else {
          return 0;
        }
      })
      .attr("transform", function(d) {
        var ele = d.xHorzDeg.elevation < -2.5 ? -2.5 : d.xHorzDeg.elevation;
        var xy = projection([ -d.xHorzDeg.azimuth, ele ]);
        return "translate(" + xy[0] + "," + xy[1] + ")";
      });

  groups.append("circle")
    .attr("r", 4)
    .attr("fill", function(d) {
      return d.health === 0 ? '#336433' : '#762727';
    });

  groups.append("text")
    .attr("x", 5)
    .attr("y", -5)
    .text(function(d) {
      return d.prn;
    });

  sats.exit()
    .transition()
      .duration(750)
      .style("opacity", 1e-6)
      .remove();

  document.querySelector('table.horizontal > tbody').innerHTML = '';

  data.satellites
    .filter(function(d) {
      return d.xHorzDeg.elevation > 0;
    })
    .forEach( function(d) {

      var tr = document.createElement('tr');
      tr.innerHTML = '<td>'+ d.prn +'</td><td>'+ d.xHorzDeg.elevation.toFixed(2) +'º</td><td>'+ d.xHorzDeg.azimuth.toFixed(2) +'º</td>';
      document.querySelector('table.horizontal > tbody').appendChild(tr);

    });

}

function setTimeToNow() {
  var now = new Date();
  document.querySelector('input.datetime').value = now.getUTCFullYear() + '/' + pad(now.getUTCMonth()+1, 2) +
    '/' + pad(now.getUTCDate(), 2) + ' ' + pad(now.getUTCHours(), 2) +
    ':' + pad(now.getUTCMinutes(), 2) + ':' + pad(now.getUTCSeconds(), 2) + ' +0000';
}

function pad(v, l) {
  var s = v.toString();
  while ( s.length < l ) {
    s = '0' + s;
  }
  return s;
}
