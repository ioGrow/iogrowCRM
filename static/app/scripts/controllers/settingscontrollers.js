app.controller('SettingsShowCtrl',['$scope','$route','$location','Conf','Contact','Opportunitystage','Casestatus','Leadstatus',
	function($scope,$route,$location,Conf,Contact,Opportunitystage,Casestatus,Leadstatus){
//HKA 11.12.2013 Controller to manage Opportunity stage, Case Status, Company profile, personnel Settings, Lead Status
		$("#id_Settings").addClass("active");

		var tab = $route.current.params.accountTab;
     $scope.oppstage = {};

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
          
          
          Opportunitystage.list($scope,{});
          Casestatus.list($scope,{});
          Leadstatus.list($scope,{});

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
  //HKA 12.12.2013 Add a new Opportunity Stage
  $scope.addOppStagetModal = function(){
    $("#addOppStagetModal").modal('show')
  };
  //HKA 12.12.2013 Add a new Case Status
  $scope.addCasestatustModal = function(){
    $("#addCasestatustModal").modal('show')
  };
   //HKA 12.12.2013 Add a new Lead Status
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
     $scope.renderSignIn();
     $scope.oppstage.name='';
     $scope.oppstage.probability='';
   //window.location.replace('#/admin/settings');
   
  };
  //HKA 15.12.2013 Edit opportunity stage
  $scope.editopportunitystage = function(stage){
    console.log(stage);
      $scope.oppstage.name = stage.name;
      $scope.oppstage.probability = stage.probability;
      $scope.oppstage.id=stage.id;
       $('#EditOppsStage').modal('show');


   
  };
  //18.12.2013 HKA  Update Opportunity stage
  $scope.updateOppStage = function(oppstage){
    console.log(oppstage);
    var params ={'id':$scope.oppstage.id,
                 'name':oppstage.name,
                 'probability':oppstage.probability

    }
    Opportunitystage.update($scope,params)
    $('#EditOppsStage').modal('hide');
  };
//HKA 18.12.2013 Delete Opportunity stage
  $scope.deleteoppstage = function(oppstageId){
    console.log(oppstageId);
    Opportunitystage.delete($scope,oppstageId);

  }


  //HKA 12.12.2013 Add a new Case Status

  $scope.saveCaseStatus = function(casestatus){
    var params={'status':casestatus.status

    };
   Casestatus.insert($scope,params);
   $('#addCasestatustModal').modal('hide');
   
   $scope.casestatus.status='';

   
  } 
   //HKA 12.12.2013 Add a new Lead status
  $scope.saveLeadtatus = function(lead){
    var params={'status':lead.status

    };
   Leadstatus.insert($scope,params);
   $('#addLeadstatustModal').modal('hide');
   $scope.lead.status='';
   
   
  } 


	}]);