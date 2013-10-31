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
        'scopes': 'https://www.googleapis.com/auth/plus.login https://www.googleapis.com/auth/userinfo.email',
        'requestvisibleactions': 'http://schemas.google.com/AddActivity ' +
                'http://schemas.google.com/ReviewActivity',
         'cookiepolicy': 'single_host_origin'
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
               // Call the method $apply to make the update on the scope
               $scope.$apply();

            }else {
               alert("Error, response is: " + angular.toJson(resp));
            }
            console.log('gapi #end_execute');
          });
  };
  Account.list = function($scope,params){
      gapi.client.crmengine.accounts.list(params).execute(function(resp) {

              if(!resp.code){
                 $scope.accounts = resp.items;
                 if (resp.nextPageToken){
                  var nextPage = $scope.currentPage + 1;
                   $scope.pages[nextPage] = resp.nextPageToken;
                   console.log($scope.pages);
                   
                   

                   $scope.pagination.next = true;
                   if ($scope.currentPage>1){
                   $scope.pagination.prev = true;
                   }else{
                       $scope.pagination.prev = false;
                   }
                 }else{
                  $scope.pagination.next = false;
                 }
                 // Call the method $apply to make the update on the scope
                 $scope.isLoading = false;
                 $scope.$apply();
                 console.log('current page');
                 console.log($scope.currentPage);
                 

              }else {
                 alert("Error, response is: " + angular.toJson(resp));
              }
              console.log('gapi #end_execute');
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
