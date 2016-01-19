var livesearchservices = angular.module('ioGrowLive.livesearchservices',[]);
livesearchservices.factory('Search', function($http) {
  
  var Search = function(data) {
    angular.extend(this, data);
  }
  Search.getUrl = function(type,id){

  
    var base_url = undefined;
    switch (type)
        {
        case 'Company':
          base_url = '/live/companies/';
          break;
        case 'Contact':
          base_url = '/#/contacts/show/';
          break;
        case 'Lead':
          base_url = '/#/leads/show/';
          break;
        case 'Opportunity':
          base_url = '/#/opportunities/show/';
          break;
        case 'Case':
          base_url = '/#/cases/show/';
          break;
        case 'Show':
          base_url = '/live/shows/';
          break;
        case 'Product_Video':
          base_url = '/live/shows/';
          break;
        case 'Customer_Story':
          base_url = '/live/shows/';
          break;

        }

    return base_url+id+'/';
  };

  Search.list = function($scope,params){
      $scope.isLoading = true;
      gapi.client.iogrowlive.search(params).execute(function(resp) {
              if(!resp.code){
                 $scope.searchResults = [];
                 for (var i=0,len=resp.items.length; i<len; i++)
                  { 
                        var id = resp.items[i].id;
                        var type = resp.items[i].type;
                        var title = resp.items[i].title;
                        var url = Search.getUrl(type,id);
                        var result = {};
                        result.id = id;
                        result.type = type;
                        result.title = title;
                        result.url = url;
                        $scope.searchResults.push(result);

                  }
                                   
                 //$scope.searchResults = resp.items;
                 if ($scope.currentPage>1){
                      $scope.pagination.prev = true;
                   }else{
                       $scope.pagination.prev = false;
                   }
                 if (resp.nextPageToken){
                   var nextPage = $scope.currentPage + 1;
                   // Store the nextPageToken
                   $scope.pages[nextPage] = resp.nextPageToken;
                   $scope.pagination.next = true;
                   
                 }else{
                  $scope.pagination.next = false;
                 }
                 // Loaded succefully
                 $scope.isLoading = false;
                 // Call the method $apply to make the update on the scope
                 $scope.$apply();
              }else {
                 alert("Error, response is: " + angular.toJson(resp));
              }
      });
  };

return Search;
});