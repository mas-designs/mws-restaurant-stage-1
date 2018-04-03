//general gulp stuff
var gulp = require('gulp');
//var concat = require('gulp-concat'); spared out for later use
var rename = require('gulp-rename');

//HTML-related Gulp stuff
var htmlclean = require('gulp-htmlclean');
var htmlmin = require('gulp-htmlmin');

//CSS related gulp stuff
var autoprefixer = require('gulp-autoprefixer');
var cleanCSS = require('gulp-clean-css');

//JS related gulp stuff
var jsmin = require('gulp-jsmin');

//dev-paths
var devHtml="dev/*.html";
var devCss="dev/css/*.css";
var devJs = "dev/js/*.js";


//dist-paths
var dist = "dist/";
var distCss="dist/css/";
var distJs = "dist/js/";

//gulp-tasks
gulp.task("html",function(){
    return gulp.src(devHtml)
        .pipe(htmlclean())
        .pipe(htmlmin({collapseWhitespace: true}))
        .pipe(gulp.dest(dist));
});

gulp.task('css', function () {
    return gulp.src(devCss)
        .pipe(autoprefixer({
            browsers: ['last 2 versions'],
            cascade: false
        }))
        .pipe(cleanCSS())
        .pipe(rename({suffix: '.min'}))
        .pipe(gulp.dest(distCss));
});

gulp.task('js', function () {
    return gulp.src(devJs)
        .pipe(jsmin())
        .pipe(rename({suffix: '.min'}))
        .pipe(gulp.dest(distJs));
});

gulp.task('sw',function(){
    return gulp.src('dev/sw.js')
        .pipe(jsmin())
        .pipe(rename({suffix: '.min'}))
        .pipe(gulp.dest('dist/'));
});

gulp.task('build',['html','css','js','sw']);


