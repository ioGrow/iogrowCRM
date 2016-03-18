/**
 * Created by Ghiboub khalid on 9/29/15.
 */

app.controller('OpportunityEditCtrl', ['$scope', 'Auth', 'User', 'Opportunitystage', '$q',
    function ($scope, Auth, User, Opportunitystage, $q) {
        $("ul.page-sidebar-menu li").removeClass("active");
        $("#id_Opportunity").addClass("active");

        $scope.oppstage = {};
        $scope.oppstageedit = {};
        $scope.nbLoads = 0;
        $scope.isSignedIn = false;
        $scope.immediateFailed = false;
        $scope.isLoading = false;
        $scope.inProcess = function (varBool, message) {
            if (varBool) {
                $scope.nbLoads = $scope.nbLoads + 1;
                if ($scope.nbLoads == 1) {
                    $scope.isLoading = true;
                }
                ;
            } else {
                $scope.nbLoads = $scope.nbLoads - 1;
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

        $scope.onOrderChange = function ($item, $partFrom, $partTo, $indexFrom, $indexTo) {
            angular.forEach($scope.editableStatus, function (value, index) {
                if ($scope.editableStatus[index].stage_number != index + 1) {
                    $scope.editableStatus[index].stage_number = index + 1;
                    var params = {
                        'id': value.id,
                        'name': value.name,
                        'stage_number': index + 1
                    };
                    Opportunitystage.update($scope, params, true);
                }
            });
        };
        $scope.editableStatus = [];
        $scope.notEditableStatus = [];
        $scope.$watch('opportunitystages', function (newValue, oldValue) {
            if (typeof newValue != 'undefined') {
                $scope.editableStatus = [];
                $scope.notEditableStatus = [];
                angular.forEach($scope.opportunitystages, function (value, index) {
                    if ($scope.isEditable(value)) {
                        $scope.editableStatus.push(value);
                    } else {
                        $scope.notEditableStatus.push(value);
                    }
                });
            }
        });
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

        $scope.isEditable = function (status) {
            return status.name.toLowerCase() !== "close lost" && status.name.toLowerCase() !== "close won";
        };
        $scope.createPromise = function (func) {
            var deferred = $q.defer();
            func();
            return deferred.promise;

        };
        $scope.showDeletionModal = function (stage) {
            $scope.selectedStage = stage;
            angular.element("#confirm-deletion").modal('show');
        };
        $scope.deleteOppStage = function (oppStage, index) {

            $scope.createPromise(function () {
                var params = {'entityKey': oppStage.entityKey};
                Opportunitystage.delete($scope, params);
            }).then(function () {
                for (var i = index; i < $scope.isEditable.length; i++) {
                    var status = $scope.isEditable[i];
                    var params = {
                        'id': status.id,
                        'name': status.name,
                        'stage_number': status.stage_number
                    };
                    Opportunitystage.update($scope, params, true);
                }

            });
        };
        $scope.addOppStageModal = function () {
            $("#addOppStagetModal").modal('show')
        };
        $scope.getUser = function (idUser) {
            var params = {
                'id': idUser
            };
            User.get($scope, params);
        };
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
        $scope.listoppstage = function () {
            var params = {'order': 'stage_number'};
            Opportunitystage.list($scope, params);
        };

        $scope.editopportunitystage = function (stage) {
            $scope.oppstageedit.name = stage.name;
            $scope.oppstageedit.stage_number = stage.stage_number;
            $scope.oppstageedit.probability = stage.probability;
            $scope.oppstageedit.id = stage.id;
            $('#EditOppsStage').modal('show');
        };

        $scope.waterfall = function () {


            /* $('.waterfall').hide();
             $('.waterfall').show();*/
            $(window).trigger("resize");
        };
        Auth.init($scope);

    }]);