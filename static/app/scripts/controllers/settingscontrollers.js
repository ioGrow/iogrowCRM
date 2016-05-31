app.controller('SettingsShowCtrl', ['$scope', '$route', 'Auth', 'Opportunitystage', 'Casestatus', 'Leadstatus', 'User',
    function ($scope, $route, Auth, Opportunitystage, Casestatus, Leadstatus, User) {
//HKA 11.12.2013 Controller to manage Opportunity stage, Case Status, Company profile, personnel Settings, Lead Status
        $("ul.page-sidebar-menu li").removeClass("active");
        $("#id_Settings").addClass("active");
        var tab = $route.current.params.accountTab;
        $scope.oppstage = {};
        $scope.oppstageedit = {};
        $scope.casestatus = {};
        $scope.casestatusedit = {};
        $scope.nbLoads = 0;
        $scope.leadstat = {};
        $scope.leadstatedit = {};
        $scope.isLoading = false;
        $scope.addSignature = function () {
            var signature = document.getElementById("some-textarea").value;

            var params = {'signature': signature};
            User.signature($scope, params);
        };
        $scope.chartOptions = {
            animate: {
                duration: 0,
                enabled: false
            },
            size: 50,
            barColor: '#58a618',
            scaleColor: false,
            lineWidth: 5,
            lineCap: 'circle'
        };

        switch (tab) {
            case 'Opportunity Stages':
                $scope.selectedTab = 1;
                break;
            case 'Case Status':
                $scope.selectedTab = 2;
                break;
            case 'Lead Status':
                $scope.selectedTab = 3;
                break;
            default:
                $scope.selectedTab = 1;
        }

        $scope.isSignedIn = false;
        $scope.immediateFailed = false;
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
        }
        $scope.apply = function () {

            if ($scope.$root.$$phase != '$apply' && $scope.$root.$$phase != '$digest') {
                $scope.$apply();
            }
            return false;
        }

        $scope.emailSignature = document.getElementById("signature").value;
        if ($scope.emailSignature == "None") {
            $scope.emailSignature = "";
        }
        $('#some-textarea').wysihtml5();
        // What to do after authentication
        $scope.runTheProcess = function () {
            var params = {'order': 'stage_number'};
            Opportunitystage.list($scope, params);
            Casestatus.list($scope, {});
            Leadstatus.list($scope, {});
            User.get($scope, {});
            ga('send', 'pageview', '/admin/settings');
        };
        // We need to call this to refresh token when user credentials are invalid
        $scope.refreshToken = function () {
            Auth.refreshToken();
        };

        //HKA 12.12.2013 Add a new Opportunity Stage
        $scope.addOppStagetModal = function () {
            $("#addOppStagetModal").modal('show')
        };
        //HKA 12.12.2013 Add a new Case Status
        $scope.addCasestatustModal = function () {
            $("#addCasestatustModal").modal('show')
        };
        //HKA 12.12.2013 Add a new Lead Status
        $scope.addLeadstatustModal = function () {
            $("#addLeadstatustModal").modal('show')
        }
        var textArea = $("#some-textarea");
        if (textArea) textArea.val($scope.emailSignature);
//HKA 25.03.2014 update user language
        $scope.updatelanguage = function (user, idUser) {

            var params = {
                'language': user.language
            };

            User.patch($scope, params);


        };
        $scope.getUser = function (idUser) {
            console.log(idUser)
            var params = {
                'id': idUser
            };
            User.get($scope, params);
        }
        $scope.updateGmailSync = function (user, idUser) {
            var params = {
                'gmail_to_lead_sync': parseInt(user.gmail_to_lead_sync)
            };


            User.patch($scope, params);


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
        $scope.editopportunitystage = function (stage) {
            $scope.oppstageedit.name = stage.name;
            $scope.oppstageedit.stage_number = stage.stage_number;
            $scope.oppstageedit.probability = stage.probability;
            $scope.oppstageedit.id = stage.id;
            $('#EditOppsStage').modal('show');
        };


        var time_zone_val = $("#timezone_value");
        var timeZone = $('#timeZone');
        if(time_zone_val && timeZone) timeZone.val(time_zone_val.val());

// HADJI HICHAM -19/05/2015

        $('#timeZone').on('change', function () {

            $scope.isPatchingTimeZone = true;
            var params = {
                "timezone": this.value
            }

            User.patch($scope, params);
        });


        //18.12.2013 HKA  Update Opportunity stage
        $scope.updateOppStage = function (oppstage) {
            console.log(oppstage);
            var params = {
                'id': $scope.oppstageedit.id,
                'name': oppstage.name,
                'probability': oppstage.probability,
                'stage_number': oppstage.stage_number

            };
            Opportunitystage.update($scope, params);
            $('#EditOppsStage').modal('hide');
            $scope.oppstage.name = '';
            $scope.oppstage.probability = '';

        };


//HADJI HICHAM  add immediateFailedture

//HKA 18.12.2013 Delete Opportunity stage
        $scope.deleteoppstage = function (oppstage) {

            var params = {'entityKey': oppstage.entityKey};
            Opportunitystage.delete($scope, params);

        };

        $scope.listoppstage = function () {
            var params = {'order': 'probability'};
            Opportunitystage.list($scope, params);
        };


        //HKA 12.12.2013 Add a new Case Status

        $scope.saveCaseStatus = function (casestatus) {
            var params = {'status': casestatus.status};
            Casestatus.insert($scope, params);
            $('#addCasestatustModal').modal('hide');

            $scope.casestatus.status = '';


        };
        //HKA 19.12.2013 Edit Delete Case status

        //HKA 15.12.2013 Edit case status
        $scope.editcasestatus = function (casestat) {
            $scope.casestatusedit.status = casestat.status;
            $scope.casestatusedit.id = casestat.id;
            $('#EditCaseStatus').modal('show');

        };
        //18.12.2013 HKA  Update case status
        $scope.updateCasestatus = function (casestat) {
            var params = {
                'id': $scope.casestatusedit.id,
                'status': casestat.status

            }
            Casestatus.update($scope, params);
            $('#EditCaseStatus').modal('hide');

        };
        $scope.casestatuslist = function () {
            Casestatus.list($scope, {});
        }
//HKA 18.12.2013 Delete case status
        $scope.deletecasestatus = function (casestate) {

            var params = {'entityKey': leadState.entityKey};
            Casestatus.delete($scope, params);

        };
        //HKA 12.12.2013 Add a new Lead status
        $scope.saveLeadtatus = function (lead) {
            var params = {
                'status': lead.status

            };
            Leadstatus.insert($scope, params);
            $('#addLeadstatustModal').modal('hide');
            $scope.lead.status = '';

        };
        //**************HKA 19.12.2013 Update, Delete Lead status****************************************

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

        $scope.getPosition = function (index) {
            if (index < 4) {

                return index + 1;
            } else {
                return (index % 4) + 1;
            }
        };
        $scope.waterfall = function () {


            /* $('.waterfall').hide();
             $('.waterfall').show();*/
            $(window).trigger("resize");
        };


        // HADJI HICHAM - 08/02/2015
        $scope.createPickerUploader = function () {

            $('#importModal').modal('hide');
            var developerKey = 'AIzaSyDHuaxvm9WSs0nu-FrZhZcmaKzhvLiSczY';
            var docsView = new google.picker.DocsView()
                .setIncludeFolders(true)
                .setSelectFolderEnabled(true);
            var picker = new google.picker.PickerBuilder().
                addView(new google.picker.DocsUploadView().setMimeTypes("image/png,image/jpeg,image/jpg")).

                setCallback($scope.uploaderCallback).
                setOAuthToken(window.authResult.access_token).
                setDeveloperKey(developerKey).
                setAppId(ENV_CONFIG['CLIENT_ID']).
                build();
            picker.setVisible(true);
        };

        $scope.uploaderCallback = function (data) {


            if (data.action == google.picker.Action.PICKED) {
                if (data.docs) {

                    var params = {
                        'fileUrl': data.docs[0].downloadUrl,
                        'fileId': data.docs[0].id
                    }


                    User.upLoadLogo($scope, params);
                }
            }
        };


        // Google+ Authentication
        Auth.init($scope);
    }]);