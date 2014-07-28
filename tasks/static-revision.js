/*
 * grunt-static-revision
 * https://github.com/and1coder/grunt-static-revision
 *
 * Copyright (c) 2014 samgui
 * Licensed under the MIT license.
 */

'use strict';

var fs = require('fs'),
    path = require('path'),
    crypto = require('crypto');

module.exports = function (grunt) {

    // Please see the Grunt documentation for more information regarding task
    // creation: http://gruntjs.com/creating-tasks

    grunt.registerMultiTask('static-revision', 'Create *.json for the static file asset and revisioning through content hashing', function () {
            // Merge task-specific and/or target-specific options with these defaults.
            var options = this.options({
                    configFile: 'static-revision.json',
                    initVersion: '0.0.0',
                    maxVersionNumber: [10, 100, 100]
                }),
                configFile = options.src + '/' + options.configFile,
                configs, json = '';

            if (!grunt.file.exists(configFile)) {
                grunt.file.write(configFile, JSON.stringify({
                    "css": {},
                    "js": {}
                }));
                grunt.log.writeln('File "' + configFile + '" created.');
            }

            /**
             * Returns the new filename for `file` with the
             * generated hash in the filename.
             *
             * @param {String} filepath
             * @return {String}
             */
            function revision(filepath) {
                var md5_hash = hash(filepath),
                    ext = path.extname(filepath),
                    dir = path.dirname(filepath),
                    filename = path.basename(filepath, ext),
                    maxVersionNumber = options.maxVersionNumber,
                    majorVersionNumber, minorVersionNumber, revisionNumber,
                    config = {}, filekey, md5 = '', type , version, exist = false;

                type = ext.replace('.', '');
                dir = dir.split('/');
                dir = dir[dir.length - 1];
                filekey = dir + '/' + filename;
                configs = grunt.file.readJSON(configFile);

                if (configs) {
                    if (configs[type] && configs[type][filekey]) {
                        config = configs[type][filekey];
                        version = config.version;
                        md5 = config.md5;
                        exist = true;
                    }
                }

                if (!exist) {
                    version = options.initVersion;
                    config = {
                        "version": version,
                        "md5": md5
                    }
                }

                //file has changed
                if (md5 != md5_hash) {
                    version = version.split('.');
                    majorVersionNumber = version[0];
                    minorVersionNumber = version[1];
                    revisionNumber = version[2];
                    revisionNumber++;

                    if (revisionNumber >= maxVersionNumber[0]) {
                        minorVersionNumber++;
                        revisionNumber = 0;
                    }

                    if (minorVersionNumber >= maxVersionNumber[1]) {
                        majorVersionNumber++;
                        minorVersionNumber = 0;
                    }

                    version = [majorVersionNumber , minorVersionNumber , revisionNumber].join('.');

                    config = {
                        "version": version,
                        "md5": md5_hash
                    }
                }

                return {
                    type: type,
                    filekey: filekey,
                    config: config
                };
            }

            /**
             * build revision directory
             * @param config
             * @param filepath
             */
            function build(config, filepath) {
                var version , fileName , ext,
                    srcDir, srcFile,
                    distDir, distFile,
                    buildDir, buildFile;

                srcDir = path.dirname(filepath);
                ext = path.extname(filepath);
                fileName = path.basename(filepath);
                srcFile = srcDir + '/' + fileName;
                version = config.config.version;

                if (version) {
                    distDir = srcDir.replace(options.src, options.dist);
                    distFile = distDir + '/' + fileName;

                    buildDir = distDir + '/' + version;
                    buildFile = buildDir + '/' + fileName;

                    grunt.file.mkdir(buildDir);

                    if (ext == '.js') {
                        grunt.file.copy(distFile, buildFile);
                        grunt.file.delete(distFile);
                    } else {
                        grunt.file.copy(srcFile, buildFile);
                    }

                    //keep the source file
                    grunt.file.copy(srcFile, distFile);
                }
            }

            /**
             * Generate md5 hash for `file`
             *
             * @param {String} file
             * @return {String}
             */
            function hash(file) {
                var h = crypto.createHash('md5');
                h.update(grunt.file.read(file), 'utf8');
                grunt.verbose.write('Hashing ' + file + '...');
                return h.digest('hex');
            }

            // Iterate over all specified file groups.
            this.files.forEach(function (f) {
                // Concat specified files.
                var src = f.src.filter(function (filepath) {
                    // Warn on and remove invalid source files (if nonull was set).
                    if (!grunt.file.exists(filepath)) {
                        grunt.log.warn('Source file "' + filepath + '" not found.');
                        return false;
                    } else {
                        return true;
                    }
                }).map(function (filepath) {
                    var config = revision(filepath);
                    build(config, filepath);

                    //Print build file and version
                    grunt.log.writeln('>' + config.filekey + '.' + config.type + '@' + config.config.version);
                    return config;
                });

                src.forEach(function (config) {
                    configs[config.type][config.filekey] = config.config;
                });
            });
            grunt.file.write(configFile, JSON.stringify(configs));

            // Print a success message.
            grunt.log.writeln(':::::' + configFile + ' build successfully:::::');
        }
    );
};
