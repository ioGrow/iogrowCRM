/**
 * Created by Ghiboub khalid on 9/29/15.
 */

app.controller('DeleteAllRecordsCtrl', ['$scope', 'Auth', 'User',
    function ($scope, Auth, User) {
        $scope.modalBeforeDelete=function(tab){
            $("#deleteAllRecords").show()
            console.log("aaaaaaaaaaaaaaaaaaaaa");
        };
        $scope.apply = function () {
            if ($scope.$root.$$phase != '$apply' && $scope.$root.$$phase != '$digest') {
                $scope.$apply();
            }
            return false;
        };

        // What to do after authentication
        $scope.runTheProcess = function () {
            User.get($scope, {});
            ga('send', 'pageview', '/admin/redgional_settings');
        };
        // We need to call this to refresh token when user credentials are invalid
        $scope.refreshToken = function () {
            Auth.refreshToken();
        };
        Auth.init($scope);
    }]);

/**
 * Created by arezki on 10/11/15.
 */
