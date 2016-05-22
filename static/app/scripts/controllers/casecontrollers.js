app.controller('CaseListCtrl', ['$scope','$filter','Auth','Case','Account','Contact','Casestatus','Tag','Edge','User','Task','Event','Permission',
    function($scope,$filter,Auth,Case,Account,Contact,Casestatus,Tag,Edge,User,Task,Event,Permission) {

     document.title = "Cases: Home";
     $("ul.page-sidebar-menu li").removeClass("active");
     $("#id_Cases").addClass("active");
     trackMixpanelAction('CASE_LIST_VIEW');
     $scope.isSignedIn = false;
     $scope.immediateFailed = false;
     $scope.nextPageToken = undefined;
     $scope.prevPageToken = undefined;
     $scope.isLoading = false; 
     $scope.nbLoads=0;
     $scope.isMoreItemLoading = false;
     $scope.pagination = {};
     $scope.casepagination={};
     $scope.currentPage = 01;
     $scope.pages = [];
     $scope.status_selected={};
     //HKA 11.12.2013 Manage Next & Prev
     $scope.casepagination = {};
     $scope.caseCurrentPage=01;
     $scope.casepages=[];

     $scope.cases = [];
     $scope.casee = {};
     $scope.casee.access ='public';
     $scope.casee.status = 'pending';
     $scope.casee.priority = 4;
     $scope.casee.account_name = undefined;
     $scope.casee.contact_name = undefined;
     $scope.order = '-updated_at';
     $scope.selected_tags = [];
     $scope.draggedTag=null;
     $scope.tag = {};
     $scope.showUntag=false;
     $scope.edgekeytoDelete=undefined;
        $scope.showNewTag=false;
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
      $scope.tag.color= {'name':'green','color':'#BBE535'};
      $scope.selectedCasee=null;
      $scope.currentCasee=null;
      $scope.showTagsFilter=false;
      $scope.showNewTag=false;
      $scope.show="list";
      $scope.selectedCards=[];
      $scope.allCardsSelected=false;   
      $scope.casesfilter='all';
      $scope.casesAssignee=null;
      $scope.selected_access='public';
      $scope.selectedPermisssions=true;
      $scope.sharing_with=[];
      $scope.filterNoResult=false;
      $scope.owner=null;
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
      $scope.caseFilterBy=function(filter,assignee){
            if ($scope.casesfilter!=filter) {
                    switch(filter) {
                    case 'all':
                       $scope.owner=null;
                        var params=$scope.getRequestParams();
                       Case.list($scope,params,true);
                       $scope.casesfilter=filter;
                       $scope.casesAssignee=null;
                        break;
                    case 'my':
                        $scope.owner=assignee;
                        var params=$scope.getRequestParams();
                        Case.list($scope,params,true);
                        $scope.casesAssignee=assignee;
                        $scope.casesfilter=filter;
                        break;
            };
          }
        }
      $scope.inProcess=function(varBool,message){
        
          if (varBool) {
            $scope.nbLoads += 1;
            if ($scope.nbLoads==1) {
              $scope.isLoading=true;
            };
          }else{
            $scope.nbLoads -= 1;
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
      $scope.fromNow = function(fromDate){
          return moment(fromDate,"YYYY-MM-DD HH:mm Z").fromNow();
      }
      // What to do after authentication
       $scope.runTheProcess = function(){
            var params = {'order' : $scope.order,'limit':20}
            Case.list($scope,params);
            Casestatus.list($scope,{});
            User.list($scope,{});
            var paramsTag = {'about_kind':'Case'};
            Tag.list($scope,paramsTag);
              // for (var i=0;i<100;i++)
              // {
              // var poww= Math.floor((Math.random() * 10) + 1);
              //     var addon=Math.pow(10, poww);
              //     var test=addon.toString();
              //     var casee = {
              //               'name':  test + ' Sync',
              //               'access':'public',
              //               'account': 'ahNkZXZ-Z2NkYzIwMTMtaW9ncm93chQLEgdBY2NvdW50GICAgICA4OALDA'
              //             }
              //     Case.insert($scope,casee);
              // }
              ga('send', 'pageview', '/cases');
              /*if (localStorage['caseShow']!=undefined) {
                  $scope.show=localStorage['caseShow'];
              };*/
       };

$scope.selectMember = function(){  
            if ($scope.sharing_with.indexOf($scope.user)==-1) {
                $scope.slected_memeber = $scope.user;

            $scope.sharing_with.push($scope.slected_memeber);
            };
            $scope.user = '';

         };
      $scope.unselectMember = function(index) {
            $scope.selected_members.splice(index, 1);
        };
      $scope.share = function (me) {
            if ($scope.selectedPermisssions) {
                var sharing_with=$.extend(true, [], $scope.sharing_with);
                $scope.sharing_with=[];
                angular.forEach($scope.selectedCards, function (selected_lead) {
                    var id = selected_lead.id;
                    if (selected_lead.owner.google_user_id == me) {
                        var params = {'id': id, 'access': $scope.selected_access};
                        Case.patch($scope, params);
                        // who is the parent of this event .hadji hicham 21-07-2014.

                        params["parent"] = "case";
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
                                Permission.insert($scope, params);
                        }
                    }
                });
            }
        };

      $scope.checkPermissions= function(me){
          $scope.selectedPermisssions=true;
          angular.forEach($scope.selectedCards, function(selected_case){

              if (selected_case.owner.google_user_id!=me) {
                $scope.selectedPermisssions=false;
              };
          });
        }
   $scope.getColaborators=function(){

   };

// HADJI HICHAM -04/02/2015

   $scope.removeTag = function(tag,casee) {
            

            /*var params = {'tag': tag,'index':$index}

            Edge.delete($scope, params);*/
            $scope.dragTagItem(tag,casee);
            $scope.dropOutTag();
        }

/***********************************************************/
       /*$scope.switchShow=function(){
            if ($scope.show=='list') {      

                 $scope.show = 'cards';
                 localStorage['caseShow']="cards";
                 $scope.selectedCards =[];
                 $( window ).trigger( 'resize' ); 


            }else{

              if ($scope.show=='cards') {
                 $scope.show = 'list';
                  localStorage['caseShow']="list";
                  $scope.selectedCards =[];
              }
              
            };
        }*/
         $scope.isSelectedCard = function(casee) {
            return ($scope.selectedCards.indexOf(casee) >= 0);
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
                  $scope.selectedCards=$scope.selectedCards.concat($scope.cases);
                    
                  $scope.allCardsSelected=true;

               }else{

                $scope.selectedCards=[];
                $scope.allCardsSelected=false;
                
               }
          };

          
          $scope.editbeforedeleteselection = function(){
            $('#BeforedeleteSelectedCases').modal('show');
          };
          $scope.deleteSelection = function(){
              angular.forEach($scope.selectedCards, function(selected_case){

                  var params = {'entityKey':selected_case.entityKey};
                  Case.delete($scope, params);

              });             
              $('#BeforedeleteSelectedCases').modal('hide');
          };
          $scope.caseDeleted = function(resp){
            if (!jQuery.isEmptyObject($scope.selectedCasee)) {
                $scope.cases.splice($scope.cases.indexOf($scope.selectedCasee), 1);
            } else {
                var indx=null;
                angular.forEach($scope.selectedCards, function (selected_case) {
                    if (entityKey==selected_case.entityKey) {
                        $scope.cases.splice($scope.cases.indexOf(selected_case), 1);
                        indx=selected_case;
                    }
                });
                $scope.selectedCards.splice($scope.selectedCards.indexOf(indx),1);
                if ($scope.isEmptyArray($scope.selectedCards)) {
                    var params=$scope.getRequestParams();
                    Case.list($scope,params);
                }
                $scope.apply();
            }
          };
          $scope.selectCardwithCheck=function($event,index,casee){

              var checkbox = $event.target;

               if(checkbox.checked){
                  if ($scope.selectedCards.indexOf(casee) == -1) {             
                    $scope.selectedCards.push(casee);
                  }
               }else{       
                    $scope.selectedCards.splice($scope.selectedCards.indexOf(casee) , 1);
               }

          }
           $scope.filterBy=function(text){
              if ($scope.fltby!=text) {
                     $scope.fltby = text; $scope.reverse=false
              }else{
                     $scope.fltby = '-'+text; $scope.reverse=false;
              };
          }
          $scope.getPosition= function(index){
            if(index<4){

              return index+1;
            }else{
              return (index%4)+1;
            }
         };
        $scope.ExportCsvFile = function () {
            if ($scope.selectedCards.length != 0) {
                $scope.msg = "Do you want export  selected cases"

            } else {
                if ($scope.selected_tags.length != 0) {
                    $scope.msg = "Do you want export  cases with the selected tags"

                } else $scope.msg = "Do you want export  all cases"


            }
            $("#TakesFewMinutes").modal('show');
        }
        $scope.LoadCsvFile = function () {
            if ($scope.selectedCards.length != 0) {
                var ids = [];
                angular.forEach($scope.selectedCards, function (selected_case) {
                    ids.push(selected_case.id);
                });
                Case.export_key($scope, {ids: ids});
            } else {
                var tags = [];
                angular.forEach($scope.selected_tags, function (selected_tag) {
                    tags.push(selected_tag.entityKey);
                });
                var params = {"tags": tags};
                Case.export($scope, params);
                $scope.selectedKeyLeads = [];
            }
            $("#TakesFewMinutes").modal('hide');
        }

          $scope.wizard = function(){
        localStorage['completedTour'] = 'True';
        var tour = {
            id: "hello-hopscotch",
             steps: [
              {
                title: "Step 1: Create New case",
                content: "Click here to create new case and add detail about it.",
                target: "new_case",
                placement: "bottom"
              },
             {
                
                title: "Step 2: Add tags",
                content: "Add Tags to filter your cases.",
                target: "add_tag",
                placement: "left"
              }
            
              
            ]
           
          };
          // Start the tour!
          hopscotch.startTour(tour);
      };
         

        // We need to call this to refresh token when user credentials are invalid
       $scope.refreshToken = function() {
            Auth.refreshToken();
       };
      $scope.editbeforedelete = function(casee){
         $scope.selectedCards=[casee];
         $('#BeforedeleteSelectedCases').modal('show');
       };
      $scope.deletecase = function(){
         var params = {'entityKey':$scope.selectedCards[0].entityKey};
         Case.delete($scope, params);
         $('#BeforedeleteSelectedCases').modal('hide');
         $scope.selectedCards=[];
       };
      $scope.showAssigneeTags=function(casee){
            $('#assigneeTagsToCases').modal('show');
            $scope.currentCasee=casee;
         };
        $scope.addTagsTothis=function(){
          var tags=[];
          var items = [];
          tags=$('#select2_sample2').select2("val");
              angular.forEach(tags, function(tag){
                var edge = {
                  'start_node': $scope.currentCasee.entityKey,
                  'end_node': tag,
                  'kind':'tags',
                  'inverse_edge': 'tagged_on'
                };
                items.push(edge);
              });
          params = {
            'items': items
          }
          Edge.insert($scope,params);
          $scope.currentCasee=null;
          $('#assigneeTagsToCases').modal('hide');
         };
          $scope.addTagstoCases=function(){
           var tags=[];
              var items = [];
              tags=$('#select2_sample2').select2("val");
              if ($scope.currentCasee!=null) {
                angular.forEach(tags, function(tag){
                         var params = {
                           'parent': $scope.currentCasee.entityKey,
                           'tag_key': tag
                        };
                       Tag.attach($scope, params);
                       
                      });
                $scope.currentCasee=null;
              }else{
                angular.forEach($scope.selectedCards, function(selected_case){
                  angular.forEach(tags, function(tag){
                    var params = {
                      'parent': selected_case.entityKey,
                      'tag_key': tag
                    };
                     Tag.attach($scope, params);
                  });
              });
              }
              $scope.apply();
              $('#select2_sample2').select2("val", "");
              $('#assigneeTagsToCases').modal('hide');
       }
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
     $scope.listNextPageItems = function(){

        var nextPage = $scope.caseCurrentPage + 1;
        var params = {};
          if ($scope.casepages[nextPage]){
            params = {'order' : $scope.order,'limit':6,
                      'pageToken':$scope.casepages[nextPage]
                     }
          }else{
            params = {'order' : $scope.order,'limit':6}
          }
          $scope.caseCurrentPage += 1 ;
          Case.list($scope,params);
     };
     $scope.listMoreItems = function(){

        var nextPage = $scope.caseCurrentPage + 1;
          if ($scope.casepages[nextPage]){
            var params = $scope.getRequestParams();
            params.pageToken=$scope.casepages[nextPage];
            $scope.caseCurrentPage += 1 ;
            Case.listMore($scope,params);
          }
     }
     $scope.listPrevPageItems = function(){

       var prevPage = $scope.caseCurrentPage - 1;
       var params = {};
          if ($scope.casepages[prevPage]){
            params = {'order' : $scope.order,'limit':6,
                      'pageToken':$scope.casepages[prevPage]
                     }
          }else{
            params = {'order' : $scope.order,'limit':6}
          }
          $scope.caseCurrentPage -= 1 ;
          Case.list($scope,params);
     }



     $scope.showModal = function(){
        $('#addCaseModal').modal('show');

      };


// hadji hicham 23-07-2014 . inlinepatch for labels .
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

    $scope.save = function(casee){

        casee.status = $scope.status_selected.entityKey;
        casee.status_name = $scope.status_selected.status;
        if (typeof(casee.account)=='object'){

          casee.account = $scope.searchAccountQuery.entityKey;

          if (typeof(casee.contact)=='object'){

              casee.contact_name = casee.contact.firstname + ' '+ casee.contact.lastname ;
              casee.contact = casee.contact.entityKey;
          }

          Case.insert($scope,casee);

        }else if($scope.searchAccountQuery.length>0){
            // create a new account with this account name
            var params = {'name': $scope.searchAccountQuery,
                          'access': casee.access
            };
            $scope.casee = casee;
            Account.insert($scope,params);


        };


        $('#addCaseModal').modal('hide');
      };
   $scope.priorityColor=function(pri){
      if (pri<4) {
          return '#BBE535';
      }else{
        if (pri<6) {
             return '#EEEE22';
        }else{
          if (pri<8) {
               return '#FFBB22';
           }else{
               return '#F7846A';
           }
        }
      }
     }
     $scope.getStatusColor=function(status){
        if (status=='open') {
          return '#d84a38';
        };
        if (status=='pendding') {
          return '#FFBB22';
        };
        if (status=='closed') {
            return '#1d943b';
        };
     }
      $scope.addCaseOnKey = function(casee){
        if(event.keyCode == 13 && casee.name){
            $scope.save(casee);
        }
      };
      $scope.accountInserted = function(resp){
          $scope.casee.account = resp;
          $scope.save($scope.casee);
      };

     var params_search_account ={};
     $scope.contactResult = undefined;
     $scope.accountResult = undefined;
     $scope.q = undefined;

      $scope.$watch('searchAccountQuery', function() {
        if($scope.searchAccountQuery){

           params_search_account['q'] = $scope.searchAccountQuery;
           gapi.client.crmengine.accounts.search(params_search_account).execute(function(resp) {

              if (resp.items){
                $scope.accountsResults = resp.items;

                $scope.apply();
              };

            });

        }
      });
      $scope.selectAccount = function(){
        $scope.casee.account = $scope.searchAccountQuery;
        $scope.apply();

     };
     var params_search_contact ={};
     $scope.$watch('searchContactQuery', function() {
      if($scope.searchContactQuery){
        if($scope.searchContactQuery.length>1){
         params_search_contact['q'] = $scope.searchContactQuery;
         gapi.client.crmengine.contacts.search(params_search_contact).execute(function(resp) {

            if (resp.items){
              $scope.contactsResults = resp.items;

              $scope.apply();
            };

          });
         }
      }

      });
     $scope.selectContact = function(){
        $scope.casee.contact = $scope.searchContactQuery;
        if ($scope.searchContactQuery.account!=undefined) {
          var account = {'entityKey':$scope.searchContactQuery.account,
                      'name':$scope.searchContactQuery.account_name};
        $scope.casee.account = account;
        $scope.searchAccountQuery = $scope.searchContactQuery.account_name;
        };
      };
    // Quick Filtering
     var searchParams ={};
     $scope.result = undefined;
     $scope.q = undefined;

     $scope.$watch('searchQuery', function() {
         searchParams['q'] = $scope.searchQuery;
         searchParams['limit'] = 7;
         if ($scope.searchQuery){
         Case.search($scope,searchParams);
       };
     });
     $scope.selectResult = function(){
          window.location.replace('#/cases/show/'+$scope.searchQuery.id);
     };
     $scope.executeSearch = function(searchQuery){
        if (typeof(searchQuery)=='string'){
           var goToSearch = 'type:Case ' + searchQuery;
           window.location.replace('#/search/'+goToSearch);
        }else{
          window.location.replace('#/cases/show/'+searchQuery.id);
        }
        $scope.searchQuery=' ';
        $scope.apply();
     };
     // Sorting
     $scope.orderBy = function(order){
        $scope.order = order;
        var params=$scope.getRequestParams();
        Case.list($scope,params);
     };
     $scope.filterByOwner = function(filter){
        if (filter){
          var params = { 'owner': filter,
                         'order': $scope.order}
        }
        else{
          var params = {
              'order': $scope.order
            }
        };
        $scope.isFiltering = true;
        Case.list($scope,params);
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
        Case.list($scope,params);
     };


    /***********************************************
      HKA 19.02.2014  tags
***************************************************************************************/
$scope.listTags=function(){
      var paramsTag = {'about_kind':'Case'}
      Tag.list($scope,paramsTag);
     };
$scope.edgeInserted = function () {
       $scope.listcases();
     };
$scope.listcases = function(){
  var params = { 'order': $scope.order,
                        'limit':6}
          Case.list($scope,params);
};


$scope.addNewtag = function(tag){
       var params = {
                          'name': tag.name,
                          'about_kind':'Case',
                          'color':tag.color.color
                      }  ;
       Tag.insert($scope,params);
        $scope.tag.name='';
        $scope.tag.color= {'name':'green','color':'#BBE535'};
     }
$scope.tagInserted=function(resp){
              if ($scope.tags==undefined) {
                $scope.tags=[];
            };
            $scope.tags.unshift(resp);
            $scope.apply();
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
         }else{
            $scope.selected_tags.splice($scope.selected_tags.indexOf(tag),1);
         }
         ;
         $scope.filterByTags($scope.selected_tags);

      }

    };
// $scope.selectTag= function(tag,index,$event){
//       if(!$scope.manage_tags){
//          var element=$($event.target);
//          if(element.prop("tagName")!='LI'){
//               element=element.parent();
//               element=element.parent();
//          }
//          var text=element.find(".with-color");
//          if($scope.selected_tags.indexOf(tag) == -1){
//             $scope.selected_tags.push(tag);
//             element.css('background-color', tag.color+'!important');
//             text.css('color',$scope.idealTextColor(tag.color));

//          }else{
//             element.css('background-color','#ffffff !important');
//             $scope.selected_tags.splice($scope.selected_tags.indexOf(tag),1);
//              text.css('color','#000000');
//          }
//          ;
//          $scope.filterByTags($scope.selected_tags);

//       }

//     };
  $scope.filterByTags = function(selected_tags){
         var tags = [];
         angular.forEach(selected_tags, function(tag){
            tags.push(tag.entityKey);
         });
         var params = $scope.getRequestParams();
         $scope.isFiltering = true;
         Case.list($scope,params);

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
    $scope.listcases();

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
     //$scope.hideeverything=true;
    
     }
$scope.hideEditable=function(index,tag){
  document.getElementById("tag_"+index).style.backgroundColor=tag.color;
  document.getElementById("closy_"+index).removeAttribute("style");
  document.getElementById("checky_"+index).style.display="inline";
  //$scope.hideeverything=false;
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

     var handleColorPicker = function () {
          if (!jQuery().colorpicker) {
              return;

          }
          $('.colorpicker-default').colorpicker({
              format: 'hex'
          });
      }
      handleColorPicker();

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
      };
      $scope.dropTag=function(casee,index){
        var items = [];

        var params = {
              'parent': casee.entityKey,
              'tag_key': $scope.draggedTag.entityKey
        };
        $scope.draggedTag=null;
        Tag.attach($scope,params,index);

      };
      $scope.tagattached=function(tag,index){

         if (index>=0) {
             if ($scope.cases[index].tags == undefined){
            $scope.cases[index].tags = [];
            }
            var ind = $filter('exists')(tag, $scope.cases[index].tags);
           if (ind == -1) {
                $scope.cases[index].tags.push(tag);
                var card_index = '#card_'+index;
                $(card_index).removeClass('over');
            }else{
                 var card_index = '#card_'+index;
                $(card_index).removeClass('over');
            }

                
           }else{
             if ($scope.selectedCards.length >0) {
              angular.forEach($scope.selectedCards, function(selected_case){
                  var existstag=false;
                  angular.forEach(selected_case.tags, function(elementtag){

                      if (elementtag.id==tag.id) {
                         existstag=true;
                      };                       
                  }); 
                  if (!existstag) {
                     if (selected_case.tags == undefined) {
                        selected_case.tags = [];
                        }
                     selected_case.tags.push(tag);
                  };  
            });
            /*$scope.selectedCards=[];*/
          };
         $scope.apply();
      };
    }

  // HKA 12.03.2014 Pallet color on Tags
      $scope.checkColor=function(color){
        $scope.tag.color=color;
      };
 //HKA 19.06.2014 Detache tag on contact list
     $scope.dropOutTag=function(){


        var params={'entityKey':$scope.edgekeytoDelete}
        Edge.delete($scope,params);

        $scope.edgekeytoDelete=undefined;
        $scope.showUntag=false;
      };
       $scope.dragTagItem = function(tag,casee) {

            $scope.showUntag = true;
            $scope.edgekeytoDelete = tag.edgeKey;
            $scope.tagtoUnattach = tag;
            $scope.casetoUnattachTag = casee;
        }
        $scope.tagUnattached = function() {
            $scope.casetoUnattachTag.tags.splice($scope.casetoUnattachTag.tags.indexOf($scope.tagtoUnattach),1)
            $scope.apply()
        };
   // Google+ Authentication
     Auth.init($scope);
     $(window).scroll(function() {
          if (!$scope.isLoading && !$scope.isFiltering && ($(window).scrollTop() >  $(document).height() - $(window).height() - 100)) {
              if ($scope.casepagination.next) {
                  $scope.listMoreItems();    
              }
          }
      });


}]);

app.controller('CaseShowCtrl', ['$scope','$filter', '$route','Auth','Case', 'Topic','Note','Task','Event','Permission','User','Casestatus','Email','Attachement','InfoNode','Tag','Edge','Map','Customfield',
    function($scope,$filter,$route,Auth,Case,Topic,Note,Task,Event,Permission,User,Casestatus,Email,Attachement,InfoNode,Tag,Edge,Map,Customfield) {
      $("ul.page-sidebar-menu li").removeClass("active");
      $("#id_Cases").addClass("active");
     trackMixpanelAction('CASE_SHOW_VIEW');
     $scope.selectedTab = 2;
     $scope.isSignedIn = false;
     $scope.immediateFailed = false;
     $scope.nextPageToken = undefined;
     $scope.prevPageToken = undefined;
     $scope.isLoading = false;
     $scope.nbLoads=0;
     $scope.pagination = {};
      //HKA 10.12.2013 Var topic to manage Next & Prev
     $scope.topicCurrentPage=01;
     $scope.topicpagination={};
     $scope.topicpages = [];
     $scope.nextPageToken = undefined;
     $scope.prevPageToken = undefined;
     $scope.status_selected={};
     $scope.currentPage = 01;
     $scope.pages = [];
     $scope.cases = [];
     $scope.users = [];
     $scope.collaborators_list=[];
     $scope.user = undefined;
     $scope.slected_memeber = undefined;
     $scope.email = {};
     $scope.documentpagination = {};
     $scope.documentCurrentPage=01;
     $scope.documentpages=[];
     $scope.infonodes = {};
     $scope.sharing_with = [];
     $scope.customfield={};
     $scope.newTaskform=false;
     $scope.newEventform=false;
     $scope.newTask={};
     $scope.ioevent = {};
     $scope.selected_members=[];
     $scope.selected_member={};
     $scope.showPage=true;
     $scope.ownerSelected={};
     $scope.sendWithAttachments=[];
     $scope.invites=[];
     $scope.allday=false;
     $scope.guest_modify=false;
     $scope.guest_invite=true;
     $scope.guest_list=true;
     $scope.cases=[];
     $scope.casee={
      current_status:{}
     };
     $scope.casee.current_status.name=null;
      $scope.selectedDocs=[];
        $scope.newDoc=true;
        $scope.docInRelatedObject=true;
    $scope.lunchMaps=lunchMaps;
    $scope.lunchMapsLinkedin=lunchMapsLinkedin;


  $scope.timezone=document.getElementById('timezone').value;


       if ($scope.timezone==""){
        $scope.timezone=moment().format("Z");
     }

     $scope.inProcess=function(varBool,message){
          if (varBool) {
            $scope.nbLoads += 1;
            if ($scope.nbLoads==1) {
              $scope.isLoading=true;
            };
          }else{
            $scope.nbLoads -= 1;
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
     $scope.$watch('isLoading', function() 
     {
      console.log($scope.isLoading)
     });
    $scope.fromNow = function(fromDate){
        return moment(fromDate,"YYYY-MM-DD HH:mm Z").fromNow();
    }
   $scope.showAssigneeTagsToCase=function(){
       $('#assigneeTagsToCase').modal('show');
     }
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
        $scope.getStat=function(status){
          if ($scope.casee.current_status==undefined) {
              return 'do';
          };
          if (!$scope.casee.current_status.name) {
            return 'do';
          }else{  
              if ($scope.casee.current_status.name==status.status) {
                return "active";
              };
              if (!$scope.casee.current_status.index) {
                angular.forEach($scope.casesatuses, function (stat) {
                  if (stat.status==$scope.casee.current_status.name) {
                    $scope.casee.current_status.index=$scope.casesatuses.indexOf(stat);
                  };
                });
              };
              if ($scope.casee.current_status.index > $scope.casesatuses.indexOf(status)) {
                return "done"
              }else{
                return "do"
              }
          };
        }
     // What to do after authentication
       $scope.runTheProcess = function(){
          var params = {
                          'id':$route.current.params.caseId,

                          'topics':{
                            'limit': '7'
                          },

                          'documents':{
                            'limit': '15'
                          },

                          'tasks':{

                          },

                          'events':{

                          }
                      };
          Case.get($scope,params);
          User.list($scope,{});
          Casestatus.list($scope,{});
          var paramsTag = {'about_kind': 'Case'};
          Tag.list($scope, paramsTag);
          $( window ).trigger( "resize" );
          ga('send', 'pageview', '/cases/show');
          $scope.mapAutocompleteCalendar();
       };
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
                    additionalCustomFields.push(infonode);
                }else{
                        var schemaExists=false;
                        angular.forEach($scope[related_object].customfields, function (customfield) {
                        if (customfield.id==infonode.property_type) {
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
            angular.forEach($scope.selectedDocs, function (doc) {
                if (doc.entityKey==entityKey) {
                    ind=$scope.selectedDocs.indexOf(doc);
                    listIndex=$scope.documents.indexOf(doc);
                };
            });
            if (ind!=-1) {
                $scope.documents.splice(listIndex,1);
                $scope.selectedDocs.splice(ind,1);
                $scope.apply(); 
                if ($scope.documents.length==0) {
                    $scope.blankStatdocuments=true;
                };
            };
        };
    $scope.docCreated=function(url){
            window.open($scope.prepareEmbedLink(url),'_blank');
        }
    $scope.isSelectedDoc = function (doc) {
            return ($scope.selectedDocs.indexOf(doc) >= 0);
        };
    $scope.selectDocWithCheck=function($event,index,doc){

              var checkbox = $event.target;

               if(checkbox.checked){
                  if ($scope.selectedDocs.indexOf(doc) == -1) {             
                    $scope.selectedDocs.push(doc);
                  }
               }else{       

                    $scope.selectedDocs.splice($scope.selectedDocs.indexOf(doc) , 1);
               }

        }
   $scope.mapAutocompleteCalendar=function(){
            $scope.addresses = {};/*$scope.billing.addresses;*/
            Map.autocompleteCalendar($scope,"pac-input2");
        }


      $scope.addGeoCalendar = function(address){
     
         $scope.ioevent.where=address.formatted
           $scope.locationShosen=true;
         $scope.$apply();
      };


$scope.lunchMapsCalendar=function(){
   
        // var locality=address.formatted || address.street+' '+address.city+' '+address.state+' '+address.country;
         window.open('http://www.google.com/maps/search/'+$scope.ioevent.where,'winname',"width=700,height=550");
    
     }



        // We need to call this to refresh token when user credentials are invalid
       $scope.refreshToken = function() {
            Auth.refreshToken();
       };
       $scope.getColaborators=function(){
           
          Permission.getColaborators($scope,{"entityKey":$scope.casee.entityKey});  
        }
      $scope.deleteInfonode = function (entityKey, kind) {
            var params = {'entityKey': entityKey, 'kind': kind};
            if (params.kind=="customfields") {
                InfoNode.deleteCustom($scope, params);
            }else{
                InfoNode.delete($scope, params);
            };
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
 

    $scope.addTagsTothis=function(){
          var tags=[];
          var items = [];
          tags=$('#select2_sample1').select2("val");
              angular.forEach(tags, function(tag){
                var params = {
                      'parent': $scope.casee.entityKey,
                      'tag_key': tag
                };
                Tag.attach($scope,params);
              });
           $('#assigneeTagsToCase').modal('hide');
           $('#select2_sample1').select2("val", "");
        };
        $scope.addNote = function(note){
          var params ={
                        'about': $scope.casee.entityKey,
                        'title': note.title,
                        'content': note.content
            };
          Note.insert($scope,params);
          $scope.note.title='';
          $scope.note.content='';
        };
        $scope.tagattached = function(tag, index) {
          if ($scope.casee.tags == undefined) {
              $scope.casee.tags = [];
          }
          var ind = $filter('exists')(tag, $scope.casee.tags);
          if (ind == -1) {
              $scope.casee.tags.push(tag);
              
          } else {
          }
          $('#select2_sample2').select2("val", "");
          $scope.apply();
        };
         $scope.edgeInserted = function() {
          /* $scope.tags.push()*/
          };
         $scope.removeTag = function(tag,$index) {
            var params = {'tag': tag,'index':$index}
            Edge.delete($scope, params);
        }
        $scope.edgeDeleted=function(index){
         $scope.casee.tags.splice(index, 1);
         $scope.apply();
        }


    // 
       $scope.isEmptyArray=function(Array){
                return !(Array != undefined && Array.length > 0);;
            
        }
     $scope.TopiclistNextPageItems = function(){


        var nextPage = $scope.topicCurrentPage + 1;
        var params = {};
          if ($scope.topicpages[nextPage]){
            params = {
                      'id':$scope.casee.id,
                        'topics':{
                          'limit': '7',
                          'pageToken':$scope.topicpages[nextPage]
                        }
                     }
            $scope.topicCurrentPage += 1 ;
            Case.get($scope,params);
            }


     }

     $scope.listTopics = function(opportunity){
        var params = {
                      'id':$scope.casee.id,
                      'topics':{
                             'limit': '7'
                       }
                    };
          Case.get($scope,params);

     }
     $scope.listTags=function(){
      var paramsTag = {'about_kind':'Case'}
      Tag.list($scope,paramsTag);
     };
     $scope.hilightTopic = function(){

       $('#topic_0').effect( "bounce", "slow" );
       $('#topic_0 .message').effect("highlight","slow");
     }
     $scope.selectMember = function(){
        $scope.slected_memeber = $scope.user;
        $scope.user = '';
        $scope.sharing_with.push($scope.slected_memeber);

     };
  $scope.share = function(){
           var id = $scope.casee.id;
           var params ={
                        'id':id,
                        'access':$scope.casee.access
                      };
           Case.patch($scope,params);
               // who is the parent of this event .hadji hicham 21-07-2014.

                params["parent"]="case";
                Event.permission($scope,params);
                Task.permission($scope,params);




        if ($scope.sharing_with.length>0){

          var items = [];

          angular.forEach($scope.sharing_with, function(user){
                      var item = {
                                  'type':"user",
                                  'value':user.entityKey
                                };
                      items.push(item);
          });

          if(items.length>0){
              var params = {
                            'about': $scope.casee.entityKey,
                            'items': items
              }
              Permission.insert($scope,params);
          }


          $scope.sharing_with = [];


        }

     };

     $scope.updateCollaborators = function(){

          Case.get($scope,$scope.casee.id);

     };
     $scope.showModal = function(){
        $('#addCaseModal').modal('show');

      };

    $scope.addNote = function(note){
        var params ={
                    'about': $scope.casee.entityKey,
                    'title': note.title,
                    'content': note.content
        };
      Note.insert($scope,params);
      $scope.note.title='';
      $scope.note.content='';
    };




    $scope.editcase = function() {
       $('#EditCaseModal').modal('show');
    }
    $scope.selectMemberToTask = function() {
      if ($scope.selected_members.indexOf($scope.user) == -1) {
          $scope.selected_members.push($scope.user);
          $scope.selected_member = $scope.user;
          $scope.user = $scope.selected_member.google_display_name;
      }
      $scope.user = '';
  };
  $scope.unselectMember = function(index) {
      $scope.selected_members.splice(index, 1);
  };
//HKA 09.11.2013 Add a new Task
   $scope.addTask = function(task){
if ($scope.newTaskform==false) {
          $scope.newTaskform=true;
           }else{
            if (task.title!=null) {
                    //  $('#myModal').modal('hide');
            if (task.due){
                var dueDate= $filter('date')(task.due,['yyyy-MM-ddT00:00:00.000000']);
                params ={'title': task.title,
                          'due': dueDate,
                          'parent': $scope.casee.entityKey,
                          'access':$scope.casee.access
                }

            }else{
                params ={'title': task.title,
                         'parent': $scope.casee.entityKey,
                         'access':$scope.casee.access
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

     $scope.hilightTask = function(){

        $('#task_0').effect("highlight","slow");
        $('#task_0').effect( "bounce", "slow" );

     }
     $scope.listTasks = function(){
        var params = {
                        'id':$scope.casee.id,
                        'tasks':{}
                      };
        Case.get($scope,params);

     }




//*************new form event*******************/
// HADJI HICHAM 31/05/2015 

$scope.showAddEventPopup=function(){  
         $scope.locationShosen=false;
         $('#newEventModalForm').modal('show');
       }

// HADJI HICHAM 31/05/2015
//auto complete
     var invitesparams ={};
     $scope.inviteResults =[];
     $scope.inviteResult = undefined;
     $scope.q = undefined;
     $scope.invite = undefined;
$scope.$watch('invite', function(newValue, oldValue) {
      if($scope.invite!=undefined){
        

           invitesparams['q'] = $scope.invite;
           gapi.client.crmengine.autocomplete(invitesparams).execute(function(resp) {
              if (resp.items){
                $scope.filterInviteResult(resp.items);
                $scope.$apply();
              };

            });
        }

     });



$scope.filterInviteResult=function(items){

      filtredInvitedResult=[];

       for(i in items){
      

        if(items[i].emails!=""){
              var email= items[i].emails.split(" ");
               if(items[i].title==" "){
                items[i].title=items[i].emails.split("@")[0];
               }

              if(email.length>1){
             
              for (var i = email.length - 1; i >= 0; i--) {

               filtredInvitedResult.push({emails:email[i], id: "", rank: "", title:items[i].title, type: "Gcontact"});
              }

              }else{
                filtredInvitedResult.push(items[i]);
              }   
              

                    }
                
       }
        $scope.inviteResults=filtredInvitedResult;
        $scope.$apply();
}

// select invite result 
$scope.selectInviteResult=function(){
        $scope.invite=$scope.invite.emails ;

}


// add invite 
$scope.addInvite=function(invite){


  $scope.invites.push(invite);
  $scope.checkGuests();
  $scope.invite="";
}

$scope.deleteInvite=function(index){
      $scope.invites.splice(index, 1);
      $scope.checkGuests();
}

$scope.checkGuests=function(){
   $scope.Guest_params = $scope.invites.length != 0;
}


/***************reminder**************************/

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
/*******************************************/ 
$scope.timezoneChosen=$scope.timezone;
$('#timeZone').on('change', function() {


     $scope.timezoneChosen=this.value;
});

// $scope.checkallday=function(){
//   $scope.allday=$scope.alldaybox;  
//    }

    
/********************************************/

 $scope.addEvent = function(ioevent){

           // $scope.allday=$scope.alldaybox;  

     


            if (ioevent.title!=null&&ioevent.title!="") {

                    var params ={}


                  // hadji hicham 13-08-2014.
                  if($scope.allday){
                  var ends_at=moment(moment(ioevent.starts_at_allday).format('YYYY-MM-DDT00:00:00.000000'))
             
                       params ={'title': ioevent.title,
                      'starts_at':$filter('date')(ioevent.starts_at_allday,['yyyy-MM-ddT00:00:00.000000']),
                      'ends_at': ends_at.add('hours',23).add('minute',59).add('second',59).format('YYYY-MM-DDTHH:mm:00.000000'),
                      'where': ioevent.where,
                      'allday':"true",
                      'access':$scope.casee.access,
                      'description':$scope.ioevent.note,
                      'invites':$scope.invites,
                      'parent':  $scope.casee.entityKey,
                      'guest_modify':$scope.guest_modify.toString(),
                      'guest_invite':$scope.guest_invite.toString(),
                      'guest_list':$scope.guest_list.toString(),
                      'reminder':$scope.reminder,
                      'method':$scope.method,
                      'timezone':$scope.timezoneChosen

                        }



                  }else{

                  if (ioevent.starts_at){
                    if (ioevent.ends_at){
                      // params ={'title': ioevent.title,
                      //         'starts_at': $filter('date')(ioevent.starts_at,['yyyy-MM-ddTHH:mm:00.000000']),
                      //         'ends_at': $filter('date')(ioevent.ends_at,['yyyy-MM-ddTHH:mm:00.000000']),
                      //         'where': ioevent.where,
                      //         'parent':$scope.lead.entityKey,
                      //         'allday':"false",
                      //         'access':$scope.lead.access
                      // }
                    params ={'title': ioevent.title,
                      'starts_at':$filter('date')(ioevent.starts_at,['yyyy-MM-ddTHH:mm:00.000000']),
                      'ends_at': $filter('date')(ioevent.ends_at,['yyyy-MM-ddTHH:mm:00.000000']),
                      'where': ioevent.where,
                      'allday':"false",
                      'access':$scope.casee.access,
                      'description':$scope.ioevent.note,
                      'invites':$scope.invites,
                      'parent':  $scope.casee.entityKey,
                      'guest_modify':$scope.guest_modify.toString(),
                      'guest_invite':$scope.guest_invite.toString(),
                      'guest_list':$scope.guest_list.toString(),
                      'reminder':$scope.reminder,
                      'method':$scope.method,
                      'timezone':$scope.timezoneChosen

                        }

                    }else{
                      // params ={
                      //   'title': ioevent.title,
                      //         'starts_at': $filter('date')(ioevent.starts_at,['yyyy-MM-ddTHH:mm:00.000000']),
                      //         'where': ioevent.where,
                      //         'parent':$scope.lead.entityKey,
                      //         'ends_at':moment(ioevent.ends_at).add('hours',2).format('YYYY-MM-DDTHH:mm:00.000000'),
                      //         'allday':"false",
                      //         'access':$scope.lead.access
                      // }

                            params ={'title': ioevent.title,
                      'starts_at':$filter('date')(ioevent.starts_at,['yyyy-MM-ddTHH:mm:00.000000']),
                      'ends_at': moment(ioevent.ends_at).add('hours',2).format('YYYY-MM-DDTHH:mm:00.000000'),
                      'where': ioevent.where,
                      'allday':"false",
                      'access':$scope.casee.access,
                      'description':$scope.ioevent.note,
                      'invites':$scope.invites,
                      'parent':  $scope.casee.entityKey,
                      'guest_modify':$scope.guest_modify.toString(),
                      'guest_invite':$scope.guest_invite.toString(),
                      'guest_list':$scope.guest_list.toString(),
                      'reminder':$scope.reminder,
                      'method':$scope.method,
                      'timezone':$scope.timezoneChosen

                        }


                    }




                  }


                  }
     

                  Event.insert($scope,params);
                  $('#newEventModalForm').modal('hide');
                 
                  $scope.ioevent={};
                  $scope.timezonepicker=false;
                  $scope.timezoneChosen=$scope.timezone;
                  $scope.invites=[]
                  $scope.invite="";
                  $scope.remindme_show="";
                  $scope.show_choice="";
                  $scope.parent_related_to="";
                  $scope.Guest_params=false;
                  $scope.searchRelatedQuery="";
                  $scope.something_picked=false;
                  $scope.newEventform=false;
                  $scope.remindmeby=false;
                  $scope.locationShosen=false;
        
     }
    }

//*************************************************/

$scope.cancelAddOperation= function(){
  $scope.timezonepicker=false;
      $scope.start_event="" ;
    $scope.end_event="";
  
        $scope.invites=[]
        $scope.invite="";
        $scope.remindme_show="";
        $scope.show_choice="";
        $scope.parent_related_to="";
        $scope.Guest_params=false;
        $scope.something_picked=false;
        $scope.picked_related=false;
        $scope.ioevent={}
        $scope.locationShosen=false;
}

 // //HKA 10.11.2013 Add event
 // $scope.addEvent = function(ioevent){

 //        if ($scope.newEventform==false) {
 //                $scope.newEventform=true;
 //           }else{


 //            if (ioevent.title!=null&&ioevent.title!="") {

 //                    var params ={}


 //                  // hadji hicham 13-08-2014.
 //                  if($scope.allday){
 //                         var ends_at=moment(moment(ioevent.starts_at_allday).format('YYYY-MM-DDT00:00:00.000000'))

 //                   params ={'title': ioevent.title,
 //                            'starts_at': $filter('date')(ioevent.starts_at_allday,['yyyy-MM-ddT00:00:00.000000']),
 //                            'ends_at':ends_at.add('hours',23).add('minute',59).add('second',59).format('YYYY-MM-DDTHH:mm:00.000000'),
 //                            'where': ioevent.where,
 //                            'parent':$scope.casee.entityKey,
 //                            'allday':"true",
 //                            'access':$scope.casee.access
 //                      }



 //                  }else{

 //                  if (ioevent.starts_at){
 //                    if (ioevent.ends_at){
 //                      params ={'title': ioevent.title,
 //                              'starts_at': $filter('date')(ioevent.starts_at,['yyyy-MM-ddTHH:mm:00.000000']),
 //                              'ends_at': $filter('date')(ioevent.ends_at,['yyyy-MM-ddTHH:mm:00.000000']),
 //                              'where': ioevent.where,
 //                              'parent':$scope.casee.entityKey,
 //                              'allday':"false",
 //                              'access':$scope.casee.access
 //                      }

 //                    }else{
 //                      params ={
 //                        'title': ioevent.title,
 //                              'starts_at': $filter('date')(ioevent.starts_at,['yyyy-MM-ddTHH:mm:00.000000']),
 //                              'where': ioevent.where,
 //                              'parent':$scope.lead.entityKey,
 //                              'ends_at':moment(ioevent.ends_at).add('hours',2).format('YYYY-MM-DDTHH:mm:00.000000'),
 //                              'allday':"false",
 //                              'access':$scope.casee.access
 //                      }
 //                    }




 //                  }


 //                  }

 //                   Event.insert($scope,params);
 //                  $scope.ioevent={};
 //                  $scope.newEventform=false;



 //        }
 //     }

 //    };


// hadji hicham 14-07-2014 . update the event after we add .
$scope.updateEventRenderAfterAdd= function(){};

         $scope.deleteEvent =function(eventt){
    var params = {'entityKey':eventt.entityKey};
     Event.delete($scope,params);
     //$('#addLeadModal').modal('show');
   }
      $scope.eventDeleted = function(resp){
   };
    $scope.closeEventForm=function(ioevent){
      $scope.ioevent={};
      $scope.newEventform=false;
    }
     $scope.hilightEvent = function(){
        $('#event_0').effect("highlight","slow");
        $('#event_0').effect( "bounce", "slow" );

     }
     $scope.listEvents = function(){
        var params = {
                        'id':$scope.casee.id,
                        'events':{

                        }
                      };
        Case.get($scope,params);

     };

//HKA 22.11.2013 Update Case
$scope.updatCasetHeader = function(casee){

  params = {'id':$scope.casee.id,
             'owner':$scope.ownerSelected.google_user_id,
             'name':casee.name,
             'priority' :casee.priority,
             'access':casee.access
             //'status':$scope.casee.current_status.name
           }
  Case.patch($scope,params);
   var params = {
                  'entityKey':$scope.casee.entityKey,
                  'status': casee.current_statusEntityKey  
    };
  Case.update_status($scope,params);
    $('#EditCaseModal').modal('hide');
  };
 $scope.updateCase=function(params){
      Case.patch($scope,params);
  };
 $scope.updateCaseStatus = function(){
    var params = {
                  'entityKey':$scope.casee.entityKey,
                  'status': $scope.casee.current_status.entityKey
    };
    Case.update_status($scope,params);
 }
    
  $('#some-textarea').wysihtml5();

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
                  'about':$scope.casee.entityKey
                  };
        if ($scope.sendWithAttachments){
            params['files']={
                            'parent':$scope.casee.entityKey,
                            'access':$scope.casee.access,
                            'items':$scope.sendWithAttachments
                            };
        };
        
        Email.send($scope,params);
      };


//HKA 29.12.2013 Delet Case
 $scope.editbeforedelete = function(){
     $('#BeforedeleteCase').modal('show');
   };
$scope.deletecase = function(){
     var caseid = {'entityKey':$scope.casee.entityKey};
     Case.delete($scope,caseid);
     $('#BeforedeleteCase').modal('hide');
     };

     $scope.DocumentlistNextPageItems = function(){


        var nextPage = $scope.documentCurrentPage + 1;
        var params = {};
          if ($scope.documentpages[nextPage]){
            params = {
                        'id':$scope.casee.id,
                        'documents':{
                          'limit': '15',
                          'pageToken':$scope.documentpages[nextPage]
                        }
                      }
            $scope.documentCurrentPage += 1 ;

            Case.get($scope,params);

          }


     }

     $scope.listDocuments = function(){
        var params = {
                        'id':$scope.casee.id,
                        'documents':{
                          'limit': '15'
                        }
                      }
        Case.get($scope,params);

     };
     $scope.showCreateDocument = function(type){

        $scope.mimeType = type;
        $('#newDocument').modal('show');
     };
     $scope.createDocument = function(newdocument){
        var mimeType = 'application/vnd.google-apps.' + $scope.mimeType;
        var params = {
                      'parent': $scope.casee.entityKey,
                      'title':newdocument.title,
                      'mimeType':mimeType
                     };
        Attachement.insert($scope,params);

     };
     $scope.createPickerUploader = function() {
          var developerKey = 'AIzaSyDHuaxvm9WSs0nu-FrZhZcmaKzhvLiSczY';
          var projectfolder = $scope.casee.folder;
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
                              'access': $scope.casee.access,
                              'parent':$scope.casee.entityKey
                            };
                params.items = new Array();

                 $.each(data.docs, function(index) {
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
      };

   //01.03.2014 Edit Close date, Type, Description, Source : show Modal

     $scope.editclosedate = function(){
     $('#EditCloseDate').modal('show')
     };
     $scope.editdescription = function(){
     $('#EditDescription').modal('show')
     };
      $scope.edittype = function(){
     $('#EditType').modal('show')
     };
    $scope.editcaseorigin = function(){
     $('#EditOrigin').modal('show')
     };



    $scope.updateDescription = function(casem){
      params = {'id':$scope.casee.id,
              'description':casee.description};
      Case.patch($scope,params);
      $('#EditDescription').modal('hide');
     };
    $scope.updateType = function(casem){
      params = {'id':$scope.casee.id,
              'type_case':casem.type_case};
      Case.patch($scope,params);
      $('#EditType').modal('hide');
     };
     $scope.updatcaseorigin= function(casem){
      params = {'id':$scope.casee.id,
              'case_origin':casem.case_origin};
      Case.patch($scope,params);
      $('#EditOrigin').modal('hide');
     };
      $scope.updateClosedate= function(casem){
      var close_at = $filter('date')(casem.closed_date,['yyyy-MM-ddTHH:mm:00.000000']);
      params = {'id':$scope.casee.id,
              'closed_date':close_at};
      Case.patch($scope,params);
      $('#EditCloseDate').modal('hide');
     };


//HKA 11.03.2014 Add Custom field

    $scope.addCustomField = function (customField,option) {
               
               
            if (customField) {
                if (customField.infonode_key) {
                    
                    $scope.inlinePatch('Infonode','customfields', customField.name,customField.infonode_key,customField.value)
                }else{
                    
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
                            'parent': $scope.casee.entityKey,
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

$scope.listInfonodes = function(kind) {
     params = {
               'parent':$scope.casee.entityKey,
               'connections': kind
              };

     InfoNode.list($scope,params);

 };

 // HKA 19.03.2014 inline update infonode
     $scope.inlinePatch=function(kind,edge,name,entityKey,value){
        if (kind == 'Case') {
              var params={};
                switch(name){
                  case "name": 
                  params.name=value;  
                  break;
                  case "owner":
                  params.owner=value; 
                  break;
                  case "access":
                  params.access=value; 
                  break;
                }
                if (!jQuery.isEmptyObject(params)) {
                  params.id=entityKey;
                  Case.patch($scope, params);
                }                
            } 
       };

  // HKA 26.05.2014 return URL topic
  $scope.getTopicUrl = function(type,id){
      return Topic.getUrl(type,id);
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
    // LBA 27-10-2014
    $scope.DeleteCollaborator=function(entityKey){
            var item = {
                          'type':"user",
                          'value':entityKey,
                          'about':$scope.casee.entityKey
                        };
            Permission.delete($scope,item)
        };
    // Google+ Authentication
    Auth.init($scope);
    $(window).scroll(function() {
         if (!$scope.isLoading && ($(window).scrollTop() >  $(document).height() - $(window).height() - 100)) {
             $scope.listMoreOnScroll();
         }
     });
}]);

app.controller('CaseNewCtrl', ['$scope','$http','Auth','Casestatus','Case', 'Account','Contact','Edge','Customfield',
    function($scope,$http,Auth,Casestatus,Case,Account,Contact,Edge, Customfield) {
      document.title = "Cases: Home";
      $("ul.page-sidebar-menu li").removeClass("active");
      $("#id_Cases").addClass("active");
      trackMixpanelAction('CASE_NEW_VIEW');
      $scope.isSignedIn = false;
      $scope.immediateFailed = false;
      $scope.nextPageToken = undefined;
      $scope.prevPageToken = undefined;
      $scope.isLoading = false;
      $scope.nbLoads=0;
      $scope.pagination = {};
      $scope.currentPage = 01;
      $scope.pages = [];
      $scope.stage_selected={};
      $scope.contacts = [];
      $scope.casee = {};
      $scope.order = '-updated_at';
      $scope.showPhoneForm=false;
      $scope.showEmailForm=false;
      $scope.showWebsiteForm=false;
      $scope.showSociallinkForm=false;
      $scope.showCustomFieldForm =false;
      $scope.phones=[];
      $scope.addresses=[];
      $scope.emails=[];
      $scope.websites=[];
      $scope.sociallinks=[];
      $scope.customfields=[];
      $scope.results=[];
      $scope.imageSrc = '/static/src/img/default_company.png';
      $scope.casee = {
                      'access': 'public',
                      'priority':4
                    };
     $scope.case_err={
                      'name':false,
                      'account':false,
                      'contact':false,
                      };
      $scope.cases=[];
      $scope.cases.customfields=[];
      $scope.lunchMaps=lunchMaps;
      $scope.lunchMapsLinkedin=lunchMapsLinkedin;  
      $scope.newnote={};
      $scope.casee.notes=[];
      $scope.casee.account="";
      $scope.casee.contact="";
      $scope.clearCase=function(){
              $scope.casee={};
              $scope.status_selected={};
              $scope.customfields=[];
              $scope.searchContactQuery="";
              $scope.searchAccountQuery="";
              angular.forEach($scope.cases.customfields, function (cusfield) {
                    cusfield.value="";
                });
              $scope.apply();
            }
      $scope.inProcess=function(varBool,message){
          if (varBool) {
            $scope.nbLoads += 1;
            if ($scope.nbLoads==1) {
              $scope.isLoading=true;
            };
          }else{
            $scope.nbLoads -= 1;
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
      $scope.status_selected={};
      $scope.initObject=function(obj){
          for (var key in obj) {
                obj[key]=null;
              }
      }
      $scope.pushElement=function(elem,arr){
          if (arr.indexOf(elem) == -1) {
            if (elem.field && elem.value) {
              var copyOfElement = angular.copy(elem);
              arr.push(copyOfElement);
              $scope.initObject(elem);}

          }else{
            alert("item already exit");
          }
      }
      $scope.runTheProcess = function(){
          $scope.getCustomFields("cases");
          Casestatus.list($scope,{});
          ga('send', 'pageview', '/cases/new');
      };
       $scope.getCustomFields=function(related_object){
            Customfield.list($scope,{related_object:related_object});
        }
        $scope.listResponse=function(items,related_object){
            $scope[related_object].customfields=items;
            $scope.apply(); 
        }
        $scope.isEmptyArray=function(Array){
                return !(Array != undefined && Array.length > 0);;
            
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

                    }
            }
        };
        // We need to call this to refresh token when user credentials are invalid
       $scope.refreshToken = function() {
            Auth.refreshToken();
       };

       $scope.accountInserted = function(resp){
          $scope.contact.account = resp;
          $scope.save($scope.contact);
      };
       $scope.getResults=function(val,location){
          var url=ROOT+location+'?alt=json'
          var config={
            headers:  {
                'Authorization': 'Bearer '+localStorage['access_token'],
                'Accept': 'application/json'
            }
          }
          var params= {
                    "q": val
                  } ;
         return $http.post(url,params,config).then(function(response){
                  if (response.data.items) {
                    return response.data.items;
                  }else{
                    return [];
                  };
                  return response.data.items;
                });
      }
       // var params_search_account ={};
       // $scope.result = undefined;
       // $scope.q = undefined;
       // $scope.$watch('searchAccountQuery', function() {
       //     params_search_account['q'] = $scope.searchAccountQuery;
       //     Account.search($scope,params_search_account);

       //  });
      $scope.changeStatus=function(status){
          $scope.status_selected=status;
      }
      $scope.selectAccount = function(){
          $scope.contact.account = $scope.searchAccountQuery;

       };
       $scope.accountInserted = function(resp){
          $scope.contact.account = resp;
        //  $scope.save($scope.contact);
      };
      // var params_search_contact ={};
      // $scope.$watch('searchContactQuery', function() {
      //   if($scope.searchContactQuery){
      //       if($scope.searchContactQuery.length>1){
      //         params_search_contact['q'] = $scope.searchContactQuery;
      //         gapi.client.crmengine.contacts.search(params_search_contact).execute(function(resp) {
      //           if (resp.items){
      //           $scope.contactsResults = resp.items;
      //           $scope.apply();
      //         };
      //       });
      //     }
      //   }
      // });
     $scope.selectContact = function(){
        if ($scope.searchContactQuery.account!=undefined) {
           var account = {'entityKey':$scope.searchContactQuery.account.entityKey,
                      'name':$scope.searchContactQuery.account.name};
            $scope.casee.account = account.entityKey;
            $scope.searchAccountQuery = $scope.searchContactQuery.account.name;
            };
            $scope.casee.contact = $scope.searchContactQuery.entityKey;     
       
      };
      $scope.selectAccount = function(){
          $scope.casee.account  = $scope.searchAccountQuery;
      };
      $scope.addNote = function(){
       $scope.casee.notes.push($scope.newnote)
       $scope.newnote={};
     }
      $scope.prepareInfonodes = function(){
        var infonodes = [];
        angular.forEach($scope.customfields, function(customfield){
            var infonode = {
                            'kind':'customfields',
                            'fields':[
                                    {
                                    'field':customfield.field,
                                    'property_type':customfield.property_type,
                                    'value':customfield.value
                                    }
                            ]

                          };
            infonodes.push(infonode);
        });
        return infonodes;
    }; 
    $scope.save = function(casee){
          casee.account = casee.account||$scope.searchAccountQuery;
          casee.contact = casee.contact||$scope.searchContactQuery;
          if (casee.account||casee.contact) {
            casee.status = $scope.status_selected.entityKey;
            casee.infonodes = $scope.prepareInfonodes();
            Case.insert($scope,casee);
          }
     
     }
      $scope.$watch('casee', function(newVal, oldVal){
          if (newVal.name)  $scope.case_err.name=false;
      }, true); 
      $scope.$watch('searchAccountQuery', function(newVal, oldVal){
          if (newVal )$scope.case_err.account =false;
      });   
      $scope.$watch('searchContactQuery', function(newVal, oldVal){
          if (newVal )$scope.case_err.contact =false;
      });
      
      $scope.validateBeforeSave=function(casee){
          $scope.case_err.name=$scope.case_err.account=$scope.case_err.contact=false;
          if (!casee.name) $scope.case_err.name=true;  
          if (!$scope.searchAccountQuery) $scope.case_err.account=true;
          if (!$scope.searchContactQuery) $scope.case_err.contact=true;
          if (!$scope.case_err.name && (!$scope.case_err.account || !$scope.case_err.contact)) $scope.save(casee);
      }
      $scope.caseInserted = function(resp){
         window.location.replace('#/cases');
      }






   // Google+ Authentication
     Auth.init($scope);
}]);
