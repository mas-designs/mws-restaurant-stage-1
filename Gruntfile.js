module.exports = function(grunt) {

    grunt.initConfig({
        responsive_images: {
            dev: {
                options: {
                    engine:'im',
                    sizes: [{
                        //name: 'small',
                        width: '30%',
                        suffix: '_small',
                        quality: 60
                    },{
                        //name: 'large',
                        width: '50%',
                        suffix: '_large',
                        quality: 80
                    }]
                },
                files: [{
                    expand: true,
                    src: ['**/*.jpg'],
                    cwd: 'img/',
                    dest: 'images/'
                }]
            }
        }
    });

    grunt.loadNpmTasks('grunt-responsive-images');
    grunt.registerTask('default', ['responsive_images']);

};