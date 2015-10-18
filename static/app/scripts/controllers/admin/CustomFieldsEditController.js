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
        $scope.customfieldSelected={};
        $("ul.page-sidebar-menu li").removeClass("active");
        $("#id_CustomFields").addClass("active");
        $scope.runTheProcess = function() {
			Customfield.list($scope,{related_object:"leads"});
			/*Customfield.list($scope,{related_object:"opportunities"});
			Customfield.list($scope,{related_object:"contacts"});
			Customfield.list($scope,{related_object:"accounts"});
			Customfield.list($scope,{related_object:"cases"});*/
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
        $scope.beforeUpdateCusField=function(customfield){
        	var related_object=customfield.related_object;
        	$scope[related_object].customfield=customfield;
        }
        $scope.updateCusField=function(customfield){

        }
        $scope.beforeDeleteCusField=function(customfield){
        	$scope.customfieldSelected=customfield;
        	$('#BeforedeleteCustom').modal('show');
        }
        $scope.delete=function(key){
        	var params={entityKey:key}
        	Customfield.delete($scope,params);
        	$('#BeforedeleteCustom').modal('hide');
        }
        $scope.customFieldDeleted=function(){
        	var related_object=$scope.customfieldSelected.related_object;
        	var ind=$scope[related_object].customfields.indexOf($scope.customfieldSelected);
        	$scope[related_object].customfields.splice(ind,1);
        	$scope.customfieldSelected={};
        	$scope.apply();
        }
         $scope.apply=function(){
         
          if ($scope.$root.$$phase != '$apply' && $scope.$root.$$phase != '$digest') {
               $scope.$apply();
              }
              return false;
        }
        $scope.clearCustomfield=function(related_object){
        	$scope[related_object].customfield={options:[]}; 
        	$scope.apply();
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
						"field_type":customfield.field_type,
						"name":customfield.name,
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
        	$scope[resp.related_object].customfields.push(resp);
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
