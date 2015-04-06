accountservices = angular.module('crmEngine.accountservices', []);
// Base sercice (create, delete, get)
accountservices.factory('Conf', function($location) {
    function getRootUrl() {
        var rootUrl = $location.protocol() + '://' + $location.host();
        if ($location.port())
            rootUrl += ':' + $location.port();
        return rootUrl;
    }
    ;
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
accountservices.factory('Account', function($http) {

    var Account = function(data) {
        angular.extend(this, data);
    }


      
    Account.get = function($scope, params) {
        $scope.inProcess(true);
        gapi.client.crmengine.accounts.getv2(params).execute(function(resp) {
            if (!resp.code) {
                $scope.account = resp;
                console.log(resp);
                $scope.getCompanyDetails($scope.account.entityKey);
                $scope.getColaborators($scope.account.entityKey);
                if (resp.contacts) {
                    if (!resp.contacts.items) {
                        $scope.blankStatecontact = true;
                    }
                    if (params.contacts.pageToken) {
                        angular.forEach(resp.contacts.items, function(item) {
                            $scope.contacts.push(item);
                        });
                    }
                    else {
                        $scope.contacts = resp.contacts.items;
                    }
                    if ($scope.contactCurrentPage > 1) {
                        $scope.contactpagination.prev = true;
                    } else {

                        $scope.contactpagination.prev = false;
                    }
                    if (resp.contacts.nextPageToken) {
                        var nextPage = $scope.contactCurrentPage + 1;
                        // Store the nextPageToken
                        $scope.contactpages[nextPage] = resp.contacts.nextPageToken;
                        $scope.contactpagination.next = true;

                    } else {
                        $scope.contactpagination.next = false;
                    }
                }

                if (resp.logo_img_id) {
                    $scope.imageSrc = 'https://docs.google.com/uc?id=' + resp.logo_img_id;
                }
                else {
                    $scope.imageSrc = '/static/img/default_company.png';
                }
                // list infonodes
                var renderMap = false;
                if (resp.infonodes) {

                    if (resp.infonodes.items) {
                        for (var i = 0; i < resp.infonodes.items.length; i++)
                        {
                            if (resp.infonodes.items[i].kind == 'addresses') {
                                renderMap = true;
                            }
                            $scope.infonodes[resp.infonodes.items[i].kind] = resp.infonodes.items[i].items;
                            for (var j = 0; j < $scope.infonodes[resp.infonodes.items[i].kind].length; j++)
                            {
                                for (var v = 0; v < $scope.infonodes[resp.infonodes.items[i].kind][j].fields.length; v++)
                                {
                                    $scope.infonodes[resp.infonodes.items[i].kind][j][$scope.infonodes[resp.infonodes.items[i].kind][j].fields[v].field] = $scope.infonodes[resp.infonodes.items[i].kind][j].fields[v].value;
                                    $scope.infonodes[resp.infonodes.items[i].kind][j]['entityKey'] = $scope.infonodes[resp.infonodes.items[i].kind][j].entityKey;

                                }
                            }

                        }

                    }
                }
                if (resp.topics) {
                    if (params.topics.pageToken) {
                        angular.forEach(resp.topics.items, function(item) {
                            $scope.topics.push(item);
                        });
                    }
                    else {
                        $scope.topics = resp.topics.items;
                    }

                    if ($scope.topicCurrentPage > 1) {
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


                if (resp.needs) {
                    if (!resp.needs.items) {
                        $scope.blankStateneeds = true;
                    }
                    $scope.needs = resp.needs.items;
                    if ($scope.needsCurrentPage > 1) {
                        $scope.needspagination.prev = true;
                    } else {
                        $scope.needspagination.prev = false;
                    }
                    if (resp.needs.nextPageToken) {
                        var nextPage = $scope.needsCurrentPage + 1;
                        // Store the nextPageToken
                        $scope.needspages[nextPage] = resp.needs.nextPageToken;
                        $scope.needspagination.next = true;

                    } else {
                        $scope.needspagination.next = false;
                    }
                }

                if (resp.opportunities) {
                    if (!resp.opportunities.items) {
                        $scope.blankStateopportunity = true;
                    }
                    if (params.opportunities.pageToken) {
                        angular.forEach(resp.opportunities.items, function(item) {
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

                }

                if (resp.cases) {
                    if (!resp.cases.items) {
                        $scope.blankStatecase = true;
                    }
                    if (params.cases.pageToken) {
                        angular.forEach(resp.cases.items, function(item) {
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

                }

                if (resp.documents) {
                    if (!resp.documents.items) {
                        $scope.blankStatdocuments = true;
                    }
                    if (params.documents.pageToken) {
                        angular.forEach(resp.documents.items, function(item) {
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
                }

                if (resp.tasks){
                   $scope.tasks = resp.tasks.items;
                }else{
                  $scope.tasks = [];
                }

                if (resp.events){
                   $scope.events = resp.events.items;
                }else{
                  $scope.events = [];
                }

                $scope.isContentLoaded = true;


                $scope.email.to = '';
                document.title = "Account: " + $scope.account.name;

                angular.forEach($scope.infonodes.emails, function(value, key) {
                    $scope.email.to = $scope.email.to + value.email + ',';
                });
                // Call the method $apply to make the update on the scope
                if (resp.topics && !params.topics.pageToken) {
                    $scope.hilightTopic();
                };
                // if (resp.tasks){
                //     $scope.hilightTask();
                // }
                // if (resp.events){
                //     $scope.hilightEvent();
                // }
               /* $scope.renderMaps();*/
                $scope.mapAutocomplete();
                console.log("before render renderMaps")
                 $scope.renderMaps();
               
                $scope.apply();
                $scope.inProcess(false);
            } else {
                alert(resp.message);
                if (resp.code == 401) {
                    console.log('invalid token');
                    $scope.refreshToken();
                    $scope.apply();
                }
                $scope.inProcess(false);
            }
        });
    };
    Account.patch = function($scope, params) {
        $scope.inProcess(true);
        gapi.client.crmengine.accounts.patch(params).execute(function(resp) {
            if (!resp.code) {
                for (var k in params) {
                    if (k != 'id' && k != 'entityKey') {
                        $scope.account[k] = resp[k];
                    }
                }
                $scope.email.to = '';
                angular.forEach($scope.account.emails, function(value, key) {
                    $scope.email.to = $scope.email.to + value.email + ',';

                });     
                $scope.inProcess(false);  
                        $scope.apply();          
            } else {
                alert("Error, response is: " + angular.toJson(resp));
                $scope.inProcess(false);  
                        $scope.apply();
            }
            $scope.getColaborators();
        });
    };
    Account.list = function($scope, params) {
        $scope.inProcess(true,'acccount list');
        gapi.client.crmengine.accounts.listv2(params).execute(function(resp) {
            if (!resp.code) {
                if (!resp.items) {
                    if (!$scope.isFiltering) {
                        $scope.blankStateaccount = true;
                    }
                }
                $scope.accounts = resp.items;
                if ($scope.currentPage > 1) {
                    $scope.pagination.prev = true;
                } else {
                    $scope.pagination.prev = false;
                }
                if (resp.nextPageToken) {
                    var nextPage = $scope.currentPage + 1;
                    // Store the nextPageToken
                    $scope.pages[nextPage] = resp.nextPageToken;
                    $scope.pagination.next = true;

                } else {
                    $scope.pagination.next = false;
                }
                $scope.apply();
                $scope.inProcess(false,'acccount list');                                                
                $('#accountCardsContainer').trigger("resize");
                setTimeout(function(){
                var myDiv = $('.autoresizeName');
                if ( myDiv.length){
                   myDiv.css({ 'height' : 'initial', 'maxHeight' : '33px'});
                 } 
                },100);
            } else {
                if (resp.code == 401) {
                    $scope.refreshToken();
                    $scope.apply();
                    $scope.inProcess(false,'acccount list');                
                };
            }
        });       
    };


 Account.LoadJSONList=function($scope,params){
  
      $("#load_btn").attr("disabled","true");
      $("#close_btn").attr("disabled","true");
      $scope.isExporting=true;
gapi.client.crmengine.accounts.export(params).execute(function(resp){
          if(!resp.code){
            $scope.DataLoaded(resp.items)
       
          }else{

          }
    });
} 



    Account.listMore = function($scope, params) {
        $scope.isMoreItemLoading = true;
        $( window ).trigger( "resize" );
        $scope.apply();
        gapi.client.crmengine.accounts.listv2(params).execute(function(resp) {
            if (!resp.code) {
                angular.forEach(resp.items, function(item) {
                    $scope.accounts.push(item);
                });

                if ($scope.currentPage > 1) {
                    $scope.pagination.prev = true;
                } else {
                    $scope.pagination.prev = false;
                }
                if (resp.nextPageToken) {
                    var nextPage = $scope.currentPage + 1;
                    // Store the nextPageToken
                    $scope.pages[nextPage] = resp.nextPageToken;
                    $scope.pagination.next = true;

                } else {
                    $scope.pagination.next = false;
                }
                // Loaded succefully
                $scope.isMoreItemLoading = false;
                // Call the method $apply to make the update on the scope

                $scope.apply();
                  
                $('#accountCardsContainer').trigger("resize");
                setTimeout(function(){
                var myDiv = $('.autoresizeName');
                if ( myDiv.length){
                   myDiv.css({ 'height' : 'initial', 'maxHeight' : '33px'});
                 }
                },100);
            } else {

                if (resp.code == 401) {
                    $scope.refreshToken();
                    $scope.isMoreItemLoading = false;
                    $scope.apply();
                }
                ;
            }
        });
        $scope.isMoreItemLoading = false;
    };
    Account.search = function($scope, params) {

        gapi.client.crmengine.accounts.search(params).execute(function(resp) {

            if (resp.items) {

                $scope.accountsResults = resp.items;
                $scope.apply();
            }
            ;

        });
    };
    Account.insert = function($scope, params) {
        $scope.inProcess(true);  
        gapi.client.crmengine.accounts.insert(params).execute(function(resp) {
            if (!resp.code) {
                $scope.accountInserted(resp);
                $scope.inProcess(false);  
                        $scope.apply();

            } else {

                $('#addAccountModal').modal('hide');
                $('#errorModal').modal('show');
               $scope.inProcess(false);  
                        $scope.apply(); 
                if (resp.code == 401) {
                    $scope.refreshToken();
                    $scope.apply();
                }
                ;
            }
        });
    };
    Account.delete = function($scope, id) {
            $scope.inProcess(true);  
            gapi.client.crmengine.accounts.delete(id).execute(function(resp) {
                $scope.inProcess(false);  
                        $scope.apply();
                if ($scope.show) {
                    console.log("intttttttttttttttttttter heeeeeeeeere");
                    $scope.accountDeleted();
                }else{
                     window.location.replace('#/accounts');
                };
               
            }
        )
    };
    // arezki lrbdiri 27/08/14
     Account.getCompanyDetails = function($scope, params) {
        $scope.inProcess(true);  
        gapi.client.crmengine.people.getCompanyLinkedin(params).execute(function(resp) {
            if (!resp.code) {
             $scope.companydetails.name=resp.name;
             $scope.companydetails.followers=resp.followers;
             $scope.companydetails.company_size=resp.company_size;
             $scope.companydetails.industry=resp.industry;
             $scope.companydetails.headquarters=resp.headquarters;
             $scope.companydetails.logo=resp.logo;
             $scope.companydetails.specialties=resp.specialties;
             $scope.companydetails.summary=resp.summary;
             $scope.companydetails.top_image=resp.top_image;
             $scope.companydetails.type=resp.type;
             $scope.companydetails.url=resp.url;
             $scope.companydetails.website=resp.website;
             $scope.companydetails.workers=JSON.parse(resp.workers);
             $scope.inProcess(false);  
                        $scope.apply();
            } else {

                if (resp.code == 401) {
                    $scope.refreshToken();
                    $scope.inProcess(false);  
                        $scope.apply();
                };
            }
        });
    };

  Account.get_twitter= function($scope,params) {
          $scope.inProcess(true); 
          gapi.client.crmengine.people.gettwitter(params).execute(function(resp) {
            if(!resp.code){
             $scope.twitterProfile.id=resp.id;
             $scope.twitterProfile.followers_count=resp.followers_count;
             $scope.twitterProfile.last_tweet_text=resp.last_tweet_text;
             $scope.twitterProfile.last_tweet_favorite_count=resp.last_tweet_favorite_count;
             $scope.twitterProfile.last_tweet_retweeted=resp.last_tweet_retweeted;
             $scope.twitterProfile.last_tweet_retweet_count=resp.last_tweet_retweet_count;
             $scope.twitterProfile.language=resp.language;
             $scope.twitterProfile.created_at=resp.created_at;
             $scope.twitterProfile.nbr_tweets=resp.nbr_tweets;
             $scope.twitterProfile.description_of_user=resp.description_of_user;
             $scope.twitterProfile.friends_count=resp.friends_count;
             $scope.twitterProfile.name=resp.name;
             $scope.twitterProfile.screen_name=resp.screen_name;
             $scope.twitterProfile.url_of_user_their_company=resp.url_of_user_their_company;
             $scope.twitterProfile.location=resp.location;
             $scope.twitterProfile.profile_image_url_https=resp.profile_image_url_https;
             $scope.twitterProfile.lang=resp.lang;
             $scope.twitterProfile.profile_banner_url=resp.profile_banner_url;
             $scope.inProcess(false);  
                        $scope.apply();
            }else {
               if(resp.code==401){
                $scope.inProcess(false);  
                        $scope.apply();
               };
            }
          });
  };
    return Account;
});





accountservices.factory('Search', function($http) {

    var Search = function(data) {
        angular.extend(this, data);
    }
    Search.getUrl = function(type, id) {
        var base_url = undefined;
        switch (type)
        {
            case 'Account':
                base_url = '/#/accounts/show/';
                break;
            case 'Contact':
                base_url = '/#/contacts/show/';
                break;
            case 'Lead':
                base_url = '/#/leads/show/';
                break;
            case 'Opportunity':
                base_url = '/#/opportunities/show/';
                break;
            case 'Case':
                base_url = '/#/cases/show/';
                break;
            case 'Show':
                base_url = '/#/live/shows/show/';
                break;
            case 'Product_Video':
                base_url = '/#/live/product_videos/product_video/';
                break;
            case 'Customer_Story':
                base_url = '/#/live/customer_stories/customer_story/';
                break;
            case 'Need':
                base_url = '/#/needs/show/';
                break;
            case 'Document' :
                base_url = '#/documents/show/';
                break;
            case 'Task' :
                base_url = '#/tasks/show/';
                break;
            case 'Event' :
                base_url = '#/events/show/';
                break;
          

        }

        return base_url + id;
    };

    Search.getParentUrl=function(parent_kind,parent_id){
            var base_url = undefined;
        switch (parent_kind)
        {
            
            case 'Note':
                base_url = '/#/notes/show/';
                break;
            case 'Document' :
                base_url = '#/documents/show/';
                break;
            case 'Task' :
                base_url = '#/tasks/show/';
                break;
            case 'Event' :
                base_url = '#/events/show/';
                break;
          

        }

        return base_url + parent_id;
    };

    Search.list = function($scope, params) {
        $scope.inProcess(true); 
        if (params['q'] != undefined) {
            gapi.client.crmengine.search(params).execute(function(resp) {
                if (!resp.code) {
                    if (resp.items) {
                        if (resp.nextPageToken==undefined||resp.nextPageToken==1) {
                            console.log("inn firt page");
                         $scope.searchResults = []; 
                        }else{
                            console.log("iiiiiiiiiiiin next page token");
                        };
                        console.log(resp.items);
                        angular.forEach(resp.items, function(item) {
                            console.log(item);
                            var id = item.id;
                            var type = item.type;
                            var title = item.title;
                            var url = Search.getUrl(type, id);
                            var result = {};
                            result.id = id;
                            result.type = type;
                            result.title = title;
                            result.url = url;
                            $scope.searchResults.push(result);
                        });


                        //$scope.searchResults = resp.items;
                        if ($scope.currentPage > 1) {
                            $scope.pagination.prev = true;
                        } else {
                            $scope.pagination.prev = false;
                        }
                        console.log("resp.nextPageToken");
                        console.log(resp.nextPageToken);                        
                        if (resp.nextPageToken) {
                            var nextPage = $scope.currentPage + 1;
                            // Store the nextPageToken
                            $scope.pages[nextPage] = resp.nextPageToken;
                            console.log("$scope.pages[nextPage]");
                            console.log($scope.pages[nextPage]);                            
                            console.log("resp.nextPageToken");                            
                            console.log(resp.nextPageToken);                            
                            $scope.pagination.next = true;

                        } else {
                            $scope.pagination.next = false;
                        }
                    }
                    $scope.inProcess(false);  
                        $scope.apply();
                } else {
                    if (resp.code == 401) {
                        $scope.refreshToken();                       
                    };
                    $scope.inProcess(false);  
                        $scope.apply();
                }
            });
        }
    };


    return Search;
});
accountservices.factory('Attachement', function($http) {

    var Attachement = function(data) {
        angular.extend(this, data);
    };
    /*Attachement.list = function($scope,params){
     $scope.isLoading = true;
     gapi.client.crmengine.documents.list(params).execute(function(resp) {
     if(!resp.code){
     if (!resp.items){
     $scope.blankStatdocuments = true;
     };

     $scope.documents = resp.items;

     console.log('-----------Documents--------');
     console.log($scope.documents);

     if ($scope.documentCurrentPage > 1){
     $scope.documentpagination.prev = true;
     }else{
     $scope.documentpagination.prev = false;
     }
     if (resp.nextPageToken){
     var nextPage = $scope.documentCurrentPage + 1;
     // Store the nextPageToken
     $scope.documentpages[nextPage] = resp.nextPageToken;
     $scope.documentpagination.next = true;

     }else{
     $scope.documentpagination.next = false;
     }
     // Loaded succefully
     $scope.isLoading = false;
     // Call the method $apply to make the update on the scope
     $scope.apply();
     }else {
     if(resp.message=="Invalid token"){
     $scope.refreshToken();
     $scope.isLoading = false;
     $scope.apply();
     };
     }
     });

     };*/
    Attachement.list = function($scope, params) {
        $scope.inProcess(true); 
        gapi.client.crmengine.documents.list(params).execute(function(resp) {
            if (!resp.code) {

                if (!resp.items) {
                    if (!$scope.isFiltering) {
                        $scope.blankStatdocuments = true;
                    }
                }
                $scope.documents = resp.items;
                if ($scope.documentCurrentPage > 1) {
                    $scope.documentpagination.prev = true;
                } else {
                    $scope.documentpagination.prev = false;
                }
                if (resp.nextPageToken) {
                    var nextPage = $scope.documentCurrentPage + 1;
                    // Store the nextPageToken
                    $scope.documentpages[nextPage] = resp.nextPageToken;
                    $scope.documentpagination.next = true;

                } else {
                    $scope.documentpagination.next = false;
                }
                $scope.inProcess(false);  
                        $scope.apply();
            } else {

                if (resp.code == 401) {
                    $scope.refreshToken();
                    $scope.inProcess(false);  
                        $scope.apply();
                };
            }
        });
    };
    Attachement.get = function($scope, id) {
        
        $scope.inProcess(true); 
        gapi.client.crmengine.documents.get(id).execute(function(resp) {
            if (!resp.code) {
                $scope.attachment = resp;            
                document.title = "Document: " + $scope.attachment.title;
                $scope.prepareUrls();
                $scope.isContentLoaded = true;
                $scope.entityKey = $scope.attachment.entityKey;
                $scope.ListComments();
                $scope.inProcess(false);  
                        $scope.apply();
            } else {
                if (resp.code == 401) {
                    $scope.refreshToken();
                    $scope.inProcess(false);  
                        $scope.apply();
                };
            }           
        });
    };
    Attachement.insert = function($scope, params) {
        $scope.inProcess(true); 
        $('#newDocument').modal('hide');
        gapi.client.crmengine.documents.insertv2(params).execute(function(resp) {
            if (!resp.code) {
                //$('#newDocument').modal('hide');
                $scope.listDocuments();
                $scope.blankStatdocuments = false;
                $scope.newdocument.title = '';
                $scope.inProcess(false);  
                        $scope.apply();
            } else {
                $('#newDocument').modal('hide');
                $('#errorModal').modal('show');
                if (resp.code == 401) {
                    $scope.refreshToken();
                    $scope.blankStatdocuments = false;

                };
                $scope.inProcess(false);  
                        $scope.apply();
            }
        });

    };
    Attachement.delete = function($scope, entityKey) {
        $scope.inProcess(true); 
        gapi.client.crmengine.documents.delete(entityKey).execute(function(resp) {
            if (!resp.code) {
                $scope.blankStatdocuments = false;
                window.location.replace($scope.uri);
                $scope.inProcess(false);  
                        $scope.apply();
            } else {
                if (resp.code == 401) {
                    $scope.refreshToken();
                    $scope.blankStatdocuments = false;
                    $scope.inProcess(false);  
                        $scope.apply();
                }
            }
        });
    };
    Attachement.attachfiles = function($scope, params) {
        $scope.inProcess(true); 
        gapi.client.crmengine.documents.attachfiles(params).execute(function(resp) {
            if (!resp.code) {
                $scope.listDocuments();
                $scope.blankStatdocuments = false;
                $scope.inProcess(false);  
                        $scope.apply();
            } else {
                $('#errorModal').modal('show');
                if (resp.code == 401) {
                    $scope.refreshToken();
                    $scope.blankStatdocuments = false;
                    $scope.inProcess(false);  
                        $scope.apply();
                };
            }
        });
    };


    return Attachement;
});

accountservices.factory('Email', function() {

    var Email = function(data) {
        angular.extend(this, data);
    };

    
    Email.send = function($scope, params) {
        console.log("iiiiiiiiiiiiiiiiinterrrrrrrrrrrrrrrrrrrrhere");
        $scope.inProcess(true); 
        $scope.sending = true;
      
        gapi.client.crmengine.emails.send(params).execute(function(resp) {

            $('#sendingEmail').modal('show');
            if (!resp.code) {
                $scope.emailSent = true;
                $scope.sending = false;
               // $scope.selectedTab = 1;
                $scope.emailSent();
                $scope.listTopics();

                $scope.email = {};
                // $('#sendingEmail').modal('hide');

                $scope.inProcess(false);  
                        $scope.apply();
            } else {
                $('#errorModal').modal('show');
                if (resp.code == 401) {
                    window.location.replace('/sign-in');
                    $scope.inProcess(false);  
                        $scope.apply();
                };
            }
        });

    };
    return Email;
});
