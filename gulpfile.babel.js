'use strict';

import gulp from 'gulp';
import plugins from 'gulp-load-plugins';
import browserSync from 'browser-sync';
import runseq from 'run-sequence';
import panini from 'panini';
import yargs from 'yargs';
import yaml from 'js-yaml';
import fs from 'fs';

const $ = plugins();
const PRODUCTION = !!(yargs.argv.production);

const {
    COMPATIBILITY,
    PORT,
    PATHS
} = loadConfig();

function loadConfig() {
    let ymlFile = fs.readFileSync('config.yml', 'utf8');
    return yaml.load(ymlFile);
}

gulp.task('browser-sync', ['build'], function() {

    browserSync.init({
        server: {
            baseDir: "./dist"
        },
        port: PORT
    });

});

gulp.task('build', function(done) {
    runseq('copy', ['html', 'stylesheets', 'javascripts'], done);
});


gulp.task('html', ['updateHTML'], function() {
    
    return gulp.src(PATHS.pages)
        .pipe(panini({
            root: 'src/html/pages/',
            layouts: 'src/html/layouts/',
            partials: 'src/html/partials/',
            helpers: 'src/html/helpers/',
            data: 'src/html/data/'
        }))
        .pipe($.rename({
            extname: ".html"
        }))
        .pipe(gulp.dest('dist'))
        .pipe(browserSync.stream());
        
});

gulp.task('updateHTML', function(done) {
    panini.refresh();
    done();
});



gulp.task('stylesheets', function() {

    return gulp.src(PATHS.stylesheets)
        .pipe($.sourcemaps.init())
        .pipe($.sass({
            includePaths: ['node_modules', 'bower_components']
        }).on('error', $.sass.logError))
        .pipe($.autoprefixer({
            browsers: COMPATIBILITY
        }))
        .pipe($.if(PRODUCTION, $.cleanCss({
            compatibility: 'ie9'
        })))
        .pipe($.if(!PRODUCTION, $.sourcemaps.write()))
        //.pipe($.if(PRODUCTION,  $.rename({extname: ".min.css"})))
        .pipe(gulp.dest('dist/css'))
        .pipe(browserSync.stream());
        

});

gulp.task('lint', function() {
    return gulp.src(PATHS.javascripts)
        .pipe($.eslint())
        .pipe($.eslint.format())
        .pipe($.eslint.failAfterError());
})

gulp.task('javascripts', ['lint'], function() {
    return gulp.src(PATHS.javascripts)
    .pipe($.sourcemaps.init())
    .pipe($.babel())
    .pipe($.concat('app.js', {
      newLine:'\n;'
    }))
    .pipe($.if(PRODUCTION, $.uglify()))
    .pipe($.if(!PRODUCTION, $.sourcemaps.write()))
    .pipe(gulp.dest('dist/js'))
    .pipe(browserSync.stream());
});

gulp.task('copy:fonts', function() {
  return gulp.src(PATHS.fonts).pipe(gulp.dest('dist/fonts'))
            .pipe(browserSync.stream());
});

gulp.task('copy:assets', function() {
  return gulp.src(PATHS.assets).pipe(gulp.dest('dist/assets'))
            .pipe(browserSync.stream());
});

gulp.task('copy:images', function() {
  return gulp.src(PATHS.images)
            .pipe($.if(PRODUCTION, $.imagemin() ))
            .pipe(gulp.dest('dist/img'))
            .pipe(browserSync.stream());
});

gulp.task('copy', function (done) {
    runseq(['copy:fonts', 'copy:images', 'copy:assets'], done);
});

gulp.task('default', ['build','browser-sync'], function() {
    gulp.watch(PATHS.html, ['html']);
    gulp.watch(PATHS.javascripts, ['javascripts']);
    gulp.watch(PATHS.stylesheets, ['stylesheets']);
    gulp.watch(PATHS.fonts, ['copy:fonts']);
    gulp.watch(PATHS.images, ['copy:images']);
    gulp.watch(PATHS.assets, ['copy:assets']);
});