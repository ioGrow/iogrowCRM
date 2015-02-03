app.controller('MysettingShowController', ['$scope','$route', 'Auth','Search','User',
    function($scope,$route,Auth,Search,User) {
     $scope.isSignedIn = false;
     $scope.immediateFailed = false;
     $scope.nextPageToken = undefined;
     $scope.prevPageToken = undefined;
     $scope.isLoading = false;
     $scope.user = {};
     $scope.currentPage = 01;
     $scope.pages = [];
     $scope.UploadLogo=false;
    
    // What to do after authentication
      /* $scope.runTheProcess = function(){
          
          User.get($scope,params);
       };*/
  
     // We need to call this to refresh token when user credentials are invalid
     $scope.refreshToken = function() {
          Auth.refreshToken();
     };  



// HADJI HICHAM 3/02/2015
$scope.showUploadButton=function(){
     $scope.UploadLogo=true;
     
}
     
//HKA 25.03.2014 update user language
$scope.updatelanguage = function(user,idUser){ 

  var params = {'id':idUser,
     'language':user.language
    };
 
    User.patch($scope,params);
   $('#EditSetting').modal('hide'); 

};
    



     // Google+ Authentication 
     Auth.init($scope);
     
}]);