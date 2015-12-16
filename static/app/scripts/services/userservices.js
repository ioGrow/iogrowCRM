var accountservices = angular.module('crmEngine.userservices', []);
// Base sercice (create, delete, get)

accountservices.factory('User', function ($http) {

    var User = function (data) {
        angular.extend(this, data);
    };

    User.getOrganizationLicensesStatus = function ($scope, params) {
        $scope.isLoading = true;
        gapi.client.crmengine.organizations.get(params).execute(function (resp) {
            if (!resp.code) {
                $scope.organization = resp;
                $scope.setBillingDetails();
            } else {
                if (resp.code == 401) {
                    if (resp.message == "Invalid grant") {
                        $scope.refreshToken();
                    }
                }
                ;
            }
            $scope.isLoading = false;
            $scope.apply();
        });
    };
    User.assignLicense = function ($scope, params) {
        $scope.isLoading = true;
        $scope.$apply();
        gapi.client.crmengine.organizations.assign_license(params).execute(function (resp) {
            if (!resp.code) {
                $scope.isLoading = false;
                $scope.isSelected = false;
                $scope.selected_users = [];
                $scope.runTheProcess();

            } else {
                if (resp.code == 401) {
                    if (resp.message == "Invalid grant") {
                        $scope.refreshToken();
                    }
                    $scope.isLoading = false;
                    $scope.$apply();
                }
                ;
            }
            console.log('gapi #end_execute');
        });
    };

    User.unAssignLicense = function ($scope, params) {
        $scope.isLoading = true;
        $scope.$apply();
        gapi.client.crmengine.organizations.unassign_license(params).execute(function (resp) {
            if (!resp.code) {
                $scope.isLoading = false;
                $scope.isSelected = false;
                $scope.selected_users = [];
                $scope.runTheProcess();

            } else {
                if (resp.code == 401) {
                    if (resp.message == "Invalid grant") {
                        $scope.refreshToken();
                    }
                    $scope.isLoading = false;
                    $scope.$apply();
                }
                ;
            }
            console.log('gapi #end_execute');
        });
    };

    User.get = function ($scope, id) {
        $scope.isLoading = true;
        gapi.client.crmengine.user.get(id).execute(function (resp) {
            if (!resp.code) {
                $scope.user = resp;
                console.log(resp);
            } else {
                if (resp.code == 401) {
                    $scope.refreshToken();
                }
                ;
            }
            $scope.isLoading = false;
            $scope.$apply();
        });
    };
    User.upLoadLogo = function ($scope, params) {
        //var acctiveApp = document.getElementById("active_app").value;
        $scope.isLoading = true;
        gapi.client.crmengine.organization.uploadlogo(params).execute(function (resp) {
            if (!resp.code) {
                window.location.reload();
            } else {
                if (resp.code == 401) {
                    $scope.refreshToken();
                    $scope.isLoading = false;
                    $scope.$apply();
                }
                ;
            }
        });

    };

    User.list = function ($scope, params) {
        $scope.inProcess(true);
        //$scope.isLoading=true;
        $scope.apply();
        gapi.client.crmengine.users.list(params).execute(function (resp) {
            if (!resp.code) {
                $scope.users = resp.items;
                $scope.invitees = resp.invitees;
                $scope.inProcess(false);
                // Call the method $apply to make the update on the scope
                $scope.apply();
            } else {
                if (resp.code == 401) {
                    $scope.refreshToken();
                    $scope.inProcess(false);
                    $scope.apply();
                }
                ;
            }
        });
    };


    User.signature = function ($scope, params) {
        $scope.isLoading = true;
        gapi.client.crmengine.users.signature(params).execute(function (resp) {
            $scope.isLoading = false;
            $scope.$apply();
        });

    };


    User.insert = function ($scope, params) {
        trackMixpanelAction('INVITE_USER');
        $scope.inProcess(true);
        gapi.client.crmengine.users.insert(params).execute(function (resp) {
            if (!resp.code) {
                $scope.inProcess(false);
                $scope.reloadUsersList();
            } else {
                $scope.errorMsg = resp.message;
                $scope.inProcess(false);
                $scope.apply();
                $('#addAccountModal').modal('hide');
                $('#errorModalInsert').modal('show');
                if (resp.message == "Invalid grant") {
                    $scope.refreshToken();
                    $scope.inProcess(false);
                    $scope.apply();
                }
                ;
                // TODO : Add custom error handler
            }
        });
    };
    User.completedTour = function ($scope, params) {
        gapi.client.request({
            'root': ROOT,
            'path': '/crmengine/v1/users/' + params['id'],
            'method': 'PATCH',
            'body': params,
            'callback': (function (resp) {

                console.log(resp);
            })
        })
    }

    User.patch = function ($scope, params) {

        $scope.inProcess(true);

        $scope.reloadIt = true;
        $scope.isLoading = true;
        if (params["timezone"] != "") {
            $scope.reloadIt = false;
        }

        gapi.client.crmengine.users.patch(params).execute(function (resp) {
            if (!resp.code) {
                $scope.user = resp;
                $scope.isPatchingTimeZone = false;
                console.log(resp);
                $scope.inProcess(false);
                $scope.apply();
                window.location.reload();
                if ($scope.reloadIt) {
                    window.location.reload();
                }
            }
            else {
                if (resp.code == 401) {
                    $scope.refreshToken();
                    $scope.isLoading = false;
                    $scope.isPatchingTimeZone = false;
                }
                ;
            }
            $scope.isLoading = false;
            $scope.apply();
        });
    }
    User.setAdmin = function ($scope, params) {
        gapi.client.crmengine.users.setadmin(params).execute(function (resp) {
            $scope.reloadUsersList();
        });
    }

// hadji hicham 4/08/2014 -- get user by google user id 
    User.get_user_by_gid = function ($scope, params) {
        gapi.client.crmengine.users.get_user_by_gid(params).execute(function (resp) {
            if (!resp.code) {
                $scope.user_acc = resp;
                $scope.renderCalendar(resp);
                $scope.isLoading = false;
            } else {
                console.log(resp.message);
                $('#addAccountModal').modal('hide');
                $('#errorModal').modal('show');
                if (resp.message == "Invalid grant") {
                    $scope.refreshToken();
                    $scope.isLoading = false;
                    $scope.$apply();
                }
                ;
                // To do add custom error handler


            }
        });
    };


// hadji hicham 10/08/2014 --  get organization info 
    User.get_organization = function ($scope, params) {
        $scope.isLoading = true;
        gapi.client.crmengine.users.get_organization(params).execute(function (resp) {
            $scope.isLoading = false;
            if (!resp.code) {
                $scope.organizationInfo = resp;
                $scope.purchaseLiseneces(resp);
            } else {
                console.log(resp.message);
                $('#addAccountModal').modal('hide');
                $('#errorModal').modal('show');
                if (resp.message == "Invalid grant") {
                    $scope.refreshToken();
                }
                ;
            }
            $scope.$apply();
        });
    };
    User.get_logo = function ($scope) {
        $scope.isLoading = true;
        gapi.client.crmengine.company.get_logo().execute(function (resp) {
            if (!resp.code) {
                $scope.customLogo = resp.fileUrl || resp.custom_logo;
                $scope.logo = {
                    type: (resp.fileUrl) ? 'custom' : 'default'
                };
            } else {
                if (resp.message == "Invalid grant") {
                    $scope.refreshToken();
                };
            }
            $scope.isLoading = false;
            $scope.apply();
        });
    };
    User.switchLogo = function ($scope) {
        $scope.isLoading = true;
        gapi.client.crmengine.company.switch_logo().execute(function (resp) {
            if (!resp.code) {
                //$scope.fileUrl = undefined;
                window.location.reload();
            } else {
                if (resp.message == "Invalid grant") {
                    $scope.refreshToken();
                };
            }
           $scope.isLoading = false;
            $scope.apply();
        });
    };

    User.deleteInvited = function ($scope, params) {
        $scope.inProcess(true);

        gapi.client.request({
            'root': ROOT,
            'path': '/crmengine/v1/invite/delete',
            'method': 'POST',
            'body': params,
            'callback': (function (resp) {
                $scope.inProcess(false);
                $scope.reloadUsersList();


            })


        })


        // gapi.client.crmengine.invite.delete(params).execute(function(resp) {
        //            if(!resp.code){

        //               $scope.reloadUsersList();


        //            }else{
        //            console.log(resp.message);

        //              $('#errorModal').modal('show');
        //            if(resp.message=="Invalid grant"){
        //             $scope.refreshToken();
        //              $scope.isLoading = false;
        //              $scope.$apply();
        //            } }


        // })


    };


    User.deleteUser = function ($scope, params) {
        $scope.inProcess(true);
        gapi.client.crmengine.users.delete(params).execute(function (resp) {
            $scope.reloadUsersList();
        });
        $scope.inProcess(false);
    };


// purchase licenses 
    User.purchase_lisences = function ($scope, params) {

        gapi.client.crmengine.users.purchase_lisences(params).execute(function (resp) {
            if (!resp.code) {
                $scope.paymentOperation = false;
                $scope.$apply();

                console.log(resp);
                if (!resp.transaction_failed) {
                    $scope.paymentConfimration(resp);
                }
                ;

                // here be carefull .
                // $scope.reloadOrganizationInfo();
            }

        });

    };


//HADJI HICHAM - 20/01/0215 - 13:13 - save the details of the company
    User.saveBillingDetails = function ($scope, params) {
        $scope.isLoading = true;
        gapi.client.crmengine.users.saveBillingDetails(params).execute(function (resp) {
            $scope.isLoading = false;
            $scope.$apply();
        });
    };


    return User;
});

accountservices.factory('Permission', function ($http) {

    var Permission = function (data) {
        angular.extend(this, data);
    };


    Permission.insert = function ($scope, params) {
        gapi.client.crmengine.permissions.insertv2(params).execute(function (resp) {
            console.log('in insert resp');
            console.log(resp);
            if (!resp.code) {
                $scope.getColaborators()
            } else {
                console.log(resp.code);
            }
        });
    };
    Permission.delete = function ($scope, params) {
        gapi.client.crmengine.permissions.delete(params).execute(function (resp) {
            console.log('in insert resp');
            console.log(resp);
            if (!resp.code) {
                $scope.getColaborators()
            } else {
                console.log(resp.code);
            }
        });
    };
    Permission.getColaborators = function ($scope, params) {
        gapi.client.crmengine.permissions.get_colaborators(params).execute(function (resp) {
            if (!resp.code) {
                $scope.collaborators_list = resp.items;
                $scope.$apply();

            } else {
            }
        });
    };


    return Permission;
});
