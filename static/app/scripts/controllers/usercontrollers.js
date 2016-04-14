app.controller('UserListCtrl', ['$scope', 'Auth', 'User','Billing',
    function ($scope, Auth, User, Billing) {
        $("ul.page-sidebar-menu li").removeClass("active");
        $("#id_Users").addClass("active");
        trackMixpanelAction('USER_LIST_VIEW');
        $scope.isSignedIn = false;
        $scope.immediateFailed = false;
        $scope.nextPageToken = undefined;
        $scope.prevPageToken = undefined;
        $scope.nbLoads = 0;
        $scope.isLoading = false;
        $scope.pagination = {};
        $scope.currentPage = 1;
        $scope.selectedUsers = [];
        $scope.selected_invitees = [];
        $scope.pages = [];
        $scope.organization = {};
        $scope.users = [];
        $scope.step = 'billing';
        $scope.billing = {};
        $scope.billing.nb_licenses = '';
        $scope.billing.plan = '';
        $scope.billing.total = null;
        $scope.paymentOperation = false;
        $scope.billingError = {};
        $scope.billingValid = true;
        $scope.billing.deactivate_month_option = false;
        $scope.email_empty = false;
        $scope.is_a_life_time_free = false;
        $scope.inviteeSortType = 'invited_mail'; // set the default sort type
        $scope.inviteeSortReverse = false;  // set the default sort order
        $scope.userSortType = 'email'; // set the default sort type
        $scope.userSortReverse = false;  // set the default sort order
        if (Auth.license_is_expired == "True") {
            $("#LicenseExpiredModal").modal('show');
        }
        $scope.runTheProcess = function () {
            var params = {};
            User.getOrganizationLicensesStatus($scope, {});
            User.list($scope, params);
            Billing.getOrganizationSubscription($scope);
            Billing.listSubscription($scope);
            ga('send', 'pageview', '/admin/users');
        };
        $scope.refreshCurrent = function () {
            $scope.runTheProcess();
        };
        $scope.inProcess = function (varBool) {
            if (varBool) {
                $scope.nbLoads = $scope.nbLoads + 1;
                if ($scope.nbLoads == 1) {
                    $scope.isLoading = true;
                }
            } else {
                $scope.nbLoads = $scope.nbLoads - 1;
                if ($scope.nbLoads == 0) {
                    $scope.isLoading = false;
                }
            }
        };
        $scope.apply = function () {
            if ($scope.$root.$$phase != '$apply' && $scope.$root.$$phase != '$digest') {
                $scope.$apply();
            }
            return false;
        };
        $scope.refreshToken = function () {
            Auth.refreshToken();
        };
        $scope.isNumber = function (n) {
            if (n != null && n != '') {
                return !isNaN(parseFloat(n)) && isFinite(n);
            } else {
                return false;
            }
        };
        $scope.listNextPageItems = function () {
            var nextPage = $scope.currentPage + 1;
            var params = {};
            if ($scope.pages[nextPage]) {
                params = {
                    'limit': 7,
                    'pageToken': $scope.pages[nextPage]
                }
            } else {
                params = {'limit': 7}
            }
            $scope.currentPage = $scope.currentPage + 1;
            User.list($scope, params);
        };
        $scope.filterByName = function () {
            if ($scope.predicate != 'google_display_name') {
                $scope.predicate = 'google_display_name';
                $scope.reverse = false
            } else {
                $scope.predicate = '-google_display_name';
                $scope.reverse = false;
            }
        };
        $scope.listPrevPageItems = function () {
            var prevPage = $scope.currentPage - 1;
            var params = {};
            if ($scope.pages[prevPage]) {
                params = {
                    'limit': 7,
                    'pageToken': $scope.pages[prevPage]
                }
            } else {
                params = {'limit': 7}
            }
            $scope.currentPage = $scope.currentPage - 1;
            User.list($scope, params);
        };
        $scope.select_all_invitees = function ($event) {
            var checkbox = $event.target;
            if (checkbox.checked) {
                $scope.selected_invitees = [];
                $scope.selected_invitees = $scope.selected_invitees.concat($scope.invitees);
                $scope.allInvitees = true;

            } else {
                $scope.selected_invitees = [];
                $scope.allInvitees = false;
            }
        };

        $scope.select_invitee = function (invitee, index, $event) {
            var checkbox = $event.target;
            if (checkbox.checked) {
                if ($scope.selected_invitees.indexOf(invitee) == -1) {
                    $scope.selected_invitees.push(invitee);
                }
            } else {
                $scope.selected_invitees.splice(index, 1);
            }
        };
        $scope.isSelectedInvitee = function (index) {
            return ($scope.selected_invitees.indexOf(index) >= 0 || $scope.allInvitees);
        };
        $scope.selectAllUsers = function ($event) {
            var checkbox = $event.target;
            if (checkbox.checked) {
                $scope.selectedUsers = angular.copy($scope.selectableUsers);
                $scope.isSelectedAll = true;
            } else {
                $scope.selectedUsers = [];
                $scope.isSelectedAll = false;
            }
        };
        $scope.select_user = function (user, index, $event) {
            var checkbox = $event.target;
            if (checkbox.checked) {
                if ($scope.selectedUsers.indexOf(user) == -1) {
                    $scope.selectedUsers.push(user);
                }
                if ($scope.selectedUsers.length == $scope.selectableUsers.length)
                    $scope.isSelectedAll = true;
            } else {
                for (var i = 0; i < $scope.selectedUsers.length; i++) {
                    var selectedUser = $scope.selectedUsers[i];
                    if (selectedUser.entityKey === selectedUser.entityKey){
                        $scope.selectedUsers.splice(i, 1);
                        if ($scope.selectedUsers.length == 0) $scope.isSelectedAll = false;
                        break;
                    }
                }

            }
            console.log($scope.selectedUsers);
        };
        $scope.isSelected = function (index) {
            return ($scope.selectedUsers.indexOf(index) >= 0 || $scope.isSelectedAll);
        };

        $scope.setAdmin = function (user, index, $event) {
            if (!user['is_super_admin']) {
                var checkbox = $event.target;
                var params = {
                    'entityKey': user.entityKey,
                    'is_admin': checkbox.checked
                };
                User.setAdmin($scope, params);
            }
        };
        $scope.deleteUser = function () {
            var entityKeys = [];
            for (var i = 0; i < $scope.selectedUsers.length ; i++) {
                if (!$scope.selectedUsers.is_admin) {
                    entityKeys.push($scope.selectedUsers[i].entityKey)
                }
            }
            User.deleteUser($scope, {'entityKeys': entityKeys})
        };
        $scope.addNewUser = function (user) {
            $('#addAccountModal').modal('hide');
            User.insert($scope, user);
        };
        $scope.getPosition = function (index) {
            if (index < 4) {

                return index + 1;
            } else {
                return (index % 4) + 1;
            }
        };

        $scope.assignLicenses = function () {
            if ($scope.licencesStatus['licenses_bought'] - $scope.licencesStatus['assigned_licenses'] < 1) return;
            angular.forEach($scope.selectedUsers, function (user) {
                if ($scope.usersSubscriptions[user['email']].plan.name != "premium") {
                    var params = {'entityKey': user.entityKey};
                    User.assignLicense($scope, params);
                }
            });
        };
        $scope.unAssignLicenses = function () {
            angular.forEach($scope.selectedUsers, function (user) {
                if ($scope.usersSubscriptions[user['email']].plan.name != "premium") {
                    var params = {'entityKey': user.entityKey};
                    User.unAssignLicense($scope, params);
                }
            });
        };
        $scope.inviteUser = function (elem) {
            if (elem != undefined && elem != null) {
                switch (infos) {
                    case 'emails' :
                        if (elem.email) {
                            var copyOfElement = angular.copy(elem);
                            arr.push(copyOfElement);
                            $scope.initObject(elem);
                        }
                        var emails = [];
                        emails.push(elem);
                        var params = {
                            'emails': emails,
                            'message': "message"
                        };
                        User.insert($scope, params);
                        $scope.showInviteForm = false;
                        $scope.email.email = '';
                        break;
                }
            } else {
                alert("item already exit");
            }
        };
        $scope.isEmailUnique = function (email) {
            if($scope.users)
                for (var i = 0; i < $scope.users.length; i++) if(email === $scope.users[i].email) return false;
            if($scope.invitees)
            for (var i = 0; i < $scope.invitees.length; i++) if(email === $scope.invitees[i].invited_mail) return false;
            return true;
        };
        $scope.inviteNewUser = function (email) {
            if($scope.isEmailUnique(email.email)){
                if (email != undefined && email != null && email.email != "") {
                    $scope.email_empty = false;
                    var emails = [];
                    emails.push(email.email);
                    var params = {
                        'emails': emails,
                        'message': "message"
                    };
                    User.insert($scope, params);
                    $scope.email.email = '';
                } else {
                    $scope.email_empty = true;
                }
            }else{
                $scope.errorMsg = "The invited user already exist in users list or in your pending invitees list";
                angular.element("#errorModalInsert").modal("show");
            }
        };
        $scope.reloadUsersList = function () {
            var params = {};
            User.list($scope, params);
        };
        $scope.deleteInvitedUser = function () {
            var emails = [];
            for (var i = $scope.selected_invitees.length - 1; i >= 0; i--) {
                emails.push($scope.selected_invitees[i].invited_mail)
            }
            var params = {
                'emails': emails
            };
            User.deleteInvited($scope, params)
        };
        Auth.init($scope);
    }]);