module.exports = function(grunt){
  grunt.loadNpmTasks('grunt-mocha-istanbul');
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.initConfig({
      mocha_istanbul: {
          test: {
              src: grunt.option('files') || ['test/*.js'], // a folder works nicely
              coverageFolder: 'coverage',
              coverage: false,
              noColor: false,
              dryRun: false,
              print: 'both',
              check: {
                statements: 70,
                branches: 70,
                functions: 70,
                lines: 70
              },
              reportFormats: ['lcov'],
              reporter: grunt.option('reporter') || 'spec',
              grep: grunt.option('grep') || 0

          }
      },
      uglify: {
        my_target: {
          files: {
            'mandelbrot.min.js': ['mandelbrot.js']
          }
        }
      }
  });

  grunt.event.on('coverage', function(lcovFileContents, done){
      // Check below on the section "The coverage event"
      done();
  });

  grunt.registerTask('test', ['mocha_istanbul:test']);
};
