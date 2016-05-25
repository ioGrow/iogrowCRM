
app.controller('LeadScoringCtrl', ['$scope', 'Auth', 'User', 'Map',
    function ($scope, Auth, User, Map) {
        $scope.leads={
            scoringfield:{options:[]},
            scoringfields:[]
        };
        $scope.scoringfield={};
        $scope.scoringfield.options=[];
        $scope.isLoading=false;
        $scope.nbLoads=0;
        $scope.scoringfieldSelected={};
        $scope.runTheProcess = function () {
        };
        $scope.clearCustomfield=function(related_object){
            $scope[related_object].scoringfield={options:[]}; 
            $scope.apply();
        }
        $scope.isEmptyArray=function(Array){
                return !(Array != undefined && Array.length > 0);;s
        }
        $scope.addCustomField=function(scoringfield,related_to){
            var params={
                        "field_type":scoringfield.field_type,
                        "name":scoringfield.name,
                        "related_object":related_to
                        }
                if (!$scope.isEmptyArray(scoringfield.options)) {
                    params.options=scoringfield.options;
                };
                Customfield.insert($scope,params);
        }
        $scope.customfieldInserted=function(resp){
            $scope[resp.related_object].scoringfield={options:[]};
            if ($scope[resp.related_object].customfields==undefined) {
                $scope[resp.related_object].customfields=[];   
            };
            $scope[resp.related_object].customfields.push(resp);
            $scope.apply();

        };
        $scope.addOption=function(options,scoringfield){
            var option="Option "+(options.length+1);
            if (option!=""&&options.indexOf(option)<0) {
                options.push(option);
            };
            scoringfield.newOption="";
        }
        $scope.countArray=function(options){
            return options.length+1;
        }
        $scope.removeOption=function(options,option){
            if (option!="") {
                options.splice(options.indexOf(option));
            };  
        }
        $scope.udpateOption=function(index,scoringfield){
            scoringfield.options[index]=$('#option-'+index).val();
        }
        // We need to call this to refresh token when user credentials are invalid
        $scope.refreshToken = function () {
            Auth.refreshToken();
        };
         $scope.apply=function(){
         
          if ($scope.$root.$$phase != '$apply' && $scope.$root.$$phase != '$digest') {
               $scope.$apply();
              }
              return false;
        }
        $scope.isUpdatingLogo = true;
        // Google+ Authentication
        Auth.init($scope);
    }]);