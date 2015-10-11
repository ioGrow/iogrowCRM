/**
 * Created by Ghiboub khalid on 9/29/15.
 */

app.controller('LeadStatusEditCtrl', ['$scope', 'Auth', 'Leadstatus', function ($scope, Auth, Leadstatus) {
    $("ul.page-sidebar-menu li").removeClass("active");
    $("#id_LeadStatus").addClass("active");
    $scope.isSignedIn = false;
    $scope.immediateFailed = false;
    $scope.nbLoads = 0;
    $scope.isLoading = false;


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

    $scope.selectedLeadStatus = [];
    $scope.isSelectedAll = false;
    $scope.$watch('isSelectedAll', function (newValue, oldValue) {
        angular.forEach($scope.leadstatuses, function (value, key) {
            $scope.leadstatuses[key].isSelected = newValue;
        });
    });
    $scope.apply = function () {
        if ($scope.$root.$$phase != '$apply' && $scope.$root.$$phase != '$digest') {
            $scope.$apply();
        }
        return false;
    };
    // What to do after authentication
    $scope.runTheProcess = function () {
        Leadstatus.list($scope, {});
        ga('send', 'pageview', '/admin/lead_status');
    };
    // We need to call this to refresh token when user credentials are invalid
    $scope.refreshToken = function () {
        Auth.refreshToken();
    };
    $scope.saveLeadtatus = function (lead) {
        var params = {
            'status': lead.status

        };
        Leadstatus.insert($scope, params);
        $('#addLeadstatustModal').modal('hide');
        $scope.lead.status = '';

    };
    $scope.editleadstatus = function (leadstatus) {

        $scope.leadstat.status = leadstatus.status;

        $scope.leadstat.id = leadstatus.id;
        $('#EditLeadStatus').modal('show');


    };
    $scope.updateLeadstatus = function (stat) {

        var params = {
            'id': $scope.leadstat.id,
            'status': stat.status

        }
        Leadstatus.update($scope, params)
        $('#EditLeadStatus').modal('hide');

    };
    //HKA 22.12.2013 Delete Lead status
    $scope.deletleadstatus = function (leadstat) {
        var params = {'entityKey': leadstat.entityKey};
        Leadstatus.delete($scope, params);

    };
    $scope.listleadstatus = function () {
        Leadstatus.list($scope, {});
    };

    Auth.init($scope);

}]);