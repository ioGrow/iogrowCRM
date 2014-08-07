app.controller('BillingController', ['$scope','$route', 'Auth','Search','User',
    function($scope,$route,Auth,Search,User) {

      console.log("here we go ");

     $scope.isSignedIn = false;
     $scope.immediateFailed = false;
     $scope.nextPageToken = undefined;
     $scope.prevPageToken = undefined;
     $scope.isLoading = false;
     $scope.user = {};
     $scope.currentPage = 01;
     $scope.pages = [];
    
    // What to do after authentication
      $scope.runTheProcess = function(){
          
          //User.get($scope,params);
       };
  
     // We need to call this to refresh token when user credentials are invalid
     $scope.refreshToken = function() {
          Auth.refreshToken();
     };  


    



     // Google+ Authentication 
     Auth.init($scope);
     
}]);