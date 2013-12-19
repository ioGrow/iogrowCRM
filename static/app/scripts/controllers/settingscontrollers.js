app.controller('SettingsShowCtrl',['$scope','$route','Auth','Opportunitystage','Casestatus','Leadstatus',
	function($scope,$route,Auth,Opportunitystage,Casestatus,Leadstatus){
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
         
          // What to do after authentication
     $scope.runTheProcess = function(){
           Opportunitystage.list($scope,{});
          Casestatus.list($scope,{});
          Leadstatus.list($scope,{});
     };
     // We need to call this to refresh token when user credentials are invalid
     $scope.refreshToken = function() {
            Auth.refreshToken();
     };
     
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

  // Google+ Authentication 
    Auth.init($scope);
	}]);