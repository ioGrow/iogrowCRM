function notFoundHandle(resp, $scope) {
    if (resp.code === 401) {
        if (resp.message === "Invalid grant") {
            $scope.refreshToken();
        }
    }
    ;
}
angular.module('crmEngine.billingservices', []).factory('Billing',
    function () {
        var Billing = function (data) {
            angular.extend(this, data);
        };
        Billing.getSubscription = function ($scope) {
            $scope.isLoading = true;
            gapi.client.request({
                'root': ROOT,
                'path': '/crmengine/v1/subscription/get',
                'method': 'GET',
                'body': {},
                'callback': (function (resp) {
                    if (!resp.code) {
                        $scope.subscription = resp;
                    } else {
                        notFoundHandle(resp, $scope);
                    }
                    $scope.isLoading = false;
                    $scope.apply();
                })
            });

/*            gapi.client.crmengine.subscription.get({}).execute(
                function (resp) {
                    if (!resp.code) {
                        $scope.subscription = resp;
                    } else {
                        notFoundHandle(resp, $scope);
                    }
                    $scope.isLoading = false;
                    $scope.apply();
                })*/;
        };
        
        Billing.disableAutoRenew = function ($scope) {
            $scope.isLoading = true;
            $scope.apply();
            gapi.client.crmengine.subscription.delete_from_stripe({}).execute(
                function (resp) {
                    if (!resp.code) {
                        window.location.reload();
                    } else {
                        notFoundHandle(resp, $scope);
                    }
                    $scope.isLoading = false;
                    $scope.apply();
                })
        };
        return Billing;
    });