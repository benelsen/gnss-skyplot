
/* Logging */
import * as bows from 'bows';
var log = bows('Skyplot');

import * as View from 'ampersand-view';

import * as d3 from 'd3';
import * as orb from 'orbjs';

window.orb = orb;

var GPS_EPOCH_0 = new Date('1980-01-06T00:00:00.000Z').getTime();

export default View.extend({

  template: function (context) {
    var html = [
      '<svg data-hook="skyplot">',
      '</svg>',
    ].join('\n');

    return html;
  },

  events: {
  },

  initialize: function () {

    this.projection = d3.geo.projection(flippedStereographic)
      .clipAngle(179)
      .rotate([0, -90])
      .precision(.1);

    var projection = this.projection;

    this.path = d3.geo.path()
      .projection(this.projection);

    var svg = d3.select(this.el);

    svg.append("path")
        .datum(d3.geo.circle().origin([0, 90]).angle(90))
        .attr("class", "horizon");

    svg.append("path")
        .datum(d3.geo.graticule())
        .attr("class", "graticule");

    // Azimuth Ticks
    var ticksAzimuth = svg.append("g")
        .attr("class", "ticks ticks--azimuth");

    ticksAzimuth.selectAll("line")
        .data(d3.range(360))
      .enter().append("line");

    ticksAzimuth.selectAll("text")
        .data(d3.range(0, 360, 10))
      .enter().append("text")
        .attr("dy", ".35em")
        .text(function(d) {
          return d === 0 ? "N" : d === 90 ? "E" : d === 180 ? "S" : d === 270 ? "W" : d + "°";
        });

    // Elevation Ticks
    svg.append('g')
        .attr('class', 'ticks ticks--elevation')
      .selectAll('text')
        .data(d3.range(10, 90, 10))
        .enter().append('text');

    // Satellites
    svg.append('g')
        .attr('class', 'satellites')
      .selectAll('g.satellite')
        .data(this.collection)
      .enter().append('g')
        .attr('class', 'satellite');

    window.addEventListener('resize', this.render.bind(this), false );

    this.collection.on('reset', this.updateSatellites.bind(this) );

    this.collection.on('change', (satellite) => {

      var el = d3.select('g.satellites g.satellite[data-prn=prn'+satellite.prn+']');
      updateSat.call(el, satellite, this.projection, this.path);

      // updateOrbitalPath.call(el, satellite, this.projection, this.path);
    });

    svg.on('click', function (e) {
      svg.select('g.satellites .highlight').classed('highlight', false)
         .select('g.position circle').attr('r', 3);
    });

  },

  updateSatellites: function () {

    log('update all');

    var projection = this.projection;
    var path = this.path;
    var svg = d3.select(this.el);

    // Select all the satellite gs
    var satellites = svg.select('g.satellites')
        .selectAll('g.satellite')
          .data(this.collection.models, function (d) {
            return d.prn;
          });

    // Remove satellites
    satellites.exit().remove();

    // Create new satellites
    satellites.enter().append('g')
        .attr('class', function (d) {
          return 'satellite';
        })
        .attr('data-prn', function (d) {
          return 'prn' + d.prn;
        })
        .each(function (d) {

          var sat = d3.select(this);

          sat.append('path')
            .attr('class', 'future');

          sat.append('path')
            .attr('class', 'past');

          sat.append('g')
            .attr('class', 'ticks ticks--time');

          var position = sat.append('g')
            .attr('class', 'position');

          position
            .append('circle')
            .attr('r', 3);

          position
            .append('text')
            .attr("dy", "1.2em")
            .attr("dx", "0.5em")
            .text( d.prn );

          setInterval( updateOrbitalPath.bind(sat, d, projection, path), 60e3 );

        })
        .on('mouseenter', function () {
          d3.select(this).classed('highlight', true)
            .select('g.position circle').attr('r', 4);
        })
        .on('mouseleave', function () {
          d3.select(this).classed('highlight', false)
            .select('g.position circle').attr('r', 3);
        })
        .on('click', function () {
          d3.selectAll('g.satellites .highlight').classed('highlight', false)
            .select('g.position circle').attr('r', 3);

          d3.select(this).classed('highlight', true)
            .select('g.position circle').attr('r', 4);
        });


    satellites
      .classed('invisible', function (d) {
        return d.elevation < -10;
      })
      .each(function (d) {
        updateSat.call(d3.select(this), d, projection, path);
        updateOrbitalPath.call(d3.select(this), d, projection, path);
      });

  },

  render: function (e) {

    log('render', e);

    var {width, height} = this.el.getClientRects()[0];

    var scale = Math.min(width,height) * .44;

    var projection = this.projection
      .scale(scale)
      .translate([width / 2 + .5, height / 2 + .5]);

    var svg = d3.select(this.el);

    svg.select('path.graticule').attr('d', this.path);
    svg.select('path.horizon').attr('d', this.path);

    var ticksAzimuth = svg.select('g.ticks.ticks--azimuth');

    ticksAzimuth.selectAll('line')
        .each(function(d) {
          var p0 = projection([d, 0]),
              p1 = projection([d, d % 10 ? -1 : -2]);

          d3.select(this)
            .attr('x1', p0[0]).attr('y1', p0[1])
            .attr('x2', p1[0]).attr('y2', p1[1]);
        });

    ticksAzimuth.selectAll('text')
        .each(function(d) {
          var p = projection([d, -5]);

          d3.select(this)
            .attr('x', p[0])
            .attr('y', p[1]);
        })
        .attr('transform', function (d) {

          var r = d % 90 === 0 ? 0 : ( (d+90) % 180 ) - 90;

          return 'rotate(' + r + ', ' + d3.select(this).attr('x') + ', ' + d3.select(this).attr('y') + ')';
        });

    svg.selectAll('g.ticks.ticks--elevation text')
        .each(function(d) {
          var p = projection([0, d]);

          d3.select(this)
              .attr('x', p[0])
              .attr('y', p[1]);
        })
        .attr('dy', '.35em')
        .text(function(d) { return d + '°'; });

    this.updateSatellites();

  },

});

function flippedStereographic(λ, φ)  {
  var cosλ = Math.cos(λ),
      cosφ = Math.cos(φ),
      k = 1 / (1 + cosλ * cosφ);
  return [
    k * cosφ * Math.sin(λ),
    -k * Math.sin(φ)
  ];
}

function updateSat (satellite, projection, path) {

  // log('update', satellite.prn);

  this.select('g.position')
    .attr('transform', function () {

      var p = projection([satellite.azimuth, satellite.elevation]);
      return 'translate(' + p[0] + ', ' + p[1] + ')';

    })
    .select('circle')
      .attr('fill', function () {
        return satellite.health === 0 ? '#009900' : '#ff3300';
      });

}

function updateOrbitalPath (satellite, projection, path) {

  // log('update path', satellite.prn);

  var prev = new Date( app.user.time - 1 * satellite.period * 1e3 );
  var now  = new Date( app.user.time );
  var next = new Date( app.user.time + 1 * satellite.period * 1e3 );

  var positions = d3.time.minutes(prev, next, 10)
    .concat([prev, now, next])
    .sort()
    .map(function (time) {

      var t = orb.time.UTCtoGPS( time.getTime() / 1000 ) - GPS_EPOCH_0 / 1000;
      var p = satellite.topocentricPosition(t, false);

      return {
        time: time,
        position: [p.azimuth, p.elevation]
      };
    });

  this.select('path.future')
    .datum({
      type: "LineString",
      coordinates: positions.filter((t) => t.time >= now).map((t) => t.position)
    })
    .attr('d', path);

  this.select('path.past')
    .datum({
      type: "LineString",
      coordinates: positions.filter((t) => t.time <= now).map((t) => t.position)
    })
    .attr('d', path);

  var hours = positions.filter(function (p) {
    return p.time.getTime() % 3600e3 === 0;
  }).map(function (p) {
    p.projected = projection( p.position );
    return p;
  });

  var timeFormat = d3.time.format.utc('%H:%M');

  var timeTicks = this.select('g.ticks.ticks--time');

  timeTicks.selectAll('circle')
    .data( hours )
    .enter()
    .append('circle')
    .attr('r', 3);

  timeTicks.selectAll('circle').attr('transform', function (h) {
    return 'translate(' + h.projected[0] + ', ' + h.projected[1] + ')';
  });

  timeTicks.selectAll('text')
    .data( hours )
    .enter()
    .append('text')
    .attr('x', '0.5em')
    .text(function (h) {
      return timeFormat(h.time);
    });

  timeTicks.selectAll('text').attr('transform', function (h) {
    return 'translate(' + h.projected[0] + ', ' + h.projected[1] + ')';
  });

}

