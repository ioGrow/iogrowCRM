app.controller('LeadStatusEditCtrl', ['$scope', 'Auth', 'Leadstatus', function ($scope, Auth, Leadstatus) {
    $("ul.page-sidebar-menu li").removeClass("active");
    $("#id_LeadStatus").addClass("active");
    $scope.isSignedIn = false;
    $scope.immediateFailed = false;
    $scope.nbLoads = 0;
    $scope.isLoading = false;
    $scope.isSelectedAll = false;
    $scope.nbrSelected = 0;
    $scope.selectStatus = function (status) {
        status.isSelected = !status.isSelected;
        if (status.isSelected) $scope.nbrSelected++;
        else $scope.nbrSelected--;
    };
    $scope.$watch('isSelectedAll', function (newValue, oldValue) {
        if (newValue) $scope.nbrSelected = $scope.leadstatuses.length;
        else $scope.nbrSelected = 0;
        angular.forEach($scope.leadstatuses, function (value, key) {
            $scope.leadstatuses[key].isSelected = newValue;
        });
    });
    $scope.deleteSelected = function () {
        angular.forEach($scope.leadstatuses, function (value, index) {
            if (value.isSelected) {
                $scope.deletleadstatus(value);
            }
        });
    };

    $scope.inProcess = function (varBool, message) {
        if (varBool) {
            $scope.nbLoads += 1;
            if ($scope.nbLoads == 1) {
                $scope.isLoading = true;
            }
            ;
        } else {
            $scope.nbLoads -= 1;
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
    // What to do after authentication
    $scope.runTheProcess = function () {
        Leadstatus.list($scope, {});
        ga('send', 'pageview', '/admin/lead_status');
    };
    // We need to call this to refresh token when user credentials are invalid
    $scope.refreshToken = function () {
        Auth.refreshToken();
    };
    $scope.addLeadsStatusModal = function () {
        $("#addLeadsStatusModal").modal('show')
    };

    $scope.saveLeadStatus = function (lead) {
        var params = {
            'status': lead.status

        };
        Leadstatus.insert($scope, params);
        $('#addLeadsStatusModal').modal('hide');
        $scope.lead.status = '';

    };
    $scope.editleadstatus = function (leadStatus) {
        $scope.leadstat = $scope.leadstat || {};
        $scope.leadstat.status = leadStatus.status;
        $scope.leadstat.id = leadStatus.id;
        $('#EditLeadStatus').modal('show');


    };
    $scope.updateLeadstatus = function (stat) {

        var params = {
            'id': $scope.leadstat.id,
            'status': stat.status

        };
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