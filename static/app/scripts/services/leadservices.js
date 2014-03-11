var leadservices = angular.module('crmEngine.leadservices',[]);

leadservices.factory('Lead', function($http) {
  
  var Lead = function(data) {
    angular.extend(this, data);
  }

  Lead.get = function($scope,id) {
          gapi.client.crmengine.leads.getv2(id).execute(function(resp) {
            if(!resp.code){
               $scope.lead = resp;
               $scope.isContentLoaded = true;
                $scope.listTopics(resp);
                $scope.listTasks();
                $scope.listEvents();
                $scope.listDocuments();
                $scope.listInfonodes();
                $scope.selectedTab = 2;
                //$scope.renderMaps();
                $scope.email.to = '';
                document.title = "Lead: " + $scope.lead.firstname +' '+ $scope.lead.lastname ;
                angular.forEach($scope.lead.emails, function(value, key){
                  $scope.email.to = $scope.email.to + value.email + ',';
                  
                });
               // Call the method $apply to make the update on the scope
               $scope.$apply();
            }else {
               if(resp.message=="Invalid token"){
                $scope.refreshToken();
                $scope.isLoading = false;
                $scope.$apply();
               };
            }
            console.log('gapi #end_execute');
          });
  };
  Lead.patch = function($scope,params) {
          console.log('in accounts.patch service');
          console.log(params);
          gapi.client.crmengine.leads.patch(params).execute(function(resp) {
            if(!resp.code){
               $scope.lead = resp;
               $scope.email.to = '';
                angular.forEach($scope.lead.emails, function(value, key){
                  $scope.email.to = $scope.email.to + value.email + ',';
                  
                });
               
               // Call the method $apply to make the update on the scope
                $scope.$apply();

            }else {
               if(resp.message=="Invalid token"){
                $scope.refreshToken();
                $scope.isLoading = false;
                $scope.$apply();
               };
            }
            console.log('leads.patch gapi #end_execute');
          });
  };
  Lead.list = function($scope,params){
     $scope.isLoading = true;
      gapi.client.crmengine.leads.listv2(params).execute(function(resp) {

              if(!resp.code){
                if (!resp.items){
                    if(!$scope.isFiltering){
                        $scope.blankStatelead = true;
                    }
                  }
                 $scope.leads = resp.items;
                  if ($scope.currentPage>1){
                      $scope.leadpagination.prev = true;
                   }else{
                       $scope.leadpagination.prev = false;
                   }
                 if (resp.nextPageToken){
                   var nextPage = $scope.currentPage + 1;
                   // Store the nextPageToken
                   $scope.pages[nextPage] = resp.nextPageToken;
                   $scope.leadpagination.next = true;
                   
                 }else{
                  $scope.leadpagination.next = false;
                 }
                 // Call the method $apply to make the update on the scope
                 $scope.isLoading = false;
                 $scope.$apply();
                 

              }else {
                if(resp.message=="Invalid token"){
                $scope.refreshToken();
                $scope.isLoading = false;
                $scope.$apply();
               };
              }
              console.log('gapi #end_execute');
        });
    
  	

  };
  Lead.insert = function($scope,lead){
      $scope.isLoading = true;
      gapi.client.crmengine.leads.insertv2(lead).execute(function(resp) {
         
         if(!resp.code){
          $scope.isLoading = false;
          $('#addLeadModal').modal('hide');
          window.location.replace('#/leads/show/'+resp.id);
          
         }else{
            console.log(resp.message);
             $('#addLeadModal').modal('hide');
             $('#errorModal').modal('show');
             if(resp.message=="Invalid grant"){
                $scope.refreshToken();
                $scope.isLoading = false;
                $scope.$apply();
             };
         }
      });
  };
  Lead.convert = function($scope,id){
      $scope.isLoading = true;
      gapi.client.crmengine.leads.convert(id).execute(function(resp) {
         console.log('in insert resp');
         console.log(resp);
         if(!resp.code){
          $scope.isLoading = false;
          $('#convertLeadModal').modal('hide');
          window.location.replace('#/contacts/show/'+resp.id);
          
         }else{
            console.log(resp.message);
             $('#addLeadModal').modal('hide');
             $('#errorModal').modal('show');
             if(resp.message=="Invalid grant"){
                $scope.refreshToken();
                $scope.isLoading = false;
                $scope.$apply();
             };
         }
      });
  };


 Lead.delete = function($scope,id){
    gapi.client.crmengine.leads.delete(id).execute(function(resp){
        window.location.replace('#/leads');
      }
    )};

  Lead.search = function($scope,params){
      gapi.client.crmengine.leads.search(params).execute(function(resp) {
          console.log(resp);
           if (resp.items){
              $scope.results = resp.items;
              
              $scope.$apply();
            };
            
      });
  };
  

return Lead;
});


// retrieve a contact
contactservices.factory('LeadLoader', ['Lead', '$route', '$q',
    function(Lead, $route, $q) {
  return function() {
    var delay = $q.defer();
    
    var leadId = $route.current.params.leadId;
    
    
    return Lead.get($route.current.params.leadId);
  };
}]);
