var edgeservices = angular.module('crmEngine.edgeservices',[]);


edgeservices.factory('Edge', function($http) {
  
  var Edge = function(data) {
    angular.extend(this, data);
  }

  

 
   Edge.insert = function($scope,params){
      $scope.isLoading = true;
      console.log(params);
      gapi.client.crmengine.edges.insert(params).execute(function(resp) {
         if(!resp.code){
            $scope.edgeInserted();
            $scope.isLoading = false;

            $scope.$apply();
         
         }else{
          console.log(resp.code);
         }
      });
     $scope.isLoading=false;

  };

  

  Edge.delete = function($scope,params){
    $scope.isLoading = true;
    if ($scope.showPage) {
      var tag=params.tag;
      var index=params.index;
      params = {'entityKey': params.tag.edgeKey};
    };
    gapi.client.crmengine.edges.delete(params).execute(function(resp){
        console.log('params');
        console.log(params);
        $scope.isLoading = false;
        if ($scope.showPage) {
          $scope.edgeDeleted(index);
        }else{
          if ($scope.tagtoUnattach) {
            $scope.tagUnattached();
            console.log("ttttttttt");
          };
        };
      })
     $scope.isLoading=false;
    
  };


  

return Edge;
});

