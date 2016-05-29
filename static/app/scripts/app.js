var app = angular.module('crmEngine', ['googlechart','xeditable', 'ui.bootstrap', 'ui.select2', 'angularMoment',
    'angular-sortable-view',
    'crmEngine.authservices', 'crmEngine.accountservices', 'crmEngine.contactservices', 'crmEngine.topicservices',
    'crmEngine.taskservices', 'crmEngine.eventservices', 'crmEngine.leadservices', 'crmEngine.opportunityservices',
    'crmEngine.caseservices', 'crmEngine.userservices', 'crmEngine.noteservices',
    'crmEngine.commentservices', 'crmEngine.settingservices', 'mapServices',
    'crmEngine.infonodeservices', 'crmEngine.edgeservices',
    'crmEngine.profileservices', 'crmEngine.linkedinservices']);
//app.js Single page application

app.config(function($interpolateProvider){
  $interpolateProvider.startSymbol('<%=');
  $interpolateProvider.endSymbol('%>');
});
app.config( [
    '$compileProvider',
    function( $compileProvider )
    {   
        $compileProvider.urlSanitizationWhitelist(/^\s*(https?|ftp|mailto|tel|chrome-extension):/);
        // Angular before v1.2 uses $compileProvider.urlSanitizationWhitelist(...)
    }
]);
app.run(function(editableOptions) {
  editableOptions.theme = 'bs3'; // bootstrap3 theme. Can be also 'bs2', 'default'
});
app.run(['$rootScope', function($rootScope){
    $rootScope.subscription_url = '/subscribe';
}]);

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
      // Search
      when('/search/:q', {
        controller: 'SearchShowController',
        templateUrl:'/views/search/list'
      }).

      // Settings
      when('/admin/users', {
        controller: 'UserListCtrl',
        templateUrl:'/views/admin/users/list'
      }).when('/admin/users/new', {
        controller: 'UserNewCtrl',
        templateUrl:'/views/admin/users/new'
      }).when('/admin/users/show/:userGID', {
        controller: 'UserShowCtrl',
        templateUrl:'/views/admin/users/show'
      }).when('/admin/settings',{
        controller:'SettingsShowCtrl',
        templateUrl:'/views/admin/settings'
      }).
       //Calendar
       when('/calendar/', {
        controller: 'EventListController',
        templateUrl:'/views/calendar/show'
      })
       .when('/admin/company', {
             controller: 'BillingListController',
             templateUrl: '/views/admin/company/edit'
         }).when('/admin/email_signature', {
             controller: 'EmailSignatureEditCtrl',
             templateUrl: '/views/admin/email_signature/edit'
         }).when('/admin/regional', {
             controller: 'RegionalEditCtrl',
             templateUrl: '/views/admin/regional/edit'
         }).when('/admin/opportunity', {
             controller: 'OpportunityEditCtrl',
             templateUrl: '/views/admin/opportunity/edit'
         }).when('/admin/case_status', {
             controller: 'CaseStatusEditCtrl',
             templateUrl: '/views/admin/case_status/edit'
         }).when('/admin/lead_status', {
             controller: 'LeadStatusEditCtrl',
             templateUrl: '/views/admin/lead_status/edit'
         }).when('/admin/custom_fields/:customfieldId', {
             controller: 'CustomFieldsEditCtrl',
             templateUrl: '/views/admin/custom_fields/edit'
      }).when('/admin/delete_all_records', {
             controller: 'DeleteAllRecordsCtrl',
             templateUrl: '/views/admin/delete_all_records'
      });
}]);

var myApp = angular.module('myApp', []);
myApp.filter('inStage', function() {
  return function(input, stage) {
    var out = [];
      for (var i = 0; i < input.length; i++){
          if(input[i].current_stage.name == stage)
              out.push(input[i]);
      }      
    return out;
  };
});
app.filter("customCurrency", function (numberFilter)
  {
    function isNumeric(value)
    {
      return (!isNaN(parseFloat(value)) && isFinite(value));
    }

    return function (inputNumber, currencySymbol, decimalSeparator, thousandsSeparator, decimalDigits) {
      if (isNumeric(inputNumber))
      {
        // Default values for the optional arguments
        currencySymbol = (typeof currencySymbol === "undefined") ? "$" : currencySymbol;
        decimalSeparator = (typeof decimalSeparator === "undefined") ? "." : decimalSeparator;
        thousandsSeparator = (typeof thousandsSeparator === "undefined") ? "," : thousandsSeparator;
        decimalDigits = (typeof decimalDigits === "undefined" || !isNumeric(decimalDigits)) ? 2 : decimalDigits;

        if (decimalDigits < 0) decimalDigits = 0;

        // Format the input number through the number filter
        // The resulting number will have "," as a thousands separator
        // and "." as a decimal separator.
        var formattedNumber = numberFilter(inputNumber, decimalDigits);

        // Extract the integral and the decimal parts
        var numberParts = formattedNumber.split(".");

        // Replace the "," symbol in the integral part
        // with the specified thousands separator.
        numberParts[0] = numberParts[0].split(",").join(thousandsSeparator);

        // Compose the final result
        var result = currencySymbol + numberParts[0];

        if (numberParts.length == 2)
        {
          result += decimalSeparator + numberParts[1];
        }

        return result;
      }
      else
      {
        return inputNumber;
      }
    };
  });
app.filter('exists', function(){
  return function(elem, array) {
    for (var index in array) {
      if (array[index].id == elem.id) {
        return index;
      }
    }
    return -1;
  }
});
Number.prototype.format = function(n, x, s, c) {
    var re = '\\d(?=(\\d{3})+' + (n > 0 ? '\\D' : '$') + ')';
        var re1 = '\\d(?=(\\d{2})+' + (n > 0 ? '\\D' : '$') + ')',
        num = this.toFixed(Math.max(0, ~~n));
    
    return (c ? num.replace('.', c) : num).replace(new RegExp(re1, 'g'), '$&' + (s || ','));
};

app.filter('curr', function(){
 /* @param integer n: length of decimal
  @param integer x: length of whole part
  @param mixed   s: sections delimiter
  @param mixed   c: decimal delimiter*/
  return function(input,n, x, s, c) {
      n=(typeof(n) !== 'string') ? parseFloat(n) : n;
      x=(typeof(x) !== 'string') ? parseFloat(x) : x;
    if (typeof(input) !== 'undefined') {
      var re = '\\d(?=(\\d{' + (x || 3) + '})+' + (n > 0 ? '\\D' : '$') + ')',
        num = input.toFixed(Math.max(0, ~~n));
    
      return (c ? num.replace('.', c) : num).replace(new RegExp(re, 'g'), '$&' + (s || ','));
    }else{
      return "";
    };
   }
});
app.filter('startFrom', function() {
    return function(input, start) {
        if(input) {
            start = +start; //parse to int
            return input.slice(start);
        }
        return [];
    }
});
app.filter('capitalizeFirst', function() {
    return function(input) {
        if(input) {
            if (typeof input !=="string") {
                input=input.toString();
            };
            return input.charAt(0).toUpperCase() + input.slice(1);
        }
        return [];
    }
});
/***header scroll detection for bottom shadow***/
$(window).scroll(function(){
  var y = $(window).scrollTop();
  if( y > 0 ){
    $(".subHeader").addClass("header-bottom-shadow");
  } else {
    $(".subHeader").removeClass("header-bottom-shadow");
  }
 });
app.constant('angularMomentConfig', {
    preprocess: 'unix', // optional
    timezone: 'Europe/London' // optional
});

function trackMixpanelAction (actionName){
  var user={
    'email':document.getElementById("userEmail").value,
    'name' :document.getElementById("userDisplayname").value,
    'created_at':document.getElementById("usercreated_at").value,
    'language' :document.getElementById("userLanguage").value,
    'organization' :document.getElementById("userorganization").value,
    'id' :document.getElementById("userId").value
  };
  mixpanel.identify(user.id);
   mixpanel.people.set({
    "$email": user.email,    // only special properties need the $
    "$name":user.name,
    "$created": user.created_at,
    //"$updated_at": user.,
    "$organization": user.organization,
    "$language": user.language

      });
  mixpanel.track(actionName,{"Displayname":user.name,"email":user.email,"organization":user.organization});
  //incrementer(actionName)

    
}
// YH 15/12/15 get browser name
navigator.sayswho= (function(){
    var ua= navigator.userAgent, tem,
    M= ua.match(/(opera|chrome|safari|firefox|msie|trident(?=\/))\/?\s*(\d+)/i) || [];
    if(/trident/i.test(M[1])){
        tem=  /\brv[ :]+(\d+)/g.exec(ua) || [];
        return 'IE '+(tem[1] || '');
    }
    if(M[1]=== 'Chrome'){
        tem= ua.match(/\b(OPR|Edge)\/(\d+)/);
        if(tem!= null) return tem.slice(1).join(' ').replace('OPR', 'Opera');
    }
    M= M[2]? [M[1], M[2]]: [navigator.appName, navigator.appVersion, '-?'];
    if((tem= ua.match(/version\/(\d+)/i))!= null) M.splice(1, 1, tem[1]);
    return M.join(' ');
})();
navigator.isChrome=function(name){
  return name.match(/^chrome/i)
}


//define the incrementing function
incrementer = function(property) {
  value = mixpanel.get_property(property);
  update = {}
  if(value && typeof(value) == 'number') {
    update[property] = value +1;
  }

  else {
    update[property] = 1
  }

  mixpanel.register(update);
};
