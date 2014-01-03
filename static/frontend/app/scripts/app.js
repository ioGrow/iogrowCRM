var app = angular.module('ioGrowLive',['ui.bootstrap']);
app.config(function($interpolateProvider){
  $interpolateProvider.startSymbol('<%=');
  $interpolateProvider.endSymbol('%>');
});
