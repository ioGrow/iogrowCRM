module.exports=function(grunt){
 grunt.initConfig({
	  concat: {
	    css:{
	      src: ['static/bootstrap3/plugins/select2/select2_metro.css','static/bootstrap3/plugins/uniform/css/uniform.default.css','static/plugins/date-time-picker/jquery.simple-dtpicker.css','static/plugins/jquery-easy-pie-chart/jquery.easy-pie-chart.css','static/angular-xeditable-0.1.8/css/xeditable.css','static/plugins/fullcalendar/fullcalendar.css','static/plugins/fullcalendar/fullcalendar.print.css'],
	      dest: 'static/build/css/asyn_styles.css',
	    }
	  },
	  cssmin: {
		  /*css: {
		    files: {
		      'static/build/css/asyn_styles.min.css': ['static/build/css/asyn_styles.css']
		    }
		  },*/
		  custom_css: {
		    files: {
		      'static/build/css/custom_css.min.css': ['static/build/css/test.css']
		    }
		  },
		},
	  uglify: {
	    sync_js: {
	      files: {
	        'static/build/js/sync_scripts.min.js': ['static/build/js/sync_scripts.js']
	      }
	    },
	    async_js: {
	      files: {
	        'static/build/js/async_scripts.min.js': ['static/build/js/async_scripts.js']
	      }
	    }
	  },
	  watch: {
		  js: {
		    files: ['static/build/css/test.css'],
		    tasks: ['cssmin'],
		  }
	  },
	});
 grunt.loadNpmTasks('grunt-contrib-concat');
 grunt.loadNpmTasks('grunt-contrib-cssmin');
 grunt.loadNpmTasks('grunt-contrib-uglify');
 grunt.loadNpmTasks('grunt-contrib-watch');
}