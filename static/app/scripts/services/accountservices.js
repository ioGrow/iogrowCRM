var accountservices = angular.module('crmEngine.accountservices',[]);
// Base sercice (create, delete, get)
accountservices.factory('Conf', function($location) {
      function getRootUrl() {
        var rootUrl = $location.protocol() + '://' + $location.host();
        if ($location.port())
          rootUrl += ':' + $location.port();
        return rootUrl;
      };
      return {
        'clientId': '987765099891.apps.googleusercontent.com',
        'apiBase': '/api/',
        'rootUrl': getRootUrl(),
        'scopes': 'https://www.googleapis.com/auth/plus.login https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/drive https://www.googleapis.com/auth/calendar',
        'requestvisibleactions': 'http://schemas.google.com/AddActivity ' +
                'http://schemas.google.com/ReviewActivity',
         'cookiepolicy': 'single_host_origin',
         // Urls
         'accounts': '/#/accounts/show/',
         'contacts': '#/contacts/show/',
         'leads': '/#/leads/show/',
         'opportunities': '/#/opportunities/show/',
         'cases': '/#/cases/show/',
         'shows': '/#/shows/show/'
      };
});
accountservices.factory('Account', function($http) {
  
  var Account = function(data) {
    angular.extend(this, data);
  }

  
  Account.get = function($scope,id) {
          gapi.client.crmengine.accounts.get(id).execute(function(resp) {
            if(!resp.code){
               $scope.account = resp;
               $scope.isContentLoaded = true;
               $scope.listTopics(resp);
               $scope.listTasks();
               $scope.listEvents();
               $scope.listContacts();
               $scope.listOpportunities();
               $scope.listCases();
               $scope.listNeeds();
               
               $scope.listDocuments();
               $scope.email.to = '';
               //$scope.renderMaps();
                angular.forEach($scope.account.emails, function(value, key){
                  $scope.email.to = $scope.email.to + value.email + ',';
                  
                });
               // Call the method $apply to make the update on the scope
                $scope.$apply();

            }else {
               alert("Error, response is: " + angular.toJson(resp));
            }
            console.log('gapi #end_execute');
          });
  };
  Account.patch = function($scope,params) {
          console.log('in accounts.patch service');
          console.log(params);
          gapi.client.crmengine.accounts.patch(params).execute(function(resp) {
            if(!resp.code){
               $scope.account = resp;
               $scope.email.to = '';
                angular.forEach($scope.account.emails, function(value, key){
                  $scope.email.to = $scope.email.to + value.email + ',';
                  
                });
               
               // Call the method $apply to make the update on the scope
                $scope.$apply();

            }else {
               alert("Error, response is: " + angular.toJson(resp));
            }
            console.log('accounts.patch gapi #end_execute');
          });
  };
  Account.list = function($scope,params){
      $scope.isLoading = true;
      gapi.client.crmengine.accounts.list(params).execute(function(resp) {
              if(!resp.code){
                  
                  if (!resp.items){
                    $scope.blankStateaccount = true;
                  }
                 $scope.accounts = resp.items;
                 if ($scope.currentPage>1){
                      $scope.pagination.prev = true;
                   }else{
                       $scope.pagination.prev = false;
                   }
                 if (resp.nextPageToken){
                   var nextPage = $scope.currentPage + 1;
                   // Store the nextPageToken
                   $scope.pages[nextPage] = resp.nextPageToken;
                   $scope.pagination.next = true;
                   
                 }else{
                  $scope.pagination.next = false;
                 }
                 // Loaded succefully
                 $scope.isLoading = false;
                 // Call the method $apply to make the update on the scope
                 $scope.$apply();
              }else {
                 alert("Error, response is: " + angular.toJson(resp));
              }
      });
  };
  Account.search = function($scope,params){
      gapi.client.crmengine.accounts.search(params).execute(function(resp) {
           if (resp.items){
              $scope.results = resp.items;
              
              $scope.$apply();
            };
            
      });
  };
  Account.insert = function($scope,params){
      $scope.isLoading = true;
      gapi.client.crmengine.accounts.insert(params).execute(function(resp) {
         
         
         if(!resp.code){
            $scope.accountInserted(resp);
            $scope.isLoading = false;
            $scope.$apply();
          
         }else{
             console.log(resp.message);
             $('#addAccountModal').modal('hide');
             $('#errorModal').modal('show');
             if(resp.message=="Invalid grant"){
                $scope.refreshToken();
                $scope.isLoading = false;
                $scope.$apply();
             };
         }
      });
  };
  Account.delete = function($scope,id){
    gapi.client.crmengine.accounts.delete(id).execute(function(resp){
        window.location.replace('#/accounts');
      }
    )};

return Account;
});





accountservices.factory('Search', function($http) {
  
  var Search = function(data) {
    angular.extend(this, data);
  }
  Search.getUrl = function(type,id){
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
        case 'Opportunity':
          base_url = '/#/opportunities/show/';
          break;
        case 'Case':
          base_url = '/#/cases/show/';
          break;
        case 'Show':
          base_url = '/#/live/shows/show/';
          break;
        case 'Product_Video':
          base_url = '/#/live/product_videos/product_video/';
          break;
        case 'Customer_Story':
          base_url = '/#/live/customer_stories/customer_story/';
          break;
        

        }

    return base_url+id;
  };

  
  Search.list = function($scope,params){
      $scope.isLoading = true;
      console.log('in search api go ahead');
      console.log(params);
      gapi.client.crmengine.search(params).execute(function(resp) {
              if(!resp.code){
                 $scope.searchResults = [];
                 for (var i=0,len=resp.items.length; i<len; i++)
                  { 
                        var id = resp.items[i].id;
                        var type = resp.items[i].type;
                        var title = resp.items[i].title;
                        var url = Search.getUrl(type,id);
                        var result = {};
                        result.id = id;
                        result.type = type;
                        result.title = title;
                        result.url = url;
                        $scope.searchResults.push(result);

                  }
                                   
                 //$scope.searchResults = resp.items;
                 if ($scope.currentPage>1){
                      $scope.pagination.prev = true;
                   }else{
                       $scope.pagination.prev = false;
                   }
                 if (resp.nextPageToken){
                   var nextPage = $scope.currentPage + 1;
                   // Store the nextPageToken
                   $scope.pages[nextPage] = resp.nextPageToken;
                   $scope.pagination.next = true;
                   
                 }else{
                  $scope.pagination.next = false;
                 }
                 // Loaded succefully
                 $scope.isLoading = false;
                 // Call the method $apply to make the update on the scope
                 $scope.$apply();
              }else {
                 alert("Error, response is: " + angular.toJson(resp));
              }
      });
  };
  

return Search;
});
accountservices.factory('Attachement', function($http) {
  
  var Attachement = function(data) {
    angular.extend(this, data);
  };
  Attachement.list = function($scope,params){
      $scope.isLoading = true;
      gapi.client.crmengine.documents.list(params).execute(function(resp) {
              if(!resp.code){
                if (!resp.items){
                    $scope.blankStatdocuments = true;
                  };
                
                 $scope.documents = resp.items;
                 if ($scope.currentPage>1){
                      $scope.pagination.prev = true;
                   }else{
                       $scope.pagination.prev = false;
                   }
                 if (resp.nextPageToken){
                   var nextPage = $scope.currentPage + 1;
                   // Store the nextPageToken
                   $scope.pages[nextPage] = resp.nextPageToken;
                   $scope.pagination.next = true;
                   
                 }else{
                  $scope.pagination.next = false;
                 }
                 // Loaded succefully
                 $scope.isLoading = false;
                 // Call the method $apply to make the update on the scope
                 $scope.$apply();
              }else {
                 alert("Error, response is: " + angular.toJson(resp));
              }
      });
      
  };
  Attachement.get = function($scope,id) {
          gapi.client.crmengine.documents.get(id).execute(function(resp) {
            if(!resp.code){
               $scope.attachment = resp;
               $scope.prepareUrls();
               
               $scope.isContentLoaded = true;
               
               // Call the method $apply to make the update on the scope
                $scope.$apply();

            }else {
               alert("Error, response is: " + angular.toJson(resp));
            }
            console.log('gapi #end_execute');
          });
  };
  Attachement.insert = function($scope,params){
      $scope.isLoading = true;
      gapi.client.crmengine.documents.insert(params).execute(function(resp) {
            if(!resp.code){ 
             $('#newDocument').modal('hide');
             $scope.listDocuments();
             $scope.isLoading = false;
             $scope.blankStatdocuments = false;
             $scope.$apply();
            }else{
               console.log(resp.message);
               $('#newDocument').modal('hide');
               $('#errorModal').modal('show');
               if(resp.message=="Invalid grant"){
                  $scope.refreshToken();
                   $scope.blankStatdocuments = false;
                  $scope.isLoading = false;
                  $scope.$apply();
               };
         }
     });
      
  };
  Attachement.attachfiles = function($scope,params){
      $scope.isLoading = true;
      
      gapi.client.crmengine.documents.attachfiles(params).execute(function(resp) {
            if(!resp.code){ 
            
             $scope.listDocuments();
             $scope.isLoading = false;
              $scope.blankStatdocuments = false;
             $scope.$apply();
            }else{
               console.log(resp.message);
               
               $('#errorModal').modal('show');
               if(resp.message=="Invalid grant"){
                  $scope.refreshToken();
                   $scope.blankStatdocuments = false;
                  $scope.isLoading = false;
                  $scope.$apply();
               };
         }
     });
      
  };
  

return Attachement;
});

accountservices.factory('Email', function() {
  
  var Email = function(data) {
    angular.extend(this, data);
  };
  
  Email.send = function($scope,params){
      $scope.isLoading = true;
      $scope.sending = true;
      gapi.client.crmengine.emails.send(params).execute(function(resp) {
            
            $('#sendingEmail').modal('show');
            if(!resp.code){ 
             console.log('email sent thank you');
             $scope.emailSent= true;
             $scope.sending = false;
             $scope.selectedTab = 1;
             $scope.listTopics();
             $scope.email = {};
             $scope.$apply();

             $('#sendingEmail').modal('hide');


            }else{
               console.log(resp.message);

               
               $('#errorModal').modal('show');
               if(resp.message=="Invalid grant"){
                  $scope.refreshToken();
                  $scope.isLoading = false;
                  $scope.$apply();
               };
         }
     });
      
  };
 
  

return Email;
});