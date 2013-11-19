
var app = angular.module('crmEngine',['ui.bootstrap.datetimepicker','ui.bootstrap','crmEngine.accountservices','crmEngine.contactservices','crmEngine.topicservices','crmEngine.taskservices','crmEngine.eventservices', 'crmEngine.leadservices','crmEngine.opportunityservices','crmEngine.caseservices','crmEngine.campaignservices','crmEngine.userservices','crmEngine.groupservices','crmEngine.noteservices','crmEngine.commentservices']);



app.config(function($interpolateProvider){
  $interpolateProvider.startSymbol('<%=');
  $interpolateProvider.endSymbol('%>');
});


function getCookie(c_name)
{
var c_value = document.cookie;
var c_start = c_value.indexOf(" " + c_name + "=");
if (c_start == -1)
  {
  c_start = c_value.indexOf(c_name + "=");
  }
if (c_start == -1)
  {
  c_value = null;
  }
else
  {
  c_start = c_value.indexOf("=", c_start) + 1;
  var c_end = c_value.indexOf(";", c_start);
  if (c_end == -1)
  {
c_end = c_value.length;
}
c_value = unescape(c_value.substring(c_start,c_end));
}
return c_value;
}


app.config(function($httpProvider) {

    var token = getCookie('csrftoken');
    //console.log(token);
    $httpProvider.defaults.headers.post['X-CSRFToken'] = token;
});
app.config(['$routeProvider', function($routeProvider) {
     $routeProvider.
      when('/accounts/', {
        controller: 'AccountListCtrl',        
        templateUrl:'/views/accounts/list'
      }).when('/accounts/show/:accountId/tab/:accountTab', {
        controller: 'AccountShowCtrl',
        
        
        templateUrl:'/views/accounts/show'
      }).when('/accounts/show/:accountId', {
        controller: 'AccountShowCtrl',       
        templateUrl:'/views/accounts/show'
      }).when('/accounts/edit/:accountId', {
        controller: 'AccountEditCtrl',
        
        templateUrl:'http://localhost:8090/accounts/'
      }).when('/accounts/new', {
        controller: 'AccountNewCtrl',
        
        templateUrl:'http://localhost:8090/accounts/'

        
      }).when('/contacts/', {
        controller: 'ContactListCtrl',      
        templateUrl:'/views/contacts/list'
        //HKA 22.08.13 Step 1 create route
      }).when('/contacts/show/:contactId', {
        controller: 'ContactShowCtrl',        
        templateUrl:'/views/contacts/show'
      }).when('/opportunities/', {
        controller: 'OpportunityListCtrl',        
        templateUrl:'/views/opportunities/list'
        
      }).when('/opportunities/show/:opportunityId', {
        controller: 'OpportunityShowCtrl',        
        templateUrl:'/views/opportunities/show'

      }).when('/leads/', {
        controller: 'LeadListCtrl',        
        templateUrl:'/views/leads/list'
        
      }).when('/leads/show/:leadId', {
        controller: 'LeadShowCtrl',        
        templateUrl:'/views/leads/show'

      }).when('/cases/', {
        controller: 'CaseListCtrl',        
        templateUrl:'/views/cases/list'
        
      }).when('/cases/show/:caseId', {
        controller: 'CaseShowCtrl',        
        templateUrl:'/views/cases/show'

      }).when('/campaigns/', {
        controller: 'CampaignListCtrl',        
        templateUrl:'/views/campaigns/list'
        
      }).when('/campaigns/show/:campaignId', {
        controller: 'CampaignShowCtrl',        
        templateUrl:'/views/campaigns/show'

      }).when('/shows', {
        controller: 'ShowListCtrl',        
        templateUrl:'/views/shows/list'
      }).when('/shows/show/:showId', {
        controller: 'ShowShowCtrl',        
        templateUrl:'/views/shows/show'
      }).when('/search/:q', {

    

        controller: 'SearchShowController',        
        templateUrl:'/views/search/list'
      }).when('/admin/users', {

    

        controller: 'UserListCtrl',        
        templateUrl:'/views/admin/users/list'
      }).when('/admin/groups', {
        controller: 'GroupListCtrl',        
        templateUrl:'/views/admin/groups/list'
      }).when('/admin/groups/show/:groupId', {
        controller: 'GroupShowCtrl',        
        templateUrl:'/views/admin/groups/show'
      }).when('/notes/show/:noteId',{
      controller : 'NoteShowController',
      templateUrl:'/views/notes/show'
      });
}]);