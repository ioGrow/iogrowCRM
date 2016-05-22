var leadservices = angular.module('crmEngine.leadservices', []);

leadservices.factory('Lead', function ($rootScope) {

    var Lead = function (data) {
        angular.extend(this, data);
    };

    Lead.wizard = function ($scope) {
        trackMixpanelAction('LEAD_LAUNCH_WIZARD');
        Lead.$scope = $scope;
        localStorage['completedTour'] = 'True';
        var tour = {
            id: "hello-hopscotch",
            steps: [
                {
                    title: "Leads",
                    content: "Use leads to easily track interesting people. You can add notes, set reminders or send emails",
                    target: "id_Leads",
                    placement: "right"
                },
                {
                    title: "Opportunities",
                    content: "The Opportunities tab is where we go to view the deals being tracked in ioGrow.",
                    target: "id_Opportunities",
                    placement: "right"
                } ,
                {
                    title: "Contacts",
                    content: "All individuals associated with an Account.",
                    target: "id_Contacts",
                    placement: "right"
                },

                {
                    title: "Accounts",
                    content: "All organizations involved with your business (such as customers, competitors, and partners)",
                    target: "id_Accounts",
                    placement: "right"
                },


                {
                    title: "Cases",
                    content: "All your customers issues such as a customer’s feedback, problem, or question.",
                    target: "id_Cases",
                    placement: "right"
                },
                {
                    title: "Tasks",
                    content: "All activities or to-do items to perform or that has been performed.",
                    target: "id_Tasks",
                    placement: "right"
                },
                {
                    title: "Calendar",
                    content: "Manage your calendar and create events",
                    target: "id_Calendar",
                    placement: "right"
                }
            ],
            onEnd: function () {
                var userId = document.getElementById("userId").value;

                if (userId) {
                    var params = {'id': parseInt(userId), 'completed_tour': true};
                    User.completedTour(Lead.$scope, params);
                }
                $('#installChromeExtension').modal("show");
            }
        };
        // Start the tour!
        hopscotch.startTour(tour);
    };

    Lead.get = function ($scope, params) {
        $scope.inProcess(true);
        $scope.getColaborators()
        gapi.client.request({
            'root': ROOT,
            'path': '/crmengine/v1/leads/getv2',
            'method': 'POST',
            'body': params,
            'callback': (function (resp) {
                if (!resp.code) {
                    $scope.lead = resp;


                    $scope.isContentLoaded = true;
                    if (resp.profile_img_url) {
                        $scope.imageSrc = resp.profile_img_url;
                    } else {
                        $scope.imageSrc = '/static/src/img/avatar_contact.jpg';
                    }
                    //$scope.renderMaps();
                    var renderMap = false;
                     var past_pos=[];
                     if (!$scope.lead.linkedin_profile) {
                        $scope.lead.linkedin_profile={};
                     };
                    if ($scope.lead.linkedin_profile.past_post) {
                         angular.forEach($scope.lead.linkedin_profile.past_post, function(position){
                              past_pos.push(JSON.parse(position));
                        });
                         $scope.lead.linkedin_profile.past_post=past_pos;
                         past_pos=null;
                    }
                    var cur_pos=[];
                    if ($scope.lead.linkedin_profile.current_post) {
                       angular.forEach($scope.lead.linkedin_profile.current_post, function(position){
                            cur_pos.push(JSON.parse(position)); 
                        });
                       $scope.lead.linkedin_profile.current_post=cur_pos;
                       cur_pos=null;
                    }
                    var skills=[];
                    if ($scope.lead.linkedin_profile.skills) {
                       angular.forEach($scope.lead.linkedin_profile.skills, function(position){
                             skills.push(JSON.parse(position)); 
                        });
                       $scope.lead.linkedin_profile.skills=skills;
                        skills=null;
                    }
                    var formations=[];
                    if ($scope.lead.linkedin_profile.formations) {
                        angular.forEach($scope.lead.linkedin_profile.formations, function(position){
                             formations.push(JSON.parse(position));  
                        });
                        $scope.lead.linkedin_profile.formations=formations;
                        formations=null;
                    }  
                    var languages=[];
                    if ($scope.lead.linkedin_profile.languages) {
                        angular.forEach($scope.lead.linkedin_profile.languages, function(language){
                             languages.push(JSON.parse(language));  
                        });
                        $scope.lead.linkedin_profile.languages=languages;
                        languages=null;
                    } 
                    $scope.linkedProfileresume=$scope.lead.linkedin_profile.resume;
                    if (resp.infonodes) {

                        if (resp.infonodes.items) {
                            for (var i = 0; i < resp.infonodes.items.length; i++) {
                                if (resp.infonodes.items[i].kind == 'addresses') {
                                    renderMap = true;
                                }
                                $scope.infonodes[resp.infonodes.items[i].kind] = resp.infonodes.items[i].items;
                                for (var j = 0; j < $scope.infonodes[resp.infonodes.items[i].kind].length; j++) {
                                    for (var v = 0; v < $scope.infonodes[resp.infonodes.items[i].kind][j].fields.length; v++) {
                                        $scope.infonodes[resp.infonodes.items[i].kind][j][$scope.infonodes[resp.infonodes.items[i].kind][j].fields[v].field] = $scope.infonodes[resp.infonodes.items[i].kind][j].fields[v].value;
                                        $scope.infonodes[resp.infonodes.items[i].kind][j]['entityKey'] = $scope.infonodes[resp.infonodes.items[i].kind][j].entityKey;
                                    }
                                }
                            }
                            if ($scope.infonodes.sociallinks) {
                                var linkedinExist = false;
                                angular.forEach($scope.infonodes.sociallinks, function (sociallink) {

                                    if ($scope.linkedinUrl(sociallink.url)) {
                                        linkedinExist = true;
                                        $scope.infonodes.sociallinks.splice($scope.infonodes.sociallinks.indexOf(sociallink), 1);
                                        $scope.infonodes.sociallinks.unshift(sociallink);
                                    } else {
                                        if ($scope.twitterUrl(sociallink.url)) {
                                            if (linkedinExist) {
                                                $scope.infonodes.sociallinks.splice($scope.infonodes.sociallinks.indexOf(sociallink), 1);
                                                $scope.infonodes.sociallinks.splice(2, 0, sociallink);
                                            } else {
                                                $scope.infonodes.sociallinks.splice($scope.infonodes.sociallinks.indexOf(sociallink), 1);
                                                $scope.infonodes.sociallinks.unshift(sociallink);
                                            }
                                            ;

                                        }
                                        ;
                                    }
                                    ;
                                });
                            }
                        }
                        // $scope.renderMaps();
                    }
                    $scope.getCustomFields('leads');
                    if (resp.topics) {
                        if (params.topics.pageToken) {
                            angular.forEach(resp.topics.items, function (item) {
                                $scope.topics.push(item);
                            });
                        }
                        else {
                            $scope.topics = resp.topics.items;
                        }

                        $scope.topicpagination.prev = $scope.topicCurrentPage > 1;
                        if (resp.topics.nextPageToken) {
                            var nextPage = $scope.topicCurrentPage + 1;
                            // Store the nextPageToken
                            $scope.topicpages[nextPage] = resp.topics.nextPageToken;
                            $scope.topicpagination.next = true;

                        } else {
                            $scope.topicpagination.next = false;
                        }
                    }
                    if (resp.documents) {
                        if (!resp.documents.items) {
                            $scope.blankStatdocuments = true;
                        }
                        if (params.documents.pageToken) {
                            angular.forEach(resp.documents.items, function (item) {
                                $scope.documents.push(item);
                            });
                        }
                        else {
                            $scope.documents = resp.documents.items;
                        }
                        $scope.documentpagination.prev = $scope.documentCurrentPage > 1;
                        if (resp.documents.nextPageToken) {

                            var nextPage = $scope.documentCurrentPage + 1;
                            // Store the nextPageToken
                            $scope.documentpages[nextPage] = resp.documents.nextPageToken;
                            $scope.documentpagination.next = true;

                        } else {
                            $scope.documentpagination.next = false;
                        }
                    }else{
                        $scope.blankStatdocuments = true;
                    }
                    if (resp.opportunities&&!jQuery.isEmptyObject(resp.opportunities)&&resp.opportunities.items) {
                        if (params.opportunities.pageToken) {
                            angular.forEach(resp.opportunities.items, function (item) {
                                $scope.opportunities.push(item);
                            });
                        }else {
                            $scope.opportunities = resp.opportunities.items;
                        }
                        $scope.opppagination.prev = $scope.oppCurrentPage > 1;
                        if (resp.opportunities.nextPageToken) {
                            var nextPage = $scope.oppCurrentPage + 1;
                            // Store the nextPageToken
                            $scope.opppages[nextPage] = resp.opportunities.nextPageToken;
                            $scope.opppagination.next = true;

                        } else {
                            $scope.opppagination.next = false;
                        }

                    }else{
                        $scope.blankStateopportunity = true;
                    }

                    if (resp.tasks) {
                        $scope.tasks = resp.tasks.items;
                    } else {
                        $scope.tasks = [];
                    }

                    if (resp.events) {
                        $scope.events = resp.events.items;
                    } else {
                        $scope.events = [];
                    }
                    // $scope.listTopics(resp);
                    // $scope.listTasks();
                    // $scope.listEvents();
                    // $scope.listDocuments();
                    // $scope.listInfonodes();

                    //$scope.renderMaps();
                    //$scope.DrawPsychometrics();

                    $scope.email.to = '';


                    document.title = "Lead: " + $scope.lead.firstname + ' ' + $scope.lead.lastname;
                    var invites = new Array();
                    angular.forEach($scope.infonodes.emails, function (value, key) {
                        var inviteOnHangoutByEmail = {'id': value.email, 'invite_type': 'EMAIL'};
                        invites.push(inviteOnHangoutByEmail);
                        $scope.email.to = $scope.email.to + value.email + ',';
                    });

                    gapi.hangout.render('placeholder-div1', {
                        'render': 'createhangout',
                        'invites': invites,
                        'widget_size': 72
                    });
                    $scope.inProcess(false);
                    //$scope.renderMaps();
                    $scope.getLinkedinProfile();
                    $scope.getTwitterProfile();

                    // Call the method $apply to make the update on the scope
                    $scope.apply();
                    if (resp.topics && !params.topics.pageToken) {
                        $scope.hilightTopic();
                    }
                    ;
                    // if (resp.tasks){
                    //     $scope.hilightTask();
                    // }
                    // if (resp.events){
                    //     $scope.hilightEvent();
                    // }
                } else {
                    if (resp.code == 401) {
                        // $scope.refreshToken();
                        $scope.inProcess(false);
                        $scope.apply();
                    }
                    ;
                }

                $scope.getColaborators();
            })
        });
    };

    Lead.disocver_check = function () {
    };

    Lead.get_linkedin = function ($scope, params) {
        $scope.inProcess(true);
        gapi.client.request({
            'root': ROOT,
            'path': '/crmengine/v1/people/linkedinProfile',
            'method': 'POST',
            'body': params,
            'callback': (function (resp) {
                if (!resp.code) {
                    $scope.linkedProfile.firstname = resp.firstname;
                    $scope.linkedProfile.lastname = resp.lastname;
                    $scope.linkedProfile.headline = resp.headline;
                    $scope.linkedProfile.formations = resp.formations
                    $scope.linkedProfile.locality = resp.locality;
                    $scope.linkedProfile.relation = resp.relation;
                    $scope.linkedProfile.industry = resp.industry;
                    $scope.linkedProfile.resume = resp.resume;
                    $scope.linkedProfile.skills = resp.skills;
                    $scope.linkedProfile.current_post = resp.current_post;
                    $scope.linkedProfile.past_post = resp.past_post;
                    $scope.linkedProfile.certifications = JSON.parse(resp.certifications);
                    $scope.linkedProfile.experiences = JSON.parse(resp.experiences);
                    $scope.inProcess(false);
                    $scope.apply();
                } else {
                    if (resp.code == 401) {
                        $scope.inProcess(false);
                        $scope.apply();
                    }
                }
            })

        });

    };

    Lead.get_twitter = function ($scope, params) {
        $scope.inProcess(true);
        gapi.client.request({
            'root': ROOT,
            'path': '/crmengine/v1/people/twitterprofile',
            'method': 'POST',
            'body': params,
            'callback': (function (resp) {
                if (!resp.code) {
                    $scope.twitterProfile.id = resp.id;
                    $scope.twitterProfile.followers_count = resp.followers_count;
                    $scope.twitterProfile.last_tweet_text = resp.last_tweet_text;
                    $scope.twitterProfile.last_tweet_favorite_count = resp.last_tweet_favorite_count;
                    $scope.twitterProfile.last_tweet_retweeted = resp.last_tweet_retweeted;
                    $scope.twitterProfile.last_tweet_retweet_count = resp.last_tweet_retweet_count;
                    $scope.twitterProfile.language = resp.language;
                    $scope.twitterProfile.created_at = resp.created_at;
                    $scope.twitterProfile.nbr_tweets = resp.nbr_tweets;
                    $scope.twitterProfile.description_of_user = resp.description_of_user;
                    $scope.twitterProfile.friends_count = resp.friends_count;
                    $scope.twitterProfile.name = resp.name;
                    $scope.twitterProfile.screen_name = resp.screen_name;
                    $scope.twitterProfile.url_of_user_their_company = resp.url_of_user_their_company;
                    $scope.twitterProfile.location = resp.location;
                    $scope.twitterProfile.profile_image_url_https = resp.profile_image_url_https;
                    $scope.twitterProfile.lang = resp.lang;
                    $scope.inProcess(false);
                    $scope.apply();
                } else {
                    if (resp.code == 401) {
                        // $scope.refreshToken();
                        $scope.inProcess(false);
                        $scope.apply();
                    }
                    ;
                }

            })
        });
    };
    Lead.patch = function ($scope, params) {
        trackMixpanelAction('LEAD_SHOW_PATCH');
        $scope.inProcess(true);
        gapi.client.request({
            'root': ROOT,
            'path': '/crmengine/v1/leads/patch',
            'method': 'POST',
            'body': params,
            'callback': (function (resp) {
                if (resp) {
                    if (!resp.code) {
                    for (var k in params) {
                        if (k != 'id' && k != 'entityKey') {
                            $scope.lead[k] = resp[k];
                        }
                    }
                    var past_pos=[];
                     if (!$scope.lead.linkedin_profile) {
                        $scope.lead.linkedin_profile={};
                     };
                    if ($scope.lead.linkedin_profile.past_post) {
                         angular.forEach($scope.lead.linkedin_profile.past_post, function(position){
                              past_pos.push(JSON.parse(position));
                        });
                         $scope.lead.linkedin_profile.past_post=past_pos;
                         past_pos=null;
                    }
                    var cur_pos=[];
                    if ($scope.lead.linkedin_profile.current_post) {
                       angular.forEach($scope.lead.linkedin_profile.current_post, function(position){
                            cur_pos.push(JSON.parse(position)); 
                        });
                       $scope.lead.linkedin_profile.current_post=cur_pos;
                       cur_pos=null;
                    }
                    var skills=[];
                    if ($scope.lead.linkedin_profile.skills) {
                       angular.forEach($scope.lead.linkedin_profile.skills, function(position){
                             skills.push(JSON.parse(position)); 
                        });
                       $scope.lead.linkedin_profile.skills=skills;
                        skills=null;
                    }
                    var formations=[];
                    if ($scope.lead.linkedin_profile.formations) {
                        angular.forEach($scope.lead.linkedin_profile.formations, function(position){
                             formations.push(JSON.parse(position));  
                        });
                        $scope.lead.linkedin_profile.formations=formations;
                        formations=null;
                    }  
                    var languages=[];
                    if ($scope.lead.linkedin_profile.languages) {
                        angular.forEach($scope.lead.linkedin_profile.languages, function(language){
                             languages.push(JSON.parse(language));  
                        });
                        $scope.lead.linkedin_profile.languages=languages;
                        languages=null;
                    } 
                    $scope.linkedProfileresume=$scope.lead.linkedin_profile.resume;
                    $scope.email.to = '';
                    angular.forEach($scope.lead.emails, function (value, key) {
                        $scope.email.to = $scope.email.to + value.email + ',';

                    });
                    $scope.inProcess(false);
                    $scope.apply();
                } else {
                    if (resp.code == 401) {
                        $scope.refreshToken();
                        $scope.inProcess(false);
                        $scope.apply();
                    }
                }
                }
                $scope.getColaborators();
            })

        });

    };
    Lead.filterByTags = function ($scope, params) {
        trackMixpanelAction('LEAD_LIST_FILTERBYTAGS');
        $scope.isMoreItemLoading = true;
        $scope.inProcess(true);
        var callback = function (resp) {

                if (!resp.code) {
                    if (!resp.items) {

                        if (!$scope.isFiltering) {
                            $scope.blankStatelead = true;
                        }

                    }
                    else {
                        $scope.blankStatelead = false;
                    }
                    $scope.leads = resp.items;
                    $scope.leadpagination.prev = $scope.currentPage > 1;
                    if (resp.nextPageToken) {
                        var nextPage = $scope.currentPage + 1;
                        // Store the nextPageToken

                        $scope.pages[nextPage] = resp.nextPageToken;

                        $scope.leadpagination.next = true;

                    } else {
                        $scope.leadpagination.next = false;
                    }
                    // Call the method $apply to make the update on the scope
                    $scope.isMoreItemLoading = false;
                    $scope.isFiltering = false;
                    $scope.inProcess(false);
                    $scope.apply();
                    $('#leadCardsContainer').trigger('resize');
                    setTimeout(function () {
                        var myDiv = $('.autoresizeName');
                        if (myDiv.length) {
                            myDiv.css({'height': 'initial', 'maxHeight': '33px'});
                        }
                    }, 100);

                } else {
                    if (resp.code == 401) {
                        $scope.refreshToken();
                        $scope.inProcess(false);
                        $scope.apply();
                    }
                    ;
                }
        };
        gapi.client.request({
            'root': ROOT,
            'path': '/crmengine/v1/leads/listv2',
            'method': 'POST',
            'body': params,
            'callback': callback

        });
    };
    Lead.list = function ($scope, params) {
        var callback = function (resp) {
            if (!resp.code) {
                if (!resp.items) {
                    if (!$scope.isFiltering) {
                        $scope.blankStatelead = true;
                         $scope.filterNoResult=false;
                    }else{
                        $scope.filterNoResult=true;
                         $scope.blankStatelead = false;
                    }
                }else {
                        $scope.blankStatelead = false;
                         $scope.filterNoResult=false;
                    }
                $scope.leads = resp.items;
                $scope.leadpagination.prev = $scope.currentPage > 1;
                if (resp.nextPageToken) {
                    var nextPage = $scope.currentPage + 1;
                    // Store the nextPageToken

                    $scope.pages[nextPage] = resp.nextPageToken;

                    $scope.leadpagination.next = true;

                } else {
                    $scope.leadpagination.next = false;
                }
                // Call the method $apply to make the update on the scope
                $scope.isMoreItemLoading = false;
                $scope.isFiltering = false;
                 $( '#leadCardsContainer' ).trigger('resize');
                /*$('#leadCardsContainer').trigger('resize');
                setTimeout(function () {
                    var myDiv = $('.autoresizeName');
                    if (myDiv.length) {
                        myDiv.css({'height': 'initial', 'maxHeight': '33px'});
                    }
                }, 100);*/
                $scope.inProcess(false);
                $scope.apply();

            } else {
                if (resp.code == 401) {
                    $scope.refreshToken();
                    $scope.inProcess(false);
                    $scope.apply();
                }
                ;
            }
        };
        if ((params.tags) || (params.owner) ||(params.source)  || (params.order != '-updated_at')) {
            var updateCache = callback;
        } else {
            var updateCache = function (resp) {
                // Update the cache
                iogrow.ioStorageCache.renderIfUpdated('leads', resp, callback);
            };
            var resp = iogrow.ioStorageCache.read('leads');
            callback(resp);
        }
        // $scope.isMoreItemLoading = true;
        $scope.inProcess(true);
        $scope.apply();
        gapi.client.request({
            'root': ROOT,
            'path': '/crmengine/v1/leads/listv2',
            'method': 'POST',
            'body': params,
            'callback': updateCache
        });


    };
    Lead.listMore = function ($scope, params) {
        $scope.isMoreItemLoading = true;
        $(window).trigger("resize");
        $scope.apply();
        gapi.client.request({
            'root': ROOT,
            'path': '/crmengine/v1/leads/listv2',
            'method': 'POST',
            'body': params,
            'callback': (function (resp) {
                if (!resp.code) {
                    angular.forEach(resp.items, function (item) {
                        $scope.leads.push(item);
                    });
                    $scope.leadpagination.prev = $scope.currentPage > 1;
                    if (resp.nextPageToken) {
                        var nextPage = $scope.currentPage + 1;
                        // Store the nextPageToken
                        $scope.pages[nextPage] = resp.nextPageToken;

                        $scope.leadpagination.next = true;

                    } else {
                        $scope.leadpagination.next = false;
                    }
                    // Call the method $apply to make the update on the scope
                    $scope.isMoreItemLoading = false;
                    $scope.isFiltering = false;

                    $scope.apply();
                    $('#leadCardsContainer').trigger('resize');
                    setTimeout(function () {
                        var myDiv = $('.autoresizeName');
                        if (myDiv.length) {
                            myDiv.css({'height': 'initial', 'maxHeight': '33px'});

                        }
                    }, 100);
                } else {
                    if (resp.code == 401) {
                        $scope.refreshToken();
                        $scope.isMoreItemLoading = false;
                    }
                    ;
                }
            })
        });
        $scope.apply();
    };
    Lead.filterByFirstAndLastName = function ($scope, params, callback) {
        $scope.inProcess(true);
        $scope.apply();
        gapi.client.request({
            'root': ROOT,
            'path': '/crmengine/v1/leads/filter',
            'method': 'POST',
            'body': params,
            'callback': (function (resp) {
                if (!resp.code) {
                    console.log(resp);
                    callback(resp.items);
                } else {
                    $('#addLeadModal').modal('hide');
                    $('#errorModal').modal('show');
                    if (resp.message == "Invalid grant") {
                        $scope.refreshToken();
                    }
                    ;
                }
                $scope.inProcess(false);
                $scope.apply();
            })
        });
    };
    Lead.mergeLead = function ($scope, params) {
        $scope.isLoading = true;
        $scope.apply();
        gapi.client.request({
            'root': ROOT,
            'path': '/crmengine/v1/leads/merge',
            'method': 'POST',
            'body': params,
            'callback': (function (resp) {
                $scope.isLoading = false;
                $scope.apply();
                if (!resp.code) {
                    $scope.mergedLeads++;
                    if ($scope.mergedLeads == $scope.similarLeads.length) {
                        $('#sameLeadModal').modal("hide");
                        $('body').removeClass('modal-open');
                        $('.modal-backdrop').remove();
                        window.location.replace('/#/leads/show/' + resp.id);
                    }
                }
            })
        });

    };

    Lead.create = function ($scope, params, force) {
        if (!force) {
            Lead.filterByFirstAndLastName($scope, params, function (similarLeads) {
                if (similarLeads) {
                    if (similarLeads.length) {
                        $scope.similarLeads = similarLeads;
                        $("#sameLeadModal").modal("show");
                        $scope.apply();
                    } else {
                        Lead.insert($scope, params);
                    }
                } else {
                    Lead.insert($scope, params);
                }
            });
        } else {
            Lead.insert($scope, params);
        }
    };

    Lead.insert = function ($scope, params) {
        mixpanel.init("793d188e5019dfa586692fc3b312e5d1", { 'loaded' : function() { incrementer('NUMBER_LEAD');} });
        trackMixpanelAction('LEAD_INSERT');
        //incrementer('NUMBER_LEAD');
        $scope.inProcess(true);
        $scope.apply();
        gapi.client.request({
            'root': ROOT,
            'path': '/crmengine/v1/leads/insertv2',
            'method': 'POST',
            'body': params,
            'callback': (function (resp) {
                if (resp.error && resp.error.code == 412){
                    $('#payment_modal').modal('show');
                    return
                    //window.location.replace($rootScope.subscription_url);
                } if (!resp.code && resp.id) {
                    $scope.leadInserted(resp.id);
                } else if (!resp.id) {
                    console.log(resp);
                    $scope.orginalUser = resp;
                } else {
                    $('#addLeadModal').modal('hide');
                    $('body').removeClass('modal-open');
                    $('.modal-backdrop').remove();
                    $('#errorModal').modal('show');
                    if (resp.message == "Invalid grant") {
                        $scope.refreshToken();
                    }
                    ;
                }
            })
        });
        $scope.inProcess(false);
        $scope.apply();
    };
    Lead.convert = function ($scope, params) {
        trackMixpanelAction('LEAD_CONVERT');
        $scope.inProcess(true);
        $scope.apply();
        gapi.client.crmengine.leads.convertv2(params).execute(function (resp) {
            if (!resp.code) {
                $('#convertLeadModal').modal('hide');
                console.log(resp);
                $scope.inProcess(false);
                $scope.apply();
                $scope.leadConverted(resp.id);
            } else {
                $('#addLeadModal').modal('hide');
                $('#errorModal').modal('show');
                if (resp.message == "Invalid grant") {
                };
            }

        });
    };

    Lead.import = function ($scope, params) {
        trackMixpanelAction('LEAD_LIST_IMPORT');
        $scope.inProcess(true);
        $scope.apply();
        gapi.client.crmengine.leads.import(params).execute(function (resp) {
            if (!resp.code) {
                $scope.isContentLoaded = true;
                $scope.numberOfRecords = resp.number_of_records;
                $scope.mappingColumns = resp.items;
                $scope.job_id = resp.job_id;
                $scope.doTheMapping(resp);
                $scope.inProcess(false);
                $scope.apply();
            } else {
                $('#errorModal').modal('show');
                if (resp.code == 401) {
                    $scope.refreshToken();
                    $scope.inProcess(false);
                    $scope.apply();

                }
                ;

            }
        });
    };
    Lead.importSecondStep = function ($scope, params) {
        $scope.inProcess(true);
        $scope.apply();
        gapi.client.crmengine.leads.import_from_csv_second_step(params).execute(function (resp) {
            if (!resp.code) {
                console.log(resp);
                $scope.showImportMessages();
                $scope.inProcess(false);
                $scope.apply();
            } else {
                $('#errorModal').modal('show');
                if (resp.code == 401) {
                    $scope.refreshToken();
                    $scope.inProcess(false);
                    $scope.apply();

                }
                ;

            }
        });
    };
    Lead.export = function ($scope, params) {
        trackMixpanelAction('LEAD_LIST_EXPORT');
        //$("#load_btn").attr("disabled", "true");
        //$("#close_btn").attr("disabled", "true");
        $scope.isExporting = true;
        gapi.client.crmengine.leads.export(params).execute(function (resp) {
            if (!resp.code) {
                //$scope.DataLoaded(resp.items)
                console.log("request ssent")

            } else {

            }
        });
    }
    Lead.export_key = function ($scope, params) {
        //$("#load_btn").attr("disabled", "true");
        //$("#close_btn").attr("disabled", "true");
        $scope.isExporting = true;
        gapi.client.crmengine.leads.export_keys(params).execute(function (resp) {
            if (!resp.code) {
                //$scope.DataLoaded(resp.items)
                console.log("request ssent")

            } else {

            }
        });
    }

    Lead.delete = function ($scope, params) {
        trackMixpanelAction('LEAD_DELETE');
        $scope.inProcess(true);
        gapi.client.crmengine.leads.delete(params).execute(function (resp) {
                $scope.leadDeleted(params.entityKey);

            }
        )
        $scope.inProcess(false);
        $scope.apply();
    };
    Lead.deleteAll = function ($scope) {
        //trackMixpanelAction('LEAD_DELETE');
        $scope.isLoading=true;
        gapi.client.crmengine.leads.delete_all().execute(function (resp) {
                $scope.allLeadsDeleted();
                $scope.isLoading=false;
                     $scope.apply();
            }
        )
        
    };


    return Lead;
});

