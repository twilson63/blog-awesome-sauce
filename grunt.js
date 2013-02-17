module.exports = function(grunt) {
  grunt.initConfig({
    lint: {
      files: ['/js/app.js']
    },
    concat: {
      codemirror: {
        src: [
          'public/js/codemirror.js',
          'public/js/overlay.js',
          'public/js/xml.js',
          'public/js/markdown.js',
          'public/js/gfm.js',
          'public/js/javascript.js',
          'public/js/css.js',
          'public/js/htmlmixed.js'],
        dest: 'public/codemirror-concat.js'
      },
      angular: {
        src: [
          'public/js/angular-ui.js',
          'public/js/ui-bootstrap-0.1.0.js',
          'public/js/http-auth-interceptor.js'
        ],
        dest: 'public/angular-modules.js'
      }
    },
    min: {
      codemirror: {
        src: ['public/codemirror-concat.js'],
        dest: 'public/codemirror-concat.min.js'
      },
      angular: {
        src: ['public/angular-modules.js'],
        dest: 'public/angular-modules.min.js'
      }
    }
  });
  grunt.registerTask('default', 'lint concat min');

}

