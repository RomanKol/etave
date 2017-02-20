// Modules
const gulp = require('gulp');

const pug = require('gulp-pug');

const sass = require('gulp-sass');
const autoprefixer = require('gulp-autoprefixer');
const uncss = require('gulp-uncss');
const cssnano = require('gulp-cssnano');

const eslint = require('gulp-eslint');

const imagemin = require('gulp-imagemin');

function reportError(error) {
  // If you want details of the error in the console
  console.log(error.toString());

  this.emit('end');
}

// Eslinting task
gulp.task('lint', () => gulp.src('./src/js/*.js')
  .pipe(eslint({
    fix: true,
  }))
  .pipe(eslint.format())
  // .pipe(eslint.failAfterError())
  .pipe(gulp.dest('./extension/')));


// Pug rendering task
gulp.task('pug', () => gulp.src('./src/pug/*.pug')
  .pipe(pug({
    pretty: true,
    locals: {
      name: 'etave',
    },
  }))
  .on('error', reportError)
  .pipe(gulp.dest('./extension/')));

gulp.task('pug-min', () => gulp.src('./src/pug/*.pug')
  .pipe(pug({
    locals: {
      name: 'etave',
    },
  }))
  .on('error', reportError)
  .pipe(gulp.dest('./extension/')));


// Sass css compilation task
gulp.task('css', () => gulp.src(['./src/sass/styles.scss', './src/sass/content.scss'])
  .pipe(sass({
    sourceMap: true,
  }))
  .pipe(autoprefixer({
    browsers: ['last 2 versions'],
    cascade: false,
  }))
  .pipe(gulp.dest('./extension/')));

gulp.task('css-min', () => gulp.src(['./src/sass/styles.scss', './src/sass/content.scss'])
  .pipe(sass())
  .pipe(autoprefixer({
    browsers: ['last 2 versions'],
    cascade: false,
  }))
  .pipe(uncss({
    html: ['./extension/**.html'],
    ignore: [
      /\.modal/,
      /\.btn/,
      /\.table/,
      /\#etave-recorder-dot/,
      /\.etave-reset/,
    ],
  }))
  .pipe(cssnano())
  .pipe(gulp.dest('./extension/')));


// Image Task
gulp.task('image', () => gulp.src('src/img/*')
  .pipe(imagemin())
  .pipe(gulp.dest('./extension/')));


// Manifest Task
gulp.task('manifest', () => gulp.src('./src/manifest.json')
  .pipe(gulp.dest('./extension/')));


// Watch Task
gulp.task('watch', () => {
  gulp.watch('./src/pug/*.pug', ['pug']);
  gulp.watch('./src/sass/*.scss', ['css']);
  gulp.watch('./src/img/**', ['image']);
  gulp.watch('./src/js/*.js', ['lint']);
  gulp.watch('./src/manifest.json', ['manifest']);
});


// Default/Dev Task
gulp.task('default', ['watch', 'pug', 'css', 'lint', 'image', 'manifest']);

// Build Task
gulp.task('build', ['pug-min', 'css-min', 'lint', 'image', 'manifest']);
