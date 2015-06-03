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
  Linkedin.spiderState = function(params,callback) {
    gapi.client.crmengine.linkedin.spiderState(params).execute(function(resp){
      callback(resp)
    });
  }
  Linkedin.listPeople = function(params,callback) {
    gapi.client.crmengine.people.getLinkedinList(params).execute(function(resp){
      callback(resp)
    });
  }
  Linkedin.profileGet = function(params,callback) {
    gapi.client.crmengine.people.get(params).execute(function(resp){
      callback(resp)
    });
  }
  Linkedin.listCompanies = function(params,callback) {
    gapi.client.crmengine.company.getLinkedinList(params).execute(function(resp){
      callback(resp)
    });
  }
  Linkedin.getCompany = function(params,callback) {
    gapi.client.crmengine.company.getCompanyLinkedin(params).execute(function(resp){
      callback(resp)
    });
  }



return Linkedin;
});
