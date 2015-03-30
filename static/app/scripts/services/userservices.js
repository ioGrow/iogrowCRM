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
  

  User.upLoadLogo=function($scope,params){

     

     var acctiveApp=document.getElementById("active_app").value;

    gapi.client.crmengine.organization.uploadlogo(params).execute(function(resp){
                  if(!resp.code){
                      //console.log(acctiveApp);
                      window.location.replace("/apps/"+acctiveApp);

                  }else{

                     if(resp.code==401){
                $scope.refreshToken();
                $scope.isLoading = false;
                $scope.$apply();
               };

                  }
              


    });

  }
  // User.customer = function($scope,id) {
           
  //         gapi.client.crmengine.users.customer(id).execute(function(resp) {
  //           if(!resp.code){
  //              $scope.user = resp;


  //              $scope.isLoading= false ;
  //              $scope.loadCharges=false;


  //             $scope.purchase($scope.user);
  //              // Call the method $apply to make the update on the scope
  //              $scope.$apply();

  //           }else {
  //              if(resp.code==401){
  //               $scope.refreshToken();
  //               $scope.isLoading = false;
  //               $scope.loadCharges=false;
  //               $scope.$apply();
  //              };
  //           }
  //           console.log('gapi #end_execute');
  //         });
  // };
  
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

User.signature=function($scope,params){
  $scope.isLoading= true;
  gapi.client.crmengine.users.signature(params).execute(function(resp){
     $scope.isLoading=false;
     $scope.$apply();
  });

}

//   // HADJI HICHAM  11/08/2014 -- get list Users with licenes .
// User.Customers = function($scope,params){
//       $scope.isLoading = true;
//       console.log("lebdiri")
//       gapi.client.crmengine.users.customers(params).execute(function(resp) {
//               if(!resp.code){
//                 console.log("arezki")
//                  $scope.users = resp.items;
//                  $scope.invitees=resp.invitees;
                 

//                  if ($scope.currentPage>1){
//                       $scope.pagination.prev = true;
//                    }else{
//                        $scope.pagination.prev = false;
//                    }
//                  if (resp.nextPageToken){
//                    var nextPage = $scope.currentPage + 1;
//                    // Store the nextPageToken
//                    $scope.pages[nextPage] = resp.nextPageToken;
//                    $scope.pagination.next = true;

//                  }else{
//                   $scope.pagination.next = false;
//                  }
//                  // Loaded succefully
//                  $scope.isLoading = false;
//                  // Call the method $apply to make the update on the scope
//                  $scope.$apply();
//               }else {
//                  if(resp.code==401){
//                 $scope.refreshToken();
//                 $scope.isLoading = false;
//                 $scope.$apply();
//                };
//               }
//       });
//   };
  User.insert = function($scope,params){
        $scope.isLoading = true;
      //console.log(params.emails);
      gapi.client.crmengine.users.insert(params).execute(function(resp) {
         if(!resp.code){

          console.log("there  are a response");
          $scope.reloadUsersList();
          //$scope.isLoading = false;

         }else{
      
               $scope.errorMsg=resp.message

              $scope.isLoading = false;
              $scope.$apply();
               $('#addAccountModal').modal('hide');
                $('#errorModalInsert').modal('show');
              if(resp.message=="Invalid grant"){
               $scope.refreshToken();
                $scope.isLoading = false;
                $scope.$apply();
            };
              // To do add custom error handler


         }
      });
  };
  User.completedTour = function($scope,params){
    gapi.client.request({
                           'root':ROOT,
                           'path':'/crmengine/v1/users/'+params['id'],
                           'method':'PATCH',
                           'body':params,
                           'callback':(function(resp) {

                            console.log(resp);
                        })
                  })
  }
  User.patch = function($scope,params){


      gapi.client.crmengine.users.patch(params).execute(function(resp) {
            if(!resp.code){
               $scope.user = resp;

              console.log(resp);

                   // be careful , right it back !

              window.location.reload();
            //$scope.reloadUsersList() ;



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
User.setAdmin=function($scope,params){
  
  gapi.client.crmengine.users.setadmin(params).execute(function(resp) {
   $scope.reloadUsersList() ;

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





User.deleteInvited=function($scope,params){
    $scope.isLoading=true;


    gapi.client.request({
                           'root':ROOT,
                           'path':'/crmengine/v1/invite/delete',
                           'method':'POST',
                           'body':params,
                           'callback':(function(resp) {

                            $scope.reloadUsersList();


                           }) 


                         })


   // gapi.client.crmengine.invite.delete(params).execute(function(resp) {
   //            if(!resp.code){

   //               $scope.reloadUsersList();



   //            }else{
   //            console.log(resp.message);
             
   //              $('#errorModal').modal('show');
   //            if(resp.message=="Invalid grant"){
   //             $scope.refreshToken();
   //              $scope.isLoading = false;
   //              $scope.$apply();
   //            } }
     


   // })


}


User.deleteUser=function($scope,params){
      

gapi.client.crmengine.users.delete(params).execute(function(resp) {


});


}


// purchase licenses 
User.purchase_lisences=function($scope,params){
     
  gapi.client.crmengine.users.purchase_lisences(params).execute(function(resp) {
            if(!resp.code){
              $scope.paymentOperation=false;
              $scope.$apply();
                
                 console.log(resp);
                 if (!resp.transaction_failed) {
                  $scope.paymentConfimration(resp);
                 };
                
                // here be carefull .
               // $scope.reloadOrganizationInfo();
            }

            });

}


//HADJI HICHAM - 20/01/0215 - 13:13 - save the details of the company
User.saveBillingDetails=function($scope,params){
  $scope.isLoading=true;
  gapi.client.crmengine.users.saveBillingDetails(params).execute(function(resp){

     $scope.isLoading=false;
     $scope.$apply();
  });
}






return User;
});

accountservices.factory('Permission', function($http) {

  var Permission = function(data) {
    angular.extend(this, data);
  }



  Permission.insert = function($scope,params){
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
      gapi.client.crmengine.permissions.get_colaborators(params).execute(function(resp) {
         if(!resp.code){
              $scope.collaborators_list=resp.items;
               $scope.$apply();

         }else{
         }
      });
  };



return Permission;
});
