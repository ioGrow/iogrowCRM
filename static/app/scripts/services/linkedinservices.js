var contactservices = angular.module('crmEngine.linkedinservices',[]);
// Base sercice (create, delete, get)

accountservices.factory('Linkedin', function($http) {

  var Linkedin = function(data) {
    angular.extend(this, data);
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
  Linkedin.getTwitterList = function(params,callback) {
    gapi.client.crmengine.people.getTwitterList(params).execute(function(resp){
      callback(resp)
    });
  }
  Linkedin.getTwitterProfile = function(params,callback) {
    gapi.client.crmengine.people.get_twitter(params).execute(function(resp){
      callback(resp)
    });
  };



return Linkedin;
});
