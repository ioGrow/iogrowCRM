/**
 * Created by Ghiboub khalid on 9/29/15.
 */

app.controller('CaseStatusEditCtrl', ['$scope', 'Auth', 'Casestatus', function ($scope, Auth, Casestatus) {
    $("ul.page-sidebar-menu li").removeClass("active");
    $("#id_CaseStatus").addClass("active");
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
    }

    $scope.apply = function () {

        if ($scope.$root.$$phase != '$apply' && $scope.$root.$$phase != '$digest') {
            $scope.$apply();
        }
        return false;
    };
    // What to do after authentication
    $scope.runTheProcess = function () {
        Casestatus.list($scope, {});
        ga('send', 'pageview', '/admin/case_status');
    };
    // We need to call this to refresh token when user credentials are invalid
    $scope.refreshToken = function () {
        Auth.refreshToken();
    };
    $scope.saveCaseStatus = function (casestatus) {
        var params = {'status': casestatus.status};
        Casestatus.insert($scope, params);
        $('#addCasestatustModal').modal('hide');

        $scope.casestatus.status = '';
    };

    //HKA 15.12.2013 Edit case status
    $scope.editcasestatus = function (casestat) {
        console.log('I am on edit case status');
        $scope.casestatusedit.status = casestat.status;
        $scope.casestatusedit.id = casestat.id;
        $('#EditCaseStatus').modal('show');

    };
    //18.12.2013 HKA  Update case status
    $scope.updateCasestatus = function (casestat) {
        console.log('I am on update  case status');
        var params = {
            'id': $scope.casestatusedit.id,
            'status': casestat.status

        };
        Casestatus.update($scope, params);
        $('#EditCaseStatus').modal('hide');

    };
    $scope.casestatuslist = function () {
        Casestatus.list($scope, {});
    };
    $scope.deletecasestatus = function (casestate) {

        var params = {'entityKey': casestate.entityKey};
        Casestatus.delete($scope, params);

    };
    Auth.init($scope);

}]);