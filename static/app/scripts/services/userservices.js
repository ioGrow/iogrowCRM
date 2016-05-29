function getSelectableUser(users){
    var selectableUsers = [];
    for (var i = 0; i < users.length; i++) {
        if (!users[i].is_super_admin)
            selectableUsers.push(users[i]);
    }
    return selectableUsers;
}

var accountservices = angular.module('crmEngine.userservices', []);
accountservices.factory('User', function ($http) {
    var User = function (data) {
        angular.extend(this, data);
    };
    User.getOrganizationLicensesStatus = function ($scope, params) {
        $scope.isLoading = true;
        gapi.client.crmengine.organization.licenses_status(params).execute(function (resp) {
            if (!resp.code) {
                $scope.licencesStatus = resp;
            } else {
                if (resp.code == 401) {
                    if (resp.message == "Invalid grant") {
                        $scope.refreshToken();
                    }
                }
            }
            $scope.isLoading = false;
            $scope.apply();
        });
    };
    User.assignLicense = function ($scope, params) {
        $scope.isLoading = true;
        gapi.client.crmengine.organizations.assign_license(params   ).execute(function (resp) {
            if (!resp.code) {
                $scope.isLoading = false;
                $scope.isSelected = false;
                $scope.selectedUsers = [];
            } else {
                if (resp.code == 401) {
                    if (resp.message == "Invalid grant") {
                        $scope.refreshToken();
                    }
                }
            }
            $scope.isLoading = false;
        });
    };
    User.unAssignLicense = function ($scope, params) {
        $scope.isLoading = true;
        $scope.$apply();
        gapi.client.crmengine.organizations.unassign_license(params).execute(function (resp) {
            if (!resp.code) {
                $scope.isLoading = false;
                $scope.isSelected = false;
                $scope.selectedUsers = [];
                $scope.runTheProcess();
            } else {
                if (resp.code == 401) {
                    if (resp.message == "Invalid grant") {
                        $scope.refreshToken();
                    }
                    $scope.isLoading = false;
                    $scope.$apply();
                }
            }
        });
    };
    User.get = function ($scope, id) {
        $scope.isLoading = true;
        gapi.client.crmengine.user.get(id).execute(function (resp) {
            if (!resp.code) {
                $scope.user = resp;
            } else {
                if (resp.code == 401) {
                    $scope.refreshToken();
                }
            }
            $scope.isLoading = false;
            $scope.$apply();
        });
    };
    User.upLoadLogo = function ($scope, params) {
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
            }
        });

    };
    User.list = function ($scope, params) {
        $scope.inProcess(true);
        $scope.apply();
        gapi.client.crmengine.users.list(params).execute(function (resp) {
            if (!resp.code) {
                $scope.users = resp.items;
                $scope.selectableUsers = getSelectableUser($scope.users);
                $scope.invitees = resp.invitees;
            } else if (resp.code == 401) {
                    $scope.refreshToken();
            }
            $scope.inProcess(false);
            $scope.apply();
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

            })
        })
    };
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
            }
            $scope.isLoading = false;
            $scope.apply();
        });
    };
    User.setAdmin = function ($scope, params) {
        gapi.client.crmengine.users.setadmin(params).execute(function (resp) {
            $scope.reloadUsersList();
        });
    };
    User.get_user_by_gid = function ($scope, params) {
        gapi.client.crmengine.users.get_user_by_gid(params).execute(function (resp) {
            if (!resp.code) {
                $scope.user_acc = resp;
                $scope.renderCalendar(resp);
                $scope.isLoading = false;
            } else {
                $('#addAccountModal').modal('hide');
                $('#errorModal').modal('show');
                if (resp.message == "Invalid grant") {
                    $scope.refreshToken();
                    $scope.isLoading = false;
                    $scope.$apply();
                }
            }
        });
    };
    User.get_organization = function ($scope, params) {
        $scope.isLoading = true;
        gapi.client.crmengine.users.get_organization(params).execute(function (resp) {
            $scope.isLoading = false;
            if (!resp.code) {
                $scope.organizationInfo = resp;
                $scope.purchaseLiseneces(resp);
            } else {
                $('#addAccountModal').modal('hide');
                $('#errorModal').modal('show');
                if (resp.message == "Invalid grant") {
                    $scope.refreshToken();
                }
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
                }
            } else {
                if (resp.message == "Invalid grant") {
                    $scope.refreshToken();
                }
            }
            $scope.isLoading = false;
            $scope.apply();
        });
    };
    User.switchLogo = function ($scope) {
        $scope.isLoading = true;
        gapi.client.crmengine.company.switch_logo().execute(function (resp) {
            if (!resp.code) {
                window.location.reload();
            } else {
                if (resp.message == "Invalid grant") {
                    $scope.refreshToken();
                }
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
        });
    };
    User.deleteUser = function ($scope, params) {
        $scope.isLoading = true;
        gapi.client.crmengine.users.delete(params).execute(function (resp) {
            $scope.reloadUsersList();
            $scope.isLoading = true;
        });
    };
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
        $scope.isLoading = true;
        gapi.client.crmengine.permissions.insertv2(params).execute(function (resp) {
            if (!resp.code) {
                $scope.isLoading = false;
                $scope.apply();
                $scope.getColaborators()
            } else {
                $scope.isLoading = false;
                $scope.apply();
            }
        });
    };
    Permission.delete = function ($scope, params) {
        gapi.client.crmengine.permissions.delete(params).execute(function (resp) {
            if (!resp.code) {
                $scope.getColaborators()
            } else {
            }
        });
    };
    Permission.getColaborators = function ($scope, params) {
        gapi.client.crmengine.permissions.get_colaborators(params).execute(function (resp) {
            if (!resp.code) {
                $scope.collaborators_list = resp.items;
                $scope.apply();
            } else {
            }
        });
    };
    return Permission;
});
