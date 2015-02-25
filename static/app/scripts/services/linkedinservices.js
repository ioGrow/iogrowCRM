var contactservices = angular.module('crmEngine.linkedinservices',[]);
// Base sercice (create, delete, get)

accountservices.factory('Linkedin', function($http) {

  var Linkedin = function(data) {
    angular.extend(this, data);
  }


  Linkedin.getContact = function(params,callback) {
    gapi.client.crmengine.people.getLinkedinV2(params).execute(function(resp){
      callback(resp)
    });
  }
  Linkedin.listDb = function(params,callback) {
    gapi.client.crmengine.linkedin.list_db(params).execute(function(resp){
      callback(resp)
    });
  }  
  Linkedin.startSpider = function(params,callback) {
    gapi.client.crmengine.linkedin.startSpider(params).execute(function(resp){
      callback(resp)
    });
  }



return Linkedin;
});
