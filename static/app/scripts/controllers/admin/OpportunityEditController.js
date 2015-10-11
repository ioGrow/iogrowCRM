/**
 * Created by Ghiboub khalid on 9/29/15.
 */

app.controller('OpportunityEditCtrl', ['$scope', 'Auth', 'User', 'Opportunitystage',
    function ($scope, Auth, User, Opportunitystage) {
        $("ul.page-sidebar-menu li").removeClass("active");
        $("#id_Opportunity").addClass("active");
        $scope.isSignedIn = false;
        $scope.immediateFailed = false;
        $scope.oppstage = {};
        $scope.oppstageedit = {};
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
            var params = {'order': 'stage_number'};
            Opportunitystage.list($scope, params);
            User.get($scope, {});
            ga('send', 'pageview', '/admin/settings');
        };
        // We need to call this to refresh token when user credentials are invalid
        $scope.refreshToken = function () {
            Auth.refreshToken();
        };
        //HKA 12.12.2013 Add a new Opportunity Stage
        $scope.addOppStageModal = function () {
            $("#addOppStagetModal").modal('show')
        };
        $scope.getUser = function (idUser) {
            console.log(idUser)
            var params = {
                'id': idUser
            };
            User.get($scope, params);
        }
        //HKA 12.12.2013 Add a new Opportunity Stage
        $scope.saveOppStage = function (oppstage) {
            var params = {
                'name': oppstage.name,
                'probability': oppstage.probability,
                'stage_number': oppstage.stage_number

            };
            Opportunitystage.insert($scope, params);
            $('#addOppStagetModal').modal('hide');
            $scope.oppstage.name = '';
            $scope.oppstage.probability = '';
            //window.location.replace('#/admin/settings');

        };
        //HKA 15.12.2013 Edit opportunity stage
        $scope.editOppStage = function (stage) {
            $scope.oppstageedit.name = stage.name;
            $scope.oppstageedit.stage_number = stage.stage_number;
            $scope.oppstageedit.probability = stage.probability;
            $scope.oppstageedit.id = stage.id;
            $('#EditOppsStage').modal('show');
        };

        //18.12.2013 HKA  Update Opportunity stage
        $scope.updateOppStage = function (oppStage) {
            var params = {
                'id': $scope.oppstageedit.id,
                'name': oppStage.name,
                'probability': oppStage.probability,
                'stage_number': oppStage.stage_number

            };
            Opportunitystage.update($scope, params);
            $('#EditOppsStage').modal('hide');
            $scope.oppstage.name = '';
            $scope.oppstage.probability = '';

        };
        $scope.deleteOppStage = function (oppStage) {

            var params = {'entityKey': oppStage.entityKey};
            Opportunitystage.delete($scope, params);

        };

        $scope.listOppStage = function () {
            var params = {'order': 'probability'};
            Opportunitystage.list($scope, params);
        };
        $scope.waterfall = function () {


            /* $('.waterfall').hide();
             $('.waterfall').show();*/
            $(window).trigger("resize");
        };
        Auth.init($scope);

    }]);