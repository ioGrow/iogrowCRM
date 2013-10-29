var leadservices = angular.module('crmEngine.leadservices',[]);
 /*****************HKA 22.08.2013 Lead services ****************/
//HKA 22.08.2013  Base sercice (create, delete, get)

leadservices.factory('Lead', function($http) {
  
  var Lead = function(data) {
    angular.extend(this, data);
  }

  
  Lead.get = function(id) {
    return $http.get('/api/leads/' + id).then(function(response) {
      return new Lead(response.data);
    });
  };
  Lead.list = function(page){
  	return $http.get('/api/leads/?page='+page).then(function(response) {
      var results = {}
      results.leads = response.data.results;
      results.count = response.data.count;

      return results;
    });

  };
  Lead.prototype.create = function() {
    
    var lead = this;
    return $http.post('/api/leads/', lead).then(function(response) {
      
      lead.id = response.data.id;
      return lead;
    });
  };

   //HKA 25.08.2013 Add update function put
 Lead.prototype.put  = function(lead){
    return $http.put('/api/leads/'+lead.id, lead).then(function(response) {
       
      return lead;
    });
};

//HKA 25.08.2013 Delete lead
Lead.prototype.delete = function(lead){
  return $http.delete('/api/leads/'+lead.id).then(function(response) {
       
      //return lead;
    });
}


return Lead;
});

//HKA 22.08.2013  retrive list of leads

leadservices.factory('MultiLeadLoader', ['Lead','$route', '$q',
    function(Lead,$route, $q) {
  return function() {
    return Lead.list($route.current.params.page);
  };
}]);

//HKA 22.08.2013 retrieve a lead
leadservices.factory('LeadLoader', ['Lead', '$route', '$q',
    function(Lead, $route, $q) {
  return function() {
    var delay = $q.defer();
    
    
    
    return Lead.get($route.current.params.leadId);
  };
}]);