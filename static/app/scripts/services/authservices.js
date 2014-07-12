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
  Auth.initWithLocalStorage = function(){
      var timeNow = new Date().getTime()/1000;
      if (localStorage.getItem("access_token")){
          var access_token = localStorage.getItem("access_token");
          var authResultexpiration = localStorage.getItem("authResultexpiration");
          var diff = authResultexpiration - timeNow;
          if (diff>0 && access_token!="null"){
             Auth.$scope.immediateFailed = false;
             Auth.$scope.isSignedIn = true;
             gapi.auth.setToken({'access_token':access_token});
             Auth.$scope.runTheProcess();
          }
          else{
              // refresh token
              Auth.refreshToken();
          }
      // render Google+ sign-in
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
  Auth.goAhead = function(authResult){
      if (typeof(Storage) != "undefined") {
          localStorage['is_signed_in'] = true;
          localStorage['access_token']=authResult.access_token;
          localStorage['authResultexpiration'] = authResult.expires_at;
      }
      if (!window.access_token) {
              window.is_signed_in = true;
              window.access_token = authResult.access_token;
              window.authResultexpiration =  authResult.expires_at;
      }
      var access_token = authResult.access_token;
      gapi.auth.setToken({'access_token':access_token});
      Auth.$scope.runTheProcess();
  }
  Auth.initSimple = function(){
      var timeNow = new Date().getTime()/1000;
      if (window.is_signed_in){


          var diff = window.authResultexpiration - timeNow;
          if (diff>0){
             Auth.$scope.immediateFailed = false;
             Auth.$scope.isSignedIn = true;
             Auth.$scope.runTheProcess();
          }
          else{

              // refresh token
              Auth.refreshToken();

          }
      // render Google+ sign-in
      }else{
            // check the gapi token
            var isGapiOk = Auth.checkGapiToken();
            if (isGapiOk){
                var gapiToken = gapi.auth.getToken();
                Auth.processAuth(gapiToken);
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
  }
  Auth.init = function($scope){
      // make sure there is only one instance of Auth.init executed
      if (!window.countInitExec){
          window.countInitExec = 1;
      }else{
          window.countInitExec = window.countInitExec+1;
          var timeNow = new Date().getTime()/1000;
          Auth.$scope = $scope;
          if (typeof(Storage) != "undefined") {
              // Using the localStorage
              Auth.initWithLocalStorage();
          } else {
              // Using the window object
              Auth.initSimple();
          }
      }
  };
  Auth.signIn = function(authResult){
      Auth.processAuth(authResult);
  };
  Auth.processAuth = function(authResult) {
      //Auth.$scope.immediateFailed = true;
      console.log(authResult);
      Auth.$scope.isRefreshing = false;
      if (authResult) {
        if (authResult['access_token']){
          Auth.$scope.immediateFailed = false;
          Auth.$scope.isSignedIn = true;
          Auth.goAhead(authResult);
        }
        else{
          // Auth.renderForcedSignIn();
          window.location.replace('/sign-in');
        }

      } else {
            Auth.renderForcedSignIn();
      };

  };
  Auth.renderForcedSignIn = function(){
    window.authResult = null;
    Auth.$scope.immediateFailed = true;
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
  Auth.refreshToken = function(){
    if (!Auth.$scope.isRefreshing){
        if (typeof(Storage) != "undefined") {
            localStorage['access_token']="null";
        }
        Auth.$scope.isRefreshing = true;
        Auth.renderForcedSignIn();
    }



    //window.location.reload(true);

  };

  return Auth;
});
