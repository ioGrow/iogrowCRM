module.exports = function (grunt) {
    grunt.initConfig({
      pkg: grunt.file.readJSON('package.json'),
      concat: {
          servs: {
              src: ['static/app/scripts/services/authservices.js',
                  'static/app/scripts/services/infonodeservices.js',
                  'static/app/scripts/services/mapservices.js',
                  'static/app/scripts/services/accountservices.js',
                  'static/app/scripts/services/contactservices.js',
                  'static/app/scripts/services/opportunityservices.js',
                  'static/app/scripts/services/leadservices.js',
                  'static/app/scripts/services/caseservices.js',
                  'static/app/scripts/services/topicservices.js',
                  'static/app/scripts/services/taskservices.js',
                  'static/app/scripts/services/eventservices.js',
                  'static/app/scripts/services/userservices.js',
                  'static/app/scripts/services/billingservices.js',
                  'static/app/scripts/services/noteservices.js',
                  'static/app/scripts/services/commentservices.js',
                  'static/app/scripts/services/settingservices.js',
                  'static/app/scripts/services/edgeservices.js',
                  'static/app/scripts/services/profileservices.js',
                  'static/app/scripts/services/linkedinservices.js'
              ],
              dest: 'static/build/js/_servs.js',
          },
          ctrls: {
              src: [
                  'static/app/scripts/app.js',
                  'static/app/scripts/directives/directives.js',
                  'static/app/scripts/controllers/admin/**/*.js',
                  'static/app/scripts/controllers/mysettingcontrollers.js',
                  'static/app/scripts/controllers/searchcontrollers.js',
                  'static/app/scripts/controllers/accountcontrollers.js',
                  'static/app/scripts/controllers/leadcontrollers.js',
                  'static/app/scripts/controllers/casecontrollers.js',
                  'static/app/scripts/controllers/billingController.js',
                  'static/app/scripts/controllers/contactcontroller.js',
                  'static/app/scripts/controllers/opportunitycontroller.js',
                  'static/app/scripts/controllers/documentcontrollers.js',
                  'static/app/scripts/controllers/notecontrollers.js',
                  'static/app/scripts/controllers/taskcontrollers.js',
                  'static/app/scripts/controllers/eventcontrollers.js',
                  'static/app/scripts/controllers/usercontrollers.js',
                  'static/app/scripts/controllers/settingscontrollers.js'
              ],
              dest: 'static/build/js/_ctrls.js',
          },
        },
        bower_concat: {
          first: {
            dest: {
                'js': 'static/build/js/_first.js'
            },
            include: [
              'jquery',
              'jquery-ui',
              'moment',
              'angular-unstable',
              'angular-moment',
              'angular-google-chart'
            ],
            mainFiles: {
              'angular-unstable': 'angular.min.js'
            },
            dependencies: {
                'jquery-ui': 'jquery',
                'angular-google-chart': 'angular-unstable',
                'angular-moment': 'angular-unstable'
            },
            bowerOptions: {
              relative: false
            }
          },
          async: {
            dest: {
                'js': 'static/build/js/_async.js',
                'css': 'static/build/css/_async.css'
            },
            include: [
              'jquery-textfill',
              'select2',
              'angular-ui-select2',
              'angular-xeditable',
              'wysihtml5',
              'bootstrap-wysihtml5',
              'jquery-slimscroll',
              'jquery.uniform',
              'jquery-simple-datetimepicker',
              'bootstrap-datepicker',
              'bootstrap-hover-dropdown',
              'twitter-bootstrap-wizard',
              'angular-sortable-view',
              'datetimepicker',
              'fullcalendar'
            ],
            dependencies: {
                'bootstrap-wysihtml5': 'wysihtml5',
                'angular-ui-select2': 'select2'
            },
            mainFiles: {
              'jquery-textfill':'jquery.textfill.min.js',
              'select2':'select2.min.js',
              'wysihtml5': 'dist/wysihtml5-0.3.0.min.js',
              'jquery.uniform': [
                  "jquery.uniform.min.js",
                  "themes/default/css/uniform.default.min.css"
              ]
            },
            bowerOptions: {
              relative: false
            }
          },
          sync: {
            dest: {
                'js': 'static/build/js/_sync.js',
                'css': 'static/build/css/_sync.css'
            },
            include: [
              'bootstrap',
              'angular-bootstrap',
              'jquery-ui-maps',
              'zepto',
              'hopscotch',
              'jquery-validation'
            ],
            dependencies: {
                'angular-bootstrap': 'bootstrap'
            },
            mainFiles: {
              'jquery-ui-maps': [
                  'ui/min/jquery.ui.map.min.js',
                  'ui/min/jquery.ui.map.services.min.js'
              ],
              'hopscotch': [
                  'dist/css/hopscotch.min.css',
                  'dist/js/hopscotch.min.js'
              ]
            },
            bowerOptions: {
              relative: false
            }
          }
      },
      cssmin: {
            sync_css: {
                files: {
                    'static/build/css/_sync.css': ['static/build/css/_sync.css']
                }
            },
             async_css: {
                files: {
                    'static/build/css/_async.css': ['static/build/css/_async.css']
                }
            },


      },
      uglify: {
            options: {
                mangle: false
            },
            first_sync_js: {
               files: {
               'static/build/js/_first.js': ['static/build/js/_first.js']
               }
            },
            sync_js: {
               files: {
               'static/build/js/_sync.js': ['static/build/js/_sync.js']
               }
            },
            async_js: {
             files: {
             'static/build/js/_async.js': ['static/build/js/_async.js']
             }
            },
            ctrls: {
                files: {
                    'static/build/js/_ctrls.js': ['static/build/js/_ctrls.js']
                }
            },
            servs: {
                files: {
                    'static/build/js/_servs.js': ['static/build/js/_servs.js']
                }
            }
        },
        watch: {
            ctrls: {
                files: ['static/app/scripts/app.js',
                        'static/app/scripts/directives/directives.js',
                        'static/app/scripts/controllers/*.js',
                        'static/app/scripts/controllers/admin/*.js'],
                tasks: ['concat:ctrls', 'uglify:ctrls'],
            },
            servs: {
                files: ['static/app/scripts/services/*.js'],
                tasks: ['concat:servs', 'uglify:servs'],
            },
        },
            removeLoggingCalls: {
        // the files inside which you want to remove the console statements
        files: ['static/build/js/*.js'],
        options: {
            // an array of method names to remove
            methods: ['log', 'info', 'assert'],
            // replacement strategy
            strategy: function(consoleStatement) {
                // comments console calls statements
                //return '/* ' + consoleStatement + '*/';
                return ''; // to remove
            },

            // when the logging statement is ended by a semicolon ';'
            // include it in the 'consoleStatement' given to the strategy
            removeSemicolonIfPossible: true
        }
    }

    });
    grunt.loadNpmTasks('grunt-contrib-concat');
    grunt.loadNpmTasks('grunt-contrib-cssmin');
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.loadNpmTasks('grunt-bower-concat');
    //grunt.loadNpmTasks("grunt-remove-logging-calls");

    grunt.registerTask('default', [
      'bower_concat',
      'concat',
      'cssmin'
    ]);
    grunt.registerTask('prod', [
      'bower_concat',
      'concat',
      'cssmin',
      //  'removeLoggingCalls',       //buggy
      'uglify',

    ]);
};
