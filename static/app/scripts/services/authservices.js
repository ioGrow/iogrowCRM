var accountservices = angular.module('crmEngine.authservices',[]);
accountservices.factory('Auth', function($http) {
  var Auth = function(data) {
     angular.extend(this, data);
  };
  Auth.email = document.getElementById("userEmail").value;
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
             if(window.countInitExec==2){
                window.setTimeout(Auth.refreshBearer, diff * 1000);
             }
             

             if (access_token!="null"){
                 gapi.auth.setToken({'access_token':access_token});
             }
             window.authResult = {'access_token':access_token};
             
      if(Auth.license_is_expired =="True" &&  window.location.hash !="#/admin/users")
      {
        window.location.replace("#/admin/users");
      }else{

      if(Auth.user_suspended =="True" &&  window.location.hash !="#/admin/users"){
          Auth.suspended=true;
          window.location.replace("#/admin/users");
        }else Auth.suspended = (Auth.user_suspended == "True" && window.location.hash == "#/admin/users");
              
        Auth.$scope.runTheProcess();
      }
            
          }
          else{
              // refresh token
              Auth.refreshToken();
          }
      // render Google+ sign-in
      }else{
              Auth.$scope.immediateFailed = true;
               Auth.$scope.apply();  
             /* if (typeof  Auth.$scope.apply() == 'function') { 
                  Auth.$scope.apply()
              }else{
               
              }*/
              gapi.signin.render('myGsignin', {
                'callback': Auth.signIn,
                'clientid': '935370948155-a4ib9t8oijcekj8ck6dtdcidnfof4u8q.apps.googleusercontent.com',
                'scope': 'https://www.googleapis.com/auth/plus.login https://www.googleapis.com/auth/plus.profile.emails.read',
                'theme': 'dark',
                'cookiepolicy': 'single_host_origin',
                'accesstype': 'online',
                'width':'wide'
              });

      }
  }
  Auth.goAhead = function(authResult){
    if (authResult['access_token']) {
      if (typeof(Storage) != "undefined") {
          localStorage['is_signed_in'] = true;
          localStorage['access_token']=authResult.access_token;
          localStorage['authResultexpiration'] = authResult.expires_at;
      }

      window.authResult = authResult;
      window.is_signed_in = true;
      window.access_token = authResult.access_token;
      window.authResultexpiration =  authResult.expires_at;

      // We must refresh the token after it expires.
      window.setTimeout(Auth.refreshBearer, authResult.expires_in * 1000);
      if(Auth.license_is_expired =="True" &&  window.location.hash !="#/admin/users")
      {
        window.location.replace("#/admin/users");
      }else{

                  if(Auth.user_suspended =="True" &&  window.location.hash !="#/admin/users"){
          Auth.suspended=true;
          window.location.replace("#/admin/users");
        }else Auth.suspended = (Auth.user_suspended == "True" && window.location.hash == "#/admin/users");
              
        Auth.$scope.runTheProcess();
      }
    }
      
  }
  Auth.initSimple = function(){
      var timeNow = new Date().getTime()/1000;
      if (window.is_signed_in){


          var diff = window.authResultexpiration - timeNow;
          if (diff>0){
             Auth.$scope.immediateFailed = false;
             Auth.$scope.isSignedIn = true;

      if(Auth.license_is_expired =="True" &&  window.location.hash !="#/admin/users")
      {
        window.location.replace("#/admin/users");
      }else{
              
              if(Auth.user_suspended =="True" &&  window.location.hash !="#/admin/users"){
          Auth.suspended=true;
          window.location.replace("#/admin/users");
        }else Auth.suspended = !!(Auth.user_suspended == "True" && window.location.hash == "#/admin/users");

        Auth.$scope.runTheProcess();
      }


      
             
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
                'clientid': '935370948155-a4ib9t8oijcekj8ck6dtdcidnfof4u8q.apps.googleusercontent.com',
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
          window.countInitExec += 1;
          var timeNow = new Date().getTime()/1000;
          Auth.$scope = $scope;
          Auth.license_is_expired= document.getElementById("license_is_expired").value;
          Auth.user_suspended=document.getElementById("user_suspended").value;
 

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
      localStorage.removeItem('access_token');
      if (authResult.status.google_logged_in){
        gapi.auth.setToken(authResult);
        Auth.processAuth(authResult);
      }else{
        window.location.replace('/sign-in');
      }

  };
  Auth.processAuth = function(authResult) {
      //Auth.$scope.immediateFailed = true;
      window.isRefreshing = false;
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
      'clientid': '935370948155-a4ib9t8oijcekj8ck6dtdcidnfof4u8q.apps.googleusercontent.com',
      'scope': 'https://www.googleapis.com/auth/userinfo.email',
      'theme': 'dark',
      'cookiepolicy': 'single_host_origin',
      'accesstype': 'online',
      'width':'wide'
    });
  }
  Auth.refreshBearer = function(){
    var options = {
      client_id: '935370948155-a4ib9t8oijcekj8ck6dtdcidnfof4u8q.apps.googleusercontent.com',
      scope: 'https://www.googleapis.com/auth/plus.login https://www.googleapis.com/auth/plus.profile.emails.read',

      // Setting immediate to 'true' will avoid prompting the user for
      // authorization if they have already granted it in the past.
      immediate: true
    }

    gapi.auth.authorize(options, Auth.signIn);
  }
  Auth.refreshToken = function(){
    if (!window.isRefreshing){
      Auth.$scope.apply();
        window.isRefreshing = true;
        /*if (typeof Auth.$scope.apply() == 'function') { 
           Auth.$scope.apply();
        }else{
           
        }*/
        Auth.renderForcedSignIn();
    }
    //window.location.reload(true);

  };

  return Auth;
});