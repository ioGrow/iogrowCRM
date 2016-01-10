app.controller('ContactListCtrl', ['$scope','$filter','Auth','Account','Contact','Tag','Edge','Attachement', 'Email','Event','Task','User','Permission',
    function($scope,$filter,Auth,Account,Contact,Tag,Edge,Attachement,Email,Event,Task,User,Permission) {
        $("ul.page-sidebar-menu li").removeClass("active");
        $("#id_Contacts").addClass("active");
        document.title = "Contacts: Home";
        trackMixpanelAction('CONTACT_LIST_VIEW');
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
        $scope.tags = [];
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
                 $scope.file_type = 'csv';
                 $scope.show="cards";
                 $scope.selectedCards=[];
             $scope.allCardsSelected=false; 
             $scope.moretext="";
             $scope.lesstext="";
             $scope.emailSentMessage=false;
             $scope.email={};
             $scope.smallModal=false;
             $scope.contactsfilter='all';
             $scope.contactsAssignee=null;
             $scope.selected_access='public';
             $scope.selectedPermisssions=true;
             $scope.sharing_with=[];
             $scope.owner=null;
             $scope.filterNoResult=false;
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
          $scope.contactFilterBy=function(filter,assignee){
            var params={};
          if ($scope.contactsfilter!=filter) {
                  switch(filter) {
                  case 'all':
                     $scope.owner=null;
                     params=$scope.getRequestParams();
                     Contact.list($scope,params,true);
                     $scope.contactsfilter=filter;
                     $scope.contactsAssignee=null;
                      break;
                  case 'my':
                      $scope.owner=assignee;
                      params=$scope.getRequestParams();
                      Contact.list($scope,params,true);
                      $scope.contactsAssignee=assignee;
                      $scope.contactsfilter=filter;
                      break;
          }
        }
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

$scope.emailSignature=document.getElementById("signature").value;
  if($scope.emailSignature =="None"){
    $scope.emailSignature="";
  }else{
    $scope.emailSignature="<br/><br/><br/><br/><br/><br/><br/><br/><br/><br/>"+$scope.emailSignature;
  }
   $scope.selectMember = function(){  
            if ($scope.sharing_with.indexOf($scope.user)==-1) {
                $scope.slected_memeber = $scope.user;

            $scope.sharing_with.push($scope.slected_memeber);
            };
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
                        Contact.patch($scope, params);
                        // who is the parent of this event .hadji hicham 21-07-2014.

                        params["parent"] = "contact";
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


  $scope.GontactModal = function(){
          
        $('#GontactModal').modal('show');
      };

$scope.SynchronizeWithGoogle=function(){
    Contact.Synchronize($scope,{});
}

      $scope.checkPermissions= function(me){
          console.log("enter here in permission");
          $scope.selectedPermisssions=true;
          angular.forEach($scope.selectedCards, function(selected_contact){
              console.log(selected_contact.owner.google_user_id);
              console.log(me);
              if (selected_contact.owner.google_user_id==me) {
                console.log("hhhhhhhhheree enter in equal");
              };
              if (selected_contact.owner.google_user_id!=me) {
                console.log("in not owner");
                $scope.selectedPermisssions=false;
              };
          });
          console.log($scope.selectedPermisssions);
        }
   $scope.getColaborators=function(){

   };
   document.getElementById("some-textarea").value=$scope.emailSignature;
       $scope.runTheProcess = function(){
            var params = {'order' : $scope.order,'limit':20}
            Contact.list($scope,params);
            User.list($scope,{});
            var paramsTag = {'about_kind':'Contact'};
            Tag.list($scope,paramsTag);
            ga('send', 'pageview', '/contacts');
            if (localStorage['contactShow']!=undefined) { 
                     $scope.show=localStorage['contactShow'];
                  };
                  window.Intercom('update');

       };
       $scope.messageFromSocialLinkCallback = function(event){
        if (event.origin!=='https://accounts.google.com'&&event.origin!=='https://gcdc2013-iogrow.appspot.com'&&event.origin!=='http://localhost:8090'){
            console.log(event);
        }
    };

     $scope.socialLinkOpener = function(socialLinkUrl){
            $scope.showLinkedinWindown=$scope.prepareUrl(socialLinkUrl);
            if (navigator.isChrome(navigator.sayswho)) {
                if (typeof (sessionStorage.isChromeExtensionInstalled) === 'undefined'){
                    $scope.browser='chrome';
                    $('#extensionNotInstalled').modal({backdrop: 'static', keyboard: false});
                }else{
                    window.open($scope.showLinkedinWindown+'#iogrow','winname','width=700,height=550');
                    window.addEventListener("message", $scope.messageFromSocialLinkCallback, false);
                }
            }else{
                $scope.browser='other';
                $('#extensionNotInstalled').modal({backdrop: 'static', keyboard: false});
            };    
        };
        $scope.lunchWindow=function(){
            window.open($scope.showLinkedinWindown+'#iogrow','winname','width=700,height=550');
            window.addEventListener("message", $scope.messageFromSocialLinkCallback, false);
        }
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
 $scope.wizard = function(){
        localStorage['completedTour'] = 'True';
        var tour = {
            id: "hello-hopscotch",
             steps: [
             {
                title: "Step 1: Create New contact",
                content: "Click here to create new contact and add detail about it.",
                target: "new_contact",
                placement: "bottom"
              },
             {
                
                title: "Step 2: Add tags",
                content: "Add Tags to filter your contacts.",
                target: "add_tag",
                placement: "left"
              },
             
              {
                title: "Step 2: Export contacts",
                content: "Export your contacts as a CSV file.",
                target: "sample_editable_1_new",
                placement: "bottom"
              }
              
            
            ]
           
          };
          // Start the tour!
          console.log("beginstr");
          hopscotch.startTour(tour);
      };
        
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

//HADJI HICHAM 25/03/2015/
        $scope.ExportCsvFile = function () {
            if ($scope.selectedCards.length != 0) {
                $scope.msg = "Do you want export  selected contacts"

            } else {
                if ($scope.selected_tags.length != 0) {
                    $scope.msg = "Do you want export  contacts with the selected tags"

                } else $scope.msg = "Do you want export  all contacts"


            }
            $("#TakesFewMinutes").modal('show');
        }
        $scope.LoadCsvFile = function () {
            console.log("exporting", $scope.selectedCards.length);
            if ($scope.selectedCards.length != 0) {
                var ids = [];
                angular.forEach($scope.selectedCards, function (selected_contact) {
                    ids.push(selected_contact.id);
                });
                Contact.export_key($scope, {ids: ids});
            } else {
                var tags = [];
                angular.forEach($scope.selected_tags, function (selected_tag) {
                    tags.push(selected_tag.entityKey);
                });
                var params = {"tags": tags};
                console.log(params);
                Contact.export($scope, params);

            }
            $("#TakesFewMinutes").modal('hide');
        }
$scope.DataLoaded=function(data){
        $("#load_btn").removeAttr("disabled");
      $("#close_btn").removeAttr("disabled");
      $scope.isExporting=false;
       $("#TakesFewMinutes").modal('hide');
      $scope.$apply()

  $scope.JSONToCSVConvertor($scope.serializedata(data), "Contacts", true);
}

$scope.serializedata=function(data){
for (var i = data.length - 1; i >= 0; i--) {
if(data[i].firstname){data[i].firstname=data[i]["firstname"];}else{data[i]["firstname"]="";}
if(data[i].lastname){data[i].lastname=data[i]["lastname"];}else{data[i]["lastname"]="";}
if(data[i].company){data[i].company=data[i]["company"];}else{data[i]["company"]="";}
if(data[i].emails){data[i].emails=data[i]["emails"]}else{data[i]["emails"]=new Object();}
if(data[i].phones){data[i].phones=data[i]["phones"]}else{ data[i]["phones"]=new Object();}
if(data[i].addresses){data[i].addresses=data[i]["addresses"]}else{ data[i]["addresses"]=new Object();}
};

 return data;

}

$scope.JSONToCSVConvertor=function(JSONData, ReportTitle, ShowLabel){
    //If JSONData is not an object then JSON.parse will parse the JSON string in an Object
    var arrData = typeof JSONData != 'object' ? JSON.parse(JSONData) : JSONData;

    var CSV = '';    
    //Set Report title in first row or line
    
    CSV += ReportTitle + '\r\n\n';

    //This condition will generate the Label/Header
    if (ShowLabel) {
        var row = "";
        
        //This loop will extract the label from 1st index of on array
        // for (var index in arrData[0]) {
            

        //     //Now convert each value to string and comma-seprated
        //     row += index + ',';
        // }
        row='firstname,lastname,company,emails,phones,addresses,';
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
                      var addressesPac="";
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
        row='"'+arrData[i]["firstname"]+'",'+'"'+arrData[i]["lastname"]+'",'+'"'+arrData[i]["company"]+'",'+'"'+emailsCont+'",'+'"'+phonesCont+'",'+'"'+addressesCont+'",';
      
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
/****************************************************************************************/
// HADJI HICHAM -04/02/2015/
$scope.removeTag = function(tag,lead) {
            /*var params = {'tag': tag,'index':$index}
            Edge.delete($scope, params);*/
            $scope.dragTagItem(tag,lead);
            $scope.dropOutTag();
        }
/****************************************************************************************/
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
            return ($scope.selectedCards.indexOf(contact) >= 0);
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
          $scope.isEmptyArray=function(Array){
                if (Array!=undefined && Array.length>0) {
                return false;
                }else{
                    return true;
                };    
            
          }
          $scope.contactDeleted = function (entityKey) {
            console.log("selectedCards in contactDeleted");
            console.log($scope.selectedCards);
            console.log($scope.selectedCards.length);
            if (!jQuery.isEmptyObject($scope.selectedContact)) {
                $scope.contacts.splice($scope.contacts.indexOf($scope.selectedContact), 1);
            } else {
                var indx=null;
                angular.forEach($scope.selectedCards, function (selected_contact) {
                    if (entityKey==selected_contact.entityKey) {
                        $scope.contacts.splice($scope.contacts.indexOf(selected_contact), 1);
                        indx=selected_contact;
                    };
                });
                $scope.selectedCards.splice($scope.selectedCards.indexOf(indx),1);
                if ($scope.isEmptyArray($scope.selectedCards)) {
                    console.log("selection array is empty");
                    $scope.allCardsSelected=false;
                    var params=$scope.getRequestParams();
                    console.log(params);
                    Contact.list($scope,params);
                };
                $scope.apply();
            };

        }
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
         $scope.selectedContact=contact;
         $('#BeforedeleteContact').modal('show');
       };
      
          $scope.editbeforedeleteopp = function(opportunity){
       
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
                         Tag.attach($scope, params, $scope.contacts.indexOf($scope.currentContact));
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
        $scope.listMoreItems = function () {
              var nextPage = $scope.contactCurrentPage + 1;
              var params = $scope.getRequestParams();
              console.log("nextPage");
              console.log($scope.contactpages);
              if ($scope.contactpages[nextPage]) {
                  params.pageToken=$scope.contactpages[nextPage];
                  $scope.contactCurrentPage = $scope.contactCurrentPage + 1;
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

        $scope.doTheMapping = function(resp){
          
          $('#importModalMapping').modal('show');
          

        }
        $scope.updateTheMapping = function(key,matched_column){
          $scope.mappingColumns[key].matched_column=matched_column;
          $scope.apply();
        }
        $scope.sendTheNewMapping = function(){
          $('#importModalMapping').modal('hide');
          // params to send include the $scope.mappingColoumns, job_id
          var params = {
            'job_id':$scope.job_id,
            'items':$scope.mappingColumns
          };
          console.log('-----------------Send the mapping--------------');
          console.log(params);
          Contact.importSecondStep($scope,params);
          // invoke the right service
          // hide the modal
        }
        $scope.showImportMessages = function(){
          $('#importMessagesModal').modal('show'); 
        }

        $scope.createPickerUploader = function(){

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
      //   searchParams['q'] = $scope.searchQuery;
      //   Contact.search($scope,searchParams);
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
        $scope.order = order;
        var params=$scope.getRequestParams();
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
            /*element.css('background-color', tag.color+'!important');
            text.css('color',$scope.idealTextColor(tag.color));*/

         }else{
          /*  element.css('background-color','#ffffff !important');*/
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
         var params = $scope.getRequestParams();
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
        // console.log("$scope.isLoading");
        // console.log($scope.isLoading);
        // console.log("$scope.isFiltering");
        // console.log($scope.isFiltering);
        // console.log("$(window).scrollTop() >  $(document).height() - $(window).height() - 100)");
        // console.log($(window).scrollTop() >  $(document).height() - $(window).height() - 100);
          if (!$scope.isLoading && ($(window).scrollTop() >  $(document).height() - $(window).height() - 100)) {
             // console.log("in conditions");
             // console.log("$scope.contactpagination.next");
             // console.log($scope.contactpagination.next);
             if ($scope.contactpagination.next) {
                 $scope.listMoreItems();   
              };
              
          }
      });
}]);

app.controller('ContactShowCtrl', ['$scope','$http','$filter','$route','Auth','Email', 'Task','Event','Note','Topic','Contact','Opportunity','Case','Permission','User','Attachement','Map','Opportunitystage','Casestatus','InfoNode','Tag','Account','Edge','Linkedin','Customfield',
    function($scope,$http,$filter,$route,Auth,Email,Task,Event,Note,Topic,Contact,Opportunity,Case,Permission,User,Attachement,Map,Opportunitystage,Casestatus,InfoNode,Tag,Account,Edge,Linkedin,Customfield) {
       $("ul.page-sidebar-menu li").removeClass("active");
     $("#id_Contacts").addClass("active");
     trackMixpanelAction('CONTACT_SHOW_VIEW');
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
     $scope.contactCurrentPage = 01;
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
    $scope.invites=[];
    $scope.allday=false;
    $scope.guest_modify=false;
    $scope.guest_invite=true;
    $scope.guest_list=true;
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
    $scope.selectedPermisssions=true;
    $scope.noLinkedInResults=false;
    $scope.listPeople=[];
    $scope.contacts = [];
    $scope.linkedLoader=false;
    $scope.linkedProfileresume=null;
    $scope.tab='about';
    $scope.imageSrc = '/static/img/avatar_contact.jpg';
    $scope.watsonUrl=null;
    $scope.showPage=true;
    $scope.timezone=document.getElementById('timezone').value;
    $scope.selectedOpps=[];
    $scope.selectedDocs=[];
    $scope.opportunity.timeline=[];
    $scope.competitors=[];
    $scope.opportunity.competitors
    $scope.opportunity.notes=[];
    $scope.allOppsSelected=false;
    $scope.newDoc=true;
    $scope.docInRelatedObject=true;
    $scope.relatedOpp=true;
    $scope.relatedCase=true;
    $scope.oppCustomfields=[];
    $scope.allCasesSelected=false;
    $scope.selectedCases=[];
    $scope.caseCustomfields=[];


       if ($scope.timezone==""){
        $scope.timezone=moment().format("Z");
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


$scope.emailSignature=document.getElementById("signature").value;
  if($scope.emailSignature =="None"){
    $scope.emailSignature="";
  }else{
    $scope.emailSignature="<br/><br/><br/><br/><br/><br/><br/><br/><br/><br/>"+$scope.emailSignature;
  }
document.getElementById("some-textarea").value=$scope.emailSignature;


        $scope.apply=function(){
         
          if ($scope.$root.$$phase != '$apply' && $scope.$root.$$phase != '$digest') {
               $scope.$apply();
              }
              return false;
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
    $scope.linkedinUrl=function(url){
                         console.log("urrrrrl linkedin");
                         console.log(url);
                         
                         var match="";
                         var matcher = new RegExp("linkedin");
                         var test = matcher.test(url);
                         console.log(test);                        
                         return test;
        }
    $scope.saveLinkedinUrl=function(url){
      $scope.linkedProfile=$scope.linkedShortProfile;
      $scope.linkedShortProfile={};
      var link={'url':url}
      $scope.addSocial(link);
      var params ={'id':$scope.lead.id};
       params['profile_img_url'] = $scope.linkedProfile.profile_picture;
       if ($scope.lead.title==undefined||$scope.lead.title==''||$scope.lead.title==null) {
         params.title=$scope.linkedProfile.title;
       };
       console.log("params before linkedProfile");
       console.log(params);
       console.log($scope.linkedProfile.title);
       Lead.patch($scope,params);
      $scope.imageSrc=$scope.linkedProfile.profile_picture;
      if ($scope.infonodes.addresses==undefined||$scope.infonodes.addresses==[]) {
        $scope.addGeo({'formatted':$scope.linkedProfile.locality});
      };
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
    $scope.caseAction=function(){ 
        if ($scope.showNewCase) {
            console.log('in save opp');
            $scope.saveCase($scope.casee);
        }else{
             $scope.showNewCase=true;
        };
      }
     $scope.editbeforedeletecase = function(casee){
         $scope.selectedCase=casee;
         $('#BeforedeleteCase').modal('show');
       };
        $scope.deletecase = function(){
          var params={};
            angular.forEach($scope.selectedCases, function (casee) {
                    params = {'entityKey': casee.entityKey};
                    Case.delete($scope, params);
                });
            $('#BeforedeleteCase').modal('hide');
            $scope.allCasesSelected=false;
       };
         $scope.caseDeleted = function(entityKey){
               var caseTodelete=null;
               console.log("entityKey to search");
               console.log(entityKey);
            angular.forEach($scope.selectedCases, function (casee) {
                    if (casee.entityKey==entityKey) {
                      console.log("entityKey found");
                      console.log(casee.entityKey);
                        caseTodelete=casee;
                    };
                });
            var indexInCases=$scope.cases.indexOf(caseTodelete);
            console.log(indexInCases);
            var indexInSelection=$scope.selectedCases.indexOf(caseTodelete);
             console.log(indexInSelection);
            $scope.cases.splice(indexInCases, 1);
            $scope.selectedCases.splice(indexInSelection, 1);
            $scope.apply();
         };
          $scope.unselectAllCases = function ($event) {
            var element = $($event.target);
            $scope.selectedCases=[];
        };
        $scope.selectAllCases = function ($event) {

            var checkbox = $event.target;
            if (checkbox.checked) {
                $scope.selectedCases = [];
                $scope.selectedCases = $scope.selectedCases.concat($scope.cases);

                $scope.allCasesSelected = true;

            } else {

                $scope.selectedCases = [];
                $scope.allCasesSelected = false;

            }
        };
      $scope.isSelectedCase = function (casee) {
            return ($scope.selectedCases.indexOf(casee) >= 0);
        };
      $scope.selectCaseWithCheck=function($event,index,casee){

              var checkbox = $event.target;

               if(checkbox.checked){
                  if ($scope.selectedCases.indexOf(casee) == -1) {             
                    $scope.selectedCases.push(casee);
                    console.log("opp pushed");
                    console.log($scope.selectedCases);
                  }
               }else{       

                    $scope.selectedCases.splice($scope.selectedCases.indexOf(casee) , 1);
               }

        }
     $scope.addCustomFieldForCase = function (customField,option) {  
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
                        $scope.caseCustomfields.push(params);
                        console.log(' $scope.caseCustomfields');
                        console.log( $scope.caseCustomfields);

                    }
            }
            $('#customfields').modal('hide');
            $scope.customfield = {};
            $scope.showCustomFieldForm = false;
        };
        $scope.prepareInfonodesCase = function(){
            var infonodes = [];

            angular.forEach($scope.caseCustomfields, function(customfield){
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
        //$tocopy
    $scope.getLinkedinByUrl=function(url){
         $scope.linkedLoader=true;
         var par={'url' : url};
         Linkedin.profileGet(par,function(resp){
                if(!resp.code){
                 console.log("again in profile");
                 console.log($scope.linkedShortProfile);
                 $scope.linkedShortProfile={};
                 $scope.linkedShortProfile.fullname=resp.fullname;
                 $scope.linkedShortProfile.url=url;
                 $scope.linkedShortProfile.profile_picture=resp.profile_picture;
                 $scope.linkedShortProfile.title=resp.title;
                 $scope.linkedShortProfile.locality=resp.locality;
                 $scope.linkedShortProfile.industry=resp.industry; 
                 $scope.linkedShortProfile.formations=resp.formations
                 $scope.linkedShortProfile.resume=resp.resume;
                 $scope.linkedShortProfile.skills=resp.skills;
                 $scope.linkedShortProfile.current_post=resp.current_post;
                 $scope.linkedShortProfile.past_post=resp.past_post;
                 $scope.linkedShortProfile.experiences=JSON.parse(resp.experiences);  
                 if($scope.linkedProfile.experiences){
                  $scope.linkedProfile.experiences.curr=$scope.linkedProfile.experiences['current-position'];
                  $scope.linkedProfile.experiences.past=$scope.linkedProfile.experiences['past-position'];
                 }         
                 $scope.linkedLoader=false;
                 $scope.apply();
                 console.log("$scope.linkedLoader");
                 console.log($scope.linkedLoader);
                 console.log($scope.linkedShortProfile);
                }else {
                  console.log("no 401");
                   if(resp.code==401){
                    // $scope.refreshToken();
                   console.log("no resp");
                    $scope.linkedLoader=false;
                    $scope.apply();
                   };
                }
             });
      }
      $scope.getLinkedinProfile=function(){
          var params={
          "firstname":$scope.contact.firstname,
          "lastname":$scope.contact.lastname
          }
          var linkedurl=null
          if ($scope.infonodes.sociallinks==undefined) {
            $scope.infonodes.sociallinks=[];
          };
          var savedEntityKey=null;
          if ($scope.infonodes.sociallinks.length > 0) {
             angular.forEach($scope.infonodes.sociallinks, function(link){
                              console.log("in linkedin ")
                              console.log(link.url)
                              console.log("in linkedin ")

                              if ($scope.linkedinUrl(link.url)) {
                                linkedurl=link.url;
                                savedEntityKey=link.entityKey;
                                console.log("linkedin exists");
                              };
                          });
          };
          if (linkedurl) {
              var par={'url' : linkedurl};
             Linkedin.profileGet(par,function(resp){
                if(!resp.code){
                 $scope.linkedProfile.fullname=resp.fullname;
                 $scope.linkedProfile.title=resp.title;
                 $scope.linkedProfile.formations=resp.formations
                 $scope.linkedProfile.locality=resp.locality;
                 $scope.linkedProfile.relation=resp.relation;
                 $scope.linkedProfile.industry=resp.industry;
                 $scope.linkedProfileresume=resp.resume;
                 $scope.linkedProfile.entityKey=savedEntityKey;
                 $scope.linkedProfile.url=linkedurl;
                 $scope.linkedProfile.resume=resp.resume;
                 $scope.linkedProfile.skills=resp.skills;
                 $scope.linkedProfile.current_post=resp.current_post;
                 $scope.linkedProfile.past_post=resp.past_post;
                 $scope.linkedProfile.certifications=JSON.parse(resp.certifications);
                 $scope.linkedProfile.experiences=JSON.parse(resp.experiences);
                 if($scope.linkedProfile.experiences){
                 $scope.linkedProfile.experiences.curr=$scope.linkedProfile.experiences['current-position'];
                 $scope.linkedProfile.experiences.past=$scope.linkedProfile.experiences['past-position'];
                 }
                 if ($scope.infonodes.addresses==undefined||$scope.infonodes.addresses==[]) {
                    $scope.addGeo({'formatted':$scope.linkedProfile.locality});
                  };
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
             if(!resp.code){
              console.log($scope.contact);
              if (resp.items==undefined) {
                $scope.listPeople=[];
                $scope.noLinkedInResults=true;
              }else{
                $scope.listPeople=resp.items;
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
    $scope.showSelectButton=function(index){
      $("#item_"+index).addClass('grayBackground');
      $("#select_"+index).removeClass('selectLinkedinButton');
      if (index!=0) {
         $("#item_0").removeClass('grayBackground');
         $("#select_0").addClass('selectLinkedinButton');
      };
    }
    $scope.hideSelectButton=function(index){
   
      if (!$("#select_"+index).hasClass('alltimeShowSelect')) {
        $("#item_"+index).removeClass('grayBackground');
        $("#select_"+index).addClass('selectLinkedinButton');
      };
      if (index!=0) {
         $("#item_0").addClass('grayBackground');
         $("#select_0").removeClass('selectLinkedinButton');
      };
      
    }; 
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
      $scope.oppAction=function(){
        if ($scope.showNewOpp) {
            console.log('in save opp');
            $scope.saveOpp($scope.opportunity);
        }else{
             $scope.showNewOpp=true;
        };
      }
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
        $scope.addNoteOpp = function () {
            $scope.opportunity.notes.push($scope.newOppNote)
            $scope.newOppNote = {}
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
          $scope.getCustomFields("opportunities");
          $scope.getCustomFields("cases");
          Casestatus.list($scope,{});
             var paramsTag = {'about_kind': 'Contact'};
            Tag.list($scope, paramsTag);

            ga('send', 'pageview', '/contacts/show');
           window.Intercom('update');
       $scope.mapAutocompleteCalendar();
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
            var params={
              'id':$scope.contact.id,
              'firstname':data.firstname,
              'lastname':data.lastname,
              'profile_img_url':data.profile_img_url,
              'title':data.title,
              'account':data.company,
              'cover_image':data.imgCoverUrl,
              'introduction':data.introduction
            }
            Contact.patch($scope,params);
            $scope.imageSrc=data.profile_img_url;
            if (data.phone) $scope.addPhone({'number':data.phone,'type':'work'});
            if (data.email) $scope.addEmail({'email':data.email});
            if (data.linkedin_url) $scope.addSocial({'url':data.linkedin_url});
            if (data.locality) $scope.addGeo({'formatted':data.locality,'country':' '});
             //$scope.addWebsite({'url':data.linkedin_url});
            $scope.apply();
        }
     $scope.socialLinkOpener = function(socialLinkUrl){
            $scope.showLinkedinWindown=$scope.prepareUrl(socialLinkUrl);
            if (navigator.isChrome(navigator.sayswho)) {
                if (typeof (sessionStorage.isChromeExtensionInstalled) === 'undefined'){
                    $scope.browser='chrome';
                    $('#extensionNotInstalled').modal({backdrop: 'static', keyboard: false});
                }else{
                    window.open($scope.showLinkedinWindown+'#iogrow','winname','width=700,height=550');
                    window.addEventListener("message", $scope.messageFromSocialLinkCallback, false);
                }
            }else{
                $scope.browser='other';
                $('#extensionNotInstalled').modal({backdrop: 'static', keyboard: false});
            };    
        };
        $scope.lunchWindow=function(){
            window.open($scope.showLinkedinWindown+'#iogrow','winname','width=700,height=550');
            window.addEventListener("message", $scope.messageFromSocialLinkCallback, false);
        }

    $scope.getCustomFields=function(related_object){
            console.log(related_object);
            Customfield.list($scope,{related_object:related_object});
        }
    $scope.listResponse=function(items,related_object){
            //infonodes.customfields
            if (related_object=="contacts") {
                $scope[related_object].customfields=items;
                console.log("in  contact");
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
            }else{
              if (related_object=="opportunities") {
                 $scope.opp={};
                 $scope.opp.customfields=$.extend(true, [], items);
              };
              if (related_object=="cases") {
                 $scope.reCase={};
                 $scope.reCase.customfields=$.extend(true, [], items);
              };
             
              $scope.apply();
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
     $scope.showAssigneeTagsToContact=function(contact){
            $('#assigneeTagsToContact').modal('show');
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
          $scope.collaborators_list = [];
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
          var params={};
            angular.forEach($scope.selectedOpps, function (opp) {
                    params = {'entityKey': opp.entityKey};
                    Opportunity.delete($scope, params);
                });
            $('#BeforedeleteOpportunity').modal('hide');
            $scope.allOppsSelected=false;
       };
         $scope.oppDeleted = function(entityKey){
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
       // 
       /*var params_search_account ={};
       $scope.result = undefined;
       $scope.q = undefined;
       $scope.$watch('searchAccountQuery', function() {
           params_search_account['q'] = $scope.searchAccountQuery;
           Account.search($scope,params_search_account);

        });
       $scope.selectAccount = function(){
          $scope.contact.account = $scope.searchAccountQuery;

       };*/

    $scope.showAddEventPopup=function(){  
         $scope.locationShosen=false;
         $('#newEventModalForm').modal('show');
       }
     $scope.addTagsTothis=function(){
              var tags=[];
              var items = [];
              tags=$('#select2_sample').select2("val");
              console.log(tags);
                  angular.forEach(tags, function(tag){
                    var params = {
                          'parent': $scope.contact.entityKey,
                          'tag_key': tag
                    };
                    Tag.attach($scope,params,-1,'contact');
                  });
              $('#assigneeTagsToContact').modal('hide');
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
                $('#select2_sample').select2("val", "");
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
            console.log("before delete tag");
            console.log(params);
            Edge.delete($scope, params);
        }
        $scope.edgeDeleted=function(index){
          console.log("in edge deleted")
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
     $scope.checkPermissions= function(me){
          console.log("enter here in permission");
          $scope.selectedPermisssions=true;
          angular.forEach($scope.selectedCards, function(selected_lead){
              console.log(selected_lead.owner.google_user_id);
              console.log(me);
              if (selected_lead.owner.google_user_id==me) {
                console.log("hhhhhhhhheree enter in equal");
              };
              if (selected_lead.owner.google_user_id!=me) {
                console.log("in not owner");
                $scope.selectedPermisssions=false;
              };
          });
          console.log($scope.selectedPermisssions);
        }
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
        console.log("woooooooork share");
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
        if (name == 'owner') {
                    params = {
                        'id': $scope.contact.id,
                        owner: value
                    };
                    Contact.patch($scope, params);
                }
       if (name=='account'){
          if (typeof $scope.searchAccountQuery == "object") {
              var params={'id':$scope.contact.id,
                    'account':$scope.searchAccountQuery.entityKey
                };
              console.log("before patching");
              Contact.patch($scope,params);
          }else{
              if (typeof $scope.searchAccountQuery == "string") {
                var accountparams = {
                            'name': $scope.searchAccountQuery,
                            'access': $scope.contact.access
                          };
                Account.insert($scope,accountparams);
              }
          };

       }
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
  $scope.accountInserted = function(resp){
          console.log('account inserted ok');
          console.log(resp);
          var params={'id':$scope.contact.id,
                    'account':resp.entityKey
                };
          console.log("before patching");
          Contact.patch($scope,params);
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


      $scope.showSelectTwitter=function(index){
      $("#titem_"+index).addClass('grayBackground');
      $("#tselect_"+index).removeClass('selectLinkedinButton');
      if (index!=0) {
         $("#titem_0").removeClass('grayBackground');
         $("#tselect_0").addClass('selectLinkedinButton');
      };
    }
    $scope.hideSelectTwitter=function(index){
   
      if (!$("#tselect_"+index).hasClass('alltimeShowSelect')) {
        $("#titem_"+index).removeClass('grayBackground');
        $("#tselect_"+index).addClass('selectLinkedinButton');
      };
      if (index!=0) {
         $("#titem_0").addClass('grayBackground');
         $("#tselect_0").removeClass('selectLinkedinButton');
      };
      
    }; 

 
 // HADJI HICHAM 31/05/2015
//auto complete 

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
$scope.timezoneChosen=$scope.timezone;
$('#timeZone').on('change', function() {


     $scope.timezoneChosen=this.value;
});


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
                      'access':$scope.contact.access,
                      'description':$scope.ioevent.note,
                      'invites':$scope.invites,
                      'parent':  $scope.contact.entityKey,
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
                      'access':$scope.contact.access,
                      'description':$scope.ioevent.note,
                      'invites':$scope.invites,
                      'parent':  $scope.contact.entityKey,
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
                      'access':$scope.contact.access,
                      'description':$scope.ioevent.note,
                      'invites':$scope.invites,
                      'parent':  $scope.contact.entityKey,
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

//hadji hicham 14-07-2014 . update the event after we add .
$scope.updateEventRenderAfterAdd= function(){};

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
        $scope.oppo_err={};
           if (!opportunity.name) $scope.oppo_err.name=true;
            else $scope.oppo_err.name=false;  
          if (!opportunity.amount_per_unit) $scope.oppo_err.amount_per_unit=true;
            else $scope.oppo_err.amount_per_unit=false;

          if (!$scope.oppo_err.amount_per_unit&&!$scope.oppo_err.name) {
              opportunity.contact=$scope.contact.entityKey;
          opportunity.infonodes = $scope.prepareInfonodesOpp();
            
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
              Opportunity.insert($scope,opportunity);
              $scope.showNewOpp = false;
              $scope.opportunity={};
              $scope.opportunity.duration_unit='fixed'
              $scope.opportunity.currency='USD';
              $scope.apply();
          }
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
      $scope.case_err={};
      if (!casee.name) $scope.case_err.name=true;
            else $scope.case_err.name=false;
      if (!$scope.case_err.name) {

                casee.contact=$scope.contact.entityKey;
                casee.infonodes = $scope.prepareInfonodesCase();
                console.log("$scope.prepareInfonodesCase()");
                console.log($scope.prepareInfonodesCase());
                casee.access=$scope.contact.access;
                casee.name=casee.name||"No subject"
                casee.priority=casee.priority || 4;
                casee.status = $scope.status_selected.entityKey;
                Case.insert($scope,casee);
                $scope.showNewCase=false;
                casee.priority=1
                $scope.apply();
                
      }
    };
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
  //HKA 01.12.2013 Add Phone
 $scope.addPhone = function(phone){
  if (phone.number && !$scope.existsInfonode(phone,'number','phones')){
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

if (email.email && !$scope.existsInfonode(email,'email','emails')){
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
  if (website.url!=""&&website.url!=undefined && !$scope.existsInfonode(website,'url','websites')){

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
  if (social.url!=""&&social.url!=undefined && !$scope.existsInfonode(social,'url','sociallinks')) {
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
                            'parent': $scope.contact.entityKey,
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

      /*$scope.editbeforedelete = function(){
       $('#BeforedeleteContact').modal('show');
     };*/
   $scope.editbeforedelete = function(item,typee){

    $scope.selectedItem={'item':item,'typee':typee};
    $('#BeforedeleteContact').modal('show');
   }; 
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
  /*  $scope.renderMaps = function(){
          $scope.addresses = $scope.contact.addresses;
           Map.renderwith($scope);
      };*/
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
        if (!$scope.existsInfonode(address,'formatted','addresses')) {
          params = {'parent':$scope.contact.entityKey,
            'kind':'addresses',
            'fields':[
                {
                  "field": "formatted",
                  "value": address.formatted
                }
            ]
          };
          if (address.lat){
            console.log("addresses lat exists");
            params = {'parent':$scope.contact.entityKey,
            'kind':'addresses',
            'fields':[
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
          InfoNode.insert($scope,params);
        };
          
      };
  // HKA 13.05.2014 Delete infonode
  $scope.deleteSocialLink = function(link,kind){
    console.log("in delete sociallink");
    console.log("link: ")
    console.log(link)
    console.log("kind")
    console.log(kind)
    if (link.entityKey) {
      console.log("link.entityKey")
    console.log(link.entityKey)
      var pars = {'entityKey':link.entityKey,'kind':kind};

    InfoNode.delete($scope,pars);
    if ($scope.linkedinUrl(link.url)) {
      $scope.linkedProfile={};
      $scope.linkedShortProfile={};
      var params={
          "firstname":$scope.lead.firstname,
          "lastname":$scope.lead.lastname
          }
      Linkedin.listPeople(params,function(resp){
             if(!resp.code){
              console.log($scope.lead);
              if (resp.items==undefined) {
                $scope.listPeople=[];
                $scope.noLinkedInResults=true;
              }else{
                $scope.listPeople=resp.items;
              };
                 $scope.isLoading = false;
                 $scope.apply();
                }else {
                  console.log("no 401");
                   if(resp.code==401){
                    // $scope.refreshToken();
                   console.log("no resp");
                    $scope.isLoading = false;
                    $scope.apply();
                   };
                }
          });
    };
    if ($scope.twitterUrl(link.url)) {
      console.log("in twitttttttttttttter url");
      $scope.twProfile={};
      $scope.twShortProfiles=[];
      var params={
          "firstname":$scope.contact.firstname,
          "lastname":$scope.contact.lastname
          }
      $scope.watsonUrl=null;
      Linkedin.getTwitterList(params,function(resp){
                     $scope.twIsSearching=true;
                     $scope.twShortProfiles=[];
                     $scope.twProfile={};
                     if(!resp.code){
                      console.log("in twitttttter");
                      console.log(resp.code);
                      $scope.twIsSearching=false;
                      if (resp.items==undefined) {
                        $scope.twList=[];
                        $scope.twNoResults=true;
                        $scope.twIsSearching=false;
                      }else{
                        $scope.twList=resp.items;
                        if (resp.items.length < 4) {
                          console.log("in check of 3");
                          angular.forEach(resp.items, function(item){
                              console.log(item.url);
                              $scope.getTwitterByUrl(item.url);
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
                         if (resp.code >= 503) {
                            console.log("503 error")
                            $scope.twNoResults = true;
                            $scope.twIsSearching = false;
                            $scope.apply();
                        }
                        }
                  });
    };
  }else{
    $scope.linkedShortProfile={};
    $scope.linkedProfile={};
    $scope.apply()
  };
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

        $scope.getResults=function(val,location){
          console.log('here executed');
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
           $scope.twitterUrl=function(url){
                         var match="";
                         var matcher = new RegExp("twitter");
                         var test = matcher.test(url);                        
                         return test;
        }
          $scope.getTwitterProfile=function(){
             console.log("in twitter get profile");
              var params={
                "firstname":$scope.contact.firstname,
                "lastname":$scope.contact.lastname
                }
                var twitterurl=null;
                $scope.twNoResults=false;
                if ($scope.infonodes.sociallinks==undefined) {
                  $scope.infonodes.sociallinks=[];
                };
                var savedEntityKey=null;
                if ($scope.infonodes.sociallinks.length > 0) {
                  console.log("in sociallinks");
                   angular.forEach($scope.infonodes.sociallinks, function(link){
                                    console.log(link.url);
                                    if ($scope.twitterUrl(link.url)) {
                                      twitterurl=link.url;
                                      console.log("hereee twitter url");
                                      console.log(link.url);
                                      savedEntityKey=link.entityKey;
                                    };
                                });
                };
                 if (twitterurl) {
                    var par={'url' : twitterurl};
                    $scope.twProfile={};
                   Linkedin.getTwitterProfile(par,function(resp){
                      if(!resp.code){
                       $scope.twProfile.name=resp.name;
                       $scope.twProfile.screen_name=resp.screen_name;
                       $scope.watsonUrl='http://ioco.eu-gb.mybluemix.net/iogrow#/personalitybar/'+resp.screen_name;
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
                       if ($scope.contact.addresses==undefined||$scope.contact.addresses==[]) {
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
                   console.log("in getTwitterList");
                  Linkedin.getTwitterList(params,function(resp){
                     $scope.twIsSearching=true;
                     $scope.twShortProfiles=[];
                     $scope.twProfile={};
                     if(!resp.code){
                      console.log("in twitttttter");
                      console.log(resp.code);
                      $scope.twIsSearching=false;
                      if (resp.items==undefined) {
                        $scope.twList=[];
                        $scope.twNoResults=true;
                        $scope.twIsSearching=false;
                      }else{
                        $scope.twList=resp.items;
                        if (resp.items.length < 4) {
                          console.log("in check of 3");
                          angular.forEach(resp.items, function(item){
                              console.log(item.url);
                              $scope.getTwitterByUrl(item.url);
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
                         if (resp.code >= 503) {
                            console.log("503 error")
                            $scope.twNoResults = true;
                            $scope.twIsSearching = false;
                            $scope.apply();
                        }
                        }
                  });            
                };
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
              $scope.watsonUrl='http://ioco.eu-gb.mybluemix.net/iogrow#/personalitybar/'+shortProfile.screen_name;
              console.log("hhhhhhhhehhehehehhehehe");
              console.log($scope.watsonUrl);
              var link={'url':shortProfile.url}
              $scope.addSocial(link);
              var params ={'id':$scope.contact.id};
              if ($scope.imageSrc=='/static/img/avatar_contact.jpg'||$scope.imageSrc=='') {            
                $scope.imageSrc=$scope.twProfile.profile_image_url_https;
                 params['profile_img_url'] = $scope.twProfile.profile_image_url_https;
              };              
              if ($scope.infonodes.addresses==undefined||$scope.infonodes.addresses==[]) {
                $scope.addGeo({'formatted':$scope.linkedProfile.locality});
              };
              console.log("##############################")
              console.log(params)
               Contact.patch($scope,params);
              $scope.apply();
          }
    $scope.selectAccount = function(){
      console.log($scope.searchAccountQuery);
        $scope.contact.account = $scope.searchAccountQuery.entityKey;

     };
     $scope.getAccount = function(){
      console.log("$scope.searchAccountQuery");
      console.log($scope.searchAccountQuery);
      var params={'id':$scope.contact.id,
                'account':$scope.searchAccountQuery.entityKey
            };
      console.log("before patching");
      Contact.patch($scope,params);

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


app.controller('ContactNewCtrl', ['$scope', '$http', 'Auth', 'Contact', 'Account', 'Edge', 'Map', 'Linkedin','Customfield',
    function ($scope, $http, Auth, Contact, Account, Edge, Map, Linkedin, Customfield) {
      $("ul.page-sidebar-menu li").removeClass("active");
      $("#id_Contacts").addClass("active");

      document.title = "Contacts: New";
      trackMixpanelAction('CONTACT_NEW_VIEW');
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
      $scope.notes=[];
        $scope.accountsResults = [];
      $scope.currentContact = {};
      $scope.phone.type= 'work';
      $scope.imageSrc = '/static/img/avatar_contact.jpg';
      $scope.profile_img = {
                            'profile_img_id':null,
                            'profile_img_url':null
                          };

      $scope.contact_err={
                      'firstname':false,
                      'lastname':false,
                   
                      };
      $scope.noLinkedInResults=false;
      $scope.listPeople=[];
      $scope.linkedProfile={};
      $scope.linkedShortProfile={};
      $scope.showUpload=false;  
      $scope.sociallink={};
      $scope.sociallink.url="";
      $scope.linkedShortProfiles=[];
      $scope.accountFromLinkedin={};
      $scope.contacts=[];
      $scope.contacts.customfields=[];
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
        };
  //HKA 01.06.2014 Delete the infonode on DOM
      $scope.deleteInfos = function(arr,index){
          arr.splice(index, 1);
      };

      $scope.runTheProcess = function(){
        $scope.getCustomFields("contacts");
        $scope.mapAutocomplete();
        //Map.justAutocomplete ($scope,"relatedContactAddress",$scope.currentContact.address);
        ga('send', 'pageview', '/contacts/new');
        window.Intercom('update');
       };

       //newLinkedin
       $scope.messageFromSocialLinkCallback = function(event){
        if (event.origin!=='https://accounts.google.com'&&event.origin!=='https://gcdc2013-iogrow.appspot.com'&&event.origin!=='http://localhost:8090'){
            console.log(event.origin);
            $scope.saveLinkedinData(event.data);
            removeEventListener("message", $scope.messageFromSocialLinkCallback, false);
        }
        };
        $scope.saveLinkedinData=function(data){
          console.log(data);
            $scope.sociallink={};$scope.email={};
            //  $scope.clearContact();
            $scope.inList=[];
            var params={
              'firstname':data.firstname,
              'lastname':data.lastname,
              'cover_image':data.imgCoverUrl,
              'title':data.title,
              'linkedin_profile': 
                  { 
                    "current_post": [],
                    "past_post": [],
                    "skills": [],
                    "formations": [],
                    'education': data.education,
                    'firstname': data.firstname,
                    'industry': data.industry,
                    'lastname': data.lastname,
                    'locality': data.locality,
                    'profile_picture': data.profile_img_url,
                    'resume': data.summary,
                    'title': data.title
                  }
            }
            angular.forEach(data.pastPositions, function(position){
                params.linkedin_profile.past_post.push(JSON.stringify(position));
            });
            angular.forEach(data.currentPositions, function(position){
                params.linkedin_profile.current_post.push(JSON.stringify(position));
            });
            angular.forEach(data.schools, function(position){
                params.linkedin_profile.formations.push(JSON.stringify(position));
              });
            angular.forEach(data.skills, function(position){
                params.linkedin_profile.skills.push(JSON.stringify(position));
              });
            $scope.contact=$.extend(true, $scope.contact, params);
            $scope.imageSrc=data.profile_img_url;
            $scope.profile_img.profile_img_url=data.profile_img_url;
            var phone={
              'number':data.phone
            };
            $scope.pushElement(phone,$scope.phones,'phones');
           // $scope.addressModel=data.locality;
            var email={
              'email':data.email
            };
            var address={'formatted':data.locality};
            $scope.pushElement(address,$scope.addresses,'addresses');
            
            $scope.pushElement(email,$scope.emails,'emails');
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
                    window.open($scope.showLinkedinWindown+'#iogrow','winname','width=700,height=550');
                    window.addEventListener("message", $scope.messageFromSocialLinkCallback, false);
                }
            }else{
                $scope.browser='other';
                $('#extensionNotInstalled').modal({backdrop: 'static', keyboard: false});
            };    
        };
        $scope.lunchWindow=function(){
            window.open($scope.showLinkedinWindown+'#iogrow','winname','width=700,height=550');
            window.addEventListener("message", $scope.messageFromSocialLinkCallback, false);
        }


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

       // for the map 

    $scope.mapAutocomplete=function(){
           // $scope.addresses = $scope.contact.addresses;
            Map.autocomplete ($scope,"pac-input");
        }
      $scope.addNote = function(){
       $scope.notes.push($scope.newnote)
       $scope.newnote={}
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
      $scope.getResults=function(val,location){
          console.log('here executed');
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
                                    'property_type':customfield.property_type,
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
                      "field": "formatted",
                      "value": address.formatted
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
          $scope.$watch('contact', function(newVal, oldVal){
          if (newVal.firstname)  $scope.contact_err.firstname=false;
          if (newVal.lastname)  $scope.contact_err.lastname=false;

      }, true);
          $scope.validateBeforeSave=function(contact){
           if (!contact.firstname) $scope.contact_err.firstname=true;
            else $scope.contact_err.firstname=false;  
          if (!contact.lastname) $scope.contact_err.lastname=true;
            else $scope.contact_err.lastname=false;
          if (!$scope.contact_err.firstname && !$scope.contact_err.lastname)  $scope.save(contact)
      }
      // new Contact
     $scope.save = function(contact , force){
        force = force || false;
          var sameContactModal = angular.element("#sameContactModal");
            if (force && sameContactModal.length) {
                sameContactModal.modal("hide");
                $('body').removeClass('modal-open');
                $('.modal-backdrop').remove();
            }
          var delayInsert = false;
          if ($scope.addressmodal) {
                          $scope.addGeo({'formatted':$scope.addressmodal});
          };
          var params ={
                'firstname':contact.firstname,
                'lastname':contact.lastname,
                'title':contact.title,
                'tagline':contact.tagline,
                'cover_image':contact.cover_image,
                'introduction':contact.introduction,
                'phones':$scope.phones,
                'emails':$scope.emails,
                'infonodes':$scope.prepareInfonodes(),
                'access': contact.access||'public',
                'notes':$scope.notes,
                'linkedin_profile':contact.linkedin_profile
              };
              var test=$scope.prepareInfonodes();
              console.log("test");
              console.log(test);
          if (typeof(contact.account)=='object'){
              params['account'] = contact.account.entityKey;
          }else if($scope.searchAccountQuery){
              if ($scope.searchAccountQuery.length>0){
                // create a new account with this account name
                var accountparams={};
                if (!$scope.isEmpty($scope.accountFromLinkedin)) {
                  accountparams=$scope.accountFromLinkedin;
                  $scope.accountFromLinkedin={};
                }else{
                  accountparams = {
                            'name': $scope.searchAccountQuery,
                            'access': contact.access
                          };
                };
                $scope.contact = contact;
                Account.insert($scope,accountparams);
                delayInsert = true;
              };
          };
          if(!delayInsert){
          if ($scope.profile_img.profile_img_id){
              params['profile_img_id'] = $scope.profile_img.profile_img_id;
              if($scope.profile_img.profile_img_id){
                  params['profile_img_url'] = 'https://docs.google.com/uc?id='+$scope.profile_img.profile_img_id;
              }else{
                  if($scope.profile_img.profile_img_url){
                      params['profile_img_url'] = $scope.profile_img.profile_img_url;
                  }
                  
              }
              
          }
          if($scope.profile_img.profile_img_url){
                      params['profile_img_url'] = $scope.profile_img.profile_img_url;
          }
            Contact.create($scope, params, force);
          }

      };
      $scope.contactInserted = function(resp){
          window.location.replace('/#/contacts/show/'+resp.id);
      }

      $scope.selectAccount = function(){
        $scope.contact.account = $scope.searchAccountQuery;

      };
      $scope.isEmpty=function(obj){
        return jQuery.isEmptyObject(obj);
      }
       $scope.getLinkedinProfile=function(){
              console.log("in linkedin get people");
              var params={
                "firstname":$scope.contact.firstname,
                "lastname":$scope.contact.lastname
                }
                $scope.inNoResults=false;
                Linkedin.listPeople(params,function(resp){
                     console.log('in list resp');
                     console.log(resp); 
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
                            };
                         console.log($scope.inList);
                         $scope.isLoading = false;
                         $scope.apply();
                        }else {
                          console.log("no 401");
                             if(resp.code==401){
                             console.log("no resp");
                              $scope.isLoading = false;
                              $scope.apply();
                             };
                             if (resp.code >= 503) {
                                  $scope.inNoResults = true;
                                  $scope.inIsSearching = false;
                                  $scope.apply();
                              }
                        }
                  });            
            }
       // $scope.getLinkedinByUrl=function(url){
       //         $scope.inIsLoading=true;
       //         var par={'url' : url};
       //         Linkedin.profileGet(par,function(resp){
       //                if(!resp.code){
       //                   prof={};
       //                   prof.fullname=resp.fullname;
       //                   prof.url=url;
       //                   prof.profile_picture=resp.profile_picture;
       //                   prof.title=resp.title;
       //                   prof.locality=resp.locality;
       //                   prof.industry=resp.industry; 
       //                   prof.formations=resp.formations
       //                   prof.resume=resp.resume;
       //                   prof.skills=resp.skills;
       //                   prof.current_post=resp.current_post;
       //                   prof.past_post=resp.past_post;
       //                   prof.experiences=JSON.parse(resp.experiences);  
       //                   if(prof.experiences){
       //                    prof.experiences.curr=prof.experiences['current-position'];
       //                    prof.experiences.past=prof.experiences['past-position'];
       //                   }         
       //                   $scope.inShortProfiles.push(prof);
       //                   $scope.inIsLoading=false;
       //                   $scope.apply();
       //                }else {
       //                   if(resp.code==401){
       //                    $scope.inIsLoading=false;
       //                    $scope.apply();
       //                   };
       //                }
       //             });
       //      }
        $scope.twitterUrl=function(url){
                         var match="";
                         var matcher = new RegExp("twitter");
                         var test = matcher.test(url);                        
                         return test;
        }
        $scope.getTwitterProfile=function(){
              console.log("getTwitterProfile");
              var params={
                "firstname":$scope.contact.firstname,
                "lastname":$scope.contact.lastname
                }
                var twitterurl=null;
                $scope.twNoResults=false;
                if ($scope.contact.sociallinks==undefined) {
                  $scope.contact.sociallinks=[];
                };
                var savedEntityKey=null;
                if ($scope.contact.sociallinks.length > 0) {
                   angular.forEach($scope.contact.sociallinks, function(link){
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
                       if ($scope.contact.addresses==undefined||$scope.contact.addresses==[]) {
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
                         if (resp.code >= 503) {
                            console.log("503 error")
                            $scope.twNoResults = true;
                            $scope.twIsSearching = false;
                            $scope.apply();
                        }
                        }
                  });            
                };
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
              $scope.pushElement($scope.sociallink,$scope.sociallinks,'sociallinks');
              $scope.pushElement($scope.website,$scope.websites,'websites');
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
        $scope.urlSource=function(url){
            var links=["aim","bebo","behance","blogger","delicious","deviantart","digg","dribbble","evernote","facebook","fastfm","flickr","formspring","foursquare","github","google-plus","instagram","linkedin","myspace","orkut","path","pinterest","quora","reddit","rss","soundcloud","stumbleupn","technorati","tumblr","twitter","vimeo","wordpress","yelp","youtube"];
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
    $scope.showSelectButton=function(index){
      $("#item_"+index).addClass('grayBackground');
      $("#select_"+index).removeClass('selectLinkedinButton');
      if (index!=0) {
         $("#item_0").removeClass('grayBackground');
         $("#select_0").addClass('selectLinkedinButton');
      };
    }
    $scope.hideSelectButton=function(index){
   
      if (!$("#select_"+index).hasClass('alltimeShowSelect')) {
        $("#item_"+index).removeClass('grayBackground');
        $("#select_"+index).addClass('selectLinkedinButton');
      };
      if (index!=0) {
         $("#item_0").addClass('grayBackground');
         $("#select_0").removeClass('selectLinkedinButton');
      };
      
    }; 
    $scope.showSelectTwitter=function(index){
      $("#titem_"+index).addClass('grayBackground');
      $("#tselect_"+index).removeClass('selectLinkedinButton');
      if (index!=0) {
         $("#titem_0").removeClass('grayBackground');
         $("#tselect_0").addClass('selectLinkedinButton');
      };
    }
    $scope.hideSelectTwitter=function(index){
   
      if (!$("#tselect_"+index).hasClass('alltimeShowSelect')) {
        $("#titem_"+index).removeClass('grayBackground');
        $("#tselect_"+index).addClass('selectLinkedinButton');
      };
      if (index!=0) {
         $("#titem_0").addClass('grayBackground');
         $("#tselect_0").removeClass('selectLinkedinButton');
      };
      
    }; 
      $scope.clearLinkedin=function(){
        $scope.linkedProfile={};
        $scope.linkedShortProfile={};
        $scope.apply()
      }
      $scope.clearContact=function(){
        $scope.inList=[];
        $scope.twList=[];
        $scope.inCList=[];
        $scope.contact={};
        $scope.imageSrc='/static/img/avatar_contact.jpg';
        $scope.searchAccountQuery=null;
        $scope.addresses=[];
        $scope.websites=[];
        $scope.phones=[];
        $scope.emails=[];        
        $scope.addressModel=null;
        $scope.sociallinks=[];
        $scope.linkedProfile={};
        $scope.linkedShortProfile={};
        $scope.listPeople=[];
         $scope.twList=[];
              $scope.twShortProfiles =[];
              $scope.twProfile={};
        $scope.apply();
      }
       $scope.extractCompanyName=function(company){
              var i=company.length-1;
              while (i >0) {
                  if (company.charAt(i)==' '||company.charAt(i)==',') {
                    company=company.substring(0, i-1);
                  }else{
                    return company;
                  };
                  i=i-1;
                
              }
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
          $scope.pushElement($scope.sociallink,$scope.sociallinks,'sociallinks');
          $scope.imageSrc = $scope.inProfile.profile_picture;
          $scope.profile_img.profile_img_url = $scope.inProfile.profile_picture;
          if ($scope.inProfile.title) {
            $scope.contact.title = $scope.inProfile.title;
          };
          if($scope.inProfile.current_post){
                if ($scope.inProfile.current_post[0]){
                    console.log("company");
                    console.log($scope.inProfile.current_post[0]);
                       var params_search_account ={};
                       $scope.result = undefined;
                       $scope.q = undefined;
                      params_search_account['q'] = $scope.extractCompanyName($scope.inProfile.current_post[0]);
                      console.log("params_search_account['q']");
                      console.log(params_search_account['q']);
                      Account.searchb(params_search_account,function(resp){
                        if (resp.items) {
                            console.log("resp.items from account search");
                            console.log(resp.items);
                            $scope.accountsResults = resp.items;
                            if (!$scope.isEmptyArray($scope.accountsResults)) {
                              $scope.contact.account=$scope.accountsResults[0];
                              $scope.searchAccountQuery=$scope.accountsResults[0];                    
                            }else{
                              $scope.searchAccountQuery=$scope.extractCompanyName($scope.inProfile.current_post[0]);
                            };
                            $scope.apply();
                        }else{
                          console.log("in else of search");
                          console.log("params_search_account['q']");
                          console.log(params_search_account['q']);
                          $scope.searchAccountQuery=params_search_account['q'];
                          var params={
                             "company":params_search_account['q']
                            }  
                          Linkedin.listCompanies(params,function(resp){
                             $scope.inCIsSearching=true;
                             $scope.inCShortProfiles=[];
                             $scope.inCProfile={};
                             if(!resp.code){
                              $scope.inCIsSearching=false;
                              if (resp.items==undefined) {
                                $scope.inCList=[];
                                $scope.inCNoResults=true;
                                $scope.inCIsSearching=false;
                                console.log('finishing companies list');
                              }else{
                                $scope.inCList=resp.items;
                                console.log("resp.items");
                                console.log(resp.items);
                                if (resp.items.length < 4) {
                                    console.log("in check of 3");
                                    angular.forEach(resp.items, function(item){
                                        console.log(item.url);
                                        $scope.getCLinkedinByUrl(item.url);
                                  });
                                }
                                console.log('finishing companies list');
                              };  
                                 $scope.isLoading = false;
                                 $scope.$apply();
                                }else {
                                  console.log("no 401");
                                   if(resp.code==401){
                                    // $scope.refreshToken();
                                    $scope.isLoading = false;
                                    $scope.$apply();
                                   };
                                }
                          });    
                          $scope.apply();
                        }
                      });
                }
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
      $scope.getCLinkedinByUrl=function(url){
              console.log('innnnnn getLinkedinByUrl');
               $scope.linkedLoader=true;
               var par={'url' : url};
               Linkedin.getCompany(par,function(resp){
                      if(!resp.code){
                         var prof={};
                         prof.company_size=resp.company_size;
                         prof.headquarters=resp.headquarters;
                         prof.followers=resp.followers;
                         prof.founded=resp.founded;
                         prof.locality=resp.locality;
                         prof.industry=resp.industry; 
                         prof.logo=resp.logo
                         prof.name=resp.name;
                         prof.summary=resp.summary;
                         prof.top_image=resp.top_image;
                         prof.type=resp.type;
                         prof.url=resp.url;
                         prof.website=resp.website;    
                         $scope.inCShortProfiles.push(prof);
                         $scope.inCIsLoading=false;
                         $scope.apply();
                      }else {
                        console.log("no 401");
                         if(resp.code==401){
                          // $scope.refreshToken();
                         console.log("no resp");
                          $scope.linkedLoader=false;
                          $scope.apply();
                         };
                      }
                   });
            }
         $scope.saveCLinkedinUrl=function(shortProfile){
            $scope.inCList=[];
            $scope.inCShortProfiles=[];
            $scope.inCProfile={};
            $scope.accountFromLinkedin={
              'industry':shortProfile.industry,
              'name':shortProfile.name,
              'infonodes': [{'kind': 'sociallinks','fields': [{'field': "url",'value': shortProfile.url}]},{'kind': 'websites','fields': [{'field': "url",'value': shortProfile.website}]}],
              'logo_img_url':shortProfile.logo,
              'addresses':[{'formatted':shortProfile.headquarters,city:null,country:null,street:null}],
              'access':'public'
            }
            console.log("object inserted");
            console.log($scope.accountFromLinkedin);
            $scope.addGeo({'formatted':shortProfile.headquarters,city:null,country:null,street:null});
            $scope.apply();
          }
         $scope.showSelectButton=function(index){
      $("#item_"+index).addClass('grayBackground');
      $("#select_"+index).removeClass('selectLinkedinButton');
      if (index!=0) {
         $("#item_0").removeClass('grayBackground');
         $("#select_0").addClass('selectLinkedinButton');
      };
    }
    $scope.hideSelectButton=function(index){
   
      if (!$("#select_"+index).hasClass('alltimeShowSelect')) {
        $("#item_"+index).removeClass('grayBackground');
        $("#select_"+index).addClass('selectLinkedinButton');
      };
      if (index!=0) {
         $("#item_0").addClass('grayBackground');
         $("#select_0").removeClass('selectLinkedinButton');
      };
      
    }; 
    $scope.addLinkedIn = function(social){
      $scope.getLinkedinByUrl(social.url);
    };
    $scope.mergedContacts = 0;
    $scope.mergeContact = function (baseContact, newContact) {
        var delayInsert = false;
        if ($scope.addressmodal) {
            $scope.addGeo({'formatted': $scope.addressmodal});
        };
        var params = {
            'firstname': newContact.firstname,
            'lastname': newContact.lastname,
            'title': newContact.title,
            'tagline': newContact.tagline,
            'introduction': newContact.introduction,
            'phones': $scope.phones,
            'emails': $scope.emails,
            'infonodes': $scope.prepareInfonodes(),
            'access': newContact.access,
            'notes': $scope.notes
        };
        if (typeof(newContact.account) == 'object') {
            params['account'] = newContact.account.entityKey;
        } else if ($scope.searchAccountQuery) {
            if ($scope.searchAccountQuery.length > 0) {
                // create a new account with this account name
                var accountparams = {};
                if (!$scope.isEmpty($scope.accountFromLinkedin)) {
                    accountparams = $scope.accountFromLinkedin;
                    $scope.accountFromLinkedin = {};
                } else {
                    accountparams = {
                        'name': $scope.searchAccountQuery,
                        'access': newContact.access
                    };
                }
                ;
                $scope.contact = newContact;
                Account.insert($scope, accountparams);
                delayInsert = true;
            };
        };
        if (!delayInsert) {
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
            if ($scope.profile_img.profile_img_url) {
                params['profile_img_url'] = $scope.profile_img.profile_img_url;
            }

            //Contact.create($scope, params);
            var params = {base_id: baseContact.id, new_contact: params};
            Contact.mergeContact($scope, params);
        }

    };
    $scope.openContactDetailView = function (id) {
        var width = screen.width / 2;
        var height = screen.width / 2;
        var left = (screen.width / 2) - (width / 2);
        var top = (screen.height / 2) - (height / 2);
        var url = '/#/contacts/show/' + id;
        var windowFeatures = "scrollbars=yes, resizable=yes, top=" + top + ", left=" + left +
            ", width=" + width + ", height=" + height + "menubar=no,resizable=no,status=no ";
        window.open(url, "_blank", windowFeatures);
    };

   // Google+ Authentication
     Auth.init($scope);
}]);
