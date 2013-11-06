var app = angular.module('crmEngine',['ui.bootstrap.datetimepicker','ui.bootstrap','crmEngine.accountservices','crmEngine.topicservices','crmEngine.taskservices','crmEngine.eventservices', 'crmEngine.leadservices','crmEngine.userservices']);



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
      when('/accounts/p/:page', {
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

        
      }).when('/contacts/p/:page', {
        controller: 'ContactListCtrl',      
        templateUrl:'/views/contacts/list'
        //HKA 22.08.13 Step 1 create route
      }).when('/contacts/show/:contactId', {
        controller: 'ContactShowCtrl',        
        templateUrl:'/views/contacts/show'
      }).when('/opportunities/p/:page', {
        controller: 'OpportunityListCtrl',
        resolve: {
          accounts: ["MultiAccountLoader", function(MultiAccountLoader) {
            return MultiAccountLoader();
          }]
        },
        
        templateUrl:'/opportunities/'
        //HKA 22.08.13 Step 1 create route
      }).when('/opportunities/show/:accountId', {
        controller: 'OpportunityShowCtrl',
        resolve: {
          account: ["AccountLoader", function(AccountLoader) {
            return AccountLoader();
          }]
        },
        
        templateUrl:'/views/opportunities/show'
      }).when('/leads/p/:page', {
        controller: 'LeadListCtrl',
        resolve: {
          leads: ["MultiLeadLoader", function(MultiLeadLoader) {
            return MultiLeadLoader();
          }]
        },
        
        templateUrl:'/views/leads/list'
      }).when('/leads/show/:leadId', {
        controller: 'LeadShowCtrl',
        resolve: {
          lead: ["LeadLoader", function(LeadLoader) {
            return LeadLoader();
          }]
        },
        
        templateUrl:'/views/leads/show'

      }).when('/accounts/show/:accountId/notes/:noteId', {
        controller: 'NoteShowCtrl',
        resolve: {
          note: ["NoteLoader", function(NoteLoader) {
            return NoteLoader();
          }]
        },
        
        templateUrl:'/views/accounts/notes/show'

      }).when('/admin/users', {
        controller: 'UserListCtrl',        
        templateUrl:'/views/admin/users/list'
      });
}]);