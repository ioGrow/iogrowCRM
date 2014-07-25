app.controller('UserListCtrl', ['$scope','Auth','User',
    function($scope,Auth,User) {
     
     $("ul.page-sidebar-menu li").removeClass("active");
     $("#id_Users").addClass("active");
     $scope.isSignedIn = false;
     $scope.immediateFailed = false;
     $scope.nextPageToken = undefined;
     $scope.prevPageToken = undefined;
     $scope.isLoading = false;
     $scope.pagination = {};
     $scope.currentPage = 01;
     $scope.pages = [];
     
     $scope.users = [];
     
     

     // What to do after authentication
     $scope.runTheProcess = function(){
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

app.controller('UserNewCtrl', ['$scope','Auth','User',
    function($scope,Auth,User) {
     
     $("ul.page-sidebar-menu li").removeClass("active");
     $("#id_Users").addClass("active");
     $scope.isSignedIn = false;
     $scope.immediateFailed = false;
     $scope.nextPageToken = undefined;
     $scope.prevPageToken = undefined;
     $scope.isLoading = false;
     $scope.pagination = {};
     $scope.currentPage = 01;
     $scope.pages = [];
     $scope.emails=[];
     $scope.users = [];
     $scope.message="";
     

      $scope.status = 'New';

      $scope.showEmailForm=false;
     
     

     // What to do after authentication
     $scope.runTheProcess = function(){
          var params = {'limit':7};
          User.list($scope,params);
     };
     // We need to call this to refresh token when user credentials are invalid
     $scope.refreshToken = function() {
            Auth.refreshToken();
     };
     



    $scope.deleteInfos = function(arr,index){
          arr.splice(index, 1);
      };
  
      
    $scope.addNewUser = function(message){
      console.log('add a new user');      
      emailss=[];
      for (i=0; i< ($scope.emails).length; i++){
        emailss[i]=$scope.emails[i].email;
      }
     
      params={'emails':emailss,
                'message' : $scope.message
                }
      User.insert($scope,params);
    };

    $scope.getPosition= function(index){
        if(index<4){
         
          return index+1;
        }else{
          return (index%4)+1;
        }
     };
     
      $scope.initObject=function(obj){
          for (var key in obj) {
                obj[key]=null;
              }
      }
      $scope.pushElement = function(elem, arr, infos) {
            if (arr.indexOf(elem) == -1) {

                switch (infos) {
                    
                    case 'emails' :
                        if (elem.email) {
                            var copyOfElement = angular.copy(elem);
                            arr.push(copyOfElement);
                            $scope.initObject(elem);
                        }
                        $scope.showEmailForm = false;
                        $scope.email.email = ''
                        break;
                                    }
            } else {
                alert("item already exit");
            }
        };

   
     

     



     
   
  // Google+ Authentication 
    Auth.init($scope);
    
}]);
