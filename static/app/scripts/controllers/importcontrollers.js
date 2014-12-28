app.controller('ImportListCtrl', ['$scope','Auth','Import',
    function($scope,Auth,Import) {
     $("ul.page-sidebar-menu li").removeClass("active");
     $("#id_Imports").addClass("active");
     $scope.isSignedIn = false;
     $scope.immediateFailed = false;
     $scope.nextPageToken = undefined;
     $scope.prevPageToken = undefined;
     $scope.isLoading = false;
     $scope.pagination = {};
     $scope.currentPage = 01;
     $scope.pages = [];
     $scope.users = [];
     $scope.groups = [];
     $scope.highrise={};

     // What to do after authentication
     $scope.runTheProcess = function(){
          ga('send', 'pageview', '/admin/import');
     };
     // We need to call this to refresh token when user credentials are invalid
     $scope.refreshToken = function() {
            Auth.refreshToken();
     };


    
 
   
    $scope.getPosition= function(index){
        if(index<4){
         
          return index+1;
        }else{
          return (index%4)+1;
        }
     };
    // Google+ Authentication 
    Auth.init($scope);
     
     
}]);

app.controller('ImportNewCtrl', ['$scope','Auth','Import',
    function($scope,Auth,Import) {
     $("ul.page-sidebar-menu li").removeClass("active");
     $("#id_Imports").addClass("active");
     $scope.isSignedIn = false;
     $scope.immediateFailed = false;
     $scope.nextPageToken = undefined;
     $scope.prevPageToken = undefined;
     $scope.isLoading = false;
     $scope.pagination = {};
     $scope.currentPage = 01;
     $scope.pages = [];
     $scope.users = [];
     $scope.groups = [];
     $scope.highrise={};

     // What to do after authentication
     $scope.runTheProcess = function(){
          var params = {'limit':7}
     };
     // We need to call this to refresh token when user credentials are invalid
     $scope.refreshToken = function() {
            Auth.refreshToken();
     };
    $scope.import=function(highrise){
     Import.highrise($scope,highrise);
    }
      
    
    // Google+ Authentication 
    Auth.init($scope);
     
     
}]);

