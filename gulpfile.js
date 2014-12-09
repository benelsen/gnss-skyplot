var gulp = require('gulp');

var browserify = require('browserify');
var buffer = require('vinyl-buffer');
var concat = require('gulp-concat');
var exorcist = require('exorcist');
var livereload = require('gulp-livereload');
var merge = require('merge-stream');
var minifyCSS = require('gulp-minify-css');
var mold = require('mold-source-map');
var prefix = require('gulp-autoprefixer');
var rename = require('gulp-rename');
var sass = require('gulp-sass');
var source = require('vinyl-source-stream');
var streamify = require('gulp-streamify');
var streamqueue = require('streamqueue');
var sourcemaps = require('gulp-sourcemaps');
var to5 = require("6to5-browserify");
var transform = require('vinyl-transform');
var uglify = require('gulp-uglify');
var watchify = require('watchify');

gulp.task('watch', ['css', 'livereload', 'watchify'], function () {

  gulp.watch('scss/*.scss', ['sass']);

  gulp.watch('build/css/index.css').on('change', livereload.changed);
  gulp.watch('index.html').on('change', livereload.changed);

});

gulp.task('livereload', function() {
  livereload.listen();
});

gulp.task('watchify', function() {

  var b = browserify({
      cache: {},
      packageCache: {},
      fullPaths: true,
      debug: true
    })
    .add('./js/app.js');

  var w = watchify(b)
    .transform(to5)
    .on('update', bundle)
    .on('error', function (err) {
      console.error( err.stack );
    });

  function bundle() {
    return w
      .bundle()
      .pipe(source('app.js'))
      .pipe(transform(function () { return mold.transformSourcesRelativeTo('./'); }))
      .pipe(transform(function () { return exorcist('build/js/app.js.map'); }))
      .pipe(gulp.dest('build/js'))
      .pipe(livereload({ auto: false }));
  }

  return bundle();

});

gulp.task('browserify', function() {

  return browserify({
      debug: true
    })
    .add('./js/app.js')
    .transform(to5)
    .bundle()
    .on('error', function (err) {
      console.error( err.stack );
    })
    .pipe(source('app.js'))
    .pipe(transform(function () { return mold.transformSourcesRelativeTo('./'); }))
    .pipe(transform(function () { return exorcist('build/js/app.js.map'); }))
    .pipe(gulp.dest('build/js'));

});

gulp.task('vendor-css', function () {

  gulp.src([
    'node_modules/normalize.css/normalize.css',
    'node_modules/bootstrap/dist/css/bootstrap.css'
  ])
    .pipe(sourcemaps.init({loadMaps: true}))
    .pipe(concat('vendor.css'))
    .pipe(sourcemaps.write('./', {
      includeContent: false
    }))
    .pipe( gulp.dest('build/css') );

});

gulp.task('sass', function () {

  var build = gulp.src('./scss/index.scss')
    .pipe(sourcemaps.init())
      .pipe(sass({
        outputStyle: 'compact',
      }))
    .pipe(sourcemaps.write({
      sourceRoot: '../scss',
      includeContent: false
    }))
    .pipe(sourcemaps.init({loadMaps: true}))
      .pipe(prefix({
        browsers: ['last 2 versions']
      }))
    .pipe(sourcemaps.write('./', {
      sourceRoot: '../scss',
      includeContent: false
    }))
    .pipe(gulp.dest('build/css'));

});

gulp.task('css', ['vendor-css', 'sass']);
gulp.task('build', ['css', 'browserify']);
gulp.task('default', ['build']);
