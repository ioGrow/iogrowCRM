app.controller('CustomFieldsEditCtrl', ['$scope','$route', 'Auth', 'User', 'Map','Customfield',
    function ($scope, $route ,Auth, User, Map, Customfield) {
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
    	$scope.isLoading=false;
        $scope.nbLoads=0;
        $scope.customfieldSelected={};
        $scope.selectedTab=$route.current.params.customfieldId || 1;
        $("ul.page-sidebar-menu li").removeClass("active");
        $("#id_CustomFields").addClass("active");
        $scope.runTheProcess = function() {
            switch(parseInt($scope.selectedTab)) {
                    case 1:
                        $scope.getCustomFields("leads");
                        break;
                    case 2:
                        $scope.getCustomFields("opportunities");
                        break;
                    case 3:
                        $scope.getCustomFields("contacts");
                        break;
                    case 4:
                        $scope.getCustomFields("accounts");
                        break;
                    case 5:
                        $scope.getCustomFields("cases");
                        break;
                    default:
                        //$scope.getCustomFields("leads");
                }
        };
        $scope.getCustomFields=function(related_object){
            Customfield.list($scope,{related_object:related_object});
        }
        $scope.listResponse=function(items,related_object){
            $scope[related_object].customfields=items;
            $scope.apply();
        }
        $scope.inProcess=function(varBool,message){
          if (varBool) {
            $scope.nbLoads += 1;
            if ($scope.nbLoads==1) {
              $scope.isLoading=true;
            };
          }else{
            $scope.nbLoads -= 1;
            if ($scope.nbLoads==0) {
               $scope.isLoading=false;
            };
          };
        } 
        $scope.sortCustomField=function($item,$indexTo){
            var params={
                id:$item.id,
                order:$indexTo+1
            }
            Customfield.patch($scope,params);
        }
        $scope.beforeUpdateCusField=function(customfield){
        	var related_object=customfield.related_object;
            if (customfield.options==undefined) {
                customfield.options=[];
            };
        	$scope[related_object].customfield=$.extend(true, {}, customfield);;
        }
        $scope.updateCustomField=function(related_object){
            var params=$scope[related_object].customfield;
            Customfield.patch($scope,params);
        }
        $scope.customFieldUpdated=function(customfield){
            if (!customfield.field_type) {
                console.log('in order');
            }else{
                var related_object=customfield.related_object;
                var customfields=$scope[related_object].customfields
                angular.forEach(customfields, function (cus) {
                    if (cus.id==customfield.id) {
                        cus.options=customfield.options;
                        cus.name=customfield.name;
                        cus.field_type=customfield.field_type;
                    };
                });
                $scope[related_object].customfield={};
                $scope.apply();
            };
        };
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
					params.options=customfield.options;
				};
				Customfield.insert($scope,params);
        }
        $scope.customfieldInserted=function(resp){
        	$scope[resp.related_object].customfield={options:[]};
            if ($scope[resp.related_object].customfields==undefined) {
                $scope[resp.related_object].customfields=[];   
            };
        	$scope[resp.related_object].customfields.push(resp);
        	$scope.apply();

        };
        $scope.addOption=function(options,customfield){
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
