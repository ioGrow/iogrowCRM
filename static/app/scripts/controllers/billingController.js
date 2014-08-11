app.controller('BillingController', ['$scope','$route', 'Auth','Search','User',
    function($scope,$route,Auth,Search,User) {
  
     $scope.organization_key=document.getElementById('organization_key').value;


     $scope.isSignedIn = false;
     $scope.immediateFailed = false;
     //
     $scope.isContentLoaded = true;
     $scope.nextPageToken = undefined;
     $scope.prevPageToken = undefined;
     $scope.isLoading = false;
     $scope.pagination = {};
     $scope.currentPage = 01;
     $scope.pages = [];
     
     $scope.users = [];
    
    // What to do after authentication
      $scope.runTheProcess = function(){
    
           var params={'organization':$scope.organization_key
                       }
          User.get_organization($scope,params);
           var params = {'limit':7};
          User.list($scope,params);

       };
  
     // We need to call this to refresh token when user credentials are invalid
     $scope.refreshToken = function() {
          Auth.refreshToken();
     };  

   $scope.listNextPageItems = function(){
        
        
        var nextPage = $scope.currentPage + 1;
        var params = {};
          if ($scope.pages[nextPage]){
            params = {'limit':7,
                      'pageToken':$scope.pages[nextPage]
                     }
          }else{
            params = {'limit':7}
          }
          console.log('in listNextPageItems');
          $scope.currentPage = $scope.currentPage + 1 ; 
          User.list($scope,params);
     }
     $scope.listPrevPageItems = function(){
       
       var prevPage = $scope.currentPage - 1;
       var params = {};
          if ($scope.pages[prevPage]){
            params = {'limit':7,
                      'pageToken':$scope.pages[prevPage]
                     }
          }else{
            params = {'limit':7}
          }
          $scope.currentPage = $scope.currentPage - 1 ;
          User.list($scope,params);
     }
    

     
     $scope.showModal = function(){
        console.log('button clicked');
        $('#addAccountModal').modal('show');

      };
      
    $scope.addNewUser = function(user){
      console.log('add a new user');
      console.log(user);
      $('#addAccountModal').modal('hide');
      User.insert($scope,user);
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




app.controller('BillingShowController', ['$scope','$route', 'Auth','Search','User',
    function($scope,$route,Auth,Search,User) {
  
     //$scope.organization_key=document.getElementById('organization_key').value;

     console.log("*******************************");
     console.log("i never give up bacause i'm not coward!");
     console.log($route.current.params.userId);
     console.log("*******************************");

     $scope.isSignedIn = false;
     $scope.immediateFailed = false;
     //
     $scope.isContentLoaded = true;
     $scope.nextPageToken = undefined;
     $scope.prevPageToken = undefined;
     $scope.isLoading = false;
     $scope.pagination = {};
     $scope.currentPage = 01;
     $scope.pages = [];
     
     $scope.users = [];
    
    // What to do after authentication
      $scope.runTheProcess = function(){
    
          //  var params={'organization':$scope.organization_key
          //              }
          // User.get_organization($scope,params);
          //  var params = {'limit':7};
          // User.list($scope,params);

       };
  
     // We need to call this to refresh token when user credentials are invalid
     $scope.refreshToken = function() {
          Auth.refreshToken();
     };  

   
    



     // Google+ Authentication 
     Auth.init($scope);
     
}]);
