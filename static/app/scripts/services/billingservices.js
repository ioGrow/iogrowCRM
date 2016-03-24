function notFoundHandle(resp, $scope) {
    if (resp.code === 401) {
        if (resp.message === "Invalid grant") {
            $scope.refreshToken();
        }
    }
}
angular.module('crmEngine.billingservices', []).factory('Billing', function () {
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
                    $scope.subscription.is_auto_renew =parseInt(resp.is_auto_renew);
                } else {
                    notFoundHandle(resp, $scope);
                }
                $scope.isLoading = false;
                $scope.apply();
            })
        });
    };
    Billing.getOrganizationSubscription = function ($scope) {
        $scope.isLoading = true;
        gapi.client.request({
            'root': ROOT,
            'path': '/crmengine/v1/subscription/organization_get',
            'method': 'GET',
            'body': {},
            'callback': (function (resp) {
                if (!resp.code) {
                    $scope.org_subscription = resp;
                    $scope.org_subscription.is_auto_renew =parseInt(resp.is_auto_renew);
                } else {
                    notFoundHandle(resp, $scope);
                }
                $scope.isLoading = false;
                $scope.apply();
            })
        });
    };
    Billing.disableAutoRenew = function ($scope) {
        $scope.isLoading = true;
        $scope.apply();
        gapi.client.crmengine.subscription.disable_auto_renew({}).execute(
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
    Billing.enableAutoRenew = function ($scope) {
        $scope.isLoading = true;
        $scope.apply();
        gapi.client.crmengine.subscription.enable_auto_renew({}).execute(
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
    Billing.byNewLicences = function ($scope, params) {
        $scope.isLoading = true;
        $scope.apply();
        gapi.client.crmengine.subscription.by_new_licences(params).execute(
            function (resp) {
                if (!resp.code) {
                    window.location.reload();
                } else {
                    notFoundHandle(resp, $scope);
                }
                $scope.isLoading = false;
                $scope.apply();
            });
    };
    return Billing;
});