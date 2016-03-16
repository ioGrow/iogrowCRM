app.controller('EventShowController', ['$scope', '$filter', '$route', 'Auth', 'Note', 'Event', 'Task', 'Topic', 'Comment', 'User', 'Contributor', 'Map', 'Permission', 'Attachement', 'Edge',
    function ($scope, $filter, $route, Auth, Note, Event, Task, Topic, Comment, User, Contributor, Map, Permission, Attachement, Edge) {

//HKA 14.11.2013 Controller to show Events and add comments
        $scope.isSignedIn = false;
        $scope.immediateFailed = false;
        $scope.nextPageToken = undefined;
        $scope.prevPageToken = undefined;
        $scope.isLoading = false;
        $scope.pagination = {};
        $scope.currentPage = 01;
        $scope.pages = [];
        $scope.paginationcomment = {};
        $scope.currentPagecomment = 01;
        $scope.pagescomment = [];
        $scope.sharing_with = [];
        $scope.addresses = [];
        $scope.event = {};
        $scope.event.access = "private";
        $scope.collaborators_list = [];
        $scope.notes = [];
        $scope.users = [];
        $scope.user = undefined;
        $scope.slected_memeber = undefined;
        $scope.role = 'participant';
        $scope.showEndsCalendar = false;
        $scope.showStartsCalendar = false;
        $scope.showEventInput = false;
        $scope.ends_at = null;


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
        }
        // What to do  after authentication
        $scope.runTheProcess = function () {

            var eventid = {'id': $route.current.params.eventId};
            var params = {
                'id': $route.current.params.eventId,
                'documents': {
                    'limit': '15'
                }
            }
            Event.get_docs($scope, params);
            Event.get($scope, eventid);
            User.list($scope, {});
            ga('send', 'pageview', '/events/show');
            window.Intercom('update');
            $scope.mapAutocomplete();
        };


        $scope.mapAutocomplete = function () {

            $scope.addresses = {};
            /*$scope.billing.addresses;*/
            Map.autocompleteCalendar($scope, "pac-input");
        }

        // HKA 10.12.2015 new function to create docume
   $scope.docCreated=function(url){
            console.log('here docCreated');
            window.open($scope.prepareEmbedLink(url),'_blank');
        }
   $scope.prepareEmbedLink=function(link){
                return link.replace(/preview/gi, "edit");
        }


        /***********************the address****************************/
        $scope.addGeoCalendar = function (address) {
            $scope.event.where = address.formatted
            $scope.updateEvent({'where': $scope.event.where});
        };


        $scope.lunchMaps = function () {

            // var locality=address.formatted || address.street+' '+address.city+' '+address.state+' '+address.country;
            window.open('http://www.google.com/maps/search/' + $scope.event.where, 'winname', "width=700,height=550");

        }

        // HADJI HICHAM. HH 24/10/2014. INLINEPATCH
        $scope.inlinePatch = function (kind, edge, name, id, value) {

            if (kind == "Comment") {

                var params = {
                    'id': id,
                    'content': value
                }
                Comment.patch($scope, params);


            }


        };

        // HADJI HICHAM-HH 03/11/2014- get the comments list
        $scope.ListComments = function () {
            var params = {
                'about': $scope.task.entityKey,
                'limit': 7
            };
            Comment.list($scope, params);


        };


        // We need to call this to refresh token when user credentials are invalid
        $scope.refreshToken = function () {
            Auth.refreshToken();
        };
        $scope.$watch('event.starts_at', function (newValue, oldValue) {
            if ($scope.event.starts_at) {
                $scope.patchDate($scope.event.starts_at, "Start");
                $scope.showStartsCalendar = false;
            } else {
                console.log("start not yet mentioned ");
            }


        });
        $scope.$watch('event.ends_at', function (newValue, oldValue) {
            if ($scope.event.ends_at) {
                $scope.patchDate($scope.event.ends_at, "End");
                $scope.showEndsCalendar = false;
            } else {
                console.log("end not yet mentioned ");
            }


        });
        $scope.patchDate = function (newValue, when) {


            if (when == "Start") {
                var starts_at = $filter('date')(newValue, ['yyyy-MM-ddTHH:mm:00.000000']);

                var params = {
                    'entityKey': $scope.event.entityKey,
                    'starts_at': moment(starts_at).format('YYYY-MM-DDTHH:mm:00.000000'),
                    'ends_at': moment($scope.event.ends_at).format('YYYY-MM-DDTHH:mm:00.000000'),
                    'title': $scope.event.title
                };
            }
            if (when == "End") {
                var ends_at = $filter('date')(newValue, ['yyyy-MM-ddTHH:mm:00.000000']);

                var params = {
                    'entityKey': $scope.event.entityKey,
                    'ends_at': moment(ends_at).format('YYYY-MM-DDTHH:mm:00.000000'),
                    'starts_at': moment($scope.event.starts_at).format('YYYY-MM-DDTHH:mm:00.000000'),
                    'title': $scope.event.title
                };
            }
            if ((!$scope.isLoading) && (params.entityKey != undefined )) {


                Event.patch($scope, params);
            }
        }
        $scope.listNextPageItemscomment = function () {

            console.log('i am in list next comment page')
            var nextPage = $scope.currentPagecomment + 1;

            var params = {};
            if ($scope.pagescomment[nextPage]) {
                params = {
                    'limit': 5,
                    'discussion': $scope.eventt.entityKey,
                    'order': '-updated_at',
                    'pageToken': $scope.pagescomment[nextPage]
                }
            } else {
                params = {
                    'limit': 5,
                    'discussion': $scope.eventt.entityKey,
                    'order': '-updated_at',
                }
            }
            console.log('in listNextPageItems');
            $scope.currentPagecomment = $scope.currentPagecomment + 1;
            Comment.list($scope, params);
        }

        $scope.listPrevPageItemscomment = function () {

            var prevPage = $scope.currentPagecomment - 1;
            var params = {};
            if ($scope.pagescomment[prevPage]) {
                params = {
                    'limit': 5,
                    'discussion': $scope.eventt.entityKey,
                    'order': '-updated_at',
                    'pageToken': $scope.pagescomment[prevPage]
                }
            } else {
                params = {
                    'limit': 5,
                    'order': '-updated_at',
                    'discussion': $scope.eventt.entityKey
                }
            }
            $scope.currentPagecomment = $scope.currentPagecomment - 1;
            Comment.list($scope, params);
        };

        $scope.renderMaps = function () {
            // Map.render($scope);
            Map.destroy();
            if ($scope.event.where)  Map.searchLocation($scope, $scope.event.where);
        };
        // arezki 1/9/14
        $scope.getColaborators = function () {

            Permission.getColaborators($scope, {"entityKey": $scope.event.entityKey});
        }
        // arezki 3/9/14
        $scope.selectMember = function () {

            $scope.slected_memeber = $scope.user;
            $scope.user = '';
            $scope.sharing_with.push($scope.slected_memeber);

        };
        // LBA le 21-10-2014
        $scope.DeleteCollaborator = function (entityKey) {
            console.log("delete collaborators")
            var item = {
                'type': "user",
                'value': entityKey,
                'about': $scope.event.entityKey
            };
            Permission.delete($scope, item)
            console.log(item)
        };
        $scope.refreshToken = function () {
            Auth.refreshToken();
        };
// arezki lebdiri 1/9/14
        $scope.share = function () {

            var body = {'access': $scope.event.access};
            var id = $scope.event.id;
            var params = {
                'entityKey': $scope.event.entityKey,
                'access': $scope.event.access
            }

            Event.patch($scope, params);
            // who is the parent of this event .hadji hicham 21-07-2014.

            // params["parent"]="event";
            // Event.permission($scope,params);
            // Task.permission($scope,params);


            if ($scope.sharing_with.length > 0) {

                var items = [];

                angular.forEach($scope.sharing_with, function (user) {
                    var item = {
                        'type': "user",
                        'value': user.entityKey
                    };
                    items.push(item);
                });

                if (items.length > 0) {
                    var params = {
                        'about': $scope.event.entityKey,
                        'items': items
                    }
                    Permission.insert($scope, params);
                }


                $scope.sharing_with = [];


            }


        };

        $scope.showModal = function () {
            console.log('button clicked');
            $('#addAccountModal').modal('show');

        };

        $scope.addComment = function (comment) {

            var params = {
                'about': $scope.event.entityKey,
                'content': $scope.comment.content
            };
            Comment.insert($scope, params);
            $scope.comment.content = '';


        };
        $scope.ListComments = function () {
            var params = {
                'about': $scope.event.entityKey,
                'limit': 7
            };
            Comment.list($scope, params);


        };


// HADJI HICHAM - 23/10/2014 - delete a comment

        $scope.commentDelete = function (commentId) {

            params = {'id': commentId}
            Comment.delete($scope, params);

        }
//HKA 18.11.2013 highlight the comment
        $scope.hilightComment = function () {
            console.log('Should higll');
            $('#comment_0').effect("bounce", "slow");
            $('#comment_0 .message').effect("highlight", "slow");
        };

        //HKA 02.12.2013 Add Contributor

        $scope.addNewContributor = function (selected_user, role) {
            console.log('*************** selected user ***********************');
            console.log(selected_user);

            var params = {
                'discussionKey': $scope.eventt.entityKey,

                'type': 'user',
                'value': selected_user.email,
                'name': selected_user.google_display_name,
                'photoLink': selected_user.google_public_profile_photo_url,
                'role': role


                // Create Contributor Service
                // Create contributors.list api
                //list all contributors after getting the task.


            }
            console.log('selected member');

            $('#addContributor').modal('hide');
        };

//HKA 02.12.2013 List contributors
        $scope.listContributors = function () {
            var params = {
                'discussionKey': $scope.eventt.entityKey,
                'order': '-created_at'
            };
            Contributor.list($scope, params);
        };
//HKA 20.01.2014 Add
        $scope.getshow = function (showId) {
            var show = Show.get($scope.showId);
            return show;

        }
        // HKA 22.06.2014 Delete Event


        $scope.editbeforedelete = function () {
            $('#BeforedeleteEvent').modal('show');
        };
        $scope.deleteEvent = function () {

            var params = {'entityKey': $scope.event.entityKey};

            Event.delete($scope, params);
            $('#BeforedeleteEvent').modal('hide');

        };
        $scope.eventDeleted = function (resp) {

            window.location.replace('/#/calendar');

        };


// hadji hicham 09-08-2014 . inline update events
        $scope.inlineUpdateEvent = function (event, value) {
            var params = {
                'id': event.id,
                'entityKey': event.entityKey,
                'starts_at': moment(event.starts_at).format('YYYY-MM-DDTHH:mm:00.000000'),
                'ends_at': moment(event.ends_at).format('YYYY-MM-DDTHH:mm:00.000000'),
                'title': value,
                'allday': $scope.event.allday,
                'googleEvent': "false",
                'timezone': $scope.event.timezone,
                'where': $scope.event.where,
                'description': $scope.event.description
            };


            Event.patch($scope, params);
        }
        /*********************atash file to task *********************/
        /**********************************************************/
// HADJI HICHAM HH- 20/10/2014 - 10:34 .

        $scope.showAttachFilesPicker = function () {
            var developerKey = 'AIzaSyDHuaxvm9WSs0nu-FrZhZcmaKzhvLiSczY';
            var docsView = new google.picker.DocsView()
                .setIncludeFolders(true)
                .setSelectFolderEnabled(true);
            var picker = new google.picker.PickerBuilder().
            addView(new google.picker.DocsUploadView()).
            addView(docsView).
            setCallback($scope.attachmentUploaderCallback).
            setOAuthToken(window.authResult.access_token).
            setDeveloperKey(developerKey).
            setAppId('935370948155-qm0tjs62kagtik11jt10n9j7vbguok9d').
            enableFeature(google.picker.Feature.MULTISELECT_ENABLED).
            build();
            picker.setVisible(true);
        };
        $scope.attachmentUploaderCallback = function (data) {


            if (data.action == google.picker.Action.PICKED) {

                var params = {
                    'access': $scope.event.access,
                    'parent': $scope.event.entityKey
                };
                params.items = new Array();

                $.each(data.docs, function (index) {
                    console.log(data.docs);

                    var item = {
                        'id': data.docs[index].id,
                        'title': data.docs[index].name,
                        'mimeType': data.docs[index].mimeType,
                        'embedLink': data.docs[index].url

                    };
                    params.items.push(item);

                });


                Attachement.attachfiles($scope, params);

                //         $scope.$apply();
            }

        }
        /***************************************/
//HADJI HICHAM -HH 21/10/2014. list of documents .

        $scope.listDocuments = function () {

            var params = {
                'id': $scope.event.id,
                'documents': {
                    'limit': '15'
                }
            }
            Event.get_docs($scope, params);
        }
        /*************************************************************/


// HKA 23.06.2014 update description
        $scope.updateEvent = function (description) {

            if (description['where']) {

                var params = {
                    'id': $scope.event.id,
                    'entityKey': $scope.event.entityKey,
                    'starts_at': moment($scope.event.starts_at).format('YYYY-MM-DDTHH:mm:00.000000'),
                    'ends_at': moment($scope.event.ends_at).format('YYYY-MM-DDTHH:mm:00.000000'),
                    'title': $scope.event.title,
                    'allday': $scope.event.allday,
                    'googleEvent': "false",
                    'timezone': $scope.event.timezone,
                    'where': $scope.event.where,
                    'description': $scope.event.description
                };


            }
            if (description['description']) {
                var params = {
                    'id': $scope.event.id,
                    'entityKey': $scope.event.entityKey,
                    'starts_at': moment($scope.event.starts_at).format('YYYY-MM-DDTHH:mm:00.000000'),
                    'ends_at': moment($scope.event.ends_at).format('YYYY-MM-DDTHH:mm:00.000000'),
                    'title': $scope.event.title,
                    'allday': $scope.event.allday,
                    'googleEvent': "false",
                    'timezone': $scope.event.timezone,
                    'where': $scope.event.where,
                    'description': description['description']
                };

            }


            Event.patch($scope, params);

        };


        // Google+ Authentication
        Auth.init($scope);
    }]);
app.controller('EventListController', ['$scope', '$filter', '$route', 'Auth', 'Note', 'Event', 'Task', 'Topic', 'Comment', 'User', 'Contributor', 'Map', 'Edge',
    function ($scope, $filter, $route, Auth, Note, Event, Task, Topic, Comment, User, Contributor, Map, Edge) {
//HKA 14.11.2013 Controller to show Events and add comments

        $("ul.page-sidebar-menu li").removeClass("active");
        $("#id_Calendar").addClass("active");

        document.title = "Calendar: Home";
        $scope.isSignedIn = false;
        $scope.immediateFailed = false;
        $scope.nextPageToken = undefined;
        $scope.prevPageToken = undefined;
        $scope.isLoading = false;
        $scope.pagination = {};
        $scope.currentPage = 01;
        $scope.pages = [];
        $scope.paginationcomment = {};
        $scope.currentPagecomment = 01;
        $scope.pagescomment = [];
        $scope.addresses = [];
        $scope.event = {};
        $scope.event.access = "private"
        $scope.notes = [];
        $scope.users = [];
        $scope.user = undefined;
        $scope.slected_memeber = undefined;
        $scope.role = 'participant';
        $scope.isContentLoaded = true;
        $scope.title_event = "New Event";
        $scope.permet_clicking = true;
        $scope.end_date = "";
        $scope.newEventClicked = false;
        $scope.allday = false;
        $scope.invites = [];
        $scope.guest_modify = false;
        $scope.guest_invite = true;
        $scope.guest_list = true;

        // What to do after authentication

        $scope.user_id = document.getElementById('user_id').value;
        $scope.timezone = document.getElementById('timezone').value;
        if (($scope.timezone == "") || ($scope.timezone == "None")) {
            $scope.timezone = moment().format("Z");
        }


// console.log("Timezone of browser:");
// console.log(moment().format("Z"));
// var language = window.navigator.userLanguage || window.navigator.language;
// console.log("language:")
// console.log(language)
//


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
        }
        $scope.$watch('start_event_new', function (newValue, oldValue) {
            if (newValue != oldValue) {
                // $scope.patchDate(newValue);
                $scope.showStartsCalendar = false;
            }

        });

        $scope.$watch('end_event_new', function (newValue, oldValue) {
            if (newValue != oldValue) {
                // $scope.patchDate(newValue);
                $scope.showEndsCalendar = false;
            }

        });
        /*************************************************************************************/

        $scope.$watch('start_event_draw', function (newValue, oldValue) {
            if (newValue != oldValue) {
                // $scope.patchDate(newValue);
                $scope.start_event = moment(newValue).format('YYYY-MM-DDTHH:mm:00.000000');

                $scope.showStartsCalendar = false;
            }

        });

        $scope.$watch('end_event_draw', function (newValue, oldValue) {
            if (newValue != oldValue) {
                // $scope.patchDate(newValue);
                $scope.end_event = moment(newValue).format('YYYY-MM-DDTHH:mm:00.000000');
                $scope.showEndsCalendar = false;
            }

        });
        /*************************************************************************************/
        $scope.newEventisClicked = function () {
            $scope.showEventInput = true;
            $scope.start_event = moment(Date.now()).format('YYYY-MM-DDTHH:mm:00.000000')
            $scope.start_event_draw = moment(Date.now()).format('YYYY-MM-DDTHH:mm:00.000000');
            $scope.end_event_draw = moment(Date.now()).add('hours', 1).format();
            $scope.end_event = moment(Date.now()).add('hours', 1).format('YYYY-MM-DDTHH:mm:00.000000');
            $scope.showStartsCalendar = true;
            $scope.showEndsCalendar = true;
            $scope.locationShosen = false;

            //$scope.$apply();
            $("#newEventModal").modal('show');

            $scope.newEventClicked = true;


        }


        $scope.newEventCanceled = function () {
            $scope.newEventClicked = false;
        }

        $scope.runTheProcess = function () {
            var eventid = {'id': $route.current.params.eventId};
            var userGId = {'google_user_id': $scope.user_id};

            $("head").append('<link rel="stylesheet" type="text/css" href="/static/src/css/jquery.datetimepicker.css"/>');

            $("head").append('<script type="text/javascript" src="/static/src/js/fullcalendar.min.js"></script>');
            $("head").append('<script type="text/javascript" src="/static/src/js/lang-all.js"></script>');
            $("head").append('<script type="text/javascript" src="/static/src/js/gcal.js"></script>');
            $("head").append('<script src="/static/src/js/jquery.datetimepicker.js"></script>');
            User.get_user_by_gid($scope, userGId);
            // Event.list($scope);
            User.list($scope, {});
            ga('send', 'pageview', '/calendar');
            window.Intercom('update');

            $scope.mapAutocomplete();
        };

        $scope.mapAutocomplete = function () {

            $scope.addresses = {};
            /*$scope.billing.addresses;*/
            Map.autocompleteCalendar($scope, "pac-input");
        };

        /***********************the address****************************/
        $scope.addGeoCalendar = function (address) {

            $scope.ioevent.where = address.formatted
            $scope.locationShosen = true;
            $scope.$apply();

        };

        $scope.lunchMaps = function () {

            // var locality=address.formatted || address.street+' '+address.city+' '+address.state+' '+address.country;
            window.open('http://www.google.com/maps/search/' + $scope.ioevent.where, 'winname', "width=700,height=550");

        }
        /*************************************************************/
        $scope.refreshCurrent = function () {
            window.location.reload();
        };

        $scope.wizard = function () {
            localStorage['completedTour'] = 'True';
            var tour = {
                id: "hello-hopscotch",
                steps: [
                    {

                        title: "Step 1: Add event",
                        content: "Click here to add an event or just click where you want in the calendar to define an event. ",
                        target: "new_event",
                        placement: "left"
                    }

                ]

            };
            // Start the tour!
            console.log("beginstr");
            hopscotch.startTour(tour);
        };

// HADJI HICHAM -19/05/2015
        $scope.timezoneChosen = $scope.timezone;
        $('#timeZone').on('change', function () {
            $scope.timezoneChosen = this.value;
        });


        $scope.renderCalendar = function (user) {
            var axeFormat = 'h(:mm)a';
            if (user.language == "ar" || user.language == "fr") {
                axeFormat = 'HH:mm';
            }

            var start_date = (user.week_start == "monday") ? 1 : 0;
            $('#calendar').fullCalendar({
                header: {
                    left: 'prev,next today',
                    center: 'title',
                    right: 'month,agendaWeek,agendaDay'
                },
                axisFormat: axeFormat,
                timeFormat: axeFormat,
                lang: user.language,
                defaultView: 'agendaWeek',
                editable: true,
                firstDay: start_date,
                timeZone: 'Africa/Algiers',
                eventSources: [{
                    events: function (start, end, timezone, callback) {
                        // events client table to feed the calendar .  // hadji hicham  08-07-2014 10:40
                        var events = [];
                        var params = {
                            'calendar_feeds_start': moment(start).format('YYYY-MM-DDTH:mm:00.000000'),
                            'calendar_feeds_end': moment(end).format('YYYY-MM-DDTH:mm:00.000000')
                        };
                        $scope.isLoading = true;

                        gapi.client.crmengine.calendar.feeds(params).execute(function (resp) {

                            if (!resp.code) {

                                $scope.calendarFeeds = resp.items;

                                if ($scope.calendarFeeds) {

                                    for (var i = 0; i < $scope.calendarFeeds.length; i++) {
                                        var allday = ($scope.calendarFeeds[i].allday == "false") ? false : true;

                                        var url = ($scope.calendarFeeds[i].my_type == "event") ? '/#/events/show/' : '/#/tasks/show/';
                                        var backgroundColor = ($scope.calendarFeeds[i].status_label == "closed") ? "" : $scope.calendarFeeds[i].backgroundColor;

                                        $scope.timezoneapplayed = "+00:00";
                                        if ($scope.calendarFeeds[i].my_type != "task") {
                                            if ($scope.calendarFeeds[i].timezone != "") {
                                                $scope.timezoneapplayed = $scope.calendarFeeds[i].timezone;

                                            } else {

                                                $scope.timezoneapplayed = $scope.timezone;
                                            }
                                        }


                                        var className = ($scope.calendarFeeds[i].status_label == "closed") ? "closedTask" : "";
                                        if ($scope.calendarFeeds[i].ends_at) {
                                            $scope.end_date = moment($scope.calendarFeeds[i].ends_at + $scope.timezoneapplayed).zone($scope.timezone);
                                            $scope.$apply();

                                        } else {
                                            $scope.end_date = moment($scope.calendarFeeds[i].starts_at + $scope.timezoneapplayed).zone($scope.timezone);
                                            $scope.$apply();
                                        }

                                        if ($scope.calendarFeeds[i].google_url) {
                                            $scope.detailUrl = $scope.calendarFeeds[i].google_url;
                                            $scope.isItGoogles = true;
                                        }
                                        else {
                                            $scope.detailUrl = url + $scope.calendarFeeds[i].id.toString();
                                            $scope.isItGoogles = false;
                                        }


                                        events.push({
                                            id: $scope.calendarFeeds[i].id,
                                            title: $scope.calendarFeeds[i].title,
                                            start: moment($scope.calendarFeeds[i].starts_at), //.zone($scope.timezone),
                                            end: $scope.end_date,
                                            entityKey: $scope.calendarFeeds[i].entityKey,
                                            backgroundColor: backgroundColor + "!important",
                                            color: backgroundColor + "!important",
                                            url: $scope.detailUrl,
                                            allDay: allday,
                                            my_type: $scope.calendarFeeds[i].my_type,
                                            className: className,
                                            where: $scope.calendarFeeds[i].where,
                                            textColor: "white !important",
                                            isItGoogles: $scope.isItGoogles,
                                            description: $scope.calendarFeeds[i].description
                                        })


                                    }
                                    ;


                                } else {
                                    console.log("the list is empty");
                                }

                                callback(events);

                                $scope.$apply();
                            }
                            else {
                                console.log(resp.message);
                                console.log("Ooops!");
                                if (resp.code == 401) {
                                    $scope.refreshToken();
                                    $scope.isLoading = false;
                                    $scope.$apply();
                                }
                                ;
                            }
                        });


                        $scope.isLoading = false;

                    }
                }
                ],
                dayClick: function (date, jsEvent, view) {
                    $scope.newEventClicked = false;
                    if (view.name == "month") {
                        $scope.allday = true;
                        $scope.start_event = moment(date).format('YYYY-MM-DDTHH:mm:00.000000')
                        $scope.start_event_draw = date.format();
                        $scope.end_event_draw = date.add('days', 1).format();
                        $scope.end_event = moment(date.add('hours', 23).add('minute', 59).add('second', 59)).format('YYYY-MM-DDTHH:mm:00.000000');
                        $scope.$apply();

                    } else {
                        $scope.allday = false;
                        $scope.start_event = moment(date).format('YYYY-MM-DDTHH:mm:00.000000')
                        $scope.start_event_draw = date.format();
                        $scope.end_event_draw = date.add('hours', 1).format();
                        $scope.end_event = moment(date.add('hours', 1)).format('YYYY-MM-DDTHH:mm:00.000000');
                        $scope.$apply();
                    }


                    if ($scope.permet_clicking) {
                        // $scope.end_event=date.add('hours',1).format('YYYY-MM-DDTHH:mm:00.000000');
                        var eventObject = {
                            title: $scope.title_event
                        };
                        eventObject.id = "new";
                        eventObject.start = moment($scope.start_event_draw);


                        eventObject.allDay = $scope.allday;

                        eventObject.className = $(this).attr("data-class");

                        $('#calendar').fullCalendar('renderEvent', eventObject, false);
                        $scope.showEventModal();
                    }
                },
                // Triggered when event dragging begins. hadji hicham  08-07-2014 10:40
                eventDragStart: function (event, jsEvent, ui, view) {
                },
                // Triggered when event dragging stops.
                eventDragStop: function (event, jsEvent, ui, view) {


                },
                // Triggered when dragging stops and the event has moved to a different day/time. hadji hicham  08-07-2014 10:40
                eventDrop: function (event, revertFunc, jsEvent, ui, view) {


                    // drag the events is allow in all cases !  hadji hicham  08-07-2014 10:40
                    if (event.my_type == "event") {


                        if (event.allDay) {

                            var params = {
                                'id': event.id,
                                'entityKey': event.entityKey,
                                'starts_at': moment(event.start).format('YYYY-MM-DDTHH:mm:00.000000'),
                                'ends_at': moment(event.start.add('hours', 23).add('minute', 59).add('second', 59)).format('YYYY-MM-DDTHH:mm:00.000000'),
                                'title': event.title,
                                'allday': event.allDay.toString(),
                                'googleEvent': event.isItGoogles.toString(),
                                'timezone': $scope.timezone,
                                'where': event.where,
                                'description': event.description
                            }

                        } else {

                            if (event.end) {
                                var params = {
                                    'id': event.id,
                                    'entityKey': event.entityKey,
                                    'starts_at': moment(event.start).format('YYYY-MM-DDTHH:mm:00.000000'),
                                    'ends_at': moment(event.end).format('YYYY-MM-DDTHH:mm:00.000000'),
                                    'title': event.title,
                                    'allday': event.allDay.toString(),
                                    'googleEvent': event.isItGoogles.toString(),
                                    'timezone': $scope.timezone,
                                    'where': event.where,
                                    'description': event.description
                                }
                            } else {

                                var params = {
                                    'id': event.id,
                                    'entityKey': event.entityKey,
                                    'starts_at': moment(event.start).format('YYYY-MM-DDTHH:mm:00.000000'),
                                    'ends_at': moment(event.start.add('hours', 2)).format('YYYY-MM-DDTHH:mm:00.000000'),
                                    'title': event.title,
                                    'allday': event.allDay.toString(),
                                    'googleEvent': event.isItGoogles.toString(),
                                    'timezone': $scope.timezone,
                                    'where': event.where,
                                    'description': event.description
                                }
                            }

                        }


                        Event.patch($scope, params);
                    }
                    // drag tasks is allow only in the case all day  hadji hicham  08-07-2014 10:40
                    else if (event.my_type == "task") {
                        if (event.allDay) {
                            // this function make the task change their color of status . hadji hicham  08-07-2014 10:40
                            $scope.changeColorState(event);

                            var params = {
                                'id': event.id,
                                'entityKey': event.entityKey,
                                'title': event.title,
                                'due': moment(event.start).format('YYYY-MM-DDTHH:mm:00.000000')
                            }

                            Task.patch($scope, params);

                        } else {
                            $('#calendar').fullCalendar('refetchEvents');


                        }


                    }


                },
                //Triggered when the user mouses over an event. hadji hicham 14-07-2014.
                eventMouseover: function (event, jsEvent, view) {
                    if (jsEvent.ctrlKey) {


                        if (event.my_type == "event") {
                            var params = {
                                'title': event.title,
                                'starts_at': moment(event.start).format('YYYY-MM-DDTHH:mm:00.000000'),
                                'ends_at': moment(event.end).format('YYYY-MM-DDTHH:mm:00.000000'),

                                'allday': event.allDay.toString(),
                                'access': "private"
                            }
                            Event.insert($scope, params);

                        }


                    }
                },
                //event click
                eventClick: function (calEvent, jsEvent, view) {


                    //runEffect();
                },

                //Triggered when event resizing begins.
                eventResizeStart: function (event, jsEvent, ui, view) {
                },
                //Triggered when event resizing stops.
                eventResizeStop: function (event, jsEvent, ui, view) {
                },
                //Triggered when resizing stops and the event has changed in duration.
                eventResize: function (event, jsEvent, ui, view) {
                    var params = {};
                    if (event.allDay) {
                        params = {
                            'id': event.id,
                            'entityKey': event.entityKey,
                            'starts_at': moment(event.start).format('YYYY-MM-DDTHH:mm:00.000000'),
                            'ends_at': moment(event.end).format('YYYY-MM-DDTHH:mm:00.000000'),
                            'allday': 'false',
                            'title': event.title,
                            'allday': event.allDay.toString(),
                            'googleEvent': event.isItGoogles.toString(),
                            'timezone': $scope.timezone,
                            'where': event.where,
                            'description': event.description
                        }
                    } else {
                        params = {
                            'id': event.id,
                            'entityKey': event.entityKey,
                            'starts_at': moment(event.start).format('YYYY-MM-DDTHH:mm:00.000000'),
                            'ends_at': moment(event.end).format('YYYY-MM-DDTHH:mm:00.000000'),
                            'allday': 'false',
                            'title': event.title,
                            'allday': event.allDay.toString(),
                            'googleEvent': event.isItGoogles.toString(),
                            'timezone': $scope.timezone,
                            'where': event.where,
                            'description': event.description
                        }

                    }

                    Event.patch($scope, params);
                }
                // the end of initialisation   . hadji hicham  08-07-2014


            });
        }


// here we are going to start test the bubble
        /*********************************************/
        function runEffect() {
            // get effect type from


            var selectedEffect = $("#effectTypes").val();

            // most effect types need no options passed by default
            var options = {};
            // some effects have required parameters
            if (selectedEffect === "scale") {
                options = {percent: 100};
            } else if (selectedEffect === "size") {
                options = {to: {width: 280, height: 185}};
            }

            // run the effect
            $("#effect").show(selectedEffect, options, 500, callback);

        };

        //callback function to bring a hidden box back
        function callback() {
            setTimeout(function () {
                $("#effect:visible").removeAttr("style").fadeOut();
            }, 1000);
        };
        /*************************************************/
// under the test
        $scope.listTags = function () {
        };
        $scope.listTasks = function () {
        };

        // show event modal

        $scope.showEventModal = function () {
            $scope.locationShosen = false;
            $('#newEventModal').modal('show');
        };

        $scope.offsetCalculation = function (eventTimezone) {
            var sign = "+";
            var offsetStr = "0";
            var timezone4index = $scope.timezone[4];
            var eventTimezone4index = eventTimezone[4];
            var offset4index = parseInt(timezone4index) - parseInt(eventTimezone4index)
            var offset = (parseInt($scope.timezone) + (parseInt($scope.timezone) - parseInt(eventTimezone))) % 13;
            if (offset.toString().length == 1) {
                offsetStr = offsetStr + offset.toString();
            } else {
                offsetStr = offset.toString();
            }

            if (offset > 0) {
                sign = "+";
            } else {
                sign = "-";
            }
            finaltimezone = sign + offsetStr + ":" + offset4index.toString() + "0";


            return finaltimezone;
        }


// change color status of the tasks when we drag them . hadji hicham 08-07-2014.

        $scope.changeColorState = function (event) {


            var oneDay = 24 * 60 * 60 * 1000; // hours*minutes*seconds*milliseconds
            DueDate = new Date(event.start);
            NowDate = new Date(Date.now());


            var diffDays = Math.round((DueDate.getTime() - NowDate.getTime()) / (oneDay));


            if (diffDays >= 0 && diffDays <= 2) {
                event.color = "orange !important"
                event.backgroundColor = "orange !important"
            } else if (diffDays < 0) {
                event.color = "red !important"
                event.backgroundColor = "red !important"
            } else {
                event.color = "green !important"
                event.backgroundColor = "green !important"
            }


        }
// cancel add event operation

        $scope.cancelAddOperation = function () {
            $scope.timezonepicker = false;
            $scope.locationShosen = false;
            var events = $('#calendar').fullCalendar('clientEvents', ["new"]);
            var event = events[events.length - 1];

            $('#calendar').fullCalendar('removeEvents',

                function (event) {

                    if (event.title == "New Event") {

                        return true;
                    }
                    return false;
                }
            );
            $scope.start_event = "";
            $scope.end_event = "";
            $scope.permet_clicking = true;
            $scope.invites = []
            $scope.invite = "";
            $scope.remindme_show = "";
            $scope.show_choice = "";
            $scope.parent_related_to = "";
            $scope.Guest_params = false;
            $scope.searchRelatedQuery = "";
            $scope.something_picked = false;
            $scope.picked_related = false;
            $scope.ioevent = {}
        }


//auto complete

        var invitesparams = {};
        $scope.inviteResults = [];
        $scope.inviteResult = undefined;
        $scope.q = undefined;
        $scope.invite = undefined;
        $scope.$watch('invite', function (newValue, oldValue) {
            if ($scope.invite != undefined) {


                invitesparams['q'] = $scope.invite;
                gapi.client.crmengine.autocomplete(invitesparams).execute(function (resp) {
                    if (resp.items) {

                        $scope.filterInviteResult(resp.items);
                        $scope.$apply();
                    }
                    ;

                });
            }

        });


        $scope.filterInviteResult = function (items) {

            filtredInvitedResult = [];

            for (i in items) {


                if (items[i].emails != "") {
                    var email = items[i].emails.split(" ");
                    if (items[i].title == " ") {
                        items[i].title = items[i].emails.split("@")[0];
                    }

                    if (email.length > 1) {

                        for (var i = email.length - 1; i >= 0; i--) {

                            filtredInvitedResult.push({
                                emails: email[i],
                                id: "",
                                rank: "",
                                title: items[i].title,
                                type: "Gcontact"
                            });
                        }

                    } else {
                        filtredInvitedResult.push(items[i]);
                    }


                }

            }
            $scope.inviteResults = filtredInvitedResult;
            $scope.$apply();
        }

// select invite result
        $scope.selectInviteResult = function () {
            $scope.invite = $scope.invite.emails;

        }

// add invite
        $scope.addInvite = function (invite) {

            $scope.invites.push(invite);
            $scope.checkGuests();
            $scope.invite = "";
        }

        $scope.deleteInvite = function (index) {
            $scope.invites.splice(index, 1);
            $scope.checkGuests();
        }

        $scope.checkGuests = function () {
            if ($scope.invites.length != 0) {
                $scope.Guest_params = true;
            } else {
                $scope.Guest_params = false;
            }
        }
        $scope.checkallday = function () {
            $scope.updateAlldayOption();


        }

        var searchparams = {};
        $scope.results = [];
        $scope.result = undefined;
        $scope.q = undefined;
        $scope.searchRelatedQuery = undefined;
        $scope.$watch('searchRelatedQuery', function () {


            if ($scope.searchRelatedQuery != undefined) {


                searchparams['q'] = $scope.searchRelatedQuery;
                gapi.client.crmengine.search(searchparams).execute(function (resp) {
                    if (resp.items) {
                        $scope.filterResult(resp.items);

                        //$scope.results = resp.items;
                        $scope.$apply();
                    }
                    ;

                });
            }
        });
        $scope.filterResult = function (items) {
            filtredResult = [];
            for (i in items) {
                if (items[i].type == "Lead" || items[i].type == "Contact" || items[i].type == "Account") {
                    filtredResult.push(items[i]);

                }
            }
            $scope.results = filtredResult;
        }
        $scope.parent_related_to = "";
        $scope.selectResult = function () {


            $scope.parent_related_to = $scope.searchRelatedQuery;
            $scope.show_choice = $scope.parent_related_to.title;
            $scope.picked_related = true;
            $scope.searchRelatedQuery = "";


        };

        $scope.deletePicked = function () {
            $scope.something_picked = false;
            $scope.remindme_show = "";
            $scope.remindmeby = false;
        }

        $scope.deleteRelated = function () {
            $scope.picked_related = false;
            $scope.parent_related_to = ""
            $scope.show_choice = "";

        }
        $scope.reminder = 0;
        $scope.Remindme = function (choice) {
            $scope.reminder = 0;
            $scope.something_picked = true;
            $scope.remindmeby = true;
            switch (choice) {
                case 0:
                    $scope.remindme_show = "No notification";
                    $scope.remindmeby = false;
                    break;
                case 1:
                    $scope.remindme_show = "At time of event";
                    $scope.reminder = 1;
                    break;
                case 2:
                    $scope.remindme_show = "30 minutes before";
                    $scope.reminder = 2;
                    break;
                case 3:
                    $scope.remindme_show = "1 hour";
                    $scope.reminder = 3;
                    break;
                case 4:
                    $scope.remindme_show = "1 day";
                    $scope.reminder = 4;
                    break;
                case 5:
                    $scope.remindme_show = "1 week";
                    $scope.reminder = 5;
                    break;
            }

        }

// add event operation
        $scope.addEvent = function (ioevent) {


            if ($scope.newEventClicked) {



                // $scope.start_event=moment($scope.start_event_new).format('YYYY-MM-DDTHH:mm:00.000000');
                // $scope.end_event=moment($scope.end_event_new).format('YYYY-MM-DDTHH:mm:00.000000');

                var eventObject = {
                    title: ioevent.title
                };
                eventObject.id = "new";
                eventObject.start = moment($scope.start_event_new);
                eventObject.end = moment($scope.end_event_new)


                //eventObject.allDay = $scope.allday;

                eventObject.className = $(this).attr("data-class");

                $('#calendar').fullCalendar('renderEvent', eventObject, false);
                $scope.newEventClicked = false;
                $("#newEventModal2").modal('hide');
                $('#newEventModal').modal('hide');

            }
            else {

                $scope.updateEventRender(ioevent);
                $('#newEventModal').modal('hide');
            }

            $scope.permet_clicking = false;

            var params = {};


            if (ioevent.title != "") {

                if ($scope.parent_related_to != "") {

                    params = {
                        'title': ioevent.title,
                        'starts_at': $scope.start_event,
                        'ends_at': $scope.end_event,
                        'where': ioevent.where,
                        'allday': $scope.allday.toString(),
                        'access': $scope.event.access,
                        'description': $scope.ioevent.note,
                        'invites': $scope.invites,
                        'parent': $scope.parent_related_to.entityKey,
                        'guest_modify': $scope.guest_modify.toString(),
                        'guest_invite': $scope.guest_invite.toString(),
                        'guest_list': $scope.guest_list.toString(),
                        'reminder': $scope.reminder,
                        'method': $scope.method,
                        'timezone': $scope.timezoneChosen

                    }
                } else {
                    params = {
                        'title': ioevent.title,
                        'starts_at': $scope.start_event,
                        'ends_at': $scope.end_event,
                        'where': ioevent.where,
                        'allday': $scope.allday.toString(),
                        'access': $scope.event.access,
                        'description': $scope.ioevent.note,
                        'invites': $scope.invites,
                        'guest_modify': $scope.guest_modify.toString(),
                        'guest_invite': $scope.guest_invite.toString(),
                        'guest_list': $scope.guest_list.toString(),
                        'reminder': $scope.reminder,
                        'method': $scope.method,
                        'timezone': $scope.timezoneChosen

                    }

                }

            } else {


                if ($scope.parent_related_to != "") {

                    params = {
                        'starts_at': $scope.start_event,
                        'ends_at': $scope.end_event,
                        'where': ioevent.where,
                        'allday': $scope.allday.toString(),
                        'access': $scope.event.access,
                        'description': $scope.ioevent.note,
                        'invites': $scope.invites,
                        'parent': $scope.parent_related_to.entityKey,
                        'guest_modify': $scope.guest_modify.toString(),
                        'guest_invite': $scope.guest_invite.toString(),
                        'guest_list': $scope.guest_list.toString(),
                        'reminder': $scope.reminder,
                        'method': $scope.method,
                        'timezone': $scope.timezoneChosen
                    }
                } else {
                    params = {
                        'starts_at': $scope.start_event,
                        'ends_at': $scope.end_event,
                        'where': ioevent.where,
                        'allday': $scope.allday.toString(),
                        'access': $scope.event.access,
                        'description': $scope.ioevent.note,
                        'invites': $scope.invites,
                        'guest_modify': $scope.guest_modify.toString(),
                        'guest_invite': $scope.guest_invite.toString(),
                        'guest_list': $scope.guest_list.toString(),
                        'reminder': $scope.reminder,
                        'method': $scope.method,
                        'timezone': $scope.timezoneChosen
                    }

                }

            }
            ;


            Event.insert($scope, params);
            $scope.timezonepicker = false;
            $scope.timezoneChosen = $scope.timezone;
            $scope.invites = []
            $scope.invite = "";
            $scope.remindme_show = "";
            $scope.show_choice = "";
            $scope.parent_related_to = "";
            $scope.Guest_params = false;
            $scope.searchRelatedQuery = "";
            $scope.something_picked = false;
            $scope.picked_related = false;
            $scope.ioevent.where = "";
            $scope.ioevent = {}
            $scope.locationShosen = false;


            $scope.start_event = "";
            $scope.end_event = "";

        }

        $scope.updateAlldayOption = function () {
            $scope.allday = $scope.alldaybox;
            var events = $('#calendar').fullCalendar('clientEvents', ["new"]);
            $('#calendar').fullCalendar('removeEvents', ["new"])
            var eventObject = {
                title: $scope.title_event
            };
            eventObject.id = "new";
            eventObject.start = moment($scope.start_event_draw);


            eventObject.allDay = $scope.alldaybox;

            eventObject.className = $(this).attr("data-class");

            $('#calendar').fullCalendar('renderEvent', eventObject, false);

        }
        $scope.updateEventRender = function (ioevent) {


            var events = $('#calendar').fullCalendar('clientEvents', ["new"]);
            events[0].title = ioevent.title;

            $('#cale0ndar').fullCalendar('updateEvent', events[0]);


            ///  $('#calendar').fullCalendar( 'refetchEvents' );
        };

// hadji hicham 14-07-2014 . update the event after we add .
        $scope.updateEventRenderAfterAdd = function () {

            var events = $('#calendar').fullCalendar('clientEvents', ["new"]);
            $('#calendar').fullCalendar('removeEvents', ["new"])
            var allday = ($scope.justadded.allday == "false") ? false : true;
            var eventObject = {
                id: $scope.justadded.id,
                entityKey: $scope.justadded.entityKey,
                title: $scope.justadded.title,
                start: moment($scope.justadded.starts_at + $scope.justadded.timezone).zone($scope.timezone),
                end: moment($scope.justadded.ends_at + $scope.justadded.timezone).zone($scope.timezone),
                url: '/#/events/show/' + $scope.justadded.id.toString(),
                my_type: "event",
                allDay: allday
            };
            eventObject.className = $(this).attr("data-class");

            $('#calendar').fullCalendar('renderEvent', eventObject, false);

        }


// hadji hicham 30-12-2014 .
        $scope.drawEvent = function () {

        }


//
        // We need to call this to refresh token when user credentials are invalid
        $scope.refreshToken = function () {
            Auth.refreshToken();
        };
        $scope.$watch('event.starts_at', function (newValue, oldValue) {
            $scope.patchDate($scope.event.starts_at);
        });
        $scope.patchDate = function (newValue) {
            var starts_at = $filter('date')(newValue, ['yyyy-MM-ddTHH:mm:00.000000']);
            var params = {
                'entityKey': $scope.event.entityKey,
                'starts_at': starts_at
            };
            if ((!$scope.isLoading) && (params.entityKey != undefined )) {
                Event.patch($scope, params);
            }
        }
        $scope.listNextPageItemscomment = function () {

            console.log('i am in list next comment page')
            var nextPage = $scope.currentPagecomment + 1;

            var params = {};
            if ($scope.pagescomment[nextPage]) {
                params = {
                    'limit': 5,
                    'discussion': $scope.eventt.entityKey,
                    'order': '-updated_at',
                    'pageToken': $scope.pagescomment[nextPage]
                }
            } else {
                params = {
                    'limit': 5,
                    'discussion': $scope.eventt.entityKey,
                    'order': '-updated_at',
                }
            }
            console.log('in listNextPageItems');
            $scope.currentPagecomment = $scope.currentPagecomment + 1;
            Comment.list($scope, params);
        }

        $scope.listPrevPageItemscomment = function () {

            var prevPage = $scope.currentPagecomment - 1;
            var params = {};
            if ($scope.pagescomment[prevPage]) {
                params = {
                    'limit': 5,
                    'discussion': $scope.eventt.entityKey,
                    'order': '-updated_at',
                    'pageToken': $scope.pagescomment[prevPage]
                }
            } else {
                params = {
                    'limit': 5,
                    'order': '-updated_at',
                    'discussion': $scope.eventt.entityKey
                }
            }
            $scope.currentPagecomment = $scope.currentPagecomment - 1;
            Comment.list($scope, params);
        };

        $scope.renderMaps = function () {
            console.log("hhhhhhhhhhhhh");
            Map.render($scope);
            //Map.searchLocation($scope,$scope.event.where);
        };


        $scope.showModal = function () {
            console.log('button clicked');
            $('#addAccountModal').modal('show');

        };

        $scope.addComment = function (comment) {

            var params = {
                'about': $scope.event.entityKey,
                'content': $scope.comment.content
            };
            Comment.insert($scope, params);
            $scope.comment.content = '';


        };

        //HKA 18.11.2013 highlight the comment
        $scope.hilightComment = function () {
            console.log('Should higll');
            $('#comment_0').effect("bounce", "slow");
            $('#comment_0 .message').effect("highlight", "slow");
        };

        //HKA 02.12.2013 Add Contributor

        $scope.addNewContributor = function (selected_user, role) {


            var params = {
                'discussionKey': $scope.eventt.entityKey,

                'type': 'user',
                'value': selected_user.email,
                'name': selected_user.google_display_name,
                'photoLink': selected_user.google_public_profile_photo_url,
                'role': role


                // Create Contributor Service
                // Create contributors.list api
                //list all contributors after getting the task.
            }
            console.log('selected member');
            console.log(params);
            Contributor.insert($scope, params);
            $('#addContributor').modal('hide');
        };
//HKA 02.12.2013 Select member
        ;
//HKA 02.12.2013 List contributors
        $scope.listContributors = function () {
            var params = {
                'discussionKey': $scope.eventt.entityKey,
                'order': '-created_at'
            };
            Contributor.list($scope, params);
        };
//HKA 20.01.2014 Add
        $scope.getshow = function (showId) {
            var show = Show.get($scope.showId);
            return show;

        }

        // Google+ Authentication
        Auth.init($scope);
    }]);
