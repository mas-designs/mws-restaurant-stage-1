const gulp = require('gulp');
const autoprefixer = require('gulp-autoprefixer');
const jsmin = require('gulp-jsmin');
const htmlclean = require('gulp-htmlclean');
const htmlmin = require('gulp-htmlmin');
const cleanCSS = require('gulp-clean-css');
const concat = require('gulp-concat');

gulp.task('default',['create-index','create-restaurant','copy-images','copy-serviceworker','build-html','copy-assets','build-css']);

gulp.task('create-index',function(){
    //combine dbhelperjs,responsivehelperjs,mainjs ==> index.js
    gulp.src(['dev/js/dbhelper.js','dev/js/main.js','dev/js/responsive_helper.js',])
        .pipe(concat('index.min.js'))
        .pipe(jsmin())
        .pipe(gulp.dest('dist/js'));
});
gulp.task('create-restaurant',function(){
    //combine dbhelper,responsivehelperjs,restaurant-info.js ==> restaurant.js
    gulp.src(['dev/js/dbhelper.js','dev/js/restaurant_info.js','dev/js/responsive_helper.js'])
        .pipe(concat('restaurant.min.js'))
        .pipe(jsmin())
        .pipe(gulp.dest('dist/js'));
});
gulp.task('copy-serviceworker',function(){
    //copy and minify serviceworkerjs
    gulp.src('dev/sw.js')
        .pipe(jsmin())
        .pipe(gulp.dest('dist/'))
});
gulp.task('copy-assets',function(){
    //copy manifest.json and favicon
    gulp.src('dev/manifest.json')
        .pipe(gulp.dest('dist/'));
});
gulp.task('copy-images',function(){
    gulp.src('dev/img/**')
        .pipe(gulp.dest('dist/img'))
});
gulp.task('build-html',function(){
    //build minify and copy html
    gulp.src('dev/*.html')
        .pipe(htmlclean())
        .pipe(htmlmin({collapseWhitespace:true}))
        .pipe(gulp.dest('dist/'));
});
gulp.task('build-css',function(){
    gulp.src('dev/css/styles.css')
        .pipe(autoprefixer({
            browsers: ['last 2 versions'],
            cascade: false
        }))
        .pipe(cleanCSS())
        .pipe(gulp.dest('dist/css'));
});

/*//general gulp stuff

// spared out for later use
var rename = require('gulp-rename');

//HTML-related Gulp stuff


//CSS related gulp stuff




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

gulp.task('build',['html','css','js','sw']);*/


