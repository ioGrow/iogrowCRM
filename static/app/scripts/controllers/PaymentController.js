

var appPay = angular.module('crmEnginePayment',[])


appPay.config(function($interpolateProvider){
  $interpolateProvider.startSymbol('<%=');
  $interpolateProvider.endSymbol('%>');
});

appPay.controller('PaymentController', ['$scope',
    function($scope) {



$scope.user_id=document.getElementById('user_id').value;



 $scope.isPaying=false;
 // $scope.amount=999;
 // $scope.plan="Starter";
 // $scope.plan_id="iogrow_STARTER";


 //  stripe     
   var handler = StripeCheckout.configure({
    key: 'pk_test_4Xa35zhZDqvXz1OzGRWaW4mX',
    image: '/static/img/iogrow_logo-old.png',
    token: function(token) {
      // Use the token to create the charge with a server-side script.
      // You can access the token ID with `token.id`
      //window.location.href = "/payment/"+token.id+'/'+token.email

        $scope.isPaying=true;
        $scope.$apply();
  

       var params={'token_id':token.id,
                'token_email':token.email,
                'user_id':$scope.user_id
              }
            

   gapi.client.crmengine.billing.purchase_licence(params).execute(function(resp) {
            if(!resp.code){
              console.log(resp);
                // here be carefull .

                
                window.location.href="/";
                  
                $scope.isPaying=false;
               $scope.$apply();
            }else{
              console.log(resp.message)
              console.log("Ooops");
            }

            });
    }
  });

  document.getElementById('customButton').addEventListener('click', function(e) {
    // Open Checkout with further options

     var email_user=document.getElementById('user_email').value;
    handler.open({
      name: "1 user/month",
      email:email_user,
      description:'',
      amount: 1000
    });
    e.preventDefault();
  });










// // choose plan 
// $(document).ready(function(){


//   $("#pricingIndex").text("0")
//   $("#price").text(9.99+ "$");
//   $("#note").text("Paid Monthly")

// $("#nextPricing").click(function(){

//  var pricings= [{"price":9.99,"note":"Paid monthly","plan":"Starter","plan_id":"iogrow_STARTER"},
//                 {"price":49.99,"note":"Paid per 6 months","plan":"Awesome","plan_id":"iogrow_AWESOME"},
//                 {"price":99.99,"note":"Paid annually","plan":"Super Duper","plan_id":"iogrow_SUPER DUPER"}]

// var current = parseInt($("#pricingIndex").text())
// current++;
// if (current > 2) current = 0;
// $("#price").text(pricings[current].price+ "$");
// $("#note").text(pricings[current].note)
// $("#plan").text(pricings[current].plan)
// $("#pricingIndex").text(current)

//    $scope.amount=pricings[current].price * 100;
//    $scope.plan=pricings[current].plan;
//    $scope.plan_id=pricings[current].plan_id ;
//    $scope.$apply();
// })

// });









     // What to do after authentication
     $scope.runTheProcess = function(){
       
     };



     
     $scope.showModal = function(){
           console.log("test");
        $('#BuyModal').modal('show');

      };
         
     $scope.hideModal = function(){
        
       console.log("how");
      };
$scope.tweet=function(){
console.log("iiiiiiiiiiiiiiiiiie");
   var params={
                'user_id':$scope.user_id
              }
            
    gapi.client.crmengine.billing.pay_with_tweet(params).execute(function(resp) {
            if(!resp.code){
              console.log(resp);
                // here be carefull .

                
                window.location.href="/";
                  
                $scope.isPaying=false;
               $scope.$apply();
            }else{
              console.log(resp.message)
              console.log("Ooops");
            }

            });
};
     
     
   

    
}]);

