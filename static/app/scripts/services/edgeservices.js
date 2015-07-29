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
    $scope.inProcess(true);
    if ($scope.showPage) {
      if (!jQuery.isEmptyObject($scope.selectedItem)) {
        var index=$scope.selectedItem.index;
      }else{
        var tag=params.tag;
        var index=params.index;
        params = {'entityKey': params.tag.edgeKey};
      };
    };
    console.log(params);
    gapi.client.crmengine.edges.delete(params).execute(function(resp){
        if ($scope.showPage) {
           $scope.inProcess(false);
          if (tag.entityKey) {
            $scope.edgeDeleted(index);
          }else{
            $scope.itemDisassociated();
          };
          
        }else{
          $scope.inProcess(false);
          if ($scope.tagtoUnattach) {
            $scope.tagUnattached();
            
          };
        };
        
      })
 };
  

return Edge;
});

