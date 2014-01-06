var appLive = angular.module('ioGrowLive',['ui.bootstrap']);
appLive.config(function($interpolateProvider){
  $interpolateProvider.startSymbol('<%=');
  $interpolateProvider.endSymbol('%>');
});
