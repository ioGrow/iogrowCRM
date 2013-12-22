app.controller('SettingsShowCtrl',['$scope','$route','Auth','Opportunitystage','Casestatus','Leadstatus',
	function($scope,$route,Auth,Opportunitystage,Casestatus,Leadstatus){
//HKA 11.12.2013 Controller to manage Opportunity stage, Case Status, Company profile, personnel Settings, Lead Status
		$("#id_Settings").addClass("active");

		var tab = $route.current.params.accountTab;
     $scope.oppstage = {};
     $scope.oppstageedit = {};
     $scope.casestatus={};
     $scope.casestatusedit={};
     $scope.leadstat={};
     $scope.leadstatedit={};
     $scope.isLoading = false;

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
       var params ={'order':'probability'};
          Opportunitystage.list($scope,params);
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
    $scope.oppstage.name='';
     $scope.oppstage.probability='';
   //window.location.replace('#/admin/settings');
   
  };
  //HKA 15.12.2013 Edit opportunity stage
  $scope.editopportunitystage = function(stage){
    console.log(stage);
      $scope.oppstageedit.name = stage.name;
      $scope.oppstageedit.probability = stage.probability;
      $scope.oppstageedit.id=stage.id;
       $('#EditOppsStage').modal('show');


   
  };
  //18.12.2013 HKA  Update Opportunity stage
  $scope.updateOppStage = function(oppstage){
    console.log(oppstage);
    var params ={'id':$scope.oppstageedit.id,
                 'name':oppstage.name,
                 'probability':oppstage.probability

    }
    Opportunitystage.update($scope,params)
    $('#EditOppsStage').modal('hide');
    $scope.oppstage.name='';
    $scope.oppstage.probability='';
      
  };
//HKA 18.12.2013 Delete Opportunity stage
  $scope.deleteoppstage = function(oppstage){
    
    var params={'id':oppstage.id};
    Opportunitystage.delete($scope,params);

  };

  $scope.listoppstage = function(){
    var params ={'order':'probability'};
    Opportunitystage.list($scope,params);
  };


  //HKA 12.12.2013 Add a new Case Status

  $scope.saveCaseStatus = function(casestatus){
    var params={'status':casestatus.status};
   Casestatus.insert($scope,params);
   $('#addCasestatustModal').modal('hide');
   
   $scope.casestatus.status='';

   
  };
   //HKA 19.12.2013 Edit Delete Case status

  //HKA 15.12.2013 Edit case status
  $scope.editcasestatus = function(casestat){
      console.log('I am on edit case status');
      $scope.casestatusedit.status = casestat.status;
      $scope.casestatusedit.id=casestat.id;
       $('#EditCaseStatus').modal('show');
   
  };
  //18.12.2013 HKA  Update case status
  $scope.updateCasestatus = function(casestat){
    console.log('I am on update  case status');
    var params ={'id':$scope.casestatusedit.id,
                 'status':casestat.status

    }
    Casestatus.update($scope,params);
    $('#EditCaseStatus').modal('hide');

  };
  $scope.casestatuslist = function(){
    Casestatus.list($scope,{});
  }
//HKA 18.12.2013 Delete case status
  $scope.deletecasestatus = function(casestate){
    
     var params={'id':casestate.id};
    Casestatus.delete($scope,params);

  };
   //HKA 12.12.2013 Add a new Lead status
  $scope.saveLeadtatus = function(lead){
    var params={'status':lead.status

    };
   Leadstatus.insert($scope,params);
   $('#addLeadstatustModal').modal('hide');
   $scope.lead.status='';
   
    };
    //**************HKA 19.12.2013 Update, Delete Lead status****************************************

    $scope.editleadstatus = function(leadstatus){
    
      $scope.leadstat.status = leadstatus.status;
      
      $scope.leadstat.id=leadstatus.id;
       $('#EditLeadStatus').modal('show');


   
  };
  
  $scope.updateLeadstatus = function(stat){
    
    var params ={'id':$scope.leadstat.id,
                 'status':stat.status

    }
    Leadstatus.update($scope,params)
    $('#EditLeadStatus').modal('hide');
      
  };
//HKA 22.12.2013 Delete Lead status
  $scope.deletleadstatus = function(leadstat){
     var params={'id':leadstat.id};
    Leadstatus.delete($scope,params);

  };
  
  $scope.listleadstatus = function(){
    Leadstatus.list($scope,{});
  };
 


  // Google+ Authentication 
    Auth.init($scope);
	}]);