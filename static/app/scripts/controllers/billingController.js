app.controller('BillingListController', ['$scope', '$route', 'Auth', 'Search', 'User', 'Map',
    function ($scope, $route, Auth, Search, User, Map) {
        $("ul.page-sidebar-menu li").removeClass("active");
        $("#id_Company").addClass("active");
        $scope.isSignedIn = false;
        $scope.immediateFailed = false;
        $scope.isContentLoaded = true;
        $scope.nextPageToken = undefined;
        $scope.prevPageToken = undefined;
        $scope.isLoading = false;
        $scope.pagination = {};
        $scope.currentPage = 1;
        $scope.pages = [];
        $scope.users = [];
        $scope.billing = {};
        $scope.beforedeleteOrganization=function(){
            $("#beforedeleteOrganization").modal('show');
        }
        $scope.deleteOrganization = function(){
             $("#beforedeleteOrganization").modal('hide');
        };
        $scope.apply = function () {
            if ($scope.$root.$$phase != '$apply' && $scope.$root.$$phase != '$digest') {
                $scope.$apply();
            }
            return false;
        };
        $scope.submit = function () {
            var form = $('#billing-form');
            form.find(':submit')[0].click();
            if (form[0].checkValidity()) {
                $scope.saveBillingDetails($scope.billing);
            }
        };
        $scope.addGeo = function (address) {
            $scope.billing.address = angular.copy(address.formatted);
            $scope.apply();
        };
        $scope.inProcess = function (varBool) {
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
        // What to do after authentication
        $scope.runTheProcess = function () {
            User.getOrganizationLicensesStatus($scope, {});
            User.get_logo($scope);
            $scope.mapAutocomplete();
        };

        $scope.mapAutocomplete = function () {
            $scope.addresses = {};
            Map.autocomplete($scope, "pac-input");
        };

        $scope.switchLogo = function () {
            if ($scope.logo.type == "custom" && !$scope.customLogo) {
                $scope.createPickerUploader();
                return
            }
            User.switchLogo($scope);
        };

        $scope.setBillingDetails = function () {
            $scope.billing.company_name = $scope.organization.name;
            $scope.billing.contact_firstname = $scope.organization.billing_contact_firstname;
            $scope.billing.contact_lastname = $scope.organization.billing_contact_lastname;
            $scope.billing.address = $scope.organization.billing_contact_address;
            $scope.billing.email = $scope.organization.billing_contact_email;
            $scope.billing.phone_number = $scope.organization.billing_contact_phone_number;
        };
        $scope.saveBillingDetails = function (billing) {
            var params = {
                'billing_company_name': billing.company_name,
                'billing_contact_firstname': billing.contact_firstname,
                'billing_contact_lastname': billing.contact_lastname,
                'billing_contact_email': billing.email,
                'billing_contact_address': billing.address,
                'billing_contact_phone_number': billing.phone_number
            };
            User.saveBillingDetails($scope, params);
        };
// function for purchase lisenece .
        $scope.purchaseLiseneces = function (organization) {
// the key represent the public key which represent our company  , client side , we have two keys 
// test  "pk_test_4Xa35zhZDqvXz1OzGRWaW4mX", mode dev 
// live "pk_live_4Xa3cFwLO3vTgdjpjnC6gmAD", mode prod 

            var handler = StripeCheckout.configure({

                key: 'pk_test_4Xa35zhZDqvXz1OzGRWaW4mX',
                image: "/static/img/IO_Grow.png",
                token: function (token) {

                    $scope.isLoading = true;
                    $scope.$apply();

                    var params = {
                        'token_id': token.id,
                        'token_email': token.email,
                        "organization": organization.organizationName,
                        "organizationKey": $scope.organization_key
                    };

                    gapi.client.crmengine.billing.purchase_lisence_for_org(params).execute(function (resp) {
                        if (!resp.code) {
                            // here be carefull .
                            $scope.reloadOrganizationInfo();

                        }

                    });
                    // Use the token to create the charge with a server-side script.
                    // You can access the token ID with `token.id`
                }
            });

            document.getElementById('customButton').addEventListener('click', function (e) {
                // Open Checkout with further options
                handler.open({
                    name: organization.organizationName,
                    description: 'bay a license $9.99',
                    amount: 999

                });
                e.preventDefault();
            });
        };


        $scope.reloadOrganizationInfo = function () {


            var params = {
                'organization': $scope.organization_key
            };
            User.get_organization($scope, params);
        };
        // We need to call this to refresh token when user credentials are invalid
        $scope.refreshToken = function () {
            Auth.refreshToken();
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
            console.log('in listNextPageItems');
            $scope.currentPage = $scope.currentPage + 1;
            User.list($scope, params);
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


        $scope.showModal = function () {
            console.log('button clicked');
            $('#addAccountModal').modal('show');

        };

        $scope.addNewUser = function (user) {
            console.log('add a new user');
            console.log(user);
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
        $scope.createPickerUploader = function () {
            $('#importModal').modal('hide');
            var developerKey = 'AIzaSyDHuaxvm9WSs0nu-FrZhZcmaKzhvLiSczY';
            var picker = new google.picker.PickerBuilder().
            addView(new google.picker.DocsUploadView().setMimeTypes("image/png,image/jpeg,image/jpg")).
            setCallback($scope.uploaderCallback).
            setOAuthToken(window.authResult.access_token).
            setDeveloperKey(developerKey).
            setAppId('935370948155-qm0tjs62kagtik11jt10n9j7vbguok9d').
            build();
            picker.setVisible(true);
        };
        $scope.uploaderCallback = function (data) {
            if (data.action == google.picker.Action.PICKED) {
                if (data.docs) {
                    var params = {
                        'fileUrl': data.docs[0].downloadUrl,
                        'fileId': data.docs[0].id
                    };
                    User.upLoadLogo($scope, params);
                }
            }
        };

        // Google+ Authentication
        Auth.init($scope);

    }]);


app.controller('BillingShowController', ['$scope', '$route', 'Auth', 'Search', 'User',
    function ($scope, $route, Auth, Search, User) {

        //$scope.organization_key=document.getElementById('organization_key').value;
        $("ul.page-sidebar-menu li").removeClass("active");
        $("#id_Billing").addClass("active");


        $scope.isSignedIn = false;
        $scope.immediateFailed = false;
        //

        $scope.nextPageToken = undefined;
        $scope.prevPageToken = undefined;
        $scope.isLoading = false;
        $scope.pagination = {};
        $scope.currentPage = 01;
        $scope.pages = [];
        $scope.loadCharges = true;
        $scope.users = [];
        $scope.isLicensed = true;

        // What to do after authentication
        $scope.runTheProcess = function () {


        };

        // hadji hicham . to send the token to the api!
        $scope.purchase = function (user) {
            // the key represent the public key which represent our company  , client side , we have two keys
            // test  "pk_test_4Xa35zhZDqvXz1OzGRWaW4mX", mode dev
            // live "pk_live_4Xa3cFwLO3vTgdjpjnC6gmAD", mode prod

            // deactivate purchase button
            try {
                var oneDay = 24 * 60 * 60 * 1000;
                current_period_end = new Date(user.subscriptions[0].current_period_end);
                NowDate = new Date(Date.now());

                var purchsePermit = Math.round((current_period_end.getTime() - NowDate.getTime()) / (oneDay));
                if (purchsePermit < 0) {
                    $scope.isLicensed = false;
                } else {
                    $scope.isLicensed = true;
                }

            } catch (e) {
                $scope.isLicensed = false;
            }


            var handler = StripeCheckout.configure({
                key: 'pk_test_4Xa35zhZDqvXz1OzGRWaW4mX',
                image: user.google_public_profile_photo_url,

                email: user.email,

                token: function (token) {

                    $scope.isLicensed = true;
                    $scope.isLoading = true;
                    $scope.$apply();


                    var params = {
                        'token_id': token.id,
                        'token_email': token.email,
                        'customer_id': user.customer_id
                    };

                    gapi.client.crmengine.billing.purchase_lisence_for_user(params).execute(function (resp) {
                        if (!resp.code) {

                            $scope.runTheProcess();

                        }

                    });
                    // Use the token to create the charge with a server-side script.
                    // You can access the token ID with `token.id`
                }
            });

            document.getElementById('customButton').addEventListener('click', function (e) {
                // Open Checkout with further options
                handler.open({
                    name: user.google_display_name,
                    description: '$9.99',
                    amount: 999
                });
                e.preventDefault();
            });


        }
        // We need to call this to refresh token when user credentials are invalid
        $scope.refreshToken = function () {
            Auth.refreshToken();
        };
        // Google+ Authentication
        Auth.init($scope);

    }]);
