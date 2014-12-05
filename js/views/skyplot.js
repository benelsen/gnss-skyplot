
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
      .clipAngle(100+1e-2)
      .rotate([0, -90])
      .precision(.1);

    this.path = d3.geo.path()
      .projection(this.projection);

    var svg = d3.select(this.el);

    svg.append("path")
        .datum(d3.geo.circle().origin([0, 90]).angle(90))
        .attr("class", "horizon");

    svg.append("path")
        .datum(d3.geo.graticule())
        .attr("class", "graticule");

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

    svg.append("g")
        .attr("class", "ticks ticks--elevation")
      .selectAll("text")
        .data(d3.range(10, 91, 10))
        .enter().append("text");

    svg.append('g')
        .attr('class', 'satellites')
      .selectAll('g.satellite')
        .data(this.collection)
      .enter().append('g')
        .attr('class', 'satellite');

    window.addEventListener('resize', this.render.bind(this) );

    this.collection.on('reset', this.updateSatellites.bind(this) );

    this.collection.on('change', this.updateSatellite.bind(this));

  },

  updateSatellite: function (sat) {

    // log('update', sat.prn);

    var projection = this.projection;
    var path = this.path;
    var svg = d3.select(this.el);

    var satellite = svg.select('g.satellites g.satellite[data-prn=prn'+sat.prn+']')
      .datum(sat)
      .classed('invisible', function (d) {
        return d.elevation < -10;
      });

    satellite.select('.position')
      .attr('transform', function (d) {

        var p = projection([d.azimuth, d.elevation]);
        return 'translate(' + p[0] + ', ' + p[1] + ')';

      });

    var start = new Date( app.user.time - 0.05 * sat.period * 1e3 );
    var end   = new Date( app.user.time + 0.2  * sat.period * 1e3 );

    satellite.select('path')
      .datum({
        type: "LineString",
        coordinates: d3.time.minutes(start, end, 10).map(function (date) {

          var t = orb.time.UTCtoGPS( date.getTime() / 1000 ) - GPS_EPOCH_0 / 1000;

          var p = sat.topocentricPosition(t, false);
          return [p.azimuth, p.elevation];

        })
      })
      .attr('d', path);

  },

  updateSatellites: function () {

    log('update all');

    var projection = this.projection;
    var path = this.path;
    var svg = d3.select(this.el);

    var satellites = svg.select('g.satellites')
        .selectAll("g.satellite")
          .data(this.collection.models, function (d) {
            return d.prn;
          });

    satellites.exit().remove();
    satellites.enter().append('g')
        .attr('class', function (d) {
          return 'satellite';
        })
        .attr('data-prn', function (d) {
          return 'prn' + d.prn;
        })
        .each(function (d) {

          d3.select(this)
            .append('path');

          var position = d3.select(this)
            .append('g')
            .attr('class', 'position');

          position
            .append('circle')
            .attr('r', 4);

          position
            .append('text')
            .attr("dy", "1.2em")
            .text( d.prn );



        })
        .on('mouseenter', function (e) {
          d3.select(this).classed('highlight', true);
        })
        .on('mouseleave', function (e) {
          d3.select(this).classed('highlight', false);
        })
        .on('click', function (e) {
          d3.select(this).classed('highlight', true);
        });

    satellites
      .classed('invisible', function (d) {
        return d.elevation < -10;
      })
      .each(function (d) {

        var start = new Date( app.user.time - 0.05 * d.period * 1e3 );
        var end   = new Date( app.user.time + 0.2  * d.period * 1e3 );

        d3.select(this).select('path')
          .datum({
            type: "LineString",
            coordinates: d3.time.minutes(start, end, 10).map(function (date) {

              var t = orb.time.UTCtoGPS( date.getTime() / 1000 ) - GPS_EPOCH_0 / 1000;

              var p = d.topocentricPosition(t, false);
              return [p.azimuth, p.elevation];

            })
          })
          .attr('d', path);

        d3.select(this).select('g.position')
          .attr('transform', function () {

            var p = projection([d.azimuth, d.elevation]);
            return 'translate(' + p[0] + ', ' + p[1] + ')';

          })
          .select('circle')
            .attr('fill', function () {
              return d.health === 0 ? '#009900' : '#ff3300';
            });

      })

  },

  render: function (e) {

    log('render');

    var {width, height} = this.el.getClientRects()[0];

    var scale = Math.min(width,height) * .42;

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
              .attr("x1", p0[0])
              .attr("y1", p0[1])
              .attr("x2", p1[0])
              .attr("y2", p1[1]);
        });

    ticksAzimuth.selectAll('text')
        .each(function(d) {
          var p = projection([d, -4]);

          d3.select(this)
              .attr("x", p[0])
              .attr("y", p[1]);
        })
        .attr('transform', function (d) {

          var r = d % 90 === 0 ? 0 : ((d+90)%180)-90;

          return 'rotate(' + r + ', ' + d3.select(this).attr('x') + ', ' + d3.select(this).attr('y') + ')';
        });

    svg.selectAll("g.ticks.ticks--elevation text")
        .each(function(d) {
          var p = projection([0, d]);

          d3.select(this)
              .attr("x", p[0])
              .attr("y", p[1]);
        })
        .attr("dy", ".35em")
        .text(function(d) { return d + "°"; });

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
