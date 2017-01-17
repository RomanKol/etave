const gulp = require('gulp');
const pug = require('gulp-pug');

const sass = require('gulp-sass');
const autoprefixer = require('gulp-autoprefixer');
const uncss = require('gulp-uncss');
const cssnano = require('gulp-cssnano');

const eslint = require('gulp-eslint');

// JS Eslinting
gulp.task('lint', () => {
  return gulp.src('./src/js/*.js')
    .pipe(eslint({
      fix: true,
    }))
    .pipe(eslint.format())
    .pipe(eslint.failAfterError())
    .pipe(gulp.dest('./extension/'));
});


// Pug rendering
gulp.task('pug', () => {
  return gulp.src('./src/pug/*.pug')
    .pipe(pug({
      pretty: true,
      locals: {
        name: 'ETaVE',
      },
    }))
    .pipe(gulp.dest('./extension/'));
});


// SASS CSS Compilation
gulp.task('css', () => {
  return gulp.src('./src/sass/styles.scss')
    .pipe(sass({
      sourceMap: true,
    }))
    .pipe(autoprefixer({
      browsers: ['last 2 versions'],
      cascade: false,
    }))
    // .pipe(concat('main.css'))
    .pipe(uncss({
      html: ['./extension/**.html'],
    }))
    .pipe(gulp.dest('./extension/'));
});

gulp.task('css-min', () => {
  return gulp.src('./src/sass/styles.scss')
    .pipe(sass())
    // .pipe(concat('main.css'))
    .pipe(autoprefixer({
      browsers: ['last 2 versions'],
      cascade: false,
    }))
    .pipe(uncss({
      html: ['./extension/**.html'],
    }))
    .pipe(cssnano())
    .pipe(gulp.dest('./extension/'));
});

gulp.task('watch', () => {
  gulp.watch('./src/pug/*.pug', ['pug']);
  gulp.watch('./src/sass/*.scss', ['css']);
  gulp.watch('./src/js/*.js', ['lint']);
});

gulp.task('default', ['watch', 'pug', 'css', 'lint']);

gulp.task('build', ['pug', 'css-min', 'lint']);
