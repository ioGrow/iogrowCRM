app.controller('BillingListController', ['$scope','$route', 'Auth','Search','User',
    function($scope,$route,Auth,Search,User) {
      
   $("ul.page-sidebar-menu li").removeClass("active");
   $("#id_Billing").addClass("active");

  
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
          //User.list_licenses($scope,params);

          User.Customers($scope,params);
        

       };
  

// function for purchase lisenece .
$scope.purchaseLiseneces=function(organization){
// the key represent the public key which represent our company  , client side , we have two keys 
// test  "pk_test_4Xa35zhZDqvXz1OzGRWaW4mX", mode dev 
// live "pk_live_4Xa3cFwLO3vTgdjpjnC6gmAD", mode prod 

  var handler = StripeCheckout.configure({

    key: 'pk_test_4Xa35zhZDqvXz1OzGRWaW4mX',
    image:"/static/img/IO_Grow.png",
    token: function(token) {
  console.log();

    var params={'token_id':token.id,
                'token_email':token.email, 
                "organization":organization.organizationName,
                "organizationKey":$scope.organization_key
              }

   gapi.client.crmengine.billing.purchase_lisence_for_org(params).execute(function(resp) {
            if(!resp.code){

                  
                 console.log(resp);
                
            }

            });
      // Use the token to create the charge with a server-side script.
      // You can access the token ID with `token.id`
    }
  });

  document.getElementById('customButton').addEventListener('click', function(e) {
    // Open Checkout with further options
    handler.open({
      name: organization.organizationName,
      description: 'bay a license $20.00',
      amount: 2000
    });
    e.preventDefault();
  });

}
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
   $("ul.page-sidebar-menu li").removeClass("active");
   $("#id_Billing").addClass("active");


     $scope.isSignedIn = false;
     $scope.immediateFailed = false;
     //
     
     $scope.nextPageToken = undefined;
     $scope.prevPageToken = undefined;
     $scope.isLoading = false;
     $scope.pagination = {};
     $scope.currentPage = 01;
     $scope.pages = [];
     $scope.loadCharges=true;
     $scope.users = [];
    
    // What to do after authentication
      $scope.runTheProcess = function(){
    
              var params={'id':$route.current.params.userId};
             
              User.customer($scope, params);
              
          //  var params={'organization':$scope.organization_key
          //              }
          // User.get_organization($scope,params);
          //  var params = {'limit':7};
          // User.list($scope,params);

       };


// hadji hicham . to send the token to the api!
 $scope.purchase=function(user){
// the key represent the public key which represent our company  , client side , we have two keys 
// test  "pk_test_4Xa35zhZDqvXz1OzGRWaW4mX", mode dev 
// live "pk_live_4Xa3cFwLO3vTgdjpjnC6gmAD", mode prod 

  var handler = StripeCheckout.configure({
    key: 'pk_test_4Xa35zhZDqvXz1OzGRWaW4mX',
    image: user.google_public_profile_photo_url,

    email: user.email,

    token: function(token) {
      

    var params={'token_id':token.id,
                'token_email':token.email, 
                'customer_id':user.customer_id
              }
   gapi.client.crmengine.billing.purchase_lisence_for_user(params).execute(function(resp) {
            if(!resp.code){
                console.log(token)
            }

            });
      // Use the token to create the charge with a server-side script.
      // You can access the token ID with `token.id`
    }
  });

  document.getElementById('customButton').addEventListener('click', function(e) {
    // Open Checkout with further options
    handler.open({
      name: user.google_display_name,
      description: '$20.00',
      amount: 2000
    });
    e.preventDefault();
  });



 }
  
     // We need to call this to refresh token when user credentials are invalid
     $scope.refreshToken = function() {
          Auth.refreshToken();
     };  

   
    



     // Google+ Authentication 
     Auth.init($scope);
     
}]);
