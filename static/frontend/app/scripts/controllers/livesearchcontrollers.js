appLive.controller('SearchFormController', ['$scope','Search',
    function($scope,Search) {
     var params ={};
     $scope.result = undefined;
     $scope.q = undefined;
     $scope.$watch('searchQuery', function() {
         params['q'] = $scope.searchQuery;
         gapi.client.iogrowlive.search(params).execute(function(resp) {
            if (resp.items){
              $scope.results = resp.items;
              $scope.$apply();
            };
            
          });
     });
     $scope.selectResult = function(){
        var url = Search.getUrl($scope.searchQuery.type,$scope.searchQuery.id);
        $scope.searchQuery=' ';
        window.location.replace(url);
     };
     $scope.executeSearch = function(searchQuery){
      if (typeof(searchQuery)=='string'){
         window.location.replace('#/search/'+searchQuery);
      }else{
        var url = Search.getUrl($scope.searchQuery.type,$scope.searchQuery.id);
        $scope.searchQuery=' ';
        window.location.replace(url);
      }
      
     };
}]);