app.controller('LiveHeaderController', ['$scope',
    function($scope) {
      console.log('i am in ioGrow Live public page');
     $scope.hideme = true;
     $scope.isSignedIn = false;
     $scope.immediateFailed = false;
     $scope.nextPageToken = undefined;
     $scope.prevPageToken = undefined;
     $scope.isLoading = false;
     $scope.pagination = {};
     $scope.currentPage = 01;
     $scope.pages = [];
     $scope.accounts = [];
     $scope.account = {};
     $scope.account.access ='public';

     $scope.renderSignIn = function() {
          console.log('$scope.renderSignIn #start_debug');
          if (window.is_signed_in){
              console.log('I am signed-in so you can continue');
              $scope.processAuth(window.authResult);
          }else{
            console.log('I am  not signed-in so render Button');
            
            gapi.signin.render('myGsignin', {
            'callback': $scope.signIn,
            'clientid': '987765099891.apps.googleusercontent.com',
            'requestvisibleactions': 'http://schemas.google.com/AddActivity',
            'scope': 'https://www.googleapis.com/auth/plus.login https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/drive https://www.googleapis.com/auth/calendar',
            'theme': 'dark',
            'cookiepolicy': 'single_host_origin',
            'accesstype': 'offline'
            });
            
          }
      }
      $scope.refreshToken = function() {
          gapi.auth.signIn({
            'callback': $scope.connectServer,
            'clientid': Conf.clientId,
            'requestvisibleactions': Conf.requestvisibleactions,
            'scope': Conf.scopes,
            'immediate': true,
            'cookiepolicy': Conf.cookiepolicy,
            'accesstype': 'offline'
          });
      }
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
          Account.list($scope,params);
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
          Account.list($scope,params);
     }
     $scope.signIn = function(authResult) {
        console.log('in singIn');
        console.log(authResult);
        console.log('signIn callback #start_debug');
        $scope.connectServer(authResult);
        $scope.processAuth(authResult);
        
     }
     $scope.connectServer = function(authResult) {
      console.log('connected');
      $.ajax({
        type: 'POST',
        url: '/gconnectpublic',
        
        success: function(result) {
          console.log('i am in connectServer show me result please');
          console.log(result);
          $scope.connected = true;
          $scope.userinfo = result;
          window.userinfo = result;
          $scope.$apply();
        },
        data: {code:authResult.code}
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
          window.is_signed_in = true;
          window.authResult = authResult;
          // Call the backend to get the list of accounts
          
          var params = {'limit':7}
          //Account.list($scope,params);

        } else if (authResult['error']) {
          if (authResult['error'] == 'immediate_failed') {
            
            console.log('Immediate Failed');
          } else {
            console.log('Error:' + authResult['error']);
          }
        }
     }
     $scope.renderSignIn();
     

      
    $scope.save = function(account){
     
      Account.insert($scope,account);
    };
    $scope.addAccountOnKey = function(account){
      if(event.keyCode == 13 && account){
          $scope.save(account);
      }
      
      
    };

     $scope.accountInserted = function(resp){
          $('#addAccountModal').modal('hide');
          window.location.replace('#/accounts/show/'+resp.id);
     };
     
     
   

    
}]);
app.controller('LiveShowController', ['$scope',
    function($scope) {
      console.log('i am in ioGrow Live public page');
     $scope.hideme = true;
     $scope.isSignedIn = false;
     $scope.immediateFailed = false;
     $scope.nextPageToken = undefined;
     $scope.prevPageToken = undefined;
     $scope.isLoading = false;
     $scope.pagination = {};
     $scope.currentPage = 01;
     $scope.pages = [];
     $scope.accounts = [];
     $scope.account = {};
     $scope.account.access ='public';

     $scope.renderSignIn = function() {
          console.log('@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@');
          console.log('$scope.renderSignIn #start_debug');
          if (window.is_signed_in){
              console.log('I am signed-in so you can continue');
              $scope.processAuth(window.authResult);
          }else{
            console.log('I am  not signed-in so render Button');
            
            gapi.signin.render('gSignInFeedback', {
            'callback': $scope.signIn,
            'clientid': '987765099891.apps.googleusercontent.com',
            'requestvisibleactions': 'http://schemas.google.com/AddActivity',
            'scope': 'https://www.googleapis.com/auth/plus.login https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/drive https://www.googleapis.com/auth/calendar',
            'theme': 'dark',
            'cookiepolicy': 'single_host_origin',
            'accesstype': 'offline'
            });
            
          }
      }
      $scope.refreshToken = function() {
          gapi.auth.signIn({
            'callback': $scope.connectServer,
            'clientid': Conf.clientId,
            'requestvisibleactions': Conf.requestvisibleactions,
            'scope': Conf.scopes,
            'immediate': true,
            'cookiepolicy': Conf.cookiepolicy,
            'accesstype': 'offline'
          });
      }
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
          Account.list($scope,params);
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
          Account.list($scope,params);
     }
     $scope.signIn = function(authResult) {
        console.log('in singIn');
        console.log(authResult);
        console.log('signIn callback #start_debug');
        $scope.connectServer(authResult);
        $scope.processAuth(authResult);
        
     }
     $scope.connectServer = function(authResult) {
      console.log('connected');
      $.ajax({
        type: 'POST',
        url: '/gconnectpublic',
        
        success: function(result) {
          console.log('i am in connectServer show me result please');
          console.log(result);
          $scope.connected = true;
          $scope.userinfo = result;
          window.userinfo = result;
          window.location.reload();
          $scope.$apply();

        },
        data: {code:authResult.code}
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
          window.is_signed_in = true;
          window.authResult = authResult;
          // Call the backend to get the list of accounts
          
          //$('#giveFeedbackModal').modal('show');

        } else if (authResult['error']) {
          if (authResult['error'] == 'immediate_failed') {
            
            console.log('Immediate Failed');
          } else {
            console.log('Error:' + authResult['error']);
          }
        }
     }
     
     $scope.showFeedbackModal = function(){
        $scope.renderSignIn();
        $('#giveFeedbackModal').modal('show');


      };
      $scope.sendFeedback = function(feedback){
          feedback.show_url = window.location.href;
          gapi.client.iogrowlive.feedbacks.insert(feedback).execute(function(resp) {
               
               console.log(resp);
               if(!resp.code){
                console.log(resp);
                $('#giveFeedbackModal').modal('hide');

                $scope.$apply();
               // $('#addAccountModal').modal('hide');
               // window.location.replace('#/accounts/show/'+resp.id);
                
               }else{
                console.log(resp.code);
               }
          });

      }
     
      
    $scope.save = function(account){
     
      Account.insert($scope,account);
    };
    $scope.addAccountOnKey = function(account){
      if(event.keyCode == 13 && account){
          $scope.save(account);
      }
      
      
    };

     $scope.accountInserted = function(resp){
          $('#addAccountModal').modal('hide');
          window.location.replace('#/accounts/show/'+resp.id);
     };
     
     
   

    
}]);