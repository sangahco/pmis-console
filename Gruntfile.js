module.exports = function (grunt) {

    // Project configuration.
    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        uglify: {
            options: {
                banner: '/*! <%= pkg.name %> <%= grunt.template.today("yyyy-mm-dd") %> */\n'
            },
            build: {
                files: { 
                    'build/app.module.min.js': 'build/app.module.js',
                    'build/resources/Functionsml.min.js': 'build/resources/Functionsml.js',
                    'build/resources/pmis_loader.min.js': 'build/resources/pmis_loader.js'
                }
            }
        },

        copy: {
            main: {
                files: [
                    {expand: true, cwd: 'src/', src: ['**'], dest: 'build/'},
                    {expand: true, cwd: 'libs/', src: ['**'], dest: 'build/libs/'},
                    {expand: true, cwd: 'commons/http-request-module/', src: ['**'], dest: 'build/libs/http-request-module/'}
                ]
            }
        },

        compress: {
            main: {
                options: {
                    archive: 'dist/<%= pkg.name %>-v<%= pkg.version %>.tar.gz',
                    mode: 'tgz'
                },
                files: [
                    {expand: true, cwd: 'build/', src: ['**'], dest: '<%= pkg.name %>-v<%= pkg.version %>'}
                ]
            }
        },

        clean: {
            build: {
                src: ['build/*', 'dist/*']
            }
        },
    });

    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-contrib-copy');
    grunt.loadNpmTasks('grunt-contrib-compress');
    grunt.loadNpmTasks('grunt-contrib-clean');

    // Default task(s).
    //grunt.registerTask('default', ['copy']);
    grunt.registerTask('publish', ['uglify', 'compress']);

};