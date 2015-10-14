app.controller('CustomFieldsEditCtrl', ['$scope', 'Auth', 'User', 'Map','Customfield',
    function ($scope, Auth, User, Map, Customfield) {
    	$scope.leads={
    		customfield:{options:[]},
    		customfields:[]

    	};
    	$scope.contacts={
			customfield:{options:[]},
    		customfields:[]
    	};
    	$scope.opportunities={
    		customfield:{options:[]},
    		customfields:[]
    	};
    	$scope.cases={
    		customfield:{options:[]},
    		customfields:[]
    	};
    	$scope.accounts={
    		customfield:{options:[]},
    		customfields:[]
    	};
    	$scope.customfield={};
    	$scope.customfield.options=[];
    	$scope.selectedTab = 1;
    	$scope.isLoading=false;
        $scope.nbLoads=0;
        $("ul.page-sidebar-menu li").removeClass("active");
        $("#id_CustomFields").addClass("active");
        $scope.runTheProcess = function() {

        };
        $scope.inProcess=function(varBool,message){
          if (varBool) {   
            if (message) {
              console.log("starts of :"+message);
             
            };
            $scope.nbLoads=$scope.nbLoads+1;
            if ($scope.nbLoads==1) {
              $scope.isLoading=true;
            };
          }else{
            if (message) {
              console.log("ends of :"+message);
            };
            $scope.nbLoads=$scope.nbLoads-1;
            if ($scope.nbLoads==0) {
               $scope.isLoading=false;
            };
          };
        } 
         $scope.apply=function(){
         
          if ($scope.$root.$$phase != '$apply' && $scope.$root.$$phase != '$digest') {
               $scope.$apply();
              }
              return false;
        }
        $scope.clearCustomfield=function(customfield){
        	customfield={options:[]};
        }
        $scope.isEmptyArray=function(Array){
                if (Array!=undefined && Array.length>0) {
                return false;
                }else{
                    return true;
                };    
            
        }
        $scope.addCustomField=function(customfield,related_to){
        	var params={
						"field_type":customfield.type,
						"name":customfield.label,
						"related_object":related_to
						}
				if (!$scope.isEmptyArray(customfield.options)) {
					console.log('with options');
					console.log(customfield.options);
					params.options=customfield.options;
				};
				Customfield.insert($scope,params);
        }
        $scope.customfieldInserted=function(resp){
        	$scope[resp.related_object].customfield={options:[]};
        	var field={
        		'type':resp.field_type,
        		'options':resp.options,
        		'label':resp.name
        	}
        	$scope[resp.related_object].customfields.push(field);
        	$scope.apply();
        	console.log('leads.customfields');
        	console.log($scope.leads.customfields);

        };
        $scope.addOption=function(options,customfield){
        	console.log("clicked");
	        var option="Option "+(options.length+1);
        	if (option!=""&&options.indexOf(option)<0) {
        		options.push(option);
        	};
        	customfield.newOption="";
        }
        $scope.countArray=function(options){
        	return options.length+1;
        }
        $scope.removeOption=function(options,option){
        	if (option!="") {
        		options.splice(options.indexOf(option));
        	};	
        }
        $scope.udpateOption=function(index,customfield){
        	customfield.options[index]=$('#option-'+index).val();
        }
        Auth.init($scope);
    }]);
