app.controller('BillingEditCtrl', ['$scope', 'Auth', 'Billing', function ($scope, Auth, Billing) {
    $("ul.page-sidebar-menu li").removeClass("active");
    $("#id_Billing").addClass("active");
    $scope.isSignedIn = false;
    $scope.immediateFailed = false;
    $scope.nbLoads = 0;
    $scope.isLoading = false;
    $scope.nbrSelected = 0;
    $scope.inProcess = function (varBool, message) {
        if (varBool) {
            if (message) {
                console.log("starts of :" + message);
            }
            ;
            $scope.nbLoads = $scope.nbLoads + 1;
            if ($scope.nbLoads == 1) {
                $scope.isLoading = true;
            }
            ;
        } else {
            if (message) {
                console.log("ends of :" + message);
            }
            ;
            $scope.nbLoads = $scope.nbLoads - 1;
            if ($scope.nbLoads == 0) {
                $scope.isLoading = false;
            }
            ;
        }
        ;
    };
    $scope.apply = function () {
        if ($scope.$root.$$phase != '$apply' && $scope.$root.$$phase != '$digest') {
            $scope.$apply();
        }
        return false;
    };
    $scope.disableAutoRenew = function () {
        Billing.disableAutoRenew($scope);
        $('#disable_auto_renew').modal('hide');
    };
    $scope.changeAutoRenew = function (stripe_subscription_id) {
        if (stripe_subscription_id){
            $('#disable_auto_renew').modal('show');
        }else{
            Billing.enableAutoRenew($scope);
        }
    };
    $scope.byNewLicences = function (quantity) {
        Billing.byNewLicences($scope, {'quantity': quantity});
    };
    $scope.editCardInfo = function () {
        $('#edit_card_info').modal('show');
    };
    // What to do after authentication
    $scope.runTheProcess = function () {
        Billing.getSubscription($scope);
    };
    // We need to call this to refresh token when user credentials are invalid
    $scope.refreshToken = function () {
        Auth.refreshToken();
    };
    Auth.init($scope);
}]);