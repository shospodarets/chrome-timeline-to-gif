module.exports = function (grunt) {
    require('load-grunt-tasks')(grunt);

    // Grunt Tasks
    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        paths: {
            dist: 'dist',
            html: 'html',
            js: 'js',
            sass: 'styles'
        },

        clean: {
            options: {force: true},
            files: ['<%= paths.dist %>']
        },

        copy: {
            jsLibraries: {
                files: [
                    {expand: true, cwd: '<%= paths.js %>/libraries', src: '**/*.*', dest: '<%= paths.dist %>/js/libraries/'}// js libraries
                ]
            },
            webWorkers: {
                files: [
                    {expand: true, cwd: '<%= paths.js %>/web-workers', src: '**/*.*', dest: '<%= paths.dist %>/js/web-workers/'}// web-workers
                ]
            },
            html: {
                files: [
                    {expand: true, cwd: '<%= paths.html %>', src: '**/*.*', dest: '<%= paths.dist %>'}
                ]
            },
            bower: {
                files: [
                    {expand: true, cwd: 'bower_components', src: '**/*.*', dest: '<%= paths.dist %>/bower_components'}
                ]
            }
        },

        watch: {
            livereload: {
                options: {
                    livereload: true,
                    spawn: true
                },
                files: [
                    '<%= paths.dist %>/**/*.*'
                ]
            },
            // TASKS RUNNERS
            common: {
                files: [
                    // changes to Gruntfile.js will trigger the watch task to restart, and reload the Gruntfile.js changes
                    'Gruntfile.js'
                ]
            },
            sass: {
                files: [
                    '<%= paths.sass %>/**/*.scss'
                ],
                tasks: ['generateCss']
            },
            js: {
                files: [
                    '<%= paths.js %>/common/**/*.js'
                ],
                tasks: ['generateJs']
            },
            html: {
                files: [
                    '<%= paths.html %>/**/*.*'
                ],
                tasks: ['copy:html']
            }
        },

        sass: {
            dist: {
                files: [{
                    expand: true,
                    cwd: '<%= paths.sass %>',
                    src: ['**/*.scss'],
                    dest: '<%= paths.dist %>/styles',
                    ext: '.css'
                }]
            }
        },

        autoprefixer: {
            options: {
                browsers: ['last 2 versions']
            },
            dist: {
                src: '<%= paths.dist %>/styles/**/*.css'
            }
        },

        browserify: {
            options: {
                banner: '' +
                '//! <%= pkg.name %> - v<%= pkg.version %> - <%= grunt.template.today("yyyy-mm-dd") %>\n' +
                '//! author : Serg Hospodarets\n' +
                '//! license : MIT\n' +
                '//! https://github.com/malyw/chrome-timeline-to-gif\n'
            },
            dist: {
                files: {
                    '<%= paths.dist %>/js/common/main.js': ['<%= paths.js %>/common/main.js']
                }
            }
        }
    });

    // Composite Tasks
    grunt.registerTask('generateJs', [
        'browserify'
    ]);

    grunt.registerTask('generateCss', [
        'sass',
        'autoprefixer'
    ]);

    grunt.registerTask('default', [
        'clean',
        'generateJs',
        'generateCss',
        'copy'
    ]);
};