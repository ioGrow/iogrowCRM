app.controller('SettingsShowCtrl',['$scope','$route','$location','Conf','Contact','Opportunitystage',
	function($scope,$route,$location,Conf,Contact,Opportunitystage){
//HKA 11.12.2013 Controller to manage Opportunity stage, Case Status, Company profile, personnel Settings, Lead Status
		$("#id_Settings").addClass("active");

		var tab = $route.current.params.accountTab;

      switch (tab)
        {
        case 'Opportunity Stages':
         $scope.selectedTab = 1;
          break;
        case 'Case Status':
         $scope.selectedTab = 2;
          break;
        case 'Lead Status':
         $scope.selectedTab = 3;
          break;      
        default:
        $scope.selectedTab = 1;
        }

        $scope.isSignedIn = false;
        $scope.immediateFailed = false;
         
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
            console.log('########## rendred tatrttttttaa');
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
        console.log('signIn callback #start_debug');
        $scope.connectServer(authResult);
        $scope.processAuth(authResult);
        
     }
     $scope.connectServer = function(authResult) {
      console.log('I will contact the serveer');
      console.log(authResult.code);
      
      $.ajax({
        type: 'POST',
        url: '/gconnect',
        
        success: function(result) {
          console.log('i am in connectServer show me result please');
          console.log(result);
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
          Opportunitystage.list($scope,params);

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
  //HKA 12.12.2013 Add a new Stage
  $scope.addOppStagetModal = function(){
    $("#addOppStagetModal").modal('show')
  };
  $scope.addCasestatustModal = function(){
    $("#addCasestatustModal").modal('show')
  };
  $scope.addLeadstatustModal = function(){
    $("#addLeadstatustModal").modal('show')
  }
  //HKA 12.12.2013 Add a new Opportunity Stage
  $scope.saveOppStage = function(oppstage){
    var params={'name':oppstage.name,
                'probability':oppstage.probability

    };
   Opportunitystage.insert($scope,params);
   $('#addOppStagetModal').modal('hide');
   var paramse = {'limit':20};
   window.location.replace('#/admin/settings');
   
  } 


	}]);