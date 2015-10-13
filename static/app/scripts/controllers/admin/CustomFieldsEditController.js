app.controller('CustomFieldsEditCtrl', ['$scope', 'Auth', 'User', 'Map',
    function ($scope, Auth, User, Map) {
    	$scope.customfield={};
    	$scope.customfield.options=[];
    	$scope.customfields=[];
        $("ul.page-sidebar-menu li").removeClass("active");
        $("#id_CustomFields").addClass("active");
        $scope.addOption=function(options){
        	console.log("clicked")
        	var option="Option "+(options.length+1);
        	if (option!=""&&options.indexOf(option)<0) {
        		options.push(option);
        	};
        	$scope.customfield.newOption="";
        }
        $scope.countArray=function(options){
        	return options.length+1;
        }
        $scope.removeOption=function(options,option){
        	if (option!="") {
        		options.splice(options.indexOf(option));
        	};	
        }
        $scope.udpateOption=function(index){
        	$scope.customfield.options[index]=$('#option-'+index).val();
        }
        $scope.buildElement=function(customfield){
        	console.log('fired');
        	// $('#elementContainer').empty();
        	var htmlElement=null;
         	var type=null;
        	switch (customfield.type) {
                    case 'text' :
                    	htmlElement='<input/>';
                    	type: 'text'
                        break;
                    case 'paragraph' :
                    	htmlElement='<textarea/>'
                        break;
                    case 'multiple_choice' :
                    	htmlElement='<input/>';
                    	type='radio'
                        break;
                    case 'checkbox' :
                    	htmlElement='<input>';
                    	type: 'text'
                        break;
                    case 'list' :
                    	htmlElement='<select/>'
                        break;
	                    }
	        var props={
	        	id:'previewElement',
	        	class:'form-control'
	        }
	        if (type!=null) {
	        	props.type=type;
	        };
        	// jQuery(htmlElement,props).appendTo('#elementContainer');
			if (htmlElement=="<select/>"&&customfield.options.length>0) {
				// for (var i = 0; i < customfield.options.length; i++) {
				// 	jQuery('<option/>', {
				// 			    id: 'foo',
				// 			    value:customfield.options[i],
				// 			    text:customfield.options[i]
				// 			}).appendTo('#previewElement');
				// };
				// jQuery('<option/>', {
				// 			    ngRepeat:"option in customfield.options",
				// 			    text:'<%=option%>'
				// 			}).appendTo('#previewElement');
			};
        }
        $scope.$watch('customfield.options', function(newValue, oldValue) {
		      console.log("value");
			 });

    }]);
