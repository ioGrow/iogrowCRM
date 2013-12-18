app.controller('SearchFormController', ['$scope',
    function($scope) {
     var params ={};
     $scope.result = undefined;
     $scope.q = undefined;
     $scope.$watch('searchQuery', function() {
         params['q'] = $scope.searchQuery;
         gapi.client.crmengine.search(params).execute(function(resp) {
            if (resp.items){
              $scope.results = resp.items;
              $scope.$apply();
            };
            
          });
     });
     $scope.selectResult = function(){
        // To do update this method
        window.location.replace('#/accounts/show/'+$scope.searchQuery.id);
     };
     $scope.executeSearch = function(searchQuery){
      if (typeof(searchQuery)=='string'){
         window.location.replace('#/search/'+searchQuery);
      }else{
        window.location.replace('#/accounts/show/'+searchQuery.id);
      }
      $scope.searchQuery=' ';
     };
}]);

app.controller('SearchShowController', ['$scope','$route', 'Auth','Search',
    function($scope,$route,Auth,Search) {
     $scope.isSignedIn = false;
     $scope.immediateFailed = false;
     $scope.nextPageToken = undefined;
     $scope.prevPageToken = undefined;
     $scope.isLoading = false;
     $scope.pagination = {};
     $scope.currentPage = 01;
     $scope.pages = [];
    
     // What to do after authentication
     $scope.runTheProcess = function(){
          var params = {'limit':7,'q':$route.current.params.q};
          Search.list($scope,params);
     };
     // We need to call this to refresh token when user credentials are invalid
     $scope.refreshToken = function() {
          Auth.refreshToken();
     };
     
     $scope.listNextPageItems = function(){
        var nextPage = $scope.currentPage + 1;
        var params = {};
          if ($scope.pages[nextPage]){
            params = {'q':$route.current.params.q,
                      'limit':7,
                      
                      'pageToken':$scope.pages[nextPage]
                     }
          }else{
            params = {'q':$route.current.params.q,
                      'limit':7}
          }

          $scope.currentPage = $scope.currentPage + 1 ; 
          Search.list($scope,params);
     };
     $scope.listPrevPageItems = function(){
       var prevPage = $scope.currentPage - 1;
       var params = {};
          if ($scope.pages[prevPage]){
            params = { 'q':$route.current.params.q,
                      'limit':7,

                      'pageToken':$scope.pages[prevPage]
                     }
        }else{
            params = {'q':$route.current.params.q,
                      'limit':7}
          }
          $scope.currentPage = $scope.currentPage - 1 ;
          Search.list($scope,params);
     };   

     // Google+ Authentication 
     Auth.init($scope);
     
}]);
