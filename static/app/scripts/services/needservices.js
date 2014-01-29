var needservices = angular.module('crmEngine.needservices',[]);
needservices.factory('Need', function() {
  
  var Need = function(data) {
    angular.extend(this, data);
  };

  Need.get = function($scope,id) {
          gapi.client.crmengine.needs.get(id).execute(function(resp) {
            if(!resp.code){
               $scope.need = resp;
               var url = Need.getUrl($scope.need.about_kind,$scope.need.about_item);
               $scope.uri =url;
               var tab = '#id_' + $scope.need.about_kind + 's'
               $(tab).addClass("active");
               $scope.isContentLoaded = true;
               $scope.listTopics(resp);
               $scope.listTasks();
               $scope.listEvents();
               $scope.listDocuments();
               // Call the method $apply to make the update on the scope
               //$scope.apply();

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
  
  Need.list = function($scope,params){
      $scope.isLoading = true;
      gapi.client.crmengine.needs.list(params).execute(function(resp) {
              if(!resp.code){
                  if (!resp.items){
                    $scope.blankStateneeds = true;
                  }
                 $scope.needs = resp.items;
                         
                 if ($scope.needsCurrentPage>1){
                      $scope.needspagination.prev = true;
                   }else{
                       $scope.needspagination.prev = false;
                   }
                 if (resp.nextPageToken){
                   var nextPage = $scope.needsCurrentPage + 1;
                   // Store the nextPageToken
                   $scope.needspages[nextPage] = resp.nextPageToken;
                   $scope.needspagination.next = true;
                   
                 }else{
                  $scope.needspagination.next = false;
                 }
                 // Loaded succefully
                 $scope.isLoading = false;
                 // Call the method $apply to make the update on the scope
                 $scope.$apply();
              }else {
                 if(resp.message=="Invalid token"){
                $scope.refreshToken();
                $scope.isLoading = false;
                $scope.$apply();
               };
              }
      });
  };
  Need.insert = function($scope,params){
     $scope.isLoading = true;
      gapi.client.crmengine.needs.insert(params).execute(function(resp) {
         console.log('in insert resp');
         console.log(resp);
         if(!resp.code){
          $scope.isLoading = false;
          $('#addNeedModal').modal('hide');
          window.location.replace('#/needs/show/'+resp.id);
          
         }else{
          console.log(resp.message);
             $('#addNeedModal').modal('hide');
             $('#errorModal').modal('show');
             if(resp.message=="Invalid grant"){
                $scope.refreshToken();
                $scope.isLoading = false;
                $scope.$apply();
             };
         }
      });
  };
Need.patch  = function($scope,params){
   gapi.client.crmengine.needs.patch(params).execute(function(resp) {
     if(!resp.code){
       $scope.need = resp;
       $scope.$apply();
     } else {
              if(resp.message=="Invalid token"){
                $scope.refreshToken();
                $scope.isLoading = false;
                $scope.$apply();
               };
            }

   });
};




  Need.getUrl = function(type,id){
  var base_url = undefined;
    switch (type)
        {
        case 'Account':
          base_url = '/#/accounts/show/';
          break;
        case 'Contact':
          base_url = '/#/contacts/show/';
          break;
        case 'Lead':
          base_url = '/#/leads/show/';
          break;
        

        }

    return base_url+id;

 }

 
return Need;
});