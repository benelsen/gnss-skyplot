var gulp = require('gulp');

var browserify = require('browserify'),
    buffer = require('vinyl-buffer'),
    source = require('vinyl-source-stream'),
    concat = require('gulp-concat'),
    rename = require('gulp-rename'),
    livereload = require('gulp-livereload'),
    uglify = require('gulp-uglify'),
    sourcemaps = require('gulp-sourcemaps'),
    minifyCSS = require('gulp-minify-css');

gulp.task('watch', function () {

  var server = livereload();

  function reload (file) {
    server.changed(file.path);
  }

  gulp.watch('index.js', ['browserify']);

  gulp.watch('build/*').on('change', reload);
  gulp.watch('css/index.css').on('change', reload);
  gulp.watch('index.html').on('change', reload);

});

gulp.task('browserify', function () {

  return browserify('./js/app.js')
    .bundle()
    .pipe(source('index.js'))
    .pipe(buffer())
    .pipe(gulp.dest('./build'))
    .pipe(rename({extname: '.min.js'}))
    .pipe(uglify())
    .pipe(gulp.dest('./build'));

});

gulp.task('css', function () {

  return gulp.src([
      './node_modules/bootstrap/dist/css/bootstrap.css',
      './css/index.css'
    ])
    .pipe(concat('index.css'))
    .pipe(gulp.dest('./build'))
    .pipe(minifyCSS())
    .pipe(rename({extname: '.min.css'}))
    .pipe(gulp.dest('./build'));

});

gulp.task('build', ['css', 'browserify']);

gulp.task('default', ['build', 'watch']);
