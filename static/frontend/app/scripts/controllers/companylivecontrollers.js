appLive.controller('CompanyLiveShowController', ['$scope',
    function($scope) {

      $scope.feedback ={};
      
     $scope.renderSignIn = function() {
          
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
          feedback.type_url = 'company';
          gapi.client.iogrowlive.feedbacks.insert(feedback).execute(function(resp) {
               
               console.log(resp);
               if(!resp.code){
                console.log(resp);
                

                $scope.$apply();
                $scope.feedback ={};
                
              
                
               }else{
                console.log(resp.code);
               }
          });

      }
     
    
}]);