var app = angular.module('blogEngine',['blogEngine.blogservices', 'ui.bootstrap.datetimepicker','easypiechart','xeditable','ngQuickDate','ui.bootstrap','ui.select2','angularMoment','crmEngine.authservices', 'crmEngine.showservices', 'crmEngine.accountservices','crmEngine.contactservices','crmEngine.topicservices','crmEngine.eventservices', 'crmEngine.leadservices','crmEngine.opportunityservices','crmEngine.caseservices','crmEngine.userservices','crmEngine.groupservices','crmEngine.noteservices','crmEngine.commentservices','crmEngine.settingservices','crmEngine.feedbackservices','crmEngine.companyprofileservices','mapServices','crmEngine.needservices','crmEngine.infonodeservices','crmEngine.edgeservices']);
var public_blog_app = angular.module('publicBlogEngine',['blogEngine.blogservices','ui.bootstrap','ui.select2']);

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
      when('/blog', {
        controller: 'ArticleListCtrl',
        templateUrl:'/views/articles/list'
      }).
      when('/search/:q', {
        controller: 'ArticleSearchCtrl',
        templateUrl:'/views/articles/search'
      }).
      when('/articles/', {
        controller: 'ArticleListCtrl',
        templateUrl:'/views/articles/list'
      }).when('/articles/:articleId', {
        controller: 'ArticleShowCtrl',
        templateUrl:'/views/articles/show'
      }).when('/accounts/new', {
        controller: 'AccountNewCtrl',
        templateUrl:'/views/accounts/new'
      });

}]);
app.config(function(ngQuickDateDefaultsProvider) {
  // Configure with icons from font-awesome
  return ngQuickDateDefaultsProvider.set({
    closeButtonHtml: "<i class='fa fa-times'></i>",
    buttonIconHtml: "<i class='fa fa-clock-o'></i>",
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
})
/***header scroll detection for bottom shadow***/
$(window).scroll(function(){
  var y = $(window).scrollTop();
  if( y > 0 ){
    $(".subHeader").addClass("header-bottom-shadow");
  } else {
    $(".subHeader").removeClass("header-bottom-shadow");
  }
  if(y > 48){
         $(".afterScrollBtn").removeClass("hidden");
         $(".newAccountBtnOnscroll").removeClass( "hidden" );
         $(".newAccountBtnOnscroll").fadeIn( "slow" );
  }else{
       $(".afterScrollBtn").addClass("hidden");
       $(".newAccountBtnOnscroll").hide();
  }
 });
app.constant('angularMomentConfig', {
    preprocess: 'unix', // optional
    timezone: 'Europe/London' // optional
});
