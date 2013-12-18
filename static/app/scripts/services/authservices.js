var accountservices = angular.module('crmEngine.authservices',[]);
accountservices.factory('Auth', function($http) {
  var Auth = function(data) {
    angular.extend(this, data);
  };
  Auth.init = function($scope){
      Auth.$scope = $scope;
      if (window.is_signed_in){
          Auth.processAuth(window.authResult);
      }else{
            gapi.signin.render('myGsignin', {
            'callback': Auth.signIn,
            'clientid': '987765099891.apps.googleusercontent.com',
            'requestvisibleactions': 'http://schemas.google.com/AddActivity ' +
                'http://schemas.google.com/ReviewActivity',
            'scope': 'https://www.googleapis.com/auth/plus.login https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/drive https://www.googleapis.com/auth/calendar',
            'theme': 'dark',
            'cookiepolicy': 'single_host_origin',
            'accesstype': 'offline'
            });
            
      }
  };
  Auth.signIn = function(authResult){
      Auth.connectServer(authResult);
      Auth.processAuth(authResult);
  };
  Auth.connectServer = function(authResult){
      $.ajax({
        type: 'POST',
        url: '/gconnect',
        success: function(result) {
          // success
        },
        data: {code:authResult.code}
      });
  };
  Auth.processAuth = function(authResult) {
      Auth.$scope.immediateFailed = true;
      if (authResult['access_token']) {
          Auth.$scope.immediateFailed = false;
          Auth.$scope.isSignedIn = true;
          window.is_signed_in = true;
          window.authResult = authResult;
          // run the process
          Auth.$scope.runTheProcess();
      } else if (authResult['error']) {
          if (authResult['error'] == 'immediate_failed') {
            Auth.$scope.immediateFailed = true;
            window.location.replace('/sign-in');
          } else {
            console.log('Error:' + authResult['error']);
          }
      };
      
  };
  Auth.refreshToken = function(){
      gapi.signin.render('myGsignin', {
            'callback': Auth.connectServer,
            'clientid': '987765099891.apps.googleusercontent.com',
            'requestvisibleactions': 'http://schemas.google.com/AddActivity ' +
                'http://schemas.google.com/ReviewActivity',
            'scope': 'https://www.googleapis.com/auth/plus.login https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/drive https://www.googleapis.com/auth/calendar',
            'theme': 'dark',
            'cookiepolicy': 'single_host_origin',
            'accesstype': 'offline'
      });      
  };

  return Auth;
});

