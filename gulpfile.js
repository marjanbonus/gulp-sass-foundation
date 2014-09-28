var gulp = require('gulp'),
    sass = require('gulp-sass'),
    minifycss = require('gulp-minify-css'),
    concat = require('gulp-concat'),
    uglify = require('gulp-uglify'),
    sourcemaps = require('gulp-sourcemaps'),
    gulpif = require('gulp-if'),
    notify = require('gulp-notify'),
    rimraf = require('gulp-rimraf'),
    uncss = require('gulp-uncss'),
    glob = require('glob'),
    browserSync = require('browser-sync');
var env = process.env.NODE_ENV || 'development';

// SASS tasks
gulp.task('sass', function() {
    return gulp.src('src/scss/app.scss')
        .pipe(gulpif(env === 'development', sourcemaps.init()))
        .pipe(gulpif(env === 'development', sass({errLogToConsole: true})))
        .pipe(gulpif(env === 'development', sourcemaps.write()))
        .pipe(gulpif(env === 'production', sass({errLogToConsole: true})))
        .pipe(uncss({html: glob.sync('index.html')}))
        .pipe(gulpif(env === 'production', minifycss()))
        .pipe(gulp.dest('css'))
        .pipe(notify({
            message: 'Successfully compiled SASS'
        }));
});

// JS tasks
gulp.task('js', function() {
    return gulp.src([
            'bower_components/modernizr/modernizr.js',
            'bower_components/foundation/js/foundation/foundation.js',
            'bower_components/foundation/js/foundation/foundation.dropdown.js',
            'bower_components/foundation/js/foundation/foundation.equalizer.js',
            'bower_components/foundation/js/foundation/foundation.offcanvas.js',
            'bower_components/foundation/js/foundation/foundation.orbit.js',
            'bower_components/foundation/js/foundation/foundation.topbar.js'
        ])
        .pipe(gulpif(env === 'development', sourcemaps.init()))
        .pipe(gulpif(env === 'production', uglify()))
        .pipe(concat('script.js'))
        .pipe(gulpif(env === 'development', sourcemaps.write()))
        .pipe(gulp.dest('js'))
        .pipe(notify({
            message: 'Successfully compiled JS'
        }));
});

// Clean
gulp.task('clean', function() {
  return gulp
    .src(['css', 'js'], {read: false})
    .pipe(rimraf());
});

// BrowserSync
gulp.task('browser-sync', function() {
    browserSync.init(['css/app.css', 'js/script.js'], {
        proxy: "localhost/gulp-sass-foundation/",
        port: 8080
    });
});

// Watch
gulp.task('watch', function() {
   
        // Watch .scss files
        gulp.watch('src/scss/**/*.scss', ['sass']);      
        // Watch .html files
        gulp.watch('index.html', browserSync.reload);
        // Watch .js files
        gulp.watch('src/js/**/*.js', ['js']); 
    
});

// Default task
gulp.task('default', ['browser-sync', 'sass', 'js', 'watch'], function() {

});