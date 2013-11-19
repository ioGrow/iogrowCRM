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
        'clientId': '330861492018.apps.googleusercontent.com',
        'apiBase': '/api/',
        'rootUrl': getRootUrl(),
        'scopes': 'https://www.googleapis.com/auth/plus.login https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/drive',
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
  Account.insert = function(account){
      gapi.client.crmengine.accounts.insert(account).execute(function(resp) {
         console.log('in insert resp');
         console.log(resp);
         if(!resp.code){
          $('#addAccountModal').modal('hide');
          window.location.replace('#/accounts/show/'+resp.id);
          
         }else{
          console.log(resp.code);
         }
      });
  };
  

return Account;
});


// retrieve list account
accountservices.factory('MultiAccountLoader', ['Account','$route', '$q',
    function(Account, $route, $q) {
    return function() {
    var delay = $q.defer();
    gapi.client.crmengine.accounts.list().execute(function(resp) {
            console.log('after execution');
           // console.log(resp);
            
            delay.resolve(resp.items);

            console.log('resoleved');
            console.log(resp.items);
            console.log('continue');
      // pagination
    
    });
    console.log('continued');
    
    return delay.promise;
    };

   // function(Account,$route, $q) {
  //return function() {
   // return Account.list($route.current.params.page);
 // };
}]);

// retrieve an account
accountservices.factory('AccountLoader', ['Account', '$route', '$q',
    function(Account, $route, $q) {
  return function() {
    var delay = $q.defer();
    
    var accountId = $route.current.params.accountId;
    
    
    return Account.get($route.current.params.accountId);
  };
}]);

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
          base_url = '/#/shows/show/';
          break;
        

        }

    return base_url+id;
  }

  
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