module.exports = function (grunt) {
    grunt.initConfig({
        concat: {
            css:{
             files: {
                    'static/build/css/sync_styles.css': [
                      'static/src/css/font-awesome.min.css',
                      'static/src/css/bootstrap.min.css',
                      'static/src/css/wysiwyg-color.css',
                      'static/src/css/style-metronic.css',
                      'static/src/css/style.css',
                      'static/src/css/style-responsive.css',
                      'static/src/css/plugins.css',
                      'static/src/css/light.css',
                      'static/src/css/hopscotch.css',
                      'static/src/css/datepicker.css'
                    ],
                    'static/build/css/asyn_styles.css': [
                      'static/src/css/select2_metro.css',
                      'static/src/css/uniform.default.css',
                      'static/src/css/jquery.simple-dtpicker.css',
                      'static/src/css/xeditable.css',
                      'static/src/css/fullcalendar.css',
                      'static/src/css/fullcalendar.print.css'
                    ]
                }
            },
            js_libs:{
                     files: {
                          'static/build/js/async_scripts.js': [
                          'static/src/js/select2.min.js',
                          'static/src/js/ui-select2.js',
                          'static/src/js/angular.easypiechart.js',
                          'static/src/js/xeditable.min.js',
                          'static/src/js/wysihtml5-0.3.0.min.js',
                          'static/src/js/bootstrap-wysihtml5.js',
                          'static/src/js/jquery.slimscroll.min.js',
                          'static/src/js/jquery.uniform.min.js',
                          'static/src/js/jquery.textfill.min.js',
                          'static/src/js/jquery.simple-dtpicker.js',
                          'static/src/js/bootstrap-datetimepicker.min.js',
                          'static/src/js/jquery.caret.js',
                          'static/src/js/twitter-bootstrap-hover-dropdown.min.js'
                        ],
                        'static/build/js/sync_scripts.js': [
                          'static/src/js/bootstrap.min.js',
                          'static/src/js/ui-bootstrap-0.5.0.min.js',
                          'static/src/js/ui-bootstrap-tpls-0.5.0.js',
                          'static/src/js/angular.moment.js',
                          'static/src/js/zepto.js',
                          'static/src/js/jquery.waterfall.js',
                          'static/src/js/jquery.ui.map.min.js',
                          'static/src/js/jquery.ui.map.services.js'
                        ],
                        'static/build/js/first_sync_scripts.js': [
                          'static/src/js/jquery.min.js',
                          'static/src/js/jquery-ui-1.10.3.custom.min.js',
                          'static/src/js/moment.min.js',
                          'static/src/js/angular.min.js',
                          'static/src/js/socket.io.js',
                          'static/src/js/ng-google-chart.js'
                        ]
                     }
                    
            },
            js_servs_ctrls: {
                src: ['static/app/scripts/services/authservices.js',
                    'static/app/scripts/services/infonodeservices.js',
                    'static/app/scripts/services/mapservices.js',
                    'static/app/scripts/services/accountservices.js',
                    'static/app/scripts/services/contactservices.js',
                    'static/app/scripts/services/opportunityservices.js',
                    'static/app/scripts/services/leadservices.js',
                    'static/app/scripts/services/caseservices.js',
                    'static/app/scripts/services/discoverservices.js',
                    'static/app/scripts/services/topicservices.js',
                    'static/app/scripts/services/taskservices.js',
                    'static/app/scripts/services/eventservices.js',
                    'static/app/scripts/services/userservices.js',
                    'static/app/scripts/services/billingservices.js',
                    'static/app/scripts/services/noteservices.js', 'static/app/scripts/services/commentservices.js',
                    'static/app/scripts/services/settingservices.js',
                    'static/app/scripts/services/edgeservices.js', 'static/app/scripts/services/reportservices.js',
                    'static/app/scripts/services/profileservices.js', 'static/app/scripts/services/linkedinservices.js',
                    'static/app/scripts/app.js', 'static/app/scripts/directives/directives.js',
                    'static/app/scripts/controllers/admin/**/*.js',
                    'static/app/scripts/controllers/discovercontrollers.js', 'static/app/scripts/controllers/mysettingcontrollers.js', 'static/app/scripts/controllers/searchcontrollers.js', 'static/app/scripts/controllers/accountcontrollers.js', 'static/app/scripts/controllers/leadcontrollers.js', 'static/app/scripts/controllers/casecontrollers.js', 'static/app/scripts/controllers/billingController.js', 'static/app/scripts/controllers/contactcontroller.js', 'static/app/scripts/controllers/opportunitycontroller.js', 'static/app/scripts/controllers/documentcontrollers.js', 'static/app/scripts/controllers/notecontrollers.js', 'static/app/scripts/controllers/taskcontrollers.js', 'static/app/scripts/controllers/eventcontrollers.js', 'static/app/scripts/controllers/dashboardController.js', 'static/app/scripts/controllers/usercontrollers.js', 'static/app/scripts/controllers/settingscontrollers.js'],
                dest: 'static/build/js/sync_ctrls_sers_scripts.js',
            }
        },
        cssmin: {
            /*css: {
             files: {
             'static/build/css/asyn_styles.min.css': ['static/build/css/asyn_styles.css']
             }
             },*/
            sync_css: {
                files: {
                    'static/build/css/sync_styles.min.css': ['static/build/css/sync_styles.css']
                }
            },
        },
        uglify: {
            options: {
                mangle: false
            },
            /* sync_js: {
             files: {
             'static/build/js/sync_scripts.min.js': ['static/build/js/sync_scripts.js']
             }
             },
             async_js: {
             files: {
             'static/build/js/async_scripts.min.js': ['static/build/js/async_scripts.js']
             }
             },*/
            /* first_sync_js: {
             files: {
             'static/build/js/first_sync_scripts.min.js': ['static/build/js/first_sync_scripts.js']
             }
             }*/
            sync_ctrls_sers_js: {
                files: {
                    'static/build/js/sync_scripts.min.js': ['static/build/js/sync_scripts.js'],
                    'static/build/js/async_scripts.min.js': ['static/build/js/async_scripts.js'],
                    'static/build/js/first_sync_scripts.min.js': ['static/build/js/first_sync_scripts.js'],
                    'static/build/js/sync_ctrls_sers_scripts.min.js': ['static/build/js/sync_ctrls_sers_scripts.js']
                }
            },
            /*sync_ctrls_sers_js: {
             files: {
             'static/build/js/async_scripts_2.min.js': ['static/build/js/async_scripts_2.js']
             }
             },
             sync_ctrls_sers_js: {
             files: {
             'static/build/js/first_sync_scripts.min.js': ['static/build/js/first_sync_scripts.js']
             }
             },    */
            /*async_ctrls_sers_js: {
             files: {
             'static/build/js/async_ctrls_sers_scripts.min.js': ['static/app/scripts/services/mapservices.js','static/app/scripts/services/caseservices.js','static/app/scripts/services/discoverservices.js','static/app/scripts/services/topicservices.js','static/app/scripts/services/eventservices.js','static/app/scripts/services/noteservices.js','static/app/scripts/services/commentservices.js','static/app/scripts/services/reportservices.js','static/app/scripts/controllers/discovercontrollers.js','static/app/scripts/controllers/casecontrollers.js','static/app/scripts/controllers/documentcontrollers.js','static/app/scripts/controllers/notecontrollers.js','static/app/scripts/controllers/eventcontrollers.js','static/app/scripts/controllers/dashboardController.js']
             }
             },*/
        },
        watch: {
             sync_ctrls_servs: {
             files: ['static/app/scripts/services/authservices.js','static/app/scripts/services/infonodeservices.js','static/app/scripts/services/mapservices.js','static/app/scripts/services/accountservices.js','static/app/scripts/services/contactservices.js','static/app/scripts/services/opportunityservices.js','static/app/scripts/services/leadservices.js','static/app/scripts/services/caseservices.js','static/app/scripts/services/discoverservices.js','static/app/scripts/services/topicservices.js','static/app/scripts/services/taskservices.js','static/app/scripts/services/eventservices.js','static/app/scripts/services/userservices.js','static/app/scripts/services/noteservices.js','static/app/scripts/services/commentservices.js','static/app/scripts/services/settingservices.js','static/app/scripts/services/edgeservices.js','static/app/scripts/services/reportservices.js','static/app/scripts/services/profileservices.js','static/app/scripts/services/linkedinservices.js','static/app/scripts/app.js','static/app/scripts/directives/directives.js','static/app/scripts/controllers/discovercontrollers.js','static/app/scripts/controllers/mysettingcontrollers.js','static/app/scripts/controllers/searchcontrollers.js','static/app/scripts/controllers/accountcontrollers.js','static/app/scripts/controllers/leadcontrollers.js','static/app/scripts/controllers/casecontrollers.js','static/app/scripts/controllers/billingController.js','static/app/scripts/controllers/contactcontroller.js','static/app/scripts/controllers/opportunitycontroller.js','static/app/scripts/controllers/documentcontrollers.js','static/app/scripts/controllers/notecontrollers.js','static/app/scripts/controllers/taskcontrollers.js','static/app/scripts/controllers/eventcontrollers.js','static/app/scripts/controllers/dashboardController.js','static/app/scripts/controllers/usercontrollers.js','static/app/scripts/controllers/settingscontrollers.js'],
             tasks: ['uglify'],
             },*/
            async_ctrls_servs: {
                files: ['static/app/scripts/services/authservices.js',
                    'static/app/scripts/services/infonodeservices.js',
                    'static/app/scripts/services/mapservices.js',
                    'static/app/scripts/services/accountservices.js',
                    'static/app/scripts/services/contactservices.js',
                    'static/app/scripts/services/opportunityservices.js',
                    'static/app/scripts/services/leadservices.js',
                    'static/app/scripts/services/caseservices.js',
                    'static/app/scripts/services/discoverservices.js',
                    'static/app/scripts/services/topicservices.js',
                    'static/app/scripts/services/taskservices.js',
                    'static/app/scripts/services/eventservices.js',
                    'static/app/scripts/services/userservices.js',
                    'static/app/scripts/services/billingservices.js',
                    'static/app/scripts/services/noteservices.js',
                    'static/app/scripts/services/commentservices.js',
                    'static/app/scripts/services/settingservices.js',
                    'static/app/scripts/services/edgeservices.js',
                    'static/app/scripts/services/reportservices.js', 'static/app/scripts/services/profileservices.js',
                    'static/app/scripts/services/linkedinservices.js', 'static/app/scripts/app.js',
                    'static/app/scripts/directives/directives.js',
                    'static/app/scripts/controllers/discovercontrollers.js',
                    'static/app/scripts/controllers/mysettingcontrollers.js',
                    'static/app/scripts/controllers/searchcontrollers.js',
                    'static/app/scripts/controllers/accountcontrollers.js',
                    'static/app/scripts/controllers/admin/**/*.js',
                    'static/app/scripts/controllers/leadcontrollers.js',
                    'static/app/scripts/controllers/casecontrollers.js',
                    'static/app/scripts/controllers/billingController.js',
                    'static/app/scripts/controllers/contactcontroller.js',
                    'static/app/scripts/controllers/opportunitycontroller.js',
                    'static/app/scripts/controllers/documentcontrollers.js',
                    'static/app/scripts/controllers/notecontrollers.js',
                    'static/app/scripts/controllers/taskcontrollers.js',
                    'static/app/scripts/controllers/eventcontrollers.js',
                    'static/app/scripts/controllers/dashboardController.js',
                    'static/app/scripts/controllers/usercontrollers.js', 'static/app/scripts/controllers/settingscontrollers.js'],
                tasks: ['concat', 'uglify'],
            },
        },
        imagemin: {
            dynamic: {
                files: [{
                    expand: true,
                    cwd: '/static/img/',
                    src: ['**/*.{png,jpg,gif}'],
                    dest: '/static/build/img/'
                }]
            }
        },
        htmlmin: {
            dist: {
                options: {
                    removeComments: true,
                    collapseWhitespace: true
                },
                files: {
                    'templates/new_web_site/index.html': 'templates/new_web_site/index_opt.html'
                }
            }
        }
    });
    grunt.loadNpmTasks('grunt-contrib-concat');
    grunt.loadNpmTasks('grunt-contrib-cssmin');
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.loadNpmTasks('grunt-contrib-htmlmin');
};