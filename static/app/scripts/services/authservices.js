var accountservices = angular.module('crmEngine.authservices',[]);
accountservices.factory('Auth', function($http) {
  var Auth = function(data) {
     angular.extend(this, data);
  };
  Auth.checkGapiToken = function(){
      var timeNow = new Date().getTime()/1000;
      var gapiToken = gapi.auth.getToken();
      if (gapiToken){
          var expirationTime = gapiToken.expires_at;
          var diff = expirationTime - timeNow;
          if (diff>0){
              return true;
          }
      }
      return false;
  }
  Auth.init = function($scope){
      var timeNow = new Date().getTime()/1000;
      Auth.$scope = $scope;

      if (window.is_signed_in){


          var diff = window.authResultexpiration - timeNow;

          if (diff>0){
             Auth.processAuth(window.authResult);
          }
          else{
              // refresh token
              Auth.refreshToken();

          }

      }else{
            var isGapiOk = Auth.checkGapiToken();
            if (isGapiOk){
                var gapiToken = gapi.auth.getToken();
                Auth.processAuth(window.authResult);
            }else{
              gapi.signin.render('myGsignin', {
                'callback': Auth.signIn,
                'clientid': '987765099891.apps.googleusercontent.com',
                'scope': 'https://www.googleapis.com/auth/userinfo.email',
                'theme': 'dark',
                'cookiepolicy': 'single_host_origin',
                'accesstype': 'online',
                'width':'wide'
              });
            }
      }
  };
  Auth.signIn = function(authResult){
      Auth.processAuth(authResult);
  };
  Auth.processAuth = function(authResult) {
      Auth.$scope.immediateFailed = true;
      if (authResult) {
        if (authResult['access_token']){
          Auth.$scope.immediateFailed = false;
          Auth.$scope.isSignedIn = true;
          if (!window.authResult) {
              window.is_signed_in = true;
              window.authResult = authResult;
              window.authResultexpiration =  authResult.expires_at;
          }

          // run the process
          Auth.$scope.runTheProcess();
        }
        else{
          Auth.renderForcedSignIn();
        }

      } else {
            Auth.renderForcedSignIn();
      };

  };
  Auth.renderForcedSignIn = function(){
    window.authResult = null;
    Auth.$scope.immediateFailed = true;
    Auth.$scope.$apply();
    gapi.signin.render('myGsignin', {
      'callback': Auth.signIn,
      'clientid': '987765099891.apps.googleusercontent.com',
      'scope': 'https://www.googleapis.com/auth/userinfo.email',
      'theme': 'dark',
      'cookiepolicy': 'single_host_origin',
      'accesstype': 'online',
      'approvalprompt':'force',
      'width':'wide'
    });
  }
  Auth.refreshToken = function(){
     window.location.reload(true);
  };

  return Auth;
});
