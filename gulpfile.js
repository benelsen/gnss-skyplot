var gulp = require('gulp');
var gutil = require('gulp-util');

var browserify = require('browserify');
var watchify = require('watchify');
var babelify = require("babelify");

var buffer = require('vinyl-buffer');
var concat = require('gulp-concat');
var imagemin = require('gulp-imagemin');
var livereload = require('gulp-livereload');
var minifyCSS = require('gulp-minify-css');
var prefix = require('gulp-autoprefixer');
var rename = require('gulp-rename');
var sass = require('gulp-sass');
var source = require('vinyl-source-stream');
var sourcemaps = require('gulp-sourcemaps');
var uglify = require('gulp-uglify');

gulp.task('watch', ['img', 'css', 'livereload', 'watchify'], function () {

  gulp.watch('scss/*.scss', ['sass']);
  gulp.watch('images/**/*.{png,jpg,gif}', ['img']);
  gulp.watch(['index.html', 'build/**/*.{js,css}']).on('change', livereload.changed);

});

gulp.task('livereload', function() {
  livereload.listen();
});

var bundler;

function bundle(watch) {

  if ( !bundler ) {

    bundler = watchify(
        browserify('./js/app.js', {
          cache: {}, packageCache: {}, fullPaths: true, debug: true
        })
      )
      .transform(babelify)
      .on('update', bundle)
      .on('log', gutil.log.bind(gutil, 'Watchify:'));

  }

  return bundler.bundle()
    .on('error', gutil.log.bind(gutil, 'Browserify Error'))
    .pipe(source('app.js'))
      .pipe(buffer())
      .pipe( sourcemaps.init({loadMaps: true}) )
      .pipe( sourcemaps.write('./', {sourceRoot: '../../', includeContent: false}) )
    .pipe(gulp.dest('build/js'));

}

gulp.task('watchify', bundle);

gulp.task('browserify', function() {

  bundler = browserify('./js/app.js', { debug: true });
  bundler.transform(babelify);

  return bundle();

});

gulp.task('uglify-js', ['js'], function () {

  return gulp.src([
      'build/js/app.js'
    ])
    .pipe(uglify())
    .pipe(rename({
      suffix: '.min'
    }))
    .pipe(gulp.dest('build/js'));

});

gulp.task('img-opti', function () {

  return gulp.src([
      'images/*.png',
    ])
    .pipe(imagemin({
      progressive: true
    }))
    .pipe(gulp.dest('build/images'));

});

gulp.task('minify-css', ['css'], function () {

  return gulp.src([
      'build/css/vendor.css',
      'build/css/index.css'
    ])
    .pipe(minifyCSS())
    .pipe(rename({
      suffix: '.min'
    }))
    .pipe(gulp.dest('build/css'));

});

gulp.task('vendor-css', function () {

  return gulp.src([
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

  return gulp.src('./scss/index.scss')
    .pipe(sourcemaps.init())
      .pipe(sass({
        outputStyle: 'compact',
      }))
    .pipe(sourcemaps.write({
      sourceRoot: '../../scss',
      includeContent: false
    }))
    .pipe(sourcemaps.init({loadMaps: true}))
      .pipe(prefix())
    .pipe(sourcemaps.write('./', {
      sourceRoot: '../scss',
      includeContent: false
    }))
    .pipe(gulp.dest('build/css'));

});

gulp.task('deploy', ['uglify-js', 'minify-css']);

gulp.task('img', ['img-opti']);
gulp.task('js', ['browserify']);
gulp.task('css', ['vendor-css', 'sass']);
gulp.task('build', ['img', 'css', 'js']);
gulp.task('default', ['build']);
