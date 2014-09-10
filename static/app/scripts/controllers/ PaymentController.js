
app.controller('PaymentController', ['$scope',
    function($scope) {
     
     console.log("hello every body i'm your one ");
     $scope.mezian="hadjaj";

     // What to do after authentication
     $scope.runTheProcess = function(){
       
     };



     
     $scope.showModal = function(){
        console.log('button clicked');
        $('#addAccountModal').modal('show');

      };
      

     
     
   

    
}]);

