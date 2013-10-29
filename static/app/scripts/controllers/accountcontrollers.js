app.controller('AccountListCtrl', ['$scope','$route','$location','Conf','MultiAccountLoader','Account',
    function($scope,$route,$location,Conf,MultiAccountLoader,Account) {
     console.log('i am in account list controller');
     $("#id_Accounts").addClass("active");
     $scope.isSignedIn = false;
     $scope.immediateFailed = false;
     $scope.accounts = [];
     $scope.renderSignIn = function() {
          console.log('$scope.renderSignIn #start_debug');
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
     $scope.signIn = function(authResult) {
        console.log('signIn callback #start_debug');
        $scope.$apply(function() {
          console.log('signIn $apply callback #start_debug');
          $scope.processAuth(authResult);
        });
     }

     $scope.processAuth = function(authResult) {
        console.log('process Auth #startdebug');
        $scope.immediateFailed = true;
        if (authResult['access_token']) {
          // User is signed-in
          console.log('User is signed-in');
          $scope.immediateFailed = false;
          $scope.isSignedIn = true;
          // Call the backend to get the list of accounts
          gapi.client.crmengine.accounts.list().execute(function(resp) {
            if(!resp.code){
               $scope.accounts = resp.items;
               // Call the method $apply to make the update on the scope
               $scope.$apply();

            }else {
               alert("Error, response is: " + angular.toJson(resp));
            }
            console.log('gapi #end_execute');
          });
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
     
     
   

    
}]);
app.controller('AccountShowCtrl', ['$scope','$route','$location','Topic','Note','WhoHasAccess','User',
    function($scope,$route,$location,Topic,Note,WhoHasAccess,User) {
      $("#id_Accounts").addClass("active");
      



}]);