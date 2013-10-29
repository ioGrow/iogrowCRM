
app.controller('LeadListCtrl', ['$scope','$route','$location','Lead','leads',
  
    function($scope,$route,$location,Lead,leads) {
    	 $("#id_Leads").addClass("current");
    
      $scope.leads = leads.leads ;
      // pagination
      var pagesCount = Math.ceil(leads.count / 5);
    console.log('Number of page'+pagesCount);
      var pagination = {};
      pagination.pages = [];
      pagination.current = $route.current.params.page;
      if ((pagination.current-1)<1){
        pagination.prev = false;
      }
      else{
        pagination.prev =  pagination.current-1
      }
      if ((pagesCount-parseInt(pagination.current))>0){
        pagination.next =  parseInt(pagination.current)+1;
      }
      else{
        pagination.next = false;
      }
      for (var i = 1; i <= pagesCount; i++) {
        var page = {}
        page.id = i;
        page.isCurrent = (i===parseInt($route.current.params.page));
        pagination.pages.push(page);
      }

      $scope.pagination = pagination;
     // console.log(pagination);
      // Todo add next and prev to pagination
//add new lead
 $scope.showModal = function(){
  $('#addLeadModal').modal('show');
 };
 $scope.lead = new Lead();
      $scope.save = function(lead){      
        
        var created_lead = $scope.lead.create();
        created_lead.then(function(lead){
          
          $('#addLeadModal').modal('hide');
          $location.path('/leads/show/'+lead.id);

        });
      };

}]);

app.controller('LeadShowCtrl',['$scope','$location','lead',
  function($scope,$location,lead){
    $scope.lead = lead

    $scope.editLead =function(){
      $('#EditLeadModal').modal('show');
    };

    $scope.put = function(lead){
       var updated_lead = $scope.lead.put(lead);
       updated_lead.then(function(lead){
        $('#EditLeadModal').modal('hide');
      });

    };
$scope.delete = function(lead){
      var delete_lead= $scope.lead.delete(lead);
      $location.path('/leads/p/1');
      delete_lead.then(function(lead){
        $location.path('/leads/p/1');

      });
      }
      
  }]);


