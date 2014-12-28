var accountservices = angular.module('crmEngine.userservices',[]);
// Base sercice (create, delete, get)

accountservices.factory('User', function($http) {

  var User = function(data) {
    angular.extend(this, data);
  }

  User.getOrganizationLicensesStatus = function($scope,params) {
           
          gapi.client.crmengine.organizations.get(params).execute(function(resp) {
            if(!resp.code){
               $scope.organization = resp;
               console.log($scope.organization);
               $scope.setBillingDetails();
               $scope.$apply();

            }else {
               if(resp.code==401){
                if(resp.message=="Invalid grant"){
                    $scope.refreshToken();
                }
                $scope.isLoading = false;
                $scope.$apply();
               };
            }
            console.log('gapi #end_execute');
          });
  };
  User.assignLicense = function($scope,params) {
           $scope.isLoading = true;
           $scope.$apply();
          gapi.client.crmengine.organizations.assign_license(params).execute(function(resp) {
            if(!resp.code){
              $scope.isLoading = false;
               $scope.isSelected = false;
                $scope.selected_users=[];
               $scope.runTheProcess();

            }else {
               if(resp.code==401){
                if(resp.message=="Invalid grant"){
                    $scope.refreshToken();
                }
                $scope.isLoading = false;
                $scope.$apply();
               };
            }
            console.log('gapi #end_execute');
          });
  };

  User.unAssignLicense = function($scope,params) {
           $scope.isLoading = true;
           $scope.$apply();
          gapi.client.crmengine.organizations.unassign_license(params).execute(function(resp) {
            if(!resp.code){
                $scope.isLoading = false;
               $scope.isSelected = false;
                 $scope.selected_users=[];  
               $scope.runTheProcess();

            }else {
               if(resp.code==401){
                if(resp.message=="Invalid grant"){
                    $scope.refreshToken();
                }
                $scope.isLoading = false;
                $scope.$apply();
               };
            }
            console.log('gapi #end_execute');
          });
  };

  User.get = function($scope,id) {
           
          gapi.client.crmengine.users.get(id).execute(function(resp) {
            if(!resp.code){
               $scope.user = resp;
               
               // Call the method $apply to make the update on the scope
               $scope.$apply();

            }else {
               if(resp.code==401){
                $scope.refreshToken();
                $scope.isLoading = false;
                $scope.$apply();
               };
            }
            console.log('gapi #end_execute');
          });
  };
  
  User.customer = function($scope,id) {
           
          gapi.client.crmengine.users.customer(id).execute(function(resp) {
            if(!resp.code){
               $scope.user = resp;


               $scope.isLoading= false ;
               $scope.loadCharges=false;


              $scope.purchase($scope.user);
               // Call the method $apply to make the update on the scope
               $scope.$apply();

            }else {
               if(resp.code==401){
                $scope.refreshToken();
                $scope.isLoading = false;
                $scope.loadCharges=false;
                $scope.$apply();
               };
            }
            console.log('gapi #end_execute');
          });
  };
  
  User.list = function($scope,params){
      $scope.isLoading = true;
      gapi.client.crmengine.users.list(params).execute(function(resp) {
              if(!resp.code){
                 $scope.users = resp.items;
                 $scope.invitees = resp.invitees;
                 console.log($scope.invitees);
                 if ($scope.currentPage>1){
                      $scope.pagination.prev = true;
                   }else{
                       $scope.pagination.prev = false;
                   }
                 if (resp.nextPageToken){
                   var nextPage = $scope.currentPage + 1;
                   // Store the nextPageToken
                   $scope.pages[nextPage] = resp.nextPageToken;
                   $scope.pagination.next = true;

                 }else{
                  $scope.pagination.next = false;
                 }
                 // Loaded succefully
                 $scope.isLoading = false;
                 // Call the method $apply to make the update on the scope
                 $scope.$apply();
              }else {
                 if(resp.code==401){
                $scope.refreshToken();
                $scope.isLoading = false;
                $scope.$apply();
               };
              }
      });
  };
  // HADJI HICHAM  11/08/2014 -- get list Users with licenes .
User.Customers = function($scope,params){
      $scope.isLoading = true;
      console.log("lebdiri")
      gapi.client.crmengine.users.customers(params).execute(function(resp) {
              if(!resp.code){
                console.log("arezki")
                 $scope.users = resp.items;
                 $scope.invitees=resp.invitees;
                 

                 if ($scope.currentPage>1){
                      $scope.pagination.prev = true;
                   }else{
                       $scope.pagination.prev = false;
                   }
                 if (resp.nextPageToken){
                   var nextPage = $scope.currentPage + 1;
                   // Store the nextPageToken
                   $scope.pages[nextPage] = resp.nextPageToken;
                   $scope.pagination.next = true;

                 }else{
                  $scope.pagination.next = false;
                 }
                 // Loaded succefully
                 $scope.isLoading = false;
                 // Call the method $apply to make the update on the scope
                 $scope.$apply();
              }else {
                 if(resp.code==401){
                $scope.refreshToken();
                $scope.isLoading = false;
                $scope.$apply();
               };
              }
      });
  };
  User.insert = function($scope,params){

      //console.log(params.emails);
      gapi.client.crmengine.users.insert(params).execute(function(resp) {
         console.log('in insert resp');
         console.log(resp);
         if(!resp.code){
          console.log("there  are a response");
          $scope.isLoading = false;
         }else{
              console.log(resp.message);
               $('#addAccountModal').modal('hide');
                $('#errorModal').modal('show');
              if(resp.message=="Invalid grant"){
               $scope.refreshToken();
                $scope.isLoading = false;
                $scope.$apply();
            };
              // To do add custom error handler


         }
      });
  };

  User.patch = function($scope,params){


      gapi.client.crmengine.users.patch(params).execute(function(resp) {
            if(!resp.code){
               $scope.user = resp;

              console.log(resp);

                   // be careful , right it back !

              window.location.reload();



               // Call the method $apply to make the update on the scope
                $scope.$apply();

            }else {
               if(resp.code==401){
                $scope.refreshToken();
                $scope.isLoading = false;
                $scope.$apply();
               };
            }
            console.log('User.patch gapi #end_execute');
          });
  }


// hadji hicham 4/08/2014 -- get user by google user id 
User.get_user_by_gid=function($scope,params){
        
              
 gapi.client.crmengine.users.get_user_by_gid(params).execute(function(resp) {
      
         if(!resp.code){
            $scope.user_acc=resp ;
            
            $scope.renderCalendar(resp);
          $scope.isLoading = false;
         }else{
              console.log(resp.message);
               $('#addAccountModal').modal('hide');
                $('#errorModal').modal('show');
              if(resp.message=="Invalid grant"){
               $scope.refreshToken();
                $scope.isLoading = false;
                $scope.$apply();
            };
              // To do add custom error handler


         }
      } );
} 


// hadji hicham 10/08/2014 --  get organization info 
User.get_organization=function($scope,params){

   gapi.client.crmengine.users.get_organization(params).execute(function(resp) {
      
         if(!resp.code){
            $scope.organizationInfo=resp ;
            $scope.isLoading = false;
            $scope.$apply();
            $scope.purchaseLiseneces(resp);  

      

         }else{
              console.log(resp.message);
               $('#addAccountModal').modal('hide');
                $('#errorModal').modal('show');
              if(resp.message=="Invalid grant"){
               $scope.refreshToken();
                $scope.isLoading = false;
                $scope.$apply();
            };
              // To do add custom error handler


         }
      } );
} 


return User;
});

accountservices.factory('Permission', function($http) {

  var Permission = function(data) {
    angular.extend(this, data);
  }



  Permission.insert = function($scope,params){
      console.log(params);
      gapi.client.crmengine.permissions.insertv2(params).execute(function(resp) {
         console.log('in insert resp');
         console.log(resp);
         if(!resp.code){
              $scope.getColaborators()
         }else{
          console.log(resp.code);
         }
      });
  };
  Permission.delete = function($scope,params){
      console.log(params);
      gapi.client.crmengine.permissions.delete(params).execute(function(resp) {
         console.log('in insert resp');
         console.log(resp);
         if(!resp.code){
              $scope.getColaborators()
         }else{
          console.log(resp.code);
         }
      });
  };
  Permission.getColaborators = function($scope,params){
      console.log(params);
      gapi.client.crmengine.permissions.get_colaborators(params).execute(function(resp) {
         console.log('in colabor resp');
         console.log(resp);
         if(!resp.code){
              $scope.collaborators_list=resp.items;
               $scope.$apply();

         }else{
          console.log(resp.code);
         }
      });
  };



return Permission;
});
