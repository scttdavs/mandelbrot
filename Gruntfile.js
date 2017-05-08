module.exports = function(grunt){
  grunt.loadNpmTasks("grunt-mocha-istanbul");
  grunt.loadNpmTasks("grunt-contrib-uglify");
  grunt.initConfig({
      uglify: {
        my_target: {
          files: {
            "mandelbrot.min.js": ["mandelbrot.js"]
          }
        }
      }
  });

  grunt.event.on("coverage", function(lcovFileContents, done){
      // Check below on the section "The coverage event"
      done();
  });

  grunt.registerTask("test", ["mocha_istanbul:test"]);
};
