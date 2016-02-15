var contactservices = angular.module('crmEngine.contactservices', []);
accountservices.factory('Contact', function ($http) {

    var Contact = function (data) {
        angular.extend(this, data);
    }


    Contact.get = function ($scope, params) {
        $scope.inProcess(true);
        $scope.apply();
        gapi.client.crmengine.contacts.getv2(params).execute(function (resp) {
            if (!resp.code) {
                $scope.contact = resp;
                $scope.getColaborators();
                if (resp.account) {
                    $scope.searchAccountQuery = resp.account.name;
                }
                // list infonodes
                var renderMap = false;
                var past_pos=[];
                if (!$scope.contact.linkedin_profile) {
                        $scope.contact.linkedin_profile={};
                     };
                if ($scope.contact.linkedin_profile.past_post) {
                     angular.forEach($scope.contact.linkedin_profile.past_post, function(position){
                          past_pos.push(JSON.parse(position));
                    });
                     $scope.contact.linkedin_profile.past_post=past_pos;
                     past_pos=null;
                }
                var cur_pos=[];
                if ($scope.contact.linkedin_profile.current_post) {
                   angular.forEach($scope.contact.linkedin_profile.current_post, function(position){
                        cur_pos.push(JSON.parse(position)); 
                    });
                   $scope.contact.linkedin_profile.current_post=cur_pos;
                   cur_pos=null;
                }
                var skills=[];
                if ($scope.contact.linkedin_profile.skills) {
                   angular.forEach($scope.contact.linkedin_profile.skills, function(position){
                         skills.push(JSON.parse(position)); 
                    });
                   $scope.contact.linkedin_profile.skills=skills;
                    skills=null;
                }
                var formations=[];
                if ($scope.contact.linkedin_profile.formations) {
                    angular.forEach($scope.contact.linkedin_profile.formations, function(position){
                         formations.push(JSON.parse(position));  
                    });
                    $scope.contact.linkedin_profile.formations=formations;
                    forms=null;
                }
                var languages=[];
                if ($scope.contact.linkedin_profile.languages) {
                    angular.forEach($scope.contact.linkedin_profile.languages, function(language){
                         languages.push(language);  
                    });
                    $scope.contact.linkedin_profile.languages=languages;
                    languages=null;
                } 
                $scope.linkedProfileresume=$scope.contact.linkedin_profile.resume;
                if (resp.infonodes) {
                    console.log("infonodes");
                    console.log(resp.infonodes);
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
                            angular.forEach($scope.infonodes.sociallinks, function (sociallink) {
                                if ($scope.linkedinUrl(sociallink.url)) {
                                    $scope.infonodes.sociallinks.splice($scope.infonodes.sociallinks.indexOf(sociallink), 1);
                                    $scope.infonodes.sociallinks.unshift(sociallink);
                                }
                                ;
                            });
                        }
                        ;

                    }
                }
                $scope.getCustomFields('contacts');
                console.log('cus cus');
                console.log($scope.contact);
                if (resp.topics) {
                    if (params.topics.pageToken) {
                        angular.forEach(resp.topics.items, function (item) {
                            $scope.topics.push(item);
                        });
                    }
                    else {
                        $scope.topics = resp.topics.items;
                    }

                    if ($scope.topicCurrentPage > 1) {
                        console.log('Should show PREV');
                        $scope.topicpagination.prev = true;
                    } else {
                        $scope.topicpagination.prev = false;
                    }
                    if (resp.topics.nextPageToken) {
                        var nextPage = $scope.topicCurrentPage + 1;
                        // Store the nextPageToken
                        $scope.topicpages[nextPage] = resp.topics.nextPageToken;
                        $scope.topicpagination.next = true;

                    } else {
                        $scope.topicpagination.next = false;
                    }
                }

                if (resp.opportunities) {
                    if (!resp.opportunities.items) {
                        $scope.blankStateopportunity = true;
                    }
                    if (params.opportunities.pageToken) {
                        angular.forEach(resp.opportunities.items, function (item) {
                            $scope.opportunities.push(item);
                        });
                    }
                    else {
                        $scope.opportunities = resp.opportunities.items;
                    }
                    if ($scope.oppCurrentPage > 1) {
                        $scope.opppagination.prev = true;
                    } else {
                        $scope.opppagination.prev = false;
                    }
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

                if (resp.cases) {
                    if (!resp.cases.items) {
                        $scope.blankStatecase = true;
                    }
                    if (params.cases.pageToken) {
                        angular.forEach(resp.cases.items, function (item) {
                            $scope.cases.push(item);
                        });
                    }
                    else {
                        $scope.cases = resp.cases.items;
                    }
                    if ($scope.caseCurrentPage > 1) {
                        $scope.casepagination.prev = true;
                    } else {
                        $scope.casepagination.prev = false;
                    }
                    if (resp.cases.nextPageToken) {
                        var nextPage = $scope.caseCurrentPage + 1;
                        // Store the nextPageToken
                        $scope.casepages[nextPage] = resp.cases.nextPageToken;
                        $scope.casepagination.next = true;

                    } else {
                        $scope.casepagination.next = false;
                    }

                }else{
                     $scope.blankStatecase = true;
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
                    if ($scope.documentCurrentPage > 1) {
                        $scope.documentpagination.prev = true;
                    } else {
                        $scope.documentpagination.prev = false;
                    }
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
                if (resp.profile_img_url) {
                    $scope.imageSrc = resp.profile_img_url;
                } else {
                    $scope.imageSrc = '/static/img/avatar_contact.jpg';
                }
                $scope.isContentLoaded = true;

                //$scope.listInfonodes();
                // $scope.listTopics(resp);
                // $scope.listTasks();
                // $scope.listEvents();
                // $scope.listOpportunities();
                // $scope.listCases();
                // $scope.listDocuments();

                //$scope.renderMaps();

                document.title = "Contact: " + $scope.contact.firstname + ' ' + $scope.contact.lastname;
                $scope.email.to = '';
                var invites = new Array();
                angular.forEach($scope.infonodes.emails, function (value, key) {
                    var inviteOnHangoutByEmail = {'id': value.email, 'invite_type': 'EMAIL'};
                    invites.push(inviteOnHangoutByEmail);
                    $scope.email.to = $scope.email.to + value.email + ',';
                });

                gapi.hangout.render('placeholder-div1', {
                    'render': 'createhangout',
                    'invites': invites
                });


                //$scope.renderMaps();
                // Call the method $apply to make the update on the scope
                $scope.inProcess(false);
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
                $scope.getLinkedinProfile();
                $scope.getTwitterProfile();

                console.log('hhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhere contact');
                console.log($scope.contact);

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
    Contact.patch = function ($scope, params) {
        trackMixpanelAction('CONTACT_PATCH');
        $scope.inProcess(true);
        gapi.client.crmengine.contacts.patch(params).execute(function (resp) {

            if (!resp.code) {
                for (var k in params) {
                    if (k != 'id' && k != 'entityKey') {
                        $scope.contact[k] = resp[k];
                    }
                }
                   var past_pos=[];
                     if (!$scope.contact.linkedin_profile) {
                        $scope.contact.linkedin_profile={};
                     };
                    if ($scope.contact.linkedin_profile.past_post) {
                         angular.forEach($scope.contact.linkedin_profile.past_post, function(position){
                              past_pos.push(JSON.parse(position));
                        });
                         $scope.contact.linkedin_profile.past_post=past_pos;
                         past_pos=null;
                    }
                    var cur_pos=[];
                    if ($scope.contact.linkedin_profile.current_post) {
                       angular.forEach($scope.contact.linkedin_profile.current_post, function(position){
                            cur_pos.push(JSON.parse(position)); 
                        });
                       $scope.contact.linkedin_profile.current_post=cur_pos;
                       cur_pos=null;
                    }
                    var skills=[];
                    if ($scope.contact.linkedin_profile.skills) {
                       angular.forEach($scope.contact.linkedin_profile.skills, function(position){
                             skills.push(JSON.parse(position)); 
                        });
                       $scope.contact.linkedin_profile.skills=skills;
                        skills=null;
                    }
                    var formations=[];
                    if ($scope.contact.linkedin_profile.formations) {
                        angular.forEach($scope.contact.linkedin_profile.formations, function(position){
                             formations.push(JSON.parse(position));  
                        });
                        $scope.contact.linkedin_profile.formations=formations;
                        formations=null;
                    }  
                    var languages=[];
                    if ($scope.contact.linkedin_profile.languages) {
                        angular.forEach($scope.contact.linkedin_profile.languages, function(language){
                             languages.push(JSON.parse(language));  
                        });
                        $scope.contact.linkedin_profile.languages=languages;
                        languages=null;
                    } 
                    $scope.linkedProfileresume=$scope.contact.linkedin_profile.resume;
                $scope.email.to = '';
                angular.forEach($scope.contact.emails, function (value, key) {
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
                ;
            }
            $scope.getColaborators();
        });
    };
    Contact.import = function ($scope, params) {
        trackMixpanelAction('CONTACT_IMPORT');
        $scope.inProcess(true);
        $scope.apply();
        gapi.client.crmengine.contacts.import(params).execute(function (resp) {
            console.log(params);
            console.log(resp);
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
    Contact.importSecondStep = function ($scope, params) {
        $scope.inProcess(true);
        $scope.apply();
        gapi.client.crmengine.contacts.import_from_csv_second_step(params).execute(function (resp) {
            console.log(params);
            console.log(resp);
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
    Contact.list = function ($scope, params) {
        $scope.inProcess(true);
        var callback = function (resp) {
            if (!resp.code) {

                if (!resp.items) {
                    if (!$scope.isFiltering) {
                        $scope.blankStatecontact = true;
                        $scope.filterNoResult=false;
                    }else{
                      $scope.filterNoResult=true;
                      $scope.blankStatecontact = false;
                    }
                }
                else {
                    $scope.blankStatecontact = false;
                     $scope.filterNoResult=false;
                }
                $scope.contacts = resp.items;

                if ($scope.contactCurrentPage > 1) {
                    $scope.contactpagination.prev = true;
                } else {
                    $scope.contactpagination.prev = false;
                }
                if (resp.nextPageToken) {
                    // console.log("resp.nextPageToken");
                    // console.log(resp.nextPageToken);
                    var nextPage = $scope.contactCurrentPage + 1;
                    $scope.contactpages[nextPage] = resp.nextPageToken;
                    // console.log("$scope.contactpages[nextPage]");
                    // console.log($scope.contactpages[nextPage]);
                    $scope.contactpagination.next = true;

                } else {
                    $scope.contactpagination.next = false;
                }
                $scope.inProcess(false);
                $scope.apply();
                $('#contactCardsContainer').trigger('resize');
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
        if ((params.tags) || (params.owner) || (params.order != '-updated_at')) {
            var updateCache = callback;
        } else {
            var updateCache = function (resp) {
                // Update the cache
                iogrow.ioStorageCache.renderIfUpdated('contacts', resp, callback);
            };
            var resp = iogrow.ioStorageCache.read('contacts');
            callback(resp);
        }
        gapi.client.crmengine.contacts.listv2(params).execute(updateCache);


    };
    Contact.search = function ($scope, params) {
        gapi.client.crmengine.contacts.search(params).execute(function (resp) {
            if (resp.items) {
                console.log("resp.items from contact search");
                console.log(resp.items);
                $scope.results = resp.items;
                $scope.apply();
            }
            ;

        });
    };
    Contact.searchb = function (params, callback) {

        gapi.client.crmengine.contacts.search(params).execute(function (resp) {
            callback(resp);
        });
    };
    Contact.listMore = function ($scope, params) {
        $scope.isMoreItemLoading = true;
        $(window).trigger("resize");
        $scope.$apply();
        gapi.client.crmengine.contacts.listv2(params).execute(function (resp) {
            if (!resp.code) {
                angular.forEach(resp.items, function (item) {
                    $scope.contacts.push(item);
                });
                if ($scope.contactCurrentPage > 1) {
                    $scope.contactpagination.prev = true;
                } else {
                    $scope.contactpagination.prev = false;
                }
                if (resp.nextPageToken) {
                     console.log("resp.nextPageToken");
                    console.log(resp.nextPageToken);
                    var nextPage = $scope.contactCurrentPage + 1;
                    console.log("scope.contactCurrentPage");
                    console.log($scope.contactCurrentPage);
                    // Store the nextPageToken
                    $scope.contactpages[nextPage] = resp.nextPageToken;
                    $scope.contactpagination.next = true;

                } else {
                    $scope.contactpagination.next = false;
                }
                // Loaded succefully
                $scope.isMoreItemLoading = false;
                // Call the method $apply to make the update on the scope
                $scope.apply();

                $('#contactCardsContainer').trigger('resize');
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
                    $scope.apply();
                }
                ;
            }

        });


    };
    Contact.get_linkedin = function ($scope, params) {
        $scope.inProcess(true);
        gapi.client.crmengine.people.getLinkedin(params).execute(function (resp) {
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
                    // $scope.refreshToken();
                    $scope.inProcess(false);
                    $scope.apply();
                }
                ;
            }
        });
    };

    Contact.get_twitter = function ($scope, params) {
        $scope.inProcess(true);
        gapi.client.crmengine.people.gettwitter(params).execute(function (resp) {
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
                    $scope.inProcess(false);
                    $scope.apply();
                }
                ;
            }
        });
    };

    Contact.export = function ($scope, params) {
        trackMixpanelAction('CONTACT_EXPORT');
        //$("#load_btn").attr("disabled", "true");
        //$("#close_btn").attr("disabled", "true");
        $scope.isExporting = true;
        gapi.client.crmengine.contacts.export(params).execute(function (resp) {
            if (!resp.code) {
                //$scope.DataLoaded(resp.items)
                console.log("request ssent")

            } else {

            }
        });
    }
    Contact.export_key = function ($scope, params) {
        //$("#load_btn").attr("disabled", "true");
        //$("#close_btn").attr("disabled", "true");
        $scope.isExporting = true;
        gapi.client.crmengine.contacts.export_keys(params).execute(function (resp) {
            if (!resp.code) {
                //$scope.DataLoaded(resp.items)
                console.log("request ssent")

            } else {

            }
        });
    }

    Contact.insert = function ($scope, params) {
        trackMixpanelAction('CONTACT_INSERT');
        $scope.inProcess(true);
        gapi.client.crmengine.contacts.insertv2(params).execute(function (resp) {
            if (resp.error && resp.error.code == 412){
                window.location.replace('/payment');
            }
            if (!resp.code) {
                if ($scope.contacts == undefined) {
                    $scope.contacts = [];
                    $scope.blankStatecontact = false;
                }
                $scope.contacts.unshift(resp);
                console.log($scope.contacts);
                if ($scope.contactInserted) {
                    
                    $scope.contactInserted(resp);
                }
                //$scope.contact = {};
                $scope.searchAccountQuery = '';
                $scope.inProcess(false);
                $scope.apply();

            } else {
                console.log(resp.message);
                $('#addAContactModal').modal('hide');
                $('#errorModal').modal('show');
                if (resp.message == "Invalid grant") {
                    $scope.refreshToken();
                    $scope.inProcess(false);
                    $scope.apply();
                }
                ;
            }
        });
    };
    Contact.delete = function($scope,params){
    trackMixpanelAction('CONTACT_DELETE');
    $scope.inProcess(true);
    gapi.client.crmengine.contacts.delete(params).execute(function(resp){
        
        if ($scope.contactDeleted){
            $scope.contactDeleted(resp);
            $scope.inProcess(false);  
                        $scope.apply();
        }else{
            $scope.inProcess(false);  
                        $scope.apply();

        }
    })
  }; 
    Contact.deleteAll = function ($scope) {
        $scope.isLoading=true;
        gapi.client.crmengine.contacts.delete_all().execute(function (resp) {
                $scope.allContactsDeleted();
                $scope.isLoading=false;
                $scope.apply();
        })
    };

    Contact.Synchronize = function ($scope, params) {
        trackMixpanelAction('CONTACT_SYNCHRONIZE');
        $scope.inProcess(true);
        gapi.client.crmengine.contacts.synchronize(params).execute(function (resp) {
            if (!resp.code) {
                $('#GontactModal').modal('hide');
                $scope.inProcess(true);
                $scope.apply();
                $scope.runTheProcess();

            }

        });
    }
    Contact.create = function ($scope, params, force) {
        if (!force) {
            Contact.filterByFirstAndLastName($scope, params, function (similarContacts) {
                if (similarContacts) {
                    if (similarContacts.length) {
                        $scope.similarContacts = similarContacts;
                        $("#sameContactModal").modal("show");
                        $scope.apply();
                    } else {
                        Contact.insert($scope, params);
                    }
                } else {
                    Contact.insert($scope, params);
                }
            });
        } else {
            Contact.insert($scope, params);
        }
    };
    Contact.filterByFirstAndLastName = function ($scope, params, callback) {
        $scope.inProcess(true);
        $scope.apply();
        gapi.client.request({
            'root': ROOT,
            'path': '/crmengine/v1/contacts/filter',
            'method': 'POST',
            'body': params,
            'callback': (function (resp) {
                if (!resp.code) {
                    callback(resp.items);
                } else {
                    $('#addContactModal').modal('hide');
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
    Contact.mergeContact = function ($scope, params) {
        $scope.isLoading = true;
        $scope.apply();
        gapi.client.request({
            'root': ROOT,
            'path': '/crmengine/v1/contacts/merge',
            'method': 'POST',
            'body': params,
            'callback': (function (resp) {
                $scope.isLoading = false;
                $scope.apply();
                if (!resp.code) {
                    $scope.mergedContacts++;
                    if ($scope.mergedContacts == $scope.similarContacts.length) {
                        $('#sameContactModal').modal("hide");
                        $('body').removeClass('modal-open');
                        $('.modal-backdrop').remove();
                        window.location.replace('/#/contacts/show/' + resp.id);
                    }
                }
            })
        });

    };
    return Contact;
});
