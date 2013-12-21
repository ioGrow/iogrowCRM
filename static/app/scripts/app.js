
var app = angular.module('crmEngine',['ui.bootstrap.datetimepicker','ui.bootstrap','crmEngine.authservices', 'crmEngine.showservices', 'crmEngine.accountservices','crmEngine.contactservices','crmEngine.topicservices','crmEngine.taskservices','crmEngine.eventservices', 'crmEngine.leadservices','crmEngine.opportunityservices','crmEngine.caseservices','crmEngine.userservices','crmEngine.groupservices','crmEngine.noteservices','crmEngine.commentservices','crmEngine.settingservices']);

app.config(function($interpolateProvider){
  $interpolateProvider.startSymbol('<%=');
  $interpolateProvider.endSymbol('%>');
});
app.config(['$routeProvider', function($routeProvider) {
     $routeProvider.
     // Accounts
      when('/accounts/', {
        controller: 'AccountListCtrl',        
        templateUrl:'/views/accounts/list'
      }).when('/accounts/show/:accountId', {
        controller: 'AccountShowCtrl',
        templateUrl:'/views/accounts/show'
      }).
      // Contacts
      when('/contacts/', {
        controller: 'ContactListCtrl',      
        templateUrl:'/views/contacts/list'
        
      }).when('/contacts/show/:contactId', {
        controller: 'ContactShowCtrl',        
        templateUrl:'/views/contacts/show'
      }).
      // Opportunities
      when('/opportunities/', {
        controller: 'OpportunityListCtrl',        
        templateUrl:'/views/opportunities/list'
      }).when('/opportunities/show/:opportunityId', {
        controller: 'OpportunityShowCtrl',        
        templateUrl:'/views/opportunities/show'
      }).
      // Leads
      when('/leads/', {
        controller: 'LeadListCtrl',        
        templateUrl:'/views/leads/list'
      }).when('/leads/show/:leadId', {
        controller: 'LeadShowCtrl',        
        templateUrl:'/views/leads/show'
      }).
      // Cases
      when('/cases/', {
        controller: 'CaseListCtrl',        
        templateUrl:'/views/cases/list'
      }).when('/cases/show/:caseId', {
        controller: 'CaseShowCtrl',        
        templateUrl:'/views/cases/show'
      }).
      // Notes
      when('/notes/show/:noteId',{
      controller : 'NoteShowController',
      templateUrl:'/views/notes/show'
      }).
      // Events
      when('/events/show/:eventId',{
      controller : 'EventShowController',
      templateUrl:'/views/events/show'
      }).
      // Tasks 
      when('/tasks/show/:taskId',{
      controller : 'TaskShowController',
      templateUrl:'/views/tasks/show'
      }).
      // Documents
      when('/documents/show/:documentId',{
      controller : 'DocumentShowController',
      templateUrl:'/views/documents/show'
      }).
      // Search
      when('/search/:q', {
        controller: 'SearchShowController',        
        templateUrl:'/views/search/list'
      }).
      // Admin Console
      when('/admin/users', {
        controller: 'UserListCtrl',        
        templateUrl:'/views/admin/users/list'
      }).when('/admin/groups', {
        controller: 'GroupListCtrl',        
        templateUrl:'/views/admin/groups/list'
      }).when('/admin/groups/show/:groupId', {
        controller: 'GroupShowCtrl',        
        templateUrl:'/views/admin/groups/show'
      }).when('/admin/settings',{
        controller:'SettingsShowCtrl',
        templateUrl:'/views/admin/settings'

      }).
      //Shows
      when('/live/shows', {
        controller: 'ShowListCtrl',        
        templateUrl:'/views/shows/list'
      }).when('/live/shows/show/:showId', {
        controller: 'ShowShowCtrl',
        templateUrl:'/views/shows/show'
        
      }).when('/live/company_profile',{
        controller:'CompanyProfileShowCtrl',
        templateUrl:'/views/live/company_profile'

      }).when('/live/product_videos',{
        controller:'ProductVideoListCtrl',
        templateUrl:'/views/live/company_profile'

      }).when('/live/customer_stories',{
        controller:'CustomerStoriesListCtrl',
        templateUrl:'/views/live/company_profile'

      }).when('/live/feedbacks',{
        controller:'FeedBacksListCtrl',
        templateUrl:'/views/live/company_profile'
      });
}]);