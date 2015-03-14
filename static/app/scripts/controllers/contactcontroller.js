app.controller('ContactListCtrl', ['$scope','$filter','Auth','Account','Contact','Tag','Edge','Attachement', 'Email',
		function($scope,$filter,Auth,Account,Contact,Tag,Edge,Attachement,Email) {
				$("ul.page-sidebar-menu li").removeClass("active");
				$("#id_Contacts").addClass("active");
                document.title = "Contacts: Home";
				$scope.isSignedIn = false;
				$scope.immediateFailed = false;
				$scope.nextPageToken = undefined;
				$scope.prevPageToken = undefined;
				$scope.isLoading = false;
				$scope.nbLoads=0;
				$scope.isMoreItemLoading = false;
				$scope.contactpagination = {};
				$scope.selectedOption='all';
				$scope.currentPage = 01;
				//HKA 10.12.2013 Var Contact to manage Next & Prev
				$scope.contactpagination={};
				$scope.contactCurrentPage=01;
				$scope.contactpages = [];
				$scope.pages = [];
				$scope.contacts = [];
				$scope.contact = {};
				$scope.contact.access = 'public';
				$scope.order = '-updated_at';
				$scope.selected_tags = [];
				$scope.draggedTag=null;
				$scope.tag = {};
				$scope.showNewTag=false;
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
				 $scope.selectedContact=null;
				 $scope.currentContact=null;
				 $scope.contactToMail=null;
				 $scope.showTagsFilter=false;
     			 $scope.showNewTag=false;
                 $scope.file_type = 'outlook';
                 $scope.show="cards";
                 $scope.selectedCards=[];
        		 $scope.allCardsSelected=false; 
        		 $scope.moretext="";
        		 $scope.lesstext="";
        		 $scope.emailSentMessage=false;
        		 $scope.email={};
        		         $scope.smallModal=false;
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
						var params = {'order' : $scope.order,'limit':20}
						Contact.list($scope,params);
						var paramsTag = {'about_kind':'Contact'};
						Tag.list($scope,paramsTag);
						// for (var i=0;i<100;i++)
						// {
						//     var params = {
						//               'firstname': 'Dja3fer',
						//               'lastname':'M3amer ' + i.toString(),
						//               'access':'public',
						//               'account': 'ahNkZXZ-Z2NkYzIwMTMtaW9ncm93chQLEgdBY2NvdW50GICAgICAgIgKDA'
						//             }
						//     Contact.insert($scope,params);
						// }
						ga('send', 'pageview', '/contacts');
						if (localStorage['contactShow']!=undefined) {
            			   $scope.show=localStorage['contactShow'];
            			};
            			window.Intercom('update');

			 };

			 $('#some-textarea').wysihtml5();
        $scope.gotosendMail = function(email,contact){
             $scope.contactToMail=contact;
             $scope.email.to = email;
             $('#testnonefade').modal("show");
             $scope.smallSendMail();
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
          $('#testnonefade').addClass("emailModalOnBottom");
        }
        $scope.bigSendMail=function(){
          $('#testnonefade').removeClass("emailModalOnBottom");
          $( "body" ).append( '<div class="modal-backdrop fade in"></div>' );

        }
        $scope.sendEmail = function(email){
        KeenIO.log('send email');
        email.body = $('#some-textarea').val();
        var params = {
                  'to': email.to,
                  'cc': email.cc,
                  'bcc': email.bcc,
                  'subject': email.subject,
                  'body': email.body,
                  'about':$scope.contactToMail.entityKey
                  };
        if ($scope.sendWithAttachments){
            params['files']={
                            'parent':$scope.contactToMail.entityKey,
                            'access':$scope.contactToMail.access,
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
            $scope.contactToMail=null;
            $('#testnonefade').modal("hide");
             $scope.email={};
             console.log('$scope.email');
             $scope.emailSentMessage=true;
             setTimeout(function(){  $scope.emailSentMessage=false; $scope.apply() }, 2000);
        }


// HADJI HICHAM -04/02/2015

   $scope.removeTag = function(tag,lead) {
            KeenIO.log('dettach tag from leads/show page');

            /*var params = {'tag': tag,'index':$index}

            Edge.delete($scope, params);*/
            $scope.dragTagItem(tag,lead);
            $scope.dropOutTag();
        }

/***********************************************************/
			 $scope.switchShow=function(){
	          if ($scope.show=='list') {      

	               $scope.show = 'cards';
	               localStorage['contactShow']="cards";
	               $scope.selectedCards =[];	         
	               $("#contactCardsContainer").trigger( 'resize' );
	          }else{

	            if ($scope.show=='cards') {
	               $scope.show = 'list';
	                localStorage['contactShow']="list";
	                $scope.selectedCards =[];
	            }
	            
	          };
	        }
	        $scope.isSelectedCard = function(contact) {
	          return ($scope.selectedCards.indexOf(contact) >= 0||$scope.allCardsSelected);
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
	                $scope.selectedCards=$scope.selectedCards.concat($scope.contacts);
	                  
	                $scope.allCardsSelected=true;

	             }else{

	              $scope.selectedCards=[];
	              $scope.allCardsSelected=false;
	              
	             }
	        };
	        $scope.editbeforedeleteselection = function(){
	          $('#BeforedeleteSelectedContacts').modal('show');
	        };
	        $scope.deleteSelection = function(){
	            angular.forEach($scope.selectedCards, function(selected_contact){
	                var params = {'entityKey':selected_contact.entityKey};
	                Contact.delete($scope, params);
	            });	            
	            $('#BeforedeleteSelectedContacts').modal('hide');
	        };
	        $scope.contactDeleted = function(resp){
	        	console.log('iiiiiiiiiiiiiinterheeeeeeeeeerer');
	        	console.log($scope.selectedContact);
	        	if ($scope.selectedContact!=null) {  
	        		console.log('+++++++++++++++++++++++++++++++');
	        		console.log($scope.selectedContact);
	               $scope.contacts.splice($scope.contacts.indexOf($scope.selectedContact) , 1);
	               $scope.apply();

	            }else{

	              angular.forEach($scope.selectedCards, function(selected_contact){
	                  $scope.contacts.splice($scope.contacts.indexOf(selected_contact) , 1);
	                  $scope.apply();
	              });

	              $scope.selectedCards=[];
	            };
		 	};
	        $scope.selectCardwithCheck=function($event,index,contact){

	            var checkbox = $event.target;

	             if(checkbox.checked){
	                if ($scope.selectedCards.indexOf(contact) == -1) {             
	                  $scope.selectedCards.push(contact);
	                }
	             }else{       
	                  $scope.selectedCards.splice($scope.selectedCards.indexOf(contact) , 1);
	             }

	        }
	         $scope.filterByName=function(){
		          if ($scope.fltby!='firstname') {
		                console.log($scope.fltby);
		                 $scope.fltby = 'firstname'; $scope.reverse=false
		          }else{
		                 console.log($scope.fltby);
		                 $scope.fltby = '-firstname'; $scope.reverse=false;
		          };
		      }
			 $scope.fromNow = function(fromDate){
					 return moment(fromDate,"YYYY-MM-DD HH:mm Z").fromNow();
			 }
			 $scope.getPosition= function(index){
				if(index<4){

					return index+1;
				}else{
					console.log((index%4)+1);
					return (index%4)+1;
				}
			 };
		 // get the profile of the contact
	
				// We need to call this to refresh token when user credentials are invalid
			 $scope.refreshToken = function() {
						Auth.refreshToken();
			 };
			$scope.editbeforedelete = function(contact){
				console.log("inteeeeeeeeeeeerheeeeeere");
				console.log(contact)
				 $scope.selectedContact=contact;
				 console.log($scope.selectedContact);
				 $('#BeforedeleteContact').modal('show');
			 };
			
       		$scope.editbeforedeleteopp = function(opportunity){
        console.log("ssssss");
         $scope.selectedOpportunity=opportunity;
         $('#BeforedeleteOpportunity').modal('show');
       };
       	$scope.deleteopportunity = function(){
        	console.log("delllllll");
         var params = {'entityKey':$scope.selectedOpportunity.entityKey};
         Opportunity.delete($scope, params);
         $('#BeforedeleteOpportunity').modal('hide');
         $scope.selectedOpportunity=null;
       };
			$scope.deletecontact = function(){
				 var params = {'entityKey':$scope.selectedContact.entityKey};
				 Contact.delete($scope, params);
				 $('#BeforedeleteContact').modal('hide');
			 };
			$scope.showAssigneeTags=function(contact){
		        $('#assigneeTagsToContact').modal('show');
		        $scope.currentContact=contact;
		     };
		    $scope.addTagsTothis=function(){
		      var tags=[];
		      var items = [];
		      tags=$('#select2_sample2').select2("val");
		         angular.forEach(tags, function(tag){
                           var params = {
                             'parent': $scope.currentContact.entityKey,
                             'tag_key': tag
                          };
                         Tag.attach($scope, params);
                        });
              $scope.currentContact=null;
		      $('#assigneeTagsToContact').modal('hide');
		     };
		    $scope.addTagsToContacts=function(){
                
                var tags=[];
                var items = [];
                tags=$('#select2_sample2').select2("val");
                console.log(tags);
                if ($scope.currentContact!=null) {
                  angular.forEach(tags, function(tag){
                           var params = {
                             'parent': $scope.currentContact.entityKey,
                             'tag_key': tag
                          };
                         Tag.attach($scope, params);
                        });
                  $scope.currentContact=null;
                }else{
                  angular.forEach($scope.selectedCards, function(selected_contact){
	                    angular.forEach(tags, function(tag){
	                      var params = {
	                        'parent': selected_contact.entityKey,
	                        'tag_key': tag
	                      };
	                       Tag.attach($scope, params);
	                    });

                	});
                }
                $scope.apply();
                $('#assigneeTagsToContact').modal('hide');

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
			 $scope.listMoreItems = function(){
			 	       
				var nextPage = $scope.contactCurrentPage + 1;
				        console.log("----------------------------");
					    console.log($scope.contactpages[nextPage]);
					    console.log("----------------------------");
				var params = {};
				if ($scope.contactpages[nextPage]){

						params = {
											'limit':20,
											'order' : $scope.order,
											'pageToken':$scope.contactpages[nextPage]
										}

					 

						$scope.contactCurrentPage = $scope.contactCurrentPage + 1 ;
						Contact.listMore($scope,params);
				}
			};
			 $scope.listNextPageItems = function(){

					var nextPage = $scope.contactCurrentPage + 1;
					var params = {};
						if ($scope.contactpages[nextPage]){
							params = {'order' : $scope.order,'limit':8,
												'pageToken':$scope.contactpages[nextPage]
											 }
						}else{
							params = {'order' : $scope.order,'limit':8}
						}

						$scope.contactCurrentPage = $scope.contactCurrentPage + 1 ;
						Contact.list($scope,params);
			 };
			 $scope.listPrevPageItems = function(){

				 var prevPage = $scope.contactCurrentPage - 1;
				 var params = {};
						if ($scope.contactpages[prevPage]){
							params = {'limit':8,
												'pageToken':$scope.contactpages[prevPage]
											 }
						}else{
							params = {'order' : $scope.order,'limit':8}
						}
						$scope.contactCurrentPage = $scope.contactCurrentPage - 1 ;
						Contact.list($scope,params);
			 };
				$scope.showImportModal = function(){
					$('#importModal').modal('show');
				}
				$scope.createPickerUploader = function() {

					$('#importModal').modal('hide');
					var developerKey = 'AIzaSyDHuaxvm9WSs0nu-FrZhZcmaKzhvLiSczY';
					var projectfolder = $scope.contact.folder;
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
										Contact.import($scope,params);
								}
				}
			}
			// new Contact
			$scope.showModal = function(){
				$('#addContactModal').modal('show');

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
			$scope.save = function(contact){
					var params = {};
					var contact_name = new Array();


					contact.display_name = contact_name;
					if (typeof(contact.account)=='object'){
						contact.account_name = contact.account.name;
						contact.account = contact.account.entityKey;

						Contact.insert($scope,contact);

					}else if($scope.searchAccountQuery.length>0){
							// create a new account with this account name
							var params = {'name': $scope.searchAccountQuery,
														'access': contact.access
							};
							$scope.contact = contact;
							Account.insert($scope,params);
					};
					$('#addContactModal').modal('hide');
			};
			$scope.addContactOnKey = function(contact){
					if(event.keyCode == 13 && contact){
							$scope.save(contact);
					}
			};


		 var params_search_account ={};
		 $scope.result = undefined;
		 $scope.q = undefined;
		 $scope.$watch('searchAccountQuery', function() {
				 params_search_account['q'] = $scope.searchAccountQuery;
				 Account.search($scope,params_search_account);

			});
		 $scope.selectAccount = function(){
				$scope.contact.account = $scope.searchAccountQuery;

		 };


		 // Quick Filtering
		 var searchParams ={};
		 $scope.result = undefined;
		 $scope.q = undefined;

		 // $scope.$watch('searchQuery', function() {
			// 	 searchParams['q'] = $scope.searchQuery;
			// 	 Contact.search($scope,searchParams);
		 // });
		 $scope.selectResult = function(){
					window.location.replace('#/contacts/show/'+$scope.searchQuery.id);
		 };
		 $scope.executeSearch = function(searchQuery){
				if (typeof(searchQuery)=='string'){
					 var goToSearch = 'type:Contact ' + searchQuery;
					 window.location.replace('#/search/'+goToSearch);
				}else{
					window.location.replace('#/contacts/show/'+searchQuery.id);
				}
				$scope.searchQuery=' ';
				$scope.apply();
		 };
		 // Sorting
		 $scope.orderBy = function(order){
				var params = { 'order': order};
				$scope.order = order;
				Contact.list($scope,params);
		 };
		 $scope.filterByOwner = function(filter){
				if (filter){
					var params = { 'owner': filter,
												 'order': $scope.order}
				}
				else{
					var params = {
							'order': $scope.order}
				};
				$scope.isFiltering = true;
				Contact.list($scope,params);
		 };

/***********************************************
			HKA 19.02.2014  tags
***************************************************************************************/
$scope.listTags=function(){
			var paramsTag = {'about_kind':'Contact'}
			Tag.list($scope,paramsTag);
		 };
$scope.edgeInserted = function () {
			 $scope.listcontacts();
		 };
$scope.listcontacts = function(){
	var params = { 'order': $scope.order}
					Contact.list($scope,params);
};


$scope.addNewtag = function(tag){
			 var params = {
													'name': tag.name,
													'about_kind':'Contact',
													'color':tag.color.color
											}  ;
			 Tag.insert($scope,params);
				$scope.tag.name='';
				$scope.tag.color= {'name':'green','color':'#BBE535'};
				var paramsTag = {'about_kind':'Contact'};
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
					/*	element.css('background-color','#ffffff !important');*/
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
				 Contact.list($scope,params);

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
		$scope.listcontacts();

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
				 //$scope.apply();
			};
			$scope.dropTag=function(contact,index){
				var items = [];

				var params = {
							'parent': contact.entityKey,
							'tag_key': $scope.draggedTag.entityKey
				};
				$scope.draggedTag=null;
				Tag.attach($scope,params,index);

			};
			$scope.tagattached=function(tag,index){
				  if (index!=undefined) {
			            if ($scope.contacts[index].tags == undefined) {
			                $scope.contacts[index].tags = [];
			            }
			            var ind = $filter('exists')(tag, $scope.contacts[index].tags);                
			            if (ind == -1) {
			                $scope.contacts[index].tags.push(tag);
			                var card_index = '#card_' + index;
			                $(card_index).removeClass('over');
			            } else {
			                var card_index = '#card_' + index;
			                $(card_index).removeClass('over');
			            }
			          }else{

			             if ($scope.selectedCards.length >0) {
			                angular.forEach($scope.selectedCards, function(selected_contact){
			                    var existstag=false;
			                    angular.forEach(selected_contact.tags, function(elementtag){
			                        if (elementtag.id==tag.id) {
			                           existstag=true;
			                        };                       
			                    }); 
			                    if (!existstag) {
			                       if (selected_contact.tags == undefined) {
			                          selected_contact.tags = [];
			                          }
			                       selected_contact.tags.push(tag);
			                    };  
			                 });        
			           /* $scope.selectedCards=[];*/
			             };
			          };
			          $scope.apply();
					
				/*$scope.selectedCards=[];  */
			};

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


		 // Google+ Authentication
		 Auth.init($scope);
		 $(window).scroll(function() {
					if (!$scope.isLoading && !$scope.isFiltering && ($(window).scrollTop() >  $(document).height() - $(window).height() - 100)) {

							$scope.listMoreItems();
					}
			});
}]);

app.controller('ContactShowCtrl', ['$scope','$filter','$route','Auth','Email', 'Task','Event','Note','Topic','Contact','Opportunity','Case','Permission','User','Attachement','Map','Opportunitystage','Casestatus','InfoNode','Tag','Account','Edge','Linkedin',
		function($scope,$filter,$route,Auth,Email,Task,Event,Note,Topic,Contact,Opportunity,Case,Permission,User,Attachement,Map,Opportunitystage,Casestatus,InfoNode,Tag,Account,Edge,Linkedin) {
	     $("ul.page-sidebar-menu li").removeClass("active");
		 $("#id_Contacts").addClass("active");
		 $scope.selectedTab = 2;
		 $scope.isSignedIn = false;
		 $scope.immediateFailed = false;
		 $scope.isContentLoaded = false;
		 $scope.isLoading = false;
		 $scope.nbLoads=0;
		 $scope.pagination = {};
		 $scope.nextPageToken = undefined;
		 $scope.prevPageToken = undefined;
		 $scope.currentPage = 01;
		 $scope.pages = [];
		 $scope.collaborators_list=[];
		 //HKA 10.12.2013 Var topic to manage Next & Prev
		 $scope.topicCurrentPage=01;
		 $scope.topicpagination={};
		 $scope.topicpages = [];
		//HKA 11.12.2013 var Opportunity to manage Next & Prev
		 $scope.opppagination = {};
		 $scope.oppCurrentPage=01;
		 $scope.opppages=[];
		 //HKA 11.12.2013 var Case to manage Next & Prev
		 $scope.casepagination = {};
		 $scope.caseCurrentPage=01;
		 $scope.casepages=[];
		 $scope.documentpagination = {};
		 $scope.documentCurrentPage=01;
		 $scope.documentpages=[];
		 $scope.customfields = [];
		 $scope.showPhoneForm=false;
		$scope.accounts = [];
		$scope.opportunities = [];
		$scope.Opportunities = {};
		$scope.email = {};
		$scope.stage_selected={};
		$scope.status_selected={};
		$scope.infonodes = {};
		$scope.phone={};
		$scope.phone.type= 'work';
 		 $scope.casee = {};
		$scope.ioevent = {};
		$scope.casee.priority = 4;
		$scope.sharing_with = [];
		$scope.statuses = [
		{value: 'Home', text: 'Home'},
		{value: 'Work', text: 'Work'},
		{value: 'Mob', text: 'Mob'},
		{value: 'Other', text: 'Other'}
		];
		$scope.showUpload=false;

		$scope.profile_img = {
								'profile_img_id':null,
								'profile_img_url':null
							};
		$scope.newTaskform=false;
      $scope.newEventform=false;
      $scope.newTask={};
      $scope.selected_members = [];
      $scope.selected_member = {};
      $scope.tabtags=[]

      $scope.showNewOpp=false;
      $scope.showNewCase=false;
      $scope.opportunity={access:'public',currency:'USD',duration_unit:'fixed',closed_date:new Date()};
      $scope.selectedItem={};
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

    $scope.linkedProfile={};
    $scope.showPage=true;
    $scope.twitterProfile={};
    $scope.ownerSelected={};
    $scope.empty={};
    $scope.currentIndex=0;
	$scope.sendWithAttachments = [];
	        $scope.smallModal=false;
    $scope.tab='about';
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
        $('#some-textarea1').wysihtml5();
        $scope.gotosendMail = function(email){
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
        
        $scope.smallSendMail=function(){
          $(".modal-backdrop").remove();
          $('#testnonefade').addClass("emailModalOnBottom");
        }
        $scope.bigSendMail=function(){
          $('#testnonefade').removeClass("emailModalOnBottom");
          $( "body" ).append( '<div class="modal-backdrop fade in"></div>' );

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
    $scope.getLinkedinProfile=function(){
      console.log($scope.contact)
      var params={
      "firstname":$scope.contact.firstname,
      "lastname":$scope.contact.lastname
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

    	$scope.fromNow = function(fromDate){
				return moment(fromDate,"YYYY-MM-DD HH:mm Z").fromNow();
		}
		$scope.waterfallTrigger= function(){
			console.log("ll");
				 $( window ).trigger( "resize" );
		};

			// What to do after authentication
			$scope.runTheProcess = function(){

					var params = {
													'id':$route.current.params.contactId,

													'topics':{
														'limit': '7'
													},

													'opportunities':{
														'limit': '15'
													},

													'cases':{
														'limit': '15'
													},

													'documents':{
														'limit': '15'
													},

													'tasks':{

													},

													'events':{

													}
											};
		           $scope.mapAutocomplete();
					Contact.get($scope,params);
					User.list($scope,{});
					Opportunitystage.list($scope,{'order':'probability'});
					Casestatus.list($scope,{});
	           var paramsTag = {'about_kind': 'Contact'};
	          Tag.list($scope, paramsTag);

	          ga('send', 'pageview', '/contacts/show');
	          window.Intercom('update');

			};
			// LA 19/01/2015
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
			$scope.showAssigneeTags=function(opportunity){
            $('#assigneeTagsToOpp').modal('show');
            $scope.currentOpportunity=opportunity;
         };
         // LA 19/01/2015
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
            	case 'case':
            		angular.forEach(tags, function(tag){
	                	var params = {
	                        'parent': $scope.cases[$scope.currentIndex].entityKey,
	                        'tag_key': tag
	                    };

	                    Tag.attach($scope,params,$scope.currentIndex,$scope.tab);
	                });
	                
	            break;
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

	    $scope.getColaborators=function(){
           
          Permission.getColaborators($scope,{"entityKey":$scope.contact.entityKey});  
        }

				// We need to call this to refresh token when user credentials are invalid
		$scope.refreshToken = function() {
						Auth.refreshToken();
			};
			$scope.getTopicUrl = function(type,id){
			return Topic.getUrl(type,id);
		};
		$scope.editbeforedeleteopp = function(opportunity){
        console.log("ssssss");
         $scope.selectedOpportunity=opportunity;

         $('#BeforedeleteOpportunity').modal('show');
       };
       	$scope.deleteopportunity = function(){
       	 $scope.relatedOpp=true;
         var params = {'entityKey':$scope.opportunities[$scope.selectedOpportunity].entityKey,'source':'contact'};
         Opportunity.delete($scope, params);
         $('#BeforedeleteOpportunity').modal('hide');
         $scope.selectedOpportunity=null;
       };
              $scope.oppDeleted = function(resp){
               $scope.opportunities.splice($scope.selectedOpportunity, 1);
               $scope.$apply();
               $scope.waterfallTrigger();
         };
       // 
           $scope.isEmptyArray=function(Array){
                if (Array!=undefined && Array.length>0) {
                return false;
                }else{
                    return true;
                };    
            
        }
		 $scope.addTagsTothis=function(){
              var tags=[];
              var items = [];
              tags=$('#select2_sample2').select2("val");
              console.log(tags);
                  angular.forEach(tags, function(tag){
                    var params = {
                          'parent': $scope.contact.entityKey,
                          'tag_key': tag
                    };
                    Tag.attach($scope,params,-1,'contact');
                  });
          };
          $scope.tagattached = function(tag, index,tab) {
          	switch(tab){

          		case 'contact' :
		            if ($scope.contact.tags == undefined) {
		                $scope.contact.tags = [];
		            }
		            var ind = $filter('exists')(tag, $scope.contact.tags);
		            if (ind == -1) {
		                $scope.contact.tags.push(tag);
		                
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
         $scope.contact.tags.splice(index, 1);
         $scope.apply();
        }
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
		 //HKA 11.11.2013
		$scope.TopiclistNextPageItems = function(){


				var nextPage = $scope.topicCurrentPage + 1;
				var params = {};
					if ($scope.topicpages[nextPage]){
						params = {
											'id':$scope.contact.id,
												'topics':{
													'limit': '7',
													'pageToken':$scope.topicpages[nextPage]
												}
										 }
							$scope.topicCurrentPage = $scope.topicCurrentPage + 1 ;
							Contact.get($scope,params);
						}


		 }


		 $scope.listTopics = function(contact){
				var params = {
											'id':$scope.contact.id,
											'topics':{
														 'limit': '7'
											 }
										};
					Contact.get($scope,params);

		 };
		 //HKA 10.12.2013 Page Prev & Next on List Opportunities
	$scope.OpplistNextPageItems = function(){


				var nextPage = $scope.oppCurrentPage + 1;
				var params = {};
					if ($scope.opppages[nextPage]){
						params = {
											'id':$scope.contact.id,
												'opportunities':{
													'limit': '6',
													'pageToken':$scope.opppages[nextPage]
												}
										 }
						$scope.oppCurrentPage = $scope.oppCurrentPage + 1 ;
						Contact.get($scope,params);
						}

		 };

		//HKA 07.12.2013 Manage Prev & Next Page on Related List Cases
$scope.CaselistNextPageItems = function(){


				var nextPage = $scope.caseCurrentPage + 1;
				var params = {};
					if ($scope.casepages[nextPage]){
						params = {
											'id':$scope.contact.id,
												'cases':{
													'limit': '15',
													'pageToken':$scope.casepages[nextPage]
												}
										 }
						$scope.caseCurrentPage = $scope.caseCurrentPage + 1 ;
						Contact.get($scope,params);
					}

		 }



		 $scope.hilightTopic = function(){
				console.log('Should higll');
			 $('#topic_0').effect( "bounce", "slow" );
			 $('#topic_0 .message').effect("highlight","slow");
		 }


$scope.listTags=function(){

      var paramsTag = {'about_kind':'Contact'}
      Tag.list($scope,paramsTag);
     };


     $scope.selectMember = function(){
        $scope.slected_memeber = $scope.user;
        $scope.user = '';
        $scope.sharing_with.push($scope.slected_memeber);

     };

      $scope.share = function(){
 
         var body = {'access':$scope.contact.access};
         var id = $scope.contact.id;
         var params ={'id':id,
                      'access':$scope.contact.access}
        Contact.patch($scope,params);
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
                            'about': $scope.contact.entityKey,
                            'items': items
              }
              Permission.insert($scope,params);
          }


          $scope.sharing_with = [];


        }


     };

  $scope.editacontact = function(){
    $('#EditContactModal').modal('show');
  }
  //HKA 27.11.2013 Update Contact updatecontact
  $scope.updatecontact = function(contact){
    var params={'id':$scope.contact.id,
    			'owner':$scope.ownerSelected.google_user_id,
                'firstname':contact.firstname,
                'lastname':contact.lastname,
                'title':contact.title,
                'account':''
            };
         console.log("rrrrrrr",$scope.contact.account)
       	if (typeof($scope.contact.account)=='string'){
       		console.log("one",$scope.contact.account)
       		params.account = $scope.contact.account;
       	} else if ($scope.searchAccountQuery){
       		console.log("two",$scope.contact.account)
       		params.account = $scope.searchAccountQuery;

       	}
            console.log(params)  ;
            Contact.patch($scope,params);
        $('#EditContactModal').modal('hide')

  };
  //HKA 01.12.2013 Edit tagline of Account
    $scope.edittagline = function() {
       $('#EditTagModal').modal('show');
    };
    //HKA 01.12.2013 Edit Introduction on Account
    $scope.editintro = function() {
       $('#EditIntroModal').modal('show');
    };



		 $scope.selectMember = function(){
				$scope.slected_memeber = $scope.user;
				$scope.user = '';
				$scope.sharing_with.push($scope.slected_memeber);

		 };
	

	$scope.share = function(){
		
				 var body = {'access':$scope.contact.access};
				 var id = $scope.contact.id;
				 var params ={'id':id,
											'access':$scope.contact.access}
				  Contact.patch($scope,params);
                  // who is the parent of this event .hadji hicham 21-07-2014.

				  params["parent"]="contact";
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
														'about': $scope.contact.entityKey,
														'items': items
							}
							 Permission.insert($scope,params);
					}


					$scope.sharing_with = [];


				}


		 };

	$scope.editacontact = function(){
		$('#EditContactModal').modal('show');
	}
	
	//HKA 01.12.2013 Edit tagline of Account
		$scope.edittagline = function() {
			 $('#EditTagModal').modal('show');
		};
		//HKA 01.12.2013 Edit Introduction on Account
		$scope.editintro = function() {
			 $('#EditIntroModal').modal('show');
		};
// HKA 19.03.2014 inline update infonode
		 $scope.inlinePatch=function(kind,edge,name,entityKey,value){


	 if (kind=='Contact') {

			if (name=='firstname')
				{params = {'id':$scope.contact.id,
						 firstname:value};
				 Contact.patch($scope,params);};
			 if (name=='lastname')
				{params = {'id':$scope.contact.id,
						 lastname:value};
				 Contact.patch($scope,params);}
	 }else{



					params = {
									'entityKey': entityKey,
									'parent':$scope.contact.entityKey,
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
                              'parent': $scope.contact.entityKey,
                              'access': $scope.contact.access
                    }

                }else{
                    params ={'title': task.title,
                             'parent': $scope.contact.entityKey,
                             'access': $scope.contact.access
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
												'id':$scope.contact.id,
												'tasks':{},
												 'events':{}
											};
				Contact.get($scope,params);

		 }
 //HKA 10.11.2013 Add event
 $scope.addEvent = function(ioevent){

/********************************/
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
                            'parent':$scope.contact.entityKey,
                            'access': $scope.contact.access,
                            'allday':"true"
                      }



                  }else{

                  if (ioevent.starts_at){
                    if (ioevent.ends_at){
                      params ={'title': ioevent.title,
                              'starts_at': $filter('date')(ioevent.starts_at,['yyyy-MM-ddTHH:mm:00.000000']),
                              'ends_at': $filter('date')(ioevent.ends_at,['yyyy-MM-ddTHH:mm:00.000000']),
                              'where': ioevent.where,
                              'parent':$scope.contact.entityKey,
                              'access': $scope.contact.access,
                              'allday':"false"
                      }

                    }else{
                      params ={
                        'title': ioevent.title,
                              'starts_at': $filter('date')(ioevent.starts_at,['yyyy-MM-ddTHH:mm:00.000000']),
                              'where': ioevent.where,
                              'parent':$scope.contact.entityKey,
                              'ends_at':moment(ioevent.ends_at).add('hours',2).format('YYYY-MM-DDTHH:mm:00.000000'),
                              'access': $scope.contact.access,
                              'allday':"false"
                      }
                    }




                  }


                  }

                   Event.insert($scope,params);
                  $scope.ioevent={};
                  $scope.newEventform=false;



        }
     }
     //************************************//

     }

//hadji hicham 14-07-2014 . update the event after we add .
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
				console.log('Should higll');
				$('#event_0').effect("highlight","slow");
				$('#event_0').effect( "bounce", "slow" );

		 }
		 $scope.listEvents = function(){
				var params = {
												'id':$scope.contact.id,
												'events':{

												}
											};
				Contact.get($scope,params);

		 };
	//HKA 02.12.2013 List Opportunities related to Contact
		 $scope.listOpportunities = function(){
				var params = {'contact':$scope.contact.entityKey,
											//'order': '-updated_at',
											'limit': 6
											};
				Opportunity.list($scope,params);

		 };

	//HKA 02.12.2013 List Cases related to Contact
	$scope.listCases = function(){
		var params ={'contact':$scope.contact.entityKey,
									//'order':'-creationTime',
									'limit':6};

		Case.list($scope,params)
	};
		 //HKA 11.11.2013 Add Note
	$scope.addNote = function(note){
		var params ={
									'about': $scope.contact.entityKey,
									'title': note.title,
									'content': note.content
			};
		Note.insert($scope,params);
		$scope.note.title='';
		$scope.note.content='';

};
//HKA 26.11.2013 Update Case
$scope.updatContactHeader = function(contact){

	params = {'id':$scope.contact.id,
						 'name':contact.name,
						 'priority' :casee.priority,
					 'status':casee.status,
					 'type_case':casee.type_case};
	Case.patch($scope,params);
 $('#EditCaseModal').modal('hide');
	};


	// HKA 01.12.2013 Show modal Related list (Opportunity)
	$scope.addOppModal = function(){
		$('#addOpportunityModal').modal('show');
	};

	//HKA 01.12.2013 Show modal Related list (Case)
	$scope.addCaseModal = function(){
		$('#addCaseModal').modal('show');
	};
	// HKA 02.12.2013 Add Opportunty related to Contact
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
            opportunity.contact=$scope.contact.entityKey;
            
            Opportunity.insert($scope,opportunity);
            $scope.opportunity={access:'public',currency:'USD',duration_unit:'fixed',closed_date:new Date()};
            $scope.showNewOpp=false;
            $scope.isLoading=false;
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
     $scope.hideNewCaseForm=function(){
     	$scope.casee={};
     	$scope.casee.priority = 4;
     	$scope.showNewCase=false;
     	$( window ).trigger( 'resize' ); 
     }
     $scope.hideNewOppForm=function(){
     	$scope.opportunity={};
     	$scope.showNewOpp=false;
     	$( window ).trigger( 'resize' ); 
     }
	// HKA 01.12.2013 Add Case related to Contact
		$scope.saveCase = function(casee){
			//casee.account=$scope.contact.account.entityKey;
			casee.contact=$scope.contact.entityKey;
			casee.access=$scope.contact.access;
			casee.infonodes = $scope.prepareInfonodes();
			

			casee.name=casee.name||"No subject"
			casee.priority=casee.priority || 4
            Case.insert($scope,casee);
            $scope.showNewCase=false;
            casee.priority=1
		};

	//HKA 01.12.2013 Add Phone
 $scope.addPhone = function(phone){
	if (phone.number){
		params = {'parent':$scope.contact.entityKey,
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
		$scope.phone.number='';
		$scope.phone.type= 'work';
		$scope.showPhoneForm=false;
	};
$scope.listInfonodes = function(kind) {

		 params = {'parent':$scope.contact.entityKey,
							 'connections': kind
							};
		 InfoNode.list($scope,params);
 }

//HKA 20.11.2013 Add Email
$scope.addEmail = function(email){

if (email.email){
	 params = {'parent':$scope.contact.entityKey,
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

			params = {'parent':$scope.contact.entityKey,
						'kind':'websites',
						'fields':[
								{
									"field": "url",
									"value": website.url
								}
						]
	};

    InfoNode.insert($scope,params);
	$scope.website={};
	$scope.showWebsiteForm=false;
	}

};

//HKA 22.11.2013 Add Social
$scope.addSocial = function(social){
	if (social.url!=""&&social.url!=undefined) {
		params = {'parent':$scope.contact.entityKey,
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
	params = {'parent':$scope.contact.entityKey,
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
// arezki lebdiri 01-07-2014 send email selected
$scope.sendEmailSelected=function(){
	$scope.email.to = '';
	angular.forEach($scope.infonodes.emails, function(value, key){
		console.log(value)
		if (value.email) $scope.email.to = $scope.email.to + value.email + ',';
    });

};

// HKA 21.06.2014 Update introduction , Tagline
 $scope.updateContactIntroTagline=function(params){
			Contact.patch($scope,params);
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
				console.log(email);
				var params = {
									'to': email.to,
									'cc': email.cc,
									'bcc': email.bcc,
									'subject': email.subject,
									'body': email.body,
									'about':$scope.contact.entityKey
									 };
				if ($scope.sendWithAttachments){
		            params['files']={
		                            'parent':$scope.contact.entityKey,
		                            'access':$scope.contact.access,
		                            'items':$scope.sendWithAttachments
		                            };
		        };

				Email.send($scope,params);
			};
	/* $scope.editbeforedelete = function(item,typee){
	 	$scope.selectedItem={'item':item,'typee':typee};
		$('#BeforedeleteContact').modal('show');
	 }; */
	 $scope.editbeforedeleteCase = function(item,typee){
	 	$scope.selectedItem={'item':item,'typee':'case'};
		$('#BeforedeleteCase').modal('show');
	 };
	 $scope.deleteCase=function(){
	 	    var params = {'entityKey':$scope.selectedItem.item.entityKey};
	 		Case.delete($scope, params);
	 		$('#BeforedeleteCase').modal('hide');
	 	}
	 $scope.deleteItem=function(){
	 	var params = {'entityKey':$scope.selectedItem.item.entityKey};
	 	if ($scope.selectedItem.typee=='contact') {
	 		 Contact.delete($scope, params);
	 	}else{
	 		if ($scope.selectedItem.typee=='opportunity') {
	 			 Opportunity.delete($scope, params);
	 	
	 		}
	 	}
	 	 $('#BeforedeleteContact').modal('hide');
	 }
	 $scope.deletecontact = function(){

		 var params = {'entityKey':$scope.contact.entityKey};
		 
		 Contact.delete($scope, params);
		 $('#BeforedeleteContact').modal('hide');

		 };
		 $scope.contactDeleted = function(resp){

				window.location.replace('/#/contacts');

		 };

		 $scope.DocumentlistNextPageItems = function(){


				var nextPage = $scope.documentCurrentPage + 1;
				var params = {};
					if ($scope.documentpages[nextPage]){
						params = {
												'id':$scope.contact.id,
												'documents':{
													'limit': '15',
													'pageToken':$scope.documentpages[nextPage]
												}
											}
						$scope.documentCurrentPage = $scope.documentCurrentPage + 1 ;

						Contact.get($scope,params);

					}


		 }
		 $scope.DocumentPrevPageItems = function(){

			 var prevPage = $scope.documentCurrentPage - 1;
			 var params = {};
					if ($scope.documentpages[prevPage]){
						params = {
												'id':$scope.contact.id,
												'documents':{
													'limit': '6',
													'pageToken':$scope.documentpages[prevPage]
												}
											}

					}else{
						params = {
												'id':$scope.contact.id,
												'documents':{
													'limit': '6'
												}
											}
					}
					$scope.documentCurrentPage = $scope.documentCurrentPage - 1 ;
					Contact.get($scope,params);


		 };
		 $scope.listDocuments = function(){
				var params = {
												'id':$scope.contact.id,
												'documents':{
													'limit': '6'
												}
											}
				Contact.get($scope,params);

		 };
		 $scope.showCreateDocument = function(type){

				$scope.mimeType = type;
				$('#newDocument').modal('show');
		 };
		 $scope.createDocument = function(newdocument){
				var mimeType = 'application/vnd.google-apps.' + $scope.mimeType;
				var params = {
											'parent': $scope.contact.entityKey,
											'title':newdocument.title,
											'mimeType':mimeType
										 };
				Attachement.insert($scope,params);

		 };
		 $scope.createPickerUploader = function() {
					var developerKey = 'AIzaSyDHuaxvm9WSs0nu-FrZhZcmaKzhvLiSczY';
					var projectfolder = $scope.contact.folder;
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
															'access': $scope.contact.access,
															'parent':$scope.contact.entityKey
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
									 var params ={'id':$scope.contact.id};
									 params['profile_img_id'] = $scope.profile_img.profile_img_id;
									 params['profile_img_url'] = $scope.profile_img.profile_img_url;
									 Contact.patch($scope,params);
								 }
					 }
			 }
	      $scope.mapAutocomplete=function(){
            //$scope.addresses = $scope.account.addresses;
            Map.autocomplete ($scope,"pac-input");
        }
		$scope.renderMaps = function(){
					$scope.addresses = $scope.contact.addresses;
					 Map.renderwith($scope);
			};
			$scope.addAddress = function(address){

				Map.searchLocation($scope,address);

				$('#addressmodal').modal('hide');
				$scope.address={};
			};
			$scope.locationUpdated = function(addressArray){

					var params = {'id':$scope.contact.id,
												 'addresses':addressArray};
					contact.patch($scope,params);
			};
			$scope.setLocation=function(address){
        	console.log("triggered");
            Map.setLocation($scope,address);
        }
		  $scope.addGeo = function(address){
					params = {'parent':$scope.contact.entityKey,
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
						params = {'parent':$scope.contact.entityKey,
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
									"field": "lng",
									"value": address.lng.toString()
								}
							]
						};
					}
					InfoNode.insert($scope,params);
			};

	// HKA 13.05.2014 Delete infonode

	$scope.deleteInfonode = function(entityKey,kind){
		var params = {'entityKey':entityKey,'kind':kind};

		InfoNode.delete($scope,params);

	};
			 //HKA 04.05.2014 To push element
	$scope.pushElement=function(elem,arr){
		console.log('Push Element -------------');
					if (arr.indexOf(elem) == -1) {
							var copyOfElement = angular.copy(elem);
							arr.push(copyOfElement);
							console.log(elem);
							$scope.initObject(elem);

					}else{
						alert("item already exit");
					}
			};
			$scope.listMoreOnScroll = function(){
				switch ($scope.selectedTab)
						{
						case 5:
							$scope.OpplistNextPageItems();
							break;
						case 6:
							$scope.CaselistNextPageItems();
							break;
						case 7:
							$scope.DocumentlistNextPageItems();
							break;
						case 1:
							$scope.TopiclistNextPageItems();
							break;

						}
			};

		var params_search_account ={};
		$scope.result = undefined;
		$scope.q = "";
		$scope.$watch('searchAccountQuery', function() {
			
	           if($scope.searchAccountQuery){
				params_search_account['q'] = $scope.searchAccountQuery;
				Account.search($scope,params_search_account);
			}
		    
		});
		$scope.selectAccount = function(){
				$scope.contact.account = $scope.searchAccountQuery.entityKey;

		 };
		$scope.DeleteCollaborator=function(entityKey){
            console.log("delete collaborators")
            var item = {
                          'type':"user",
                          'value':entityKey,
                          'about':$scope.contact.entityKey
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




app.controller('ContactNewCtrl', ['$scope','Auth','Contact','Account','Edge','Map',
		function($scope,Auth,Contact,Account,Edge,Map) {
			$("ul.page-sidebar-menu li").removeClass("active");
			$("#id_Contacts").addClass("active");

			document.title = "Contacts: New";
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
			$scope.contact = {};
			$scope.contact.access ='public';
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
			$scope.addresses=[];
			$scope.emails=[];
			$scope.websites=[];
			$scope.sociallinks=[];
			$scope.customfields=[];
			$scope.results=[];
			$scope.phone={};
			$scope.currentContact = {};
			$scope.phone.type= 'work';
			$scope.imageSrc = '/static/img/avatar_contact.jpg';
			$scope.profile_img = {
														'profile_img_id':null,
														'profile_img_url':null
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
			$scope.pushElement = function(elem, arr, infos) {
            console.log(elem)
            console.log(arr)
            console.log(infos)
            if (arr.indexOf(elem) == -1) {
                // var copyOfElement = angular.copy(elem);
                // arr.push(copyOfElement);
                // $scope.initObject(elem);

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
                        $scope.email.email = ''
                        break;
                    case 'websites' :
                        if (elem.url) {
                            var copyOfElement = angular.copy(elem);
                            arr.push(copyOfElement);
                            $scope.initObject(elem);
                        }
                        $scope.website.url = '';
                        $scope.showWebsiteForm = false;
                        break;
                    case 'sociallinks' :
                        if (elem.url) {
                            var copyOfElement = angular.copy(elem);
                            arr.push(copyOfElement);
                            $scope.initObject(elem);
                        }
                        $scope.sociallink.url = '';
                        $scope.showSociallinkForm = false;
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
            } else {
                alert("item already exit");
            }
        };
	//HKA 01.06.2014 Delete the infonode on DOM
			$scope.deleteInfos = function(arr,index){
					arr.splice(index, 1);
			};

			$scope.runTheProcess = function(){
				$scope.mapAutocomplete();
				//Map.justAutocomplete ($scope,"relatedContactAddress",$scope.currentContact.address);
				ga('send', 'pageview', '/contacts/new');
				window.Intercom('update');
			 };

			 // for the map 

	  $scope.mapAutocomplete=function(){
           // $scope.addresses = $scope.contact.addresses;
            Map.autocomplete ($scope,"pac-input");
        }
       $scope.addGeo = function(address){
               console.log("geo added");
               console.log(address);
               $scope.infonodes.addresses.push(address);
               $scope.addresses.push(address);
               $scope.apply();
               console.log($scope.infonodes.addresses);
            };
        $scope.setLocation=function(address){
        	console.log("triggered");
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
        $scope.confirmaddress=function(){
             $scope.account.addresses.push({'formatted':$scope.addressNotFound});
             $scope.addressNotFound='';
             $('#confirmNoGeoAddress').modal('hide');
             $scope.apply();

        }
			 //





				// We need to call this to refresh token when user credentials are invalid
			 $scope.refreshToken = function() {
						Auth.refreshToken();
			 };

			 $scope.accountInserted = function(resp){
					$scope.contact.account = resp;
					$scope.save($scope.contact);
			};

			 var params_search_account ={};
			 $scope.result = undefined;
			 $scope.q = undefined;
			 $scope.$watch('searchAccountQuery', function() {
						console.log('i am searching');
					 params_search_account['q'] = $scope.searchAccountQuery;
					 Account.search($scope,params_search_account);

				});
				$scope.selectAccount = function(){
					$scope.contact.account = $scope.searchAccountQuery;

			 };
			 $scope.accountInserted = function(resp){
					console.log('account inserted ok');
					console.log(resp);
					$scope.contact.account = resp;
					$scope.save($scope.contact);
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
				angular.forEach($scope.infonodes.addresses, function(address){
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
		              infonode.fields.push({"field": "lon","value": address.lng.toString()});
		            };
		            infonodes.push(infonode);
		        });
				return infonodes;
		}
			// new Contact
		 $scope.save = function(contact){
					var delayInsert = false;
					var params ={
								'firstname':contact.firstname,
								'lastname':contact.lastname,
								'title':contact.title,
								'tagline':contact.tagline,
								'introduction':contact.introduction,
								'phones':$scope.phones,
								'emails':$scope.emails,
								'infonodes':$scope.prepareInfonodes(),
								'access': contact.access
							};
							var test=$scope.prepareInfonodes();
							console.log("test");
							console.log(test);
					if (typeof(contact.account)=='object'){
							params['account'] = contact.account.entityKey;
					}else if($scope.searchAccountQuery){
							if ($scope.searchAccountQuery.length>0){
								// create a new account with this account name
								var accountparams = {
														'name': $scope.searchAccountQuery,
														'access': contact.access
													};
								$scope.contact = contact;
								Account.insert($scope,accountparams);
								delayInsert = true;
							};
					};
					if(!delayInsert){
						if ($scope.profile_img.profile_img_id){
								params['profile_img_id'] = $scope.profile_img.profile_img_id;
								params['profile_img_url'] = 'https://docs.google.com/uc?id='+$scope.profile_img.profile_img_id;
						}
						Contact.insert($scope,params);
					}

			};
			$scope.contactInserted = function(resp){
					window.location.replace('/#/contacts');
			}

			$scope.selectAccount = function(){
				$scope.contact.account = $scope.searchAccountQuery;

		 };








	 // Google+ Authentication
		 Auth.init($scope);
}]);
