var contactservices = angular.module('crmEngine.infonodeservices',[]);
// Base sercice (create, delete, get)

accountservices.factory('InfoNode', function($http) {
  
  var InfoNode = function(data) {
    angular.extend(this, data);
  }

  
  
  InfoNode.list = function($scope,params){
      gapi.client.crmengine.infonode.list(params).execute(function(resp) {
            if(!resp.code){
              var renderMap = false;
                for (var i=0;i<resp.items.length;i++)
                { 
                  if (resp.items[i].kind == 'addresses'){
                    renderMap = true;
                  }
                    $scope.infonodes[resp.items[i].kind] = resp.items[i].items;
                    for (var j=0;j<$scope.infonodes[resp.items[i].kind].length;j++)
                      {
                        for (var v=0;v<$scope.infonodes[resp.items[i].kind][j].fields.length;v++)
                          {
                            $scope.infonodes[resp.items[i].kind][j][$scope.infonodes[resp.items[i].kind][j].fields[v].field] = $scope.infonodes[resp.items[i].kind][j].fields[v].value;
                          }
                      }
                }
                if (renderMap){
                  $scope.renderMaps();
                }
                // Loaded succefully
                 $scope.isLoading = false;
                 // Call the method $apply to make the update on the scope
                 $scope.$apply();

              } else {
                 if(resp.message=="Invalid token"){
                $scope.refreshToken();
                $scope.isLoading = false;
                $scope.$apply();
               };
              }
              
      });
    
  	

  };
  
  InfoNode.insert = function($scope,params){
      $scope.isLoading = true;
      gapi.client.crmengine.infonode.insert(params).execute(function(resp) {
          if(!resp.code){
          $scope.isLoading = false;
          $scope.listInfonodes(params.kind);
        }else{
            console.log(resp.message);
             
             $('#errorModal').modal('show');
             if(resp.message=="Invalid grant"){
                $scope.refreshToken();
                $scope.isLoading = false;
                $scope.$apply();
             };
         }
      });
  };
  InfoNode.patch = function($scope,params){
      $scope.isLoading = true;
      gapi.client.crmengine.infonode.patch(params).execute(function(resp) {
          if(!resp.code){
          $scope.isLoading = false;
          $scope.listInfonodes(params.kind);
        }else{
            console.log(resp.message);
             
             $('#errorModal').modal('show');
             if(resp.message=="Invalid grant"){
                $scope.refreshToken();
                $scope.isLoading = false;
                $scope.$apply();
             };
         }
      });
  };

  

return InfoNode;
});

