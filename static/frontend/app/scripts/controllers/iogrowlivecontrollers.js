appLive.controller('LiveHeaderController', ['$scope',
    function($scope) {
      

     $scope.renderSignIn = function() {
          console.log('$scope.renderSignIn #start_debug');
          if (window.is_signed_in){
              console.log('I am signed-in so you can continue');
              $scope.processAuth(window.authResult);
          }else{
            console.log('I am  not signed-in so render Button');
            
            gapi.signin.render('myGsignin', {
            'callback': $scope.signIn,
            'clientid': '935370948155-a4ib9t8oijcekj8ck6dtdcidnfof4u8q.apps.googleusercontent.com',
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
          $scope.$apply();
        },
        data: {code:authResult.code}
      });
    }
     $scope.processAuth = function(authResult) {
        
        $scope.immediateFailed = true;
        if (authResult['access_token']) {
          // User is signed-in
          
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
     

    

    
}]);
appLive.controller('LiveShowController', ['$scope',
    function($scope) {
      
     $scope.renderSignIn = function() {
          
          if (window.is_signed_in){
              console.log('I am signed-in so you can continue');
              $scope.processAuth(window.authResult);
          }else{
            console.log('I am  not signed-in so render Button');
            
            gapi.signin.render('gSignInFeedback', {
            'callback': $scope.signIn,
            'clientid': '935370948155-a4ib9t8oijcekj8ck6dtdcidnfof4u8q.apps.googleusercontent.com',
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
          feedback.type_url ='show';
          feedback.access= 'public';
          gapi.client.iogrowlive.feedbacks.insert(feedback).execute(function(resp) {
               
               console.log(resp);
               if(!resp.code){
                console.log(resp);
                $('#giveFeedbackModal').modal('hide');

                $scope.$apply();
                              
               }else{
                console.log(resp.code);
               }
          });

      }
     
    
}]);

appLive.controller('mapsController', ['$scope',
    function($scope) {
      $scope.getCompanies = function(){
        gapi.client.iogrowlive.companies.list().execute(function(resp) {
               
               console.log(resp);
               if(!resp.code){
                //get the companies in the scope
                $scope.companies = resp.items;
                $scope.renderMaps();

                $scope.$apply();
               // $('#addAccountModal').modal('hide');
               // window.location.replace('#/accounts/show/'+resp.id);
                
               }else{
                console.log(resp.code);
               }
          });
      };
     
      $scope.renderMaps = function(){
                var mapOptions = {
                  center: new google.maps.LatLng(0, 0),
                  zoom: 02
                };
                $('#map_canvas').gmap(mapOptions).bind('init', function(event, map) { 
                  for (var i=0; i<$scope.companies.length; i++) {
                    if ($scope.companies[i].addresses){
                        for (var j=0; j<$scope.companies[i].addresses.length; j++) {
                          if ($scope.companies[i].addresses[j].lat){
                               $('#map_canvas').gmap('addMarker', {
                                'position': $scope.companies[i].addresses[j].lat + ','+ $scope.companies[i].addresses[j].lon, 
                                'draggable': false, 
                                'bounds': true,
                                'address':$scope.companies[i].addresses[j],
                                'name': $scope.companies[i].name,
                                'organizationid': $scope.companies[i].id
                              }, function(map, marker) {
                                // should be deleted;
                              }).click(function() {
                                  var url = '<a href="/live/companies/'+ this.organizationid+'/">'+ this.name + '</a>';
                                  $('#map_canvas').gmap('openInfoWindow', {'content':url}, this);
                             });
                          }
                        }
                    }
                  }
                  
      
                });
                
      };
      //$scope.renderMaps();
      $scope.getCompanies();
}]);