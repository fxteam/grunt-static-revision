/*
 * grunt-static-revision
 * https://github.com/and1coder/grunt-static-revision
 *
 * Copyright (c) 2014 samgui
 * Licensed under the MIT license.
 */

'use strict';

module.exports = function (grunt) {

    // Project configuration.
    grunt.initConfig({
        // Configuration to be run (and then tested).
        revision: {
            options: {},
            src: ['test/js/{,*/}*.js', 'test/css/{,*/}*.scss'],
            dest: '.tmp/'
        }
    });

    // Actually load this plugin's task(s).
    grunt.loadTasks('tasks');

    // Whenever the "test" task is run, first clean the "tmp" dir, then run this
    // plugin's task(s), then test the result.
    grunt.registerTask('test', ['revision']);

    // By default, lint and run all tests.
    grunt.registerTask('default', ['test']);

};
