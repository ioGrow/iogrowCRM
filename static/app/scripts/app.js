
var app = angular.module('crmEngine',['ui.bootstrap.datetimepicker','easypiechart','xeditable','ngQuickDate','ui.bootstrap','ui.select2', 'crmEngine.authservices', 'crmEngine.showservices', 'crmEngine.accountservices','crmEngine.contactservices','crmEngine.topicservices','crmEngine.taskservices','crmEngine.eventservices', 'crmEngine.leadservices','crmEngine.opportunityservices','crmEngine.caseservices','crmEngine.userservices','crmEngine.groupservices','crmEngine.noteservices','crmEngine.commentservices','crmEngine.settingservices','crmEngine.feedbackservices','crmEngine.companyprofileservices','mapServices','crmEngine.needservices','crmEngine.infonodeservices']);

app.config(function($interpolateProvider){
  $interpolateProvider.startSymbol('<%=');
  $interpolateProvider.endSymbol('%>');
});
app.run(function(editableOptions) {
  editableOptions.theme = 'bs3'; // bootstrap3 theme. Can be also 'bs2', 'default'
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
      }).when('/accounts/new', {
        controller: 'AccountNewCtrl',
        templateUrl:'/views/accounts/new'
      }).
      // Contacts
      when('/contacts/new', {
        controller: 'ContactNewCtrl',      
        templateUrl:'/views/contacts/new'
      }).when('/contacts/', {
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
      }).when('/opportunities/new', {
        controller: 'OpportunityNewCtrl',        
        templateUrl:'/views/opportunities/new'
      }).
      // Leads
      when('/leads/', {
        controller: 'LeadListCtrl',        
        templateUrl:'/views/leads/list'
      }).when('/leads/show/:leadId', {
        controller: 'LeadShowCtrl',        
        templateUrl:'/views/leads/show'
      }).
      when('/leads/new', {
        controller: 'LeadNewCtrl',        
        templateUrl:'/views/leads/new'
      }).
      // Cases
      when('/cases/', {
        controller: 'CaseListCtrl',        
        templateUrl:'/views/cases/list'
      }).when('/cases/show/:caseId', {
        controller: 'CaseShowCtrl',        
        templateUrl:'/views/cases/show'
      }).when('/cases/new', {
        controller: 'CaseNewCtrl',        
        templateUrl:'/views/cases/new'
      }).
      // Needs
      when('/needs/show/:needId', {
        controller: 'NeedShowCtrl',        
        templateUrl:'/views/needs/show'
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
      
      // All Tasks 
      when('/tasks/',{
      controller : 'AllTasksController',
      templateUrl:'/views/tasks/list'
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
        
      }).when('/live/company_profile/:organizationId',{
        controller:'CompanyProfileShowCtrl',
        templateUrl:'/views/live/company_profile'

      }).when('/live/product_videos',{
        controller:'ProductVideoListCtrl',
        templateUrl:'/views/live/product_videos'

      }).when('/live/product_videos/product_video/:productId',{
        controller:'ProductVideoShowCtrl',
        templateUrl:'/views/live/product_videos/show'
        
      }).when('/live/customer_stories',{
        controller:'CustomerStoriesListCtrl',
        templateUrl:'/views/live/customer_stories'

      }).when('/live/customer_stories/customer_story/:customerstoryId',{
        controller:'CustomerStoriesShowCtrl',
        templateUrl:'/views/live/customer_stories/show'
        
      }).when('/live/feedbacks',{
        controller:'FeedBacksListCtrl',
        templateUrl:'/views/live/feedbacks'
      }).when('/live/feedbacks/feedback/:feedbackId',{
        controller:'FeedBacksShowCtrl',
        templateUrl:'/views/live/feedbacks/show'
      });
}]);
app.config(function(ngQuickDateDefaultsProvider) {
  // Configure with icons from font-awesome
  return ngQuickDateDefaultsProvider.set({
    closeButtonHtml: "<i class='fa fa-times'></i>",
    buttonIconHtml: "<i class='fa fa-calendar'></i>",
    nextLinkHtml: "<i class='fa fa-chevron-right'></i>",
    prevLinkHtml: "<i class='fa fa-chevron-left'></i>",
    placeholder:'',
    // Take advantage of Sugar.js date parsing
    parseDateFunction: function(str) {
      d = Date.create(str);
      return d.isValid() ? d : null;
    }
  });
});

/***header scroll detection for bottom shadow***/
$(window).scroll(function(){
  var y = $(window).scrollTop();
  if( y > 0 ){
      $(".subHeader").addClass("header-bottom-shadow");
      /*$(".fixed-labelsCard").addClass("labelsCardScroll");*/
      /*$(".page-sidebar-wrapper").addClass("sidebar-left-shadow");*/
  } else {
       $(".subHeader").removeClass("header-bottom-shadow");
       /*$(".fixed-labelsCard").removeClass("labelsCardScroll");*/
       /*$(".page-sidebar-wrapper").removeClass("sidebar-left-shadow");*/
  }
 });
