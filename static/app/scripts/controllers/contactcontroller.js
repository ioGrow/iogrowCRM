app.controller('ContactListCtrl', ['$scope','$route','$location','Conf','MultiContactLoader','Contact',
    function($scope,$route,$location,Conf,MultiContactLoader,Contact) {
      $("#id_Contacts").addClass("active");
      
      console.log('i am in contact list controller');
       $("#id_Contacts").addClass("active");
     $scope.isSignedIn = false;
     $scope.immediateFailed = false;
     $scope.nextPageToken = undefined;
     $scope.prevPageToken = undefined;
     $scope.isLoading = false;
     $scope.pagination = {};
    	
      $scope.contacts = [];

      $scope.renderSignIn = function() {
          console.log('$scope.renderSignIn #start_debug');
          if (window.is_signed_in){
              console.log('I am signed-in so you can continue');
              $scope.processAuth(window.authResult);
          }else{
            console.log('I am  not signed-in so render Button');
            gapi.signin.render('myGsignin', {
            'callback': $scope.signIn,
            'clientid': Conf.clientId,
            'requestvisibleactions': Conf.requestvisibleactions,
            'scope': Conf.scopes,
            'theme': 'dark',
            'cookiepolicy': Conf.cookiepolicy,
            'accesstype': 'offline'
            });

          }
          

     }
     $scope.listNextPageItems = function(){
        $scope.isLoading = true;
       var params = {};
          if ($scope.nextPageToken){
            params = {'limit':7,
                      'pageToken':$scope.nextPageToken
                     }
          }else{
            params = {'limit':7}
          }
          console.log('in listNextPageItems');
          console.log($scope);
          Contact.list($scope,params);
     }
     $scope.listPrevPageItems = function(){
       $scope.isLoading = true;
       var params = {};
          if ($scope.nextPageToken){
            params = {'limit':7,
                      'pageToken':$scope.prevPageToken
                     }
          }else{
            params = {'limit':7}
          }
          Contact.list($scope,params);
     }
     $scope.signIn = function(authResult) {
        console.log('signIn callback #start_debug');
        $scope.processAuth(authResult);
        
     }

     $scope.processAuth = function(authResult) {
        console.log('process Auth #startdebug');
        $scope.immediateFailed = true;
        if (authResult['access_token']) {
          // User is signed-in
          console.log('User is signed-in');
          $scope.immediateFailed = false;
          $scope.isSignedIn = true;
          window.is_signed_in = true;
          window.authResult = authResult;
          // Call the backend to get the list of accounts

          $scope.listNextPageItems();
        } else if (authResult['error']) {
          if (authResult['error'] == 'immediate_failed') {
            $scope.immediateFailed = true;

            window.location.replace('/sign-in');
            console.log('Immediate Failed');
          } else {
            console.log('Error:' + authResult['error']);
          }
        }
     }
     $scope.renderSignIn();
    
      // new Contact
      $scope.showModal = function(){
        $('#addContactModal').modal('show');

      };
      
    
      $scope.save = function(contact){
        Contact.insert(contact);
        $('#addContactModal').modal('hide')
      };


      
}]);
app.controller('ContactShowCtrl', ['$scope','$route','$location','Conf','Contact',
    function($scope,$route,$location,Conf,Contact) {
 console.log('I am in ContactShowCtrl');
      $("#id_Contacts").addClass("active");
     $scope.isSignedIn = false;
     $scope.immediateFailed = false;
     $scope.isContentLoaded = false;
     $scope.accounts = [];
     $scope.renderSignIn = function() {
          console.log('$scope.renderSignIn #start_debug');
          if (window.is_signed_in){
              console.log('I am signed-in so you can continue');
              $scope.processAuth(window.authResult);
          }else{
            console.log('I am  not signed-in so render Button');
            gapi.signin.render('myGsignin', {
            'callback': $scope.signIn,
            'clientid': Conf.clientId,
            'requestvisibleactions': Conf.requestvisibleactions,
            'scope': Conf.scopes,
            'theme': 'dark',
            'cookiepolicy': Conf.cookiepolicy,
            'accesstype': 'offline'
            });

          }
          

     }
     $scope.signIn = function(authResult) {
        console.log('signIn callback #start_debug');
        $scope.processAuth(authResult);
        
     }


     $scope.processAuth = function(authResult) {
        console.log('process Auth #startdebug');
        $scope.immediateFailed = true;
        if (authResult['access_token']) {
          // User is signed-in
          console.log('User is signed-in');
          $scope.immediateFailed = false;
          $scope.isSignedIn = true;
          window.is_signed_in = true;
          window.authResult = authResult;
          // Call the backend to get the list of contact
          var contactid = {'id':$route.current.params.contactId};
          Contact.get($scope,contactid);
        } else if (authResult['error']) {
          if (authResult['error'] == 'immediate_failed') {
            $scope.immediateFailed = true;

            console.log('Immediate Failed');
          } else {
            console.log('Error:' + authResult['error']);
          }
        }
     }
     $scope.renderSignIn();
     //$('#addContactModal').modal('show');

      



}]);