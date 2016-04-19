/**
 * Created by Ghiboub khalid on 9/29/15.
 */

app.controller('DeleteAllRecordsCtrl', ['$scope', 'Auth', 'User','Lead','Account','Contact','Opportunity','Case','Task',
    function ($scope, Auth, User, Lead, Account, Contact, Opportunity, Case, Task) {
        $("ul.page-sidebar-menu li").removeClass("active");
        $("#id_DeleteAllRecords").addClass("active");
        $scope.isLoading=false;
        $scope.kindToDelete=null;
        $scope.modalBeforeDelete=function(kind){
            $("#deleteAllRecords").modal('show');
            $scope.kindToDelete=kind;
        };
        $scope.delete=function(){
            switch ($scope.kindToDelete) {
                    case 'lead' :
                      Lead.deleteAll($scope);
                        break;
                    case 'account' :
                       Account.deleteAll($scope);
                        break;
                    case 'contact' :
                       Contact.deleteAll($scope);
                        break;
                    case 'opportunity' :
                        Opportunity.deleteAll($scope);
                        break;
                    case 'case' :
                       Case.deleteAll($scope);
                        break;
                    case 'task' :
                        Task.deleteAll($scope);
                        break;
                }
        };
        $scope.allLeadsDeleted=function(){
            $("#deleteAllRecords").modal('hide');
            $("#deleteConfimationModal").modal('show');
        };
        $scope.allAccountsDeleted=function(){
            $("#deleteAllRecords").modal('hide');
            $("#deleteConfimationModal").modal('show');
        };
        $scope.allContactsDeleted=function(){
            $("#deleteAllRecords").modal('hide');
            $("#deleteConfimationModal").modal('show');
        };
        $scope.allOpportunitiesDeleted=function(){
            $("#deleteAllRecords").modal('hide');
            $("#deleteConfimationModal").modal('show');
        };
        $scope.allCasesDeleted=function(){
            $("#deleteAllRecords").modal('hide');
            $("#deleteConfimationModal").modal('show');
        };
        $scope.allTasksDeleted=function(){
            $("#deleteAllRecords").modal('hide');
            $("#deleteConfimationModal").modal('show');
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