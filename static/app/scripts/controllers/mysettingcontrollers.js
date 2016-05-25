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

  
     // We need to call this to refresh token when user credentials are invalid
     $scope.refreshToken = function() {
          Auth.refreshToken();
     };  


   
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