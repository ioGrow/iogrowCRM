var settingservices = angular.module('crmEngine.settingservices',[]);
settingservices.factory('Conf', function($location) {
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
settingservices.factory('Opportunitystage', function($http) {
	 var Opportunitystage = function(data) {
    angular.extend(this, data);
  }
Opportunitystage.list = function($scope,params){
	console.log( 'I amm in opportunitystage list services')
	gapi.client.crmengine.opportunitystages.list(params).execute(function(resp){
		if(!resp.code){
			$scope.opportunitystages = resp.items;
      console.log($scope.opportunitystages)
			$scope.$apply();

		}
		else{
          alert("Error, response is: " + angular.toJson(resp));
		};

	})
	};
  Opportunitystage.insert = function($scope,params){
    gapi.client.crmengine.opportunitystages.insert(params).execute(function(resp){

    }

  )};
return Opportunitystage;
});
//HKA 14.12.2013 Case status Services
settingservices.factory('Casestatus',function($http){
  var Casestatus = function(data){
    angular.extend(this,data);
  };
  //HKA 14.12.2013 Case status Insert
  Casestatus.insert = function($scope,params){
    gapi.client.crmengine.casestatuses.insert(params).execute(function(resp){
     
    }
     )};
  //HKA 14.12.2013 Case status list
  Casestatus.list = function($scope,params){
    gapi.client.crmengine.casestatuses.list(params).execute(function(resp){
      if(!resp.code){
        $scope.casesatuses = resp.items;
        $scope.$apply();

      }

        else{
          alert("Error, response is:"+angular.toJson(resp));
        }

    }
    )};
  


   return Casestatus;
  });

//HKA 14.12.2013 Case status Services
settingservices.factory('Leadstatus',function($http){
  var Leadstatus = function(data){
    angular.extend(this,data);
  };
  //HKA 14.12.2013 Case status Insert
  Leadstatus.insert = function($scope,params){
    gapi.client.crmengine.leadstatuses.insert(params).execute(function(resp){
     
    }
     )};
  //HKA 14.12.2013 Case status list
  Leadstatus.list = function($scope,params){
    gapi.client.crmengine.leadstatuses.list(params).execute(function(resp){
      if(!resp.code){
        $scope.leadstatuses = resp.items;
        $scope.$apply();

      }

        else{
          alert("Error, response is:"+angular.toJson(resp));
        }

    }
    )};
  


   return Leadstatus;
  });

 