app.controller('LeadListCtrl', ['$scope', '$filter', 'Auth', 'Lead', 'Leadstatus', 'Tag', 'Edge', 'Profile', 'Attachement', 'Email', 'User', '$http', 'Event', 'Task', 'Permission',
    function ($scope, $filter, Auth, Lead, Leadstatus, Tag, Edge, Profile, Attachement, Email, User, $http, Event, Task, Permission) {
        $("ul.page-sidebar-menu li").removeClass("active");
        $("#id_Leads").addClass("active");
        trackMixpanelAction('LEAD_LIST_VIEW');
        document.title = "Leads: Home";
        $scope.isSignedIn = false;
        $scope.immediateFailed = false;
        $scope.nextPageToken = undefined;
        $scope.prevPageToken = undefined;
        $scope.isLoading = false;
        $scope.nbLoads = 0; 
        $scope.isMoreItemLoading = false;
        $scope.isbigScreen = false;
        $scope.isSelectedAll = false;
        $scope.leadpagination = {};
        $scope.currentPage = 01;
        $scope.page = 1;
        $scope.pages = [];
        $scope.selectedOption = 'all';
        $scope.stage_selected = {};
        $scope.showTagsFilter = false;
        $scope.showNewTag = false;
        $scope.diselectedOption = '';
        $scope.leads = [];
        $scope.lead = {};
        $scope.selectedLead = {};
        $scope.showClose = false;
        $scope.lead.access = 'public';
        $scope.order = '-updated_at';
        $scope.status = 'New';
        $scope.selected_tags = [];
        $scope.draggedTag = null;
        $scope.tag = {};
        $scope.currentLead = null;
        $scope.selected_leads = [];
        $scope.showUntag = false;
        $scope.edgekeytoDelete = undefined;
        $scope.file_type = 'outlook';
        $scope.show = "cards";
        $scope.selectedCards = [];
        $scope.selectedKeyLeads = [];
        $scope.allCardsSelected = false;
        $scope.leadToMail = null;
        $scope.email = {};
        $scope.sendWithAttachments = [];
        $scope.emailSentMessage = false;
        $scope.smallModal = false;
        $scope.sourceFilter = 'all';
        $scope.isExporting = false;
        $scope.leadsfilter = 'all';
        $scope.leadsSourceFilter = 'All';
        $scope.leadsAssignee = null;
        $scope.sharing_with = [];
        $scope.color_pallet = [
            {'name': 'red', 'color': '#F7846A'},
            {'name': 'orange', 'color': '#FFBB22'},
            {'name': 'yellow', 'color': '#EEEE22'},
            {'name': 'green', 'color': '#BBE535'},
            {'name': 'blue', 'color': '#66CCDD'},
            {'name': 'gray', 'color': '#B5C5C5'},
            {'name': 'teal', 'color': '#77DDBB'},
            {'name': 'purple', 'color': '#E874D6'},
        ];
        $scope.textEditorOptions = {
            "font-styles": true,
            "color": true,
            "emphasis": true,
            "lists": true,
            "html": true,
            "link": true,
            "image": true,
            events: {},
            parserRules: {
                classes: {
                    "wysiwyg-color-silver": 1,
                    "wysiwyg-color-gray": 1,
                    "wysiwyg-color-white": 1,
                    "wysiwyg-color-maroon": 1,
                    "wysiwyg-color-red": 1,
                    "wysiwyg-color-purple": 1,
                    "wysiwyg-color-fuchsia": 1,
                    "wysiwyg-color-green": 1,
                    "wysiwyg-color-lime": 1,
                    "wysiwyg-color-olive": 1,
                    "wysiwyg-color-yellow": 1,
                    "wysiwyg-color-navy": 1,
                    "wysiwyg-color-blue": 1,
                    "wysiwyg-color-teal": 1,
                    "wysiwyg-color-aqua": 1,
                    "wysiwyg-color-orange": 1,
                    "wysiwyg-text-align-center": 1
                },
                tags: {
                    "b": {},
                    "i": {},
                    "br": {},
                    "ol": {},
                    "ul": {},
                    "li": {},
                    "h1": {},
                    "h2": {},
                    "h3": {},
                    "h4": {},
                    "h5": {},
                    "h6": {},
                    "blockquote": {},
                    "u": 1,
                    "img": {
                        "check_attributes": {
                            "width": "numbers",
                            "alt": "alt",
                            "src": "url",
                            "height": "numbers"
                        }
                    },
                    "a": {
                        check_attributes: {
                            'href': "url", // important to avoid XSS
                            'target': 'alt',
                            'rel': 'alt'
                        }
                    },
                    "span": 1,
                    "div":1,
                    // to allow save and edit files with code tag hacks
                    "code": 1,
                    "pre": 1
                },
            },
            stylesheets: ["/static/build/css/wysiwyg-color.css"], // (path_to_project/lib/css/wysiwyg-color.css)
            locale: "en"
        };

        $scope.selected_access = 'public';
        $scope.selectedPermisssions = true;
        $scope.owner=null;
        $scope.emailSignature = document.getElementById("signature").value;
        $scope.filterNoResult=false;
        if ($scope.emailSignature == "None") {
            $scope.emailSignature = "";
        } else {
            $scope.emailSignature = "<br/><br/><br/><br/><br/><br/><br/><br/><br/><br/><div style='text-align: center'>"
                + $scope.emailSignature + "</div>";
        }

        document.getElementById("some-textarea").value = $scope.emailSignature;
        //$scope.showPage=true;
        $scope.tag.color = {'name': 'green', 'color': '#BBE535'};
        $scope.redirectTo = function (url) {
            window.location.replace('/#/search/type:contact tags:' + url);
        };
        $scope.isEmptyArray = function (Array) {
            if (Array != undefined && Array.length > 0) {
                return false;
            } else {
                return true;
            }

        };
        $scope.filterBySource = function (source) {

        };
        $scope.editbeforedeleteselection = function () {
            $('#BeforedeleteSelectedLeads').modal('show');
        };
        $scope.getRequestParams= function(){
            var params={};
            params.order=$scope.order;
            params.limit=20;
            if ($scope.selected_tags.length > 0){
                params.tags=[];
                angular.forEach($scope.selected_tags, function (tag) {
                    params.tags.push(tag.entityKey);
                });
            }
            if ($scope.leadsSourceFilter!='All') {
                params.source=$scope.leadsSourceFilter;
            }
            if ($scope.owner) {
                params.owner=$scope.owner;
            }
            return params;
        };
        $scope.apply = function () {

            if ($scope.$root.$$phase != '$apply' && $scope.$root.$$phase != '$digest') {
                $scope.$apply();
            }
            return false;
        };
        $scope.selectMember = function () {
            if ($scope.sharing_with.indexOf($scope.user) == -1) {
                $scope.slected_memeber = $scope.user;

                $scope.sharing_with.push($scope.slected_memeber);
            }
            $scope.user = '';

        };
        $scope.unselectMember = function (index) {
            $scope.selected_members.splice(index, 1);
            
        };
        $scope.getColaborators = function () {

        };
        $scope.inProcess = function (varBool, message) {
            if (varBool) {
                if (message) {
                    
                }
                $scope.nbLoads = $scope.nbLoads + 1;
                if ($scope.nbLoads == 1) {
                    $scope.isLoading = true;
                }
            } else {
                if (message) {
                    
                }
                $scope.nbLoads = $scope.nbLoads - 1;
                if ($scope.nbLoads == 0) {
                    $scope.isLoading = false;

                }
            }
        };
        $scope.convertModal = function () {
            
            $('#convertLeadModal').modal('show');
        };

        $scope.share = function (me) {
            if ($scope.selectedPermisssions) {
                var sharing_with=$.extend(true, [], $scope.sharing_with);
                $scope.sharing_with=[];
                angular.forEach($scope.selectedCards, function (selected_lead) {
                    var id = selected_lead.id;
                    if (selected_lead.owner.google_user_id == me) {
                        var params = {'id': id, 'access': $scope.selected_access};
                        Lead.patch($scope, params);
                        // who is the parent of this event .hadji hicham 21-07-2014.

                        params["parent"] = "lead";
                        Event.permission($scope, params);
                        Task.permission($scope, params);
                        
                    }
                    if ($scope.selected_access=="private" && sharing_with.length > 0) {
                        var items = [];

                        angular.forEach(sharing_with, function (user) {
                            var item = {
                                'type': "user",
                                'value': user.entityKey
                            };
                            if (item.google_user_id != selected_lead.owner.google_user_id) items.push(item);
                        });
                        if (items.length > 0) {
                                var params = {
                                    'about': selected_lead.entityKey,
                                    'items': items
                                };
                                console.log(params);
                                Permission.insert($scope, params);
                        }
                    }
                });
            }
        };

        $scope.checkPermissions = function (me) {
            
            $scope.selectedPermisssions = true;
            angular.forEach($scope.selectedCards, function (selected_lead) {
                
                
                if (selected_lead.owner.google_user_id == me) {

                }else{
                    $scope.selectedPermisssions = false;
                }
            });
            
        };
        $scope.convert = function () {
            $('#convertLeadModal').modal('hide');
            angular.forEach($scope.selectedCards, function (selected_lead) {
                var leadid = {'id': selected_lead.id};
                Lead.convert($scope, leadid);
            });
            $scope.apply();

        };
        $scope.leadConverted = function (oldId, newId) {
            // angular.forEach($scope.selectedCards, function (selected_lead) {
            //     if (selected_lead.id == oldId) {
                    
            //         $scope.selectedCards.splice($scope.selectedCards.indexOf(selected_lead), 1);
            //         $scope.leads.splice($scope.leads.indexOf(selected_lead), 1);
            //     }
            //     ;
            // });
            // $scope.apply();
            window.location.replace('#/contacts/');
        }
        // What to do after authentication
        $scope.runTheProcess = function () {
            var completedTour = document.getElementById("completedTour").value;
            if (completedTour == 'False' | completedTour == 'None') {
                if (localStorage['completedTour'] != 'True') {
                    $scope.wizard();
                }

            }
            else {
                
            }

            // for (var i=0;i<100;i++)
            //   { 
            //     var poww= Math.floor((Math.random() * 10) + 1);
            //     var addon=Math.pow(10, poww);
            //     console.log(poww);
            //     console.log(addon);
            //     var test=addon.toString();
            //     params={'firstname':'M3amer ',
            //             'lastname':'tt'+test,
            //               'access':'public'}
            //     Lead.insert($scope,params)
            //   }            

            
            $scope.checkScrollBar();
            var params = {'order': $scope.order, 'limit': 20};
            User.list($scope, {});
            Lead.list($scope, params);
            Leadstatus.list($scope, {});
            var paramsTag = {'about_kind': 'Lead'};
            Tag.list($scope, paramsTag);

            ga('send', 'pageview', '/leads');
            if (localStorage['leadShow'] != undefined) {

                $scope.show = localStorage['leadShow'];

            }
            ;
            window.Intercom('update');


        };
        $scope.refreshCurrent = function () {
            $scope.runTheProcess();
        };
        $scope.leadDeleted = function (entityKey) {
            if (!jQuery.isEmptyObject($scope.selectedLead) && $scope.selectedContact != null) {
                $scope.leads.splice($scope.leads.indexOf($scope.selectedLead), 1);
            } else {
                var indx=null;
                angular.forEach($scope.selectedCards, function (selected_lead) {
                    if (entityKey==selected_lead.entityKey) {
                        $scope.leads.splice($scope.leads.indexOf(selected_lead), 1);
                        indx=selected_lead;
                    }
                });
                $scope.selectedCards.splice($scope.selectedCards.indexOf(indx),1);
                if ($scope.isEmptyArray($scope.selectedCards)) {
                    console.log("selection array is empty");
                    var params=$scope.getRequestParams();
                    console.log(params);
                    Lead.list($scope,params);
                }
                $scope.apply();
            }

        };


        $scope.gotosendMail = function (email, lead) {
            // $scope.email.body=$scope.emailSignature;
            $scope.leadToMail = lead;
            $scope.email.to = email;
            $('#testnonefade').modal("show");
            $scope.smallSendMail();
            document.getElementById("some-textarea").value = $scope.emailSignature;
        };
        //$('#some-textarea').wysihtml5();
         $('#some-textarea').wysihtml5();
        // $scope.switchwysihtml = function () {
        //     console.log("rendred wysiwyg");
        //     if ($(".wysihtml5-toolbar").is(":visible")) {

        //         $(".wysihtml5-toolbar").hide();
        //         $(".wysihtml5-sandbox").addClass("withoutTools");

        //     } else {

        //         $(".wysihtml5-sandbox").removeClass("withoutTools")
        //         $(".wysihtml5-toolbar").show();

        //     }
        //     ;
        // }

        $scope.closeEmailModel = function () {
            $(".modal-backdrop").remove();
            $('#testnonefade').hide();
        };
        $scope.switchEmailModal = function () {
            if ($("#testnonefade").hasClass("emailModalOnBottom")) {
                $scope.bigSendMail();
                $scope.smallModal = true;
            } else {
                $scope.smallSendMail();
                $scope.smallModal = false;
            };
        };

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


                $.each(data.docs, function (index) {
                    var file = {
                        'id': data.docs[index].id,
                        'title': data.docs[index].name,
                        'mimeType': data.docs[index].mimeType,
                        'embedLink': data.docs[index].url
                    };
                    $scope.sendWithAttachments.push(file);
                });
                $scope.apply();
            }
        }
        $scope.smallSendMail = function () {
            $(".modal-backdrop").remove();
            
            $('#testnonefade').addClass("emailModalOnBottom");
            //document.getElementById("some-textarea").value=$scope.emailSignature;
        }
        $scope.bigSendMail = function () {
            $('#testnonefade').removeClass("emailModalOnBottom");
            $("body").append('<div class="modal-backdrop fade in"></div>');

        };
        $scope.sendEmail = function (email) {

            
            email.body = $('#some-textarea').val();
            var params = {
                'to': email.to,
                'cc': email.cc,
                'bcc': email.bcc,
                'subject': email.subject,
                'body': email.body,
                'about': $scope.leadToMail.entityKey
            };
            if ($scope.sendWithAttachments) {
                params['files'] = {
                    'parent': $scope.leadToMail.entityKey,
                    'access': $scope.leadToMail.access,
                    'items': $scope.sendWithAttachments
                };
            }
            ;

            Email.send($scope, params, true);
        };
        $scope.emailSentConfirmation = function () {
            
            
            $scope.email = {};
            $scope.showCC = false;
            $scope.showBCC = false;
            $scope.leadToMail = null;
            $('#testnonefade').modal("hide");
            $scope.email = {};
            
            $scope.emailSentMessage = true;
            setTimeout(function () {
                $scope.emailSentMessage = false;
                $scope.apply()
            }, 2000);
        }


// HADJI HICHAM -04/02/2015

        $scope.removeTag = function (tag, lead) {


            /*var params = {'tag': tag,'index':$index}

             Edge.delete($scope, params);*/
            $scope.dragTagItem(tag, lead);
            $scope.dropOutTag();
        }

        /***********************************************************/
        $scope.switchShow = function () {
            if ($scope.show == 'list') {

                $scope.show = 'cards';
                localStorage['leadShow'] = "cards";
                $scope.selectedCards = [];
                $scope.apply();
                $("#leadCardsContainer").trigger('resize');


            } else {

                if ($scope.show == 'cards') {
                    $scope.show = 'list';
                    localStorage['leadShow'] = "list";
                    $scope.selectedCards = [];
                    $scope.apply();
                }

            }
            ;
        }
        $scope.isSelectedCard = function (lead) {
            return ($scope.selectedCards.indexOf(lead) >= 0);
        };
        $scope.unselectAll = function ($event) {
            var element = $($event.target);
            if (element.hasClass('waterfall')) {
                $scope.selectedCards = [];
            };
            /*$scope.selectedCards=[];*/
        };
        $scope.selectAll = function ($event) {

            var checkbox = $event.target;
            if (checkbox.checked) {
                $scope.selectedCards = [];
                $scope.selectedCards = $scope.selectedCards.concat($scope.leads);

                $scope.allCardsSelected = true;

            } else {

                $scope.selectedCards = [];
                $scope.allCardsSelected = false;

            }
        };
        $scope.deleteSelection = function () {
            angular.forEach($scope.selectedCards, function (selected_lead) {

                var params = {'entityKey': selected_lead.entityKey};
                Lead.delete($scope, params);

            });
            $('#BeforedeleteSelectedLeads').modal('hide');
        };
        $scope.selectCardwithCheck = function ($event, index, lead) {
            var checkbox = $event.target;

            if (checkbox.checked) {
                if ($scope.selectedCards.indexOf(lead) == -1) {
                    $scope.selectedCards.push(lead);
                }
            } else {
                $scope.selectedCards.splice($scope.selectedCards.indexOf(lead), 1);
            }

        }
        $scope.filterByName = function () {
            if ($scope.fltby != 'name') {
                $scope.fltby = 'name';
                $scope.reverse = false
            } else {
                $scope.fltby = '-name';
                $scope.reverse = false;
            }
            ;
        }
        $scope.filterBy = function (text) {
            if ($scope.fltby != text) {
                $scope.fltby = text;
                $scope.reverse = false
            } else {
                $scope.fltby = '-' + text;
                $scope.reverse = false;
            }
            ;
        }
        /*$scope.initDiscover=function(){
         Profile.listKeywords($scope,{})
         Profile.list($scope,{})
         $scope.diselectedOption='discover'
         }*/
        /* 

         $scope.isSelected = function(index) {
         return ($scope.selected_leads.indexOf(index) >= 0||$scope.isSelectedAll);
         };
         $scope.select_lead= function(lead,$index,$event){
         var checkbox = $event.target;
         if(checkbox.checked){
         if ($scope.selected_leads.indexOf(lead) == -1) {
         
         $scope.selected_leads.push(lead);
         

         }
         }else{
         $scope.selected_leads.splice($scope.selected_leads.indexOf(lead), 1);
         
         
         
         }
         }
         $scope.select_all_tasks=function($event){
         var checkbox = $event.target;
         if(checkbox.checked){
         $scope.selected_leads=[];
         $scope.selected_leads.push($scope.leads);
         $scope.isSelectedAll=true;
         }else{
         $scope.selected_leads=[];
         $scope.isSelectedAll=false;
         
         }
         }*/
        $scope.wizard = function () {
            localStorage['completedTour'] = 'True';
            var tour = {
                id: "hello-hopscotch",
                steps: [
                    {
                        title: "Discovery",
                        content: "Your customers are talking about topics related to your business on Twitter. We provide you the right tool to discover them.",
                        target: "id_Discovery",
                        placement: "right"
                    },
                    {
                        title: "Leads",
                        content: "Use leads to easily track  individuals or representatives of organizations who may be interested in your business. They are usually collected from various sources like Discovery feature, Linkedin, trade shows, seminars, advertisements and other marketing campaigns. You can add notes, set reminders or send emails",
                        target: "id_Leads",
                        placement: "right"
                    },
                    {
                        title: "Opportunities",
                        content: "The Opportunities tab is where we go to view the deals being tracked in ioGrow.",
                        target: "id_Opportunities",
                        placement: "right"
                    }


                    ,
                    {
                        title: "Contacts",
                        content: "People in an organization with whom your company has business communications, in pursuit of business opportunities. ",
                        target: "id_Contacts",
                        placement: "right"
                    }
                    ,

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
                    }
                    ,
                    {
                        title: "Tasks",
                        content: "All activities or to-do items to perform or that has been performed.",
                        target: "id_Tasks",
                        placement: "right"
                    }
                    ,
                    {
                        title: "Calendar",
                        content: "Manage your calendar and create events",
                        target: "id_Calendar",
                        placement: "right"
                    }
                ],
                onEnd: function () {
                    $scope.saveIntercomEvent('completed Tour');
                    var userId = document.getElementById("userId").value;

                    if (userId) {
                        var params = {'id': parseInt(userId), 'completed_tour': true};
                        User.completedTour($scope, params);
                    }
                    
                    $('#installChromeExtension').modal("show");
                }
            };
            // Start the tour!
            
            hopscotch.startTour(tour);
        };


        $scope.lead_wizard = function () {
            localStorage['completedTour'] = 'True';
            var tour = {
                id: "hello-hopscotch",
                steps: [

                    {
                        title: "Step 1: Create New lead",
                        content: "Click here to create new lead and add detail about it.",
                        target: "new_lead",
                        placement: "bottom"
                    },
                    {

                        title: "Step 2: Add Tags",
                        content: "Add Tags to filter your leads.",
                        target: "add_tag",
                        placement: "left"
                    },


                    {
                        title: "Step 3: Import your leads",
                        content: "Import your Leads with Google CSV format or Outlook CSV format",
                        target: "sample_editable_1_new_import",
                        placement: "bottom"
                    }


                    ,
                    {
                        content: "Step 4: Export your Leads as CSV file ",
                        target: "sample_editable_1_new_export",
                        placement: "bottom"
                    }

                ]

            };
            // Start the tour!
            
            hopscotch.startTour(tour);
        };

        $scope.saveIntercomEvent = function (eventName) {
            Intercom('trackEvent', eventName);
        }
        $scope.fromNow = function (fromDate) {
            return moment(fromDate, "YYYY-MM-DD HH:mm Z").fromNow();
        }
        $scope.getPosition = function (index) {
            if (index < 4) {

                return index + 1;
            } else {

                return (index % 4) + 1;
            }
        };
        // We need to call this to refresh token when user credentials are invalid
        $scope.refreshToken = function () {
            Auth.refreshToken();
        };
        $scope.listNextPageItems = function () {
            var nextPage = $scope.currentPage + 1;
            var params = {};
            console.log('*******$scope.pages[nextPage]******')
            console.log($scope.pages[nextPage])
            if ($scope.pages[nextPage]) {
                params = {
                    'order': $scope.order, 'limit': 6,
                    'pageToken': $scope.pages[nextPage]
                }
            } else {
                params = {'order': $scope.order, 'limit': 6}
            }
            
            $scope.currentPage = $scope.currentPage + 1;
            Lead.list($scope, params);
        }
        $scope.listMoreItems = function () {
            var nextPage = $scope.currentPage + 1;
            var params = $scope.getRequestParams();
            if ($scope.pages[nextPage]) {
                params.pageToken=$scope.pages[nextPage];
                $scope.currentPage = $scope.currentPage + 1;
                Lead.listMore($scope, params);
            }
        };
        $scope.listview = function () {

            $('.leadElement').each(function () {
                $(window).trigger('resize');
            });

        }
        $scope.listPrevPageItems = function () {
            var prevPage = $scope.currentPage - 1;
            var params = {};
            if ($scope.pages[prevPage]) {
                params = {
                    'order': $scope.order, 'limit': 6,
                    'pageToken': $scope.pages[prevPage]
                }
            } else {
                params = {'order': $scope.order, 'limit': 6}
            }
            $scope.currentPage = $scope.currentPage - 1;
            Lead.list($scope, params);
        }
        $scope.showAssigneeTags = function (lead) {
            $('#assigneeTagsToLeads').modal('show');
            $scope.currentLead = lead;
        };
        $scope.addTagsTothis = function () {
            var tags = [];
            var items = [];
            tags = $('#select2_sample2').select2("val");
            angular.forEach(tags, function (tag) {
                var edge = {
                    'start_node': $scope.currentLead.entityKey,
                    'end_node': tag,
                    'kind': 'tags',
                    'inverse_edge': 'tagged_on'
                };
                items.push(edge);
            });
            params = {
                'items': items
            }
            
            Edge.insert($scope, params);
            $scope.currentLead = null;
            $('#assigneeTagsToTask').modal('hide');
        };
        $scope.addTagstoLeads = function () {
            var tags = [];
            var items = [];
            tags = $('#select2_sample2').select2("val");
            
            if ($scope.currentLead != null) {
                angular.forEach(tags, function (tag) {
                    var params = {
                        'parent': $scope.currentLead.entityKey,
                        'tag_key': tag
                    };
                    Tag.attach($scope, params, $scope.leads.indexOf($scope.currentLead));
                });
                $scope.currentLead = null;
            } else {
                angular.forEach($scope.selectedCards, function (selected_lead) {
                    angular.forEach(tags, function (tag) {
                        var params = {
                            'parent': selected_lead.entityKey,
                            'tag_key': tag
                        };
                        Tag.attach($scope, params);
                    });

                });
            }
            $scope.apply();
            $('#select2_sample2').select2("val", "");
            $('#assigneeTagsToLeads').modal('hide');
        }
        // new Lead
        $scope.showModal = function () {
            $('#addLeadModal').modal('show');

        };


        $scope.showNewTagForm = function () {
            $scope.showNewTag = true;
            $(window).trigger('resize');
        }
        $scope.hideNewTagForm = function () {
            $scope.showNewTag = false;
            $(window).trigger('resize');
        }
        $scope.hideTagFilterCard = function () {
            $scope.showTagsFilter = false;
            $(window).trigger('resize');
        }
        $scope.showTagFilterCard = function () {
            $scope.showTagsFilter = true;
            $(window).trigger('resize');
        }


// hadji hicham 22-07-2014 . inlinepatch for labels .
        $scope.inlinePatch = function (kind, edge, name, tag, value) {


            if (kind == "tag") {

                params = {
                    'id': tag.id,
                    'entityKey': tag.entityKey,
                    'about_kind': 'Lead',
                    'name': value
                };


                Tag.patch($scope, params);
            }
            ;


        };
        $scope.addLeadOnKey = function (lead) {
            if (event.keyCode == 13 && lead) {
                $scope.save(lead);
            }
        };
        // Quick Filtering
        var searchParams = {};
        $scope.result = undefined;
        $scope.q = undefined;

        // Quick Filtering
        var searchParams = {};
        $scope.result = undefined;
        $scope.q = undefined;

        $scope.$watch('searchQuery', function () {
            searchParams['q'] = $scope.searchQuery;
            searchParams['limit'] = 7;
            if ($scope.searchQuery) {
                Lead.search($scope, searchParams);
            }
            ;
        });
        $scope.selectResult = function () {
            window.location.replace('#/leads/show/' + $scope.searchQuery.id);
        };
        $scope.executeSearch = function (searchQuery) {
            if (typeof(searchQuery) == 'string') {
                var goToSearch = 'type:Lead ' + searchQuery;
                window.location.replace('#/search/' + goToSearch);
            } else {
                window.location.replace('#/leads/show/' + searchQuery.id);
            }
            $scope.searchQuery = ' ';
            $scope.apply();
        };
        $scope.leadFilterBy = function (filter, assignee) {
            console.log("filter triggered");
            if ($scope.leadsfilter != filter) {
                console.log("filter triggered");
                switch (filter) { 
                    case 'all':
                        $scope.owner=null;
                        var params=$scope.getRequestParams();
                        Lead.list($scope, params, true);
                        $scope.leadsfilter = filter;
                        $scope.leadsAssignee = null;
                        break;
                    case 'my':
                        $scope.owner=assignee;
                        var params=$scope.getRequestParams();
                        Lead.list($scope, params, true);
                        $scope.leadsAssignee = assignee;
                        $scope.leadsfilter = filter;
                        break;
                };
            }
        }
        // Sorting
        $scope.orderBy = function (order) {

            $scope.order = order;
            var params=$scope.getRequestParams();
            Lead.list($scope, params);
            
        };
        $scope.filterByOwner = function (filter) {

            if (filter) {
                var params = {
                    'owner': filter,
                    'order': $scope.order
                }
            }
            else {
                var params = {
                    'order': $scope.order
                }
            }
            ;
            Lead.list($scope, params);
        };
        $scope.filterByStatus = function (filter) {
            if (filter) {
                var params = {
                    'status': filter,
                    'order': $scope.order
                }
            }
            else {
                var params = {
                    'order': $scope.order
                }
            }
            ;
            $scope.isFiltering = true;
            Lead.list($scope, params);
        };


        /***********************************************
         HKA 19.02.2014  tags
         ***************************************************************************************/
        $scope.listTags = function () {
            var paramsTag = {'about_kind': 'Lead'}
            Tag.list($scope, paramsTag);
        };

        $scope.edgeInserted = function () {
            $scope.listleads();
        };
        $scope.listleads = function () {
            var params = {
                'order': $scope.order,
                'limit': 20
            }
            Lead.list($scope, params);
            var paramsTag = {'about_kind': 'Lead'};
            Tag.list($scope, paramsTag);
        };


        $scope.addNewtag = function (tag) {

            var params = {
                'name': tag.name,
                'about_kind': 'Lead',
                'color': tag.color.color
            };
            Tag.insert($scope, params);
            $scope.tag.name = '';
            $scope.tag.color = {'name': 'green', 'color': '#BBE535'};
        };
        $scope.tagInserted=function(resp){
            if ($scope.tags==undefined) {
                $scope.tags=[];
            };
            $scope.tags.unshift(resp);
            $scope.apply();
        }
        $scope.updateTag = function (tag) {
            params = {
                'id': tag.id,
                'title': tag.name,
                'status': tag.color
            };
            Tag.patch($scope, params);
        };
        $scope.deleteTag = function (tag) {

            params = {
                'entityKey': tag.entityKey
            }
            Tag.delete($scope, params);

        };

        $scope.selectTag = function (tag, index, $event) {

            if (!$scope.manage_tags) {
                var element = $($event.target);
                if (element.prop("tagName") != 'LI') {
                    element = element.parent();
                    element = element.parent();
                }
                var text = element.find(".with-color");
                if ($scope.selected_tags.indexOf(tag) == -1) {
                    $scope.selected_tags.push(tag);
                    /*element.css('background-color', tag.color+'!important');
                     text.css('color',$scope.idealTextColor(tag.color));*/

                } else {
                    /*element.css('background-color','#ffffff !important');*/
                    $scope.selected_tags.splice($scope.selected_tags.indexOf(tag), 1);
                    /*text.css('color','#000000');*/
                }
                ;
                $scope.filterByTags($scope.selected_tags);

            }

        };


         $scope.filterByTags = function (selected_tags) {
            var tags = [];
            angular.forEach(selected_tags, function (tag) {
                tags.push(tag.entityKey);
            });
            var params = $scope.getRequestParams();
            $scope.isFiltering = true;
            Lead.list($scope, params);

        };

        $scope.unselectAllTags = function () {
            $('.tags-list li').each(function () {
                var element = $(this);
                var text = element.find(".with-color");
                element.css('background-color', '#ffffff !important');
                text.css('color', '#000000');
            });
        };
//HKA 19.02.2014 When delete tag render account list
        $scope.tagDeleted = function () {
            $scope.listleads();
        };


        $scope.editbeforedelete = function (lead) {
            $scope.selectedCards = [lead];
            $('#BeforedeleteSelectedLeads').modal('show');
        };
        $scope.deletelead = function () {
            var params = {'entityKey': $scope.selectedLead.entityKey};
            Lead.delete($scope, params);
            $('#BeforedeleteLead').modal('hide');
        };
        $scope.manage = function () {
            $scope.unselectAllTags();
        };
        $scope.tag_save = function (tag) {
            if (tag.name) {
                Tag.insert($scope, tag);

            }
            ;
        };

        $scope.editTag = function (tag, index) {
            document.getElementById("tag_" + index).style.backgroundColor = "white";
            document.getElementById("closy_" + index).style.display = "none";
            document.getElementById("checky_" + index).style.display = "none";

            $scope.edited_tag = tag;
        }
        $scope.hideEditable = function (index, tag) {
            document.getElementById("tag_" + index).style.backgroundColor = tag.color;
            document.getElementById("closy_" + index).removeAttribute("style");
            document.getElementById("checky_" + index).style.display = "inline";

            $scope.edited_tag = null;
        }
        $scope.doneEditTag = function (tag) {
            $scope.edited_tag = null;
            $scope.updateTag(tag);
        }
        $scope.addTags = function () {
            var tags = [];
            var items = [];
            tags = $('#select2_sample2').select2("val");

            angular.forEach($scope.selected_tasks, function (selected_task) {
                angular.forEach(tags, function (tag) {
                    var edge = {
                        'start_node': selected_task.entityKey,
                        'end_node': tag,
                        'kind': 'tags',
                        'inverse_edge': 'tagged_on'
                    };
                    items.push(edge);
                });
            });

            params = {
                'items': items
            }

            Edge.insert($scope, params);
            $('#assigneeTagsToTask').modal('hide');

        };


        $('#addMemberToTask > *').on('click', null, function (e) {
            e.stopPropagation();
        });
        $scope.idealTextColor = function (bgColor) {
            var nThreshold = 105;
            var components = getRGBComponents(bgColor);
            var bgDelta = (components.R * 0.299) + (components.G * 0.587) + (components.B * 0.114);

            return ((255 - bgDelta) < nThreshold) ? "#000000" : "#ffffff";
        }
        function getRGBComponents(color) {

            var r = color.substring(1, 3);
            var g = color.substring(3, 5);
            var b = color.substring(5, 7);

            return {
                R: parseInt(r, 16),
                G: parseInt(g, 16),
                B: parseInt(b, 16)
            };
        }

        $scope.dragTag = function (tag) {

            $scope.draggedTag = tag;
            // $scope.apply();
        };
        $scope.dropTag = function (lead, index) {

            var items = [];

            var params = {
                'parent': lead.entityKey,
                'tag_key': $scope.draggedTag.entityKey
            };
            $scope.draggedTag = null;
            
            
            Tag.attach($scope, params, index);

        };
        $scope.tagattached = function (tag, index) {
            if (index >= 0) {
                if ($scope.leads[index].tags == undefined) {
                    $scope.leads[index].tags = [];
                }
                var ind = $filter('exists')(tag, $scope.leads[index].tags);
                if (ind == -1) {
                    $scope.leads[index].tags.push(tag);
                    var card_index = '#card_' + index;
                    $(card_index).removeClass('over');
                } else {
                    var card_index = '#card_' + index;
                    $(card_index).removeClass('over');
                }


            } else {
                if ($scope.selectedCards.length > 0) {
                    angular.forEach($scope.selectedCards, function (selected_lead) {
                        
                        var existstag = false;
                        angular.forEach(selected_lead.tags, function (elementtag) {
                            if (elementtag.id == tag.id) {
                                existstag = true;
                            }
                            ;
                        });
                        if (!existstag) {
                            if (selected_lead.tags == undefined) {
                                selected_lead.tags = [];
                            }
                            selected_lead.tags.push(tag);
                        }
                        ;
                    });
                    /* $scope.selectedCards=[];*/
                }
                ;
                $scope.apply();
            }
            ;
        }

        // HKA 12.03.2014 Pallet color on Tags
        $scope.checkColor = function (color) {
            $scope.tag.color = color;
        };


        //HKA 19.06.2014 Detache tag on contact list
        $scope.dropOutTag = function () {

            var params = {'entityKey': $scope.edgekeytoDelete}
            Edge.delete($scope, params);
            $scope.edgekeytoDelete = undefined;
            $scope.showUntag = false;

        }
        $scope.dragTagItem = function (tag, contact) {

            $scope.showUntag = true;
            $scope.edgekeytoDelete = tag.edgeKey;
            $scope.tagtoUnattach = tag;
            $scope.contacttoUnattachTag = contact;
        }
        $scope.tagUnattached = function () {
            
            $scope.contacttoUnattachTag.tags.splice($scope.contacttoUnattachTag.tags.indexOf($scope.tagtoUnattach), 1)
            $scope.apply()
        };
        $scope.showConvertModal = function () {
            $('#LeadsShow').modal('show');

        };


        $scope.showImportModal = function () {
            $('#importModal').modal('show');
        }

        $scope.doTheMapping = function (resp) {

            $('#importModalMapping').modal('show');


        }
        $scope.updateTheMapping = function (key, matched_column) {
            $scope.mappingColumns[key].matched_column = matched_column;
            $scope.apply();
        }
        $scope.sendTheNewMapping = function () {
            $('#importModalMapping').modal('hide');
            // params to send include the $scope.mappingColoumns, job_id
            var params = {
                'job_id': $scope.job_id,
                'items': $scope.mappingColumns
            };

            Lead.importSecondStep($scope, params);
            // invoke the right service
            // hide the modal
        }
        $scope.showImportMessages = function () {
            $('#importMessagesModal').modal('show');
        }


        $scope.createPickerUploader = function () {

            $('#importModal').modal('hide');
            var developerKey = 'AIzaSyDHuaxvm9WSs0nu-FrZhZcmaKzhvLiSczY';
            var docsView = new google.picker.DocsView()
                .setIncludeFolders(true)
                .setSelectFolderEnabled(true);
            var picker = new google.picker.PickerBuilder().
                addView(new google.picker.DocsUploadView()).
                addView(docsView).
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
                        'file_id': data.docs[0].id,
                        'file_type': $scope.file_type
                    };
                    Lead.import($scope, params);
                }
            }
        }


        $scope.ExportCsvFile = function () {
            if ($scope.selectedCards.length != 0) {
                $scope.msg = "Do you want export  selected leads"

            } else {
                if ($scope.selected_tags.length != 0) {
                    $scope.msg = "Do you want export  leads with the selected tags"

                } else $scope.msg = "Do you want export  all leads"


            }
            $("#TakesFewMinutes").modal('show');
        }
        $scope.LoadCsvFile = function () {
            
            if ($scope.selectedCards.length != 0) {
                var ids = [];
                angular.forEach($scope.selectedCards, function (selected_lead) {
                    ids.push(selected_lead.id);
                });
                Lead.export_key($scope, {ids: ids});
            } else {
                var tags = [];
                angular.forEach($scope.selected_tags, function (selected_tag) {
                    tags.push(selected_tag.entityKey);
                });
                var params = {"tags": tags};
                
                Lead.export($scope, params);
                $scope.selectedKeyLeads = [];
            }
            $("#TakesFewMinutes").modal('hide');
        }
        $scope.DataLoaded = function (data) {
            $("#load_btn").removeAttr("disabled");
            $("#close_btn").removeAttr("disabled");
            $scope.isExporting = false;
            $("#TakesFewMinutes").modal('hide');
            $scope.$apply()

            $scope.JSONToCSVConvertor($scope.serializedata(data), "Leads", true);
        }


        $scope.serializedata = function (data) {
            for (var i = data.length - 1; i >= 0; i--) {
                if (data[i].firstname) {
                    data[i].firstname = data[i]["firstname"];
                } else {
                    data[i]["firstname"] = "";
                }
                if (data[i].lastname) {
                    data[i].lastname = data[i]["lastname"];
                } else {
                    data[i]["lastname"] = "";
                }
                if (data[i].source) {
                    data[i].source = data[i]["source"];
                } else {
                    data[i]["source"] = "";
                }
                if (data[i].company) {
                    data[i].company = data[i]["company"];
                } else {
                    data[i]["company"] = "";
                }
                if (data[i].emails) {
                    data[i].emails = data[i]["emails"]
                } else {
                    data[i]["emails"] = new Object();
                }
                if (data[i].phones) {
                    data[i].phones = data[i]["phones"]
                } else {
                    data[i]["phones"] = new Object();
                }
                if (data[i].addresses) {
                    data[i].addresses = data[i]["addresses"]
                } else {
                    data[i]["addresses"] = new Object();
                }
            }
            ;

            return data;

        }
        $scope.JSONToCSVConvertor = function (JSONData, ReportTitle, ShowLabel) {

            //If JSONData is not an object then JSON.parse will parse the JSON string in an Object
            var arrData = typeof JSONData != 'object' ? JSON.parse(JSONData) : JSONData;

            var CSV = '';
            //Set Report title in first row or line

            CSV += ReportTitle + '\r\n\n';

            //This condition will generate the Label/Header
            if (ShowLabel) {
                var row = "";

                // //This loop will extract the label from 1st index of on array
                // for (var index in arrData[0]) {

                //     //Now convert each value to string and comma-seprated
                //     row += index + ',';
                // }
                row = 'firstname,lastname,source,company,emails,phones,addresses';
                row = row.slice(0, -1);

                //append Label row with line break
                CSV += row + '\r\n';
            }

            //1st loop is to extract each row
            for (var i = 0; i < arrData.length; i++) {


                var row = "";
                var phonesCont = "";
                var emailsCont = "";
                var addressesCont = "";
                /***************************************/
                if (arrData[i]["phones"].items) {
                    phonesCont = ""
                    for (var j = 0; j < arrData[i]["phones"].items.length; j++) {
                        phonesCont += arrData[i]["phones"].items[j].number + " ";
                    }


                }
                /**************************************/
                if (arrData[i]["emails"].items) {
                    emailsCont = ""
                    for (var k = 0; k < arrData[i]["emails"].items.length; k++) {
                        emailsCont += arrData[i]["emails"].items[k].email + " ";
                    }


                }
                /*******************************/
                if (arrData[i]["addresses"].items) {
                    addressesCont = "";

                    for (var k = 0; k < arrData[i]["addresses"].items.length; k++) {
                        addressesPac = ""
                        if (arrData[i]["addresses"].items[k].country) {
                            addressesPac += arrData[i]["addresses"].items[k].country + ",";
                        }
                        if (arrData[i]["addresses"].items[k].city) {
                            addressesPac += arrData[i]["addresses"].items[k].city + ",";
                        }
                        if (arrData[i]["addresses"].items[k].state) {
                            addressesPac += arrData[i]["addresses"].items[k].state + ",";
                        }
                        if (arrData[i]["addresses"].items[k].street) {
                            addressesPac += arrData[i]["addresses"].items[k].street + ",";
                        }
                        if (arrData[i]["addresses"].items[k].postal_code) {
                            addressesPac += arrData[i]["addresses"].items[k].postal_code + ",";
                        }


                        addressesCont += addressesPac + " ";
                    }


                }

                //2nd loop will extract each column and convert it in string comma-seprated
                row = '"' + arrData[i]["firstname"] + '",' + '"' + arrData[i]["lastname"] + '",' + '"' + arrData[i]['source'] + '",' + '"' + arrData[i]["company"] + '",' + '"' + emailsCont + '",' + '"' + phonesCont + '",' + '"' + addressesCont + '",';

                row.slice(0, row.length - 1);

                //add a line break after each row
                CSV += row + '\r\n';
            }

            if (CSV == '') {
                alert("Invalid data");
                return;
            }

            //Generate a file name
            var fileName = "My_list_of_";
            //this will remove the blank-spaces from the title and replace it with an underscore
            fileName += ReportTitle.replace(/ /g, "_");

            //Initialize file format you want csv or xls
            var uri = 'data:text/csv;charset=utf-8,' + escape(CSV);

            // Now the little tricky part.
            // you can use either>> window.open(uri);
            // but this will not work in some browsers
            // or you will not get the correct file extension    

            //this trick will generate a temp <a /> tag
            var link = document.createElement("a");
            link.href = uri;

            //set the visibility hidden so it will not effect on your web-layout
            link.style = "visibility:hidden";
            link.download = fileName + ".csv";

            //this part will append the anchor tag and remove it after automatic click
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }


        $scope.checkScrollBar = function () {

            var hContent = $("body").height();
            var hWindow = $(window).height();


            if (hContent > hWindow) {

                $scope.isbigScreen = false;
            } else {

                $scope.isbigScreen = true;
            }

            $scope.apply();

        }
        //HKA 11.10.2015 function filter by source

        $scope.filter_by_source= function (filter) {
                if ($scope.leadsSourceFilter==filter) { 
                    return;
                };
                $scope.leadsSourceFilter=filter;
                // console.log(filter);
                // console.log($scope.leadsSourceFilter);
                $scope.apply();
                params=$scope.getRequestParams();
                $scope.isFiltering = true;
                Lead.list($scope, params);
        }
        // Google+ Authentication
        Auth.init($scope);
        $(window).scroll(function () {
            if (!$scope.isLoading && !$scope.isFiltering && ($(window).scrollTop() > $(document).height() - $(window).height() - 100)) {
                if ($scope.leadpagination.next) {
                        $scope.listMoreItems();    
                };
            }
        });
    }]);

app.controller('LeadShowCtrl', ['$scope', '$http','$filter', '$route', 'Auth', 'Email', 'Task', 'Event', 'Topic', 'Note', 'Lead', 'Permission', 'User', 'Leadstatus', 'Attachement', 'Map', 'InfoNode', 'Tag', 'Edge', 'Opportunitystage', 'Opportunity', 'Linkedin','Customfield',
    function ($scope, $http, $filter, $route, Auth, Email, Task, Event, Topic, Note, Lead, Permission, User, Leadstatus, Attachement, Map, InfoNode, Tag, Edge, Opportunitystage, Opportunity, Linkedin,Customfield) {
        $("ul.page-sidebar-menu li").removeClass("active");
        $("#id_Leads").addClass("active");


        $scope.editLead = function () {
            $('#EditLeadModal').modal('show');
        };
        trackMixpanelAction('LEAD_SHOW_VIEW');

        $scope.isSignedIn = false;
        $scope.immediateFailed = false;
        $scope.isContentLoaded = false;
        $scope.pagination = {};
        $scope.currentPage = 01;
        //HKA 10.12.2013 Var topic to manage Next & Prev
        $scope.topicCurrentPage = 01;
        $scope.topicpagination = {};
        $scope.topicpages = [];
        $scope.nextPageToken = undefined;
        $scope.prevPageToken = undefined;
        $scope.pages = [];
        $scope.lead = {};
        $scope.status_selected = {};
        $scope.ownerSelected = {};
        $scope.selected_members = [];
        $scope.selected_member = {};
        $scope.users = [];
        $scope.user = undefined;
        $scope.slected_memeber = undefined;
        $scope.isLoading = false;
        $scope.nbLoads = 0;
        $scope.email = {};
        $scope.infonodes = {};
        $scope.phone = {};
        $scope.collaborators_list = [];
        $scope.ioevent = {};
        $scope.phone.type = 'work';
        $scope.documentpagination = {};
        $scope.documentCurrentPage = 01;
        $scope.documentpages = [];
        $scope.selectedTab = 2;
        $scope.sharing_with = [];
        $scope.newTaskform = false;
        $scope.newEventform = false;
        $scope.newTask = {};
        $scope.ioevent = {};
        $scope.linkedProfile = {};
        $scope.linkedShortProfile = {};
        $scope.twitterProfile = {};
        $scope.sendWithAttachments = [];
        $scope.customfields = [];
        $scope.showNewOpp = false;
        $scope.opportunities = [];
        $scope.opppagination = {};
        $scope.oppCurrentPage = 01;
        $scope.opppages = [];
        $scope.tab = 'about'
        $scope.tabtags = [];
        $scope.screen_name = ''
        $scope.smallModal = false;
        $scope.showPsychometrics = true;
        $scope.opportunity = {access: 'public', currency: 'USD', duration_unit: 'fixed', closed_date: new Date()};
        $scope.imageSrc = '/static/img/avatar_contact.jpg';
        $scope.showEdit = false;
        $scope.linkedLoader = false;
        $scope.linkedProfileresume = null;
        $scope.competitors=[];
        $scope.opportunity.competitors=[];
        $scope.oppCustomfields=[];
        $scope.invites = [];
        $scope.allday = false;
        $scope.guest_modify = false;
        $scope.guest_invite = true;
        $scope.guest_list = true;
        $scope.chartOptions = {
            animate: {
                duration: 0,
                enabled: false
            },
            size: 100,
            barColor: '#58a618',
            scaleColor: '#58a618',
            lineWidth: 7,
            lineCap: 'circle'
        };
        $scope.Math = window.Math;
        $scope.noLinkedInResults = false;
        $scope.listPeople = [];
        $scope.emailSentMessage = false;
        $scope.watsonUrl = null;
        $scope.leads={
            customfield:{options:[]}
        };

        $scope.timezone = document.getElementById('timezone').value;
        $scope.accounts=[];
        $scope.topOppButton='new';
        $scope.selectedOpps=[];
        $scope.selectedDocs=[];
        $scope.opportunity.timeline=[];
        $scope.opportunity.competitors=[];
        $scope.opportunity.notes=[];
        $scope.allOppsSelected=false;
        $scope.newDoc=true;
        $scope.docInRelatedObject=true;
        $scope.industries = ["Accounting ", "Airlines/Aviation ", "Alternative Dispute Resolution ", "Alternative Medicine ", "Animation ", "Apparel &amp; Fashion ", "Architecture &amp; Planning ", "Arts &amp; Crafts ", "Automotive ", "Aviation &amp; Aerospace ", "Banking ", "Biotechnology ", "Broadcast Media ", "Building Materials ", "Business Supplies &amp; Equipment ", "Capital Markets ", "Chemicals ", "Civic &amp; Social Organization ", "Civil Engineering ", "Commercial Real Estate ", "Computer &amp; Network Security ", "Computer Games ", "Computer Hardware ", "Computer Networking ", "Computer Software ", "Construction ", "Consumer Electronics ", "Consumer Goods ", "Consumer Services ", "Cosmetics ", "Dairy ", "Defense &amp; Space ", "Design ", "Education Management ", "E-learning ", "Electrical &amp; Electronic Manufacturing ", "Entertainment ", "Environmental Services ", "Events Services ", "Executive Office ", "Facilities Services ", "Farming ", "Financial Services ", "Fine Art ", "Fishery ", "Food &amp; Beverages ", "Food Production ", "Fundraising ", "Furniture ", "Gambling &amp; Casinos ", "Glass, Ceramics &amp; Concrete ", "Government Administration ", "Government Relations ", "Graphic Design ", "Health, Wellness &amp; Fitness ", "Higher Education ", "Hospital &amp; Health Care ", "Hospitality ", "Human Resources ", "Import &amp; Export ", "Individual &amp; Family Services ", "Industrial Automation ", "Information Services ", "Information Technology &amp; Services ", "Insurance ", "International Affairs ", "International Trade &amp; Development ", "Internet ", "Investment Banking/Venture ", "Investment Management ", "Judiciary ", "Law Enforcement ", "Law Practice ", "Legal Services ", "Legislative Office ", "Leisure &amp; Travel ", "Libraries ", "Logistics &amp; Supply Chain ", "Luxury Goods &amp; Jewelry ", "Machinery ", "Management Consulting ", "Maritime ", "Marketing &amp; Advertising ", "Market Research ", "Mechanical or Industrial Engineering ", "Media Production ", "Medical Device ", "Medical Practice ", "Mental Health Care ", "Military ", "Mining &amp; Metals ", "Motion Pictures &amp; Film ", "Museums &amp; Institutions ", "Music ", "Nanotechnology ", "Newspapers ", "Nonprofit Organization Management ", "Oil &amp; Energy ", "Online Publishing ", "Outsourcing/Offshoring ", "Package/Freight Delivery ", "Packaging &amp; Containers ", "Paper &amp; Forest Products ", "Performing Arts ", "Pharmaceuticals ", "Philanthropy ", "Photography ", "Plastics ", "Political Organization ", "Primary/Secondary ", "Printing ", "Professional Training ", "Program Development ", "Public Policy ", "Public Relations ", "Public Safety ", "Publishing ", "Railroad Manufacture ", "Ranching ", "Real Estate ", "Recreational Facilities &amp; Services ", "Religious Institutions ", "Renewables &amp; Environment ", "Research ", "Restaurants ", "Retail ", "Security &amp; Investigations ", "Semiconductors ", "Shipbuilding ", "Sporting Goods ", "Sports ", "Staffing &amp; Recruiting ", "Supermarkets ", "Telecommunications ", "Textiles ", "Think Tanks ", "Tobacco ", "Translation &amp; Localization ", "Transportation/Trucking/Railroad ", "Utilities ", "Venture Capital ", "Veterinary ", "Warehousing ", "Wholesale ", "Wine &amp; Spirits ", "Wireless ", "Writing &amp; Editing"];
        if ($scope.timezone == "") {
            $scope.timezone = moment().format("Z");
        }


        $scope.inProcess = function (varBool, message) {
            if (varBool) {
                if (message) {
                    
                }
                ;
                $scope.nbLoads = $scope.nbLoads + 1;
                if ($scope.nbLoads == 1) {
                    $scope.isLoading = true;
                }
                ;
            } else {
                if (message) {
                    
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
        $scope.getCoverUrl = function () {
            var url = "/static/img/covers/" + Math.floor(Math.random() * 5 + 1) + ".jpg";
            return url;
        }
        $scope.lunchMaps = function (lat, lng, address) {
            if (lat && lng) {
                window.open('http://www.google.com/maps/place/' + lat + ',' + lng, 'winname', "width=700,height=550");
            } else {
                var locality = address.formatted || address.street + ' ' + address.city + ' ' + address.state + ' ' + address.country;
                window.open('http://www.google.com/maps/search/' + locality, 'winname', "width=700,height=550");
            }
            ;
        }
        $scope.statuses = [
            {value: 'Home', text: 'Home'},
            {value: 'Work', text: 'Work'},
            {value: 'Mob', text: 'Mob'},
            {value: 'Other', text: 'Other'}
        ];
        $scope.showPage = true;
        $scope.profile_img = {
            'profile_img_id': null,  
            'profile_img_url': null
        };
        $scope.addAddressesInMap = function () {
            Map.setLocation($scope, $scope.infonodes.addresses);
        }
        $scope.fromNow = function (fromDate) {
            return moment(fromDate, "YYYY-MM-DD HH:mm Z").fromNow();
        }
        $scope.EditAllShow = function () {
            if ($scope.showEdit) {
                $scope.leadFirstName.$hide();
                $scope.leadTitle.$hide();
                $scope.leadLastName.$hide();
                $scope.leadCompany.$hide();
            } else {
                $scope.leadFirstName.$show();
                $scope.leadTitle.$show();
                $scope.leadLastName.$show();
                $scope.leadCompany.$show();
            }
            ;
            $scope.showEdit = !$scope.showEdit;
        }
        $scope.showAssigneeTagsToLead = function () {
            $('#assigneeTagsToLead').modal('show');
        };
        $scope.getScreen_name = function (infonodes) {
            console.log("infonodes__________________", infonodes)
            var sn = ''
            var result = $.grep(infonodes.items, function (e) {
                return e.kind == 'sociallinks';
            })

            $scope.screen_name = result[0].items[0].screen_name
            console.log(sn)
        }
        $scope.addNoteOpp = function () {
            $scope.opportunity.notes.push($scope.newOppNote)
            $scope.newOppNote = {}
        }
        /* prepare url and urlSource function must be added to show social links logos*/
        $scope.prepareUrl = function (url) {
            var pattern = /^[a-zA-Z]+:\/\//;
            if (!pattern.test(url)) {
                url = 'http://' + url;
            }
            return url;
        }
        $scope.urlSource = function (url) {
            var links = ["aim", "bebo", "behance", "blogger", "delicious", "deviantart", "digg", "dribbble", "evernote", "facebook", "fastfm", "flickr", "formspring", "foursquare", "github", "google-plus", "instagram", "linkedin", "myspace", "orkut", "path", "pinterest", "quora", "reddit", "rss", "soundcloud", "stumbleupn", "technorati", "tumblr", "twitter", "vimeo", "wordpress", "yelp", "youtube"];
            var match = "";
            angular.forEach(links, function (link) {
                var matcher = new RegExp(link);
                var test = matcher.test(url);
                if (test) {
                    match = link;
                }
            });
            if (match == "") {
                match = 'globe';
            }
            ;
            return match;
        }
        $scope.leadDeleted = function () {
            window.location.replace('#/leads');
        }

        $scope.topButtonAction=function(){
            switch ($scope.selectedTab) {
                case 2:
                    // about edit
                    $scope.showEdit=!$scope.showEdit;
                    break;
                case 5:
                    switch ($scope.topOppButton) {
                        case 'new':
                            $scope.showNewOpp=true;
                            $scope.topOppButton='save';
                            break;
                        case 'save':
                            $scope.saveOpp($scope.opportunity);
                            break;
                    }
                    break;
                default:
                    $scope.showEdit=!$scope.showEdit;
            }
        }
        $scope.topButtonMessage=function(){
            switch ($scope.selectedTab) {
                case 2:
                    if ($scope.showEdit) {
                        return 'Save';
                    }else{
                        return 'Edit';
                    };
                    break;
                case 5:
                    switch ($scope.topOppButton) {
                        case 'new':
                                return "New opportunity"
                            break;
                        case 'save':
                                return "Save opportunity"
                            break;
                    }
                    break;
                default:
                         if ($scope.showEdit) { 
                            return 'Save';
                        }else{
                            return 'Edit';
                        };
                        break;
            }
        }
        $scope.showAssigneeTags = function (lead) {
            $('#assigneeTagsToLeads').modal('show');
            $scope.currentLead = lead;
        };

        $scope.showAddEventPopup = function () {
            $scope.locationShosen = false;
            $('#newEventModalForm').modal('show');
        }
        $scope.showAddTimeScale = function () {

            $('#newTimeModalForm').modal('show');
        }
                //HKA 10.11.2013 Add event
        $scope.addTimeScale = function (timescale) {
            console.log("in time scale function");
            if (timescale.title != null && timescale.title != "") {
                console.log("in condition");
                var params = {}
                $scope.allday = true;
                var ends_at = moment(moment(timescale.starts_at_allday).format('YYYY-MM-DDT00:00:00.000000'))

                params = {
                    'title': timescale.title,
                    'starts_at': $filter('date')(timescale.starts_at_allday, ['yyyy-MM-ddT00:00:00.000000']),
                    'ends_at': ends_at.add('hours', 23).add('minute', 59).add('second', 59).format('YYYY-MM-DDTHH:mm:00.000000'),
                    'allday': "true",
                    'access': $scope.opportunity.access,
                    'parent': $scope.opportunity.entityKey,
                    'reminder': $scope.reminder,
                    'timezone': $scope.timezoneChosen
                }
                $scope.opportunity.timeline.push(params);
                console.log($scope.opportunity.timeline);
                $('#newTimeModalForm').modal('hide');

                $scope.timescale = {};
                $scope.timezonepicker = false;
                $scope.timezone = "";
                $scope.remindme_show = "";
                $scope.show_choice = "";
                $scope.parent_related_to = "";
                $scope.Guest_params = false;
                $scope.searchRelatedQuery = "";
                $scope.something_picked = false;
                $scope.newEventform = false;
                $scope.remindmeby = false;

            }
        }
        $scope.deleteEvent =function(eventt){
          var ind=$scope.opportunity.timeline.indexOf(eventt)
          $scope.opportunity.timeline.splice(ind,1);
           //$('#addLeadModal').modal('show');
         }
         $scope.deletePicked= function(){
              $scope.something_picked=false;
              $scope.remindme_show="";
              $scope.remindmeby=false;
            }


            $scope.reminder=0;
            $scope.Remindme=function(choice){
              $scope.reminder=0;
              $scope.something_picked=true;
             $scope.remindmeby=true;  
              switch(choice){
                case 0: 
                $scope.remindme_show="No notification";
                $scope.remindmeby=false;  
                break;
                case 1:
                $scope.remindme_show="At time of event"; 
                $scope.reminder=1;
                break;
                case 2:
                $scope.remindme_show="30 minutes before";
                $scope.reminder=2;  
                break;
                case 3: 
                $scope.remindme_show="1 hour";
                $scope.reminder=3; 
                break;
                case 4: 
                $scope.remindme_show="1 day"; 
                $scope.reminder=4;
                break;
                case 5:
                $scope.remindme_show="1 week";
                $scope.reminder=5;  
                break;
              }
             
              }
        $scope.emailSignature = document.getElementById("signature").value;
        if ($scope.emailSignature == "None") {
            $scope.emailSignature = "";
        } else {
            $scope.emailSignature = "<br/><br/><br/><br/><br/><br/><br/><br/><br/><br/><div style='text-align: center'>"
                + $scope.emailSignature + "</div>";
        }
        document.getElementById("some-textarea").value =  $scope.emailSignature;

        $scope.isSelectedDoc = function (doc) {
            return ($scope.selectedDocs.indexOf(doc) >= 0);
        };
        $scope.selectDocWithCheck=function($event,index,doc){

              var checkbox = $event.target;

               if(checkbox.checked){
                  if ($scope.selectedDocs.indexOf(doc) == -1) {             
                    $scope.selectedDocs.push(doc);
                    console.log("opp pushed");
                    console.log($scope.selectedDocs);
                  }
               }else{       

                    $scope.selectedDocs.splice($scope.selectedDocs.indexOf(doc) , 1);
               }

        }
        $scope.isSelectedOpp = function (opp) {
            return ($scope.selectedOpps.indexOf(opp) >= 0);
        };
        $scope.selectOppWithCheck=function($event,index,opportunity){

              var checkbox = $event.target;

               if(checkbox.checked){
                  if ($scope.selectedOpps.indexOf(opportunity) == -1) {             
                    $scope.selectedOpps.push(opportunity);
                    console.log("opp pushed");
                    console.log($scope.selectedOpps);
                  }
               }else{       

                    $scope.selectedOpps.splice($scope.selectedOpps.indexOf(opportunity) , 1);
               }

        }
        $scope.prepareEmbedLink=function(link){
                return link.replace(/preview/gi, "edit");
        }
        $scope.editbeforedeleteDoc=function(){
            $('#beforedeleteDoc').modal('show');
        }
        $scope.deleteDocs=function(){
            var params={}
            angular.forEach($scope.selectedDocs, function (doc) {
                params={
                    entityKey:doc.entityKey
                }
                Attachement.delete($scope, params);
            });
            $('#beforedeleteDoc').modal('hide');
        }
        $scope.docDeleted=function(entityKey){
            var ind=null;
            var listIndex=null;
            console.log("in docDeleted");
            console.log("entityKey");
            console.log(entityKey);
            angular.forEach($scope.selectedDocs, function (doc) {
                if (doc.entityKey==entityKey) {
                    ind=$scope.selectedDocs.indexOf(doc);
                    listIndex=$scope.documents.indexOf(doc);
                    console.log("doc index found");
                    console.log("listIndex",ind);
                    console.log("listIndex",listIndex);
                };
            });
            if (ind!=-1) {
                console.log("in if ind");
                $scope.documents.splice(listIndex,1);
                $scope.selectedDocs.splice(ind,1);
                $scope.apply(); 
                if ($scope.documents.length==0) {
                    $scope.blankStatdocuments=true;
                };
                console.log($scope.documents);
                console.log($scope.selectedDocs);
            };
        };
        $scope.unselectAllOpp = function ($event) {
            var element = $($event.target);
            $scope.selectedOpps=[];
        };
        $scope.selectAllOpp = function ($event) {

            var checkbox = $event.target;
            if (checkbox.checked) {
                $scope.selectedOpps = [];
                $scope.selectedOpps = $scope.selectedOpps.concat($scope.opportunities);

                $scope.allOppsSelected = true;

            } else {

                $scope.selectedOpps = [];
                $scope.allOppsSelected = false;

            }
        };
        $scope.runTheProcess = function () {


            var params = {
                'id': $route.current.params.leadId,
                'topics': {
                    'limit': '7'
                },

                'documents': {
                    'limit': '15'
                },

                'tasks': {},

                'events': {},
                'opportunities': {
                    'limit': '15'
                }
            };
            Lead.get($scope, params);
            console.log($scope.lead)
            User.list($scope, {});
            Leadstatus.list($scope, {});
            Opportunitystage.list($scope, {'order': 'probability'});
            $scope.getCustomFields("opportunities");
            var paramsTag = {'about_kind': 'Lead'};
            Tag.list($scope, paramsTag);
            $scope.mapAutocomplete();
            ga('send', 'pageview', '/leads/show');
            window.Intercom('update');
            $scope.mapAutocompleteCalendar()
        };
        // new linkedin
        $scope.messageFromSocialLinkCallback = function(event){
        if (event.origin!=='https://accounts.google.com'&&event.origin!=='https://gcdc2013-iogrow.appspot.com'&&event.origin!=='http://localhost:8090'){   
            console.log(event.origin);
            $scope.saveLinkedinData(event.data);
            window.removeEventListener("message", $scope.messageFromSocialLinkCallback, false);
        }
        };
        $scope.saveLinkedinData=function(data){
            console.log(data);
            var params={
              'id':$scope.lead.id,
              'firstname':data.firstname,
              'lastname':data.lastname,
              'industry':data.industry,
              'profile_img_url':data.profile_img_url,
              'linkedin_url':data.linkedin_url,
              'cover_image':data.imgCoverUrl,
              'title':data.title,
              'company':data.company,
              'introduction':data.introduction
            }
            Lead.patch($scope,params);
            $scope.imageSrc=data.profile_img_url;
            if (data.phone) $scope.addPhone({'number':data.phone,'type':'work'});
            if (data.email) $scope.addEmail({'email':data.email});
            if (data.linkedin_url) $scope.addSocial({'url':data.linkedin_url});
            if (data.locality) $scope.addGeo({'formatted':data.locality,'country':' '});
            //$scope.addWebsite({'url':data.linkedin_url})
            $scope.apply();
        }
         $scope.socialLinkOpener = function(socialLinkUrl){
            $scope.showLinkedinWindown=$scope.prepareUrl(socialLinkUrl);
            if (navigator.isChrome(navigator.sayswho)) {
                if (typeof (sessionStorage.isChromeExtensionInstalled) === 'undefined'){
                    $scope.browser='chrome';
                    $('#extensionNotInstalled').modal({backdrop: 'static', keyboard: false});
                }else{
                    window.open($scope.showLinkedinWindown,'winname','width=700,height=550');
                    window.addEventListener("message", $scope.messageFromSocialLinkCallback, false);
                }
            }else{
                $scope.browser='other';
                $('#extensionNotInstalled').modal({backdrop: 'static', keyboard: false});
            };    
        };
        $scope.lunchWindow=function(){
            window.open($scope.showLinkedinWindown,'winname','width=700,height=550');
            window.addEventListener("message", $scope.messageFromSocialLinkCallback, false);
        }
        $scope.editbeforedelete=function(){
            $("#beforedeleteLead").modal("show");
        }
        $scope.getCustomFields=function(related_object){
            Customfield.list($scope,{related_object:related_object});
        }
        $scope.listResponse=function(items,related_object){
            //infonodes.customfields
            if (related_object=="leads") {  
                $scope[related_object].customfields=items;
                var additionalCustomFields=[];
                angular.forEach($scope.infonodes.customfields, function (infonode) {
                        
                        infonode.property_type=infonode.fields[0].property_type;
                        infonode.value=infonode.fields[0].value;
                        infonode.field=infonode.fields[0].field;
                    if (infonode.property_type==""||infonode.property_type=="StringProperty"||infonode.property_type==null) {
                        console.log('in stringtype______________________________________ ');
                        console.log(infonode);
                        additionalCustomFields.push(infonode);
                    }else{
                            var schemaExists=false;
                            angular.forEach($scope[related_object].customfields, function (customfield) {
                            if (customfield.id==infonode.property_type) {
                                console.log('in not stringprope ______________________________');
                                console.log(infonode);
                                schemaExists=true;
                                var info_value=null;
                                if (infonode.fields[0].field=="property_type") {
                                    info_value=infonode.fields[1].value;
                                }else{
                                    info_value=infonode.fields[0].value;
                                };
                                if (customfield.field_type=="checkbox") {
                                    customfield.value=JSON.parse(info_value);
                                }else{
                                    customfield.value=info_value;
                                };
                              
                                customfield.infonode_key=infonode.entityKey;
                                
                                 
                                };
                            });
                            if (!schemaExists) {
                                 
                                additionalCustomFields.push(infonode);
                            };
                    };
                            
                    });
                    $scope.infonodes.customfields=additionalCustomFields;
            }else{
                  $scope.opp={};
                  $scope.opp.customfields=$.extend(true, [], items);
                  $scope.apply();
            };
            $scope.apply();
        }
        $scope.docCreated=function(url){
            console.log('here docCreated');
            window.open($scope.prepareEmbedLink(url),'_blank');
        }
        $scope.mapAutocompleteCalendar = function () {

            $scope.addresses = {};
            /*$scope.billing.addresses;*/
            Map.autocompleteCalendar($scope, "pac-input2");
        }


        $scope.addGeoCalendar = function (address) {

            $scope.ioevent.where = address.formatted
            $scope.locationShosen = true;
            $scope.$apply();
        };

        $scope.lunchMapsCalendar = function () {

            // var locality=address.formatted || address.street+' '+address.city+' '+address.state+' '+address.country;
            window.open('http://www.google.com/maps/search/' + $scope.ioevent.where, 'winname', "width=700,height=550");

        }


        $scope.isEmptyArray = function (Array) {
            if (Array != undefined && Array.length > 0) {
                return false;
            } else {
                return true;
            }
            ;

        }

        $scope.DrawPsychometrics = function () {
            try {
                $scope.nodes = $scope.lead.infonodes.items;
                for (var i = $scope.nodes.length - 1; i >= 0; i--) {
                    if ($scope.nodes[i].kind == "sociallinks") {
                        for (var j = $scope.nodes[i].items.length - 1; j >= 0; j--) {
                            $scope.Get_twitter_screen_name($scope.nodes[i].items[j].fields[0].value);


                        }
                        ;

                    }

                }
                ;

            } catch (e) {
                $scope.showPsychometrics = true;
            }

            $scope.$apply();
        };
        $scope.Get_twitter_screen_name = function (socialLinkurl) {
            var linkeType = socialLinkurl.slice(8, 15);
            var twitter_screen_name = socialLinkurl.slice(20)
            if (linkeType == "twitter") {
                $scope.showPsychometrics = false;
                $scope.twitterScreenName = twitter_screen_name;
            }

            $scope.$apply();
        };
        //$('#some-textarea').wysihtml5();
        $('#some-textarea').wysihtml5();
        $scope.gotosendMail = function (email) {
            // document.getElementById("some-textarea").value=$scope.emailSignature;

            $scope.email.to = email;
            $('#testnonefade').modal("show");
            $scope.smallSendMail();
            //  $(".wysihtml5-toolbar").hide();
        }
        $scope.switchwysihtml = function () {
            if ($(".wysihtml5-toolbar").is(":visible")) {

                $(".wysihtml5-toolbar").hide();
                $(".wysihtml5-sandbox").addClass("withoutTools");

            } else {

                $(".wysihtml5-sandbox").removeClass("withoutTools")
                $(".wysihtml5-toolbar").show();

            }
            ;
        }
        $scope.closeEmailModel = function () {
            $(".modal-backdrop").remove();
            $('#testnonefade').hide();

        }
        $scope.switchEmailModal = function () {
            if ($("#testnonefade").hasClass("emailModalOnBottom")) {
                $scope.bigSendMail();
                $scope.smallModal = true;
            } else {
                $scope.smallSendMail();
                $scope.smallModal = false;
            }
            ;
        }
        $scope.emailSentConfirmation = function () {
            
            
            $scope.email = {};
            $scope.showCC = false;
            $scope.showBCC = false;
            $('#testnonefade').modal("hide");
            $scope.emailSentMessage = true;
            setTimeout(function () {
                $scope.emailSentMessage = false;
                $scope.apply()
            }, 2000);
        }
        $scope.smallSendMail = function () {
            $(".modal-backdrop").remove();
            $('#testnonefade').addClass("emailModalOnBottom");
        }
        $scope.bigSendMail = function () {
            $('#testnonefade').removeClass("emailModalOnBottom");
            $("body").append('<div class="modal-backdrop fade in"></div>');

        }
        $scope.getColaborators = function () {
            $scope.collaborators_list = [];
            Permission.getColaborators($scope, {"entityKey": $scope.lead.entityKey});
            console.log($scope.lead)


        }
        // We need to call this to refresh token when user credentials are invalid
        $scope.mapAutocomplete = function () {
            //  $scope.addresses = $scope.account.addresses;
            Map.autocomplete($scope, "pac-input");
        }

        // LBA le 21-10-2014
        $scope.DeleteCollaborator = function (entityKey) {
            console.log("delete collaborators")
            var item = {
                'type': "user",
                'value': entityKey,
                'about': $scope.lead.entityKey
            };
            Permission.delete($scope, item)
            console.log(item)
        };
        $scope.refreshToken = function () {
            Auth.refreshToken();
        };


        // HKA 08.05.2014 Delete infonode
        $scope.deleteSocialLink = function (link, kind) {
            if (link.entityKey) {
                var pars = {'entityKey': link.entityKey, 'kind': kind};
                
                
                InfoNode.delete($scope, pars);
                if ($scope.linkedinUrl(link.url)) {
                    $scope.linkedProfile = {};
                    $scope.linkedShortProfile = {};
                    var params = {
                        "firstname": $scope.lead.firstname,
                        "lastname": $scope.lead.lastname
                    }
                    Linkedin.listPeople(params, function (resp) {
                        if (!resp.code) {
                            
                            if (resp.items == undefined) {
                                $scope.listPeople = [];
                                $scope.noLinkedInResults = true;
                            } else {
                                $scope.listPeople = resp.items;
                            }
                            ;
                            $scope.isLoading = false;
                            $scope.apply();
                        } else {
                            
                            if (resp.code == 401) {
                                // $scope.refreshToken();
                                
                                $scope.isLoading = false;
                                $scope.apply();
                            }
                            ;
                        }
                    });
                }
                ;
                if ($scope.twitterUrl(link.url)) {
                    
                    $scope.twProfile = {};
                    $scope.twShortProfiles = [];
                    $scope.watsonUrl = null;
                    var params = {
                        "firstname": $scope.lead.firstname,
                        "lastname": $scope.lead.lastname
                    }
                    Linkedin.getTwitterList(params, function (resp) {
                        $scope.twIsSearching = true;
                        $scope.twShortProfiles = [];
                        $scope.twProfile = {};
                        if (!resp.code) {
                            
                            
                            $scope.twIsSearching = false;
                            if (resp.items == undefined) {
                                $scope.twList = [];
                                $scope.twNoResults = true;
                                $scope.twIsSearching = false;
                            } else {
                                $scope.twList = resp.items;
                                if (resp.items.length < 4) {
                                    
                                    angular.forEach(resp.items, function (item) {
                                        
                                        $scope.getTwitterByUrl(item.url);
                                    });
                                }
                            }
                            ;
                            $scope.isLoading = false;
                            $scope.$apply();
                        }

                    });
                }
                ;
            } else {
                $scope.linkedShortProfile = {};
                $scope.linkedProfile = {};
                $scope.apply()
            }
            ;
        };

        $scope.deleteInfonode = function (entityKey, kind, val) {
            var params = {'entityKey': entityKey, 'kind': kind};
            if (params.kind=="customfields") {
                InfoNode.deleteCustom($scope, params);
            }else{
                InfoNode.delete($scope, params);
            };
            
            var str = $scope.email.to
            var newstr = str.replace(val + ",", "");
            $scope.email.to = newstr;

        };
        $scope.customfieldDeleted=function(entityKey){
            var index=null;
            angular.forEach($scope.infonodes.customfields, function (cus) {
              if (cus.entityKey==entityKey) {
                index=$scope.infonodes.customfields.indexOf(cus);
              };
            });
            if (index!=null) {
                $scope.infonodes.customfields.splice(index,1);
                $scope.apply();
            };
        };
        $scope.TopiclistNextPageItems = function () {


            var nextPage = $scope.topicCurrentPage + 1;
            var params = {};
            if ($scope.topicpages[nextPage]) {
                params = {
                    'id': $scope.lead.id,
                    'topics': {
                        'limit': '7',
                        'pageToken': $scope.topicpages[nextPage]
                    }
                }
                $scope.topicCurrentPage = $scope.topicCurrentPage + 1;
                Lead.get($scope, params);
            }

        }
        $scope.addTagsTothis = function () {

            var tags = [];
            var items = [];
            tags = $('#select2_sample2').select2("val");
            console.log("tagstags");
            console.log(tags);
            angular.forEach(tags, function (tag) {
                var params = {
                    'parent': $scope.lead.entityKey,
                    'tag_key': tag
                };
                Tag.attach($scope, params, -1, 'lead');
            });
            $('#select2_sample2').select2("val", "");
            $('#assigneeTagsToLead').modal('hide');
        };
        // LA assign tag to related tab elements 26-01-2015
        $scope.showAssigneeTagToTab = function (index) {
            $scope.currentIndex = index;
            $('#assigneeTagsToTab').modal('show');
            console.log($scope.currentIndex)
        };
        $scope.addTagsToTab = function () {
            var tags = [];
            var items = [];
            tags = $('#select2_sample3').select2("val");
            switch ($scope.tab) {
                case 'opportunity':
                    angular.forEach(tags, function (tag) {
                        var params = {
                            'parent': $scope.opportunities[$scope.currentIndex].entityKey,
                            'tag_key': tag
                        };
                        Tag.attach($scope, params, $scope.currentIndex, $scope.tab);
                    });
                    break;
                    $scope.currentIndex = null;
            }
            $('#assigneeTagsToTab').modal('hide');
        };
        // LA get tag when cliking on tabs 
        $scope.initTabs = function (tab) {
            var paramsTag = {};
            $scope.tab = tab;
            switch (tab) {
                case 'case':
                    paramsTag = {'about_kind': 'Case'};
                    Tag.list_v2($scope, paramsTag);
                    console.log("i'm here in case tab")
                    break;
                case 'opportunity':
                    paramsTag = {'about_kind': 'Opportunity'};
                    Tag.list_v2($scope, paramsTag);
                    console.log("i'm here in opportunity tab")
                    break;
            }
        }
        $scope.tagattached = function (tag, index, tab) {
            switch (tab) {

                case 'lead' :
                    if ($scope.lead.tags == undefined) {
                        $scope.lead.tags = [];
                    }
                    console.log("taggg ");
                    console.log(tag);
                    var ind = $filter('exists')(tag, $scope.lead.tags);
                    if (ind == -1) {
                        $scope.lead.tags.push(tag);

                    } else {
                    }
                    $('#select2_sample2').select2("val", "");
                    $scope.apply();
                    break;
                case 'case' :
                    if (index >= 0) {
                        if ($scope.cases[index].tags == undefined) {
                            $scope.cases[index].tags = [];
                        }
                        var ind = $filter('exists')(tag, $scope.cases[index].tags);
                        if (ind == -1) {
                            $scope.cases[index].tags.push(tag);
                            var card_index = '#card_' + index;
                            $(card_index).removeClass('over');
                        } else {
                            var card_index = '#card_' + index;
                            $(card_index).removeClass('over');
                        }
                    }

                    break;
                case 'opportunity' :
                    if (index >= 0) {
                        if ($scope.opportunities[index].tags == undefined) {
                            $scope.opportunities[index].tags = [];
                        }
                        var ind = $filter('exists')(tag, $scope.opportunities[index].tags);
                        if (ind == -1) {
                            $scope.opportunities[index].tags.push(tag);
                            var card_index = '#card_oppo_' + index;
                            $(card_index).removeClass('over');
                        } else {
                            var card_index = '#card_oppo_' + index;
                            $(card_index).removeClass('over');
                        }
                    }

                    break;

            }

        };
        $scope.edgeInserted = function () {
            /* $scope.tags.push()*/
        };
        $scope.removeTag = function (tag, $index) {

            var params = {'tag': tag, 'index': $index}
            Edge.delete($scope, params);
        }
        $scope.edgeDeleted = function (index) {
            $scope.lead.tags.splice(index, 1);
            $scope.apply();
        }

        $scope.listTopics = function (contact) {
            var params = {
                'id': $scope.lead.id,
                'topics': {
                    'limit': '7'
                }
            };
            Lead.get($scope, params);

        };
        $scope.hilightTopic = function () {
            
            $('#topic_0').effect("bounce", "slow");
            $('#topic_0.message').effect("highlight", "slow");
        }


        $scope.selectMember = function () {
            $scope.slected_memeber = $scope.user;
            $scope.user = '';
            $scope.sharing_with.push($scope.slected_memeber);

        };

        $scope.share = function () {


            var body = {'access': $scope.lead.access};
            var id = $scope.lead.id;
            var params = {
                'id': id,
                'access': $scope.lead.access
            }
            Lead.patch($scope, params);
            // who is the parent of this event .hadji hicham 21-07-2014.

            params["parent"] = "lead";
            Event.permission($scope, params);
            Task.permission($scope, params);


            // $('#sharingSettingsModal').modal('hide');

            if ($scope.sharing_with.length > 0) {

                var items = [];

                angular.forEach($scope.sharing_with, function (user) {
                    var item = {
                        'type': "user",
                        'value': user.entityKey
                    };
                    if (item.google_user_id != $scope.lead.owner.google_user_id) items.push(item);
                });
                console.log("##################################################################")
                console.log($scope.sharing_with)
                if (items.length > 0) {
                    var params = {
                        'about': $scope.lead.entityKey,
                        'items': items
                    }
                    console.log(params)
                    Permission.insert($scope, params);
                }

            }
            $scope.sharing_with = [];
        };


        $scope.selectMemberToTask = function () {
            
            if ($scope.selected_members.indexOf($scope.user) == -1) {
                $scope.selected_members.push($scope.user);
                $scope.selected_member = $scope.user;
                $scope.user = $scope.selected_member.google_display_name;
            }
            $scope.user = '';
        };
        $scope.unselectMember = function (index) {
            $scope.selected_members.splice(index, 1);
            
        };
        $scope.deleteEvent = function (eventt) {
            var params = {'entityKey': eventt.entityKey};
            Event.delete($scope, params);
            //$('#addLeadModal').modal('show');
        }
        $scope.eventDeleted = function (resp) {
        };
        //HKA 09.11.2013 Add a new Task
        $scope.addTask = function (task) {

            if ($scope.newTaskform == false) {
                $scope.newTaskform = true;
            } else {
                if (task.title != null) {
                    //  $('#myModal').modal('hide');
                    if (task.due) {
                        
                        
                        var dueDate = $filter('date')(task.due, ['yyyy-MM-ddT00:00:00.000000']);
                        params = {
                            'title': task.title,
                            'due': dueDate,
                            'parent': $scope.lead.entityKey,
                            'access': $scope.lead.access
                        }

                    } else {
                        params = {
                            'title': task.title,
                            'parent': $scope.lead.entityKey,
                            'access': $scope.lead.access
                        }
                    }
                    ;
                    if ($scope.selected_members != []) {

                        params.assignees = $scope.selected_members;
                    }
                    ;
                    var tags = [];
                    tags = $('#select2_sample2').select2("val");
                    if (tags != []) {

                        var tagitems = [];
                        angular.forEach(tags, function (tag) {
                            var item = {'entityKey': tag};
                            tagitems.push(item);
                        });
                        params.tags = tagitems;
                    }
                    ;
                    Task.insert($scope, params);

                    $scope.newTask = {};
                    $scope.newTaskform = false;
                    $scope.selected_members = [];
                    $("#select2_sample2").select2("val", "");
                } else {
                    $scope.newTask = {};
                    $scope.newTaskform = false;
                }
            }
        };
        //HKA 27.07.2014 Add button cancel on Task form
        $scope.closeTaskForm = function (newTask) {
            $scope.newTask = {};
            $scope.newTaskform = false;
        };

        $scope.deleteTask = function (task) {

            var params = {'entityKey': task.entityKey};

            Task.delete($scope, params);

        };

        // rederection after delete task . hadji hicham 08--07-2014
        $scope.taskDeleted = function (resp) {

        };
        $scope.hilightTask = function () {
            
            $('#task_0').effect("highlight", "slow");
            $('#task_0').effect("bounce", "slow");

        }
        $scope.listTasks = function () {
            var params = {
                'id': $scope.lead.id,
                'tasks': {}
            };

            Lead.get($scope, params);

        }

// HADJI HICHAM 31/05/2015
//auto complete 


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


        /***************reminder**************************/

        $scope.deletePicked = function () {
            $scope.something_picked = false;
            $scope.remindme_show = "";
            $scope.remindmeby = false;
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
        /*******************************************/
        $scope.timezoneChosen = $scope.timezone;
        $('#timeZone').on('change', function () {


            $scope.timezoneChosen = this.value;
        });

        /********************************************/
        //HKA 10.11.2013 Add event
        $scope.addEvent = function (ioevent) {

            // $scope.allday=$scope.alldaybox;  

            if (ioevent.title != null && ioevent.title != "") {

                var params = {}


                // hadji hicham 13-08-2014.
                if ($scope.allday) {
                    var ends_at = moment(moment(ioevent.starts_at_allday).format('YYYY-MM-DDT00:00:00.000000'))

                    params = {
                        'title': ioevent.title,
                        'starts_at': $filter('date')(ioevent.starts_at_allday, ['yyyy-MM-ddT00:00:00.000000']),
                        'ends_at': ends_at.add('hours', 23).add('minute', 59).add('second', 59).format('YYYY-MM-DDTHH:mm:00.000000'),
                        'where': ioevent.where,
                        'allday': "true",
                        'access': $scope.lead.access,
                        'description': $scope.ioevent.note,
                        'invites': $scope.invites,
                        'parent': $scope.lead.entityKey,
                        'guest_modify': $scope.guest_modify.toString(),
                        'guest_invite': $scope.guest_invite.toString(),
                        'guest_list': $scope.guest_list.toString(),
                        'reminder': $scope.reminder,
                        'method': $scope.method,
                        'timezone': $scope.timezoneChosen

                    }


                } else {

                    
                    

                    if (ioevent.starts_at) {
                        if (ioevent.ends_at) {
                            // params ={'title': ioevent.title,
                            //         'starts_at': $filter('date')(ioevent.starts_at,['yyyy-MM-ddTHH:mm:00.000000']),
                            //         'ends_at': $filter('date')(ioevent.ends_at,['yyyy-MM-ddTHH:mm:00.000000']),
                            //         'where': ioevent.where,
                            //         'parent':$scope.lead.entityKey,
                            //         'allday':"false",
                            //         'access':$scope.lead.access
                            // }
                            params = {
                                'title': ioevent.title,
                                'starts_at': $filter('date')(ioevent.starts_at, ['yyyy-MM-ddTHH:mm:00.000000']),
                                'ends_at': $filter('date')(ioevent.ends_at, ['yyyy-MM-ddTHH:mm:00.000000']),
                                'where': ioevent.where,
                                'allday': "false",
                                'access': $scope.lead.access,
                                'description': $scope.ioevent.note,
                                'invites': $scope.invites,
                                'parent': $scope.lead.entityKey,
                                'guest_modify': $scope.guest_modify.toString(),
                                'guest_invite': $scope.guest_invite.toString(),
                                'guest_list': $scope.guest_list.toString(),
                                'reminder': $scope.reminder,
                                'method': $scope.method,
                                'timezone': $scope.timezoneChosen

                            }

                        } else {
                            // params ={
                            //   'title': ioevent.title,
                            //         'starts_at': $filter('date')(ioevent.starts_at,['yyyy-MM-ddTHH:mm:00.000000']),
                            //         'where': ioevent.where,
                            //         'parent':$scope.lead.entityKey,
                            //         'ends_at':moment(ioevent.ends_at).add('hours',2).format('YYYY-MM-DDTHH:mm:00.000000'),
                            //         'allday':"false",
                            //         'access':$scope.lead.access
                            // }

                            params = {
                                'title': ioevent.title,
                                'starts_at': $filter('date')(ioevent.starts_at, ['yyyy-MM-ddTHH:mm:00.000000']),
                                'ends_at': moment(ioevent.ends_at).add('hours', 2).format('YYYY-MM-DDTHH:mm:00.000000'),
                                'where': ioevent.where,
                                'allday': "false",
                                'access': $scope.lead.access,
                                'description': $scope.ioevent.note,
                                'invites': $scope.invites,
                                'parent': $scope.lead.entityKey,
                                'guest_modify': $scope.guest_modify.toString(),
                                'guest_invite': $scope.guest_invite.toString(),
                                'guest_list': $scope.guest_list.toString(),
                                'reminder': $scope.reminder,
                                'method': $scope.method,
                                'timezone': $scope.timezoneChosen

                            }


                        }


                    }


                }


                Event.insert($scope, params);
                $('#newEventModalForm').modal('hide');

                $scope.ioevent = {};
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
                $scope.newEventform = false;
                $scope.remindmeby = false;
                $scope.locationShosen = false;

            }
        }

//*************************************************/
        $scope.cancelAddOperation = function () {
            $scope.timezonepicker = false;
            $scope.start_event = "";
            $scope.end_event = "";

            $scope.invites = []
            $scope.invite = "";
            $scope.remindme_show = "";
            $scope.show_choice = "";
            $scope.parent_related_to = "";
            $scope.Guest_params = false;
            $scope.something_picked = false;
            $scope.picked_related = false;
            $scope.ioevent = {}
            $scope.locationShosen = false;
        }


// hadji hicham 14-07-2014 . update the event after we add .
        $scope.updateEventRenderAfterAdd = function () {
        };

        $scope.closeEventForm = function (ioevent) {
            $scope.ioevent = {};
            $scope.newEventform = false;
        }
        $scope.listEvents = function () {
            var params = {
                'id': $scope.lead.id,
                'events': {}
            };
            Lead.get($scope, params);

        }
        $scope.hilightEvent = function () {
            
            $('#event_0').effect("highlight", "slow");
            $('#event_0').effect("bounce", "slow");

        }
        //HKA 11.11.2013 Add Note
        $scope.addNote = function (note) {
            var params = {
                'about': $scope.lead.entityKey,
                'title': note.title,
                'content': note.content
            };
            Note.insert($scope, params);
            $scope.note.title = '';
            $scope.note.content = '';
        };
//HKA 27.11.2013 Update Lead
        $scope.updatelead = function (lead) {

            var params = {
                'id': $scope.lead.id,
                'owner': $scope.ownerSelected.google_user_id,
                'firstname': lead.firstname,
                'lastname': lead.lastname,
                'company': lead.company,
                'source': lead.source,
                'industry': lead.industry,
                'title': lead.title,
                'status': $scope.status_selected.status
            };
            Lead.patch($scope, params);
            $('#EditLeadModal').modal('hide')

        };


        $scope.listInfonodes = function (kind) {
            params = {
                'parent': $scope.lead.entityKey,
                'connections': kind
            };
            InfoNode.list($scope, params);
        }
        $scope.existsInfonode=function(elem,property,kind){
            var exists=false;
            angular.forEach($scope.infonodes[kind], function (infonode) {
                console.log(infonode[property]);
                console.log(elem[property]);
                if (infonode[property]==elem[property]) {
                    exists= true;
                    console.log('exists');
                };
            });
            return exists;

        }
//HKA 19.11.2013 Add Phone
        $scope.addPhone = function (phone) {

            if (phone.number && !($scope.existsInfonode(phone,'number','phones'))) {
                params = {
                    'parent': $scope.lead.entityKey,
                    'kind': 'phones',
                    'fields': [
                        {
                            "field": "type",
                            "value": phone.type
                        },
                        {
                            "field": "number",
                            "value": phone.number
                        }
                    ]
                };
                InfoNode.insert($scope, params);
            }
            $scope.phone = {};
            $scope.phone.type = 'work';
            $scope.showPhoneForm = false;
        };


//HKA 20.11.2013 Add Email
        $scope.addEmail = function (email) {


            if (email.email && !$scope.existsInfonode(email,'email','emails')) {
                params = {
                    'parent': $scope.lead.entityKey,
                    'kind': 'emails',
                    'fields': [
                        {
                            "field": "email",
                            "value": email.email
                        }
                    ]
                };
                InfoNode.insert($scope, params);
            }
            $scope.email = {};
            $scope.email.email = ''
            console.log($scope.email)
            $scope.showEmailForm = false;


        };


//HKA 22.11.2013 Add Website
        $scope.addWebsite = function (website) {


            if (website.url != "" && website.url != undefined && !$scope.existsInfonode(website,'url','websites')) {
                params = {
                    'parent': $scope.lead.entityKey,
                    'kind': 'websites',
                    'fields': [
                        {
                            "field": "url",
                            "value": website.url
                        }
                    ]
                };
                InfoNode.insert($scope, params);
            }
            $scope.website = {};
            $scope.showWebsiteForm = false;
        };

//HKA 22.11.2013 Add Social
        $scope.addLinkedIn = function (social) {
            $scope.getLinkedinByUrl(social.url);
        };
        $scope.addSocial = function (social) {

            if (social.url != "" && social.url != undefined && !$scope.existsInfonode(social,'url','sociallinks')) {
                params = {
                    'parent': $scope.lead.entityKey,
                    'kind': 'sociallinks',
                    'fields': [
                        {
                            "field": "url",
                            "value": social.url
                        }
                    ]
                };
                InfoNode.insert($scope, params);
                $scope.sociallink = {};
                $scope.showSociallinkForm = false;
            }
        };
        $scope.addCustomField = function (customField,option) {
                  
            if (customField) {
                console.log("check infonode_key before update or create");
                console.log(customField);
                if (customField.infonode_key) {
                    console.log("in update customfield");
                    $scope.inlinePatch('Infonode','customfields', customField.name,customField.infonode_key,customField.value)
                }else{
                    console.log("in create new customfield");
                    
                    if (!customField.field) {
                        customField.field=customField.name;
                    };
                    var custom_value=null;
                        if (option) {
                            
                            if (!customField.value) {
                                customField.value=[];
                            };
                            customField.value.push(option);
                            custom_value=JSON.stringify(customField.value);
                        }else{
                            
                             custom_value=customField.value;
                        };

                        
                        
                    if (customField.field && customField.value) {
                        
                        params = {
                            'parent': $scope.lead.entityKey,
                            'kind': 'customfields',
                            'fields': [
                                {
                                    "field": customField.field,
                                    "property_type":customField.id,
                                    "value": custom_value
                                }
                            ]
                        };
                        InfoNode.insertCustom($scope, params,customField);
                    }
                };
                
            }
            $('#customfields').modal('hide');
            $scope.customfield = {};
            $scope.showCustomFieldForm = false;

        };
//HKA 22.11.2013 Edit tagline of Account
        $scope.edittagline = function () {
            $('#EditTagModal').modal('show');
        };
        //HKA Edit Introduction on Account
        $scope.editintro = function () {
            $('#EditIntroModal').modal('show');
        };

//HKA 21.06.2014 Update Intro and Tagline
        $scope.updateContactIntroTagline = function (params) {
            Lead.patch($scope, params);
        };


        $scope.showConvertModal = function () {
            $('#convertLeadModal').modal('show');

        };
        $scope.convert = function () {
            $('#convertLeadModal').modal('hide');
            var leadid = {'id': $route.current.params.leadId};
            
            
            Lead.convert($scope, leadid);
        };
        $scope.leadConverted = function (oldId, newId) {
            console.log("before replace");
            window.location.replace('#/contacts/');
        }
        // $('#some-textarea').wysihtml5();

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


                $.each(data.docs, function (index) {
                    var file = {
                        'id': data.docs[index].id,
                        'title': data.docs[index].name,
                        'mimeType': data.docs[index].mimeType,
                        'embedLink': data.docs[index].url
                    };
                    $scope.sendWithAttachments.push(file);
                });
                $scope.apply();
            }
        }

        $scope.sendEmail = function (email) {

            email.body = $('#some-textarea').val();
            
            
            var params = {
                'to': email.to,
                'cc': email.cc,
                'bcc': email.bcc,
                'subject': email.subject,
                'body': email.body,
                'about': $scope.lead.entityKey
            };
            if ($scope.sendWithAttachments) {
                params['files'] = {
                    'parent': $scope.lead.entityKey,
                    'access': $scope.lead.access,
                    'items': $scope.sendWithAttachments
                };
            }
            ;

            Email.send($scope, params);
        };
//HKA
        $scope.deletelead = function () {
            var params = {'entityKey': $scope.lead.entityKey};
            Lead.delete($scope, params);
            $('#BeforedeleteLead').modal('hide');
        };
        $scope.DocumentlistNextPageItems = function () {


            var nextPage = $scope.documentCurrentPage + 1;
            var params = {};
            if ($scope.documentpages[nextPage]) {
                params = {
                    'id': $scope.lead.id,
                    'documents': {
                        'limit': '15',
                        'pageToken': $scope.documentpages[nextPage]
                    }
                }
                $scope.documentCurrentPage = $scope.documentCurrentPage + 1;

                Lead.get($scope, params);

            }


        }
        $scope.listDocuments = function () {
            var params = {
                'id': $scope.lead.id,
                'documents': {
                    'limit': '15'
                }
            }
            Lead.get($scope, params);

        };
        $scope.showCreateDocument = function (type) {

            $scope.mimeType = type;
            $('#newDocument').modal('show');
        };
        $scope.createDocument = function (newdocument) {

            var mimeType = 'application/vnd.google-apps.' + $scope.mimeType;
            var params = {
                'parent': $scope.lead.entityKey,
                'title': newdocument.title,
                'mimeType': mimeType,
                'access': $scope.lead.access
            };
            Attachement.insert($scope, params);

        };

        $scope.createPickerUploader = function () {
            var developerKey = 'AIzaSyDHuaxvm9WSs0nu-FrZhZcmaKzhvLiSczY';
            var projectfolder = $scope.lead.folder;
            var docsView = new google.picker.DocsView()
                .setIncludeFolders(true)
                .setSelectFolderEnabled(true);
            var picker = new google.picker.PickerBuilder().
                addView(new google.picker.DocsUploadView().setParent(projectfolder)).
                addView(docsView).
                setCallback($scope.uploaderCallback).
                setOAuthToken(window.authResult.access_token).
                setDeveloperKey(developerKey).
                setAppId('935370948155-qm0tjs62kagtik11jt10n9j7vbguok9d').
                enableFeature(google.picker.Feature.MULTISELECT_ENABLED).
                build();
            picker.setVisible(true);
        };
        // A simple callback implementation.
        $scope.uploaderCallback = function (data) {


            if (data.action == google.picker.Action.PICKED) {
                var params = {
                    'access': $scope.lead.access,
                    'parent': $scope.lead.entityKey
                };
                params.items = new Array();

                $.each(data.docs, function (index) {
                    
                    /*
                     {'about_kind':'Account',
                     'about_item': $scope.account.id,
                     'title':newdocument.title,
                     'mimeType':mimeType };
                     */
                    var item = {
                        'id': data.docs[index].id,
                        'title': data.docs[index].name,
                        'mimeType': data.docs[index].mimeType,
                        'embedLink': data.docs[index].url

                    };
                    params.items.push(item);

                });
                Attachement.attachfiles($scope, params);

            }
        }
        $scope.createLogoPickerUploader = function () {

            var developerKey = 'AIzaSyDHuaxvm9WSs0nu-FrZhZcmaKzhvLiSczY';
            var picker = new google.picker.PickerBuilder().
                addView(new google.picker.DocsUploadView()).
                setCallback($scope.logoUploaderCallback).
                setOAuthToken(window.authResult.access_token).
                setDeveloperKey(developerKey).
                setAppId('935370948155-qm0tjs62kagtik11jt10n9j7vbguok9d').
                build();
            picker.setVisible(true);
        };
        // A simple callback implementation.
        $scope.logoUploaderCallback = function (data) {

            if (data.action == google.picker.Action.PICKED) {

                if (data.docs) {
                    $scope.profile_img.profile_img_id = data.docs[0].id;
                    $scope.profile_img.profile_img_url = 'https://docs.google.com/uc?id=' + data.docs[0].id;
                    $scope.imageSrc = 'https://docs.google.com/uc?id=' + data.docs[0].id;
                    $scope.apply();
                    var params = {'id': $scope.lead.id};
                    params['profile_img_id'] = $scope.profile_img.profile_img_id;
                    params['profile_img_url'] = $scope.profile_img.profile_img_url;
                    Lead.patch($scope, params);
                }
            }
        }
        $scope.addAddress = function (address) {
            //Map.render($scope);
            //renderMaps();
            Map.searchLocation($scope, address);
            //Map.searchLocation($scope,address);

            $('#addressmodal').modal('hide');
            $scope.address = {};
        };
        $scope.locationUpdated = function (addressArray) {

            var params = {
                'id': $scope.lead.id,
                'addresses': addressArray
            };
            Lead.patch($scope, params);
        };
        $scope.addGeo = function (address) {
            if (!$scope.existsInfonode(address,'formatted','addresses')) {
                params = {
                'parent': $scope.lead.entityKey,
                'kind': 'addresses',
                'fields': [
                    {
                        "field": "formatted",
                        "value": address.formatted
                    }
                ]
            };
            if (address.lat) {
                
                params = {
                    'parent': $scope.lead.entityKey,
                    'kind': 'addresses',
                    'fields': [
                        {
                            "field": "lat",
                            "value": address.lat.toString()
                        },
                        {
                            "field": "lon",
                            "value": address.lng.toString()
                        },
                        {
                            "field": "formatted",
                            "value": address.formatted
                        }
                    ]
                };
            }
            InfoNode.insert($scope, params);
            };
        };

        // HKA 19.03.2014 inline update infonode
        $scope.inlinePatch = function (kind, edge, name, entityKey, value) {
            
            Map.destroy();

            //Map.searchLocation($scope,value);
            //Map.searchLocation($scope,address);
            if (kind == 'Lead') {
                if (name == 'firstname') {
                    params = {
                        'id': $scope.lead.id,
                        firstname: value
                    };
                    Lead.patch($scope, params);
                }
                ;
                if (name == 'lastname') {
                    params = {
                        'id': $scope.lead.id,
                        lastname: value
                    };
                    Lead.patch($scope, params);
                }
                if (name == 'title') {
                    params = {
                        'id': $scope.lead.id,
                        title: value
                    };
                    Lead.patch($scope, params);
                }
                if (name == 'company') {
                    params = {
                        'id': $scope.lead.id,
                        company: value
                    };
                    Lead.patch($scope, params);
                }
                if (name == 'owner') {
                    params = {
                        'id': $scope.lead.id,
                        owner: value
                    };
                    Lead.patch($scope, params);
                }
                if (name == 'source') {
                    params = {
                        'id': $scope.lead.id,
                        source: value
                    };
                    Lead.patch($scope, params);
                }
                if (name == 'status') {
                    params = {
                        'id': $scope.lead.id,
                        status: value
                    };
                    Lead.patch($scope, params);
                }

            } else {


                params = {
                    'entityKey': entityKey,
                    'parent': $scope.lead.entityKey,
                    'kind': edge,
                    'fields': [

                        {
                            "value": value,
                            "field": name
                        }
                    ]
                };

                InfoNode.patch($scope, params);
            }


        };
        $scope.prepareInfonodes = function () {
            var infonodes = [];

            angular.forEach($scope.customfields, function (customfield) {
                var infonode = {
                    'kind': 'customfields',
                    'fields': [
                        {
                            'field': customfield.field,
                            'value': customfield.value
                        }
                    ]

                }
                infonodes.push(infonode);
            });
            return infonodes;
        };
        $scope.hideNewOppForm = function () {
            $scope.opportunity = {};
            $scope.showNewOpp = false;
            $scope.topOppButton='new';
            $(window).trigger('resize');
        }
        /* $111 staring opp new code*/
         $scope.selectCompetitor = function(){
        console.log("enter fired");
        console.log($scope.searchCompetitorQuery);
        if (typeof($scope.searchCompetitorQuery)=='object') {
           console.log("enter object");
           $scope.competitors.push($scope.searchCompetitorQuery);
           if ($scope.opportunity.competitors==undefined) {
                $scope.opportunity.competitors=[];
           };
           $scope.opportunity.competitors.push($scope.searchCompetitorQuery.entityKey);
        }else{
           if ($scope.searchCompetitorQuery!="") {
             console.log("enter string");
            $scope.competitors.push({name:$scope.searchCompetitorQuery});
            if ($scope.opportunity.competitors==undefined) {
                $scope.opportunity.competitors=[];
            };
            $scope.opportunity.competitors.push($scope.searchCompetitorQuery);
           };          
        };   
        $scope.searchCompetitorQuery="";  
        $scope.apply();        
      };
        $scope.getResults = function (val, location) {
            console.log('here executed');
            var url = ROOT + location + '?alt=json'
            var config = {
                headers: {
                    'Authorization': 'Bearer ' + localStorage['access_token'],
                    'Accept': 'application/json'
                }
            }
            var params = {
                "q": val
            };
            return $http.post(url, params, config).then(function (response) {
                if (response.data.items) {
                    return response.data.items;
                } else {
                    return [];
                }
                ;
                return response.data.items;
            });
        }

        $scope.getCustomFields=function(related_object){
            Customfield.list($scope,{related_object:related_object});
        }
        $scope.addCustomFieldForOpp = function (customField,option) {  
            if (customField) {
                    if (!customField.field) {
                        customField.field=customField.name;
                    };
                    var custom_value=null;
                        if (option) {
                            
                            if (!customField.value) {
                                customField.value=[];
                            };
                            customField.value.push(option);
                            custom_value=JSON.stringify(customField.value);
                        }else{

                             custom_value=customField.value;
                        };

                        
                        
                    if (customField.field && customField.value) {

                        var params = {
                                    "field": customField.field,
                                    "property_type":customField.id,
                                    "value": custom_value
                                };
                        $scope.oppCustomfields.push(params);
                        console.log($scope.customfields);

                    }
            }
            $('#customfields').modal('hide');
            $scope.customfield = {};
            $scope.showCustomFieldForm = false;

        };
        $scope.prepareInfonodesOpp = function(){
        var infonodes = [];

        angular.forEach($scope.oppCustomfields, function(customfield){
            var infonode = {
                            'kind':'customfields',
                            'fields':[
                                    {
                                    'field':customfield.field,
                                    'property_type':customfield.property_type,
                                    'value':customfield.value
                                    }
                            ]

                          }
            infonodes.push(infonode);
        });
        return infonodes;
    };
        $scope.changeInitialStage=function(stage){
            $scope.initialStage=stage;
            console.log($scope.initialStage.probability);
          }
        $scope.validateBeforeSaveOpp=function(opportunity){
           if (!opportunity.name) $scope.oppo_err.name=true;
            else $scope.oppo_err.name=false;  
          if (!opportunity.amount_per_unit) $scope.oppo_err.amount_per_unit=true;
            else $scope.oppo_err.amount_per_unit=false;
          if (!$scope.searchAccountQuery) $scope.oppo_err.account=true;
            else $scope.oppo_err.account=false;
          if (!$scope.searchContactQuery) $scope.oppo_err.contact=true;
            else $scope.oppo_err.contact=false;
          if (!$scope.oppo_err.name && !$scope.oppo_err.amount_per_unit && !($scope.oppo_err.account && $scope.oppo_err.contact) )  $scope.save(opportunity)
      }
      $scope.saveOpp = function(opportunity){
           $scope.oppo_err={};
           if (!opportunity.name) $scope.oppo_err.name=true;
            else $scope.oppo_err.name=false;  
          if (!opportunity.amount_per_unit) $scope.oppo_err.amount_per_unit=true;
            else $scope.oppo_err.amount_per_unit=false;

          if (!$scope.oppo_err.amount_per_unit&&!$scope.oppo_err.name) {
                $scope.opportunity.lead=$scope.lead.entityKey;
          opportunity.infonodes = $scope.prepareInfonodesOpp();
            // prepare amount attributes
            
            if (opportunity.duration_unit=='fixed'){
              opportunity.amount_total = parseInt(opportunity.amount_per_unit);
              opportunity.opportunity_type = 'fixed_bid';
            }else{
              opportunity.opportunity_type = 'per_' + opportunity.duration_unit;
              opportunity.amount_total = opportunity.amount_per_unit * opportunity.duration;
            }
              var closed_date = $filter('date')(opportunity.closed_date,['yyyy-MM-dd']);
              opportunity.stage=$scope.initialStage.entityKey;
              opportunity.closed_date=closed_date;
              console.log('hereeeeeeeeeeeeeee opportunity before save');
              console.log(opportunity);
              Opportunity.insert($scope,opportunity);
              $scope.showNewOpp = false;
              $scope.topOppButton='new';
              $scope.opportunity={};
              $scope.opportunity.duration_unit='fixed'
              $scope.opportunity.currency='USD';
          }; 
        };
        $scope.editbeforedeleteopp = function () {
            
            // $scope.selectedOpportunity = opportunity;
            $('#BeforedeleteOpportunity').modal('show');
        };
        $scope.deleteopportunity = function () {
            
            // $scope.relatedOpp = true;
            // var params = {'entityKey': $scope.opportunities[$scope.selectedOpportunity].entityKey};
            // Opportunity.delete($scope, params);
            // $('#BeforedeleteOpportunity').modal('hide');
            // $scope.selectedOpportunity = null;
            var params={};
            angular.forEach($scope.selectedOpps, function (opp) {
                    params = {'entityKey': opp.entityKey};
                    Opportunity.delete($scope, params);
                });
            $('#BeforedeleteOpportunity').modal('hide');
            $scope.allOppsSelected=false;

        };
        $scope.oppDeleted = function (entityKey) {
            var oppTodelete=null;
            angular.forEach($scope.selectedOpps, function (opp) {
                    if (opp.entityKey==entityKey) {
                        oppTodelete=opp;
                    };
                });
            var indexInOpp=$scope.opportunities.indexOf(oppTodelete);
            var indexInSelection=$scope.selectedOpps.indexOf(oppTodelete);
            $scope.opportunities.splice(indexInOpp, 1);
            $scope.selectedOpps.splice(indexInSelection, 1);
            $scope.apply();
        };

        $scope.waterfallTrigger = function () {


            /* $('.waterfall').hide();
             $('.waterfall').show();*/
            $(window).trigger("resize");
            if ($(".chart").parent().width() == 0) {
                var leftMargin = 210 - $(".chart").width();
                $(".chart").css("left", leftMargin / 2);
                $(".oppStage").css("left", leftMargin / 2 - 2);
            } else {
                var leftMargin = $(".chart").parent().width() - $(".chart").width();
                $(".chart").css("left", leftMargin / 2);
                $(".oppStage").css("left", leftMargin / 2 - 2);

            }
        };

        $scope.listMoreOnScroll = function () {
            switch ($scope.selectedTab) {

                case 7:
                    $scope.DocumentlistNextPageItems();
                    break;
                case 1:
                    $scope.TopiclistNextPageItems();
                    break;

            }
        };
        $scope.showSelectButton = function (index) {
            $("#item_" + index).addClass('grayBackground');
            $("#select_" + index).removeClass('selectLinkedinButton');
            if (index != 0) {
                $("#item_0").removeClass('grayBackground');
                $("#select_0").addClass('selectLinkedinButton');
            }
            ;
        }
        $scope.hideSelectButton = function (index) {

            if (!$("#select_" + index).hasClass('alltimeShowSelect')) {
                $("#item_" + index).removeClass('grayBackground');
                $("#select_" + index).addClass('selectLinkedinButton');
            }
            ;
            if (index != 0) {
                $("#item_0").addClass('grayBackground');
                $("#select_0").removeClass('selectLinkedinButton');
            }
            ;

        };
        $scope.listTags = function () {
            var paramsTag = {'about_kind': 'Lead'}
            Tag.list($scope, paramsTag);
        };
        // lendiri arezki 3-8-14
        $scope.linkedinUrl = function (url) {
            var match = "";
            var matcher = new RegExp("linkedin");
            var test = matcher.test(url);
            return test;
        }
        $scope.saveLinkedinUrl = function (url) {
            $scope.linkedProfile = $scope.linkedShortProfile;
            $scope.linkedShortProfile = {};
            var link = {'url': url}
            $scope.addSocial(link);
            var params = {'id': $scope.lead.id};
            params['profile_img_url'] = $scope.linkedProfile.profile_picture;
            if ($scope.linkedProfile.title) {
                params.title = $scope.linkedProfile.title;
            }
            ;
            
            
            
            Lead.patch($scope, params);
            $scope.imageSrc = $scope.linkedProfile.profile_picture;
            if ($scope.infonodes.addresses == undefined || $scope.infonodes.addresses == []) {
                $scope.addGeo({'formatted': $scope.linkedProfile.locality});
            }
            ;
            $scope.apply();
        }
        $scope.getLinkedinByUrl = function (url) {
            $scope.linkedLoader = true;
            var par = {'url': url};
            Linkedin.profileGet(par, function (resp) {
                if (!resp.code) {
                    
                    
                    $scope.linkedShortProfile = {};
                    $scope.linkedShortProfile.fullname = resp.fullname;
                    $scope.linkedShortProfile.url = url;
                    $scope.linkedShortProfile.profile_picture = resp.profile_picture;
                    $scope.linkedShortProfile.title = resp.title;
                    $scope.linkedShortProfile.locality = resp.locality;
                    $scope.linkedShortProfile.industry = resp.industry;
                    $scope.linkedShortProfile.formations = resp.formations
                    $scope.linkedShortProfile.resume = resp.resume;
                    $scope.linkedShortProfile.skills = resp.skills;
                    $scope.linkedShortProfile.current_post = resp.current_post;
                    $scope.linkedShortProfile.past_post = resp.past_post;
                    $scope.linkedShortProfile.experiences = JSON.parse(resp.experiences);
                    if ($scope.linkedProfile.experiences) {
                        $scope.linkedProfile.experiences.curr = $scope.linkedProfile.experiences['current-position'];
                        $scope.linkedProfile.experiences.past = $scope.linkedProfile.experiences['past-position'];
                    }
                    $scope.linkedLoader = false;
                    $scope.apply();
                    
                    
                    
                } else {
                    
                    if (resp.code == 401) {
                        // $scope.refreshToken();
                        
                        $scope.linkedLoader = false;
                        $scope.apply();
                    }
                    ;
                }
            });
        }
        $scope.getLinkedinProfile = function () {
            var params = {
                "firstname": $scope.lead.firstname,
                "lastname": $scope.lead.lastname
            }
            var linkedurl = null
            if ($scope.infonodes.sociallinks == undefined) {
                $scope.infonodes.sociallinks = [];
            };
            var savedEntityKey = null;
            if ($scope.infonodes.sociallinks.length > 0) {
                angular.forEach($scope.infonodes.sociallinks, function (link) {

                    if ($scope.linkedinUrl(link.url)) {
                        linkedurl = link.url;
                        savedEntityKey = link.entityKey;
                        
                    }
                    ;
                });
            };
            if (!linkedurl) {
                Linkedin.listPeople(params, function (resp) {
                    if (!resp.code) {
                        
                        if (resp.items == undefined) {
                            $scope.listPeople = [];
                            $scope.noLinkedInResults = true;
                        } else {
                            $scope.listPeople = resp.items;
                        };
                        $scope.isLoading = false;
                        $scope.$apply();
                    } else {
                        
                        if (resp.code == 401) {
                            $scope.isLoading = false;
                            $scope.$apply();
                        }
                        ;
                    }
                });
            };

        }
        $scope.twitterUrl = function (url) {
            var match = "";
            var matcher = new RegExp("twitter");
            var test = matcher.test(url);
            return test;
        }
        $scope.getTwitterProfile = function () {
            
            var params = {
                "firstname": $scope.lead.firstname,
                "lastname": $scope.lead.lastname
            }
            var twitterurl = null;
            $scope.twNoResults = false;
            if ($scope.infonodes.sociallinks == undefined) {
                $scope.infonodes.sociallinks = [];
            }
            ;
            var savedEntityKey = null;
            if ($scope.infonodes.sociallinks.length > 0) {
                
                angular.forEach($scope.infonodes.sociallinks, function (link) {
                    
                    if ($scope.twitterUrl(link.url)) {
                        twitterurl = link.url;
                        
                        
                        savedEntityKey = link.entityKey;
                    }
                    ;
                });
            }
            ;
            if (twitterurl) {
                var par = {'url': twitterurl};
                $scope.twProfile = {};
                Linkedin.getTwitterProfile(par, function (resp) {
                    if (!resp.code) {
                        $scope.twProfile.name = resp.name;
                        $scope.twProfile.screen_name = resp.screen_name;
                        $scope.watsonUrl = 'http://ioco.eu-gb.mybluemix.net/iogrow#/personalitybar/' + resp.screen_name;
                        $scope.twProfile.created_at = resp.created_at
                        $scope.twProfile.description_of_user = resp.description_of_user;
                        $scope.twProfile.followers_count = resp.followers_count;
                        $scope.twProfile.friends_count = resp.friends_count;
                        $scope.twProfile.id = resp.id;
                        $scope.twProfile.lang = resp.lang;
                        $scope.twProfile.language = resp.language;
                        $scope.twProfile.last_tweet_favorite_count = resp.last_tweet_favorite_count;
                        $scope.twProfile.last_tweet_retweet_count = resp.last_tweet_retweet_count;
                        $scope.twProfile.last_tweet_text = resp.last_tweet_text;
                        $scope.twProfile.location = resp.location;
                        $scope.twProfile.nbr_tweets = resp.nbr_tweets;
                        $scope.twProfile.profile_banner_url = resp.profile_banner_url + '/1500x500';
                        $scope.twProfile.profile_image_url_https = resp.profile_image_url_https;
                        $scope.twProfile.url_of_user_their_company = resp.url_of_user_their_company;
                        $scope.twProfile.entityKey = savedEntityKey;
                        $scope.twProfile.url = twitterurl;
                        if ($scope.lead.addresses == undefined || $scope.lead.addresses == []) {
                            $scope.addGeo({'formatted': $scope.twProfile.location});
                        }
                        ;
                        $scope.twIsLoading = false;
                        $scope.isLoading = false;
                        $scope.apply();
                    } else {
                        
                        if (resp.code == 401) {
                            // $scope.refreshToken();
                            $scope.isLoading = false;
                            $scope.apply();
                        }
                        ;
                    }
                });
            } else {
                Linkedin.getTwitterList(params, function (resp) {
                    $scope.twIsSearching = true;
                    $scope.twShortProfiles = [];
                    $scope.twProfile = {};
                    if (!resp.code) {
                        $scope.twIsSearching = false;
                        if (resp.items == undefined) {
                            $scope.twList = [];
                            $scope.twNoResults = true;
                            $scope.twIsSearching = false;
                        } else {
                            $scope.twList = resp.items;
                            if (resp.items.length < 4) {
                                
                                angular.forEach(resp.items, function (item) {
                                    
                                    $scope.getTwitterByUrl(item.url);
                                });
                            }
                        }
                        ;
                        $scope.isLoading = false;
                        $scope.$apply();
                    } else {
                        
                        if (resp.code == 401) {
                            // $scope.refreshToken();
                            
                            $scope.isLoading = false;
                            $scope.$apply();
                        }
                        if (resp.code >= 500) {
                            console.log("503 error")
                            $scope.twNoResults = true;
                            $scope.twIsSearching = false;
                            $scope.apply();

                        }
                        ;
                    }
                });
            }
            ;
        }
        $scope.getTwitterByUrl = function (url) {
            $scope.twIsLoading = true;
            var par = {'url': url};
            Linkedin.getTwitterProfile(par, function (resp) {
                if (!resp.code) {
                    prof = {};
                    prof.name = resp.name;
                    prof.screen_name = resp.screen_name;
                    prof.created_at = resp.created_at
                    prof.description_of_user = resp.description_of_user;
                    prof.followers_count = resp.followers_count;
                    prof.friends_count = resp.friends_count;
                    prof.id = resp.id;
                    prof.lang = resp.lang;
                    prof.language = resp.language;
                    prof.last_tweet_favorite_count = resp.last_tweet_favorite_count;
                    prof.last_tweet_retweet_count = resp.last_tweet_retweet_count;
                    prof.last_tweet_text = resp.last_tweet_text;
                    prof.location = resp.location;
                    prof.nbr_tweets = resp.nbr_tweets;
                    prof.profile_banner_url = resp.profile_banner_url + '/1500x500';
                    prof.profile_image_url_https = resp.profile_image_url_https;
                    prof.url_of_user_their_company = resp.url_of_user_their_company;
                    prof.url = url;
                    $scope.twShortProfiles.push(prof);
                    $scope.twIsLoading = false;
                    $scope.apply();
                } else {
                    if (resp.code == 401) {
                        $scope.twIsLoading = false;
                        $scope.apply();
                    }
                    ;
                }
            });
        }
        $scope.cancelSelection = function (arrayname) {
            console.log(arrayname)
            $scope[arrayname] = [];
            
            console.log(arrayname)
            $scope.apply();

        }
        $scope.saveTwitterUrl = function (shortProfile) {
            //$scope.clearContact();
            $scope.twList = [];
            $scope.twShortProfiles = [];
            $scope.twProfile = {};
            $scope.twProfile = shortProfile;
            $scope.watsonUrl = 'http://ioco.eu-gb.mybluemix.net/iogrow#/personalitybar/' + shortProfile.screen_name;
            var link = {'url': shortProfile.url}
            $scope.addSocial(link);
            var params = {'id': $scope.lead.id};
            if ($scope.imageSrc == '/static/img/avatar_contact.jpg' || $scope.imageSrc == '') {
                
                $scope.imageSrc = $scope.twProfile.profile_image_url_https;
                params['profile_img_url'] = $scope.twProfile.profile_image_url_https;
            }
            ;
            if ($scope.infonodes.addresses == undefined || $scope.infonodes.addresses == []) {
                $scope.addGeo({'formatted': $scope.linkedProfile.locality});
            }
            ;
            console.log("------------------------>", params)
            Lead.patch($scope, params);
            $scope.apply();
        }
        $scope.isEmpty = function (obj) {
            return jQuery.isEmptyObject(obj);
        }
        $scope.noDetails = function () {
            if (jQuery.isEmptyObject($scope.twitterProfile) && jQuery.isEmptyObject($scope.linkedProfile)) {
                return true;
            } else {
                return false;
            }
            ;
        }


        $scope.convertToJson = function (string) {
            return JSON.parse(string);
        }
        $scope.checkIfEmpty = function (obj, obj1) {
            for (var prop in obj) {
                if (obj.hasOwnProperty(prop))
                    return false;
            }
            for (var prop in obj1) {
                if (obj1.hasOwnProperty(prop))
                    
                return false;
            }

            return true;
        }

        //HKA 10.06.2015 select twitter profile
        $scope.showSelectTwitter = function (index) {
            $("#titem_" + index).addClass('grayBackground');
            $("#tselect_" + index).removeClass('selectLinkedinButton');
            if (index != 0) {
                $("#titem_0").removeClass('grayBackground');
                $("#tselect_0").addClass('selectLinkedinButton');
            }
            ;
        }
        $scope.hideSelectTwitter = function (index) {

            if (!$("#tselect_" + index).hasClass('alltimeShowSelect')) {
                $("#titem_" + index).removeClass('grayBackground');
                $("#tselect_" + index).addClass('selectLinkedinButton');
            }
            ;
            if (index != 0) {
                $("#titem_0").addClass('grayBackground');
                $("#tselect_0").removeClass('selectLinkedinButton');
            }
            ;

        };
       $scope.editbeforedelete = function(lead){
         $scope.selectedContact=lead;
         $('#BeforedeleteLead').modal('show');
       };
        // Google+ Authentication
        Auth.init($scope);
        $(window).scroll(function () {
            if (!$scope.isLoading && ($(window).scrollTop() > $(document).height() - $(window).height() - 100)) {

                $scope.listMoreOnScroll();
            }
        });

    }]);

app.controller('LeadNewCtrl', ['$scope', 'Auth', 'Lead', 'Leadstatus', 'Tag', 'Edge', 'Map', 'Linkedin','Customfield',
    function ($scope, Auth, Lead, Leadstatus, Tag, Edge, Map, Linkedin, Customfield) {
        $("ul.page-sidebar-menu li").removeClass("active");
        $("#id_Leads").addClass("active");
        document.title = "Leads: New";
        trackMixpanelAction('LEAD_NEW_VIEW');
        $("#id_Leads").addClass("active");
        $scope.isSignedIn = false;
        $scope.immediateFailed = false;
        $scope.nextPageToken = undefined;
        $scope.prevPageToken = undefined;
        $scope.isLoading = false;
        $scope.nbLoads = 0;
        $scope.leadpagination = {};
        $scope.currentPage = 01;
        $scope.pages = [];
        $scope.status_selected = {};
        $scope.leads = [];
        $scope.lead = {};
        $scope.lead.access = 'public';
        $scope.leads=[];
        $scope.leads.customfields=[];
        $scope.order = '-updated_at';
        $scope.status = 'New';
        $scope.showPhoneForm = false;
        $scope.showEmailForm = false;
        $scope.showWebsiteForm = false;
        $scope.showSociallinkForm = false;
        $scope.showCustomFieldForm = false;
        $scope.phones = [];
        $scope.addresses = [];
        $scope.infonodes = [];
        $scope.infonodes.addresses = [];
        $scope.emails = [];
        $scope.notes = [];
        $scope.note = {};
        $scope.websites = [];
        $scope.sociallinks = [];
        $scope.customfields = [];
        $scope.phone = {};
        $scope.phone.type = 'work';
        $scope.lead.source="";
        $scope.imageSrc = '/static/img/avatar_contact.jpg';
        $scope.profile_img = {
            'profile_img_id': null,
            'profile_img_url': null
        }
        $scope.noLinkedInResults = false;
        $scope.listPeople = [];
        $scope.linkedProfile = {};
        $scope.linkedShortProfile = {};
        $scope.showUpload = false;
        $scope.industries = ["Accounting ", "Airlines/Aviation ", "Alternative Dispute Resolution ", "Alternative Medicine ", "Animation ", "Apparel &amp; Fashion ", "Architecture &amp; Planning ", "Arts &amp; Crafts ", "Automotive ", "Aviation &amp; Aerospace ", "Banking ", "Biotechnology ", "Broadcast Media ", "Building Materials ", "Business Supplies &amp; Equipment ", "Capital Markets ", "Chemicals ", "Civic &amp; Social Organization ", "Civil Engineering ", "Commercial Real Estate ", "Computer &amp; Network Security ", "Computer Games ", "Computer Hardware ", "Computer Networking ", "Computer Software ", "Construction ", "Consumer Electronics ", "Consumer Goods ", "Consumer Services ", "Cosmetics ", "Dairy ", "Defense &amp; Space ", "Design ", "Education Management ", "E-learning ", "Electrical &amp; Electronic Manufacturing ", "Entertainment ", "Environmental Services ", "Events Services ", "Executive Office ", "Facilities Services ", "Farming ", "Financial Services ", "Fine Art ", "Fishery ", "Food &amp; Beverages ", "Food Production ", "Fundraising ", "Furniture ", "Gambling &amp; Casinos ", "Glass, Ceramics &amp; Concrete ", "Government Administration ", "Government Relations ", "Graphic Design ", "Health, Wellness &amp; Fitness ", "Higher Education ", "Hospital &amp; Health Care ", "Hospitality ", "Human Resources ", "Import &amp; Export ", "Individual &amp; Family Services ", "Industrial Automation ", "Information Services ", "Information Technology &amp; Services ", "Insurance ", "International Affairs ", "International Trade &amp; Development ", "Internet ", "Investment Banking/Venture ", "Investment Management ", "Judiciary ", "Law Enforcement ", "Law Practice ", "Legal Services ", "Legislative Office ", "Leisure &amp; Travel ", "Libraries ", "Logistics &amp; Supply Chain ", "Luxury Goods &amp; Jewelry ", "Machinery ", "Management Consulting ", "Maritime ", "Marketing &amp; Advertising ", "Market Research ", "Mechanical or Industrial Engineering ", "Media Production ", "Medical Device ", "Medical Practice ", "Mental Health Care ", "Military ", "Mining &amp; Metals ", "Motion Pictures &amp; Film ", "Museums &amp; Institutions ", "Music ", "Nanotechnology ", "Newspapers ", "Nonprofit Organization Management ", "Oil &amp; Energy ", "Online Publishing ", "Outsourcing/Offshoring ", "Package/Freight Delivery ", "Packaging &amp; Containers ", "Paper &amp; Forest Products ", "Performing Arts ", "Pharmaceuticals ", "Philanthropy ", "Photography ", "Plastics ", "Political Organization ", "Primary/Secondary ", "Printing ", "Professional Training ", "Program Development ", "Public Policy ", "Public Relations ", "Public Safety ", "Publishing ", "Railroad Manufacture ", "Ranching ", "Real Estate ", "Recreational Facilities &amp; Services ", "Religious Institutions ", "Renewables &amp; Environment ", "Research ", "Restaurants ", "Retail ", "Security &amp; Investigations ", "Semiconductors ", "Shipbuilding ", "Sporting Goods ", "Sports ", "Staffing &amp; Recruiting ", "Supermarkets ", "Telecommunications ", "Textiles ", "Think Tanks ", "Tobacco ", "Translation &amp; Localization ", "Transportation/Trucking/Railroad ", "Utilities ", "Venture Capital ", "Veterinary ", "Warehousing ", "Wholesale ", "Wine &amp; Spirits ", "Wireless ", "Writing &amp; Editing"];
        $scope.addressModel = '';
        $scope.lead_err={};
        $scope.lead_err.firstname=false;
        $scope.lead_err.lastname=false;
        $scope.inProcess = function (varBool, message) {
            if (varBool) {
                if (message) {
                    
                };
                $scope.nbLoads = $scope.nbLoads + 1;
                if ($scope.nbLoads == 1) {
                    $scope.isLoading = true;
                }
                ;
            } else {
                if (message) {
                    
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
        $scope.createPickerUploader = function () {

            var developerKey = 'AIzaSyDHuaxvm9WSs0nu-FrZhZcmaKzhvLiSczY';
            var picker = new google.picker.PickerBuilder().
                addView(new google.picker.DocsUploadView()).
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
                    $scope.profile_img.profile_img_id = data.docs[0].id;
                    $scope.profile_img.profile_img_url = data.docs[0].url;
                    

                    $scope.imageSrc = 'https://docs.google.com/uc?id=' + data.docs[0].id;
                    $scope.apply();
                }
            }
        }


        $scope.initObject = function (obj) {
            for (var key in obj) {
                obj[key] = null;
            }
        }

        $scope.pushElement = function (elem, arr, infos) {
            if (elem) {
                if (arr.indexOf(elem) == -1) {

                    switch (infos) {
                        case 'phones' :
                            if (elem.number) {
                                var copyOfElement = angular.copy(elem);
                                arr.push(copyOfElement);
                                $scope.initObject(elem);
                            }
                            $scope.showPhoneForm = false;
                            $scope.phone.type = 'work';
                            $scope.phone.number = '';
                            break;
                        case 'emails' :
                            if (elem.email) {
                                var copyOfElement = angular.copy(elem);
                                arr.push(copyOfElement);
                                $scope.initObject(elem);
                            }
                            $scope.showEmailForm = false;
                            $scope.email.email = '';
                            break;
                        case 'websites' :
                            if (typeof elem !== 'undefined') {
                                if (elem.url != "" && elem != null) {
                                    var copyOfElement = angular.copy(elem);
                                    arr.push(copyOfElement);
                                    $scope.initObject(elem);
                                }
                            }
                            ;

                            $scope.website.url = '';
                            $scope.showWebsiteForm = false;
                            break;
                        case 'sociallinks' :
                            if (typeof elem !== 'undefined') {
                                if (elem.url != "" && elem != null) {
                                    var copyOfElement = angular.copy(elem);
                                    arr.push(copyOfElement);
                                    $scope.initObject(elem);
                                }
                            }
                            $scope.sociallink.url = '';
                            $scope.showSociallinkForm = false;
                            break;
                        case 'customfields' :
                            if (elem.field && elem.value) {
                                arr.push(elem);
                            }
                            if (!$scope.isEmpty($scope.customfield)) {
                                  $scope.customfield.field = '';
                                  $scope.customfield.value = '';
                            };
                            console.log($scope.customfields);
                            $scope.showCustomFieldForm = false;
                            break;
                        case 'addresses' :
                            if (elem.formatted) {
                                var copyOfElement = angular.copy(elem);
                                arr.push(copyOfElement);
                                $scope.initObject(elem);
                            }
                            $('#addressmodal').modal('hide');

                            break;
                    }
                } else {
                    alert("item already exit");
                }
            }
        };

        //HKA 01.06.2014 Delete the infonode on DOM
        $scope.deleteInfos = function (arr, index) {
            arr.splice(index, 1);
        }

        $scope.runTheProcess = function () {

            $scope.getCustomFields('leads');
            Leadstatus.list($scope, {});
            $scope.mapAutocomplete();
            ga('send', 'pageview', '/leads/new');
            window.Intercom('update');

        };
        $scope.messageFromSocialLinkCallback = function(event){
        if (event.origin!=='https://accounts.google.com'&&event.origin!=='https://gcdc2013-iogrow.appspot.com'&&event.origin!=='http://localhost:8090'){
            console.log(event.origin);
            $scope.saveLinkedinData(event.data);
            window.removeEventListener("message", $scope.messageFromSocialLinkCallback, false);
        }
        };
        $scope.saveLinkedinData=function(data){
          console.log(data);
            $scope.clearLead();
            var params={
              'firstname':data.firstname,
              'lastname':data.lastname,
              'title':data.title,
              'cover_image':data.imgCoverUrl,
              'company':data.company
            }
            $scope.lead=$.extend(true, $scope.lead, params);
            $scope.imageSrc=data.profile_img_url;
            $scope.profile_img.profile_img_url=data.profile_img_url;
            var phone={
              'number':data.phone
            };
            var address={'formatted':data.locality};
            $scope.pushElement(address,$scope.addresses,'addresses');
            $scope.pushElement(phone,$scope.phones,'phones');
            var email={
              'email':data.email
            };
            $scope.email={};
            $scope.pushElement(email,$scope.emails,'emails');
            $scope.sociallink={};
            var sociallink={     
              url:data.linkedInUrl
            };
            $scope.pushElement(sociallink,$scope.sociallinks,'sociallinks');
            $scope.apply();
        }
        $scope.socialLinkOpener = function(socialLinkUrl){

            $scope.showLinkedinWindown=$scope.prepareUrl(socialLinkUrl);
            if (navigator.isChrome(navigator.sayswho)) {
                if (typeof (sessionStorage.isChromeExtensionInstalled) === 'undefined'){
                    $scope.browser='chrome';
                    $('#extensionNotInstalled').modal({backdrop: 'static', keyboard: false});
                }else{
                    window.open($scope.showLinkedinWindown,'winname','width=700,height=550');
                    window.addEventListener("message", $scope.messageFromSocialLinkCallback, false);
                }
            }else{
                $scope.browser='other';
                $('#extensionNotInstalled').modal({backdrop: 'static', keyboard: false});
            };    

        };
        $scope.lunchWindow=function(){
            window.open($scope.showLinkedinWindown,'winname','width=700,height=550');
            window.addEventListener("message", $scope.messageFromSocialLinkCallback, false);
        }
        $scope.getCustomFields=function(related_object){
            Customfield.list($scope,{related_object:related_object});
        }
        $scope.listResponse=function(items,related_object){
            //infonodes.customfields
            $scope[related_object].customfields=items;
            var additionalCustomFields=[];
            angular.forEach($scope.infonodes.customfields, function (infonode) {
                    infonode.property_type=infonode.fields[0].property_type;
                    infonode.value=infonode.fields[0].value;
                    infonode.field=infonode.fields[0].field;
                if (infonode.property_type==""||infonode.property_type=="StringProperty"||infonode.property_type==null) {
                    console.log('in stringtype______________________________________ ');
                    console.log(infonode);
                    additionalCustomFields.push(infonode);
                }else{
                        var schemaExists=false;
                        angular.forEach($scope[related_object].customfields, function (customfield) {
                        if (customfield.id==infonode.property_type) {
                            console.log('in not stringprope ______________________________');
                            console.log(infonode);
                            schemaExists=true;
                            var info_value=null;
                            if (infonode.fields[0].field=="property_type") {
                                info_value=infonode.fields[1].value;
                            }else{
                                info_value=infonode.fields[0].value;
                            };
                            if (customfield.field_type=="checkbox") {
                                customfield.value=JSON.parse(info_value);
                            }else{
                                customfield.value=info_value;
                            };
                          
                            customfield.infonode_key=infonode.entityKey;
                            
                             
                            };
                        });
                        if (!schemaExists) {
                             
                            additionalCustomFields.push(infonode);
                        };
                };
                    
            });
            $scope.infonodes.customfields=additionalCustomFields;
            $scope.apply();
            
        }
        $scope.addCustomField = function (customField,option) {
               
               
            if (customField) {
                    
                    if (!customField.field) {
                        customField.field=customField.name;
                    };
                    var custom_value=null;
                        if (option) {
                            
                            if (!customField.value) {
                                customField.value=[];
                            };
                            customField.value.push(option);
                            custom_value=JSON.stringify(customField.value);
                        }else{

                             custom_value=customField.value;
                        };

                        
                        
                    if (customField.field && customField.value) {
                        var params = {
                                    "field": customField.field,
                                    "property_type":customField.id,
                                    "value": custom_value
                                };
                        $scope.customfields.push(params);
                        console.log($scope.customfields);

                    }
            }
            $('#customfields').modal('hide');
            $scope.customfield = {};
            $scope.showCustomFieldForm = false;

        };
// for google map
        $scope.mapAutocomplete = function () {
            //$scope.addresses = $scope.account.addresses;
            Map.autocomplete($scope, "pac-input");
        }

        $scope.addGeo = function (address) {
            $scope.addresses.unshift(address);
            
            
            $scope.apply();
        };
        $scope.setLocation = function (address) {
            Map.setLocation($scope, address);
        }
        $scope.notFoundAddress = function (address, inputId) {
            
            $scope.addressNotFound = address.name;
            $('#confirmNoGeoAddress').modal('show');
            $scope.apply();
            
            

            $('#' + inputId).val("");
        }


        $scope.getPosition = function (index) {
            if (index < 3) {

                return index + 1;
            } else {
                
                return (index % 3) + 1;
            }
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
                    'order': $scope.order, 'limit': 6,
                    'pageToken': $scope.pages[nextPage]
                }
            } else {
                params = {'order': $scope.order, 'limit': 6}
            }
            
            $scope.currentPage = $scope.currentPage + 1;
            Lead.list($scope, params);
        }
        $scope.listPrevPageItems = function () {

            var prevPage = $scope.currentPage - 1;
            var params = {};
            if ($scope.pages[prevPage]) {
                params = {
                    'order': $scope.order, 'limit': 6,
                    'pageToken': $scope.pages[prevPage]
                }
            } else {
                params = {'order': $scope.order, 'limit': 6}
            }
            $scope.currentPage = $scope.currentPage - 1;
            Lead.list($scope, params);
        }

        // new Lead
        $scope.showModal = function () {
            $('#addLeadModal').modal('show');

        };


        $scope.prepareInfonodes = function () {
            var infonodes = [];
            angular.forEach($scope.websites, function (website) {
                var infonode = {
                    'kind': 'websites',
                    'fields': [
                        {
                            'field': "url",
                            'value': website.url
                        }
                    ]

                }
                infonodes.push(infonode);
            });
            angular.forEach($scope.sociallinks, function (sociallink) {
                var infonode = {
                    'kind': 'sociallinks',
                    'fields': [
                        {
                            'field': "url",
                            'value': sociallink.url
                        }
                    ]

                }
                infonodes.push(infonode);
            });
            angular.forEach($scope.customfields, function (customfield) {
                console.log("infonodes.customfield");
                console.log(customfield);
                var infonode = {
                    'kind': 'customfields',
                    'fields': [
                        {
                            'field': customfield.field,
                            'property_type':customfield.property_type,
                            'value': customfield.value
                        }
                    ]
                }
                infonodes.push(infonode);
            });
            angular.forEach($scope.addresses, function (address) {
                
                
                var infonode = {
                    'kind': 'addresses',
                    'fields': [
                        {
                            "field": "street",
                            "value": address.street
                        },
                        {
                            "field": "city",
                            "value": address.city
                        },
                        {
                            "field": "state",
                            "value": address.state
                        },
                        {
                            "field": "postal_code",
                            "value": address.postal_code
                        },
                        {
                            "field": "country",
                            "value": address.country
                        },
                        {
                            "field": "formatted",
                            "value": address.formatted
                        }
                    ]
                };
                if (address.lat && address.lng) {
                    infonode.fields.push({"field": "lat", "value": address.lat.toString()});
                    infonode.fields.push({"field": "lng", "value": address.lng.toString()});
                }
                ;
                infonodes.push(infonode);
                
                
            });
            return infonodes;
        };
        $scope.leadInserted = function (id) {
            window.location.replace('/#/leads/show/' + id);
        };
        $scope.getParamsFromLead = function (lead) {
            if (lead.firstname && lead.lastname) {
                var params = {
                    'firstname': lead.firstname,
                    'lastname': lead.lastname,
                    'company': lead.company,
                    'title': lead.title,
                    'tagline': lead.tagline,
                    'introduction': lead.introduction,
                    'phones': $scope.phones,
                    'emails': $scope.emails,
                    'addresses': $scope.addresses,
                    'industry': lead.industry || null,
                    'source': lead.source || null,
                    'infonodes': $scope.prepareInfonodes(),
                    'access': lead.access || 'public',
                    'cover_image':lead.cover_image,
                    'notes': $scope.notes,
                    'status': $scope.status_selected.status || null
                };
                if ($scope.profile_img.profile_img_id) {
                    params['profile_img_id'] = $scope.profile_img.profile_img_id;
                    if ($scope.profile_img.profile_img_id) {
                        params['profile_img_url'] = 'https://docs.google.com/uc?id=' + $scope.profile_img.profile_img_id;
                    } else {
                        if ($scope.profile_img.profile_img_url) {
                            params['profile_img_url'] = $scope.profile_img.profile_img_url;
                        }

                    }
                }
                ;
                $scope.addLeadOnKey = function (lead) {
                    if (event.keyCode == 13 && lead) {
                        $scope.save(lead);
                    }
                };

            }
            if ($scope.profile_img.profile_img_url) {
                params['profile_img_url'] = $scope.profile_img.profile_img_url;
            }
            return params;
        }
        $scope.save = function (lead, force) {
             if (!lead.firstname) $scope.lead_err.firstname=true;
             if (!lead.lastname) $scope.lead_err.lastname=true;
             if (!$scope.lead_err.lastname&&!$scope.lead_err.firstname) {
                force = force || false;
                var sameLeadModal = angular.element("#sameLeadModal");
                if (force && sameLeadModal.length) {
                    sameLeadModal.modal("hide");
                    $('body').removeClass('modal-open'); 
                    $('.modal-backdrop').remove();
                }
                var params = $scope.getParamsFromLead(lead);
                if (!params.source) {
                    params.source='ioGrow';
                };
                Lead.create($scope, params, force);
             };
        };
        $scope.addLeadOnKey = function (lead) {
            if (event.keyCode == 13 && lead) {
                $scope.save(lead);
            }
        }

        $scope.selectResult = function () {
            window.location.replace('#/leads/show/' + $scope.searchQuery.id);
        };
        $scope.executeSearch = function (searchQuery) {
            if (typeof(searchQuery) == 'string') {
                var goToSearch = 'type:Lead ' + searchQuery;
                window.location.replace('#/search/' + goToSearch);
            } else {
                window.location.replace('#/leads/show/' + searchQuery.id);
            }
            $scope.searchQuery = ' ';
            $scope.apply();
        };
// Sorting
        $scope.orderBy = function (order) {
            var params = {
                'order': order,
                'limit': 6
            };
            $scope.order = order;
            Lead.list($scope, params);
        };
        $scope.filterByOwner = function (filter) {
            if (filter) {
                var params = {
                    'owner': filter,
                    'order': $scope.order
                }
            }
            else {
                var params = {
                    'order': $scope.order
                }
            }
            ;
            $scope.isFiltering = true;
            Lead.list($scope, params);
        };
        $scope.filterByStatus = function (filter) {
            if (filter) {
                var params = {
                    'status': filter,
                    'order': $scope.order,
                    'limit': 6
                }
            }
            else {
                var params = {
                    'order': $scope.order,

                    'limit': 6
                }
            }
            ;
            
            console.log(params)
            $scope.isFiltering = true;
            Lead.list($scope, params);
        };

        $scope.executeSearch = function (searchQuery) {
            if (typeof(searchQuery) == 'string') {
                var goToSearch = 'type:Lead ' + searchQuery;
                window.location.replace('#/search/' + goToSearch);
            } else {
                window.location.replace('#/leads/show/' + searchQuery.id);
            }
            $scope.searchQuery = ' ';
            $scope.apply();
        }

        /***********************************************
         HKA 19.02.2014  tags
         ***************************************************************************************/
        $scope.listTags = function () {
            var paramsTag = {'about_kind': 'Lead'}
            Tag.list($scope, paramsTag);
        };

        $scope.edgeInserted = function () {
            $scope.listleads();
        };
        $scope.listleads = function () {
            var params = {
                'order': $scope.order,
                'limit': 20
            }
            Lead.list($scope, params);


        };

        $scope.edgeInserted = function () {
            $scope.listleads();
        };
        $scope.listleads = function () {
            var params = {
                'order': $scope.order,
                'limit': 20
            };
            Lead.list($scope, params);
        }
        $scope.addNewtag = function (tag) {
            var params = {
                'name': tag.name,
                'about_kind': 'Lead',
                'color': tag.color.color
            };
            Tag.insert($scope, params);
            $scope.tag.name = '';
            $scope.tag.color = {'name': 'green', 'color': '#BBE535'};
            var paramsTag = {'about_kind': 'Lead'};
            Tag.list($scope, paramsTag);

        }
        $scope.addNote = function () {
            $scope.notes.push($scope.newnote)
            $scope.newnote = {}
        }
        $scope.updateTag = function (tag) {
            params = {
                'id': tag.id,
                'title': tag.name,
                'status': tag.color
            };
            Tag.patch($scope, params);
        };
        $scope.deleteTag = function (tag) {
            params = {
                'entityKey': tag.entityKey
            }
            Tag.delete($scope, params);

        };

        $scope.addNewtag = function (tag) {
            var params = {
                'name': tag.name,
                'about_kind': 'Lead',
                'color': tag.color.color
            };
            Tag.insert($scope, params);
            $scope.tag.name = '';
            $scope.tag.color = {'name': 'green', 'color': '#BBE535'};
            var paramsTag = {'about_kind': 'Lead'};
            Tag.list($scope, paramsTag);
        }

        $scope.selectTag = function (tag, index, $event) {
            if (!$scope.manage_tags) {
                var element = $($event.target);
                if (element.prop("tagName") != 'LI') {
                    element = element.parent();
                    element = element.parent();
                }
                var text = element.find(".with-color");
                if ($scope.selected_tags.indexOf(tag) == -1) {
                    $scope.selected_tags.push(tag);
                    /*element.css('background-color', tag.color+'!important');
                     text.css('color',$scope.idealTextColor(tag.color));*/

                } else {
                    /* element.css('background-color','#ffffff !important');*/
                    $scope.selected_tags.splice($scope.selected_tags.indexOf(tag), 1);
                    /* text.css('color','#000000');*/
                }
                ;
                $scope.filterByTags($scope.selected_tags);

            }

        };
        $scope.filterByTags = function (selected_tags) {
            var tags = [];
            angular.forEach(selected_tags, function (tag) {
                tags.push(tag.entityKey);
            });
            var params = {
                'tags': tags,
                'order': $scope.order,
                'limit': 20
            };
            $scope.isFiltering = true;
            Lead.list($scope, params);

        };

        $scope.unselectAllTags = function () {
            $('.tags-list li').each(function () {
                var element = $(this);
                var text = element.find(".with-color");
                element.css('background-color', '#ffffff !important');
                text.css('color', '#000000');
            });
        };
//HKA 19.02.2014 When delete tag render account list
        $scope.tagDeleted = function () {
            $scope.listTags();
            $scope.listleads();

        };


        $scope.manage = function () {
            $scope.unselectAllTags();
        };
        $scope.tag_save = function (tag) {
            if (tag.name) {
                Tag.insert($scope, tag);

            }
            ;
        };

        $scope.editTag = function (tag) {
            $scope.edited_tag = tag;
        }
        $scope.doneEditTag = function (tag) {
            $scope.edited_tag = null;
            $scope.updateTag(tag);
        }
        $scope.addTags = function () {
            var tags = [];
            var items = [];
            tags = $('#select2_sample2').select2("val");

            angular.forEach($scope.selected_tasks, function (selected_task) {
                angular.forEach(tags, function (tag) {
                    var edge = {
                        'start_node': selected_task.entityKey,
                        'end_node': tag,
                        'kind': 'tags',
                        'inverse_edge': 'tagged_on'
                    };
                    items.push(edge);
                });
            });

            params = {
                'items': items
            }

            Edge.insert($scope, params);
            $('#assigneeTagsToTask').modal('hide');

        };


        $('#addMemberToTask > *').on('click', null, function (e) {
            e.stopPropagation();
        });
        $scope.idealTextColor = function (bgColor) {
            var nThreshold = 105;
            var components = getRGBComponents(bgColor);
            var bgDelta = (components.R * 0.299) + (components.G * 0.587) + (components.B * 0.114);

            return ((255 - bgDelta) < nThreshold) ? "#000000" : "#ffffff";
        }
        function getRGBComponents(color) {

            var r = color.substring(1, 3);
            var g = color.substring(3, 5);
            var b = color.substring(5, 7);

            return {
                R: parseInt(r, 16),
                G: parseInt(g, 16),
                B: parseInt(b, 16)
            };
        }

        $scope.dragTag = function (tag) {
            $scope.draggedTag = tag;
            $scope.apply();
        };
        $scope.dropTag = function (lead) {
            var items = [];

            var edge = {
                'start_node': lead.entityKey,
                'end_node': $scope.draggedTag.entityKey,
                'kind': 'tags',
                'inverse_edge': 'tagged_on'
            };
            items.push(edge);
            params = {
                'items': items
            };
            Edge.insert($scope, params);
            $scope.draggedTag = null;
        };


        // HKA 12.03.2014 Pallet color on Tags
        $scope.checkColor = function (color) {
            $scope.tag.color = color;
        }
        $scope.isEmpty = function (obj) {
            return jQuery.isEmptyObject(obj);
        }
        $scope.isEmptyArray = function (Array) {
            if (Array != undefined && Array.length > 0) {
                return false;
            } else {
                return true;
            }
            ;

        }
        $scope.getLinkedinProfile = function () {
            var params = {
                "firstname": $scope.lead.firstname,
                "lastname": $scope.lead.lastname
            }
            var linkedurl = null;
            $scope.inNoResults = false;
            if ($scope.lead.sociallinks == undefined) {
                $scope.lead.sociallinks = [];
            }
            ;
            var savedEntityKey = null;
            if ($scope.lead.sociallinks.length > 0) {
                angular.forEach($scope.lead.sociallinks, function (link) {
                    if ($scope.linkedinUrl(link.url)) {
                        linkedurl = link.url;
                        savedEntityKey = link.entityKey;
                    }
                    ;
                });
            }
            ;
            if (linkedurl) {
                var par = {'url': linkedurl};
                Linkedin.profileGet(par, function (resp) {
                    if (!resp.code) {
                        $scope.inProfile.fullname = resp.fullname;
                        $scope.inProfile.title = resp.title;
                        $scope.inProfile.formations = resp.formations
                        $scope.inProfile.locality = resp.locality;
                        $scope.inProfile.relation = resp.relation;
                        $scope.inProfile.industry = resp.industry;
                        $scope.linkedProfileresume = resp.resume;
                        $scope.inProfile.entityKey = savedEntityKey;
                        $scope.inProfile.url = linkedurl;
                        $scope.inProfile.resume = resp.resume;
                        $scope.inProfile.skills = resp.skills;
                        $scope.inProfile.current_post = resp.current_post;
                        $scope.inProfile.past_post = resp.past_post;
                        $scope.inProfile.certifications = JSON.parse(resp.certifications);
                        $scope.inProfile.experiences = JSON.parse(resp.experiences);
                        if ($scope.inProfile.experiences) {
                            $scope.inProfile.experiences.curr = $scope.inProfile.experiences['current-position'];
                            $scope.inProfile.experiences.past = $scope.inProfile.experiences['past-position'];
                        }
                        if ($scope.lead.addresses == undefined || $scope.lead.addresses == []) {
                            $scope.addGeo({'formatted': $scope.inProfile.locality});
                        }
                        ;
                        $scope.linkedLoader = false;
                        $scope.inIsLoading = false;
                        $scope.isLoading = false;
                        $scope.apply();
                    } else {
                        
                        if (resp.code == 401) {
                            // $scope.refreshToken();
                            $scope.isLoading = false;
                            $scope.apply();
                        }
                        ;
                    }
                });
            } else {
                Linkedin.
                    listPeople(params, function (resp) {
                        $scope.inIsSearching = true;
                        $scope.inShortProfiles = [];
                        $scope.inProfile = {};
                        if (!resp.code) {
                            $scope.inIsSearching = false;
                            if (resp.items == undefined) {
                                $scope.inList = [];
                                $scope.inNoResults = true;
                                $scope.inIsSearching = false;
                            } else {
                                $scope.inList = resp.items;
                                if (resp.items.length < 4) {
                                    
                                    angular.forEach(resp.items, function (item) {
                                        
                                        $scope.getLinkedinByUrl(item.url);
                                    });
                                }
                            }
                            ;
                            $scope.isLoading = false;
                            $scope.$apply();
                        } else {
                            
                            if (resp.code == 401) {
                                // $scope.refreshToken();
                                
                                $scope.isLoading = false;
                                $scope.$apply();
                            }
                            if (resp.code >= 500) {
                                $scope.inNoResults = true;
                                $scope.inIsSearching = false;
                                $scope.apply();
                            }
                        }
                    });
            }
            ;
        }
        $scope.twitterUrl = function (url) {
            var match = "";
            var matcher = new RegExp("twitter");
            var test = matcher.test(url);
            return test;
        }
        $scope.getTwitterProfile = function () {
            var params = {
                "firstname": $scope.lead.firstname,
                "lastname": $scope.lead.lastname
            }
            var twitterurl = null;
            $scope.twNoResults = false;
            if ($scope.lead.sociallinks == undefined) {
                $scope.lead.sociallinks = [];
            }
            ;
            var savedEntityKey = null;
            if ($scope.lead.sociallinks.length > 0) {
                angular.forEach($scope.lead.sociallinks, function (link) {
                    if ($scope.twitterUrl(link.url)) {
                        twitterurl = link.url;
                        savedEntityKey = link.entityKey;
                    }
                    ;
                });
            }
            ;
            if (twitterurl) {
                var par = {'url': twitterurl};
                Linkedin.getTwitterProfile(par, function (resp) {
                    if (!resp.code) {
                        $scope.twProfile.name = resp.name;
                        $scope.twProfile.screen_name = resp.screen_name;
                        $scope.twProfile.created_at = resp.created_at
                        $scope.twProfile.description_of_user = resp.description_of_user;
                        $scope.twProfile.followers_count = resp.followers_count;
                        $scope.twProfile.friends_count = resp.friends_count;
                        $scope.twProfile.id = resp.id;
                        $scope.twProfile.lang = resp.lang;
                        $scope.twProfile.language = resp.language;
                        $scope.twProfile.last_tweet_favorite_count = resp.last_tweet_favorite_count;
                        $scope.twProfile.last_tweet_retweet_count = resp.last_tweet_retweet_count;
                        $scope.twProfile.last_tweet_text = resp.last_tweet_text;
                        $scope.twProfile.location = resp.location;
                        $scope.twProfile.nbr_tweets = resp.nbr_tweets;
                        $scope.twProfile.profile_banner_url = resp.profile_banner_url;
                        $scope.twProfile.profile_image_url_https = resp.profile_image_url_https;
                        $scope.twProfile.url_of_user_their_company = resp.url_of_user_their_company;
                        $scope.twProfile.entityKey = savedEntityKey;
                        $scope.twProfile.url = twitterurl;
                        if ($scope.lead.addresses == undefined || $scope.lead.addresses == []) {
                            $scope.addGeo({'formatted': $scope.twProfile.location});
                        }
                        ;
                        $scope.twIsLoading = false;
                        $scope.isLoading = false;
                        $scope.apply();
                    } else {
                        
                        if (resp.code == 401) {
                            // $scope.refreshToken();
                            $scope.isLoading = false;
                            $scope.apply();
                        }
                        ;
                    }
                });
            } else {
                Linkedin.getTwitterList(params, function (resp) {
                    $scope.twIsSearching = true;
                    $scope.twShortProfiles = [];
                    $scope.twProfile = {};
                    if (!resp.code) {
                        $scope.twIsSearching = false;
                        if (resp.items == undefined) {
                            $scope.twList = [];
                            $scope.twNoResults = true;
                            $scope.twIsSearching = false;
                        } else {
                            $scope.twList = resp.items;
                            if (resp.items.length < 4) {
                                
                                angular.forEach(resp.items, function (item) {
                                    
                                    $scope.getTwitterByUrl(item.url);
                                });
                            }
                        }
                        ;
                        $scope.isLoading = false;
                        $scope.$apply();
                    } else {
                        
                        if (resp.code == 401) {
                            // $scope.refreshToken();
                            
                            $scope.isLoading = false;
                            $scope.$apply();
                        }
                        if (resp.code >= 500) {
                            console.log("503 error")
                            $scope.twNoResults = true;
                            $scope.twIsSearching = false;
                            $scope.apply();
                        }
                        ;
                    }
                });
            }
            ;
        }
        $scope.getTwitterByUrl = function (url) {
            $scope.twIsLoading = true;
            var par = {'url': url};
            Linkedin.getTwitterProfile(par, function (resp) {
                if (!resp.code) {
                    prof = {};
                    prof.name = resp.name;
                    prof.screen_name = resp.screen_name;
                    prof.created_at = resp.created_at
                    prof.description_of_user = resp.description_of_user;
                    prof.followers_count = resp.followers_count;
                    prof.friends_count = resp.friends_count;
                    prof.id = resp.id;
                    prof.lang = resp.lang;
                    prof.language = resp.language;
                    prof.last_tweet_favorite_count = resp.last_tweet_favorite_count;
                    prof.last_tweet_retweet_count = resp.last_tweet_retweet_count;
                    prof.last_tweet_text = resp.last_tweet_text;
                    prof.location = resp.location;
                    prof.nbr_tweets = resp.nbr_tweets;
                    prof.profile_banner_url = resp.profile_banner_url;
                    prof.profile_image_url_https = resp.profile_image_url_https;
                    prof.url_of_user_their_company = resp.url_of_user_their_company;
                    prof.url = url;
                    $scope.twShortProfiles.push(prof);
                    $scope.twIsLoading = false;
                    $scope.apply();
                } else {
                    if (resp.code == 401) {
                        $scope.twIsLoading = false;
                        $scope.apply();
                    }
                    ;
                }
            });
        }
        $scope.saveTwitterUrl = function (shortProfile) {
            
            //$scope.clearContact();
            $scope.twList = [];
            $scope.twShortProfiles = [];
            $scope.twProfile = {};
            $scope.twProfile = shortProfile;
            $scope.sociallink = {'url': $scope.twProfile.url};
            if ($scope.twProfile.url_of_user_their_company) {
                $scope.website = {'url': $scope.twProfile.url_of_user_their_company};
                $scope.pushElement($scope.website, $scope.websites, 'websites');
            }
            ;
            $scope.savedSociallink = $scope.twProfile.url;
            $scope.pushElement($scope.sociallink, $scope.sociallinks, 'sociallinks');
            
            
            if ($scope.imageSrc == '/static/img/avatar_contact.jpg' || $scope.imageSrc == '') {
                
                $scope.imageSrc = $scope.twProfile.profile_image_url_https;
                $scope.profile_img.profile_img_url = $scope.twProfile.profile_image_url_https;
            }
            ;
            /*$scope.imageSrc = $scope.twProfile.profile_picture;*/
            //  $scope.profile_img.profile_img_url = $scope.twProfile.profile_picture;
            /*$scope.lead.source='Linkedin';
             $scope.lead.industry=''
             if (!$scope.lead.title) {
             $scope.lead.title = $scope.twProfile.title;
             };
             if($scope.twProfile.current_post){
             if ($scope.twProfile.current_post[0]){
             $scope.lead.company = $scope.twProfile.current_post[0];
             }
             }
             */
            /*if ($scope.twProfile.location!=''&&$scope.twProfile.location!=null) {*/
            if (!$scope.addressModel) {
                $scope.addressModel = $scope.twProfile.location;
            } else {
                if ($scope.addressModel.length < $scope.twProfile.location.length) {
                    $scope.addressModel = $scope.twProfile.location;
                }
                ;
            }
            ;
            // $scope.addGeo({'formatted':$scope.twProfile.location});
            /*};*/
            $scope.apply();
        }
        $scope.cancelSelection = function (arrayname) {
            console.log(arrayname)
            $scope[arrayname] = [];
            
            console.log(arrayname)
            $scope.apply();

        }
        $scope.getLinkedinByUrl = function (url) {
            $scope.inIsLoading = true;
            var par = {'url': url};
            Linkedin.profileGet(par, function (resp) {
                if (!resp.code) {
                    prof = {};
                    prof.fullname = resp.fullname;
                    prof.url = url;
                    prof.profile_picture = resp.profile_picture;
                    prof.title = resp.title;
                    prof.locality = resp.locality;
                    prof.industry = resp.industry;
                    prof.formations = resp.formations
                    prof.resume = resp.resume;
                    prof.skills = resp.skills;
                    prof.current_post = resp.current_post;
                    prof.past_post = resp.past_post;
                    prof.experiences = JSON.parse(resp.experiences);
                    if (prof.experiences) {
                        prof.experiences.curr = prof.experiences['current-position'];
                        prof.experiences.past = prof.experiences['past-position'];
                    }
                    $scope.inShortProfiles.push(prof);
                    $scope.inIsLoading = false;
                    $scope.apply();
                } else {
                    if (resp.code == 401) {
                        $scope.inIsLoading = false;
                        $scope.apply();
                    }
                    ;
                }
            });
        }
        $scope.extractCompanyName = function (company) {
            var i = company.length - 1;
            while (i > 0) {
                if (company.charAt(i) == ' ' || company.charAt(i) == ',') {
                    company = company.substring(0, i - 1);
                } else {
                    return company;
                }
                ;
                i = i - 1;

            }
        }
        $scope.saveLinkedinUrl = function (shortProfile) {
            //$scope.clearContact();
            $scope.inList = [];
            $scope.inShortProfiles = [];
            $scope.inProfile = {};
            $scope.inProfile = shortProfile;
            $scope.sociallink = {'url': $scope.inProfile.url};
            $scope.savedSociallink = $scope.inProfile.url;
            $scope.pushElement($scope.sociallink, $scope.sociallinks, 'sociallinks');
            /*if (!$scope.imageSrc) {*/
            $scope.imageSrc = $scope.inProfile.profile_picture;
            $scope.profile_img.profile_img_url = $scope.inProfile.profile_picture;
            /* };                           */
            $scope.lead.source = 'Linkedin';
            $scope.lead.industry = ''
            if (!$scope.lead.title) {
                $scope.lead.title = $scope.inProfile.title;
            }
            ;
            if ($scope.inProfile.current_post) {
                
                
                console.log($scope.extractCompanyName($scope.inProfile.current_post[0]))
                if ($scope.inProfile.current_post[0]) {

                    $scope.lead.company = $scope.extractCompanyName($scope.inProfile.current_post[0]);
                }
            }
            if ($scope.inProfile.locality != '' && $scope.inProfile.locality != null) {
                //$scope.addressModel=$scope.inProfile.locality;
                
                if (!$scope.addressModel) {
                    $scope.addressModel = $scope.inProfile.locality;
                } else {
                    if ($scope.addressModel.length < $scope.inProfile.locality.length) {
                        $scope.addressModel = $scope.inProfile.locality;
                    }
                    ;
                }
                ;

            }
            ;
            $scope.apply();
        }
        $scope.clearLinkedin = function () {
            $scope.inList = [];
            $scope.inShortProfiles = [];
            $scope.inProfile = {};
            $scope.apply()
        }
        $scope.prepareUrl = function (url) {
            var pattern = /^[a-zA-Z]+:\/\//;
            if (!pattern.test(url)) {
                url = 'http://' + url;
            }
            return url;
        }
        $scope.urlSource = function (url) {
            var links = ["aim", "bebo", "behance", "blogger", "delicious", "deviantart", "digg", "dribbble", "evernote", "facebook", "fastfm", "flickr", "formspring", "foursquare", "github", "google-plus", "instagram", "linkedin", "myspace", "orkut", "path", "pinterest", "quora", "reddit", "rss", "soundcloud", "stumbleupn", "technorati", "tumblr", "twitter", "vimeo", "wordpress", "yelp", "youtube"];
            var match = "";
            angular.forEach(links, function (link) {
                var matcher = new RegExp(link);
                var test = matcher.test(url);
                if (test) {
                    match = link;
                }
            });
            if (match == "") {
                match = 'globe';
            }
            ;
            return match;
        }
        $scope.clearLead = function () {
            $scope.lead = {};
            $scope.imageSrc = '/static/img/avatar_contact.jpg';
            $scope.searchAccountQuery = null;
            $scope.addresses = [];
            $scope.addressModel = null;
            $scope.websites = [];
            $scope.phones = [];
            $scope.emails = [];
            $scope.sociallinks = [];
            $scope.inList = [];
            $scope.inShortProfiles = [];
            $scope.inProfile = {};
            $scope.twList = [];
            $scope.twShortProfiles = [];
            $scope.twProfile = {};
            $scope.apply();
        }

        $scope.showSelectButton = function (index) {
            $("#item_" + index).addClass('grayBackground');
            $("#select_" + index).removeClass('selectLinkedinButton');
            if (index != 0) {
                $("#item_0").removeClass('grayBackground');
                $("#select_0").addClass('selectLinkedinButton');
            }
            ;
        }
        $scope.hideSelectButton = function (index) {

            if (!$("#select_" + index).hasClass('alltimeShowSelect')) {
                $("#item_" + index).removeClass('grayBackground');
                $("#select_" + index).addClass('selectLinkedinButton');
            }
            ;
            if (index != 0) {
                $("#item_0").addClass('grayBackground');
                $("#select_0").removeClass('selectLinkedinButton');
            }
            ;

        };
        $scope.showSelectTwitter = function (index) {
            $("#titem_" + index).addClass('grayBackground');
            $("#tselect_" + index).removeClass('selectLinkedinButton');
            if (index != 0) {
                $("#titem_0").removeClass('grayBackground');
                $("#tselect_0").addClass('selectLinkedinButton');
            }
            ;
        }
        $scope.hideSelectTwitter = function (index) {

            if (!$("#tselect_" + index).hasClass('alltimeShowSelect')) {
                $("#titem_" + index).removeClass('grayBackground');
                $("#tselect_" + index).addClass('selectLinkedinButton');
            }
            ;
            if (index != 0) {
                $("#titem_0").addClass('grayBackground');
                $("#tselect_0").removeClass('selectLinkedinButton');
            }
            ;

        };
        $scope.addLinkedIn = function (social) {
            $scope.getLinkedinByUrl(social.url);
        };
        $scope.mergedLeads = 0;
        $scope.mergeLead = function (baseLead, newLead) {
            var params = {base_id: baseLead.id, new_lead: $scope.getParamsFromLead(newLead)};
            Lead.mergeLead($scope, params);
        };
        $scope.openLeadDetailView = function (id) {
            var width = screen.width / 2;
            var height = screen.width / 2;
            var left = (screen.width / 2) - (width / 2);
            var top = (screen.height / 2) - (height / 2);
            var url = '/#/leads/show/' + id;
            var windowFeatures = "scrollbars=yes, resizable=yes, top=" + top + ", left=" + left +
                ", width=" + width + ", height=" + height + "menubar=no,resizable=no,status=no ";
            window.open(url, "_blank", windowFeatures);
        };

        // Google+ Authentication
        Auth.init($scope);
    }]);