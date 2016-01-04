app.controller('OpportunityListCtrl', ['$scope','$filter','Auth','Account','Opportunity','Opportunitystage','Search','Tag','Edge','User','Event','Task','Permission',
  function($scope,$filter,Auth,Account,Opportunity,Opportunitystage,Search,Tag,Edge,User,Event,Task,Permission) {
     $("ul.page-sidebar-menu li").removeClass("active");
     $("#id_Opportunities").addClass("active");
     document.title = "Opportunities: Home";
     trackMixpanelAction('OPPORTUNITY_LIST_VIEW');
     $scope.isSignedIn = false;
     $scope.immediateFailed = false;
     $scope.nextPageToken = undefined;
     $scope.prevPageToken = undefined;
     $scope.isLoading = false;
     $scope.nbLoads=0;
     $scope.isMoreItemLoading = false;
     $scope.pagination = {};
     $scope.currentPage = 01;
     $scope.pages = [];
     //HKA 11.12.2013 var Opportunity to manage Next & Prev
     $scope.opppagination = {};
     $scope.oppCurrentPage=01;
     $scope.opppages=[];

     $scope.opportunities = [];
     $scope.stage_selected={};
     $scope.opportunity = {
      'currency':'USD',
      'price_type':'fixed'
     };
     $scope.opportunity.access ='public';
     $scope.order = '-updated_at';
     $scope.selected_tags = [];
     $scope.draggedTag = null;
     $scope.showNewTag=false;
     $scope.tag = {};
     $scope.tags=[];
     $scope.showUntag=false;
     $scope.edgekeytoDelete=undefined;
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
     $scope.selectedOpportunity=null;
     $scope.currentOpportunity=null;
     $scope.showTagsFilter=false;
     $scope.showNewTag=false;
     $scope.percent = 0;
     $scope.show="cards";
     $scope.selectedCards=[];
     $scope.allCardsSelected=false;           
     $scope.chartOptions = {
         animate:{
             duration:0,
             enabled:false
         },
         size:100,
         barColor:'#58a618',
         scaleColor:false,
         lineWidth:7,
         lineCap:'circle'
     };
     $scope.inFinalStages=false;
     $scope.finalStageName=null;
     $scope.chartOptionsOnList = {
         animate:{
             duration:0,
             enabled:false
         },
         size:55,
         barColor:'#58a618',
         scaleColor:false,
         lineWidth:3,
         lineCap:'square'
     };
     $scope.opportunitiesfilter='all';
     $scope.opportunitiesAssignee=null;
     $scope.selected_access='public';
     $scope.selectedPermisssions=true;
     $scope.sharing_with=[];
     $scope.opportunitystages=[];
      $scope.oppStagesOrigin = [];
     $scope.opportunityToChage={};
     $scope.stageToChage={};
     $scope.opportunitiesbysatges=[];
     $scope.stageFrom={};
     $scope.currentFilters = {
          tags: $scope.selected_tags,
          owner: 'all',
          orderBy: 'name'
      };
       $scope.isEmptyArray=function(Array){
                if (Array!=undefined && Array.length>0) {
                return false;
                }else{
                    return true;
                };    
            
        }

          /*angular.forEach($scope.opportunitiesbysatges, function(opp){
                        if (opp.entityKey==$scope.opportunityToChage.entityKey) {
                          opp.current_stage=$scope.stageToChage;
                          $scope.apply();
                        };
                      });*/

      $scope.isStage = function(stage) {
        if (stage.probability == 0 || stage.probability == 100) {
          return false;
        }
        return true;
      };
      $scope.ExportCsvFile = function () {
            if ($scope.selectedCards.length != 0) {
                $scope.msg = "Do you want export  selected opportunities"

            } else {
                if ($scope.selected_tags.length != 0) {
                    $scope.msg = "Do you want export  opportunities with the selected tags"

                } else $scope.msg = "Do you want export  all opportunities"


            }
            $("#TakesFewMinutes").modal('show');
        }
      $scope.LoadCsvFile = function () {
            console.log("exporting", $scope.selectedCards.length);
            if ($scope.selectedCards.length != 0) {
                var ids = [];
                angular.forEach($scope.selectedCards, function (selected_oppo) {
                    ids.push(selected_oppo.id);
                });
                Opportunity.export_key($scope, {ids: ids});
            } else {
                var tags = [];
                angular.forEach($scope.selected_tags, function (selected_tag) {
                    tags.push(selected_tag.entityKey);
                });
                var params = {"tags": tags};
                console.log(params);
                Opportunity.export($scope, params);
                $scope.selectedKeyLeads = [];
            }
            $("#TakesFewMinutes").modal('hide');
        }
      $scope.getOpportunitiesForStage = function(opps,stage) {
          $scope.stageToChage=stage;
          var result=[];
                 angular.forEach(opps, function(opp){
                        if (opp.current_stage.name==stage) {
                          result.push(opp);
                        };
                      });
          return result;
      }; 
      $scope.inThisStage= function(stage) {
          return function(opportunity) {
              return opportunity.current_stage.name == stage.name;
          };
      };
      $scope.selectedOpp=function(opportunity,stage){
          if ($scope.selectedCards.indexOf(opportunity) < 0) {
             $scope.stageFrom=stage;
          }else{
        
          }
          $scope.opportunityToChage=opportunity;
      };
     $scope.updateOpportunityStage = function(stage){
          $scope.stageTo=stage;
          if (stage.stage.entityKey) {
              if ($scope.selectedCards.indexOf($scope.opportunityToChage) >= 0) {
                  angular.forEach($scope.selectedCards, function(opportunitCard){
                          var params = {
                          'entityKey':opportunitCard.entityKey,
                          'stage': stage.stage.entityKey
                          };
                          Opportunity.update_stage($scope,params);
                  });
              }else{
                 var params = {
                        'entityKey':$scope.opportunityToChage.entityKey,
                        'stage': stage.stage.entityKey
                  };
                  Opportunity.update_stage($scope,params);
              }
          }
       };
       $scope.stageUpdated=function(resp){

          if (!jQuery.isEmptyObject($scope.stageFrom)) {

            $scope.stageFrom.items.splice($scope.stageFrom.items.indexOf($scope.opportunityToChage) , 1);
            if ($scope.stageTo.items==undefined) {
             $scope.stageTo.items=[]; 
            }
            $scope.stageTo.items.push($scope.opportunityToChage);
            $scope.apply();
            $scope.stageFrom=[];
          }else{
            console.log("in no from stage defined");
            $scope.oppTochange={};
            angular.forEach($scope.selectedCards, function(opp){
              if (opp.entityKey==resp.entityKey) {
                $scope.oppTochange=opp;
              }
            });
            if (!jQuery.isEmptyObject($scope.oppTochange)) {
              console.log("in not isEmptyObject")
              console.log("stageTo");
              console.log($scope.stageTo);
              angular.forEach($scope.opportunitiesbysatges, function(stag){
                if (stag.items!=undefined) {
                  if (stag.items.indexOf($scope.oppTochange) >= 0) {
                    console.log("found in the stage");
                  stag.items.splice(stag.items.indexOf($scope.oppTochange) , 1);
                  }
                  if (!jQuery.isEmptyObject($scope.stageTo)) {
                      console.log("pushed to next stage");
                      if ( $scope.stageTo.items.indexOf($scope.oppTochange) < 0) {
                          $scope.stageTo.items.push($scope.oppTochange);
                          $scope.apply();
                      };
                      
                  };
                }
              });
              $scope.selectedCards.splice($scope.selectedCards.indexOf($scope.oppTochange) , 1);
              if ($scope.isEmptyArray($scope.selectedCards)) {
                $scope.stageTo={};
              }
            }
      }
     }
      $scope.updateStageOpps=function(stage){
        if (!$scope.isEmptyArray($scope.selectedCards)) {
            $scope.stageTo=stage;
            if (stage.stage.entityKey) {

                angular.forEach($scope.selectedCards, function(selected_opportunity){
                    var params = {
                              'entityKey':selected_opportunity.entityKey,
                              'stage': stage.stage.entityKey
                    };
                    console.log(params);
                    Opportunity.update_stage($scope,params);
                }); 

            };
            $scope.inFinalStages=false;
            $scope.finalStageName=null;
        }else{
          if (stage.stage.probability==100 && $scope.closewonstage.items!=undefined) {
            console.log("in closewonstage");
            $scope.opportunities=$scope.closewonstage.items;
            $scope.finalStageName="won";              
          }else{

            if (stage.stage.probability==0 && $scope.closeloststage.items!=undefined) {
              console.log("in closeloststage");
              $scope.opportunities=$scope.closeloststage.items;  
              $scope.finalStageName="lost";
            };
          };
          $scope.inFinalStages=true;
        };      
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
      $scope.fromNow = function(fromDate){
          return moment(fromDate,"YYYY-MM-DD HH:mm Z").fromNow();
      }

      // What to do after authentication
       $scope.runTheProcess = function(){
          var params = {};
          Opportunity.list2($scope,params,function(resp){
                if(!resp.code){
                  if (!resp.items){
                    if(!$scope.isFiltering){
                        $scope.blankStateopportunity = true;
                    }
                  }
                 $scope.opportunitiesbysatges = [];
                 $scope.oppStagesOrigin = [];
                 $scope.closestages=[];
                 $scope.closewonstage={};
                 $scope.closeloststage={};
                 console.log("stages");
                 console.log(resp.items);
                 angular.forEach(resp.items, function(item){
                      console.log("check opportunities =========");
                      console.log(item.items);
                      if (item.items!=undefined) {
                         $scope.opportunities=$scope.opportunities.concat(item.items);
                      };
                      console.log($scope.opportunities);
                      if (item.stage.probability==0 || item.stage.probability== 100) {
                        $scope.closestages.push(item);
                        if (item.stage.probability==100) {
                            $scope.closewonstage=item;
                            console.log("$scope.closewonstage");
                            console.log($scope.closewonstage);
                        }else{
                            $scope.closeloststage=item;
                            console.log("$scope.closeloststage");
                            console.log($scope.closeloststage);
                        };
                      }else{
                        $scope.opportunitiesbysatges.push(item);
                          $scope.oppStagesOrigin.push(item);
                      };
                  });
                 console.log('$scope.opportunitiesbysatges');
                 console.log($scope.opportunitiesbysatges);                 
                 if ($scope.oppCurrentPage>1){
                      $scope.opppagination.prev = true;
                   }else{
                       $scope.opppagination.prev = false;
                   }
                 if (resp.nextPageToken){
                   var nextPage = $scope.oppCurrentPage + 1;
                   // Store the nextPageToken
                   $scope.opppages[nextPage] = resp.nextPageToken;
                   $scope.opppagination.next = true;

                 }else{
                  $scope.opppagination.next = false;
                 }
                 $scope.inProcess(false);  
                  $scope.apply();
              }else {

                if(resp.code==401){
                       $scope.refreshToken();
                       $scope.inProcess(false);  
                       $scope.apply();
                };

              }
            
          });
          Opportunitystage.list($scope,{'order':'probability'});
          var paramsTag = {'about_kind':'Opportunity'};
          Tag.list($scope,paramsTag);
          User.list($scope,{});
          // for (var i=0;i<50;i++)
          //   {
          //       var randomAmount = Math.floor((Math.random() * 100) + 1);
          //       var opportunity = {
          //                 'name':  i.toString() + ' kass ta3 lban',
          //                 'amount_total':randomAmount.toString(),
          //
          //                 'access':'public'
          //               }
          //       $scope.searchAccountQuery = 'ioCompare'
          //       $scope.save(opportunity);
          //   }
          ga('send', 'pageview', '/opportunities');
          if (localStorage['oppShow']!=undefined) {
            if (localStorage['oppShow']=="cards") {
              localStorage['oppShow']="list";
            };
              $scope.show=localStorage['oppShow'];

          };
         window.Intercom('update');
       };
    
       $(window).resize(function() {
        });
      $scope.selectMember = function () {
            if ($scope.sharing_with.indexOf($scope.user)==-1) {
                $scope.slected_memeber = $scope.user;

            $scope.sharing_with.push($scope.slected_memeber);
            }
            $scope.user = '';

         };
      $scope.unselectMember = function(index) {
            $scope.selected_members.splice(index, 1);
            console.log($scope.selected_members);
        };
      $scope.share = function (me) {
            if ($scope.selectedPermisssions) {
                var sharing_with=$.extend(true, [], $scope.sharing_with);
                $scope.sharing_with=[];
                angular.forEach($scope.selectedCards, function (selected_lead) {
                    var id = selected_lead.id;
                    if (selected_lead.owner.google_user_id == me) {
                        var params = {'id': id, 'access': $scope.selected_access};
                        Opportunity.patch($scope, params);
                        // who is the parent of this event .hadji hicham 21-07-2014.

                        params["parent"] = "opportunity";
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

      $scope.checkPermissions= function(me){
          console.log("enter here in permission");
          $scope.selectedPermisssions=true;
          angular.forEach($scope.selectedCards, function(selected_opportunity){
              console.log(selected_opportunity.owner.google_user_id);
              console.log(me);
              if (selected_opportunity.owner.google_user_id==me) {
                console.log("hhhhhhhhheree enter in equal");
              };
              if (selected_opportunity.owner.google_user_id!=me) {
                console.log("in not owner");
                $scope.selectedPermisssions=false;
              };
          });
          console.log($scope.selectedPermisssions);
        }
   $scope.getColaborators=function(){

   };
       $scope.isSelectedCard = function(opportunity) {
          return ($scope.selectedCards.indexOf(opportunity) >= 0);
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
                  console.log($scope.opportunities);
                  $scope.selectedCards=$scope.selectedCards.concat($scope.opportunities);
                    
                  $scope.allCardsSelected=true;

               }else{

                $scope.selectedCards=[];
                $scope.allCardsSelected=false;
                
               }
          };

          $scope.wizard = function(){
        localStorage['completedTour'] = 'True';
        var tour = {
            id: "hello-hopscotch",
             steps: [
             {
                title: "Step 1: Create New opportunity",
                content: "Click here to create new opportunity and add detail about it.",
                target: "new_opportunity",
                placement: "bottom"
              },
             {
                
                title: "Step 2: Add tags",
                content: "Add Tags to filter your opportunities.",
                target: "add_tag",
                placement: "left"
              }
             
              
            ]
           
          };
          // Start the tour!
          console.log("beginstr");
          hopscotch.startTour(tour);
      };
          
          
          $scope.editbeforedeleteselection = function(){
            $('#BeforedeleteSelectedOpportunities').modal('show');
          };
          $scope.deleteSelection = function(){
              if (!jQuery.isEmptyObject($scope.opportunityToChage)) {
                console.log("in oppo to change");
                  var params = {'entityKey':$scope.opportunityToChage.entityKey};
                  Opportunity.delete($scope, params);
              }else{
                 angular.forEach($scope.selectedCards, function(selected_opportunity){

                  var params = {'entityKey':selected_opportunity.entityKey};
                  Opportunity.delete($scope, params);

                 });  
              };
                        
              $('#BeforedeleteSelectedOpportunities').modal('hide');
          };
          $scope.oppDeleted=function(entityKey){
            console.log("test oppoo deleted");
            console.log(entityKey);
            if ($scope.selectedOpportunity) {
                  console.log("test selectedOpportunity");
               $scope.opportunities.splice($scope.opportunities.indexOf($scope.selectedOpportunity) , 1);
               $scope.apply();
               $scope.selectedCards=[];
            }else{
              if (!jQuery.isEmptyObject($scope.opportunityToChage)) {
                $scope.stageFrom.items.splice($scope.stageFrom.items.indexOf($scope.opportunityToChage) , 1);
                $scope.apply();
                $scope.selectedCards=[];
              }else{
               /* console.log("$scope.selectedCards");
                console.log($scope.selectedCards);*/
               
                  angular.forEach($scope.opportunities, function(opp){
                    if (opp.entityKey==entityKey) {
                      $scope.opportunities.splice($scope.opportunities.indexOf(opp) , 1);
                      $scope.apply();
                    };
                  }); 
                  angular.forEach($scope.selectedCards, function(card){
                    if (card.entityKey==entityKey) {
                      $scope.selectedCards.splice($scope.selectedCards.indexOf(card) , 1);
                      $scope.apply();
                    };
                  });
                  console.log("yes heeeeeeeeeeere");
                  angular.forEach($scope.opportunitiesbysatges, function(stage){

                      angular.forEach(stage.items, function(item){
                       if (item.entityKey==entityKey) {
                          stage.items.splice(stage.items.indexOf(item) , 1);
                       }; 
                      $scope.apply();
                      });
                  });
                 
              }
              
               
            };
            
          }
         /* $scope.oppDeleted = function(resp){

            if ($scope.selectedCards.length >0) {
              angular.forEach($scope.selectedCards, function(selected_opportunity){
                 $scope.opportunities.splice($scope.opportunities.indexOf(selected_opportunity) , 1);
                }); 
            };        
              $scope.selectedCards=[];
          };*/
          
          $scope.selectCardwithCheck=function($event,index,opportunity){

              var checkbox = $event.target;

               if(checkbox.checked){
                  if ($scope.selectedCards.indexOf(opportunity) == -1) {             
                    $scope.selectedCards.push(opportunity);
                    console.log("card pushed");
                    console.log($scope.selectedCards);
                  }
               }else{       
                    $scope.selectedCards.splice($scope.selectedCards.indexOf(opportunity) , 1);
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

         $scope.removeTag = function(tag,opportunity) {

             $scope.dragTagItem(tag,opportunity);
            $scope.dropOutTag();
        }


              $scope.dropOutTag = function() {

            var params = {'entityKey': $scope.edgekeytoDelete}
            Edge.delete($scope, params);
            $scope.edgekeytoDelete = undefined;
            $scope.showUntag = false;

        }
        $scope.dragTagItem = function(tag,opportunity) {

            $scope.showUntag = true;
            $scope.edgekeytoDelete = tag.edgeKey;
            $scope.tagtoUnattach = tag;
            $scope.contacttoUnattachTag = opportunity;
        }
        // We need to call this to refresh token when user credentials are invalid
       $scope.refreshToken = function() {
            Auth.refreshToken();
       };
       $scope.editbeforedelete = function(opportunity){
        console.log("ssssss");
         $scope.selectedOpportunity=opportunity;
         $('#BeforedeleteOpportunity').modal('show');
       };
      $scope.deleteopportunity = function(){
         var params = {'entityKey':$scope.selectedOpportunity.entityKey};
         Opportunity.delete($scope, params);
         $('#BeforedeleteOpportunity').modal('hide');
         $scope.selectedOpportunity=null;
       };
      $scope.showAssigneeTags=function(opportunity){
            $('#assigneeTagsToOpp').modal('show');
            $scope.currentOpportunity=opportunity;
         };
       $scope.addTagsTothis = function () {

            var tags = [];
            var items = [];
            tags = $('#select2_sample2').select2("val");
            angular.forEach(tags, function (tag) {
                var params = {
                    'parent': $scope.opportunity.entityKey,
                    'tag_key': tag
                };
                Tag.attach($scope, params, -1, 'lead');
            });
            $('#select2_sample2').select2("val", "");
            $('#assigneeTagsToOpp').modal('hide');
        };
         $scope.addTagstoOpportunities=function(){
                var tags=[];
                var items = [];
                tags=$('#select2_sample2').select2("val");
                console.log(tags);
                if ($scope.currentOpportunity!=null) {
                  angular.forEach(tags, function(tag){
                           var params = {
                             'parent': $scope.currentOpportunity.entityKey,
                             'tag_key': tag
                          };
                         Tag.attach($scope, params);
                        });
                }else{
                  angular.forEach($scope.selectedCards, function(selected_opportunity){
                    angular.forEach(tags, function(tag){
                      var params = {
                        'parent': selected_opportunity.entityKey,
                        'tag_key': tag
                      };
                       Tag.attach($scope, params);
                    });

                });
                }
                $scope.apply();
                $('#select2_sample2').select2("val", "");
                $('#assigneeTagsToOpp').modal('hide');

        };
        $scope.clearTagsModel=function(id){
            $('#'+id).select2("val", "");
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
    $scope.getPosition= function(index){
        if(index<4){

          return index+1;
        }else{
          console.log((index%4)+1);
          return (index%4)+1;
        }
     };

     $scope.listNextPageItems = function(){

        var nextPage = $scope.oppCurrentPage + 1;
        var params = {};
          if ($scope.opppages[nextPage]){
            params = {'order' : $scope.order,
                      'limit':6,
                      'pageToken':$scope.opppages[nextPage]
                     }
          }else{
            params = {'order' : $scope.order,'limit':6}
          }
          console.log('in listNextPageItems');
          $scope.oppCurrentPage = $scope.oppCurrentPage + 1 ;
          Opportunity.list($scope,params);
     }
     $scope.listMoreItems = function(){

        var nextPage = $scope.oppCurrentPage + 1;
        var params = {};
          if ($scope.opppages[nextPage]){
            params = {'order' : $scope.order,
                      'limit':20,
                      'pageToken':$scope.opppages[nextPage]
                     }
            $scope.oppCurrentPage = $scope.oppCurrentPage + 1 ;
            Opportunity.listMore($scope,params);
          }

     }
     $scope.listPrevPageItems = function(){

       var prevPage = $scope.oppCurrentPage - 1;
       var params = {};
          if ($scope.opppages[prevPage]){
            params = {'order' : $scope.order,'limit':6,
                      'pageToken':$scope.opppages[prevPage]
                     }
          }else{
            params = {'order' : $scope.order,'limit':6}
          }
          $scope.oppCurrentPage = $scope.oppCurrentPage - 1 ;
          Opportunity.list($scope,params);
     }



     $scope.showModal = function(){
        console.log('button clicked');
        $('#addOpportunityModal').modal('show');

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



    $scope.addOpportunityOnKey = function(opportunity){
      if(event.keyCode == 13 && opportunity.amount){
          $scope.save(opportunity);
      }


    };
    $scope.accountInserted = function(resp){
          $scope.opportunity.account = resp;
          Opportunity.insert($scope,opportunity);
      };

    var params_search_account ={};
     $scope.result = undefined;
     $scope.q = undefined;

      $scope.$watch('searchAccountQuery', function() {
         params_search_account['q'] = $scope.searchAccountQuery;
         if ($scope.searchAccountQuery){
            Account.search($scope,params_search_account);
         };
      });
      $scope.selectAccount = function(){
        $scope.opportunity.account = $scope.searchAccountQuery;

     };
     // Quick Filtering
     var searchParams ={};
     $scope.result = undefined;
     $scope.q = undefined;

     $scope.$watch('searchQuery', function() {
         searchParams['q'] = $scope.searchQuery;
         searchParams['limit'] = 7;
         if ($scope.searchQuery){
         Opportunity.search($scope,searchParams);
       };
     });
     $scope.selectResult = function(){
          window.location.replace('#/opportunities/show/'+$scope.searchQuery.id);
     };
     $scope.executeSearch = function(searchQuery){
        if (typeof(searchQuery)=='string'){
           var goToSearch = 'type:Opportunity ' + searchQuery;
           window.location.replace('#/search/'+goToSearch);
        }else{
          window.location.replace('#/opportunities/show/'+searchQuery.id);
        }
        $scope.searchQuery=' ';
        $scope.apply();
     };
     // Sorting
     $scope.orderBy = function(order){
        var params = { 'order': order,
                        'limit':6};
        $scope.order = order;
        Opportunity.list($scope,params);
     };
     $scope.filterByOwner = function(filter){
        if (filter){
          var params = { 'owner': filter,
                         'order': $scope.order
                       }
        }
        else{
          var params = {
              'order': $scope.order}
        };
        $scope.isFiltering = true;
        Opportunity.list($scope,params);
     };
     $scope.filterByStage = function(filter){
      console.log('----------hello--------');


          console.log(filter);
          var params = {
                         'stage': filter,
                         'order': $scope.order
                       }

        $scope.isFiltering = true;
        Opportunity.list($scope,params);
     };

/***********************************************
      HKA 14.02.2014  tags
*************************************************/
$scope.listTags=function(){
      var paramsTag = {'about_kind':'Opportunity'}
      Tag.list($scope,paramsTag);
     };
$scope.edgeInserted = function () {
       $scope.listopportunities();
     };
$scope.listopportunities = function(){
  var params = { 'order': $scope.order,
                        'limit':6}
          Opportunity.list($scope,params);
   var paramsTag = {'about_kind':'Opportunity'};
          Tag.list($scope,paramsTag);
};


$scope.addNewtag = function(tag){
       var params = {
                          'name': tag.name,
                          'about_kind':'Opportunity',
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

 $scope.listTags=function(){
  var paramsTag = {'about_kind':'Opportunity'};
      Tag.list($scope,paramsTag);
     };
      $scope.AllFilters = function (currFilters) {
          $scope.inProcess(true);
          $scope.cloneOppStages = $.extend(true, [], $scope.oppStagesOrigin);
          $scope.opportunitiesbysatges = $.extend(true, [], $scope.oppStagesOrigin);
          angular.forEach($scope.cloneOppStages, function (stage) {
              stage.items = [];
          });
          angular.forEach($scope.opportunitiesbysatges, function (stage) {
              var ind = $scope.opportunitiesbysatges.indexOf(stage);
              angular.forEach(stage.items, function (opp) {
                  if (currFilters.owner == 'all' || currFilters.owner == opp.owner.google_user_id) {
                      if (currFilters.tags != undefined && currFilters.tags.length > 0) {
                          var allTagsExist = 0;
                          angular.forEach(currFilters.tags, function (tag) {
                              if (opp.tags != undefined) {
                                  angular.forEach(opp.tags, function (opptag) {
                                      if (tag.id == opptag.id) {
                                          allTagsExist++;
                                      }
                                      ;
                                  });

                              }
                              ;
                          });
                          if (allTagsExist == currFilters.tags.length) {
                              $scope.cloneOppStages[ind].items.push(opp);
                              $scope.cloneOppStages[ind].items = $filter('orderBy')($scope.cloneOppStages[ind].items, currFilters.orderBy);
                          }
                          ;
                      } else {
                          console.log('not tags selection');
                          console.log(currFilters.orderBy);
                          $scope.cloneOppStages[ind].items.push(opp);
                          $scope.cloneOppStages[ind].items = $filter('orderBy')($scope.cloneOppStages[ind].items, currFilters.orderBy);
                      }
                  }
                  ;
              });
          });
          $scope.opportunitiesbysatges = $.extend(true, [], $scope.cloneOppStages);
          $scope.inProcess(false);
          $scope.apply();
      }
      $scope.opportunityFilterBy = function (filter, assignee) {
          $scope.inProcess(true);
          // $scope.filterByTags($scope.selected_tags);
          $scope.cloneOppStages = $.extend(true, [], $scope.opportunitiesbysatges);
          angular.forEach($scope.cloneOppStages, function (stage) {
              stage.items = [];
          });
          if ($scope.opportunitiesfilter != filter) {
              switch (filter) {
                  case 'all':
                      $scope.opportunitiesbysatges = $.extend(true, [], $scope.oppStagesOrigin);
                      $scope.opportunitiesfilter = filter;
                      $scope.opportunitiesAssignee = null;
                      break;
                  case 'my':
                      console.log('in my');
                      console.log(assignee);
                      angular.forEach($scope.opportunitiesbysatges, function (stage) {
                          var ind = $scope.opportunitiesbysatges.indexOf(stage);
                          angular.forEach(stage.items, function (opp) {
                              if (opp.owner.google_user_id == assignee) {
                                  $scope.cloneOppStages[ind].items.push(opp);
                              }
                              ;
                          });
                      });
                      $scope.opportunitiesbysatges = $.extend(true, [], $scope.cloneOppStages);
                      $scope.opportunitiesAssignee = assignee;
                      $scope.opportunitiesfilter = filter;
                      break;
              }
              ;
              $scope.inProcess(false);
              $scope.apply();
          }
      }
      $scope.filterOppBy = function (fltr) {
          $scope.inProcess(true);
          $scope.cloneOppStages = $.extend(true, [], $scope.opportunitiesbysatges);
          angular.forEach($scope.cloneOppStages, function (stage) {
              stage.items = [];
          });
          angular.forEach($scope.opportunitiesbysatges, function (stage) {
              console.log('stage.items');
              console.log(stage.items)
              console.log('stage.items after filter');
              console.log($filter('orderBy')(stage.items, fltr));
              $scope.cloneOppStages[$scope.opportunitiesbysatges.indexOf(stage)].items = $filter('orderBy')(stage.items, fltr);
              var ind = $scope.opportunitiesbysatges.indexOf(stage);
          });
          $scope.opportunitiesbysatges = $.extend(true, [], $scope.cloneOppStages);
          $scope.order = fltr;
          $scope.inProcess(false);
          $scope.apply();
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
            // element.css('background-color', tag.color+'!important');
            // text.css('color',$scope.idealTextColor(tag.color));

         }else{
            element.css('background-color','#ffffff !important');
            $scope.selected_tags.splice($scope.selected_tags.indexOf(tag),1);
             text.css('color','#000000');
         }
          $scope.currentFilters.tags = $scope.selected_tags;
          $scope.AllFilters($scope.currentFilters);
      }

    };

      $scope.filterByTags = function (selected_tags) {
          $scope.inProcess(true);
          $scope.opportunitiesbysatges = $.extend(true, [], $scope.oppStagesOrigin);
          $scope.cloneOppStages = $.extend(true, [], $scope.oppStagesOrigin);
          angular.forEach($scope.cloneOppStages, function (stage) {
              stage.items = [];
          });
          if (selected_tags != undefined && selected_tags.length > 0) {
              angular.forEach($scope.opportunitiesbysatges, function (stage) {
                  var ind = $scope.opportunitiesbysatges.indexOf(stage);
                  angular.forEach(stage.items, function (opp) {
                      var allTagsExist = 0;
                      angular.forEach(selected_tags, function (tag) {
                          if (opp.tags != undefined) {
                              angular.forEach(opp.tags, function (opptag) {
                                  if (tag.id == opptag.id) {
                                      allTagsExist++;
                                  }
                                  ;
                              });

                          }
                          ;
                      });
                      if (allTagsExist == selected_tags.length) {
                          $scope.cloneOppStages[ind].items.push(opp);
                      }
                      ;
                  });
              });
              $scope.opportunitiesbysatges = $.extend(true, [], $scope.cloneOppStages);
          } else {
              $scope.opportunitiesbysatges = $.extend(true, [], $scope.oppStagesOrigin);
          }
          ;
          $scope.inProcess(false);
          $scope.apply();
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
    $scope.listopportunities();

 };


$scope.manage=function(){
        $scope.unselectAllTags();
      };
$scope.tag_save = function(tag){
          if (tag.name) {
             Tag.insert($scope,tag);

           };
      };
$scope.hideEditable=function(index,tag){
   document.getElementById("tag_"+index).style.backgroundColor=tag.color;
   document.getElementById("closy_"+index).removeAttribute("style");
  document.getElementById("checky_"+index).style.display="inline";
 
  $scope.edited_tag=null;
}
$scope.editTag=function(tag,index){
  document.getElementById("tag_"+index).style.backgroundColor="white";
  document.getElementById("closy_"+index).style.display="none";
  document.getElementById("checky_"+index).style.display="none";
 
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

     var handleColorPicker = function () {
          if (!jQuery().colorpicker) {
              return;
              console.log('errooooooooooooooor');
              console.log("working******************************");
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
      };
      $scope.dragTag=function(tag){
     

        $scope.draggedTag=tag;
      }
      $scope.dropTag=function(opportunity,index){
        var items = [];
         console.log('-----------Drag Tag-----------');
         console.log(opportunity.entityKey);
        var params = {
              'parent': opportunity.entityKey,
              'tag_key': $scope.draggedTag.entityKey
        };
        $scope.draggedTag=null;
        Tag.attach($scope,params,index);
        $scope.apply()
      };
       $scope.tagattached=function(tag,index,tab,entityKey){
         if (index>=0||$scope.currentOpportunity!=null) {
                var opp={};
                if ($scope.currentOpportunity!=null) {
                  opp=$scope.currentOpportunity;
                }else{
                  opp=$scope.opportunities[index];
                }
                if (opp.tags == undefined){
                  opp.tags = [];
                }
                var ind = $filter('exists')(tag, opp.tags);
               if (ind == -1) {
                    opp.tags.push(tag);
                    var card_index = '#card_'+index;
                    $(card_index).removeClass('over');
                }else{
                     var card_index = '#card_'+index;
                    $(card_index).removeClass('over');
                }

                
           }else{
             if (index==-1) {
              angular.forEach($scope.opportunitiesbysatges, function(stage){

                      angular.forEach(stage.items, function(item){
                        if (item.entityKey==entityKey) {
                          if(item.tags==undefined){
                            item.tags=[];
                          }
                          item.tags.push(tag);
                        }; 
                        $scope.apply();
                      });
                  });
             };
             if ($scope.selectedCards.length >0) {
              angular.forEach($scope.selectedCards, function(selected_opportunity){
                  var existstag=false;
                  angular.forEach(selected_opportunity.tags, function(elementtag){
                      if (elementtag.id==tag.id) {
                         existstag=true;
                      };                       
                  }); 
                  if (!existstag) {
                     if (selected_opportunity.tags == undefined) {
                        selected_opportunity.tags = [];
                        }
                     selected_opportunity.tags.push(tag);
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
      }
 //HKA 19.06.2014 Detache tag on contact list
     $scope.dropOutTag=function(){


        var params={'entityKey':$scope.edgekeytoDelete}
        Edge.delete($scope,params);

        $scope.edgekeytoDelete=undefined;
        $scope.showUntag=false;
      };
      $scope.dragTagItem = function(tag,opportunity) {

            $scope.showUntag = true;
            $scope.edgekeytoDelete = tag.edgeKey;
            $scope.tagtoUnattach = tag;
            $scope.opptoUnattachTag = opportunity;
        }
        $scope.tagUnattached = function() {
          console.log("inter to tagDeleted");
            $scope.opptoUnattachTag.tags.splice($scope.opptoUnattachTag.tags.indexOf($scope.tagtoUnattach),1)
            $scope.apply()
        };

     // Google+ Authentication
     Auth.init($scope);
     $(window).scroll(function() {
          if (!$scope.isLoading && !$scope.isFiltering && ($(window).scrollTop() >  $(document).height() - $(window).height() - 100)) {
              $scope.listMoreItems();
          }
      });

}]);
app.controller('OpportunityShowCtrl', ['$scope', '$http', '$filter', '$route', 'Auth', 'Task', 'Event', 'Topic', 'Note', 'Opportunity', 'Permission', 'User', 'Opportunitystage', 'Email', 'Attachement', 'InfoNode', 'Tag', 'Edge', 'Account', 'Contact', 'Map','Customfield',
    function ($scope, $http, $filter, $route, Auth, Task, Event, Topic, Note, Opportunity, Permission, User, Opportunitystage, Email, Attachement, InfoNode, Tag, Edge, Account, Contact, Map, Customfield) {
      $("ul.page-sidebar-menu li").removeClass("active");
     $("#id_Opportunities").addClass("active");
     trackMixpanelAction('OPPORTUNITY_SHOW_VIEW');
     $scope.selectedTab = 2;
     $scope.isLoading = false;
     $scope.nbLoads=0;
     $scope.isSignedIn = false;
     $scope.immediateFailed = false;
     $scope.isContentLoaded = false;
     $scope.pagination = {};
     //HKA 10.12.2013 Var topic to manage Next & Prev
     $scope.topicCurrentPage=01;
     $scope.topicpagination={};
     $scope.topicpages = [];
     $scope.nextPageToken = undefined;
     $scope.prevPageToken = undefined;
     $scope.currentPage = 01;
     $scope.pages = [];
     $scope.opportunities = [];
     $scope.users = [];
     $scope.user = undefined;
     $scope.slected_memeber = undefined;
     $scope.stage_selected={};
     $scope.email = {};
     $scope.infonodes = {};
     $scope.documentpagination = {};
     $scope.documentCurrentPage=01;
     $scope.documentpages=[];
     $scope.collaborators_list=[];
     $scope.sharing_with = [];
     $scope.opportunitystages=[];
     $scope.opportunity={'current_stage':{'name':'Incoming','probability':5}};
     $scope.closed_date=new Date();
     $scope.opportunity.current_stage.name=$scope.opportunitystages.name;
        $scope.competitors = [];
        $scope.relatedInfonode = {};
        $scope.opportunity.competitors = [];
     $scope.chartOptions = {
         animate:{
             duration:0,
             enabled:false
         },
         size:100,
         barColor:'#58a618',
         scaleColor:false,
         lineWidth:7,
         lineCap:'circle'
     };
     $scope.showeditdate=false;
     $scope.newTaskform=false;
     $scope.newEventform=false;
     $scope.newTask={};
     $scope.selected_members=[];
     $scope.selected_member={};
     $scope.ioevent = {};
     $scope.showPage=true;
     $scope.ownerSelected={};
     $scope.invites=[];
     $scope.allday=false;
     $scope.guest_modify=false;
     $scope.guest_invite=true;
     $scope.guest_list=true;
     $scope.insideStages=[];
     $scope.allcurrency=[
        { value:"USD", text:"$ - USD"},
        { value:"EUR", text:"€ - EUR"},
        { value:"CAD", text:"$ - CAD"},
        { value:"GBP", text:"£ - GBP"},
        { value:"AUD", text:"$ - AUD"},
        { value:"", text:"---"},
        { value:"AED", text:"د.إ - AED"},
        { value:"ANG", text:"ƒ - ANG"},
        { value:"AOA", text:"AOA - AOA"},
        { value:"ARS", text:"$ - ARS"},
        { value:"BAM", text:"KM - BAM"},
        { value:"BBD", text:"$ - BBD"},
        { value:"BGL", text:"лв - BGL"},
        { value:"BHD", text:"BD - BHD"},
        { value:"BND", text:"$ - BND"},
        { value:"BRL", text:"R$ - BRL"},
        { value:"BTC", text:"฿ - BTC"},
        { value:"CHF", text:"Fr - CHF"},
        { value:"CLF", text:"UF - CLF"},
        { value:"CLP", text:"$ - CLP"},
        { value:"CNY", text:"¥ - CNY"},
        { value:"COP", text:"$ - COP"},
        { value:"CRC", text:"₡ - CRC"},
        { value:"CZK", text:"Kč - CZK"},
        { value:"DKK", text:"kr - DKK"},
        { value:"EEK", text:"KR - EEK"},
        { value:"EGP", text:"E£ - EGP"},
        { value:"FJD", text:"FJ$ - FJD"},
        { value:"GTQ", text:"Q - GTQ"},
        { value:"HKD", text:"$ - HKD"},
        { value:"HRK", text:"kn  - HRK"},
        { value:"HUF", text:"Ft - HUF"},
        { value:"IDR", text:"Rp - IDR"},
        { value:"ILS", text:"₪ - ILS"},
        { value:"INR", text:"₨ - INR"},
        { value:"IRR", text:"ریال - IRR"},
        { value:"ISK", text:"kr - ISK"},
        { value:"JOD", text:"د.ا - JOD"},
        { value:"JPY", text:"¥ - JPY"},
        { value:"KES", text:"KSh - KES"},
        { value:"KRW", text:"₩ - KRW"},
        { value:"KWD", text:"KD - KWD"},
        { value:"KYD", text:"$ - KYD"},
        { value:"LTL", text:"Lt - LTL"},
        { value:"LVL", text:"Ls - LVL"},
        { value:"MAD", text:"د.م. - MAD"},
        { value:"MVR", text:"Rf - MVR"},
        { value:"MXN", text:"$ - MXN"},
        { value:"MYR", text:"RM - MYR"},
        { value:"NGN", text:"₦ - NGN"},
        { value:"NOK", text:"kr - NOK"},
        { value:"NZD", text:"$ - NZD"},
        { value:"OMR", text:"ر.ع - OMR"},
        { value:"PEN", text:"S/. - PEN"},
        { value:"PHP", text:"₱ - PHP"},
        { value:"PLN", text:"zł - PLN"},
        { value:"QAR", text:"ر.ق - QAR"},
        { value:"RON", text:"L - RON"},
        { value:"RUB", text:"руб. - RUB"},
        { value:"SAR", text:"ر.س - SAR"},
        { value:"SEK", text:"kr - SEK"},
        { value:"SGD", text:"$ - SGD"},
        { value:"THB", text:"฿ - THB"},
        { value:"TRY", text:"TL - TRY"},
        { value:"TTD", text:"$ - TTD"},
        { value:"TWD", text:"$ - TWD"},
        { value:"UAH", text:"₴ - UAH"},
        { value:"VEF", text:"Bs F - VEF"},
        { value:"VND", text:"₫ - VND"},
        { value:"XCD", text:"$ - XCD"},
        { value:"ZAR", text:"R - ZAR"}];
      $scope.sendWithAttachments = [];
      $scope.parseInt = parseInt;
      $scope.wonStage={};
      $scope.lostStage={};
      $scope.searchLeadQuery=null;
        $scope.opportunity.competitors = [];
        $scope.itemToDisassociate = {};
      $scope.opportunities=[];
      $scope.opportunities.customfields=[];

        $scope.selectedDocs=[];
        $scope.newDoc=true;
        $scope.docInRelatedObject=true;
       $scope.stageUpdated=function(params){
        console.log("in stage updated");
        angular.forEach($scope.opportunitystages, function(stage){
            if (stage.entityKey==params.stage) {
              console.log("stage found");
              $scope.opportunity.current_stage=stage;
            };
        });
       };
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
      $scope.fromNow = function(fromDate){
          return moment(fromDate,"YYYY-MM-DD HH:mm Z").fromNow();
      }
        $scope.mapAutocomplete = function () {
            // $scope.addresses = $scope.contact.addresses;
            Map.autocomplete($scope, "relatedContactAddress");
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
    $scope.docCreated=function(url){
            console.log('here docCreated');
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
                    console.log("opp pushed");
                    console.log($scope.selectedDocs);
                  }
               }else{       

                    $scope.selectedDocs.splice($scope.selectedDocs.indexOf(doc) , 1);
               }

        }
        //$tocopy
      // What to do after authentication
       $scope.runTheProcess = function(){
          var params = {
                          'id':$route.current.params.opportunityId,

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
          Opportunity.get($scope,params);
          User.list($scope,{});
          //HKA 13.12.2013 to retrieve the opportunities's stages
         
           var paramsTag = {'about_kind': 'Opportunity'};
          Tag.list($scope, paramsTag);
          ga('send', 'pageview', '/opportunities/show');
          window.Intercom('update');
           $scope.mapAutocomplete();
     
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
       $scope.runStagesList=function(){
          Opportunitystage.list($scope,{'order':'probability'});
       }
         $scope.getColaborators=function(){
          $scope.collaborators_list=[];
          Permission.getColaborators($scope,{"entityKey":$scope.opportunity.entityKey});  

        }
        // We need to call this to refresh token when user credentials are invalid
     $scope.refreshToken = function() {
          Auth.refreshToken();
     };
     
     $scope.lunchWizard=function(){
 
     }
     $scope.showAssigneeTagsToOpportunity=function(){
       $('#assigneeTagsToOpp').modal('show');
     }
     /************** account and contact update******/
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
     $scope.selectContact = function(){
        console.log('$scope.searchAccountQuery ....');
         console.log($scope.searchRelatedContactQuery);

         if (typeof($scope.searchRelatedContactQuery) == 'object') {
             var params = {
                 'id': $scope.opportunity.id,
                 'new_contact': {
                     'contact': $scope.searchRelatedContactQuery.entityKey,
                     'is_decesion_maker': false
                 }
             };
             Opportunity.patch($scope, params);
         }
         $scope.searchRelatedContactQuery = "";
     };
        $scope.selectCompetitor = function () {
            console.log("enter fired");
            console.log($scope.searchCompetitorQuery);
            if ($scope.opportunity.competitors == undefined) {
                $scope.opportunity.competitors = [];
            }
            ;
            var par = {};
            if (typeof($scope.searchCompetitorQuery) == 'object') {
                console.log("enter object");
                par = {
                    'id': $scope.opportunity.id,
                    'new_competitor': $scope.searchCompetitorQuery.entityKey
                }
                Opportunity.patch($scope, par);
            } else {
                if ($scope.searchCompetitorQuery != "") {
                    console.log("enter string");
                    par = {
                        'id': $scope.opportunity.id,
                        'new_competitor': $scope.searchCompetitorQuery
                    }
                    Opportunity.patch($scope, par);
                }
                ;
            }
            ;
            $scope.searchCompetitorQuery = "";
            $scope.apply();
        };
        $scope.selectRelatedContact = function () {
            if (typeof($scope.searchRelatedContactQuery) == 'object') {
          $scope.updateOpportunity({
          'id':$scope.opportunity.id,
          'contact':$scope.searchAccountQuery.entityKey
          });  
        }
      };
        $scope.addGeo = function (address) {
            console.log("geo added");
            console.log(address);
            $scope.currentContact.address = address.formatted;
            /*$scope.addresses.push(address);*/
            $scope.apply();
            // console.log($scope.infonodes.addresses);
        };
        $scope.setDecisionMaker = function (contact) {
            console.log("deciosion maker");
            contact.is_decesion_maker = !contact.is_decesion_maker;
            var params = {
                id: $scope.opportunity.id,
                contact: {
                    edgeKey: contact.edgeKey,
                    is_decesion_maker: contact.is_decesion_maker
                }
            }
            Opportunity.patch($scope, params);
        }
        $scope.showAddTimeScale = function () {

            $('#newTimeModalForm').modal('show');
        }
        $scope.addNewRelatedContact = function (current) {
            if (current.firstname != null && current.lastname != null) {
                $scope.contact = current;
                $scope.contact.access = $scope.opportunity.access;
                if (current.phone != null) {
                    $scope.contact.phone = [{'number': current.phone, 'type': 'work'}];
                }
                if (current.email != null) {
                    $scope.contact.emails = [{'email': current.email}];
                }
                if (current.address != null) {
                    $scope.contact.addresses = [{'formatted': current.address}];
                }
                Contact.insert($scope, $scope.contact);
                $scope.currentContact = {};
            } else {
                $scope.currentContact = {};
                /* $scope.newContactform = false;*/
            }
            ;
            console.log('hhhhhhhhhhhhhhhhhere save new contact');
            console.log($scope.newcontacts);

        }
        $scope.contactInserted = function (resp) {
            var params = {
                'id': $scope.opportunity.id,
                'new_contact': {
                    'contact': resp.entityKey,
                    'is_decesion_maker': false
                }
            };
            Opportunity.patch($scope, params);
            $scope.opportunity.contacts.push(resp);
            $scope.apply();
            //$scope.opportunity.contact = resp.entityKey;   
        }
      var params_search_lead ={};
      $scope.$watch('searchLeadQuery', function() {
        if($scope.searchLeadQuery){
            if($scope.searchLeadQuery.length>1){
              params_search_lead['q'] = $scope.searchLeadQuery;
              gapi.client.crmengine.leads.search(params_search_lead).execute(function(resp) {
                if (resp.items){
                $scope.leadsResults = resp.items;
                console.log($scope.leadsResults);
                $scope.apply();
              };
            });
          }
        }
      });
     $scope.selectLead = function(){
        console.log('$scope.searchLeadQuery ....');
        console.log($scope.searchLeadQuery);
        if (typeof($scope.searchLeadQuery)=='object'){
          $scope.updateOpportunity({
          'id':$scope.opportunity.id,
          'lead':$scope.searchLeadQuery.entityKey
          });  
        }
      };


      var params_search_account ={};
      $scope.result = undefined;
      $scope.q = undefined;
      $scope.$watch('searchAccountQuery', function() {
          params_search_account['q'] = $scope.searchAccountQuery;
          Account.search($scope,params_search_account);
      });
     $scope.updateOpportunity=function(params){
      Opportunity.patch($scope,params);
     }
      $scope.selectAccount = function(){
        //  $scope.opportunity.account  = $scope.searchAccountQuery;
        console.log('$scope.searchAccountQuery ....');
        console.log($scope.searchAccountQuery);
        if (typeof($scope.searchAccountQuery)=='object'){
          $scope.updateOpportunity({
          'id':$scope.opportunity.id,
          'account':$scope.searchAccountQuery.entityKey
          });  
        }
        
      };
      $scope.insertNewContact = function(account,access){
          if($scope.searchContactQuery.length>0){
            var firstName = $scope.searchContactQuery.split(' ').slice(0, -1).join(' ') || " ";
            var lastName = $scope.searchContactQuery.split(' ').slice(-1).join(' ') || " ";
            var params = {
                          'firstname':  firstName ,
                          'lastname': lastName ,
                          'account': account,
                          'access': access
                        };
            Contact.insert($scope,params);
          };
      } 

/*********************end of account and contact update****/
     $scope.listTags=function(){
      var paramsTag = {'about_kind':'Opportunity'}
      Tag.list($scope,paramsTag);
     };
      $scope.beforedeleteOpportunity = function(){
          $('#BeforedeleteOpportunity').modal('show');
      }
      $scope.deleteopportunity = function(){
           var opportunityKey = {'entityKey':$scope.opportunity.entityKey};
           Opportunity.delete($scope,opportunityKey);

           $('#BeforedeleteOpportunity').modal('hide');
      };
      //HKA 20.12.2014 Retrive the url of the notes
      $scope.getTopicUrl = function(type,id){
      return Topic.getUrl(type,id);
    };
        $scope.editbeforedisassociate = function (item, array, typee) {
            $scope.itemToDisassociate = {'item': item, 'array': array, 'type': typee};
            $('#beforedelinkContact').modal('show');
        };
        $scope.disassociateItem = function () {
            console.log('edge to delete');
            console.log($scope.itemToDisassociate);
            if ($scope.itemToDisassociate.type == 'contact') {
                var params = {'entityKey': $scope.itemToDisassociate.item.edgeKey};
                console.log('egde params');
                console.log(params);
                Edge.delete($scope, params);
            } else {
                if ($scope.itemToDisassociate.type == 'competitor') {
                    console.log('in competitor');
                    var params = {
                        'id': $scope.opportunity.id,
                        'removed_competitor': $scope.itemToDisassociate.item.entityKey
                    };
                    Opportunity.patch($scope, params)
                }
                ;
            }
            ;

            $scope.itemToDisassociate.array.splice($scope.itemToDisassociate.array.indexOf($scope.itemToDisassociate.item), 1);
            $scope.itemToDisassociate = {};
            $('#beforedelinkContact').modal('hide');
            $scope.apply();
        }
        $scope.addPhoneToContact = function (phone, contact) {
            if (phone.number) {
                params = {
                    'parent': contact.entityKey,
                    'kind': 'phones',
                    'fields': [
                        {
                            "field": "type",
                            "value": "work"
                        },
                        {
                            "field": "number",
                            "value": phone.number
                        }
                    ]
                };
                $scope.relatedInfonode = {
                    contact: contact,
                    infonode: {
                        'kind': 'phones',
                        'item': {
                            "type": phone.type,
                            "number": phone.number
                        }
                    }
                };
                InfoNode.insert($scope, params);
            }
        }
        $scope.listInfonodes = function (kind) {

            if (!$scope.isEmpty($scope.relatedInfonode)) {
                console.log('phone inserted');
                console.log($scope.relatedInfonode);
                if ($scope.relatedInfonode.contact[$scope.relatedInfonode.infonode.kind] == undefined) {
                    $scope.relatedInfonode.contact[$scope.relatedInfonode.infonode.kind] = {};
                    $scope.relatedInfonode.contact[$scope.relatedInfonode.infonode.kind].items = [];
                }
                ;
                $scope.relatedInfonode.contact[$scope.relatedInfonode.infonode.kind].items.push($scope.relatedInfonode.infonode.item);
                $scope.apply();
            } else {
                params = {
                    'parent': $scope.account.entityKey,
                    'connections': kind
                };
                InfoNode.list($scope, params);
            }
            ;

        }
        $scope.addEmailToContact = function (email, contact) {
            console.log(email);
            console.log(email);
            if (email.email) {
                params = {
                    'parent': contact.entityKey,
                    'kind': 'emails',
                    'fields': [
                        {
                            "field": "email",
                            "value": email.email
                        }
                    ]
                };
            }
            $scope.relatedInfonode = {
                contact: contact,
                infonode: {
                    'kind': 'emails',
                    'item': {
                        "email": email.email
                    }
                }
            };
            InfoNode.insert($scope, params);
        }

        $scope.deleteTimeItem = function (item) {
            Opportunity.deleteTimeItem($scope, item)
      }
        $scope.timeItemDeleted = function (item) {
            $scope.opportunity.timeline.items.splice($scope.opportunity.timeline.items.indexOf(item), 1);
            $scope.apply();
        };
      $scope.addTagsTothis = function () {

            var tags = [];
            var items = [];
            tags = $('#select2_sample2').select2("val");
            console.log("tagstags");
            console.log(tags);
            angular.forEach(tags, function (tag) {
                var params = {
                    'parent': $scope.opportunity.entityKey,
                    'tag_key': tag
                };
                console.log("tagtagtags");
                console.log(tag);
                Tag.attach($scope, params, -1, 'opportunity');
            });
            $('#select2_sample2').select2("val", "");
            $('#assigneeTagsToOpp').modal('hide');
        };
          $scope.tagattached = function(tag, index) {
            if (index>=0) {
              if ($scope.opportunity.tags == undefined) {
                $scope.opportunity.tags = [];
              }
              console.log("$scope.opportunity.tags");
              console.log($scope.opportunity.tags);
              console.log("tag");
              console.log(tag);
              var ind = $filter('exists')(tag, $scope.opportunity.tags);
              if (ind == -1) {
                  $scope.opportunity.tags.push(tag);
                  
              } else {
                console.log()
              }
              $('#select2_sample2').select2("val", "");
            }else{
              $scope.opportunity.tags.push(tag);
            };
            
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
         $scope.opportunity.tags.splice(index, 1);
         $scope.apply();
        }
        $scope.oppDeleted=function(){
          window.location.replace('#/opportunities'); 
        }
//  

  $scope.isEmptyArray=function(Array){
                if (Array!=undefined && Array.length>0) {
                return false;
                }else{
                    return true;
                };    
            
        }

  //
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
     //$('#addLeadModal').modal('show');
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
                          'parent': $scope.opportunity.entityKey,
                          'access': $scope.opportunity.access
                }

            }else{
                params ={'title': task.title,
                         'parent': $scope.opportunity.entityKey,
                         'access': $scope.opportunity.access
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
     $scope.$watch('opportunity.closed_date', function(newValue, oldValue) {
            if (newValue!=oldValue){
                $scope.patchDate(newValue);
                $scope.showStartsCalendar=false;
            }

     });
     $scope.patchDate = function(newValue){
        var closed_at = $filter('date')(newValue,['yyyy-MM-ddTHH:mm:00.000000']);
        var params = {
                    'id':$scope.opportunity.id,
                    'closed_date':closed_at
        };
        if (!$scope.isLoading){
          Opportunity.patch($scope,params);
        }
     }
     $scope.hilightTask = function(){
        console.log('Should higll');
        $('#task_0').effect("highlight","slow");
        $('#task_0').effect( "bounce", "slow" );

     }
     $scope.listTasks = function(){
        var params = {
                        'id':$scope.opportunity.id,
                        'tasks':{}
                      };
        Opportunity.get($scope,params);

     }
     $scope.editOpp = function(){

      $('#EditOpportunityModal').modal('show')
     }
     $scope.updateOppName=function(value){
      var params={'id':$scope.opportunity.id,'name':value};
      Opportunity.patch($scope,params);
     }
     $scope.updateOpportunityPrice=function(){
      if($scope.opportunity.duration_unit!='fixed'){
        $scope.opportunity.amount_total=$scope.opportunity.duration*$scope.opportunity.amount_per_unit;
      }else{
        $scope.opportunity.amount_total=$scope.opportunity.amount_per_unit;
      }
      var params={'id':$scope.opportunity.id, 'currency':$scope.opportunity.currency, 'duration_unit':$scope.opportunity.duration_unit,'duration':$scope.opportunity.duration, 'amount_per_unit':$scope.opportunity.amount_per_unit,'amount_total':$scope.opportunity.amount_total}
      Opportunity.patch($scope,params);
      $scope.showPriceForm=false;
     }
     $scope.TopiclistNextPageItems = function(){


        var nextPage = $scope.topicCurrentPage + 1;
        var params = {};
          if ($scope.topicpages[nextPage]){
            params = {
                      'id':$scope.opportunity.id,
                        'topics':{
                          'limit': '7',
                          'pageToken':$scope.topicpages[nextPage]
                        }
                     }
            $scope.topicCurrentPage = $scope.topicCurrentPage + 1 ;
            Opportunity.get($scope,params);
            }


     }

     $scope.waterfallTrigger= function(){
          $( window ).trigger( "resize" );
     };
     $scope.listTopics = function(opportunity){
        var params = {
                      'id':$scope.opportunity.id,
                      'topics':{
                             'limit': '7'
                       }
                    };
          Opportunity.get($scope,params);

     }
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
      
         var body = {'access':$scope.opportunity.access};
         var id = $scope.opportunity.id;
         var params ={'id':id,
                      'access':$scope.opportunity.access}
         Opportunity.patch($scope,params);
           // who is the parent of this event .hadji hicham 21-07-2014.

                params["parent"]="opportunity";
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
                            'about': $scope.opportunity.entityKey,
                            'items': items
              }
              Permission.insert($scope,params);
          }


          $scope.sharing_with = [];
          $scope.slected_memeber={};


        }


     };

/******************new event form***********************/
// HADJI HICHAM 31/05/2015 

$scope.showAddEventPopup=function(){  

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
                //$scope.filterResult(resp.items);
                $scope.inviteResults = resp.items;
                $scope.$apply();
              };

            });
        }

     });


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
   if($scope.invites.length !=0){
   $scope.Guest_params=true;
 }else{
  $scope.Guest_params=false;
 }
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
$scope.timezoneChosen="";
$('#timeZone').on('change', function() {


     $scope.timezoneChosen=this.value;
});

// $scope.checkallday=function(){
//   $scope.allday=$scope.alldaybox;  
//    }

    
/********************************************/
 //HKA 10.11.2013 Add event
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
                      'access':$scope.opportunity.access,
                      'description':$scope.ioevent.note,
                      'invites':$scope.invites,
                      'parent':  $scope.opportunity.entityKey,
                      'guest_modify':$scope.guest_modify.toString(),
                      'guest_invite':$scope.guest_invite.toString(),
                      'guest_list':$scope.guest_list.toString(),
                      'reminder':$scope.reminder,
                      'method':$scope.method,
                      'timezone':$scope.timezoneChosen

                        }



                  }else{

                        console.log("yeah babay");
                        console.log($scope.allday);

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
                      'access':$scope.opportunity.access,
                      'description':$scope.ioevent.note,
                      'invites':$scope.invites,
                      'parent':  $scope.opportunity.entityKey,
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
                      'access':$scope.opportunity.access,
                      'description':$scope.ioevent.note,
                      'invites':$scope.invites,
                      'parent':  $scope.opportunity.entityKey,
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
                  $scope.timezone="";
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
        
     }
    }

/*******************************************************/ 

// //HKA 11.11.2013 Add new Event
//  $scope.addEvent = function(ioevent){

//    /*****************************/

//              if ($scope.newEventform==false) {
//                 $scope.newEventform=true;
//            }else{


//             if (ioevent.title!=null&&ioevent.title!="") {

//                     var params ={}


//                   // hadji hicham 13-08-2014.
//                   if($scope.allday){
//                          var ends_at=moment(moment(ioevent.starts_at_allday).format('YYYY-MM-DDT00:00:00.000000'))

//                    params ={'title': ioevent.title,
//                             'starts_at': $filter('date')(ioevent.starts_at_allday,['yyyy-MM-ddT00:00:00.000000']),
//                             'ends_at':ends_at.add('hours',23).add('minute',59).add('second',59).format('YYYY-MM-DDTHH:mm:00.000000'),
//                             'where': ioevent.where,
//                             'parent':$scope.opportunity.entityKey,
//                             'allday':"true",
//                             'access': $scope.opportunity.access
//                       }



//                   }else{

//                   if (ioevent.starts_at){
//                     if (ioevent.ends_at){
//                       params ={'title': ioevent.title,
//                               'starts_at': $filter('date')(ioevent.starts_at,['yyyy-MM-ddTHH:mm:00.000000']),
//                               'ends_at': $filter('date')(ioevent.ends_at,['yyyy-MM-ddTHH:mm:00.000000']),
//                               'where': ioevent.where,
//                               'parent':$scope.opportunity.entityKey,
//                               'allday':"false",
//                               'access': $scope.opportunity.access
//                       }

//                     }else{
//                       params ={
//                         'title': ioevent.title,
//                               'starts_at': $filter('date')(ioevent.starts_at,['yyyy-MM-ddTHH:mm:00.000000']),
//                               'where': ioevent.where,
//                               'parent':$scope.account.entityKey,
//                               'ends_at':moment(ioevent.ends_at).add('hours',2).format('YYYY-MM-DDTHH:mm:00.000000'),
//                               'allday':"false",
//                               'access':$scope.opportunity.access
//                       }
//                     }




//                   }


//                   }

//                    Event.insert($scope,params);
//                   $scope.ioevent={};
//                   $scope.newEventform=false;



//         }
//      }

// /*******************/



//     };

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

     };
     $scope.listEvents = function(){
        var params = {
                        'id':$scope.opportunity.id,
                        'events':{

                        }
                      };
        Opportunity.get($scope,params);

     };


 //HKA 11.11.2013 Add Note
  $scope.addNote = function(note){
    var params ={
                  'about': $scope.opportunity.entityKey,
                  'title': note.title,
                  'content': note.content
      };
    Note.insert($scope,params);
    $scope.note.title='';
    $scope.note.content='';
  };
// 26.11.2013 Update Opportunity
 $scope.UpdateOpportunity = function(opportunity){
  var params = {
                'id':$scope.opportunity.id,
                'owner':$scope.ownerSelected.google_user_id,
                'name':opportunity.name,
                'description':opportunity.description
              };


  Opportunity.patch($scope,params);

 //$scope.$watch($scope.opportunity.stagename, $scope.createNote());
  /*$scope.$watch($scope.opportunity.stagename, function(newVal, oldVal) {
     var paramsNote = {
                  'about_kind': 'Opportunity',
                  'about_item': $scope.opportunity.id,
                  'title': 'stage updated to '+ $scope.stage_selected.name

      };


      Note.insert($scope,paramsNote);
   });*/
  $('#EditOpportunityModal').modal('hide');
 };
 $scope.updateOpportunityStage = function(stage){
   if (stage) {
    var params = {
                  'entityKey':$scope.opportunity.entityKey,
                  'stage': stage.entityKey
    };
  }else{
      var params = {
                  'entityKey':$scope.opportunity.entityKey,
                  'stage': $scope.opportunity.current_stage.entityKey
    };
  };
    
    Opportunity.update_stage($scope,params);
 }

$scope.createNote = function(){

    var paramsNote = {
                  'about_kind': 'Opportunity',
                  'about_item': $scope.opportunity.id,
                  'title': 'stage updated to '+ $scope.stage_selected.name

      };
       Note.insert($scope,paramsNote);
};

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
                  'about':$scope.opportunity.entityKey
                  };
        if ($scope.sendWithAttachments){
            params['files']={
                            'parent':$scope.opportunity.entityKey,
                            'access':$scope.opportunity.access,
                            'items':$scope.sendWithAttachments
                            };
        };
        
        Email.send($scope,params);
      };

 //HKA 29.12.2013 Delete Opportunity
 $scope.editbeforedelete = function(){
     $('#BeforedeleteOpportunity').modal('show');
   };
$scope.deleteopportunity= function(){
     var params = {'entityKey':$scope.opportunity.entityKey};
     Opportunity.delete($scope,params);
     $('#BeforedeleteOpportunity').modal('hide');
     };

     $scope.DocumentlistNextPageItems = function(){


        var nextPage = $scope.documentCurrentPage + 1;
        var params = {};
          if ($scope.documentpages[nextPage]){
            params = {
                        'id':$scope.opportunity.id,
                        'documents':{
                          'limit': '15',
                          'pageToken':$scope.documentpages[nextPage]
                        }
                      }
            $scope.documentCurrentPage = $scope.documentCurrentPage + 1 ;

            Opportunity.get($scope,params);

          }


     }

     $scope.listDocuments = function(){
        var params = {
                        'id':$scope.opportunity.id,
                        'documents':{
                          'limit': '15'
                        }
                      }
        Opportunity.get($scope,params);

     };
     $scope.showCreateDocument = function(type){

        $scope.mimeType = type;
        $('#newDocument').modal('show');
     };
     $scope.createDocument = function(newdocument){
        var mimeType = 'application/vnd.google-apps.' + $scope.mimeType;
        var params = {
                      'parent': $scope.opportunity.entityKey,
                      'title':newdocument.title,
                      'mimeType':mimeType
                     };
        Attachement.insert($scope,params);

     };
     $scope.createPickerUploader = function() {
          var developerKey = 'AIzaSyDHuaxvm9WSs0nu-FrZhZcmaKzhvLiSczY';
          var projectfolder = $scope.opportunity.folder;
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
                              'access': $scope.opportunity.access,
                              'parent':$scope.opportunity.entityKey
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
      };

  //06.03.2014 Edit Close date, Reason lost, Main competitor, Type, Description, Source : show Modal
     $scope.editclosedate = function(){
     $('#EditCloseDate').modal('show')
     };
     $scope.editcompetitor = function(){
     $('#EditCompetitor').modal('show')
     };
     $scope.editreasonlost = function(){
     $('#EditReasonLost').modal('show')
     };
     $scope.editdescription = function(){
     $('#EditDescription').modal('show')
     };
      $scope.edittype = function(){
     $('#EditType').modal('show')
     };
     $scope.editsource = function(){
     $('#EditSource').modal('show')
     };

    //07.03.2014 update Close date, Reason lost, Main competitor, Type, Description, Source

     $scope.updateClosedate = function(opportunity){
      console.log('***************close date**************');
      console.log(opportunity.closed_date);
      var close_at = $filter('date')(opportunity.closed_date,['yyyy-MM-ddTHH:mm:00.000000']);
      console.log(close_at);
      params = {'id':$scope.opportunity.id,
              'closed_date':close_at};
      Opportunity.patch($scope,params);
      $('#EditCloseDate').modal('hide');
     };

     $scope.updateCompetitor = function(opportunity){
      params = {'id':$scope.opportunity.id,
             'competitor':opportunity.competitor};
      Opportunity.patch($scope,params);
      $('#EditCompetitor').modal('hide');
     };

     $scope.updateReasonlost = function(opportunity){
      params = {'id':$scope.opportunity.id,
              'reason_lost':opportunity.reason_lost};
      Opportunity.patch($scope,params);
      $('#EditReasonLost').modal('hide');
     };

     $scope.updateDescription = function(opportunity){
      params = {'id':$scope.opportunity.id,
              'description':opportunity.description};
      Opportunity.patch($scope,params);
      $('#EditDescription').modal('hide');
     };


     $scope.updateType = function(opportunity){
      params = {'id':$scope.opportunity.id,
              'opportunity_type':opportunity.opportunity_type};
      Opportunity.patch($scope,params);
      $('#EditType').modal('hide');
     };


     $scope.updatsource = function(opportunity){
      params = {'id':$scope.opportunity.id,
              'source':opportunity.source};
      Opportunity.patch($scope,params);
      $('#EditSource').modal('hide');
     };

    //HKA 07.03.2014 Add Custom field

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
                            'parent': $scope.opportunity.entityKey,
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
     params = {'parent':$scope.opportunity.entityKey,
               'connections': kind
              };
     InfoNode.list($scope,params);

 };
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

  /// update account with inlineEdit
  $scope.isEmpty=function(obj){
        return jQuery.isEmptyObject(obj);
  }
  $scope.inlinePatch=function(kind,edge,name,entityKey,value){

   if (kind=='Opportunity') {         
          var params={};
                switch(name){
                  case "name": 
                  params.name=value;  
                  break;
                  case "owner":
                  params.owner=value; 
                  break;
                }
                if (!$scope.isEmpty(params)) {
                  params.id=entityKey;
                  Opportunity.patch($scope,params);
                }
   }else{



          params = {
                  'entityKey': entityKey,
                  'parent':$scope.opportunity.entityKey,
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
            console.log("delete collaborators")
            var item = {
                          'type':"user",
                          'value':entityKey,
                          'about':$scope.opportunity.entityKey
                        };
            Permission.delete($scope,item)
            console.log(item)
        };
    // Google+ Authentication
    Auth.init($scope);
    $(window).scroll(function() {
         if (!$scope.isLoading && ($(window).scrollTop() >  $(document).height() - $(window).height() - 100)) {
             $scope.listMoreOnScroll();
         }
     });

}]);

app.controller('OpportunityNewCtrl', ['$scope', '$http', '$filter', '$q', 'Auth', 'Account', 'Contact', 'Opportunitystage', 'Opportunity', 'Edge', 'Linkedin','Customfield',
    function ($scope, $http, $filter, $q, Auth, Account, Contact, Opportunitystage, Opportunity, Edge, Linkedin,Customfield) {
      $("ul.page-sidebar-menu li").removeClass("active");
      $("#id_Opportunities").addClass("active");
      document.title = "Opportunities: New";
      trackMixpanelAction('OPPORTUNITY_NEW_VIEW');
      $scope.isSignedIn = false;
      $scope.immediateFailed = false;
      $scope.nextPageToken = undefined;
      $scope.prevPageToken = undefined;
      $scope.pagination = {};
      $scope.isLoading = false;
      $scope.nbLoads=0;
      $scope.leadpagination = {};
      $scope.currentPage = 01;
      $scope.pages = [];
      $scope.stage_selected={};
      $scope.accounts = [];
      $scope.account = {};
      $scope.account.access ='public';
      $scope.opportunity={};
      $scope.oppo_err={
                      'name':false,
                      'amount_per_unit':false,
                      'account':false,
                      'contact':false,
                      };
      $scope.opportunity.access ='public';
      $scope.order = '-updated_at';
      $scope.status = 'New';
      $scope.showPriceForm =false;
      $scope.customfields=[];
      $scope.account.account_type = 'Customer';
      $scope.account.industry = 'Technology';
      $scope.stage_selected={};
      $scope.opportunitystages=[];
      $scope.opportunity={access:'public',currency:'USD',duration_unit:'fixed',closed_date:new Date()};
      $scope.users=[];
      $scope.opportunity.estimated=null;
      $scope.imageSrc = '/static/img/default_company.png';
      $scope.opportunity.contacts=[];
      $scope.contacts=[];
      $scope.competitors=[];
      $scope.opportunity.competitors=[];
      $scope.newnote={};
      $scope.notes=[];
      $scope.contact={};
      $scope.newcontacts=[];
      $scope.opportunity.notes=[];
      $scope.currentContact={};
      $scope.currentContact.sociallinks=[];
      $scope.currentContact.websites=[];
      $scope.opportunity.timeline = [];
      $scope.opportunities=[];
      $scope.opportunities.customfields=[];
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
     $scope.clearOpp=function(){
              $scope.oppo_err={
                              'name':false,
                              'amount_per_unit':false,
                              'account':false,
                              'contact':false,
                              };
              $scope.opportunity.access ='public';
              $scope.status = 'New';
              $scope.customfields=[];
              $scope.account.account_type = 'Customer';
              $scope.account.industry = 'Technology';
              $scope.stage_selected={};
              $scope.opportunity={access:'public',currency:'USD',duration_unit:'fixed',closed_date:new Date()};
              $scope.opportunity.estimated=null;
              $scope.opportunity.contacts=[];
              $scope.contacts=[];
              $scope.competitors=[];
              $scope.opportunity.competitors=[];
              $scope.newnote={};
              $scope.notes=[];
              $scope.contact={};
              $scope.newcontacts=[];
              $scope.opportunity.notes=[];
              $scope.currentContact={};
              $scope.currentContact.sociallinks=[];
              $scope.currentContact.websites=[];
              $scope.opportunity.timeline = [];
              $scope.opportunity.notes=[];
              $scope.status_selected={};
              $scope.customfields=[];
              $scope.searchContactQuery="";
              $scope.searchAccountQuery="";
              angular.forEach($scope.opportunities.customfields, function (cusfield) {
                    cusfield.value="";
                });
              $('#leadEventStartsAt').val('');
              $scope.apply();
            }   
     $scope.linkedinUrl=function(url){
                         console.log("urrrrrl linkedin");
                         console.log(url);
                         
                         var match="";
                         var matcher = new RegExp("linkedin");
                         var test = matcher.test(url);
                         console.log(test);                        
                         return test;
        }
        $scope.apply=function(){
         
          if ($scope.$root.$$phase != '$apply' && $scope.$root.$$phase != '$digest') {
               $scope.$apply();
              }
              return false;
        }
      $scope.initObject=function(obj){
          for (var key in obj) {
                obj[key]=null;
              }
      }
      $scope.addNewContact = function(current) {
            console.log('in add contact');
            console.log(current);
            if (current.firstname != null && current.lastname != null) {
                $scope.contact=current;
                $scope.contact.access = $scope.opportunity.acces;

                if (current.phone != null) {
                    $scope.contact.phones = [{'number': current.phone, 'type': 'work'}];
                }
                if (current.email != null) {
                    $scope.contact.emails = [{'email': current.email}];
                }
                if (current.address != null) {
                    $scope.contact.addresses = [{'formatted': current.address}];
                }

                Contact.insert($scope, $scope.contact)
                $scope.currentContact = {};
            } else {
                $scope.currentContact = {};
               /* $scope.newContactform = false;*/
            }
            console.log('hhhhhhhhhhhhhhhhhere save new contact');
            console.log($scope.newcontacts);

        }
        $scope.contactInserted = function (resp) {
            if ($scope.newcontacts == undefined) {
                $scope.newcontacts = [];
            }
            ;
            $scope.newcontacts.push(resp);
            $scope.apply();
            //$scope.opportunity.contact = resp.entityKey;   
        }
      $scope.addNote = function(){
       $scope.opportunity.notes.push($scope.newnote)
       $scope.newnote={}
       console.log("adding notes");
     }
      $scope.changeInitialStage=function(stage){
        $scope.initialStage=stage;
        console.log($scope.initialStage.probability);
      }
      $scope.pullElement=function(index,elem,arr){
        if ($scope.customfields.indexOf(elem) != -1) {
            $scope.customfields.splice(index, 1);
        }
      }
      $scope.pullFromArray=function(index,elem,arr){
        if (arr.indexOf(elem) != -1) {
            arr.splice(index, 1);
        }
      }
      $scope.showRemove=function(id){
        $('#'+id).addClass('hidden');
      }
      $scope.hideRemove=function(id){
       $('#'+id).removeClass('hidden');
      }
      $scope.pushElement=function(elem,arr){

          if (arr.indexOf(elem) == -1) {
          if (elem.field && elem.value) {
                        var copyOfElement = angular.copy(elem);
                        arr.push(copyOfElement);
                        console.log(elem);
                        $scope.initObject(elem); 
                      }

                    }else{
                      alert("item already exit");
                    }
                }
      $scope.runTheProcess = function(){
           $scope.getCustomFields("opportunities");
           Opportunitystage.list($scope,{'order':'probability'});
           ga('send', 'pageview', '/opportunities/new');
           window.Intercom('update');
       };
        // We need to call this to refresh token when user credentials are invalid
       $scope.refreshToken = function() {
            Auth.refreshToken();
       };
       $scope.getCustomFields=function(related_object){
            Customfield.list($scope,{related_object:related_object});
        }
        $scope.listResponse=function(items,related_object){
            $scope[related_object].customfields=items;
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




  $scope.isEmptyArray=function(Array){
                if (Array!=undefined && Array.length>0) {
                return false;
                }else{
                    return true;
                };    
            
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

                          }
            infonodes.push(infonode);
        });
        return infonodes;
    };
      var params_search_competitor ={};
      $scope.$watch('searchCompetitorQuery', function() {
        if($scope.searchCompetitorQuery){
            if($scope.searchCompetitorQuery.length>1){
              params_search_competitor['q'] = $scope.searchCompetitorQuery;
              gapi.client.crmengine.accounts.search(params_search_competitor).execute(function(resp) {
                if (resp.items){
                $scope.competitorsResult = resp.items;
                console.log($scope.competitorsResult);
                $scope.apply();
              };
            });
          }
        }
      });
      $scope.selectCompetitor = function(){
        console.log("enter fired");
        console.log($scope.searchCompetitorQuery);
        if (typeof($scope.searchCompetitorQuery)=='object') {
           console.log("enter object");
           $scope.competitors.push($scope.searchCompetitorQuery);
           $scope.opportunity.competitors.push($scope.searchCompetitorQuery.entityKey);
        }else{
           if ($scope.searchCompetitorQuery!="") {
             console.log("enter string");
            $scope.competitors.push({name:$scope.searchCompetitorQuery});
            $scope.opportunity.competitors.push($scope.searchCompetitorQuery);
           };          
        };   
        $scope.searchCompetitorQuery="";  
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
                console.log($scope.contactsResults);
                $scope.apply();
              };
            });
          }
        }
      });
     $scope.selectContact = function(){
        if (typeof($scope.searchContactQuery)=='object') {
            $scope.searchContactQuery.is_decesion_maker = false;
           $scope.contacts.push($scope.searchContactQuery);


        }else{
            console.log('test searchContactQuery');
            console.log($scope.searchContactQuery);
            if ($scope.searchContactQuery != "") {
                $scope.contacts.push({full_name: $scope.searchContactQuery, is_decesion_maker: false});

            }
            ;
           

        };   
        $scope.searchContactQuery="";    
       
        /*var account = {
                      'entityKey':$scope.searchContactQuery.account.entityKey,
                      'name':$scope.searchContactQuery.account.name
                    };
        $scope.opportunity.account = account;
        $scope.searchAccountQuery = $scope.searchContactQuery.account.name;*/
      };
        // map search in


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
        $scope.getAccountsResults = function (val) {
            console.log('here executed');
            var url = ROOT + '/crmengine/v1/accounts/search?alt=json'
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

      var params_search_account ={};
      $scope.result = undefined;
      $scope.q = undefined;
        $scope.$watch('searchAcountQuery', function () {
          params_search_account['q'] = $scope.searchAccountQuery;
          Account.search($scope,params_search_account);
      });

      $scope.selectAccount = function(){
          $scope.opportunity.account  = $scope.searchAccountQuery;
      };
      $scope.insertNewContact = function(account,access){
          if($scope.searchContactQuery.length>0){
            var firstName = $scope.searchContactQuery.split(' ').slice(0, -1).join(' ') || " ";
            var lastName = $scope.searchContactQuery.split(' ').slice(-1).join(' ') || " ";
            var params = {
                          'firstname':  firstName ,
                          'lastname': lastName ,
                          'account': account,
                          'access': access
                        };
            Contact.insert($scope,params);
          };
      }


        $scope.$watch('opportunity', function (newVal, oldVal) {
          if (newVal.name)  $scope.oppo_err.name=false;
          if (newVal.amount_per_unit )$scope.oppo_err.amount_per_unit =false;
          if (newVal.account )$scope.oppo_err.account =false;
      }, true); 
      $scope.$watch('searchAccountQuery', function(newVal, oldVal){
          if (newVal )$scope.oppo_err.account =false;
      });   
      $scope.$watch('searchContactQuery', function(newVal, oldVal){
          if (newVal )$scope.oppo_err.contact =false;
      });
      $scope.showAddEventPopup=function(){
        $('#newEventModalForm').modal("show");  
      }
      $scope.validateBeforeSave=function(opportunity){
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
      $scope.save = function(opportunity){
          angular.forEach($scope.contacts, function (contact) {
              if (contact.entityKey) {
                  $scope.opportunity.contacts.push({
                      'contact': contact.entityKey,
                      is_decesion_maker: contact.is_decesion_maker
                  });
              } else {
                  $scope.opportunity.contacts.push({
                      'contact': contact.full_name,
                      is_decesion_maker: contact.is_decesion_maker
                  });
              }
              ;
          });
          console.log('opportunity contacts');
          console.log($scope.opportunity.contacts);
          opportunity.infonodes = $scope.prepareInfonodes();
            // prepare amount attributes
            
            if (opportunity.duration_unit=='fixed'){
              opportunity.amount_total = parseInt(opportunity.amount_per_unit);
              opportunity.opportunity_type = 'fixed_bid';
            }else{
              opportunity.opportunity_type = 'per_' + opportunity.duration_unit;
              opportunity.amount_total = opportunity.amount_per_unit * opportunity.duration;
            }
          if (typeof($scope.searchAccountQuery)=='object'){
            var accountKey = $scope.searchAccountQuery.entityKey;
            opportunity.account = accountKey;
          }else{
            opportunity.account=$scope.searchAccountQuery;
          }
        /*  if (typeof($scope.searchContactQuery)=='object'){
            var contactKey = $scope.searchContactQuery.entityKey;
            opportunity.contact = contactKey;
          }else{
            opportunity.contact=$scope.searchContactQuery;
          }*/
          var closed_date = $filter('date')(opportunity.closed_date,['yyyy-MM-dd']);
          opportunity.stage=$scope.initialStage.entityKey;
          opportunity.closed_date=closed_date;
          console.log('hereeeeeeeeeeeeeee opportunity before save');
          console.log(opportunity);
          Opportunity.insert($scope,opportunity);
      
      };
      $scope.accountInserted = function(resp){
          $scope.opportunity.account = resp.entityKey;
          console.log($scope.opportunity);
          // Opportunity.insert($scope,$scope.opportunity);
         
      };
      $scope.contactInserted = function(resp){
          $scope.opportunity.contact = resp.entityKey;
          // Opportunity.insert($scope,$scope.opportunity);
          
      }
      $scope.opportunityInserted = function(resp){
          window.location.replace('#/opportunities');
      };
         $scope.getLinkedinProfile=function(){
              var params={
                "firstname":$scope.currentContact.firstname,
                "lastname":$scope.currentContact.lastname
                }
                var linkedurl=null;
                $scope.inNoResults=false;
                if ($scope.currentContact.sociallinks==undefined) {
                  $scope.currentContact.sociallinks=[];
                };
                var savedEntityKey=null;
                if ($scope.currentContact.sociallinks.length > 0) {
                   angular.forEach($scope.currentContact.sociallinks, function(link){
                                    if ($scope.linkedinUrl(link.url)) {
                                      linkedurl=link.url;
                                      savedEntityKey=link.entityKey;
                                    };
                                });
                };
                 if (linkedurl) {
                    var par={'url' : linkedurl};
                   Linkedin.profileGet(par,function(resp){
                      if(!resp.code){
                       $scope.inProfile.fullname=resp.fullname;
                       $scope.inProfile.title=resp.title;
                       $scope.inProfile.formations=resp.formations
                       $scope.inProfile.locality=resp.locality;
                       $scope.inProfile.relation=resp.relation;
                       $scope.inProfile.industry=resp.industry;
                       $scope.linkedProfileresume=resp.resume;
                       $scope.inProfile.entityKey=savedEntityKey;
                       $scope.inProfile.url=linkedurl;
                       $scope.inProfile.resume=resp.resume;
                       $scope.inProfile.skills=resp.skills;
                       $scope.inProfile.current_post=resp.current_post;
                       $scope.inProfile.past_post=resp.past_post;
                       $scope.inProfile.certifications=JSON.parse(resp.certifications);
                       $scope.inProfile.experiences=JSON.parse(resp.experiences);
                       if($scope.inProfile.experiences){
                       $scope.inProfile.experiences.curr=$scope.inProfile.experiences['current-position'];
                       $scope.inProfile.experiences.past=$scope.inProfile.experiences['past-position'];
                       }
                       if ($scope.currentContact.addresses==undefined||$scope.currentContact.addresses==[]) {
                          $scope.addGeo({'formatted':$scope.inProfile.locality});
                        };
                       $scope.linkedLoader=false;
                       $scope.inIsLoading = false;
                       $scope.isLoading = false;
                       $scope.apply();
                      }else {
                        console.log("no 401");
                         if(resp.code==401){
                          // $scope.refreshToken();
                          $scope.isLoading = false;
                          $scope.apply();
                         };
                      }
                   });
                }else{
                  Linkedin.listPeople(params,function(resp){
                     $scope.inIsSearching=true;
                     $scope.inShortProfiles=[];
                     $scope.inProfile={};
                     if(!resp.code){
                      $scope.inIsSearching=false;
                      if (resp.items==undefined) {
                        $scope.inList=[];
                        $scope.inNoResults=true;
                        $scope.inIsSearching=false;
                      }else{
                        $scope.inList=resp.items;
                        if (resp.items.length < 4) {
                          console.log("in check of 3");
                          angular.forEach(resp.items, function(item){
                              console.log(item.url);
                              $scope.getLinkedinByUrl(item.url);
                        });
                        }
                      };
                         $scope.isLoading = false;
                         $scope.$apply();
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
                };
            }
           $scope.saveLinkedinUrl=function(shortProfile){
          //$scope.clearContact();
          $scope.inList=[];
          $scope.inShortProfiles=[];
          $scope.inProfile={};
          $scope.inProfile=shortProfile;
          console.log("shoooort profile");
          console.log($scope.inProfile);
          $scope.sociallink={'url':$scope.inProfile.url};
          $scope.savedSociallink=$scope.inProfile.url;
          $scope.currentContact.sociallinks.push($scope.sociallink);
          $scope.imageSrc = $scope.inProfile.profile_picture;
          $scope.currentContact.profile_img_url = $scope.inProfile.profile_picture;
          if ($scope.inProfile.title) {
            $scope.currentContact.title = $scope.inProfile.title;
          };
          if($scope.inProfile.current_post){
                
              }
          if (!$scope.addressModel) {
                    $scope.addressModel=$scope.inProfile.locality;
                  }else{
                    if ($scope.addressModel.length < $scope.inProfile.locality.length) {
                          $scope.addressModel=$scope.inProfile.locality;
                    };
                  };
          $scope.apply();
      }
       $scope.getLinkedinByUrl=function(url){
               $scope.inIsLoading=true;
               var par={'url' : url};
               Linkedin.profileGet(par,function(resp){
                      if(!resp.code){
                         prof={};
                         prof.fullname=resp.fullname;
                         prof.url=url;
                         prof.profile_picture=resp.profile_picture;
                         prof.title=resp.title;
                         prof.locality=resp.locality;
                         prof.industry=resp.industry; 
                         prof.formations=resp.formations
                         prof.resume=resp.resume;
                         prof.skills=resp.skills;
                         prof.current_post=resp.current_post;
                         prof.past_post=resp.past_post;
                         prof.experiences=JSON.parse(resp.experiences);  
                         if(prof.experiences){
                          prof.experiences.curr=prof.experiences['current-position'];
                          prof.experiences.past=prof.experiences['past-position'];
                         }         
                         $scope.inShortProfiles.push(prof);
                         $scope.inIsLoading=false;
                         $scope.apply();
                      }else {
                         if(resp.code==401){
                          $scope.inIsLoading=false;
                          $scope.apply();
                         };
                      }
                   });
            }
               $scope.twitterUrl=function(url){
                         var match="";
                         var matcher = new RegExp("twitter");
                         var test = matcher.test(url);                        
                         return test;
        }
        $scope.getTwitterProfile=function(){
              console.log("getTwitterProfile");
              var params={
                "firstname":$scope.currentContact.firstname,
                "lastname":$scope.currentContact.lastname
                }
                var twitterurl=null;
                $scope.twNoResults=false;
                if ($scope.currentContact.sociallinks==undefined) {
                  $scope.currentContact.sociallinks=[];
                };
                var savedEntityKey=null;
                if ($scope.currentContact.sociallinks.length > 0) {
                   angular.forEach($scope.currentContact.sociallinks, function(link){
                                    if ($scope.twitterUrl(link.url)) {
                                      twitterurl=link.url;
                                      savedEntityKey=link.entityKey;
                                    };
                                });
                };
                 if (twitterurl) {
                    var par={'url' : twitterurl};
                   Linkedin.getTwitterProfile(par,function(resp){
                      if(!resp.code){
                       $scope.twProfile.name=resp.name;
                       $scope.twProfile.screen_name=resp.screen_name;
                       $scope.twProfile.created_at=resp.created_at
                       $scope.twProfile.description_of_user=resp.description_of_user;
                       $scope.twProfile.followers_count=resp.followers_count;
                       $scope.twProfile.friends_count=resp.friends_count; 
                       $scope.twProfile.id=resp.id; 
                       $scope.twProfile.lang=resp.lang; 
                       $scope.twProfile.language=resp.language; 
                       $scope.twProfile.last_tweet_favorite_count=resp.last_tweet_favorite_count; 
                       $scope.twProfile.last_tweet_retweet_count=resp.last_tweet_retweet_count; 
                       $scope.twProfile.last_tweet_text=resp.last_tweet_text; 
                       $scope.twProfile.location=resp.location; 
                       $scope.twProfile.nbr_tweets=resp.nbr_tweets; 
                       $scope.twProfile.profile_banner_url=resp.profile_banner_url+'/1500x500'; 
                       $scope.twProfile.profile_image_url_https=resp.profile_image_url_https; 
                       $scope.twProfile.url_of_user_their_company=resp.url_of_user_their_company; 
                       $scope.twProfile.entityKey=savedEntityKey;
                       $scope.twProfile.url=twitterurl;
                       if ($scope.currentContact.addresses==undefined||$scope.currentContact.addresses==[]) {
                          $scope.addGeo({'formatted':$scope.twProfile.location});
                        };
                       $scope.twIsLoading = false;
                       $scope.isLoading = false;
                       $scope.apply();
                      }else {
                        console.log("no 401");
                         if(resp.code==401){
                          // $scope.refreshToken();
                          $scope.isLoading = false;
                          $scope.apply();
                         };
                      }
                   });
                }else{
                  Linkedin.getTwitterList(params,function(resp){
                     $scope.twIsSearching=true;
                     $scope.twShortProfiles=[];
                     $scope.twProfile={};
                     if(!resp.code){
                      $scope.twIsSearching=false;
                      if (resp.items==undefined) {
                        $scope.twList=[];
                        $scope.twNoResults=true;
                        $scope.twIsSearching=false;
                      }else{
                        console.log(resp.items);
                        $scope.twList=resp.items;
                        console.log($scope.twShortProfiles);
                        $scope.apply();
                        console.log($scope.twList.length)
                        if (resp.items.length < 4) {
                          console.log("in check of 3");
                          angular.forEach(resp.items, function(item){
                              console.log(item.url);
                              $scope.getTwitterByUrl(item.url);
                        });
                        }
                      };
                         $scope.isLoading = false;
                         $scope.apply();
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
                };
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
              $scope.getTwitterByUrl=function(url){
               $scope.twIsLoading=true;
               var par={'url' : url};
               Linkedin.getTwitterProfile(par,function(resp){
                      if(!resp.code){
                         prof={};
                         prof.name=resp.name;
                         prof.screen_name=resp.screen_name;
                         prof.created_at=resp.created_at
                         prof.description_of_user=resp.description_of_user;
                         prof.followers_count=resp.followers_count;
                         prof.friends_count=resp.friends_count; 
                         prof.id=resp.id; 
                         prof.lang=resp.lang; 
                         prof.language=resp.language; 
                         prof.last_tweet_favorite_count=resp.last_tweet_favorite_count; 
                         prof.last_tweet_retweet_count=resp.last_tweet_retweet_count; 
                         prof.last_tweet_text=resp.last_tweet_text; 
                         prof.location=resp.location; 
                         prof.nbr_tweets=resp.nbr_tweets; 
                         prof.profile_banner_url=resp.profile_banner_url+'/1500x500'; 
                         prof.profile_image_url_https=resp.profile_image_url_https; 
                         prof.url_of_user_their_company=resp.url_of_user_their_company; 
                         prof.url=url;
                         $scope.twShortProfiles.push(prof);
                         $scope.twIsLoading=false;
                         $scope.apply();
                      }else {
                         if(resp.code==401){
                          $scope.twIsLoading=false;
                          $scope.apply();
                         };
                      }
                   });
            }
              $scope.cancelSelection=function(arrayname){
                  console.log(arrayname)
                 $scope[arrayname]=[];
                 console.log("canceling");
                  console.log(arrayname)
                 $scope.apply();

              }
              $scope.saveTwitterUrl=function(shortProfile){
              //$scope.clearContact();
              $scope.twList=[];
              $scope.twShortProfiles =[];
              $scope.twProfile={};
              $scope.twProfile=shortProfile;
              $scope.sociallink={'url':$scope.twProfile.url};
              $scope.website={'url':$scope.twProfile.url_of_user_their_company};
              $scope.savedSociallink=$scope.twProfile.url;
              $scope.currentContact.sociallinks.push($scope.sociallink);
              /*$scope.currentContact.sociallinks.push($scope.sociallink);
              $scope.pushElement($scope.sociallink,$scope.currentContact.sociallinks,'sociallinks');
              $scope.pushElement($scope.website,$scope.currentContact.websites,'websites');*/
              if ($scope.imageSrc=='/static/img/avatar_contact.jpg'||$scope.imageSrc=='') {
                console.log("innnnnn no imageSrc");
                $scope.imageSrc=$scope.twProfile.profile_image_url_https;
                $scope.profile_img.profile_img_url = $scope.twProfile.profile_image_url_https;
              };
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
                    $scope.addressModel=$scope.twProfile.location; 
                  }else{
                    if ($scope.addressModel.length < $scope.twProfile.location.length) {
                      $scope.addressModel=$scope.twProfile.location;  
                    };
                  };
              
                 // $scope.addGeo({'formatted':$scope.twProfile.location});
              /*};*/
              $scope.apply();
          }

            $scope.prepareUrl=function(url){
                    var pattern=/^[a-zA-Z]+:\/\//;
                     if(!pattern.test(url)){                        
                         url = 'http://' + url;
                     }
                     return url;
        }
        $scope.isEmpty=function(obj){
          return jQuery.isEmptyObject(obj);
        }
        $scope.isEmptyArray=function(Array){
                  if (Array!=undefined && Array.length>0) {
                  return false;
                  }else{
                      return true;
                  };    
              
          }
        //HKA 10.11.2013 Add event
        $scope.addTimeScale = function (timescale) {
            if (timescale.title != null && timescale.title != "") {

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
                $('#newEventModalForm').modal('hide');

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
        /*******************************************************/






   // Google+ Authentication
     Auth.init($scope);


}]);
