var appLive = angular.module('ioGrowLive',['ui.bootstrap','ioGrowLive.livesearchservices']);
appLive.config(function($interpolateProvider){
  $interpolateProvider.startSymbol('<%=');
  $interpolateProvider.endSymbol('%>');
});
