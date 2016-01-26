/**
 * Created by Ghiboub khalid on 9/29/15.
 */

app.controller('CompanyEditCtrl', ['$scope', 'Auth', 'User', 'Map',
    function ($scope, Auth, User, Map) {
        console.log("in the right controller");
        $("ul.page-sidebar-menu li").removeClass("active");
        $("#id_Company").addClass("active");
        $scope.runTheProcess = function () {
        };
        // We need to call this to refresh token when user credentials are invalid
        $scope.refreshToken = function () {
            Auth.refreshToken();
        };
        $scope.isUpdatingLogo = true;
        // Google+ Authentication
        Auth.init($scope);
    }]);