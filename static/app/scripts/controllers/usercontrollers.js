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
     //////////:

      $scope.stage_selected={};
      $scope.contacts = [];
      $scope.contact = {};
      $scope.contact.access ='public';
      $scope.order = '-updated_at';
      $scope.status = 'New';
      $scope.showPhoneForm=false;
      $scope.showEmailForm=false;
      $scope.showWebsiteForm=false;
      $scope.showSociallinkForm=false;
      $scope.showCustomFieldForm =false;
      $scope.phones=[];
      $scope.addresses=[];
      $scope.emails=[];
     
     

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
      
    $scope.addNewUser = function(contact,message){
      console.log('add a new user');
      emailss=[];
      for (i=0; i< ($scope.emails).length; i++){
        emailss[i]=$scope.emails[i].email;
      }
      $('#addAccountModal').modal('hide');
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
     
     /////////////


     
      
     
      $scope.initObject=function(obj){
        console.log("iniiiiiiiiiiiiiii");
          for (var key in obj) {
                obj[key]=null;
              }
      }
      $scope.pushElement = function(elem, arr, infos) {
            console.log(elem);
            console.log(arr);
            console.log(infos);
            if (arr.indexOf(elem) == -1) {
                // var copyOfElement = angular.copy(elem);
                // arr.push(copyOfElement);
                // $scope.initObject(elem);

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

   
     

   
      // new Contact
     $scope.save = function(contact){
          var delayInsert = false;
          console.log("semail");
          console.log($scope.emails);
          var params ={
                        'firstname':contact.firstname,
                        'lastname':contact.lastname,
                        'title':contact.title,
                        'tagline':contact.tagline,
                        'introduction':contact.introduction,
                        'phones':$scope.phones,
                        'emails':$scope.emails,
                        'addresses':$scope.addresses,
                        'infonodes':$scope.prepareInfonodes(),
                        'access': contact.access
                      };
          if (typeof(contact.account)=='object'){
              params['account'] = contact.account.entityKey;
          }else if($scope.searchAccountQuery){
              if ($scope.searchAccountQuery.length>0){
                // create a new account with this account name
                var accountparams = {
                                      'name': $scope.searchAccountQuery,
                                      'access': contact.access
                                    };
                $scope.contact = contact;
                Account.insert($scope,accountparams);
                delayInsert = true;
              };
          };
          if(!delayInsert){
            if ($scope.profile_img.profile_img_id){
                params['profile_img_id'] = $scope.profile_img.profile_img_id;
                params['profile_img_url'] = 'https://docs.google.com/uc?id='+$scope.profile_img.profile_img_id;
            }
            Contact.insert($scope,params);
          }

      };
     





     
   
  // Google+ Authentication 
    Auth.init($scope);
    
}]);
