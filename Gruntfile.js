module.exports=function(grunt){
 grunt.initConfig({
	  concat: {
	    /*css:{
	      src: ['static/bootstrap3/plugins/select2/select2_metro.css','static/bootstrap3/plugins/uniform/css/uniform.default.css','static/plugins/date-time-picker/jquery.simple-dtpicker.css','static/plugins/jquery-easy-pie-chart/jquery.easy-pie-chart.css','static/angular-xeditable-0.1.8/css/xeditable.css','static/plugins/fullcalendar/fullcalendar.css','static/plugins/fullcalendar/fullcalendar.print.css'],
	      dest: 'static/build/css/asyn_styles.css',
	    }*/
	  /*  js:{
	      src: ['static/app/scripts/services/authservices.js','static/app/scripts/services/infonodeservices.js','static/app/scripts/services/mapservices.js','static/app/scripts/services/accountservices.js','static/app/scripts/services/contactservices.js','static/app/scripts/services/opportunityservices.js','static/app/scripts/services/leadservices.js','static/app/scripts/services/caseservices.js','static/app/scripts/services/discoverservices.js','static/app/scripts/services/topicservices.js','static/app/scripts/services/taskservices.js','static/app/scripts/services/eventservices.js','static/app/scripts/services/userservices.js','static/app/scripts/services/groupservices.js','static/app/scripts/services/noteservices.js','static/app/scripts/services/commentservices.js','static/app/scripts/services/settingservices.js','static/app/scripts/services/importservices.js','static/app/scripts/services/edgeservices.js','static/app/scripts/services/reportservices.js','static/app/scripts/services/profileservices.js','static/app/scripts/services/linkedinservices.js','static/app/scripts/app.js','static/app/scripts/directives/directives.js','static/app/scripts/services/helpers.js','static/app/scripts/controllers/discovercontrollers.js','static/app/scripts/controllers/mysettingcontrollers.js','static/app/scripts/controllers/searchcontrollers.js','static/app/scripts/controllers/accountcontrollers.js','static/app/scripts/controllers/leadcontrollers.js','static/app/scripts/controllers/casecontrollers.js','static/app/scripts/controllers/billingController.js','static/app/scripts/controllers/contactcontroller.js','static/app/scripts/controllers/opportunitycontroller.js','static/app/scripts/controllers/documentcontrollers.js','static/app/scripts/controllers/notecontrollers.js','static/app/scripts/controllers/taskcontrollers.js','static/app/scripts/controllers/eventcontrollers.js','static/app/scripts/controllers/dashboardController.js','static/app/scripts/controllers/usercontrollers.js','static/app/scripts/controllers/groupcontrollers.js','static/app/scripts/controllers/settingscontrollers.js','static/app/scripts/controllers/importcontrollers.js'],
	      dest: 'static/build/js/sync_ctrls_sers_scripts.js',
	    },*/
	    sync_ctrls_sers_js: {
	      files: {
	        'static/build/js/async_scripts_2.js': ['static/build/js/async_scripts.js','/static/plugins/d3.min.js','/static/plugins/d3-funnel-charts.js','/static/plugins/ng-google-chart.js']
	      }
	    },	  
	  },
	  cssmin: {
		  /*css: {
		    files: {
		      'static/build/css/asyn_styles.min.css': ['static/build/css/asyn_styles.css']
		    }
		  },*/
		  /*custom_css: {
		    files: {
		      'static/build/css/custom_css.min.css': ['static/build/css/test.css']
		    }
		  },*/
		  sync_css: {
		    files: {
		      'static/build/css/sync_styles.min.css': ['static/build/css/sync_styles.css']
		    }
		  },
		},
	  uglify: {
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
	    /*sync_ctrls_sers_js: {
	      files: {
	        'static/build/js/sync_ctrls_sers_scripts.min.js': ['static/app/scripts/services/authservices.js','static/app/scripts/services/infonodeservices.js','static/app/scripts/services/mapservices.js','static/app/scripts/services/accountservices.js','static/app/scripts/services/contactservices.js','static/app/scripts/services/opportunityservices.js','static/app/scripts/services/leadservices.js','static/app/scripts/services/caseservices.js','static/app/scripts/services/discoverservices.js','static/app/scripts/services/topicservices.js','static/app/scripts/services/taskservices.js','static/app/scripts/services/eventservices.js','static/app/scripts/services/userservices.js','static/app/scripts/services/groupservices.js','static/app/scripts/services/noteservices.js','static/app/scripts/services/commentservices.js','static/app/scripts/services/settingservices.js','static/app/scripts/services/importservices.js','static/app/scripts/services/edgeservices.js','static/app/scripts/services/reportservices.js','static/app/scripts/services/profileservices.js','static/app/scripts/services/linkedinservices.js','static/app/scripts/app.js','static/app/scripts/directives/directives.js','static/app/scripts/services/helpers.js','static/app/scripts/controllers/discovercontrollers.js','static/app/scripts/controllers/mysettingcontrollers.js','static/app/scripts/controllers/searchcontrollers.js','static/app/scripts/controllers/accountcontrollers.js','static/app/scripts/controllers/leadcontrollers.js','static/app/scripts/controllers/casecontrollers.js','static/app/scripts/controllers/billingController.js','static/app/scripts/controllers/contactcontroller.js','static/app/scripts/controllers/opportunitycontroller.js','static/app/scripts/controllers/documentcontrollers.js','static/app/scripts/controllers/notecontrollers.js','static/app/scripts/controllers/taskcontrollers.js','static/app/scripts/controllers/eventcontrollers.js','static/app/scripts/controllers/dashboardController.js','static/app/scripts/controllers/usercontrollers.js','static/app/scripts/controllers/groupcontrollers.js','static/app/scripts/controllers/settingscontrollers.js','static/app/scripts/controllers/importcontrollers.js']
	      }
	    },*/
	    /*sync_ctrls_sers_js: {
	      files: {
	        'static/build/js/async_scripts_2.min.js': ['static/build/js/async_scripts_2.js']
	      }
	    },*/	
	    sync_ctrls_sers_js: {
	      files: {
	        'static/build/js/first_sync_scripts.min.js': ['static/build/js/first_sync_scripts.js']
	      }
	    },     
	    /*async_ctrls_sers_js: {
	      files: {
	        'static/build/js/async_ctrls_sers_scripts.min.js': ['static/app/scripts/services/mapservices.js','static/app/scripts/services/caseservices.js','static/app/scripts/services/discoverservices.js','static/app/scripts/services/topicservices.js','static/app/scripts/services/eventservices.js','static/app/scripts/services/groupservices.js','static/app/scripts/services/noteservices.js','static/app/scripts/services/commentservices.js','static/app/scripts/services/importservices.js','static/app/scripts/services/reportservices.js','static/app/scripts/controllers/discovercontrollers.js','static/app/scripts/controllers/casecontrollers.js','static/app/scripts/controllers/documentcontrollers.js','static/app/scripts/controllers/notecontrollers.js','static/app/scripts/controllers/eventcontrollers.js','static/app/scripts/controllers/dashboardController.js','static/app/scripts/controllers/groupcontrollers.js','static/app/scripts/controllers/importcontrollers.js']
	      }
	    },*/
	  },
	  watch: {
		  js: {
		    files: ['static/build/css/test.css'],
		    tasks: ['cssmin'],
		  },
		  sync_ctrls_servs: {
	    		files: ['static/app/scripts/services/authservices.js','static/app/scripts/services/infonodeservices.js','static/app/scripts/services/accountservices.js','static/app/scripts/services/contactservices.js','static/app/scripts/services/opportunityservices.js','static/app/scripts/services/leadservices.js','static/app/scripts/services/taskservices.js','static/app/scripts/services/userservices.js','static/app/scripts/services/settingservices.js','static/app/scripts/services/edgeservices.js','static/app/scripts/services/profileservices.js','static/app/scripts/services/linkedinservices.js','static/app/scripts/app.js','static/app/scripts/directives/directives.js','static/app/scripts/controllers/mysettingcontrollers.js','static/app/scripts/controllers/searchcontrollers.js','static/app/scripts/controllers/accountcontrollers.js','static/app/scripts/controllers/leadcontrollers.js','static/app/scripts/controllers/billingController.js','static/app/scripts/controllers/contactcontroller.js','static/app/scripts/controllers/opportunitycontroller.js','static/app/scripts/controllers/taskcontrollers.js','static/app/scripts/controllers/usercontrollers.js','static/app/scripts/controllers/settingscontrollers.js'],
	    		tasks: ['uglify'],
	  	  },
	  	  async_ctrls_servs: {
	  	  		files: ['static/app/scripts/services/mapservices.js','static/app/scripts/services/caseservices.js','static/app/scripts/services/discoverservices.js','static/app/scripts/services/topicservices.js','static/app/scripts/services/eventservices.js','static/app/scripts/services/groupservices.js','static/app/scripts/services/noteservices.js','static/app/scripts/services/commentservices.js','static/app/scripts/services/importservices.js','static/app/scripts/services/reportservices.js','static/app/scripts/controllers/discovercontrollers.js','static/app/scripts/controllers/casecontrollers.js','static/app/scripts/controllers/documentcontrollers.js','static/app/scripts/controllers/notecontrollers.js','static/app/scripts/controllers/eventcontrollers.js','static/app/scripts/controllers/dashboardController.js','static/app/scripts/controllers/groupcontrollers.js','static/app/scripts/controllers/importcontrollers.js'],
	    		tasks: ['uglify'],
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
	  }
	});
 grunt.loadNpmTasks('grunt-contrib-concat');
 grunt.loadNpmTasks('grunt-contrib-cssmin');
 grunt.loadNpmTasks('grunt-contrib-uglify');
 grunt.loadNpmTasks('grunt-contrib-watch');
 grunt.loadNpmTasks('grunt-contrib-imagemin');
}