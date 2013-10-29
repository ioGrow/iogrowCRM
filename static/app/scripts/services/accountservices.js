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
        'clientId': '800974247399.apps.googleusercontent.com',
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

  
  Account.get = function(id) {
    return $http.get('/api/accounts/' + id).then(function(response) {
      return new Account(response.data);
    });
  };
  Account.list = function(page){
    var results = {};
    console.log('in accounts.list service');
    gapi.client.crmengine.accounts.list().execute(function(resp) {
            console.log('after execution');
            console.log(resp);
            results.list = resp;
    });
       
     
     return results;
    
  	

  };
  Account.prototype.create = function() {
    
    var account = this;
    gapi.client.crmengine.accounts.insert(account).execute(function(resp) {
      console.log(resp);
      account.id = resp.id;
    
    });
    return account;
  } 

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
