app.controller('EmailSignatureEditCtrl', ['$scope', '$route', 'Auth', 'User', function ($scope, $route, Auth, User) {
    $("ul.page-sidebar-menu li").removeClass("active");
    $("#id_EmailSignature").addClass("active");
    $scope.isSignedIn = false;
    $scope.immediateFailed = false;
    $scope.isLoading = false;
    var textArea = angular.element("#signature_textarea");
    var val = angular.element('#signature').val();
    textArea.val(val == 'None' ? '' : val);
    textArea.wysihtml5();
    $scope.emailSignature = textArea.val();
    $scope.addSignature = function () {
        var signature =  textArea.val();
        var params = {'signature': signature};
        User.signature($scope, params);
    };
    $scope.getUser = function (idUser) {
        var params = {
            'id': idUser
        };
        User.get($scope, params);
    };
    $scope.refreshToken = function () {
        Auth.refreshToken();
    };
    $scope.apply = function () {
        if ($scope.$root.$$phase != '$apply' && $scope.$root.$$phase != '$digest') {
            $scope.$apply();
        }
        return false;
    };
    $scope.runTheProcess = function () {
        User.get($scope, {});
        ga('send', 'pageview', '/admin/email_signature');
    };
    Auth.init($scope);
}]);