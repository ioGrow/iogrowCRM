app.controller('LeadListCtrl', ['$scope','$filter','Auth','Lead','Leadstatus','Tag','Edge','Profile','Attachement', 'Email','User','$http',
    function($scope,$filter,Auth,Lead,Leadstatus,Tag,Edge,Profile,Attachement,Email,User,$http) {
      $("ul.page-sidebar-menu li").removeClass("active");
      $("#id_Leads").addClass("active");



      document.title = "Leads: Home";
      $scope.isSignedIn = false;
      $scope.immediateFailed = false;
      $scope.nextPageToken = undefined;
      $scope.prevPageToken = undefined;
      $scope.isLoading = false;
      $scope.nbLoads=0;
      $scope.isMoreItemLoading = false;
      $scope.isbigScreen=false;
      $scope.isSelectedAll=false;
      $scope.leadpagination = {};

      $scope.currentPage = 01;
      $scope.page = 1;
      $scope.pages = [];
      $scope.selectedOption='all';
      $scope.stage_selected={};
      $scope.showTagsFilter=false;
      $scope.showNewTag=false;
      $scope.diselectedOption=''
      $scope.leads = [];
      $scope.lead = {};
      $scope.selectedLead={};
      $scope.showClose=false;
      $scope.lead.access ='public';
      $scope.order = '-updated_at';
      $scope.status = 'New';
      $scope.selected_tags = [];
      $scope.draggedTag=null;
      $scope.tag = {};
      $scope.currentLead=null;
      $scope.selected_leads=[];
      $scope.showUntag=false;
      $scope.edgekeytoDelete=undefined;
      $scope.file_type = 'outlook';
      $scope.show="cards";
      $scope.selectedCards=[];
      $scope.allCardsSelected=false;    
      $scope.leadToMail=null; 
      $scope.email={}; 
      $scope.sendWithAttachments = [];
      $scope.emailSentMessage=false;
      $scope.smallModal=false;
      $scope.sourceFilter='all';
      $scope.isExporting=false;
      $scope.color_pallet=[
         {'name':'red','color':'#F7846A'},
         {'name':'orange','color':'#FFBB22'},
         {'name':'yellow','color':'#EEEE22'},
         {'name':'green','color':'#BBE535'},
         {'name':'blue','color':'#66CCDD'},
         {'name':'gray','color':'#B5C5C5'},
         {'name':'teal','color':'#77DDBB'},
         {'name':'purple','color':'#E874D6'},
         ];


  $scope.emailSignature=document.getElementById("signature").value;
  if($scope.emailSignature =="None"){
    $scope.emailSignature="";
  }else{
    $scope.emailSignature="<br/><br/><br/><br/><br/><br/><br/><br/><br/><br/>"+$scope.emailSignature;
  }

   document.getElementById("some-textarea").value=$scope.emailSignature;
       //$scope.showPage=true;
         $scope.tag.color= {'name':'green','color':'#BBE535'};
          $scope.redirectTo=function(url){
          window.location.replace('/#/search/type:contact tags:'+url);
        }

        $scope.inProcess=function(varBool,message){
          if (varBool) {           
            if (message) {
              console.log("starts of :"+message);
            };
            $scope.nbLoads=$scope.nbLoads+1;
            if ($scope.nbLoads==1) {
              $scope.isLoading=true;
            };
          }else{
            if (message) {
              console.log("ends of :"+message);
            };
            $scope.nbLoads=$scope.nbLoads-1;
            if ($scope.nbLoads==0) {
               $scope.isLoading=false;
 
            };

          };
        }        
        $scope.apply=function(){
         
          if ($scope.$root.$$phase != '$apply' && $scope.$root.$$phase != '$digest') {
               $scope.$apply();
              }
              return false;
        }

      // What to do after authentication
        $scope.runTheProcess = function(){
          var completedTour =  document.getElementById("completedTour").value;
          if(completedTour=='False' | completedTour=='None' ){
            if (localStorage['completedTour']!='True'){
                $scope.wizard();
            }
              
          }
          else{
            console.log('wach bi jedek');
          }
          
          Lead.disocver_check();
          $scope.checkScrollBar();
            var params = {'order' : $scope.order,'limit':20};
            
            Lead.list($scope,params);
            Leadstatus.list($scope,{});
            var paramsTag = {'about_kind':'Lead'};
            Tag.list($scope,paramsTag);

          ga('send', 'pageview', '/leads');
          if (localStorage['leadShow']!=undefined) {

              $scope.show=localStorage['leadShow'];

          };
          window.Intercom('update');
        };
        $scope.refreshCurrent=function(){
            $scope.runTheProcess();
        }
          $scope.leadDeleted=function(){
            if (!jQuery.isEmptyObject($scope.selectedLead)&&$scope.selectedContact!=null) {  
               $scope.leads.splice($scope.leads.indexOf($scope.selectedLead) , 1);
              
            }else{
              angular.forEach($scope.selectedCards, function(selected_lead){
                  $scope.leads.splice($scope.leads.indexOf(selected_lead) , 1);
                 
              });
               $scope.selectedCards=[];
                $scope.apply();
            };
            
          }
              $scope.gotosendMail = function(email,lead){
                // console.log($scope.emailSignature);
                // $scope.email.body=$scope.emailSignature;

              
              console.log($scope.emailSignature);
                   $scope.leadToMail=lead;
                   $scope.email.to = email;
                   $('#testnonefade').modal("show");
                   $scope.smallSendMail();
                   document.getElementById("some-textarea").value=$scope.emailSignature;
              }
              $('#some-textarea').wysihtml5();
            $scope.switchwysihtml=function(){
              if ($(".wysihtml5-toolbar").is(":visible")) {

                $(".wysihtml5-toolbar").hide();
                $(".wysihtml5-sandbox").addClass("withoutTools");

              }else{

                $(".wysihtml5-sandbox").removeClass("withoutTools")
                $(".wysihtml5-toolbar").show();
                
              };  
            }
            $scope.closeEmailModel=function(){
              $(".modal-backdrop").remove();
               $('#testnonefade').hide();

            }
            $scope.switchEmailModal=function(){
              if ($( "#testnonefade" ).hasClass( "emailModalOnBottom" )) {
                  $scope.bigSendMail();
                  $scope.smallModal=true;
              }else{
                   $scope.smallSendMail();
                   $scope.smallModal=false;
              };
            }
                  $scope.showAttachFilesPicker = function() {
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
      $scope.attachmentUploaderCallback= function(data){
        if (data.action == google.picker.Action.PICKED) {
                

                $.each(data.docs, function(index) {
                    var file = { 'id':data.docs[index].id,
                                  'title':data.docs[index].name,
                                  'mimeType': data.docs[index].mimeType,
                                  'embedLink': data.docs[index].url
                    };
                    $scope.sendWithAttachments.push(file);
                });
                $scope.apply();
        }
      }
            $scope.smallSendMail=function(){
              $(".modal-backdrop").remove();
              console.log("before delellllllllllete");
              $('#testnonefade').addClass("emailModalOnBottom");
              //document.getElementById("some-textarea").value=$scope.emailSignature;
            }
            $scope.bigSendMail=function(){
              $('#testnonefade').removeClass("emailModalOnBottom");
              $( "body" ).append( '<div class="modal-backdrop fade in"></div>' );

            }
              $scope.sendEmail = function(email){
              
              console.log("iiiiiiiiiiiiiiiiiinter heeeeeeeeeeeeeeeeere");
              email.body = $('#some-textarea').val();
              var params = {
                        'to': email.to,
                        'cc': email.cc,
                        'bcc': email.bcc,
                        'subject': email.subject,
                        'body': email.body,
                        'about':$scope.leadToMail.entityKey
                        };
              if ($scope.sendWithAttachments){
                  params['files']={
                                  'parent':$scope.leadToMail.entityKey,
                                  'access':$scope.leadToMail.access,
                                  'items':$scope.sendWithAttachments
                                  };
              };

              Email.send($scope,params,true);       
            };
    $scope.emailSentConfirmation=function(){
                  console.log('$scope.email');
                  console.log($scope.email);
                  $scope.email={};
                  $scope.showCC=false;
                  $scope.showBCC=false;
                  $scope.leadToMail=null;
                  $('#testnonefade').modal("hide");
                   $scope.email={};
                   console.log('$scope.email');
                   $scope.emailSentMessage=true;
                   setTimeout(function(){  $scope.emailSentMessage=false; $scope.apply() }, 2000);
              }


// HADJI HICHAM -04/02/2015

   $scope.removeTag = function(tag,lead) {
            

            /*var params = {'tag': tag,'index':$index}

            Edge.delete($scope, params);*/
            $scope.dragTagItem(tag,lead);
            $scope.dropOutTag();
        }

/***********************************************************/
        $scope.switchShow=function(){
            if ($scope.show=='list') {      

                 $scope.show = 'cards';
                 localStorage['leadShow']="cards";
                 $scope.selectedCards =[];
                  $("#leadCardsContainer").trigger( 'resize' ); 


            }else{

              if ($scope.show=='cards') {
                 $scope.show = 'list';
                  localStorage['leadShow']="list";
                  $scope.selectedCards =[];
              }
              
            };
        }
         $scope.isSelectedCard = function(lead) {
            return ($scope.selectedCards.indexOf(lead) >= 0||$scope.allCardsSelected);
          };
          $scope.unselectAll = function($event){
               var element=$($event.target);
               if(element.hasClass('waterfall')){
                  $scope.selectedCards=[];
               };
              /*$scope.selectedCards=[];*/
          }
          $scope.selectAll = function($event){
         
              var checkbox = $event.target;
               if(checkbox.checked){
                  $scope.selectedCards=[];
                  $scope.selectedCards=$scope.selectedCards.concat($scope.leads);
                    
                  $scope.allCardsSelected=true;

               }else{

                $scope.selectedCards=[];
                $scope.allCardsSelected=false;
                
               }
          };
          $scope.editbeforedeleteselection = function(){
            $('#BeforedeleteSelectedLeads').modal('show');
          };
          $scope.deleteSelection = function(){
              angular.forEach($scope.selectedCards, function(selected_lead){

                  var params = {'entityKey':selected_lead.entityKey};
                  Lead.delete($scope, params);

              });             
              $('#BeforedeleteSelectedLeads').modal('hide');
          };
          $scope.selectCardwithCheck=function($event,index,lead){
              var checkbox = $event.target;

               if(checkbox.checked){
                  if ($scope.selectedCards.indexOf(lead) == -1) {             
                    $scope.selectedCards.push(lead);
                  }
               }else{       
                    $scope.selectedCards.splice($scope.selectedCards.indexOf(lead) , 1);
               }

          }
           $scope.filterByName=function(){
              if ($scope.fltby!='name') {
                     $scope.fltby = 'name'; $scope.reverse=false
              }else{
                     $scope.fltby = '-name'; $scope.reverse=false;
              };
          }
           $scope.filterBy=function(text){
              if ($scope.fltby!=text) {
                     $scope.fltby = text; $scope.reverse=false
              }else{
                     $scope.fltby = '-'+text; $scope.reverse=false;
              };
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
                console.log("checked");
                $scope.selected_leads.push(lead);
               console.log($scope.selected_leads);

             }
           }else{
              $scope.selected_leads.splice($scope.selected_leads.indexOf(lead), 1);
               console.log($index);
               console.log("unchecked");
               console.log($scope.selected_leads);
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
            console.log($scope.selected_leads);
           }
      }*/
      $scope.wizard = function(){
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
            onEnd:function(){
                $scope.saveIntercomEvent('completed Tour');
                var userId = document.getElementById("userId").value;

                if (userId){
                    var params = {'id':parseInt(userId),'completed_tour':true};
                    User.completedTour($scope,params);
                }
                console.log("dddezz");
                $('#installChromeExtension').modal("show");
            }
          };
          // Start the tour!
          console.log("beginstr");
          hopscotch.startTour(tour);
      };


      $scope.lead_wizard = function(){
        localStorage['completedTour'] = 'True';
        var tour = {
            id: "hello-hopscotch",
             steps: [
             {
                
                title: "Step 1: Add topics",
                content: "Add Tags to filter your leads.",
                target: "add_tag",
                placement: "left"
              },
             {
                title: "Step 2: Create New lead",
                content: "Click here to create new lead and add detail about it.",
                target: "new_lead",
                placement: "bottom"
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
          console.log("beginstr");
          hopscotch.startTour(tour);
      };
      
      $scope.saveIntercomEvent = function(eventName){
          Intercom('trackEvent', eventName);
      }
      $scope.fromNow = function(fromDate){
          return moment(fromDate,"YYYY-MM-DD HH:mm Z").fromNow();
      }
       $scope.getPosition= function(index){
        if(index<4){

          return index+1;
        }else{

          return (index%4)+1;
        }
     };
        // We need to call this to refresh token when user credentials are invalid
       $scope.refreshToken = function() {
            Auth.refreshToken();
       };
     $scope.listNextPageItems = function(){


        var nextPage = $scope.currentPage + 1;
        var params = {};
          if ($scope.pages[nextPage]){
            params = {'order' : $scope.order,'limit':6,
                      'pageToken':$scope.pages[nextPage]
                     }
          }else{
            params = {'order' : $scope.order,'limit':6}
          }
          console.log('in listNextPageItems');
          $scope.currentPage = $scope.currentPage + 1 ;
          Lead.list($scope,params);
     }
     $scope.listMoreItems = function(){

        var nextPage = $scope.currentPage + 1;
        var params = {};
        console.log(nextPage)
       
      
        if ($scope.pages[nextPage]){
            params = {
                      'limit':20,
                      'order' : $scope.order,
                      'pageToken':$scope.pages[nextPage]
                    }
              console.log('lesting mooooooooooooooooooore')
            $scope.currentPage = $scope.currentPage + 1 ;
            Lead.listMore($scope,params);
        }
      };
      $scope.listview=function(){
       
        $('.leadElement').each(function() {
          $( window ).trigger( 'resize' );
        });
        
      }
     $scope.listPrevPageItems = function(){

       var prevPage = $scope.currentPage - 1;
       var params = {};
          if ($scope.pages[prevPage]){
            params = {'order' : $scope.order,'limit':6,
                      'pageToken':$scope.pages[prevPage]
                     }
          }else{
            params = {'order' : $scope.order,'limit':6}
          }
          $scope.currentPage = $scope.currentPage - 1 ;
          Lead.list($scope,params);
     }
     $scope.showAssigneeTags=function(lead){
        $('#assigneeTagsToLeads').modal('show');
        $scope.currentLead=lead;
     };
     $scope.addTagsTothis=function(){
      var tags=[];
      var items = [];
      tags=$('#select2_sample2').select2("val");
          angular.forEach(tags, function(tag){
            var edge = {
              'start_node': $scope.currentLead.entityKey,
              'end_node': tag,
              'kind':'tags',
              'inverse_edge': 'tagged_on'
            };
            items.push(edge);
          });
      params = {
        'items': items
      }
      console.log(params);
      Edge.insert($scope,params);
      $scope.currentLead=null;
      $('#assigneeTagsToTask').modal('hide');
     };
     $scope.addTagstoLeads=function(){
         var tags=[];
            var items = [];
            tags=$('#select2_sample2').select2("val");
            console.log(tags);
            if ($scope.currentLead!=null) {
              angular.forEach(tags, function(tag){
                       var params = {
                         'parent': $scope.currentLead.entityKey,
                         'tag_key': tag
                      };
                     Tag.attach($scope, params);
                    });
              $scope.currentLead=null;
            }else{
              angular.forEach($scope.selectedCards, function(selected_lead){
                angular.forEach(tags, function(tag){
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
      $scope.showModal = function(){
        $('#addLeadModal').modal('show');

      };


        $scope.showNewTagForm=function(){
          $scope.showNewTag=true;
          $( window ).trigger( 'resize' );
        }
        $scope.hideNewTagForm=function(){
          $scope.showNewTag=false;
          $( window ).trigger( 'resize' );
        }
        $scope.hideTagFilterCard=function(){
          $scope.showTagsFilter=false;
          $( window ).trigger( 'resize' );
        }
        $scope.showTagFilterCard=function(){
          $scope.showTagsFilter=true;
          $( window ).trigger( 'resize' );
        }



// hadji hicham 22-07-2014 . inlinepatch for labels .
  $scope.inlinePatch=function(kind,edge,name,tag,value){
    
        

        if(kind=="tag"){

        params={'id':tag.id,
                'entityKey':tag.entityKey,
                'about_kind':'Lead',
                'name':value
                  };


           Tag.patch($scope,params);
      };



             }



      $scope.save = function(lead){
        var params ={
                      'firstname':lead.firstname,
                      'lastname':lead.lastname,
                      'company':lead.company,
                      'title':lead.title,
                      'source': lead.source,
                      'access': lead.access,
                      'status':$scope.stage_selected.status
                    };
        console.log(params);
        Lead.insert($scope,params);
        $('#addLeadModal').modal('hide')
      };
      $scope.addLeadOnKey = function(lead){
        if(event.keyCode == 13 && lead){
            $scope.save(lead);
        }
      };


     // Quick Filtering
     var searchParams ={};
     $scope.result = undefined;
     $scope.q = undefined;

     $scope.$watch('searchQuery', function() {
         searchParams['q'] = $scope.searchQuery;
         searchParams['limit'] = 7;
         if ($scope.searchQuery){
         Lead.search($scope,searchParams);
       };
     });
     $scope.selectResult = function(){
          window.location.replace('#/leads/show/'+$scope.searchQuery.id);
     };
     $scope.executeSearch = function(searchQuery){
        if (typeof(searchQuery)=='string'){
           var goToSearch = 'type:Lead ' + searchQuery;
           window.location.replace('#/search/'+goToSearch);
        }else{
          window.location.replace('#/leads/show/'+searchQuery.id);
        }
        $scope.searchQuery=' ';
        $scope.apply();
     };
     // Sorting
     $scope.orderBy = function(order){
        var params = { 'order': order,
                        'limit':20};
        $scope.order = order;
        Lead.list($scope,params);
     };
     $scope.filterByOwner = function(filter){
        
        if (filter){
          var params = { 'owner': filter,
                         'order': $scope.order
                       }
        }
        else{
          var params = {
              'order': $scope.order
            }
        };
        Lead.list($scope,params);
     };
     $scope.filterByStatus = function(filter){
        if (filter){
          var params = { 'status': filter,
                         'order': $scope.order
                       }
        }
        else{
          var params = {
              'order': $scope.order
            }
        };
        $scope.isFiltering = true;
        Lead.list($scope,params);
     };


     /***********************************************
      HKA 19.02.2014  tags
***************************************************************************************/
$scope.listTags=function(){
      var paramsTag = {'about_kind':'Lead'}
      Tag.list($scope,paramsTag);
     };

$scope.edgeInserted = function () {
       $scope.listleads();
     };
$scope.listleads = function(){
  var params = { 'order': $scope.order,
                        'limit':20}
          Lead.list($scope,params);
   var paramsTag = {'about_kind':'Lead'};
            Tag.list($scope,paramsTag);
};


$scope.addNewtag = function(tag){
      
       var params = {
                          'name': tag.name,
                          'about_kind':'Lead',
                          'color':tag.color.color
                      }  ;
       Tag.insert($scope,params);
        $scope.tag.name='';
        $scope.tag.color= {'name':'green','color':'#BBE535'};
        var paramsTag = {'about_kind':'Lead'};
        Tag.list($scope,paramsTag);

     }
$scope.updateTag = function(tag){
            params ={ 'id':tag.id,
                      'title': tag.name,
                      'status':tag.color
            };
      Tag.patch($scope,params);
  };
  $scope.deleteTag=function(tag){
          
          params = {
            'entityKey': tag.entityKey
          }
          Tag.delete($scope,params);

      };


$scope.selectTag= function(tag,index,$event){
      
      if(!$scope.manage_tags){
         var element=$($event.target);
         if(element.prop("tagName")!='LI'){
              element=element.parent();
              element=element.parent();
         }
         var text=element.find(".with-color");
         if($scope.selected_tags.indexOf(tag) == -1){
            $scope.selected_tags.push(tag);
            /*element.css('background-color', tag.color+'!important');
            text.css('color',$scope.idealTextColor(tag.color));*/

         }else{
            /*element.css('background-color','#ffffff !important');*/
            $scope.selected_tags.splice($scope.selected_tags.indexOf(tag),1);
             /*text.css('color','#000000');*/
         }
         ;
         $scope.filterByTags($scope.selected_tags);

      }

    };


  $scope.filterByTags = function(selected_tags){
         var tags = [];
         angular.forEach(selected_tags, function(tag){
            tags.push(tag.entityKey);
         });
         var params = {
          'tags': tags,
          'order': $scope.order,
                        'limit':20
         };
         $scope.isFiltering = true;
         Lead.list($scope,params);

  };  

$scope.unselectAllTags= function(){
        $('.tags-list li').each(function(){
            var element=$(this);
            var text=element.find(".with-color");
             element.css('background-color','#ffffff !important');
             text.css('color','#000000');
        });
     };
//HKA 19.02.2014 When delete tag render account list
 $scope.tagDeleted = function(){
    $scope.listleads();
 };



$scope.editbeforedelete = function(lead){
   $scope.selectedCards=[lead];
   $('#BeforedeleteSelectedLeads').modal('show');
 };
 $scope.deletelead = function(){
     var params = {'entityKey':$scope.selectedLead.entityKey};
     Lead.delete($scope,params);
     $('#BeforedeleteLead').modal('hide');
     };
$scope.manage=function(){
        $scope.unselectAllTags();
      };
$scope.tag_save = function(tag){
          if (tag.name) {
             Tag.insert($scope,tag);

           };
      };

$scope.editTag=function(tag,index){
   document.getElementById("tag_"+index).style.backgroundColor="white";
     document.getElementById("closy_"+index).style.display="none";
  document.getElementById("checky_"+index).style.display="none";
       
        $scope.edited_tag=tag;
     }
$scope.hideEditable=function(index,tag){
   document.getElementById("tag_"+index).style.backgroundColor=tag.color;
   document.getElementById("closy_"+index).removeAttribute("style");
  document.getElementById("checky_"+index).style.display="inline";
  
  $scope.edited_tag=null;
}
$scope.doneEditTag=function(tag){
        $scope.edited_tag=null;
        $scope.updateTag(tag);
     }
$scope.addTags=function(){
      var tags=[];
      var items = [];
      tags=$('#select2_sample2').select2("val");

      angular.forEach($scope.selected_tasks, function(selected_task){
          angular.forEach(tags, function(tag){
            var edge = {
              'start_node': selected_task.entityKey,
              'end_node': tag,
              'kind':'tags',
              'inverse_edge': 'tagged_on'
            };
            items.push(edge);
          });
      });

      params = {
        'items': items
      }

      Edge.insert($scope,params);
      $('#assigneeTagsToTask').modal('hide');

     };

    

      $('#addMemberToTask > *').on('click', null, function(e) {
            e.stopPropagation();
        });
      $scope.idealTextColor=function(bgColor){
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
      $scope.dragTag=function(tag){
        
        $scope.draggedTag=tag;
        // $scope.apply();
      };
      $scope.dropTag=function(lead,index){
        
        var items = [];

        var params = {
              'parent': lead.entityKey,
              'tag_key': $scope.draggedTag.entityKey
        };
        $scope.draggedTag=null;
        console.log('**********************************************');
        console.log(params);
        Tag.attach($scope,params,index);

      };
      $scope.tagattached=function(tag,index){
         if (index>=0) {
             if ($scope.leads[index].tags == undefined){
            $scope.leads[index].tags = [];
            }
            var ind = $filter('exists')(tag, $scope.leads[index].tags);
           if (ind == -1) {
                $scope.leads[index].tags.push(tag);
                var card_index = '#card_'+index;
                $(card_index).removeClass('over');
            }else{
                 var card_index = '#card_'+index;
                $(card_index).removeClass('over');
            }

                
           }else{
             if ($scope.selectedCards.length >0) {
              angular.forEach($scope.selectedCards, function(selected_lead){
                console.log(selected_lead);
                  var existstag=false;
                  angular.forEach(selected_lead.tags, function(elementtag){
                      if (elementtag.id==tag.id) {
                         existstag=true;
                      };                       
                  }); 
                  if (!existstag) {
                     if (selected_lead.tags == undefined) {
                        selected_lead.tags = [];
                        }
                     selected_lead.tags.push(tag);
                  };  
            });        
           /* $scope.selectedCards=[];*/
          };
         $scope.apply();
      };
    }

  // HKA 12.03.2014 Pallet color on Tags
      $scope.checkColor=function(color){
        $scope.tag.color=color;
      };  

     

   //HKA 19.06.2014 Detache tag on contact list
      $scope.dropOutTag = function() {

            var params = {'entityKey': $scope.edgekeytoDelete}
            Edge.delete($scope, params);
            $scope.edgekeytoDelete = undefined;
            $scope.showUntag = false;

        }
        $scope.dragTagItem = function(tag,contact) {

            $scope.showUntag = true;
            $scope.edgekeytoDelete = tag.edgeKey;
            $scope.tagtoUnattach = tag;
            $scope.contacttoUnattachTag = contact;
        }
        $scope.tagUnattached = function() {
          console.log("inter to tagDeleted");
            $scope.contacttoUnattachTag.tags.splice($scope.contacttoUnattachTag.tags.indexOf($scope.tagtoUnattach),1)
            $scope.apply()
        };
 $scope.showConvertModal = function(){
        $('#LeadsShow').modal('show');

      };


      $scope.showImportModal = function(){
          $('#importModal').modal('show');
        }




$scope.createPickerUploader = function() {

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
      $scope.uploaderCallback = function(data) {


        if (data.action == google.picker.Action.PICKED) {
                if(data.docs){
                    var params = {
                                  'file_id': data.docs[0].id,
                                  'file_type':$scope.file_type
                                  };
                    Lead.import($scope,params);
                }
        }
      }


$scope.ExportCsvFile=function(){
  $("#TakesFewMinutes").modal('show');
}
$scope.LoadCsvFile=function(){
  var params={}
  Lead.LoadJSONList($scope,params);
}
$scope.DataLoaded=function(data){
        $("#load_btn").removeAttr("disabled");
      $("#close_btn").removeAttr("disabled");
      $scope.isExporting=false;
       $("#TakesFewMinutes").modal('hide');
      $scope.$apply()

  $scope.JSONToCSVConvertor($scope.serializedata(data), "Leads", true);
}


$scope.serializedata=function(data){
for (var i = data.length - 1; i >= 0; i--) {
if(data[i].firstname){data[i].firstname=data[i]["firstname"];}else{data[i]["firstname"]="";}
if(data[i].lastname){data[i].lastname=data[i]["lastname"];}else{data[i]["lastname"]="";}
if(data[i].source){data[i].source=data[i]["source"];}else{data[i]["source"]="";}
if(data[i].company){data[i].company=data[i]["company"];}else{data[i]["company"]="";}
if(data[i].emails){data[i].emails=data[i]["emails"]}else{data[i]["emails"]=new Object();}
if(data[i].phones){data[i].phones=data[i]["phones"]}else{ data[i]["phones"]=new Object();}
if(data[i].addresses){data[i].addresses=data[i]["addresses"]}else{ data[i]["addresses"]=new Object();}
};

 return data;

}
$scope.JSONToCSVConvertor=function(JSONData, ReportTitle, ShowLabel) {

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
        row='firstname,lastname,source,company,emails,phones,addresses';
        row = row.slice(0, -1);
        
        //append Label row with line break
        CSV += row + '\r\n';
    }
    
    //1st loop is to extract each row
    for (var i = 0; i < arrData.length; i++) {

           
        var row = "";
        var phonesCont="";
        var emailsCont="";
        var addressesCont="";
               /***************************************/
            if(arrData[i]["phones"].items){
                    phonesCont=""
              for(var j=0;j< arrData[i]["phones"].items.length;j++){
                      phonesCont +=arrData[i]["phones"].items[j].number+" ";
            }
            

            }
               /**************************************/
             if(arrData[i]["emails"].items){
                    emailsCont=""
              for(var k=0;k< arrData[i]["emails"].items.length;k++){
                      emailsCont +=arrData[i]["emails"].items[k].email+" ";
            }
          

            }
            /*******************************/
            if(arrData[i]["addresses"].items){
                    addressesCont="";
                    
              for(var k=0;k< arrData[i]["addresses"].items.length;k++){
                      addressesPac=""
                      if(arrData[i]["addresses"].items[k].country){
                        addressesPac+= arrData[i]["addresses"].items[k].country+"," ;
                      }
                      if(arrData[i]["addresses"].items[k].city){
                        addressesPac+= arrData[i]["addresses"].items[k].city+"," ;
                      }
                      if(arrData[i]["addresses"].items[k].state){
                        addressesPac+= arrData[i]["addresses"].items[k].state+"," ;
                      }
                      if(arrData[i]["addresses"].items[k].street){
                        addressesPac+= arrData[i]["addresses"].items[k].street+"," ;
                      }
                        if(arrData[i]["addresses"].items[k].postal_code){
                        addressesPac+= arrData[i]["addresses"].items[k].postal_code+"," ;
                      }

   
                      
                      addressesCont +=addressesPac+" ";
            }
          

            }
                
        //2nd loop will extract each column and convert it in string comma-seprated
        row='"'+arrData[i]["firstname"]+'",'+'"'+arrData[i]["lastname"]+'",'+'"'+arrData[i]['source']+'",'+'"'+arrData[i]["company"]+'",'+'"'+emailsCont+'",'+'"'+phonesCont+'",'+'"'+addressesCont+'",';
     
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
    fileName += ReportTitle.replace(/ /g,"_");   
    
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






$scope.checkScrollBar=function(){
  
   var hContent = $("body").height(); 
   var hWindow = $(window).height();


    if(hContent>hWindow) { 
      
        $scope.isbigScreen=false;    
    }else{
       
       $scope.isbigScreen=true;
    }

   $scope.apply();    

}
   // Google+ Authentication
     Auth.init($scope);
     $(window).scroll(function() {
          console.log("scrolling==================",$scope.isLoading,$scope.isFiltering)
          if (!$scope.isLoading && !$scope.isFiltering && ($(window).scrollTop() >  $(document).height() - $(window).height() - 100)) {
              $scope.listMoreItems();
              console.log("jjjjjjjjjjjjjjjjjjjjjjjjjjjjj")
            } 
     });
}]);

app.controller('LeadShowCtrl', ['$scope','$filter','$route','Auth','Email', 'Task','Event','Topic','Note','Lead','Permission','User','Leadstatus','Attachement','Map','InfoNode','Tag','Edge','Opportunitystage','Opportunity','Linkedin',
    function($scope,$filter,$route,Auth,Email,Task,Event,Topic,Note,Lead,Permission,User,Leadstatus,Attachement,Map,InfoNode,Tag,Edge,Opportunitystage,Opportunity,Linkedin) {
      $("ul.page-sidebar-menu li").removeClass("active");
      $("#id_Leads").addClass("active");


      $scope.editLead = function(){
      $('#EditLeadModal').modal('show');
     };

     $scope.isSignedIn = false;
     $scope.immediateFailed = false;
     $scope.isContentLoaded = false;
     $scope.pagination = {};
     $scope.currentPage = 01;
     //HKA 10.12.2013 Var topic to manage Next & Prev
     $scope.topicCurrentPage=01;
     $scope.topicpagination={};
     $scope.topicpages = [];
     $scope.nextPageToken = undefined;
     $scope.prevPageToken = undefined;
     $scope.pages = [];
     $scope.lead = {};
     $scope.status_selected={};
     $scope.ownerSelected={};
     $scope.selected_members=[];
     $scope.selected_member={};
     $scope.users = [];
     $scope.user = undefined;
     $scope.slected_memeber = undefined;
     $scope.isLoading = false;
     $scope.nbLoads=0;
     $scope.email = {};
     $scope.infonodes = {};
     $scope.phone={};
     $scope.collaborators_list=[];
     $scope.ioevent={};
     $scope.phone.type= 'work';
     $scope.documentpagination = {};
     $scope.documentCurrentPage=01;
     $scope.documentpages=[];
     $scope.selectedTab = 2;
     $scope.sharing_with = [];
     $scope.newTaskform=false;
     $scope.newEventform=false;
     $scope.newTask={};
     $scope.ioevent = {};
     $scope.linkedProfile={};
     $scope.twitterProfile={};
     $scope.sendWithAttachments = [];
     $scope.customfields = [];
     $scope.showNewOpp=false;
     $scope.opportunities = [];
     $scope.opppagination = {};
     $scope.oppCurrentPage=01;
     $scope.opppages=[];
     $scope.tab='about'
     $scope.tabtags=[];
     $scope.screen_name=''
     $scope.smallModal=false;
     $scope.showPsychometrics=true;
     $scope.opportunity={access:'public',currency:'USD',duration_unit:'fixed',closed_date:new Date()};
     $scope.imageSrc='/static/img/avatar_contact.jpg';
     $scope.chartOptions = {
        animate:{
            duration:0,
            enabled:false
        },
        size:100,
        barColor:'#58a618',
        scaleColor:'#58a618',
        lineWidth:7,
        lineCap:'circle'
    };
     $scope.emailSentMessage=false;
      $scope.inProcess=function(varBool,message){
          if (varBool) {           
            if (message) {
              console.log("starts of :"+message);
            };
            $scope.nbLoads=$scope.nbLoads+1;
            if ($scope.nbLoads==1) {
              $scope.isLoading=true;
            };
          }else{
            if (message) {
              console.log("ends of :"+message);
            };
            $scope.nbLoads=$scope.nbLoads-1;
            if ($scope.nbLoads==0) {
               $scope.isLoading=false;
 
            };

          };
        }        
        $scope.apply=function(){
         
          if ($scope.$root.$$phase != '$apply' && $scope.$root.$$phase != '$digest') {
               $scope.$apply();
              }
              return false;
        }
     $scope.statuses = [
      {value: 'Home', text: 'Home'},
      {value: 'Work', text: 'Work'},
      {value: 'Mob', text: 'Mob'},
      {value: 'Other', text: 'Other'}
      ];
       $scope.showPage=true;
    $scope.profile_img = {
                          'profile_img_id':null,
                          'profile_img_url':null
                        };
      $scope.addAddressesInMap=function(){
        Map.setLocation($scope, $scope.infonodes.addresses);
      }                   
      $scope.fromNow = function(fromDate){
          return moment(fromDate,"YYYY-MM-DD HH:mm Z").fromNow();
      }
     

     

      $scope.getScreen_name =  function(infonodes) {
        console.log("infonodes__________________",infonodes)
        var sn=''
        var result = $.grep(infonodes.items, function(e){ return e.kind == 'sociallinks'; })

        $scope.screen_name= result[0].items[0].screen_name
        console.log(sn)
      }
      /* prepare url and urlSource function must be added to show social links logos*/ 
      $scope.prepareUrl=function(url){
                    var pattern=/^[a-zA-Z]+:\/\//;
                     if(!pattern.test(url)){                        
                         url = 'http://' + url;
                     }
                     return url;
        }
        $scope.urlSource=function(url){
            var links=["apple","bitbucket","dribbble","dropbox","facebook","flickr","foursquare","github","instagram","linkedin","pinterest","trello","tumblr","twitter","youtube"];
                    var match="";
                    angular.forEach(links, function(link){
                         var matcher = new RegExp(link);
                         var test = matcher.test(url);
                         if(test){  
                             match=link;
                         }
                    });
                    if (match=="") {
                        match='globe';
                    };
                    return match;
        }
      $scope.leadDeleted=function(){
          window.location.replace('#/leads');
      }




   $scope.emailSignature=document.getElementById("signature").value;
  if($scope.emailSignature =="None"){
    $scope.emailSignature="";
  }else{
    $scope.emailSignature="<br/><br/><br/><br/><br/><br/><br/><br/><br/><br/>"+$scope.emailSignature;
  }
document.getElementById("some-textarea1").value=$scope.emailSignature;
  
      $scope.runTheProcess = function(){
            var params = {
                          'id':$route.current.params.leadId,

                          'topics':{
                            'limit': '7'
                          },

                          'documents':{
                            'limit': '15'
                          },

                          'tasks':{

                          },

                          'events':{

                          },
                          'opportunities':{
                            'limit': '15'
                          }
                      };
          Lead.get($scope,params);
          console.log($scope.lead)
          User.list($scope,{});
          Leadstatus.list($scope,{});
          Opportunitystage.list($scope,{'order':'probability'});
          var paramsTag = {'about_kind': 'Lead'};
          Tag.list($scope, paramsTag);
          
          $scope.mapAutocomplete();
          ga('send', 'pageview', '/leads/show');
         window.Intercom('update');

      };

         $scope.isEmptyArray=function(Array){
                if (Array!=undefined && Array.length>0) {
                return false;
                }else{
                    return true;
                };    
            
        }

$scope.DrawPsychometrics=function(){
     try{
       $scope.nodes=$scope.lead.infonodes.items;
       for (var i = $scope.nodes.length - 1; i >= 0; i--) {
           if($scope.nodes[i].kind =="sociallinks"){
          for (var j = $scope.nodes[i].items.length - 1; j >= 0; j--) {
            $scope.Get_twitter_screen_name($scope.nodes[i].items[j].fields[0].value);

          
          };
             
           }
       
       };
     
     }catch(e){
       $scope.showPsychometrics= true;
     }
    
    $scope.$apply();
};
$scope.Get_twitter_screen_name=function(socialLinkurl){
     var linkeType=socialLinkurl.slice(8,15);
     var twitter_screen_name=socialLinkurl.slice(20)
     if(linkeType =="twitter"){
      $scope.showPsychometrics=false;
      $scope.twitterScreenName=twitter_screen_name;
     }

     $scope.$apply();
};
         $('#some-textarea1').wysihtml5();
        $scope.gotosendMail = function(email){
         // document.getElementById("some-textarea").value=$scope.emailSignature;

            $scope.email.to = email;
             $('#testnonefade').modal("show");
            $scope.smallSendMail();
            //  $(".wysihtml5-toolbar").hide();
        }
         $scope.switchwysihtml=function(){
          if ($(".wysihtml5-toolbar").is(":visible")) {

            $(".wysihtml5-toolbar").hide();
            $(".wysihtml5-sandbox").addClass("withoutTools");

          }else{

            $(".wysihtml5-sandbox").removeClass("withoutTools")
            $(".wysihtml5-toolbar").show();

          };  
        }
        $scope.closeEmailModel=function(){
          $(".modal-backdrop").remove();
           $('#testnonefade').hide();

        }
        $scope.switchEmailModal=function(){
          if ($( "#testnonefade" ).hasClass( "emailModalOnBottom" )) {
              $scope.bigSendMail();
              $scope.smallModal=true;
          }else{
               $scope.smallSendMail();
               $scope.smallModal=false;
          };
        }
         $scope.emailSentConfirmation=function(){
            console.log('$scope.email');
            console.log($scope.email);
            $scope.email={};
            $scope.showCC=false;
            $scope.showBCC=false;
            $('#testnonefade').modal("hide");
             $scope.emailSentMessage=true;
             setTimeout(function(){  $scope.emailSentMessage=false; $scope.apply() }, 2000);
        }
        $scope.smallSendMail=function(){
          $(".modal-backdrop").remove();
          $('#testnonefade').addClass("emailModalOnBottom");
        }
        $scope.bigSendMail=function(){
          $('#testnonefade').removeClass("emailModalOnBottom");
          $( "body" ).append( '<div class="modal-backdrop fade in"></div>' );

        }
       $scope.getColaborators=function(){
         $scope.collaborators_list=[];
          Permission.getColaborators($scope,{"entityKey":$scope.lead.entityKey});
          console.log($scope.lead) 


        }
      // We need to call this to refresh token when user credentials are invalid
          $scope.mapAutocomplete=function(){
          //  $scope.addresses = $scope.account.addresses;
            Map.autocomplete ($scope,"pac-input");
        }

      // LBA le 21-10-2014
      $scope.DeleteCollaborator=function(entityKey){
        console.log("delete collaborators")
        var item = {
                      'type':"user",
                      'value':entityKey,
                      'about':$scope.lead.entityKey
                    };
        Permission.delete($scope,item)
        console.log(item)
      };
      $scope.refreshToken = function() {
              Auth.refreshToken();
      };


     
      // HKA 08.05.2014 Delete infonode

  $scope.deleteInfonode = function(entityKey,kind,val){
    var params = {'entityKey':entityKey,'kind':kind};

    InfoNode.delete($scope,params);
    var str=$scope.email.to
    var newstr=str.replace(val+",","");
    $scope.email.to=newstr;

  };


     $scope.TopiclistNextPageItems = function(){


        var nextPage = $scope.topicCurrentPage + 1;
        var params = {};
          if ($scope.topicpages[nextPage]){
            params = {
                      'id':$scope.lead.id,
                        'topics':{
                          'limit': '7',
                          'pageToken':$scope.topicpages[nextPage]
                        }
                     }
            $scope.topicCurrentPage = $scope.topicCurrentPage + 1 ;
            Lead.get($scope,params);
            }

     }
      $scope.addTagsTothis=function(){

              var tags=[];
              var items = [];
              tags=$('#select2_sample2').select2("val");
              console.log(tags);
                  angular.forEach(tags, function(tag){
                    var params = {
                          'parent': $scope.lead.entityKey,
                          'tag_key': tag
                    };
                    Tag.attach($scope,params,-1,'lead');
                  });
                  
          };
          // LA assign tag to related tab elements 26-01-2015
      $scope.showAssigneeTagToTab=function(index){
          $scope.currentIndex=index;
          $('#assigneeTagsToTab').modal('show');
          console.log($scope.currentIndex)
         };
      $scope.addTagsToTab=function(){
            var tags=[];
            var items = [];
            tags=$('#select2_sample3').select2("val");
            switch($scope.tab){
              case 'opportunity':
                angular.forEach(tags, function(tag){
                    var params = {
                          'parent': $scope.opportunities[$scope.currentIndex].entityKey,
                          'tag_key': tag
                      };
                      Tag.attach($scope,params,$scope.currentIndex,$scope.tab);
                  });
              break;
              $scope.currentIndex=null;
          }
          $('#assigneeTagsToTab').modal('hide');
         };
         // LA get tag when cliking on tabs 
      $scope.initTabs=function(tab){
        var paramsTag = {};
        $scope.tab=tab;
               switch(tab) {
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
          $scope.tagattached = function(tag, index,tab) {
            switch(tab){

              case 'lead' :
                if ($scope.lead.tags == undefined) {
                $scope.lead.tags = [];
                }
                var ind = $filter('exists')(tag, $scope.lead.tags);
                if (ind == -1) {
                    $scope.lead.tags.push(tag);
                    
                } else {
                }
                $('#select2_sample2').select2("val", "");
                $scope.apply();
                break;
              case 'case' :
                    if (index>=0) {
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
                    if (index>=0) {
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
         $scope.edgeInserted = function() {
          /* $scope.tags.push()*/
          };
         $scope.removeTag = function(tag,$index) {
            
            var params = {'tag': tag,'index':$index}
            Edge.delete($scope, params);
        }
        $scope.edgeDeleted=function(index){
         $scope.lead.tags.splice(index, 1);
         $scope.apply();
        }

     $scope.listTopics = function(contact){
        var params = {
                      'id':$scope.lead.id,
                      'topics':{
                             'limit': '7'
                       }
                    };
          Lead.get($scope,params);

     };
     $scope.hilightTopic = function(){
        console.log('Should higll');
       $('#topic_0').effect( "bounce", "slow" );
       $('#topic_0.message').effect("highlight","slow");
     }


     $scope.selectMember = function(){
        $scope.slected_memeber = $scope.user;
        $scope.user = '';
        $scope.sharing_with.push($scope.slected_memeber);

     };
      
     $scope.share = function(){
         
       
         var body = {'access':$scope.lead.access};
         var id = $scope.lead.id;
         var params ={'id':id,
                      'access':$scope.lead.access}
         Lead.patch($scope,params);
             // who is the parent of this event .hadji hicham 21-07-2014.

          params["parent"]="lead";
          Event.permission($scope,params);
          Task.permission($scope,params);
     
        
        // $('#sharingSettingsModal').modal('hide');

        if ($scope.sharing_with.length>0){

          var items = [];

          angular.forEach($scope.sharing_with, function(user){
                      var item = {
                                  'type':"user",
                                  'value':user.entityKey
                                };
                     if (item.google_user_id!=$scope.lead.owner.google_user_id) items.push(item);
          });
          console.log("##################################################################")
         console.log($scope.sharing_with)
          if(items.length>0){
              var params = {
                            'about': $scope.lead.entityKey,
                            'items': items
              }
              console.log(params)
              Permission.insert($scope,params);
          }
          
        }
        $scope.sharing_with = [];
     };



      $scope.selectMemberToTask = function() {
            console.log($scope.selected_members);
            if ($scope.selected_members.indexOf($scope.user) == -1) {
                $scope.selected_members.push($scope.user);
                $scope.selected_member = $scope.user;
                $scope.user = $scope.selected_member.google_display_name;
            }
            $scope.user = '';
        };
        $scope.unselectMember = function(index) {
            $scope.selected_members.splice(index, 1);
            console.log($scope.selected_members);
        };
   $scope.deleteEvent =function(eventt){
    var params = {'entityKey':eventt.entityKey};
     Event.delete($scope,params);
     //$('#addLeadModal').modal('show');
   }
   $scope.eventDeleted = function(resp){
   };
  //HKA 09.11.2013 Add a new Task
   $scope.addTask = function(task){
        
        if ($scope.newTaskform==false) {
          $scope.newTaskform=true;
           }else{
            if (task.title!=null) {
                    //  $('#myModal').modal('hide');
            if (task.due){
                console.log('enterrrrr');
                console.log(task);
                var dueDate= $filter('date')(task.due,['yyyy-MM-ddT00:00:00.000000']);
                params ={'title': task.title,
                          'due': dueDate,
                          'parent': $scope.lead.entityKey,
                          'access':$scope.lead.access
                }

            }else{
                params ={'title': task.title,
                         'parent': $scope.lead.entityKey,
                         'access':$scope.lead.access
                       }
            };
            if ($scope.selected_members!=[]) {
                  
                  params.assignees=$scope.selected_members;
                };
                var tags=[];
                tags=$('#select2_sample2').select2("val");
                if (tags!=[]) {
                  
                  var tagitems = [];
                  angular.forEach(tags, function(tag){
                  var item = {'entityKey': tag };
                  tagitems.push(item);
                });
                  params.tags=tagitems;
                };
            Task.insert($scope,params);

            $scope.newTask={};
            $scope.newTaskform=false;
            $scope.selected_members=[];
            $("#select2_sample2").select2("val", "");
        }else{
            $scope.newTask={};
            $scope.newTaskform=false;
      }
     }
   };
  //HKA 27.07.2014 Add button cancel on Task form
       $scope.closeTaskForm=function(newTask){
               $scope.newTask={};
                $scope.newTaskform=false;
    };
   
    $scope.deleteTask = function(task){

       var params = {'entityKey':task.entityKey};

       Task.delete($scope, params);

     };

     // rederection after delete task . hadji hicham 08--07-2014
      $scope.taskDeleted = function(resp){

     };
     $scope.hilightTask = function(){
        console.log('Should higll');
        $('#task_0').effect("highlight","slow");
        $('#task_0').effect( "bounce", "slow" );

     }
     $scope.listTasks = function(){
        var params = {
                        'id':$scope.lead.id,
                        'tasks':{}
                      };
                    
        Lead.get($scope,params);

     }
 //HKA 10.11.2013 Add event
 $scope.addEvent = function(ioevent){



           
           if ($scope.newEventform==false) {
                $scope.newEventform=true;
           }else{


            if (ioevent.title!=null&&ioevent.title!="") {

                    var params ={}


                  // hadji hicham 13-08-2014.
                  if($scope.allday){
                         var ends_at=moment(moment(ioevent.starts_at_allday).format('YYYY-MM-DDT00:00:00.000000'))

                   params ={'title': ioevent.title,
                            'starts_at': $filter('date')(ioevent.starts_at_allday,['yyyy-MM-ddT00:00:00.000000']),
                            'ends_at':ends_at.add('hours',23).add('minute',59).add('second',59).format('YYYY-MM-DDTHH:mm:00.000000'),
                            'where': ioevent.where,
                            'parent':$scope.lead.entityKey,
                            'allday':"true",
                            'access':$scope.lead.access
                      }



                  }else{

                  if (ioevent.starts_at){
                    if (ioevent.ends_at){
                      params ={'title': ioevent.title,
                              'starts_at': $filter('date')(ioevent.starts_at,['yyyy-MM-ddTHH:mm:00.000000']),
                              'ends_at': $filter('date')(ioevent.ends_at,['yyyy-MM-ddTHH:mm:00.000000']),
                              'where': ioevent.where,
                              'parent':$scope.lead.entityKey,
                              'allday':"false",
                              'access':$scope.lead.access
                      }

                    }else{
                      params ={
                        'title': ioevent.title,
                              'starts_at': $filter('date')(ioevent.starts_at,['yyyy-MM-ddTHH:mm:00.000000']),
                              'where': ioevent.where,
                              'parent':$scope.lead.entityKey,
                              'ends_at':moment(ioevent.ends_at).add('hours',2).format('YYYY-MM-DDTHH:mm:00.000000'),
                              'allday':"false",
                              'access':$scope.lead.access
                      }
                    }




                  }


                  }

                   Event.insert($scope,params);
                  $scope.ioevent={};
                  $scope.newEventform=false;



        }
     }
    }

// hadji hicham 14-07-2014 . update the event after we add .
$scope.updateEventRenderAfterAdd= function(){};

    $scope.closeEventForm=function(ioevent){
      $scope.ioevent={};
      $scope.newEventform=false;
    }
    $scope.listEvents = function(){
        var params = {
                        'id':$scope.lead.id,
                        'events':{

                        }
                      };
        Lead.get($scope,params);

     }
     $scope.hilightEvent = function(){
        console.log('Should higll');
        $('#event_0').effect("highlight","slow");
        $('#event_0').effect( "bounce", "slow" );

     }
  //HKA 11.11.2013 Add Note
  $scope.addNote = function(note){
    var params ={
                  'about': $scope.lead.entityKey,
                  'title': note.title,
                  'content': note.content
    };
    Note.insert($scope,params);
    $scope.note.title='';
    $scope.note.content='';
  };
//HKA 27.11.2013 Update Lead
  $scope.updatelead = function(lead){
    
    var params={'id':$scope.lead.id,
                'owner':$scope.ownerSelected.google_user_id,
                'firstname':lead.firstname,
                'lastname':lead.lastname,
                'company':lead.company,
                 'source':lead.source,
                 'industry':lead.industry,
                 'title' : lead.title,
                'status':$scope.status_selected.status};
        Lead.patch($scope,params);
        $('#EditLeadModal').modal('hide')

  };


 $scope.listInfonodes = function(kind) {
     params = {'parent':$scope.lead.entityKey,
               'connections': kind
              };
     InfoNode.list($scope,params);
 }
//HKA 19.11.2013 Add Phone
 $scope.addPhone = function(phone){
  
  if (phone.number){
      params = {'parent':$scope.lead.entityKey,
                'kind':'phones',
                'fields':[
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
      InfoNode.insert($scope,params);
  }
  $scope.phone={};
  $scope.phone.type= 'work';
  $scope.showPhoneForm=false;
  };


//HKA 20.11.2013 Add Email
$scope.addEmail = function(email){

  


if (email.email){
   params = {'parent':$scope.lead.entityKey,
            'kind':'emails',
            'fields':[
                {
                  "field": "email",
                  "value": email.email
                }
            ]
  };
  InfoNode.insert($scope,params);
}
  $scope.email={};
  $scope.email.email=''
  console.log($scope.email)
  $scope.showEmailForm = false;


  };



//HKA 22.11.2013 Add Website
$scope.addWebsite = function(website){

 
if (website.url!=""&&website.url!=undefined){
  params = {'parent':$scope.lead.entityKey,
            'kind':'websites',
            'fields':[
                {
                  "field": "url",
                  "value": website.url
                }
            ]
  };
  InfoNode.insert($scope,params);
}
  $scope.website={};
  $scope.showWebsiteForm=false;
};

//HKA 22.11.2013 Add Social
$scope.addSocial = function(social){
  
  if (social.url!=""&&social.url!=undefined) {
  params = {'parent':$scope.lead.entityKey,
            'kind':'sociallinks',
            'fields':[
                {
                  "field": "url",
                  "value": social.url
                }
            ]
  };
  InfoNode.insert($scope,params);
  $scope.sociallink={};
  $scope.showSociallinkForm=false;
}
};
$scope.addCustomField = function(customField){
  
  if (customField){
   if(customField.field && customField.value){
  params = {'parent':$scope.lead.entityKey,
            'kind':'customfields',
            'fields':[
                {
                  "field": customField.field,
                  "value": customField.value
                }
            ]
  };
  InfoNode.insert($scope,params);
}
}
  $('#customfields').modal('hide');
  $scope.customfield={};
  $scope.showCustomFieldForm = false;

};
//HKA 22.11.2013 Edit tagline of Account
$scope.edittagline = function() {
       $('#EditTagModal').modal('show');
    };
    //HKA Edit Introduction on Account
$scope.editintro = function() {
       $('#EditIntroModal').modal('show');
    };

//HKA 21.06.2014 Update Intro and Tagline
 $scope.updateContactIntroTagline=function(params){
      Lead.patch($scope,params);
     };


      $scope.showConvertModal = function(){
        $('#convertLeadModal').modal('show');

      };
      $scope.convert = function(){
        $('#convertLeadModal').modal('hide');
        var leadid = {'id':$route.current.params.leadId};
        Lead.convert($scope,leadid);
      };
      //$('#some-textarea').wysihtml5();

      $scope.showAttachFilesPicker = function() {
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
      $scope.attachmentUploaderCallback= function(data){
        if (data.action == google.picker.Action.PICKED) {
                

                $.each(data.docs, function(index) {
                    var file = { 'id':data.docs[index].id,
                                  'title':data.docs[index].name,
                                  'mimeType': data.docs[index].mimeType,
                                  'embedLink': data.docs[index].url
                    };
                    $scope.sendWithAttachments.push(file);
                });
                $scope.apply();
        }
      }

      $scope.sendEmail = function(email){
        
        email.body = $('#some-textarea').val();
        var params = {
                  'to': email.to,
                  'cc': email.cc,
                  'bcc': email.bcc,
                  'subject': email.subject,
                  'body': email.body,
                  'about':$scope.lead.entityKey
                  };
        if ($scope.sendWithAttachments){
            params['files']={
                            'parent':$scope.lead.entityKey,
                            'access':$scope.lead.access,
                            'items':$scope.sendWithAttachments
                            };
        };
        
        Email.send($scope,params);
      };
//HKA
  $scope.editbeforedelete = function(){
     $('#BeforedeleteLead').modal('show');
   };
$scope.deletelead = function(){
     var params = {'entityKey':$scope.lead.entityKey};
     Lead.delete($scope,params);
     $('#BeforedeleteLead').modal('hide');
     };
     $scope.DocumentlistNextPageItems = function(){


        var nextPage = $scope.documentCurrentPage + 1;
        var params = {};
          if ($scope.documentpages[nextPage]){
            params = {
                        'id':$scope.lead.id,
                        'documents':{
                          'limit': '15',
                          'pageToken':$scope.documentpages[nextPage]
                        }
                      }
            $scope.documentCurrentPage = $scope.documentCurrentPage + 1 ;

            Lead.get($scope,params);

          }



     }
     $scope.listDocuments = function(){
        var params = {
                        'id':$scope.lead.id,
                        'documents':{
                          'limit': '15'
                        }
                      }
        Lead.get($scope,params);

     };
     $scope.showCreateDocument = function(type){

        $scope.mimeType = type;
        $('#newDocument').modal('show');
     };
     $scope.createDocument = function(newdocument){
        
        var mimeType = 'application/vnd.google-apps.' + $scope.mimeType;
        var params = {
                      'parent': $scope.lead.entityKey,
                      'title':newdocument.title,
                      'mimeType':mimeType
                     };
        Attachement.insert($scope,params);

     };

     $scope.createPickerUploader = function() {
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
      $scope.uploaderCallback = function(data) {
        

        if (data.action == google.picker.Action.PICKED) {
                var params = {
                              'access': $scope.lead.access,
                              'parent':$scope.lead.entityKey
                            };
                params.items = new Array();

                 $.each(data.docs, function(index) {
                      console.log(data.docs);
                      /*
                      {'about_kind':'Account',
                      'about_item': $scope.account.id,
                      'title':newdocument.title,
                      'mimeType':mimeType };
                      */
                      var item = { 'id':data.docs[index].id,
                                  'title':data.docs[index].name,
                                  'mimeType': data.docs[index].mimeType,
                                  'embedLink': data.docs[index].url

                      };
                      params.items.push(item);

                  });
                 Attachement.attachfiles($scope,params);

          }
      }
      $scope.createLogoPickerUploader = function() {
           
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
       $scope.logoUploaderCallback = function(data) {
            
           if (data.action == google.picker.Action.PICKED) {
            
                 if(data.docs){
                   $scope.profile_img.profile_img_id = data.docs[0].id ;
                   $scope.profile_img.profile_img_url = 'https://docs.google.com/uc?id='+data.docs[0].id;
                   $scope.imageSrc = 'https://docs.google.com/uc?id='+data.docs[0].id;
                   $scope.apply();
                   var params ={'id':$scope.lead.id};
                   params['profile_img_id'] = $scope.profile_img.profile_img_id;
                   params['profile_img_url'] = $scope.profile_img.profile_img_url;
                   Lead.patch($scope,params);
                 }
           }
       }
      $scope.renderMaps = function(){
          $scope.addresses = $scope.lead.addresses;
          Map.renderwith($scope);
      };
      $scope.addAddress = function(address){
           //Map.render($scope);
           //renderMaps();
           Map.searchLocation($scope,address);
        //Map.searchLocation($scope,address);

        $('#addressmodal').modal('hide');
        $scope.address={};
      };
      $scope.locationUpdated = function(addressArray){

          var params = {'id':$scope.lead.id,
                         'addresses':addressArray};
          Lead.patch($scope,params);
      };
      $scope.addGeo = function(address){
          params = {'parent':$scope.lead.entityKey,
            'kind':'addresses',
            'fields':[
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
                }
            ]
          };
          if (address.lat){
            console.log("addresses lat exists");
            params = {'parent':$scope.lead.entityKey,
            'kind':'addresses',
            'fields':[
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
                  "field": "lat",
                  "value": address.lat.toString()
                },
                {
                  "field": "lon",
                  "value": address.lng.toString()
                }
              ]
            };
          }
          InfoNode.insert($scope,params);
      };

  // HKA 19.03.2014 inline update infonode
     $scope.inlinePatch=function(kind,edge,name,entityKey,value){
      
       Map.destroy();
      
       //Map.searchLocation($scope,value);
       //Map.searchLocation($scope,address);
   if (kind=='Lead') {
      if (name=='firstname')
        {params = {'id':$scope.lead.id,
             firstname:value};
         Lead.patch($scope,params);};
       if (name=='lastname')
        {params = {'id':$scope.lead.id,
             lastname:value};
         Lead.patch($scope,params);}

   }else{



          params = {
                  'entityKey': entityKey,
                  'parent':$scope.lead.entityKey,
                  'kind':edge,
                  'fields':[

                      {
                        "field": name,
                        "value": value
                      }
                  ]
        };

         InfoNode.patch($scope,params);
   }


  };
    $scope.prepareInfonodes = function(){
        var infonodes = [];

        angular.forEach($scope.customfields, function(customfield){
            var infonode = {
                            'kind':'customfields',
                            'fields':[
                                    {
                                    'field':customfield.field,
                                    'value':customfield.value
                                    }
                            ]

                          }
            infonodes.push(infonode);
        });
        return infonodes;
    };
    $scope.hideNewOppForm=function(){
      $scope.opportunity={};
      $scope.showNewOpp=false;
      $( window ).trigger( 'resize' ); 
     }
    $scope.saveOpp = function(opportunity){

            $scope.isLoading=true;
            opportunity.closed_date = $filter('date')(opportunity.closed_date,['yyyy-MM-dd']);
            opportunity.stage = $scope.initialStage.entityKey;
            opportunity.infonodes = $scope.prepareInfonodes();
            // prepare amount attributes
            if (opportunity.duration_unit=='fixed'){
              opportunity.amount_total = opportunity.amount_per_unit;
              opportunity.opportunity_type = 'fixed_bid';
            }else{
              opportunity.opportunity_type = 'per_' + opportunity.duration;
            }
            opportunity.lead=$scope.lead.entityKey;
            
            Opportunity.insert($scope,opportunity);
            $scope.opportunity={access:'public',currency:'USD',duration_unit:'fixed',closed_date:new Date()};
            $scope.showNewOpp=false;
            $scope.isLoading=false;
        };

            $scope.editbeforedeleteopp = function(opportunity){
                console.log("ssssss");
                 $scope.selectedOpportunity=opportunity;
                 $('#BeforedeleteOpportunity').modal('show');
               };
        $scope.deleteopportunity = function(){
          console.log("delllllll");
         $scope.relatedOpp=true;
         var params = {'entityKey':$scope.opportunities[$scope.selectedOpportunity].entityKey};
         Opportunity.delete($scope, params);
         $('#BeforedeleteOpportunity').modal('hide');
         $scope.selectedOpportunity=null;
       };
          $scope.oppDeleted = function(resp){
               $scope.opportunities.splice($scope.selectedOpportunity, 1);
               $scope.$apply();
               $scope.waterfallTrigger();
         };

    $scope.waterfallTrigger= function(){


          /* $('.waterfall').hide();
         $('.waterfall').show();*/
         $( window ).trigger( "resize" );
         if($(".chart").parent().width()==0){
          var leftMargin=210-$(".chart").width();
                 $(".chart").css( "left",leftMargin/2);
                 $(".oppStage").css( "left",leftMargin/2-2);
         }else{
             var leftMargin=$(".chart").parent().width()-$(".chart").width();
                 $(".chart").css( "left",leftMargin/2);
                 $(".oppStage").css( "left",leftMargin/2-2);

         }
    };

    $scope.listMoreOnScroll = function(){
      switch ($scope.selectedTab)
          {

          case 7:
            $scope.DocumentlistNextPageItems();
            break;
          case 1:
            $scope.TopiclistNextPageItems();
            break;

          }
    };

   $scope.listTags=function(){
      var paramsTag = {'about_kind':'Lead'}
      Tag.list($scope,paramsTag);
     };
  // lendiri arezki 3-8-14
  $scope.getLinkedinProfile=function(){
    
console.log($scope.contact)
      var params={
      "firstname":$scope.lead.firstname,
      "lastname":$scope.lead.lastname
      }
      Linkedin.getContact(params,function(resp){
         if(!resp.code){
             $scope.linkedProfile.fullname=resp.fullname;
           
             $scope.linkedProfile.title=resp.title;
             $scope.linkedProfile.formations=resp.formations
             $scope.linkedProfile.locality=resp.locality;
             $scope.linkedProfile.relation=resp.relation;
             $scope.linkedProfile.industry=resp.industry;
             $scope.linkedProfile.resume=resp.resume;
             $scope.linkedProfile.skills=resp.skills;
             $scope.linkedProfile.current_post=resp.current_post;
             $scope.linkedProfile.past_post=resp.past_post;
             $scope.linkedProfile.certifications=JSON.parse(resp.certifications);
             $scope.linkedProfile.experiences=JSON.parse(resp.experiences);
             $scope.isLoading = false;
             $scope.$apply();
              console.log($scope.linkedProfile);
              console.log(resp)
            }else {
              console.log("no 401");
               if(resp.code==401){
                // $scope.refreshToken();
               console.log("no resp");
                $scope.isLoading = false;
                $scope.$apply();
               };
            }
      });
  }
  $scope.isEmpty=function(obj){
        return jQuery.isEmptyObject(obj);
      }
   $scope.noDetails=function(){
        if (jQuery.isEmptyObject($scope.twitterProfile)&&jQuery.isEmptyObject($scope.linkedProfile)) {
          return true;
        }else{
          return false;
        };
      }
 
 

  $scope.convertToJson=function(string){
    return  JSON.parse(string);
  }
  $scope.checkIfEmpty=function(obj,obj1){
  for(var prop in obj) {
        if(obj.hasOwnProperty(prop))
            return false;
    }
  for(var prop in obj1) {
        if(obj1.hasOwnProperty(prop))
        console.log(prop);
            return false;
    }

    return true;
  }

   // Google+ Authentication
   Auth.init($scope);
   $(window).scroll(function() {
        if (!$scope.isLoading && ($(window).scrollTop() >  $(document).height() - $(window).height() - 100)) {
            
            $scope.listMoreOnScroll();
        }
    });

}]);

app.controller('LeadNewCtrl', ['$scope','Auth','Lead','Leadstatus','Tag','Edge','Map',
    function($scope,Auth,Lead,Leadstatus,Tag,Edge,Map) {
      $("ul.page-sidebar-menu li").removeClass("active");
      $("#id_Leads").addClass("active");

      document.title = "Leads: New";
      $("#id_Leads").addClass("active");
      $scope.isSignedIn = false;
      $scope.immediateFailed = false;
      $scope.nextPageToken = undefined;
      $scope.prevPageToken = undefined;
      $scope.isLoading = false;
      $scope.nbLoads=0;
      $scope.leadpagination = {};
      $scope.currentPage = 01;
      $scope.pages = [];
      $scope.stage_selected={};
      $scope.leads = [];
      $scope.lead = {};
      $scope.lead.access ='public';
      $scope.order = '-updated_at';
      $scope.status = 'New';
      $scope.showPhoneForm=false;
      $scope.showEmailForm=false;
      $scope.showWebsiteForm=false;
      $scope.showSociallinkForm=false;
      $scope.showCustomFieldForm =false;
      $scope.phones=[];
      $scope.addresses=[];
      $scope.infonodes=[];
      $scope.infonodes.addresses=[];
      $scope.emails=[];
      $scope.websites=[];
      $scope.sociallinks=[];
      $scope.customfields=[];
      $scope.phone={};
      $scope.phone.type= 'work';
      $scope.imageSrc = '/static/img/avatar_contact.jpg';
      $scope.profile_img = {
                            'profile_img_id':null,
                            'profile_img_url':null
                          }
      $scope.inProcess=function(varBool,message){
          if (varBool) {           
            if (message) {
              console.log("starts of :"+message);
            };
            $scope.nbLoads=$scope.nbLoads+1;
            if ($scope.nbLoads==1) {
              $scope.isLoading=true;
            };
          }else{
            if (message) {
              console.log("ends of :"+message);
            };
            $scope.nbLoads=$scope.nbLoads-1;
            if ($scope.nbLoads==0) {
               $scope.isLoading=false;
 
            };

          };
        }        
        $scope.apply=function(){
         
          if ($scope.$root.$$phase != '$apply' && $scope.$root.$$phase != '$digest') {
               $scope.$apply();
              }
              return false;
        }
      $scope.createPickerUploader = function() {
          
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

      $scope.uploaderCallback = function(data) {
        
          if (data.action == google.picker.Action.PICKED) {
            
                if(data.docs){
                  $scope.profile_img.profile_img_id = data.docs[0].id ;
                  $scope.profile_img.profile_img_url = data.docs[0].url ;
                  $scope.imageSrc = 'https://docs.google.com/uc?id='+data.docs[0].id;
                  $scope.apply();
                }
          }
      }


      $scope.initObject=function(obj){
          for (var key in obj) {
                obj[key]=null;
              }
      }
      
      $scope.pushElement=function(elem,arr,infos){
        if (elem){
          if (arr.indexOf(elem) == -1) {
           
             switch(infos){
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
                   $scope.showEmailForm=false;
                   $scope.email.email = '';
                break;
                case 'websites' :
                     if (typeof elem !== 'undefined') {
                            if (elem.url!="" && elem!=null) {
                            var copyOfElement = angular.copy(elem);
                            arr.push(copyOfElement);
                            $scope.initObject(elem);
                        }
                        };
                        
                        $scope.website.url = '';
                        $scope.showWebsiteForm = false;
                break;
                case 'sociallinks' :
                   if (typeof elem !== 'undefined') {
                            if (elem.url!="" && elem!=null) {
                                var copyOfElement = angular.copy(elem);
                                arr.push(copyOfElement);
                                $scope.initObject(elem);
                            }
                        }
                   $scope.sociallink.url = '';
                   $scope.showSociallinkForm=false;
                break;
                case 'customfields' :
                   if (elem.field && elem.value) {
                            var copyOfElement = angular.copy(elem);
                            arr.push(copyOfElement);
                            $scope.initObject(elem);
                        }
                        $scope.customfield.field = '';
                        $scope.customfield.value = '';
                        $scope.showCustomFieldForm = false;
                break;
                case 'addresses' :
                      if (elem.country) {
                            var copyOfElement = angular.copy(elem);
                            arr.push(copyOfElement);
                            $scope.initObject(elem);
                        }
                    $('#addressmodal').modal('hide');

                break;
              }
          }else{
            alert("item already exit");
          }
        }
      };

      //HKA 01.06.2014 Delete the infonode on DOM
      $scope.deleteInfos = function(arr,index){
          arr.splice(index, 1);
      }

       $scope.runTheProcess = function(){

          //   Leadstatus.list($scope,{});
          //   var paramsTag = {'about_kind':'Lead'};
          // Tag.list($scope,paramsTag);
          $scope.mapAutocomplete();
          ga('send', 'pageview', '/leads/new');
          window.Intercom('update');


       };



// for google map 
 $scope.mapAutocomplete=function(){
            //$scope.addresses = $scope.account.addresses;
            Map.autocomplete ($scope,"pac-input");
        }
 
     $scope.addGeo = function(address){
         $scope.addresses.push(address);
         $scope.apply();
      };
        $scope.setLocation=function(address){
            Map.setLocation($scope,address);
        }
        $scope.notFoundAddress=function(address,inputId){
            console.log(address.name);
            $scope.addressNotFound=address.name;
            $('#confirmNoGeoAddress').modal('show');
            $scope.apply(); 
            console.log("inputId");
            console.log(inputId);

            $('#'+inputId).val("");           
        }


       $scope.getPosition= function(index){
        if(index<3){

          return index+1;
        }else{
          console.log((index%3)+1);
          return (index%3)+1;
        }
     };
        // We need to call this to refresh token when user credentials are invalid
       $scope.refreshToken = function() {
            Auth.refreshToken();
       };
     $scope.listNextPageItems = function(){


        var nextPage = $scope.currentPage + 1;
        var params = {};
          if ($scope.pages[nextPage]){
            params = {'order' : $scope.order,'limit':6,
                      'pageToken':$scope.pages[nextPage]
                     }
          }else{
            params = {'order' : $scope.order,'limit':6}
          }
          console.log('in listNextPageItems');
          $scope.currentPage = $scope.currentPage + 1 ;
          Lead.list($scope,params);
     }
     $scope.listPrevPageItems = function(){

       var prevPage = $scope.currentPage - 1;
       var params = {};
          if ($scope.pages[prevPage]){
            params = {'order' : $scope.order,'limit':6,
                      'pageToken':$scope.pages[prevPage]
                     }
          }else{
            params = {'order' : $scope.order,'limit':6}
          }
          $scope.currentPage = $scope.currentPage - 1 ;
          Lead.list($scope,params);
     }

      // new Lead
      $scope.showModal = function(){
        $('#addLeadModal').modal('show');

      };


    $scope.prepareInfonodes = function(){
        var infonodes = [];
        angular.forEach($scope.websites, function(website){
            var infonode = {
                            'kind':'websites',
                            'fields':[
                                    {
                                    'field':"url",
                                    'value':website.url
                                    }
                            ]

                          }
            infonodes.push(infonode);
        });
        angular.forEach($scope.sociallinks, function(sociallink){
            var infonode = {
                            'kind':'sociallinks',
                            'fields':[
                                    {
                                    'field':"url",
                                    'value':sociallink.url
                                    }
                            ]

                          }
            infonodes.push(infonode);
        });
        angular.forEach($scope.customfields, function(customfield){
            var infonode = {
                            'kind':'customfields',
                            'fields':[
                                    {
                                    'field':customfield.field,
                                    'value':customfield.value
                                    }
                            ]

                          }
            infonodes.push(infonode);
        });
        angular.forEach($scope.addresses, function(address){
             console.log("iiiiiiiiiiiiiiiiiin foreatch");
             console.log(address);
             var infonode ={
            'kind':'addresses',
            'fields':[
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
                }
              ]
            };
            if (address.lat&&address.lng) {
              infonode.fields.push({"field": "lat","value": address.lat.toString()});
              infonode.fields.push({"field": "lng","value": address.lng.toString()});
            };
            infonodes.push(infonode);
            console.log("infonodes");
            console.log(infonodes);
        });
        return infonodes;
    }
    $scope.leadInserted = function(){
      window.location.replace('/#/leads');
    };
      $scope.save = function(lead){
        if(lead.firstname && lead.lastname){
          var params ={
                        'firstname':lead.firstname,
                        'lastname':lead.lastname,
                        'company':lead.company,
                        'title':lead.title,
                        'tagline':lead.tagline,
                        'introduction':lead.introduction,
                        'phones':$scope.phones,
                        'emails':$scope.emails,
                        'industry':lead.industry,
                        'source':lead.source,
                        'infonodes':$scope.prepareInfonodes(),
                        'access': lead.access
          };
          if ($scope.profile_img.profile_img_id){
              params['profile_img_id'] = $scope.profile_img.profile_img_id;
              params['profile_img_url'] = 'https://docs.google.com/uc?id='+$scope.profile_img.profile_img_id;
          }
          Lead.insert($scope,params);

        }
      };
      $scope.addLeadOnKey = function(lead){
        if(event.keyCode == 13 && lead){
            $scope.save(lead);
        }
      };



     // Quick Filtering
     var searchParams ={};
     $scope.result = undefined;
     $scope.q = undefined;

     $scope.$watch('searchQuery', function() {
         searchParams['q'] = $scope.searchQuery;
         searchParams['limit'] = 7;
         if ($scope.searchQuery){
         Lead.search($scope,searchParams);
       };
     });
     $scope.selectResult = function(){
          window.location.replace('#/leads/show/'+$scope.searchQuery.id);
     };
     $scope.executeSearch = function(searchQuery){
        if (typeof(searchQuery)=='string'){
           var goToSearch = 'type:Lead ' + searchQuery;
           window.location.replace('#/search/'+goToSearch);
        }else{
          window.location.replace('#/leads/show/'+searchQuery.id);
        }
        $scope.searchQuery=' ';
        $scope.apply();
     };
     // Sorting
     $scope.orderBy = function(order){
        var params = { 'order': order,
                        'limit':6};
        $scope.order = order;
        Lead.list($scope,params);
     };
     $scope.filterByOwner = function(filter){
        if (filter){
          var params = { 'owner': filter,
                         'order': $scope.order
                       }
        }
        else{
          var params = {
              'order': $scope.order
            }
        };
        $scope.isFiltering = true;
        Lead.list($scope,params);
     };
     $scope.filterByStatus = function(filter){
        if (filter){
          var params = { 'status': filter,
                         'order': $scope.order,
                         'limit':6}
        }
        else{
          var params = {
              'order': $scope.order,

              'limit':6}
        };
        $scope.isFiltering = true;
        Lead.list($scope,params);
     };


     /***********************************************
      HKA 19.02.2014  tags
***************************************************************************************/
$scope.listTags=function(){
      var paramsTag = {'about_kind':'Lead'}
      Tag.list($scope,paramsTag);
     };

$scope.edgeInserted = function () {
       $scope.listleads();
     };
$scope.listleads = function(){
  var params = { 'order': $scope.order,
                        'limit':6}
          Lead.list($scope,params);


};


$scope.addNewtag = function(tag){
       var params = {
                          'name': tag.name,
                          'about_kind':'Lead',
                          'color':tag.color.color
                      }  ;
       Tag.insert($scope,params);
        $scope.tag.name='';
        $scope.tag.color= {'name':'green','color':'#BBE535'};
        var paramsTag = {'about_kind':'Lead'};
        Tag.list($scope,paramsTag);

     }
$scope.updateTag = function(tag){
            params ={ 'id':tag.id,
                      'title': tag.name,
                      'status':tag.color
            };
      Tag.patch($scope,params);
  };
  $scope.deleteTag=function(tag){
          params = {
            'entityKey': tag.entityKey
          }
          Tag.delete($scope,params);

      };  




$scope.selectTag= function(tag,index,$event){
      if(!$scope.manage_tags){
         var element=$($event.target);
         if(element.prop("tagName")!='LI'){
              element=element.parent();
              element=element.parent();
         }
         var text=element.find(".with-color");
         if($scope.selected_tags.indexOf(tag) == -1){
            $scope.selected_tags.push(tag);
            /*element.css('background-color', tag.color+'!important');
            text.css('color',$scope.idealTextColor(tag.color));*/

         }else{
           /* element.css('background-color','#ffffff !important');*/
            $scope.selected_tags.splice($scope.selected_tags.indexOf(tag),1);
            /* text.css('color','#000000');*/
         };
         $scope.filterByTags($scope.selected_tags);

      }

    };
  $scope.filterByTags = function(selected_tags){
         var tags = [];
         angular.forEach(selected_tags, function(tag){
            tags.push(tag.entityKey);
         });
         var params = {
          'tags': tags,
          'order': $scope.order,
                        'limit':6
         };
         $scope.isFiltering = true;
         Lead.list($scope,params);

  };

$scope.unselectAllTags= function(){
        $('.tags-list li').each(function(){
            var element=$(this);
            var text=element.find(".with-color");
             element.css('background-color','#ffffff !important');
             text.css('color','#000000');
        });
     };
//HKA 19.02.2014 When delete tag render account list
 $scope.tagDeleted = function(){
    $scope.listTags();
    $scope.listleads();

 };


$scope.manage=function(){
        $scope.unselectAllTags();
      };
$scope.tag_save = function(tag){
          if (tag.name) {
             Tag.insert($scope,tag);

           };
      };

$scope.editTag=function(tag){
        $scope.edited_tag=tag;
     }
$scope.doneEditTag=function(tag){
        $scope.edited_tag=null;
        $scope.updateTag(tag);
     }
$scope.addTags=function(){
      var tags=[];
      var items = [];
      tags=$('#select2_sample2').select2("val");

      angular.forEach($scope.selected_tasks, function(selected_task){
          angular.forEach(tags, function(tag){
            var edge = {
              'start_node': selected_task.entityKey,
              'end_node': tag,
              'kind':'tags',
              'inverse_edge': 'tagged_on'
            };
            items.push(edge);
          });
      });

      params = {
        'items': items
      }

      Edge.insert($scope,params);
      $('#assigneeTagsToTask').modal('hide');

     };

     

      $('#addMemberToTask > *').on('click', null, function(e) {
            e.stopPropagation();
        });
      $scope.idealTextColor=function(bgColor){
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
      $scope.dragTag=function(tag){
        $scope.draggedTag=tag;
        $scope.apply();
      };
      $scope.dropTag=function(lead){
        var items = [];

        var edge = {
             'start_node': lead.entityKey,
              'end_node': $scope.draggedTag.entityKey,
              'kind':'tags',
              'inverse_edge': 'tagged_on'
        };
        items.push(edge);
        params = {
          'items': items
        };
                Edge.insert($scope,params);
        $scope.draggedTag=null;
      };
      

  // HKA 12.03.2014 Pallet color on Tags
      $scope.checkColor=function(color){
        $scope.tag.color=color;
      }

   // Google+ Authentication
     Auth.init($scope);


}]);
