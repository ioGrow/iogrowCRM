var settingservices = angular.module('crmEngine.settingservices', []);
settingservices.factory('Conf', function ($location) {
    function getRootUrl() {
        var rootUrl = $location.protocol() + '://' + $location.host();
        if ($location.port())
            rootUrl += ':' + $location.port();
        return rootUrl;
    };
    return {
        'clientId': '935370948155-a4ib9t8oijcekj8ck6dtdcidnfof4u8q.apps.googleusercontent.com',
        'apiBase': '/api/',
        'rootUrl': getRootUrl(),
        'scopes': 'https://www.googleapis.com/auth/plus.login https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/drive https://www.googleapis.com/auth/calendar',
        'requestvisibleactions': 'http://schemas.google.com/AddActivity ' +
        'http://schemas.google.com/ReviewActivity',
        'cookiepolicy': 'single_host_origin',
        // Urls
        'accounts': '/#/accounts/show/',
        'contacts': '#/contacts/show/',
        'leads': '/#/leads/show/',
        'opportunities': '/#/opportunities/show/',
        'cases': '/#/cases/show/',
        'shows': '/#/shows/show/'
    };
});
settingservices.factory('Opportunitystage', function ($http) {
    var Opportunitystage = function (data) {
        angular.extend(this, data);
    }
    Opportunitystage.list = function ($scope, params) {
        $scope.isLoading = true;
        $scope.inProcess(true);
        gapi.client.crmengine.opportunitystages.list(params).execute(function (resp) {
            if (!resp.code) {
                $scope.opportunitystages = resp.items;
                $scope.insideStages = [];
                 angular.forEach($scope.opportunitystages, function (stage) {
                 console.log("insideStage...s");
                     if (stage.probability != 0 && stage.probability != 100) {
                        $scope.insideStages.push(stage);
                     } else {
                         if (stage.probability == 0) {
                                 $scope.lostStage = stage;
                         }
                         if (stage.probability == 100) {
                              $scope.wonStage = stage;
                         }
                     }

                 });
                 $scope.initialStage = $scope.insideStages[0];
                 $scope.initialStageValue = $scope.initialStage.name + ' - ( ' + $scope.initialStage.probability + '% )';
                $scope.inProcess(false);
                $scope.apply();

            }
            else {
                if (resp.code == 401) {
                    $scope.refreshToken();
                    $scope.inProcess(false);
                    $scope.apply();
                }
                ;
            };
            $scope.isLoading = false;
        })
    };

    Opportunitystage.get = function ($scope, id) {
        $scope.isLoading = true;
        gapi.client.crmengine.opportunitystages.get(params).execute(function (resp) {

            if (!resp.code) {
                $scope.oppstage = resp;
            }
            $scope.isLoading = false;

        })
    };

    Opportunitystage.update = function ($scope, params, noRefresh) {
        noRefresh = noRefresh || false;
        $scope.inProcess(true);
        $scope.isLoading = true;
        gapi.client.crmengine.opportunitystages.patch(params).execute(function (resp) {
                if (!resp.code) {
                    if(!noRefresh) $scope.listoppstage();
                    $scope.inProcess(false);
                    $scope.apply();
                }

                else {
                    alert("Error, response is: " + angular.toJson(resp));

                }
                $scope.isLoading = false;
            }
        )

    };


    Opportunitystage.insert = function ($scope, params) {
        $scope.inProcess(true);
        gapi.client.crmengine.opportunitystages.insert(params).execute(function (resp) {
                $scope.listoppstage();
                $scope.inProcess(false);
                $scope.apply();


            }
        )
    };
    Opportunitystage.delete = function ($scope, params) {
        $scope.inProcess(true);
        gapi.client.crmengine.opportunitystages.delete(params).execute(function (resp) {
            if (!resp.code) {


                $scope.listoppstage();
                // Loaded succefully
                $scope.inProcess(false);
                // Call the method $apply to make the update on the scope
                $scope.apply();
            } else {
                $scope.inProcess(false);
                // Call the method $apply to make the update on the scope
                $scope.apply();
            }
        });
    };
    return Opportunitystage;
});
//HKA 14.12.2013 Case status Services
settingservices.factory('Casestatus', function ($http) {
    var Casestatus = function (data) {
        angular.extend(this, data);
    };
    //HKA 14.12.2013 Case status Insert
    Casestatus.insert = function ($scope, params) {
        $scope.inProcess(true);
        gapi.client.crmengine.casestatuses.insert(params).execute(function (resp) {
                $scope.casestatuslist();
                $scope.inProcess(false);
                $scope.apply();

            }
        )
    };
    //HKA 14.12.2013 Case status list
    Casestatus.list = function ($scope, params) {
        $scope.inProcess(true);
        gapi.client.crmengine.casestatuses.list(params).execute(function (resp) {
                if (!resp.code) {
                    $scope.casesatuses = resp.items;
                    $scope.inProcess(false);
                    $scope.apply();

                }

                else {
                    if (resp.code == 401) {
                        $scope.refreshToken();
                        $scope.inProcess(false);
                        $scope.apply();
                    }
                    ;
                }

            }
        )
    };
    Casestatus.update = function ($scope, params) {
        $scope.inProcess(true);
        gapi.client.crmengine.casestatuses.patch(params).execute(function (resp) {
            if (!resp.code) {
                $scope.casestatuslist();
                $scope.inProcess(false);
                $scope.apply();


            }
            else {
                alert("Error, response is: " + angular.toJson(resp));

            }

        })
    };

    Casestatus.delete = function ($scope, id) {
        $scope.inProcess(true);
        gapi.client.crmengine.casestatuses.delete(id).execute(function (resp) {


            $scope.casestatuslist();
            $scope.inProcess(false);
            $scope.apply();
        })
    };


    return Casestatus;
});

//HKA 14.12.2013 Case status Services
settingservices.factory('Leadstatus', function ($http) {
    var Leadstatus = function (data) {
        angular.extend(this, data);
    };
    //HKA 14.12.2013 Case status Insert
    Leadstatus.insert = function ($scope, params) {
        $scope.inProcess(true);
        gapi.client.crmengine.leadstatuses.insert(params).execute(function (resp) {
                if (!resp.code) {
                    $scope.listleadstatus();
                    $scope.inProcess(false);
                    $scope.apply();

                }

                else {
                    alert("Error, response is:" + angular.toJson(resp));
                }

            }
        )
    };
    //HKA 14.12.2013 Case status list
    Leadstatus.list = function ($scope, params) {
        $scope.inProcess(true);
        gapi.client.crmengine.leadstatuses.list(params).execute(function (resp) {
                if (!resp.code) {
                    $scope.leadstatuses = resp.items;
                    $scope.inProcess(false);
                    $scope.apply();

                }

                else {
                    if (resp.code == 401) {
                        $scope.refreshToken();
                        $scope.inProcess(false);
                        $scope.apply();
                    }
                    ;
                }

            }
        )
    };

    Leadstatus.update = function ($scope, params) {
        $scope.inProcess(true);
        gapi.client.crmengine.leadstatuses.patch(params).execute(function (resp) {
                if (!resp.code) {
                    $scope.listleadstatus();
                    $scope.inProcess(false);
                    $scope.apply();
                }
                else {
                    alert("Error, response is" + angular.toJson(resp));
                }


            }
        )
    };


    Leadstatus.delete = function ($scope, id) {
        $scope.inProcess(true);
        gapi.client.crmengine.leadstatuses.delete(id).execute(function (resp) {
            $scope.listleadstatus();
            $scope.inProcess(false);
            $scope.apply();
        })
    };


    return Leadstatus;
});

//HKA 14.12.2013 Custom field
settingservices.factory('Customfield', function ($http) {
    var Customfield = function (data) {
        angular.extend(this, data);
    };
    //HKA 14.12.2013 Case status Insert
    Customfield.insert = function ($scope, params) {
        $scope.inProcess(true);
        $scope.apply();
        gapi.client.crmengine.customfield.insert(params).execute(function (resp) {
                if (!resp.code) {
                    $scope.customfieldInserted(resp);
                    $scope.inProcess(false);
                    $scope.apply();

                }

                else {
                    alert("Error, response is:" + angular.toJson(resp));
                }

            }
        )
    };
    Customfield.list = function ($scope, params) {
        console.log("in customfield get list");
        $scope.inProcess(true);
        $scope.apply();
        gapi.client.crmengine.customfield.list(params).execute(function (resp) {
                if (!resp.code) {
                    console.log('resp customfield');
                    console.log(resp);
                    if (resp.items) {
                         $scope.listResponse(resp.items,params.related_object);
                    }
                    $scope.inProcess(false);
                    $scope.apply();
                }

                else {
                    alert("Error, response is:" + angular.toJson(resp));
                }

            }
        )
    };
    Customfield.delete = function ($scope, params) {
        $scope.inProcess(true);
        $scope.apply();
        gapi.client.crmengine.customfield.delete(params).execute(function (resp) {
                if (!resp.code) {
                    $scope.customFieldDeleted();
                    $scope.inProcess(false);
                    $scope.apply();
                }

                else {
                    alert("Error, response is:" + angular.toJson(resp));
                }

            }
        )
    };
    Customfield.patch = function ($scope, params) {
        $scope.inProcess(true);
        $scope.apply();
        gapi.client.crmengine.customfield.patch(params).execute(function (resp) {
                if (!resp.code) {
                    $scope.customFieldUpdated(params);
                    $scope.inProcess(false);
                    $scope.apply();
                }

                else {
                    alert("Error, response is:" + angular.toJson(resp));
                }

            }
        )
    };
    return Customfield;
});
