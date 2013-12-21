app.controller('CompanyProfileShowCtrl', ['$scope','$filter','Auth','Show',
    function($scope,$filter,Auth,Show) {
     $("#id_Company_profile").addClass("active");
     $scope.isSignedIn = false;
     $scope.immediateFailed = false;
     $scope.nextPageToken = undefined;
     $scope.prevPageToken = undefined;
     $scope.isLoading = false;
     $scope.pagination = {};
     $scope.currentPage = 01;
     $scope.pages = [];
     
     $scope.accounts = [];
     
     

     // What to do after authentication
     $scope.runTheProcess = function(){
          var params = {'limit':7};
          Show.list($scope,params);
     };
     // We need to call this to refresh token when user credentials are invalid
     $scope.refreshToken = function() {
            Auth.refreshToken();
     };
   // Google+ Authentication 
    Auth.init($scope);

    
}]);

