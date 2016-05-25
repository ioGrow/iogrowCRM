 app.controller('AccountListCtrl', ['$scope', '$filter', 'Auth', 'Account', 'Tag', 'Edge','Attachement', 'Email','User','Event','Task','Permission',
    function($scope, $filter, Auth, Account, Tag, Edge,Attachement, Email,User,Event,Task,Permission) {
        $("ul.page-sidebar-menu li").removeClass("active");
        $("#id_Accounts").addClass("active");
        document.title = "Accounts: Home";
        trackMixpanelAction('ACCOUNT_LIST_VIEW');
        $scope.selectedOption = 'all';
        $scope.isSignedIn = false;
        $scope.immediateFailed = false;
        $scope.nextPageToken = undefined;
        $scope.prevPageToken = undefined;
        $scope.isLoading = false;
        $scope.nbLoads=0;
        $scope.Loadingtest=false;
        $scope.isMoreItemLoading = false;
        $scope.pagination = {};
        $scope.currentPage = 1;
        $scope.pages = [];
        $scope.accounts = [];
        $scope.account = {};
        $scope.selected_tags = [];
        $scope.account.access = 'public';
        $scope.order = '-updated_at';
        $scope.account.account_type = 'Customer';
        $scope.draggedTag = null;
        $scope.tag = {};
        $scope.tags = [];
        $scope.testtitle = "Customer Support Customer Support";
        $scope.showNewTag = false;
        $scope.showUntag = false;
        $scope.edgekeytoDelete = undefined;
        $scope.show="cards";
        $scope.email={};
        $scope.selectedCards=[];
        $scope.allCardsSelected=false;
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
        $scope.tag.color = {'name': 'green', 'color': '#BBE535'};
        $scope.selectedAccount=null;
        $scope.currentAccount=null;
        $scope.accountToMail=null;
        $scope.showTagsFilter=false;
        $scope.showNewTag=false;
        $scope.emailSentMessage=false;
        $scope.smallModal=false;
        $scope.accountsfilter='all';
        $scope.contactsAssignee=null;
        $scope.selected_access='public';
        $scope.selectedPermisssions=true;
        $scope.sharing_with=[];
        $scope.filterNoResult=false;
        $scope.owner=null;
       $scope.isEmptyArray = function (Array) {
            return !(Array != undefined && Array.length > 0);;
        }
        $scope.accountFilterBy=function(filter,assignee){
            if ($scope.accountsfilter!=filter) {
                    var params={};
                    switch(filter) {
                    case 'all':
                       $scope.owner=null;
                       params=$scope.getRequestParams();
                       Account.list($scope,params,true);
                       $scope.accountsfilter=filter;
                       $scope.contactsAssignee=null;
                        break;
                    case 'my':
                        $scope.owner=assignee;
                        params=$scope.getRequestParams();
                        Account.list($scope,params,true);
                        $scope.contactsAssignee=assignee;
                        $scope.accountsfilter=filter;
                        break;
            }
          }
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
        $scope.inProcess=function(varBool,message){
          if (varBool) {   
            $scope.nbLoads += 1;
            if ($scope.nbLoads==1) {
              $scope.isLoading=true;
            }
          }else{
            $scope.nbLoads -= 1;
            if ($scope.nbLoads==0) {
               $scope.isLoading=false;
            }
          }
        };       
        $scope.fromNow = function(fromDate){
            return moment(fromDate,"YYYY-MM-DD HH:mm Z").fromNow();
        };
        $scope.apply=function(){
         
          if ($scope.$root.$$phase != '$apply' && $scope.$root.$$phase != '$digest') {
               $scope.$apply();
              }
              return false;
        };
       $scope.selectMember = function(){  
            if ($scope.sharing_with.indexOf($scope.user)==-1) {
                $scope.slected_memeber = $scope.user;

            $scope.sharing_with.push($scope.slected_memeber);
            }
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
                        Account.patch($scope, params);
                        // who is the parent of this event .hadji hicham 21-07-2014.

                        params["parent"] = "account";
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
          angular.forEach($scope.selectedCards, function(selected_account){
              if (selected_account.owner.google_user_id!=me) {
                $scope.selectedPermisssions=false;
              }
          });
        }
   $scope.getColaborators=function(){

   };
  $scope.emailSignature=document.getElementById("signature").value;
  if($scope.emailSignature =="None"){
    $scope.emailSignature="";
  }else{
    $scope.emailSignature="<br/><br/><br/><br/><br/><br/><br/><br/><br/><br/>"+$scope.emailSignature;
  }

   document.getElementById("some-textarea").value=$scope.emailSignature;


        $scope.runTheProcess = function() {
              var params = {'order': $scope.order,
                  'limit': 20}
              Account.list($scope, params);
              User.list($scope,{});
              var paramsTag = {'about_kind': 'Account'};
              Tag.list($scope, paramsTag); 
              ga('send', 'pageview', '/accounts');
              if (localStorage['accountShow']!=undefined) {
                 $scope.show=localStorage['accountShow'];
              };

        };


// google picker for uploading files 

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

            Account.importSecondStep($scope, params);
            // invoke the right service
            // hide the modal
        }
        $scope.showImportMessages = function () {
            $('#importMessagesModal').modal('show');
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
                    Account.import($scope,params);
                }
        }
      };


// ACCOUNT SHOW UPLAOD FILES 
    $scope.showImportModal = function(){
          $('#importModal').modal('show');
        }
         $scope.wizard = function(){
        localStorage['completedTour'] = 'True';
        var tour = {
            id: "hello-hopscotch",
             steps: [
             {
                title: "Step 1: Create New account",
                content: "Click here to create new account and add detail about it.",
                target: "new_account",
                placement: "bottom"
              },
             {
                
                title: "Step 2: Add tags",
                content: "Add Tags to filter your accounts.",
                target: "add_tag",
                placement: "left"
              },
             
              {
                title: "Step 2: Export accounts",
                content: "Export your accounts as a CSV file.",
                target: "sample_editable_1_new",
                placement: "bottom"
              }
              
            
            ]
           
          };
          // Start the tour!
          hopscotch.startTour(tour);
      };
        
       
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
        $scope.smallModal=false;
        $scope.gotosendMail = function(email,lead){

                   $scope.accountToMail=lead;
                   $scope.email.to = email;
                   $('#testnonefade').modal("show");
                   $scope.smallSendMail();
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


//Lebdiri arezki 2/10/2015/
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
                angular.forEach($scope.selectedCards, function (selected_account) {
                    ids.push(selected_account.id);
                });
                Account.export_key($scope, {ids: ids});
            } else {
                var tags = [];
                angular.forEach($scope.selected_tags, function (selected_tag) {
                    tags.push(selected_tag.entityKey);
                });
                var params = {"tags": tags};
                Account.export($scope, params);
                $scope.selectedKeyLeads = [];
            }
            $("#TakesFewMinutes").modal('hide');
        }
$scope.DataLoaded=function(data){
        $("#load_btn").removeAttr("disabled");
      $("#close_btn").removeAttr("disabled");
      $scope.isExporting=false;
       $("#TakesFewMinutes").modal('hide');
      $scope.$apply()

  $scope.JSONToCSVConvertor($scope.serializedata(data), "Accounts", true);
}







$scope.serializedata=function(data){
for (var i = data.length - 1; i >= 0; i--) {
if(data[i].name){data[i].name=data[i]["name"];}else{data[i]["name"]="";}
if(data[i].type){data[i].type=data[i]["type"];}else{data[i]["type"]="";}
if(data[i].industry){data[i].industry=data[i]["industry"];}else{data[i]["industry"]="";}
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
        
 
        row='name,type,industry,emails,phones,addresses,';
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
            if(arrData[i]["phones"].items){
                    phonesCont=""
              for(var j=0;j< arrData[i]["phones"].items.length;j++){
                      phonesCont +=arrData[i]["phones"].items[j].number+" ";
            }
            

            }
             if(arrData[i]["emails"].items){
                    emailsCont=""
              for(var k=0;k< arrData[i]["emails"].items.length;k++){
                      emailsCont +=arrData[i]["emails"].items[k].email+" ";
            }
          

            }

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
        row='"'+arrData[i]["name"]+'",'+'"'+arrData[i]["type"]+'",'+'"'+arrData[i]["industry"]+'",'+'"'+emailsCont+'",'+'"'+phonesCont+'",'+'"'+addressesCont+'",';
        
      

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
        $scope.sendEmail = function(email){
        
        email.body = $('#some-textarea').val();
        var params = {
                  'to': email.to,
                  'cc': email.cc,
                  'bcc': email.bcc,
                  'subject': email.subject,
                  'body': email.body,
                  'about':$scope.accountToMail.entityKey
                  };
        if ($scope.sendWithAttachments){
            params['files']={
                            'parent':$scope.accountToMail.entityKey,
                            'access':$scope.accountToMail.access,
                            'items':$scope.sendWithAttachments
                            };
        };
        
        Email.send($scope,params,true);       
      };
        $scope.emailSentConfirmation=function(){
            $scope.email={};
            $scope.showCC=false;
            $scope.showBCC=false;
            $scope.accountToMail=null;
            $('#testnonefade').modal("hide");
             $scope.email={};
             $scope.emailSentMessage=true;
             setTimeout(function(){  $scope.emailSentMessage=false; $scope.apply() }, 2000);
        }

// HADJI HICHAM -04/02/2015

   $scope.removeTag = function(tag,account) {
            

            $scope.dragTagItem(tag,account);
            $scope.dropOutTag();
        }



        $scope.getPosition = function(index) {
            if (index < 4) {

                return index + 1;
            } else {
                return (index % 4) + 1;
            }
        };
         $scope.filterByName=function(){
          if ($scope.fltby!='name') {
                 $scope.fltby = 'name'; $scope.reverse=false
          }else{
                 $scope.fltby = '-name'; $scope.reverse=false;
          };
         }
         $scope.switchShow=function(){
          if ($scope.show=='list') {                
             $scope.show = 'cards';
             localStorage['accountShow']="cards";
             $scope.selectedCards =[];
             $("#accountCardsContainer").trigger( 'resize' );
          }else{
                  if ($scope.show=='cards') {
                             $scope.show = 'list';
                              localStorage['accountShow']="list";
                             $scope.selectedCards =[];
                             
                  }
          };
        }
        $scope.isSelectedCard = function(account) {
          return ($scope.selectedCards.indexOf(account) >= 0);
        };
        $scope.unselectAll = function($event){
             var element=$($event.target);
             if(element.hasClass('waterfall')){
                $scope.selectedCards=[];
             };
        }
        $scope.selectAll = function($event){
       
            var checkbox = $event.target;
             if(checkbox.checked){
                $scope.selectedCards=[];
                $scope.selectedCards=$scope.selectedCards.concat($scope.accounts);
                  
                $scope.allCardsSelected=true;

             }else{

              $scope.selectedCards=[];
              $scope.allCardsSelected=false;
              
             }
        };
        $scope.editbeforedeleteselection = function(){
          $('#BeforedeleteSelectedAccounts').modal('show');
        };
        $scope.deleteSelection = function(){
            angular.forEach($scope.selectedCards, function(selected_account){
                var params = {'entityKey':selected_account.entityKey};
                Account.delete($scope, params);
            });
             $('#BeforedeleteSelectedAccounts').modal('hide');
        };
        $scope.accountDeleted=function(entityKey){
          if (!jQuery.isEmptyObject($scope.selectedAccount)) {
                $scope.accounts.splice($scope.accounts.indexOf($scope.selectedAccount), 1);
            } else {
                var indx=null;
                angular.forEach($scope.selectedCards, function (selected_account) {
                    if (entityKey==selected_account.entityKey) {
                        $scope.accounts.splice($scope.accounts.indexOf(selected_account), 1);
                        indx=selected_account;
                    }
                });
                $scope.selectedCards.splice($scope.selectedCards.indexOf(indx),1);
                if ($scope.isEmptyArray($scope.selectedCards)) {
                    var params=$scope.getRequestParams();
                    Account.list($scope,params);
                }
                $scope.apply();
            }
        }
        $scope.selectCardwithCheck=function($event,index,account){

            var checkbox = $event.target;

             if(checkbox.checked){
                if ($scope.selectedCards.indexOf(account) == -1) {             
                  $scope.selectedCards.push(account);
                }
             }else{       
                  $scope.selectedCards.splice($scope.selectedCards.indexOf(account) , 1);
             }

        }

        // We need to call this to refresh token when user credentials are invalid
        $scope.refreshToken = function() {
            Auth.refreshToken();
        };
            $scope.editbeforedelete = function(account){
                 $scope.selectedAccount=account;
                 $('#BeforedeleteAccount').modal('show');
             };
            $scope.deleteaccount = function(){
                 var params = {'entityKey':$scope.selectedAccount.entityKey};
                 Account.delete($scope, params);
                 $('#BeforedeleteAccount').modal('hide');                 
             };
            $scope.showAssigneeTags=function(account){
              if (account) {                  
                $scope.currentAccount=account;
              }
                $('#assigneeTagsToAccount').modal('show');
             };
           $scope.addTagstoAccounts=function(){
                var tags=[];
                var items = [];
                tags=$('#select2_sample2').select2("val");
                if ($scope.currentAccount!=null) {
                  angular.forEach(tags, function(tag){
                           var params = {
                             'parent': $scope.currentAccount.entityKey,
                             'tag_key': tag
                          };

                         Tag.attach($scope, params,$scope.accounts.indexOf($scope.currentAccount));
                        });
                  $scope.currentAccount=null;
                }else{
                  angular.forEach($scope.selectedCards, function(selected_account){
                    angular.forEach(tags, function(tag){
                      var params = {
                        'parent': selected_account.entityKey,
                        'tag_key': tag
                      };
                       Tag.attach($scope, params);
                    });

                });
                }
                $scope.apply();
                $scope.clearTagsModel("select2_sample2");
                $('#assigneeTagsToAccount').modal('hide');
               };
            $scope.addTagsTothis=function(){
              var tags=[];
              var items = [];
              tags=$('#select2_sample2').select2("val");              
                  angular.forEach(tags, function(tag){
                    var edge = {
                      'start_node': $scope.currentAccount.entityKey,
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
              $scope.currentAccount=null;
              $('#assigneeTagsToAccount').modal('hide');
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
        // Next and Prev pagination
        $scope.listNextPageItems = function() {
            var nextPage = $scope.currentPage + 1;
            var params = {};
            if ($scope.pages[nextPage]) {
                params = {'limit': 6,
                    'order': $scope.order,
                    'pageToken': $scope.pages[nextPage]
                }
            } else {
                params = {'order': $scope.order, 'limit': 6}
            }
            $scope.currentPage += 1;
            Account.list($scope, params);
        };
        $scope.listMoreItems = function() {

            var nextPage = $scope.currentPage + 1;
            var params = {};
            if ($scope.pages[nextPage]) {
                params = $scope.getRequestParams();
                params.pageToken=$scope.pages[nextPage];
                $scope.currentPage += 1;
                Account.listMore($scope, params);
            }

        };
        $scope.listPrevPageItems = function() {
            var prevPage = $scope.currentPage - 1;
            var params = {};
            if ($scope.pages[prevPage]) {
                params = {'limit': 6,
                    'order': $scope.order,
                    'pageToken': $scope.pages[prevPage]
                }
            } else {
                params = {'order': $scope.order, 'limit': 6}
            }
            $scope.currentPage -= 1;
            Account.list($scope, params);
        };
        // Add a new account methods
        // Show the modal
        $scope.showModal = function() {
            $('#addAccountModal').modal('show');
        };
        // Insert the account if enter button is pressed
        $scope.addAccountOnKey = function(account) {
            if (event.keyCode == 13 && account) {
                $scope.save(account);
            }
            ;
        };
        $scope.addAccountOnKey = function(account) {
            if (event.keyCode == 13 && account) {
                $scope.save(account);
            }


        };

        $scope.accountInserted = function(resp) {
            if ($scope.accounts == undefined) {
                $scope.accounts = [];
                $scope.blankStateaccount = false;
            }
            $scope.account.name = '';
            $scope.accounts.push(resp);
            $scope.apply();
        };
        // Quick Filtering
        var searchParams = {};
        $scope.result = undefined;
        $scope.q = undefined;




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
        $scope.selectResult = function() {
            window.location.replace('#/accounts/show/' + $scope.searchQuery.id);
        };
        $scope.executeSearch = function(searchQuery) {
            if (typeof (searchQuery) == 'string') {
                var goToSearch = 'type:Account ' + searchQuery;
                window.location.replace('#/search/' + goToSearch);
            } else {
                window.location.replace('#/accounts/show/' + searchQuery.id);
            }
            $scope.searchQuery = ' ';
            $scope.apply();
        };
        // Sorting
        $scope.orderBy = function(order) {
            $scope.order = order;
            var params=$scope.getRequestParams();
            Account.list($scope, params);
        };
        $scope.filterByOwner = function(filter) {
            if (filter) {
                var params = {'owner': filter,
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
            Account.list($scope, params);
        };

        $scope.listTags = function() {
            var paramsTag = {'about_kind': 'Account'}
            Tag.list($scope, paramsTag);

        };
        $scope.edgeInserted = function() {
            $scope.listaccounts();
        };
        $scope.listaccounts = function() {
            var params = {'order': $scope.order,
                'limit': 20}
            Account.list($scope, params);
        };


        $scope.addNewtag = function(tag) {
            var params = {
                'name': tag.name,
                'about_kind': 'Account',
                'color': tag.color.color
            };
            Tag.insert($scope, params);
            tag.name = '';
            $scope.tag.color = {'name': 'green', 'color': '#BBE535'};
        }
        $scope.tagInserted=function(resp){
            if ($scope.tags==undefined) {
                $scope.tags=[];
            };
            $scope.tags.unshift(resp);
            $scope.apply();
        }
        $scope.updateTag = function(tag) {
            params = {'id': tag.id,
                'title': tag.name,
                'status': tag.color
            };
            Tag.patch($scope, params);
        };
        $scope.deleteTag = function(tag) {
            params = {
                'entityKey': tag.entityKey
            }
            Tag.delete($scope, params);

        };

        $scope.listTags = function() {
            var paramsTag = {'about_kind': 'Account'};
            Tag.list($scope, paramsTag);
        };

        $scope.selectTag = function(tag, index, $event) {
            if (!$scope.manage_tags) {
                var element = $($event.target);
                if (element.prop("tagName") != 'LI') {
                    element = element.parent().closest('LI');
                }
                var text = element.find(".with-color");
                if ($scope.selected_tags.indexOf(tag) == -1) {
                    $scope.selected_tags.push(tag);

                } else {
                    $scope.selected_tags.splice($scope.selected_tags.indexOf(tag), 1);
                }

                $scope.filterByTags($scope.selected_tags);

            }

        };
        $scope.filterByTags = function(selected_tags) {


            var tags = [];
            angular.forEach(selected_tags, function(tag) {
                tags.push(tag.entityKey);
            });
            var params = $scope.getRequestParams();
            $scope.isFiltering = true;
            Account.list($scope, params);

        };

        $scope.unselectAllTags = function() {
            $('.tags-list li').each(function() {
                var element = $(this);
                var text = element.find(".with-color");
                element.css('background-color', '#ffffff !important');
                text.css('color', '#000000');
            });
        };
//HKA 19.02.2014 When delete tag render account list
        $scope.tagDeleted = function() {
             $scope.listTags();
             $scope.listaccounts();
        };
        $scope.tagUnattached = function() {
            $scope.accounttoUnattachTag.tags.splice($scope.accounttoUnattachTag.tags.indexOf($scope.tagtoUnattach),1)
            $scope.apply()
        };


        $scope.manage = function() {
            $scope.unselectAllTags();
        };
        $scope.tag_save = function(tag) {
            if (tag.name) {
                Tag.insert($scope, tag);

            }
            ;
        };
        $scope.hideEditable=function(index,tag){

      document.getElementById("tag_"+index).style.backgroundColor=tag.color;
      document.getElementById("closy_"+index).removeAttribute("style");
      document.getElementById("checky_"+index).style.display="inline";

          $scope.hideeverything=false;
          $scope.edited_tag=null;

        }
        $scope.editTag = function(tag,index) {
          document.getElementById("tag_"+index).style.backgroundColor="white";
          document.getElementById("closy_"+index).style.display="none";
          document.getElementById("checky_"+index).style.display="none";
            
            $scope.edited_tag = tag;
        }
        $scope.doneEditTag = function(tag) {

            $scope.edited_tag = null;
            $scope.updateTag(tag);
        }

        var handleColorPicker = function() {
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
        $scope.idealTextColor = function(bgColor) {
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
        $scope.dragTag = function(tag) {
            $scope.draggedTag = tag;

        }
        $scope.disassociate = function(tag) {
            $scope.disassociated = tag;

        }
        $scope.inTag = function(tag) {

            $scope.disassociated = tag;

        }
        $scope.dropTag = function(account, index) {
            var items = [];
            var params = {
                'parent': account.entityKey,
                'tag_key': $scope.draggedTag.entityKey
            };
            $scope.draggedTag = null;
            Tag.attach($scope, params, index);
            $scope.apply();
        };
        $scope.dropOutTag = function() {

            var params = {'entityKey': $scope.edgekeytoDelete}
            Edge.delete($scope, params);
            $scope.edgekeytoDelete = undefined;
            $scope.showUntag = false;

        }
        $scope.dragTagItem = function(tag,account) {

            $scope.showUntag = true;
            $scope.edgekeytoDelete = tag.edgeKey;
            $scope.tagtoUnattach = tag;
            $scope.accounttoUnattachTag = account;
        }
        $scope.tagattached = function(tag, index) {

          if (index!=undefined) {
            if ($scope.accounts[index].tags == undefined) {
                $scope.accounts[index].tags = [];
            }
            var ind = $filter('exists')(tag, $scope.accounts[index].tags);
            if (ind == -1) {
                $scope.accounts[index].tags.push(tag);
                var card_index = '#card_' + index;
                $(card_index).removeClass('over');
            } else {
                var card_index = '#card_' + index;
                $(card_index).removeClass('over');
            }
          }else{

             if ($scope.selectedCards.length >0) {
                angular.forEach($scope.selectedCards, function(selected_account){
                    var existstag=false;
                    angular.forEach(selected_account.tags, function(elementtag){
                        if (elementtag.id==tag.id) {
                           existstag=true;
                        };                       
                    }); 
                    if (!existstag) {
                       if (selected_account.tags == undefined) {
                          selected_account.tags = [];
                          }
                       selected_account.tags.push(tag);
                    };  
                 });        
             };
          };
          $scope.apply();
        };
        $scope.clearTagsModel=function(id){
            $('#'+id).select2("val", "");
        }

        // HKA 12.03.2014 Pallet color on Tags
        $scope.checkColor = function(color) {
            $scope.tag.color = color;
        }



        // Google+ Authentication
        Auth.init($scope);
        $(window).scroll(function() {
            if (!$scope.isLoading && !$scope.isFiltering && ($(window).scrollTop() > $(document).height() - $(window).height() - 100)) {
                 if ($scope.pagination.next) {
                        $scope.listMoreItems();    
                  };
                
            }
        });

    }]);
app.controller('AccountShowCtrl', ['$scope','$http', '$filter', '$route', 'Auth', 'Account', 'Contact', 'Case', 'Opportunity', 'Topic', 'Note', 'Task', 'Event', 'Permission', 'User', 'Attachement', 'Email', 'Opportunitystage', 'Casestatus', 'Map', 'InfoNode', 'Tag','Edge','Linkedin','Customfield',
    function($scope,$http,$filter, $route, Auth, Account, Contact, Case, Opportunity, Topic, Note, Task, Event, Permission, User, Attachement, Email, Opportunitystage, Casestatus, Map, InfoNode, Tag, Edge,Linkedin,Customfield) {
        $("ul.page-sidebar-menu li").removeClass("active");
        $("#id_Accounts").addClass("active");
        trackMixpanelAction('ACCOUNT_SHOW_VIEW');

        $scope.selectedTab = 2;
        $scope.isSignedIn = false;
        $scope.immediateFailed = false;
        $scope.nextPageToken = undefined;
        $scope.prevPageToken = undefined;
        $scope.isLoading = false;
        $scope.nbLoads=0;
        $scope.pagination = {};
        $scope.currentPage = 01;
        //HKA 10.12.2013 Var topic to manage Next & Prev
        $scope.topicCurrentPage = 01;
        $scope.topicpagination = {};
        $scope.topicpages = [];
        //HKA 10.12.2013 Var Contact to manage Next & Prev
        $scope.contactpagination = {};
        $scope.contactCurrentPage = 01;
        $scope.contactpages = [];
        //HKA 11.12.2013 var Opportunity to manage Next & Prev
        $scope.opppagination = {};
        $scope.oppCurrentPage = 01;
        $scope.opppages = [];
        $scope.customfields=[];
        $scope.companydetails={};
        $scope.twitterProfile={};
        //HKA 11.12.2013 var Case to manage Next & Prev
        $scope.casepagination = {};
        $scope.caseCurrentPage = 01;
        $scope.casepages = [];
        $scope.documentpagination = {};
        $scope.documentCurrentPage = 1;
        $scope.documentpages = [];
        $scope.collaborators_list=[]
        $scope.pages = [];
        $scope.accounts = [];
        $scope.account={};
        $scope.users = [];
        $scope.user = undefined;
        $scope.slected_memeber = undefined;
        $scope.email = {};
        $scope.stage_selected = {};
        $scope.status_selected = {};
        $scope.infonodes = {};
        $scope.phone = {};
        $scope.phone.type = 'work';
        $scope.casee = {};
        $scope.casee.priority = 4;
        $scope.casee.status = 'pending';
        $scope.addingTask = false;
        $scope.sharing_with = [];
        $scope.edited_email = null;
        $scope.currentParam = {};
        $scope.showPhoneForm = false;
        $scope.showEmailForm = false;
        $scope.showWebsiteForm = false;
        $scope.showSociallinkForm = false;
        $scope.showCustomFieldForm = false;
        $scope.opportunities = [];
        $scope.phones = [];
        $scope.emails = [];
        $scope.newTaskform = false;
        $scope.selected_members = [];
        $scope.selected_member = {};
        $scope.opportunities = {};
        $scope.inIsLoading=false;
        $scope.inIsSearching=false;        
        $scope.inShortProfiles=[];
        $scope.inProfile={};
        $scope.inNoResults=false;
        $scope.statuses = [
            {value: 'Home', text: 'Home'},
            {value: 'Work', text: 'Work'},
            {value: 'Mob', text: 'Mob'},
            {value: 'Other', text: 'Other'}
        ];
        $scope.showUpload = false;
        $scope.logo = {
            'logo_img_id': null,
            'logo_img_url': null
        };

        $scope.editdata = {'edit': 'test()'};
        $scope.percent = 0;
        $scope.chartOptions = {animate:{duration:0,enabled:false},size:100,barColor:'#58a618',scaleColor:false,lineWidth:7,lineCap:'circle'};
        $scope.closed_date = new Date();
        $scope.newTaskform=false;
        $scope.newEventform=false;
        $scope.newTask={};
        $scope.ioevent = {};
        $scope.showNewOpp=false;
        $scope.showNewCase=false;
        $scope.showNewContact=false;
        $scope.opportunity={access:'public',currency:'USD',duration_unit:'fixed',closed_date:new Date()};
        $scope.selectedItem={};
        $scope.relatedCase=true;
        $scope.relatedOpp=true;
        $scope.selected_tags=[];
        $scope.showPage=true;
        $scope.ownerSelected={};
        $scope.sendWithAttachments = [];
        $scope.smallModal=false;
        $scope.invites=[];
        $scope.allday=false;
        $scope.guest_modify=false;
        $scope.guest_invite=true;
        $scope.guest_list=true;
        $('#some-textarea').wysihtml5();
        $scope.relatedInfonode={};
        $scope.savedSociallink=null;
        $scope.newcontact={};
        $scope.newcontact.phones=[];
        $scope.newphone,$scope.newemail,$scope.newwebsite,$scope.website={};
        $scope.newcontact.addresses=[];
        $scope.newcontact.emails=[];
        $scope.newcontact.websites=[];
        $scope.newcontact.sociallinks=[];        
        $scope.newcontact.customfields=[];        
        $scope.newcontact.notes=[]; 
        $scope.newcontact.access='public';               
        $scope.account.access='public';
        $scope.industries=["Accounting ","Airlines/Aviation ","Alternative Dispute Resolution ","Alternative Medicine ","Animation ","Apparel &amp; Fashion ","Architecture &amp; Planning ","Arts &amp; Crafts ","Automotive ","Aviation &amp; Aerospace ","Banking ","Biotechnology ","Broadcast Media ","Building Materials ","Business Supplies &amp; Equipment ","Capital Markets ","Chemicals ","Civic &amp; Social Organization ","Civil Engineering ","Commercial Real Estate ","Computer &amp; Network Security ","Computer Games ","Computer Hardware ","Computer Networking ","Computer Software ","Construction ","Consumer Electronics ","Consumer Goods ","Consumer Services ","Cosmetics ","Dairy ","Defense &amp; Space ","Design ","Education Management ","E-learning ","Electrical &amp; Electronic Manufacturing ","Entertainment ","Environmental Services ","Events Services ","Executive Office ","Facilities Services ","Farming ","Financial Services ","Fine Art ","Fishery ","Food &amp; Beverages ","Food Production ","Fundraising ","Furniture ","Gambling &amp; Casinos ","Glass, Ceramics &amp; Concrete ","Government Administration ","Government Relations ","Graphic Design ","Health, Wellness &amp; Fitness ","Higher Education ","Hospital &amp; Health Care ","Hospitality ","Human Resources ","Import &amp; Export ","Individual &amp; Family Services ","Industrial Automation ","Information Services ","Information Technology &amp; Services ","Insurance ","International Affairs ","International Trade &amp; Development ","Internet ","Investment Banking/Venture ","Investment Management ","Judiciary ","Law Enforcement ","Law Practice ","Legal Services ","Legislative Office ","Leisure &amp; Travel ","Libraries ","Logistics &amp; Supply Chain ","Luxury Goods &amp; Jewelry ","Machinery ","Management Consulting ","Maritime ","Marketing &amp; Advertising ","Market Research ","Mechanical or Industrial Engineering ","Media Production ","Medical Device ","Medical Practice ","Mental Health Care ","Military ","Mining &amp; Metals ","Motion Pictures &amp; Film ","Museums &amp; Institutions ","Music ","Nanotechnology ","Newspapers ","Nonprofit Organization Management ","Oil &amp; Energy ","Online Publishing ","Outsourcing/Offshoring ","Package/Freight Delivery ","Packaging &amp; Containers ","Paper &amp; Forest Products ","Performing Arts ","Pharmaceuticals ","Philanthropy ","Photography ","Plastics ","Political Organization ","Primary/Secondary ","Printing ","Professional Training ","Program Development ","Public Policy ","Public Relations ","Public Safety ","Publishing ","Railroad Manufacture ","Ranching ","Real Estate ","Recreational Facilities &amp; Services ","Religious Institutions ","Renewables &amp; Environment ","Research ","Restaurants ","Retail ","Security &amp; Investigations ","Semiconductors ","Shipbuilding ","Sporting Goods ","Sports ","Staffing &amp; Recruiting ","Supermarkets ","Telecommunications ","Textiles ","Think Tanks ","Tobacco ","Translation &amp; Localization ","Transportation/Trucking/Railroad ","Utilities ","Venture Capital ","Veterinary ","Warehousing ","Wholesale ","Wine &amp; Spirits ","Wireless ","Writing &amp; Editing"];
        $scope.selectedOpps=[];
        $scope.selectedDocs=[];
        $scope.opportunity.timeline=[];
        $scope.competitors=[];
        $scope.opportunity.notes=[];
        $scope.allOppsSelected=false;
        $scope.allCasesSelected=false;
        $scope.selectedCases=[];
        $scope.newDoc=true;
        $scope.docInRelatedObject=true;
        $scope.relatedOpp=true;
        $scope.opportunity.competitors=[];
        $scope.opportunities=[];
        $scope.caseCustomfields=[];
        $scope.lunchMaps=lunchMaps;
        $scope.lunchMapsLinkedin=lunchMapsLinkedin;

   $scope.timezone=document.getElementById('timezone').value;


       if ($scope.timezone==""){
        $scope.timezone=moment().format("Z");
     }



        $scope.inProcess=function(varBool,message){
          if (varBool) {  
            $scope.nbLoads += 1;
             var d = new Date();
            if ($scope.nbLoads==1) {
              $scope.isLoading=true;
            };
          }else{
            var d = new Date();
            $scope.nbLoads -= 1;
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
        $scope.contact_img={};
        $scope.imageSrcContact= '/static/src/img/avatar_contact.jpg';
        $scope.imageSrcnewContact= '/static/src/img/avatar_contact.jpg';
        // What to do after authentication
        $scope.endError = function() {
        }
              $scope.isEmpty=function(obj){
        return jQuery.isEmptyObject(obj);
      }
      $scope.isEmptyArray=function(Array){
                return !(Array != undefined && Array.length > 0);;
            
        }
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
        $scope.existsInfonode=function(elem,property,kind){
            var exists=false;
            angular.forEach($scope.infonodes[kind], function (infonode) {
                if (infonode[property]==elem[property]) {
                    exists= true;
                };
            });
            return exists;

        }
         $scope.messageFromSocialLinkCallback = function(event){
                  if (event.origin!=='https://accounts.google.com'&&event.origin!=='https://gcdc2013-iogrow.appspot.com'&&event.origin!=='http://localhost:8090'){
                      $scope.saveLinkedinData(event.data);
                      window.removeEventListener("message", $scope.messageFromSocialLinkCallback, false);
                  }
        };
        $scope.saveLinkedinData=function(data){
                    //company Data
                    if (data.firstname||data.lastname) {
                        $scope.clearContact();
                        var params={
                          'firstname':data.firstname,
                          'lastname':data.lastname,
                          'title':data.title,
                          'phone':data.phone,
                          'email':data.email,
                          'address':data.locality,
                          'profile_img_url':data.profile_img_url,
                          'sociallink':data.linkedin_url
                        };
                        $scope.imageSrcnewContact=data.profile_img_url;
                        $scope.newcontact=$.extend(true, $scope.newcontact, params);
                        var phone={
                            'number':data.phone
                          };
                          $scope.pushElement(phone,$scope.newcontact.phones,'phones');
                          var email={
                            'email':data.email
                          };
                          var address={'formatted':data.locality};
                          $scope.pushElement(address,$scope.newcontact.addresses,'addresses');
                          
                          $scope.pushElement(email,$scope.newcontact.emails,'emails');
                          var sociallink={
                            url:data.linkedInUrl
                          };
                          $scope.pushElement(sociallink,$scope.newcontact.sociallinks,'sociallinks');
                        $scope.apply();
                    }else{
                      if (data.name) {
                          var params={
                              'id':$scope.account.id,
                              'name':data.name,
                              'industry':data.industry,
                              'logo_img_url':data.logo_img_url,
                              'introduction':data.introduction,
                              'linkedin_profile':{
                                    'company_size':data.companySize,
                                    'followers':data.followers,
                                    'founded':data.foundedAt,
                                    'headquarters':data.locality,
                                    'industry':data.industry,
                                    'logo':data.logo_img_url,
                                    'name':data.name,
                                    'summary':data.summary,
                                    'top_image':data.imgCoverUrl,
                                    'type':data.publicOrPrivate,
                                    'url':data.linkedin_url,
                                    'website':data.website
                              }
                            }
                            Account.patch($scope,params);
                            $scope.imageSrc=data.logo_img_url;
                            if (data.phone) $scope.addPhone({'number':data.phone,'type':'work'});
                            if (data.website) $scope.addWebsite({'url':data.website});
                            if (data.linkedin_url) $scope.addSocial({'url':data.linkedin_url});
                            if (data.locality) $scope.addGeo({'formatted':data.locality,'country':' '});
                        $scope.apply();
                      };
                    };
                     
                  }

        $scope.socialLinkOpener = function(socialLinkUrl){
            $scope.showLinkedinWindown=$scope.prepareUrl(socialLinkUrl);
            if (navigator.isChrome(navigator.sayswho)) {
                if (typeof (sessionStorage.isChromeExtensionInstalled) === 'undefined'){
                    $scope.browser='chrome';
                    $('#extensionNotInstalled').modal({backdrop: 'static', keyboard: false});
                }else{
                    var p=$("#newAccMain");
                    var offsets = document.getElementById('newAccMain').getBoundingClientRect();
                    var top = offsets.top + 120;
                    var left = offsets.left;
                    var width = document.getElementById('newAccMain').offsetWidth;
                    var height = document.getElementById('newAccMain').offsetHeight;
                    window.open($scope.showLinkedinWindown+'#iogrow','winname','width='+width+',height=500, left='+left+',top='+top);
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
        $scope.showSelectButton=function(index){
     
          $("#select_"+index).removeClass('selectLinkedinButton');
        }
        $scope.hideSelectButton=function(index){
       
          if (!$("#select_"+index).hasClass('alltimeShowSelect')) {
            $("#select_"+index).addClass('selectLinkedinButton');
          };
          
        }
        $scope.addRelatedNote= function(note) {
            $scope.newcontact.push
            Note.insert($scope, params);
            $scope.note.title = '';
            $scope.note.content = '';
        };
         $scope.linkedinUrl=function(url){
                         var match="";
                         var matcher = new RegExp("linkedin");
                         var test = matcher.test(url);                        
                         return test;
        }
        $scope.saveLinkedinUrl=function(shortProfile){
             $scope.inProfile=shortProfile;
            var link={'url':$scope.inProfile.url}
            $scope.addSocial(link);
            var params ={'id':$scope.account.id};
             params['logo_img_url'] = $scope.inProfile.logo;
             params.industry=$scope.inProfile.industry;
             params.name=$scope.inProfile.name;
             Account.patch($scope,params);
            $scope.imageSrc=$scope.inProfile.logo;
            if ($scope.infonodes.addresses==undefined||$scope.infonodes.addresses==[]) {
              $scope.addGeo({'formatted':$scope.inProfile.headquarters});
            };
             if ($scope.inProfile.website!=""&&$scope.inProfile.website!=undefined) {
                params = {'parent': $scope.account.entityKey,
                'kind': 'websites',
                'fields': [
                    {
                        "field": "url",
                        "value": $scope.inProfile.website
                    }
                ]}
            };
            InfoNode.insert($scope, params);
            $scope.apply(); 
          }
 $scope.getLinkedinByUrl=function(url){
               $scope.inIsLoading=true;
               var par={'url' : url};
               Linkedin.getCompany(par,function(resp){
                      if(!resp.code){
                       var prof={};
                       prof.company_size=resp.company_size;
                       prof.headquarters=resp.headquarters;
                       prof.followers=resp.followers;
                       prof.founded=resp.founded;
                       prof.industry=resp.industry;
                       prof.logo=resp.logo;
                       prof.name=resp.name;
                       prof.summary=resp.summary;
                       prof.top_image=resp.top_image;
                       prof.type=resp.type;
                       prof.url=resp.url;
                       prof.website=resp.website;
                       prof.workers=JSON.parse(resp.workers);
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



            $scope.getLinkedinProfile=function(){
                  var params={
                   "company":$scope.account.name
                  }                
                  if ($scope.infonodes.sociallinks==undefined) {
                    $scope.infonodes.sociallinks=[];
                  };
                  var savedEntityKey=null;
                  var linkedurl=null;
                  if ($scope.infonodes.sociallinks.length > 0) {
                     angular.forEach($scope.infonodes.sociallinks, function(link){

                                      if ($scope.linkedinUrl(link.url)) {
                                        linkedurl=link.url;
                                        savedEntityKey=link.entityKey;
                                      };
                                  });
                  };
                 if (!linkedurl) {
                   Linkedin.listCompanies(params,function(resp){
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
                         $scope.isLoading = false;
                         $scope.apply();
                        }else {
                          console.log("no 401");
                           if(resp.code==401){
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
            }


      $scope.deleteSocialLink = function(link,kind){
        if (link.entityKey) {
          var pars = {'entityKey':link.entityKey,'kind':kind};
        InfoNode.delete($scope,pars);
        if ($scope.linkedinUrl(link.url)) {
          $scope.inProfile={};
          $scope.inShortProfiles={};
          var params={
              "company":$scope.account.name
              }
          Linkedin.listCompanies(params,function(resp){
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
                          angular.forEach(resp.items, function(item){
                              $scope.getLinkedinByUrl(item.url);
                        });
                      }
                    };
                       $scope.isLoading = false;
                       $scope.$apply();
                      }else {
                         if(resp.code==401){
                          $scope.isLoading = false;
                          $scope.$apply();
                         };
                        if (resp.code >= 503) {
                                $scope.inNoResults = true;
                                $scope.inIsSearching = false;
                                $scope.apply();
                            }
                      }
                });
        };
            if ($scope.twitterUrl(link.url)) {
      $scope.twProfile={};
      $scope.twShortProfiles=[];
      var params={
          "company":$scope.account.name
          }
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
                        $scope.twList=resp.items;
                        if (resp.items.length < 4) {
                          console.log("in check of 3");
                          angular.forEach(resp.items, function(item){
                              $scope.getTwitterByUrl(item.url);
                        });
                        }
                      };
                         $scope.isLoading = false;
                         $scope.$apply();
                        }else {
                           if(resp.code==401){
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

        $scope.gotosendMail = function(email){
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
        $scope.showAssigneeTagsToAccount=function(){
            $('#assigneeTagsToAccount').modal('show');
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
        
        $scope.smallSendMail=function(){
          $(".modal-backdrop").remove();
          $('#testnonefade').addClass("emailModalOnBottom");
        }
        $scope.bigSendMail=function(){
          $('#testnonefade').removeClass("emailModalOnBottom");
          $( "body" ).append( '<div class="modal-backdrop fade in"></div>' );

        }
        $scope.savecontact = function(contact) {
               $scope.contact_err={};
              $scope.contact_err.firstname = !contact.firstname;
              $scope.contact_err.lastname = !contact.lastname;
              if (!$scope.contact_err.firstname&&!$scope.contact_err.lastname) {
                var params ={
                            'firstname':contact.firstname,
                            'lastname':contact.lastname,
                            'title':contact.title,
                            'tagline':contact.tagline,
                            'introduction':contact.introduction,
                            'phones':contact.phones,
                            'emails':contact.emails,
                            'addresses':$scope.addresses,
                            'infonodes':$scope.prepareRelated(),
                            'access': contact.access||'public',
                            'account': $scope.account.entityKey
                         };
                         if ($scope.contact_img.id){

                                params['profile_img_id'] = $scope.contact_img.id;
                                params['profile_img_url'] = 'https://docs.google.com/uc?id='+$scope.contact_img.id;
                        }else{
                          if ($scope.imageSrcnewContact) {
                              params['profile_img_url'] = $scope.imageSrcnewContact;
                          };
                        }
                        Contact.insert($scope,params);
                        $scope.contact={};
                        $scope.newcontact={};
                        $scope.newcontact.phones=[];
                        $scope.newcontact.emails=[];
                        $scope.newcontact.websites=[];
                        $scope.relatedtwList=[];
                        $scope.relatedinList=[];
                        $scope.twRelatedShortProfiles=[];
                        $scope.imageSrcnewContact= '/static/src/img/avatar_contact.jpg';
                        $scope.imageSrc = '/static/src/img/default_company.png';
                        $scope.apply();
              }
            
        };
        $scope.savecontactFromLinkedin = function(contact) {
            var params ={
                        'firstname':contact.firstname,
                        'lastname':contact.lastname,
                        'title':contact.function,
                        'infonodes': [{'kind': 'sociallinks','fields': [{'field': "url",'value': contact.url}]}],
                        'access': $scope.account.access||'public',
                        'account': $scope.account.entityKey
                         };
                         params['profile_img_url'] = contact.img;
                         Contact.insert($scope,params);
                         $scope.savedSociallink=contact.url;
                         $scope.inProfile.workers.splice($scope.inProfile.workers.indexOf(contact),1);
        };
        $scope.contactInserted=function(resp){
            if ($scope.savedSociallink!=null) {
              $scope.contacts[0].sociallinks=[];
              $scope.contacts[0].sociallinks.push({url:$scope.savedSociallink});
              $scope.savedSociallink=null;
            };    
            $scope.contacts[0].emails=[];
            $scope.contacts[0].emails.items=[];
            $scope.contacts[0].phones=[];
            $scope.contacts[0].phones.items=[];
            if (resp.emails[0]!=undefined) {
              $scope.contacts[0].emails.items.push(resp.emails[0]);
            };
            if (resp.phones[0]!=undefined) {
              $scope.contacts[0].phones.items.push(resp.phones[0]);
            };
            
            
            $scope.apply();
            $scope.selectedTab=2;      
        };
        $scope.addPhoneToContact=function(phone,contact){           
            if (phone.number) {
                params = {'parent': contact.entityKey,
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
                $scope.relatedInfonode={
                  contact:contact,
                  infonode:{
                    'kind':'phones',
                    'item':{
                       "type": phone.type,
                       "number": phone.number
                    }
                  }
                };
                InfoNode.insert($scope, params);
            }
        }
   $scope.addEmailToContact=function(email,contact){  
                if (email.email) {
                    params = {'parent': contact.entityKey,
                        'kind': 'emails',
                        'fields': [
                            {
                                "field": "email",
                                "value": email.email
                            }
                        ]
                    };
                }        
                $scope.relatedInfonode={
                  contact:contact,
                  infonode:{
                    'kind':'emails',
                    'item':{
                       "email": email.email
                    }
                  }
                };
                InfoNode.insert($scope, params);
            }
  $scope.saveOpp = function(opportunity){
             $scope.oppo_err={};
           $scope.oppo_err.name = !opportunity.name;
          $scope.oppo_err.amount_per_unit = !opportunity.amount_per_unit;

          if (!$scope.oppo_err.amount_per_unit&&!$scope.oppo_err.name) {
               opportunity.closed_date = $filter('date')(opportunity.closed_date,['yyyy-MM-dd']);
            opportunity.stage = $scope.initialStage.entityKey;
            opportunity.infonodes = $scope.prepareInfonodes();
            if (opportunity.duration_unit=='fixed'){

              opportunity.amount_total = opportunity.amount_per_unit;
              opportunity.opportunity_type = 'fixed_bid';

            }else{

              opportunity.opportunity_type = 'per_' + opportunity.duration;

            }
            opportunity.account=$scope.account.entityKey;
            Opportunity.insert($scope,opportunity);
            $scope.showNewOpp=false;
            $scope.opportunity={access:'public',currency:'USD',duration_unit:'fixed',closed_date:new Date()};
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
          
          $scope.hideNewContactForm=function(){
            $scope.contact={};
            $scope.showNewContact=false;
            $( window ).trigger( 'resize' ); 
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
        $scope.saveCase = function(casee) {
          $scope.case_err={};
          $scope.case_err.name = !casee.name;
          if (!$scope.case_err.name) { 
            casee.account=$scope.account.entityKey;
            casee.access=$scope.account.access;
            casee.infonodes = $scope.prepareInfonodesCase();
            casee.status = $scope.status_selected.entityKey;           
            Case.insert($scope,casee);      
            $scope.showNewCase=false;
            $scope.casee={};
            $scope.apply()
          }
        };
        $scope.addTagsTothis=function(){
              var tags=[];
              var items = [];
              tags=$('#select2_sample2').select2("val");
              $('#assigneeTagsToAccount').modal('hide');
                  angular.forEach(tags, function(tag){
                    var params = {
                          'parent': $scope.account.entityKey,
                          'tag_key': tag
                    };
                    Tag.attach($scope,params);
                  });
          };
         $scope.edgeInserted = function() {
          };
         $scope.removeTag = function(tag,$index) {
            var params = {'tag': tag,'index':$index}
            Edge.delete($scope, params);
        }
        $scope.edgeDeleted=function(index){
         $scope.account.tags.splice(index, 1);
         $scope.apply();
        }
        $scope.editbeforedelete = function (item, typee, index) {
            $scope.selectedItem={'item':item,'typee':typee,'index':index};
            $('#BeforedeleteAccount').modal('show');
         };
         $scope.editbeforedisassociate = function(item,typee,index){
            $scope.selectedItem={'item':item,'typee':typee,'index':index};
            $('#beforedelinkContact').modal('show');
         };
         $scope.deleteItem=function(){

            var params = {'entityKey':$scope.selectedItem.item.entityKey};
            if ($scope.selectedItem.typee=='account') {
                Account.delete($scope, params);
            }else{
                if ($scope.selectedItem.typee=='contact') {
                 Contact.delete($scope, params);                 
                }else{
                    if ($scope.selectedItem.typee=='opportunity') {
                         Opportunity.delete($scope, params);
                    }else{
                        if ($scope.selectedItem.typee=='case') {
                             Case.delete($scope, params);
                        };
                    }
                }    
            }
            
             $('#BeforedeleteAccount').modal('hide');
         }
         $scope.disassociateItem=function(){
            var params ={'start_node':$scope.account.entityKey,'end_node':$scope.selectedItem.item.entityKey,'kind':'contacts'};
            
            Edge.delete($scope,params);            
            $('#beforedelinkContact').modal('hide');
         }
         $scope.itemDisassociated=function(){
            if ($scope.selectedItem.typee=="contact") {
              $scope.contacts.splice($scope.selectedItem.index, 1);
            };
            $scope.selectedItem={};
         }
         $scope.contactDeleted = function(resp){
               $scope.contacts.splice($scope.selectedItem.index, 1);
               $scope.apply();
               $scope.waterfallTrigger();
         };
         $scope.caseDeleted = function(resp){
               $scope.cases.splice($scope.selectedItem.index, 1);
               $scope.apply();
               $scope.waterfallTrigger();
         };
        $scope.oppDeleted = function(resp){
               $scope.opportunities.splice($scope.selectedItem.index, 1);
               $scope.apply();
               $scope.waterfallTrigger();
         };


        $scope.fromNow = function(fromDate){
            return moment(fromDate,"YYYY-MM-DD HH:mm Z").fromNow();
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
        //$tocopy
        $scope.runTheProcess = function() {

            var params = {
                'id': $route.current.params.accountId,
                'topics': {
                    'limit': '7'
                },
                'contacts': {
                    'limit': '15'
                },
                'opportunities': {
                    'limit': '15'
                },
                'cases': {
                    'limit': '15'
                },
                'documents': {
                    'limit': '15'
                },
                'tasks': {
                },
                'events': {
                }


            };
            $scope.getCustomFields("opportunities");
            $scope.getCustomFields("cases");
            Account.get($scope, params);
            User.list($scope, {});
            Opportunitystage.list($scope, {'order':'probability'});
            Casestatus.list($scope, {});
            var paramsTag = {'about_kind': 'Account'};
            Tag.list($scope, paramsTag);
            ga('send', 'pageview', '/accounts/show');
            $scope.mapAutocompleteCalendar();
            $scope.mapAutocomplete();
            Map.autocomplete ($scope,"relatedaddressInput");
        };
      $scope.isEmpty=function(obj){
        return jQuery.isEmptyObject(obj);
      }
  $scope.oppAction=function(){
        if ($scope.showNewOpp) {
            $scope.saveOpp($scope.opportunity);
        }else{
             $scope.showNewOpp=true;
        };
      }
   $scope.caseAction=function(){ 
        if ($scope.showNewCase) {
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
            angular.forEach($scope.selectedCases, function (casee) {
                    if (casee.entityKey==entityKey) {
                        caseTodelete=casee;
                    };
                });
            var indexInCases=$scope.cases.indexOf(caseTodelete);
            var indexInSelection=$scope.selectedCases.indexOf(caseTodelete);
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
  $scope.editbeforedeleteopp = function(opportunity){
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
         $scope.saveOpp = function(opportunity){
          $scope.oppo_err={};
           $scope.oppo_err.name = !opportunity.name;
          $scope.oppo_err.amount_per_unit = !opportunity.amount_per_unit;

          if (!$scope.oppo_err.amount_per_unit&&!$scope.oppo_err.name) {
          opportunity.account=$scope.account.entityKey;
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
          }
     $scope.showAddTimeScale = function () {
            $('#newTimeModalForm2').modal('show');
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
                    'access': $scope.opportunity.access||'public',
                    'parent': $scope.opportunity.entityKey,
                    'reminder': $scope.reminder,
                    'timezone': $scope.timezoneChosen
                }
                $scope.opportunity.timeline.push(params);
                $('#newTimeModalForm2').modal('hide');

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
        $scope.deleteEventTime =function(eventt){
          var ind=$scope.opportunity.timeline.indexOf(eventt)
          $scope.opportunity.timeline.splice(ind,1);
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
           $scope.selectCompetitor = function(){
        if (typeof($scope.searchCompetitorQuery)=='object') {
           $scope.competitors.push($scope.searchCompetitorQuery);
            if ($scope.opportunity.competitors==undefined) {
                $scope.opportunity.competitors=[];
            };
           $scope.opportunity.competitors.push($scope.searchCompetitorQuery.entityKey);
        }else{
           if ($scope.searchCompetitorQuery!="") {
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
                  }
               }else{       

                    $scope.selectedOpps.splice($scope.selectedOpps.indexOf(opportunity) , 1);
               }

        }
  $scope.getCustomFields=function(related_object){
            Customfield.list($scope,{related_object:related_object});
        }
        $scope.listResponse=function(items,related_object){
            //infonodes.customfields
            if (related_object=="accounts") {
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
         
            $scope.addresses = {};
            Map.autocompleteCalendar($scope,"pac-input2");
        }


      $scope.addGeoCalendar = function(address){
     
         $scope.ioevent.where=address.formatted
           $scope.locationShosen=true;
         $scope.apply();
      };

$scope.lunchMapsCalendar=function(){
   
         window.open('http://www.google.com/maps/search/'+$scope.ioevent.where,'winname',"width=700,height=550");
    
     }



        $scope.mapAutocomplete=function(){
            $scope.addresses = $scope.account.addresses;
            Map.autocomplete ($scope,"pac-input");
        }
        $scope.getColaborators=function(){
          Permission.getColaborators($scope,{"entityKey":$scope.account.entityKey});
        } 
        $scope.noCompanyDetails=function(){
            return !!(jQuery.isEmptyObject($scope.companydetails) && jQuery.isEmptyObject($scope.twitterProfile));;
        }
        $scope.isEmptyArray=function(Array){
                return !(Array != undefined && Array.length > 0);;
            
        }
        $scope.companydetailsEmpty=function(){
            return !!jQuery.isEmptyObject($scope.companydetails);;
        }
        $scope.twitterProfileEmpty=function(){
            return !!jQuery.isEmptyObject($scope.companydetails);;
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
        $scope.preparePercent = function(percent) {

            return parseInt(percent);
        };
        $scope.getPosition = function(index) {
            if (index < 4) {

                return index + 1;
            } else {
                return (index % 4) + 1;
            }
        };
        $scope.waterfallTrigger = function() {


            $(window).trigger("resize");
        };

        // We need to call this to refresh token when user credentials are invalid
        $scope.refreshToken = function() {
            Auth.refreshToken();
        };
        //HKA 06.12.2013  Manage Next & Prev Page of Topics
        $scope.TopiclistNextPageItems = function() {


            var nextPage = $scope.topicCurrentPage + 1;
            var params = {};
            if ($scope.topicpages[nextPage]) {
                params = {
                    'id': $scope.account.id,
                    'topics': {
                        'limit': '7',
                        'pageToken': $scope.topicpages[nextPage]
                    }
                }
                $scope.topicCurrentPage += 1;
                Account.get($scope, params);
            }


        }
        $scope.editTrigger = function(name) {
            name.$show();
        }
        // HKA 08.05.2014 Delete infonode

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
        $scope.TopiclistPrevPageItems = function() {

            var prevPage = $scope.topicCurrentPage - 1;
            var params = {};

            if ($scope.topicpages[prevPage]) {
                params = {
                    'id': $scope.account.id,
                    'topics': {
                        'limit': '7',
                        'pageToken': $scope.topicpages[prevPage]
                    }
                }
            } else {
                params = {
                    'id': $scope.account.id,
                    'topics': {
                        'limit': '7'
                    }
                }
            }
            $scope.topicCurrentPage -= 1;
            Account.get($scope, params);

        }
        $scope.listTags=function(){
              var paramsTag = {'about_kind':'Account'}
              Tag.list($scope,paramsTag);
             };
        $scope.tagattached = function(tag, index) {
            if ($scope.account.tags == undefined) {
                $scope.account.tags = [];
            }
            var ind = $filter('exists')(tag, $scope.account.tags);
            if (ind == -1) {
                $scope.account.tags.push(tag);
                
            } else {
            }
            $('#select2_sample2').select2("val", "");
            $scope.apply();
        };
//HKA 06.12.2013 Manage Prev & Next Page on Related List Contact
        $scope.ContactlistNextPageItems = function() {


            var nextPage = $scope.contactCurrentPage + 1;
            var params = {};
            if ($scope.contactpages[nextPage]) {
                params = {
                    'id': $scope.account.id,
                    'contacts': {
                        'limit': '15',
                        'pageToken': $scope.contactpages[nextPage]
                    }
                }
                $scope.contactCurrentPage += 1;
                Account.get($scope, params);
            }
        }
        $scope.ContactlistPrevPageItems = function() {

            var prevPage = $scope.contactCurrentPage - 1;
            var params = {};
            if ($scope.contactpages[prevPage]) {
                params = {
                    'id': $scope.account.id,
                    'contacts': {
                        'limit': '6',
                        'pageToken': $scope.contactpages[prevPage]
                    }
                }
            } else {
                params = {
                    'id': $scope.account.id,
                    'contacts': {
                        'limit': '6'
                    }
                }
            }
            $scope.contactCurrentPage -= 1;
            Account.get($scope, params);
        }
/// update account with inlineEdit
        $scope.inlinePatch = function(kind, edge, name, entityKey, value) {
            if (kind == 'Account') {
              var params={};
                switch(name){
                  case "name": 
                  params.name=value;  
                  break;
                  case "owner":
                  params.owner=value; 
                  break;
                  case "type":
                  params.account_type=value; 
                  break;
                  case "industry":
                  params.industry=value; 
                  break;
                }
                if (!$scope.isEmpty(params)) {
                  params.id=entityKey;
                  Account.patch($scope, params);  
                }                
            } else {
                params = {
                    'entityKey': entityKey,
                    'parent': $scope.account.entityKey,
                    'kind': edge,
                    'fields': [
                        {
                            "field": name,
                            "value": value
                        }
                    ]
                };
                InfoNode.patch($scope, params);
            }


        };


//HKA 07.12.2013 Manage Prev & Next Page on Related List Opportunities
        $scope.OpplistNextPageItems = function() {


            var nextPage = $scope.oppCurrentPage + 1;
            var params = {};
            if ($scope.opppages[nextPage]) {
                params = {
                    'id': $scope.account.id,
                    'opportunities': {
                        'limit': '15',
                        'pageToken': $scope.opppages[nextPage]
                    }
                }
                $scope.oppCurrentPage += 1;
                Account.get($scope, params);
            }

        }

        //HKA 07.12.2013 Manage Prev & Next Page on Related List Cases
        $scope.CaselistNextPageItems = function() {


            var nextPage = $scope.caseCurrentPage + 1;
            var params = {};
            if ($scope.casepages[nextPage]) {
                params = {
                    'id': $scope.account.id,
                    'cases': {
                        'limit': '15',
                        'pageToken': $scope.casepages[nextPage]
                    }
                }
                $scope.caseCurrentPage += 1;
                Account.get($scope, params);
            }

        }
        $scope.CasePrevPageItems = function() {

            var prevPage = $scope.caseCurrentPage - 1;
            var params = {};
            if ($scope.casepages[prevPage]) {
                params = {
                    'id': $scope.account.id,
                    'cases': {
                        'limit': '6',
                        'pageToken': $scope.casepages[prevPage]
                    }
                }
            } else {
                params = {
                    'id': $scope.account.id,
                    'cases': {
                        'limit': '6'
                    }
                }
            }
            $scope.caseCurrentPage -= 1;
            Account.get($scope, params);
        };

        // HKA 09.02.2014 Manage Next Prev page on ducument list
        $scope.DocumentlistNextPageItems = function() {


            var nextPage = $scope.documentCurrentPage + 1;
            var params = {};
            if ($scope.documentpages[nextPage]) {
                params = {
                    'id': $scope.account.id,
                    'documents': {
                        'limit': '15',
                        'pageToken': $scope.documentpages[nextPage]
                    }
                }
                $scope.documentCurrentPage += 1;

                Account.get($scope, params);
            }


        }
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
      $scope.selectContact = function(){

        if (typeof($scope.searchRelatedContactQuery)=='object'){
            var params={
              'id':$scope.account.id,
              'new_contact_key':$scope.searchRelatedContactQuery.entityKey
            };  
            Account.patch($scope,params);
        }
        $scope.searchRelatedContactQuery="";
      };

        $scope.listTopics = function(account) {
            var params = {
                'id': $scope.account.id,
                'topics': {
                    'limit': '7'
                }
            };
            Account.get($scope, params);

        }
        $scope.listDocuments = function() {
            var params = {
                'id': $scope.account.id,
                'documents': {
                    'limit': '15'
                }
            }
            Account.get($scope, params);

        }

        $scope.hilightTopic = function() {

            $('#topic_0').effect("bounce", "slow");
            $('#topic_0 .message').effect("highlight", "slow");
        }


        $scope.selectMember = function() {
            $scope.slected_memeber = $scope.user;
            $scope.user = '';
            $scope.sharing_with.push($scope.slected_memeber);

        };
        $scope.showCreateDocument = function(type) {

            $scope.mimeType = type;
            $('#newDocument').modal('show');
        };
        $scope.createDocument = function(newdocument) {
            var mimeType = 'application/vnd.google-apps.' + $scope.mimeType;
            var params = {
                'parent': $scope.account.entityKey,
                'title': newdocument.title,
                'mimeType': mimeType
            };
            Attachement.insert($scope, params);

        };
        $scope.createPickerUploader = function() {
            var projectfolder = $scope.account.folder;
            var developerKey = 'AIzaSyDHuaxvm9WSs0nu-FrZhZcmaKzhvLiSczY';
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
                    'access': $scope.account.access||'public',
                    'parent': $scope.account.entityKey
                };
                params.items = new Array();
                $.each(data.docs, function(index) {
                    var item = {'id': data.docs[index].id,
                        'title': data.docs[index].name,
                        'mimeType': data.docs[index].mimeType,
                        'embedLink': data.docs[index].url

                    };
                    params.items.push(item);
                });
               Attachement.attachfiles($scope, params);}
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
                if (data.docs) {
                    $scope.logo.logo_img_id = data.docs[0].id;
                    $scope.logo.logo_img_url = data.docs[0].url;
                    $scope.imageSrc = 'https://docs.google.com/uc?id=' + data.docs[0].id;
                    $scope.apply();
                    var params = {'id': $scope.account.id};
                    params['logo_img_id'] = $scope.logo.logo_img_id;
                    params['logo_img_url'] = $scope.logo.logo_img_url;
                    Account.patch($scope, params);
                }
            }
        }
      $scope.createPickerUploaderContact= function() {
            var projectfolder = $scope.account.folder;
            var developerKey = 'AIzaSyDHuaxvm9WSs0nu-FrZhZcmaKzhvLiSczY';
            var docsView = new google.picker.DocsView()
                    .setIncludeFolders(true)
                    .setSelectFolderEnabled(true);
            var picker = new google.picker.PickerBuilder().
                    addView(new google.picker.DocsUploadView().setParent(projectfolder)).
                    addView(docsView).
                    setCallback(function(data){
                      if (data.action == google.picker.Action.PICKED) {
                          if (data.docs) {
                              $scope.contact_img.id = data.docs[0].id;
                              $scope.contact_img.url = data.docs[0].url;
                              $scope.imageSrcContact='https://docs.google.com/uc?id=' + data.docs[0].id;
                              $scope.$apply();
                          }
                      }
                    }).
                    setOAuthToken(window.authResult.access_token).
                    setDeveloperKey(developerKey).
                    setAppId('935370948155-qm0tjs62kagtik11jt10n9j7vbguok9d').
                    enableFeature(google.picker.Feature.MULTISELECT_ENABLED).
                    build();
            picker.setVisible(true);
        };
        $scope.share = function(slected_memeber) {

        
                var body = {'access': $scope.account.access||'public'};
                var id = $scope.account.id;
                var params = {'id': id,
                    'access': $scope.account.access||'public'}
                Account.patch($scope, params);
                  // who is the parent of this event .hadji hicham 21-07-2014.

                params["parent"]="account";
                Event.permission($scope,params);
                Task.permission($scope,params);
        

            if ($scope.sharing_with.length > 0) {

                var items = [];

                angular.forEach($scope.sharing_with, function(user) {
                    var item = {
                        'type': "user",
                        'value': user.entityKey
                    };
                    items.push(item);
                });

                if (items.length > 0) {
                    var params = {
                        'about': $scope.account.entityKey,
                        'items': items
                    }
                    Permission.insert($scope, params);
                }


                $scope.sharing_with = [];


            }

        };
        $scope.showModal = function() {
            $('#addAccountModal').modal('show');
        };
        $scope.addNote = function(note) {
            var params = {
                'about': $scope.account.entityKey,
                'title': note.title,
                'content': note.content
            };
            Note.insert($scope, params);
            $scope.note.title = '';
            $scope.note.content = '';
        };
        $scope.editaccount = function() {
            $('#EditAccountModal').modal('show');
        };
        //HKA 22.11.2013 Edit tagline of Account
        $scope.edittagline = function() {
            $('#EditTagModal').modal('show');
        };
        //HKA Edit Introduction on Account
        $scope.editintro = function() {
            $('#EditIntroModal').modal('show');
        };
        //HKA 09.11.2013 Add a new Tasks
        $scope.addTask = function(task) {
                if ($scope.newTaskform==false) {
                      $scope.newTaskform=true;
               }else{
                if (task.title!=null) {
                if (task.due){
                    var dueDate= $filter('date')(task.due,['yyyy-MM-ddT00:00:00.000000']);
                    params ={'title': task.title,
                              'due': dueDate,
                              'parent': $scope.account.entityKey,
                              'access':$scope.account.access||'public'
                    }

                }else{
                    params ={'title': task.title,
                             'parent': $scope.account.entityKey,
                             'access':$scope.account.access
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

        $scope.hilightTask = function() {

            $('#task_0').effect("highlight", "slow");
            $('#task_0').effect("bounce", "slow");

        };
      $scope.lunchNew=function(){
            $('#testnonefade').modal("show");
            $(".modal-backdrop").remove();
        }
        $scope.listTasks = function() {
            var params = {
                'id': $scope.account.id,
                'events': {},
                'tasks': {}
            };
            Account.get($scope, params);
        };




// HADJI HICHAM 31/05/2015

$scope.showAddEventPopup=function(){  
          $scope.locationShosen=false;
         $('#newEventModalForm').modal('show');
       }

// HADJI HICHAM 31/05/2015

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
$scope.timezoneChosen=$scope.timezone;
$('#timeZone').on('change', function() {
     $scope.timezoneChosen=this.value;
});

    
 //HKA 10.11.2013 Add event
 $scope.addEvent = function(ioevent){
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
                      'access':$scope.account.access||'public',
                      'description':$scope.ioevent.note,
                      'invites':$scope.invites,
                      'parent':  $scope.account.entityKey,
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
                    params ={'title': ioevent.title,
                      'starts_at':$filter('date')(ioevent.starts_at,['yyyy-MM-ddTHH:mm:00.000000']),
                      'ends_at': $filter('date')(ioevent.ends_at,['yyyy-MM-ddTHH:mm:00.000000']),
                      'where': ioevent.where,
                      'allday':"false",
                      'access':$scope.account.access,
                      'description':$scope.ioevent.note,
                      'invites':$scope.invites,
                      'parent':  $scope.account.entityKey,
                      'guest_modify':$scope.guest_modify.toString(),
                      'guest_invite':$scope.guest_invite.toString(),
                      'guest_list':$scope.guest_list.toString(),
                      'reminder':$scope.reminder,
                      'method':$scope.method,
                      'timezone':$scope.timezoneChosen

                        }

                    }else{
                            params ={'title': ioevent.title,
                      'starts_at':$filter('date')(ioevent.starts_at,['yyyy-MM-ddTHH:mm:00.000000']),
                      'ends_at': moment(ioevent.ends_at).add('hours',2).format('YYYY-MM-DDTHH:mm:00.000000'),
                      'where': ioevent.where,
                      'allday':"false",
                      'access':$scope.account.access||'public',
                      'description':$scope.ioevent.note,
                      'invites':$scope.invites,
                      'parent':  $scope.account.entityKey,
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

$scope.updateEventRenderAfterAdd= function(){};

       $scope.deleteEvent =function(eventt){
    var params = {'entityKey':eventt.entityKey};
     Event.delete($scope,params);
   }
      $scope.eventDeleted = function(resp){
   };
        $scope.closeEventForm=function(ioevent){
      $scope.ioevent={};
      $scope.newEventform=false;
    }
        $scope.hilightEvent = function() {

            $('#event_0').effect("highlight", "slow");
            $('#event_0').effect("bounce", "slow");

        };
        $scope.listEvents = function() {
            var params = {
                'id': $scope.account.id,
                'events': {
                }
            };
            Account.get($scope, params);

        };

        //HKA 18.11.2013 Show modal Related list (Contact)

        $scope.addContactModal = function() {
            $('#addContactModal').modal('show');
        };

        // HKA 18.11.2013 Show modal Related list (Opportunity)
        $scope.addOppModal = function() {
            $('#addOpportunityModal').modal('show');
        };

        //HKA 18.11.2013 Show modal Related list (Case)
        $scope.addCaseModal = function() {
            $('#addCaseModal').modal('show');
        };

        //HKA 22.11.2013 List of Contacts related to account
        $scope.listContacts = function() {
            var params = {
                'id': $scope.account.id,
                'contacts': {
                    'limit': '6'
                }
            };
            Account.get($scope, params);
        };

        //HKA 22.11.2013 List of Opportunities related to account
        $scope.listOpportunities = function() {
            var params = {
                'id': $scope.account.id,
                'opportunities': {
                    'limit': '6'
                }
            };
            Account.get($scope, params);
        };

        //HKA 22.11.2013 List of Cases related to account
        $scope.listCases = function() {

            var params = {
                'id': $scope.account.id,
                'cases': {
                    'limit': '6'
                }
            };
            Account.get($scope, params);

        };

        // HKA 19.11.2013 Add Opportunty related to account
 $scope.opportunityInserted = function(resp){
          window.location.replace('#/accounts');
      };
        // HKA 19.11.2013 Add Case related to account

        $scope.listInfonodes = function(kind) {

            if (!$scope.isEmpty($scope.relatedInfonode)) {
                if ($scope.relatedInfonode.contact[$scope.relatedInfonode.infonode.kind]==undefined) {
                  $scope.relatedInfonode.contact[$scope.relatedInfonode.infonode.kind]={};
                  $scope.relatedInfonode.contact[$scope.relatedInfonode.infonode.kind].items=[];
                };
                $scope.relatedInfonode.contact[$scope.relatedInfonode.infonode.kind].items.push($scope.relatedInfonode.infonode.item);
                $scope.apply();
            }else{
              params = {'parent': $scope.account.entityKey,
                'connections': kind
                  };
                          InfoNode.list($scope, params);
            };            

        }
//HKA 19.11.2013 Add Phone
        $scope.addPhone = function(phone) {
            if (phone.number && !$scope.existsInfonode(phone,'number','phones')) {
                params = {'parent': $scope.account.entityKey,
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
            $scope.phone.number = '';

            $scope.showPhoneForm = false;


        };

        $scope.patchPhoneNumber = function(entityKey, data) {


            params = {
                'entityKey': entityKey,
                'parent': $scope.account.entityKey,
                'kind': 'phones',
                'fields': [
                    {
                        "field": "number",
                        "value": data
                    }
                ]
            };
            InfoNode.patch($scope, params);
        };


//HKA 20.11.2013 Add Email
        $scope.addEmail = function(email) {
            if (email.email && !$scope.existsInfonode(email,'email','emails')) {
                params = {'parent': $scope.account.entityKey,
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
            $scope.showEmailForm = false;
        };


        $scope.prepareUrl=function(url){
                      if (url==undefined) {
                        url='';
                      };
                     if(!url.match(/^[a-zA-Z]+:\/\//)){      
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
//HKA 22.11.2013 Add Website
        $scope.addWebsite = function(website) {
                      
            if (website.url!=""&&website.url!=undefined && !$scope.existsInfonode(website,'url','websites')) {
                params = {'parent': $scope.account.entityKey,
                'kind': 'websites',
                'fields': [
                    {
                        "field": "url",
                        "value": website.url
                    }
                ]
            };
            InfoNode.insert($scope, params);
            $scope.website = {};
            $scope.showWebsiteForm = false;

            };            
        };

//HKA 22.11.2013 Add Social
        $scope.addSocial = function(social) {
             if (social.url!=""&&social.url!=undefined && !$scope.existsInfonode(social,'url','sociallinks')) {
            params = {'parent': $scope.account.entityKey,
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
            };  
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
                            'parent': $scope.account.entityKey,
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
//HKA 22.11.2013 Add Tagline
        $scope.updateTagline = function(account) {

            var params = {
                'id': account.id,
                'tagline': account.tagline
            }
            Account.patch($scope, params);
        };

//HKA 22.11.2013 Add Introduction
        $scope.updateintro = function(account) {

            var params = {
                'id':account.id,
                'introduction': account.introduction
                }
            Account.patch($scope, params);
        };
//HKA 22.11.2013 Add Account

        $scope.updatAccountHeader = function(account){

          params = {'id':$scope.account.id,
                     'name':account.name,
                   'account_type':account.account_type,
                   'industry':account.industry}
          Account.patch($scope,params);
          $('#EditAccountModal').modal('hide');
        };
    // arezki lebdiri 03/07/2014 send email
        $scope.beforedeleteInfonde = function(){
            $('#BeforedeleteInfonode').modal('show');
        }
        $scope.deleteaccount = function(){
             var accountKey = {'entityKey':$scope.account.entityKey};
             Account.delete($scope,accountKey);
             $('#BeforedeleteAccount').modal('hide');
        };
        $scope.addAddress = function(address){

        Map.searchLocation($scope,address);

        $('#addressmodal').modal('hide');
        $scope.address={};
        };
      $scope.locationUpdated = function(addressArray){

          var params = {'id':$scope.account.id,
                         'addresses':addressArray};

          Account.patch($scope,params);
      };
      $scope.addGeo = function(address){
        if (!$scope.existsInfonode(address,'formatted','addresses')) {
           params = {'parent':$scope.account.entityKey,
            'kind':'addresses',
            'fields':[
                {
                  "field": "formatted",
                  "value": address.formatted
                }
            ]
          };
          if (address.lat){
            params = {'parent':$scope.account.entityKey,
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
        }
      };

        $scope.updatAccountHeader = function(account) {

            params = {'id': $scope.account.id,
                'owner':$scope.ownerSelected.google_user_id,
                'name': account.name,
                'account_type': account.account_type,
                'industry': account.industry}
            Account.patch($scope, params);
            $('#EditAccountModal').modal('hide');
        };
        // arezki lebdiri 03/07/2014 send email
        $scope.sendEmailSelected = function() {
            $scope.email.to = '';
            angular.forEach($scope.infonodes.emails, function(value, key) {
                if (value.email)
                    $scope.email.to = $scope.email.to + value.email + ',';
            });

        };
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
                  'about':$scope.account.entityKey
                  };
        if ($scope.sendWithAttachments){
            params['files']={
                            'parent':$scope.account.entityKey,
                            'access':$scope.account.access||'public',
                            'items':$scope.sendWithAttachments
                            };
        };
        
        Email.send($scope,params);       
      };
        $scope.emailSent=function(){
            $scope.email={};
            $scope.showCC=false;
            $scope.showBCC=false;
            $('#testnonefade').modal("hide");
             $scope.email={};
        }
        $scope.emailSentConfirmation=function(){
            $scope.email={};
            $scope.showCC=false;
            $scope.showBCC=false;
            $('#testnonefade').modal("hide");
             $scope.emailSentMessage=true;
             setTimeout(function(){  $scope.emailSentMessage=false; $scope.apply() }, 2000);
        }
        $scope.beforedeleteInfonde = function() {
            $('#BeforedeleteInfonode').modal('show');
        }
        $scope.deleteaccount = function() {
            var accountKey = {'entityKey': $scope.account.entityKey};
            Account.delete($scope, accountKey);

            $('#BeforedeleteAccount').modal('hide');
        };
        
        $scope.addAddress = function(address) {

            Map.searchLocation($scope, address);

            $('#addressmodal').modal('hide');
            $scope.address = {};
        };
        $scope.locationUpdated = function(addressArray) {

            var params = {'id': $scope.account.id,
                'addresses': addressArray};

            Account.patch($scope, params);
        };
        $scope.addGeo = function(address){
          if ($scope.isRelatedAddress) {
               $scope.pushElement(address, $scope.newcontact.addresses,'addresses');
               $scope.isRelatedAddress=false;
               $scope.apply();
        }else{
          params = {'parent':$scope.account.entityKey,
            'kind':'addresses',
            'fields':[
                {
                  "field": "formatted",
                  "value": address.formatted
                }
            ]
          };
          if (address.lat){
            params = {'parent':$scope.account.entityKey,
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
        }
      };
        $scope.deleteInfos = function(arr, index) {
            arr.splice(index, 1);
            $scope.apply();
        }
        //HKA 08.01.2014
        $scope.About_render = function(accid) {

            var acc = Account.get($scope, accountid);

            $scope.addresses = acc.addresses;
            Map.render($scope);
        };

        $scope.idealTextColor = function(bgColor) {
            var nThreshold = 105;
            var components = getRGBComponents(bgColor);
            var bgDelta = (components.R * 0.299) + (components.G * 0.587) + (components.B * 0.114);

            return ((255 - bgDelta) < nThreshold) ? "#000000" : "#ffffff";
        };
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

        $scope.getTopicUrl = function(type, id) {
            return Topic.getUrl(type, id);
        };
        $scope.setLocation=function(address){
            Map.setLocation($scope,address);
        }
//HKA 12.03.2014 Edit infonode
        $scope.edit_email = function(email) {

            $scope.edited_email = email;
        };

        $scope.editTag = function(tag) {
            $scope.edited_tag = tag;
        }
        $scope.doneEditTag = function(tag) {
            $scope.edited_tag = null;
            $scope.updateTag(tag);
        };

        $scope.initObject = function(obj) {
            for (var key in obj) {
                obj[key] = null;
            }
        }
                $scope.pushAddressTocontact=function(elem, arr){
          if (arr==undefined) {
            arr=[];
          };
          if (elem) {
            arr.push(elem);
          };
          
        }
      $scope.pushElement = function(elem, arr, infos) {
            if (arr==undefined) {
              arr=[];
            };
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
                      
                        if ($scope.sociallink) {
                            $scope.sociallink.url = '';
                            $scope.showSociallinkForm = false;
                        }
                        if ($scope.newsociallink) {
                           $scope.newsociallink.url = '';
                        };
                        break;
                    case 'customfields' :
                        if (elem.field && elem.value) {
                            var copyOfElement = angular.copy(elem);
                            arr.push(copyOfElement);
                            $scope.initObject(elem);
                        }
                        if ($scope.customfield) {
                          $scope.customfield.field = '';
                          $scope.customfield.value = '';
                          $scope.showCustomFieldForm = false;
                        }
                        if ($scope.newcustom) {
                           $scope.newcustom.field = '';
                          $scope.newcustom.value = '';
                        };

                        break;
                    case 'addresses' :
                        if (elem.formatted) {
                            var copyOfElement = angular.copy(elem);
                            arr.push(copyOfElement);
                            $scope.initObject(elem);
                        }

                        $('#addressmodal').modal('hide');

                        break;
                    case 'notes' :
                        if (elem.title||elem.content) {
                            var copyOfElement = angular.copy(elem);
                            arr.push(copyOfElement);
                            $scope.initObject(elem);
                        }

                        break;
  
                }
            } else {
                alert("item already exit");
            }
        };

        $scope.listMoreOnScroll = function() {
            switch ($scope.selectedTab)
            {
                case 3:
                    $scope.ContactlistNextPageItems();
                    break;
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
        $scope.saveRelatedinUrl=function(shortProfile){
          $scope.relatedinList=[];
          $scope.inRelatedShortProfiles=[];
          $scope.relatedinProfile={};
          $scope.relatedinProfile=shortProfile;
          $scope.linkedShortProfile={};
          $scope.newcontact.sociallink={'url':$scope.relatedinProfile.url};
          $scope.savedSociallink=$scope.relatedinProfile.url;
          $scope.newcontact.sociallinks.push($scope.newcontact.sociallink);
          $scope.imageSrcnewContact = $scope.relatedinProfile.profile_picture;
          if (!$scope.newcontact.title) {
            $scope.newcontact.title = $scope.relatedinProfile.title;
          };
          $scope.newcontact.account=$scope.account.entityKey;
           
          $scope.relatedAddressModel=$scope.relatedinProfile.locality;
          $scope.apply();
      }
          $scope.getRelatedinByUrl=function(url){
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
                         $scope.inRelatedShortProfiles.push(prof);
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
             $scope.getRelatedinProfile=function(){
              var params={
                "firstname":$scope.newcontact.firstname,
                "lastname":$scope.newcontact.lastname
                }
                var linkedurl=null;
                $scope.inNoResults=false;
                if ($scope.newcontact.sociallinks==undefined) {
                  $scope.newcontact.sociallinks=[];
                };
                var savedEntityKey=null;
                if ($scope.newcontact.sociallinks.length > 0) {
                   angular.forEach($scope.newcontact.sociallinks, function(link){
                                    if ($scope.linkedinUrl(link.url)) {
                                      linkedurl=link.url;
                                      savedEntityKey=link.entityKey;
                                    };
                                });
                };
                Linkedin.listPeople(params,function(resp){
                     $scope.inIsSearching=true;
                     $scope.inRelatedShortProfiles=[];
                     $scope.relatedinProfile={};
                     if(!resp.code){
                          $scope.inIsSearching=false;
                          if (resp.items==undefined) {
                            $scope.relatedinList=[];
                            $scope.inNoResults=true;
                            $scope.inIsSearching=false;
                          }else{
                            $scope.relatedinList=resp.items;
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
                                $scope.inNoResults = true;
                                $scope.inIsSearching = false;
                                $scope.apply();
                            }
                        }
                  });            
            }


        $scope.twitterUrl=function(url){
                         var match="";
                         var matcher = new RegExp("twitter");
                         var test = matcher.test(url);                        
                         return test;
        }
        $scope.getRelatedtwProfile=function(){
              var params={
                "firstname":$scope.newcontact.firstname,
                "lastname":$scope.newcontact.lastname
                }
                var twitterurl=null;
                $scope.twNoResults=false;
                if ($scope.newcontact.sociallinks==undefined) {
                  $scope.newcontact.sociallinks=[];
                };
                var savedEntityKey=null;
                if ($scope.newcontact.sociallinks.length > 0) {
                   angular.forEach($scope.newcontact.sociallinks, function(link){
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
                       $scope.relatedtwProfile.name=resp.name;
                       $scope.relatedtwProfile.screen_name=resp.screen_name;
                       $scope.relatedtwProfile.created_at=resp.created_at
                       $scope.relatedtwProfile.description_of_user=resp.description_of_user;
                       $scope.relatedtwProfile.followers_count=resp.followers_count;
                       $scope.relatedtwProfile.friends_count=resp.friends_count; 
                       $scope.relatedtwProfile.id=resp.id; 
                       $scope.relatedtwProfile.lang=resp.lang; 
                       $scope.relatedtwProfile.language=resp.language; 
                       $scope.relatedtwProfile.last_tweet_favorite_count=resp.last_tweet_favorite_count; 
                       $scope.relatedtwProfile.last_tweet_retweet_count=resp.last_tweet_retweet_count; 
                       $scope.relatedtwProfile.last_tweet_text=resp.last_tweet_text; 
                       $scope.relatedtwProfile.location=resp.location; 
                       $scope.relatedtwProfile.nbr_tweets=resp.nbr_tweets; 
                       $scope.relatedtwProfile.profile_banner_url=resp.profile_banner_url+'/1500x500'; 
                       $scope.relatedtwProfile.profile_image_url_https=resp.profile_image_url_https; 
                       $scope.relatedtwProfile.url_of_user_their_company=resp.url_of_user_their_company; 
                       $scope.relatedtwProfile.entityKey=savedEntityKey;
                       $scope.relatedtwProfile.url=twitterurl;
                       if ($scope.newcontact.addresses==undefined||$scope.newcontact.addresses==[]) {
                          $scope.addGeo({'formatted':$scope.relatedtwProfile.location});
                        };
                       $scope.twIsLoading = false;
                       $scope.isLoading = false;
                       $scope.apply();
                      }else {
                        console.log("no 401");
                         if(resp.code==401){
                          $scope.isLoading = false;
                          $scope.apply();
                         };
                      }
                   });
                }else{
                  Linkedin.getTwitterList(params,function(resp){
                     $scope.twIsSearching=true;
                     $scope.twRelatedShortProfiles=[];
                     $scope.relatedtwProfile={};
                     if(!resp.code){
                      $scope.twIsSearching=false;
                      if (resp.items==undefined) {
                        $scope.relatedtwList=[];
                        $scope.twNoResults=true;
                        $scope.twIsSearching=false;
                      }else{
                        $scope.relatedtwList=resp.items;
                        $scope.apply();
                        if (resp.items.length < 4) {
                          angular.forEach(resp.items, function(item){
                              $scope.getRelatedtwByUrl(item.url);
                        });
                        }
                      };
                         $scope.isLoading = false;
                         $scope.apply();
                        }else {
                          console.log("no 401");
                           if(resp.code==401){
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
              $scope.getRelatedtwByUrl=function(url){
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
                         $scope.twRelatedShortProfiles.push(prof);
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
                 $scope[arrayname]=[];
                 $scope.apply();

              }
              $scope.saveRelatedtwUrl=function(shortProfile){
              $scope.relatedtwList=[];
              $scope.twRelatedShortProfiles =[];
              $scope.relatedtwProfile={};
              $scope.relatedtwProfile=shortProfile;
              $scope.sociallink={'url':$scope.relatedtwProfile.url};
              $scope.website={'url':$scope.relatedtwProfile.url_of_user_their_company};
              $scope.savedSociallink=$scope.relatedtwProfile.url;
              
              $scope.newcontact.sociallink={'url':$scope.relatedtwProfile.url};
              $scope.savedSociallink=$scope.relatedtwProfile.url;
              $scope.newcontact.sociallinks.push($scope.newcontact.sociallink);

              if ($scope.imageSrc=='/static/src/img/avatar_contact.jpg'||$scope.imageSrc=='') {
                $scope.imageSrc=$scope.relatedtwProfile.profile_image_url_https;
                $scope.profile_img.profile_img_url = $scope.relatedtwProfile.profile_image_url_https;
              };
               if (!$scope.addressModel) {
                    $scope.addressModel=$scope.relatedtwProfile.location; 
                  }else{
                    if ($scope.addressModel.length < $scope.relatedtwProfile.location.length) {
                      $scope.addressModel=$scope.relatedtwProfile.location;  
                    };
                  };
              $scope.apply();
          }

            $scope.clearContact=function(){
              $scope.newcontact={};
              $scope.newcontact.sociallinks=[];
              $scope.relatedinList=[];
              $scope.twRelatedShortProfiles=[];
              $scope.newcontact.websites=[];
              $scope.newcontact.phones=[];
              $scope.newcontact.emails=[];
              $scope.newcontact.customfields=[];
              $scope.newcontact.addresses=[];
              $scope.relatedinProfile={};
              $scope.relatedAddressModel=null;
              $scope.inRelatedShortProfiles=[];
              $scope.imageSrcnewContact= '/static/src/img/avatar_contact.jpg';
              $scope.imageSrc = '/static/src/img/default_company.png';
              $scope.apply();
            }
            $scope.prepareRelated = function() {
            var infonodes = [];
            angular.forEach($scope.newcontact.websites, function(website) {
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
            angular.forEach($scope.newcontact.sociallinks, function(sociallink) {
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
            angular.forEach($scope.newcontact.customfields, function(customfield) {
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
            angular.forEach($scope.newcontact.addresses, function(address){
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
              if (address.formatted) {
                infonode.fields.push({"field": "formatted","value": address.formatted});
              };
              infonodes.push(infonode);
          });
            return infonodes;
        };
        $scope.addContactDetail=function(elem, arr,attr){
            if (elem[attr]!=null&&elem[attr]!=undefined) {
              var copyOfElement = angular.copy(elem);
              arr.push(copyOfElement);
              $scope.initObject(elem);  
            };
            
        } 
        $scope.removeContactDetail=function(arr, indx){
          arr.splice(indx,1);
          $scope.apply();
        } 
                   $scope.twitterUrl=function(url){
                         var match="";
                         var matcher = new RegExp("twitter");
                         var test = matcher.test(url);                        
                         return test;
        }
          $scope.getTwitterProfile=function(){
              var params={
                "company":$scope.account.name
                }
                var twitterurl=null;
                $scope.twNoResults=false;
                if ($scope.infonodes.sociallinks==undefined) {
                  $scope.infonodes.sociallinks=[];
                };
                var savedEntityKey=null;
                if ($scope.infonodes.sociallinks.length > 0) {
                   angular.forEach($scope.infonodes.sociallinks, function(link){
                                    if ($scope.twitterUrl(link.url)) {
                                      twitterurl=link.url;
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
                       if ($scope.account.addresses==undefined||$scope.account.addresses==[]) {
                          $scope.addGeo({'formatted':$scope.twProfile.location});
                        };
                       $scope.twIsLoading = false;
                       $scope.isLoading = false;
                       $scope.apply();
                      }else {
                        console.log("no 401");
                         if(resp.code==401){
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
                        $scope.twList=resp.items;
                        if (resp.items.length < 4) {
                          angular.forEach(resp.items, function(item){
                              $scope.getTwitterByUrl(item.url);
                        });
                        }
                      };
                         $scope.isLoading = false;
                         $scope.$apply();
                        }else {
                          console.log("no 401");
                           if(resp.code==401){
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
                 $scope[arrayname]=[];
                 $scope.apply();

              }
              $scope.saveTwitterUrl=function(shortProfile){
              $scope.twList=[];
              $scope.twShortProfiles =[];
              $scope.twProfile={};
              $scope.twProfile=shortProfile;
              var link={'url':shortProfile.url}
              $scope.addSocial(link);
              var params ={'id':$scope.account.id};
              if ($scope.imageSrc=='/static/src/img/avatar_contact.jpg'||$scope.imageSrc=='') {
                $scope.imageSrc=$scope.twProfile.profile_image_url_https;
                 params['profile_img_url'] = $scope.twProfile.profile_image_url_https;
              };              
              if ($scope.infonodes.addresses==undefined||$scope.infonodes.addresses==[]) {
                $scope.addGeo({'formatted':$scope.linkedProfile.locality});
              };
               Contact.patch($scope,params);
              $scope.apply();
          }
        $scope.DeleteCollaborator=function(entityKey){
            var item = {
                          'type':"user",
                          'value':entityKey,
                          'about':$scope.account.entityKey
                        };
            Permission.delete($scope,item)
        };
        // Google+ Authentication
        Auth.init($scope);
        $(window).scroll(function() {
            if (!$scope.isLoading && ($(window).scrollTop() > $(document).height() - $(window).height() - 100)) {
                $scope.listMoreOnScroll();
            }
        });

    }]);
app.controller('AccountNewCtrl', ['$scope', '$http','Auth', 'Account', 'Tag', 'Edge','Map','Linkedin','Contact','Customfield',
    function($scope,$http,Auth, Account, Tag, Edge, Map, Linkedin,Contact,Customfield) {
        $("ul.page-sidebar-menu li").removeClass("active");
        $("#id_Accounts").addClass("active");

        document.title = "Accounts: New";
        trackMixpanelAction('ACCOUNT_NEW_VIEW');
        $scope.isSignedIn = false;
        $scope.immediateFailed = false;
        $scope.nextPageToken = undefined;
        $scope.prevPageToken = undefined;
        $scope.isLoading = false;
        $scope.nbLoads=0;
        $scope.leadpagination = {};
        $scope.currentPage = 1;
        $scope.pages = [];
        $scope.stage_selected = {};
        $scope.accounts = [];
        $scope.account = {};
        $scope.account.addresses = [];
        $scope.account.access = 'public';
        $scope.order = '-updated_at';
        $scope.status = 'New';
        $scope.showPhoneForm = false;
        $scope.showEmailForm = false;
        $scope.showWebsiteForm = false;
        $scope.showSociallinkForm = false;
        $scope.showCustomFieldForm = false;
        $scope.phones = [];
        $scope.addresses = [];
        $scope.infonodes=[];
        $scope.infonodes.addresses=[];
        $scope.emails = [];
        $scope.websites = [];
        $scope.existingcontacts=[];
        $scope.sociallinks = [];
        $scope.customfields = [];
        $scope.newContactform = false;
        $scope.account.account_type = 'Customer';
        $scope.account.industry = '';
        $scope.phone = {};
        $scope.notes = [];
        $scope.contact = {};
        $scope.currentContact = {};
        $scope.account.contacts = [];
        $scope.phone.type = 'work';
        $scope.newRelatedContact =false;
        $scope.contactResults=[]; 
        $scope.CurrentDate = new Date();
        $scope.contactSearchL=true;
        $scope.logo = {
            'logo_img_id': null,
            'logo_img_url': null
        };
        $scope.imageSrc = '/static/src/img/default_company.png';
        $scope.industries=["Accounting ","Airlines/Aviation ","Alternative Dispute Resolution ","Alternative Medicine ","Animation ","Apparel &amp; Fashion ","Architecture &amp; Planning ","Arts &amp; Crafts ","Automotive ","Aviation &amp; Aerospace ","Banking ","Biotechnology ","Broadcast Media ","Building Materials ","Business Supplies &amp; Equipment ","Capital Markets ","Chemicals ","Civic &amp; Social Organization ","Civil Engineering ","Commercial Real Estate ","Computer &amp; Network Security ","Computer Games ","Computer Hardware ","Computer Networking ","Computer Software ","Construction ","Consumer Electronics ","Consumer Goods ","Consumer Services ","Cosmetics ","Dairy ","Defense &amp; Space ","Design ","Education Management ","E-learning ","Electrical &amp; Electronic Manufacturing ","Entertainment ","Environmental Services ","Events Services ","Executive Office ","Facilities Services ","Farming ","Financial Services ","Fine Art ","Fishery ","Food &amp; Beverages ","Food Production ","Fundraising ","Furniture ","Gambling &amp; Casinos ","Glass, Ceramics &amp; Concrete ","Government Administration ","Government Relations ","Graphic Design ","Health, Wellness &amp; Fitness ","Higher Education ","Hospital &amp; Health Care ","Hospitality ","Human Resources ","Import &amp; Export ","Individual &amp; Family Services ","Industrial Automation ","Information Services ","Information Technology &amp; Services ","Insurance ","International Affairs ","International Trade &amp; Development ","Internet ","Investment Banking/Venture ","Investment Management ","Judiciary ","Law Enforcement ","Law Practice ","Legal Services ","Legislative Office ","Leisure &amp; Travel ","Libraries ","Logistics &amp; Supply Chain ","Luxury Goods &amp; Jewelry ","Machinery ","Management Consulting ","Maritime ","Marketing &amp; Advertising ","Market Research ","Mechanical or Industrial Engineering ","Media Production ","Medical Device ","Medical Practice ","Mental Health Care ","Military ","Mining &amp; Metals ","Motion Pictures &amp; Film ","Museums &amp; Institutions ","Music ","Nanotechnology ","Newspapers ","Nonprofit Organization Management ","Oil &amp; Energy ","Online Publishing ","Outsourcing/Offshoring ","Package/Freight Delivery ","Packaging &amp; Containers ","Paper &amp; Forest Products ","Performing Arts ","Pharmaceuticals ","Philanthropy ","Photography ","Plastics ","Political Organization ","Primary/Secondary ","Printing ","Professional Training ","Program Development ","Public Policy ","Public Relations ","Public Safety ","Publishing ","Railroad Manufacture ","Ranching ","Real Estate ","Recreational Facilities &amp; Services ","Religious Institutions ","Renewables &amp; Environment ","Research ","Restaurants ","Retail ","Security &amp; Investigations ","Semiconductors ","Shipbuilding ","Sporting Goods ","Sports ","Staffing &amp; Recruiting ","Supermarkets ","Telecommunications ","Textiles ","Think Tanks ","Tobacco ","Translation &amp; Localization ","Transportation/Trucking/Railroad ","Utilities ","Venture Capital ","Veterinary ","Warehousing ","Wholesale ","Wine &amp; Spirits ","Wireless ","Writing &amp; Editing"];
        $scope.account.notes=[];
        $scope.note={};
        $scope.linkedListLoader=false;
        $scope.inIsLoading=false;
        $scope.inIsSearching=false;        
        $scope.inShortProfiles=[];
        $scope.inProfile={};
        $scope.inNoResults=false;
        $scope.currentContact={};
        $scope.currentContact.sociallinks=[];
        $scope.currentContact.websites=[];
        $scope.sociallink={};
        $scope.accounts=[];
        $scope.accounts.customfields=[];
        $scope.account_err={};
        $scope.account_err.name=false; 
        $scope.lunchMaps=lunchMaps;
        $scope.lunchMapsLinkedin=lunchMapsLinkedin;
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
        $scope.initObject = function(obj) {
            for (var key in obj) {
                obj[key] = null;
            }
        }
        $scope.test=function(){
            console.log("work");
        }
        $scope.testaction=function(act){
            console.log(act);
        }

        $scope.pushElement = function(elem, arr, infos) {
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
                        $scope.email.email = ''
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
                        if (elem.country||elem.formatted) {
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
        $scope.linkedinUrl=function(url){
                         var match="";
                         var matcher = new RegExp("linkedin");
                         var test = matcher.test(url);                        
                         return test;
        }
        $scope.addNote = function(){
       $scope.notes.push($scope.newnote)
       $scope.newnote={}
     }
        $scope.saveLinkedinUrl=function(shortProfile){
           /* $scope.clearAccount();*/
            $scope.inProfile=shortProfile;
            $scope.linkedShortProfile={};
            $scope.account.industry=$scope.inProfile.industry;
            $scope.account.name=$scope.inProfile.name;
            $scope.sociallink={'url':$scope.inProfile.url};
            $scope.pushElement($scope.sociallink,$scope.sociallinks,'sociallinks');
            $scope.account.logo_img_url=$scope.inProfile.logo;
            $scope.imageSrc=$scope.inProfile.logo;
            $scope.addGeo({'formatted':$scope.inProfile.headquarters});
             if ($scope.inProfile.website!=""&&$scope.inProfile.website!=undefined) {
                    $scope.website={'url':$scope.inProfile.website};
                    $scope.pushElement($scope.website,$scope.websites,'websites');
            };
            $scope.clearLinkedin();
            $scope.apply();
          }
          $scope.twitterUrl=function(url){
                         var match="";
                         var matcher = new RegExp("twitter");
                         var test = matcher.test(url);                        
                         return test;
        }
          $scope.getTwitterProfile=function(){
                var params={
                    "company":$scope.account.name
                  }
                  var twitterurl=null;
                  $scope.twNoResults=false;
                  if ($scope.account.sociallinks==undefined) {
                    $scope.account.sociallinks=[];
                  };
                  var savedEntityKey=null;
                  if ($scope.account.sociallinks.length > 0) {
                     angular.forEach($scope.account.sociallinks, function(link){
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
                         $scope.twProfile.profile_banner_url=resp.profile_banner_url; 
                         $scope.twProfile.profile_image_url_https=resp.profile_image_url_https; 
                         $scope.twProfile.url_of_user_their_company=resp.url_of_user_their_company; 
                         $scope.twProfile.entityKey=savedEntityKey;
                         $scope.twProfile.url=twitterurl;
                         $scope.twIsLoading = false;
                         $scope.isLoading = false;
                         $scope.apply();
                        }else {
                           if(resp.code==401){
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
                          $scope.twList=resp.items;
                          if (resp.items.length < 4) {
                            angular.forEach(resp.items, function(item){
                                $scope.getTwitterByUrl(item.url);
                          });
                          }
                        };
                           $scope.isLoading = false;
                           $scope.$apply();
                          }else {
                            console.log("no 401");
                             if(resp.code==401){
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
                           prof.profile_banner_url=resp.profile_banner_url; 
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
              $scope.saveTwitterUrl=function(shortProfile){
                $scope.twList=[];
                $scope.twShortProfiles =[];
                $scope.twProfile={};
                $scope.twProfile=shortProfile;
                var lin={'url':$scope.twProfile.url};
                $scope.pushElement(lin,$scope.sociallinks,'sociallinks');
                if ($scope.twProfile.url_of_user_their_company) {
                  $scope.website={'url':$scope.twProfile.url_of_user_their_company};  
                  $scope.pushElement($scope.website,$scope.websites,'websites');
                };              
                $scope.savedSociallink=$scope.twProfile.url;
                if ($scope.imageSrc=='/static/src/img/default_company.png'||$scope.imageSrc=='') {
                  $scope.imageSrc=$scope.twProfile.profile_image_url_https;
                  $scope.profile_img.profile_img_url = $scope.twProfile.profile_image_url_https;
                };

                if (!$scope.addressModel) {
                      $scope.addressModel=$scope.twProfile.location; 
                    }else{
                      if ($scope.addressModel.length < $scope.twProfile.location.length) {
                        $scope.addressModel=$scope.twProfile.location;  
                      };
                    };
                $scope.apply();
            }
         $scope.cancelSelection=function(arrayname){
                   $scope[arrayname]=[];
                   $scope.apply();

                }
                $scope.messageFromSocialLinkCallback = function(event){
                  if (event.origin!=='https://accounts.google.com'&&event.origin!=='https://gcdc2013-iogrow.appspot.com'&&event.origin!=='http://localhost:8090'){
                      $scope.saveLinkedinData(event.data);
                      window.removeEventListener("message", $scope.messageFromSocialLinkCallback, false);
                  }
                  };
                  $scope.saveLinkedinData=function(data){
                    //company Data
                    if (data.firstname||data.lastname) {
                        $scope.relatedinList=[];
                        var params={
                          'firstname':data.firstname,
                          'lastname':data.lastname,
                          'title':data.title,
                          'phone':data.phone,
                          'email':data.email,
                          'address':data.locality,
                          'sociallink':data.linkedin_url
                        }
                        $scope.currentContact=$.extend(true, $scope.currentContact, params);
                        $scope.apply();
                    }else{
                      if (data.name) {
                        $scope.sociallink={};$scope.email={};$scope.website={};
                        $scope.inList=[];
                        var params={
                          'name':data.name,
                          'industry':data.industry,
                          'introduction':data.introduction,
                          'logo_img_url':data.logo_img_url,
                          'cover_image':data.imgCoverUrl,
                          'linkedin_profile':{
                                'company_size':data.companySize,
                                'followers':data.followers,
                                'founded':data.foundedAt,
                                'headquarters':data.locality,
                                'industry':data.industry,
                                'logo':data.logo_img_url,
                                'name':data.name,
                                'summary':data.summary,
                                'top_image':data.imgCoverUrl,
                                'type':data.publicOrPrivate,
                                'url':data.linkedin_url,
                                'website':data.website
                          }
                        };
                        $scope.imageSrc=data.logo_img_url;
                        $scope.account=$.extend(true, $scope.account, params);
                        var website={
                          'url':data.website
                        };
                        $scope.pushElement(website,$scope.websites,'websites');
                        var address={'formatted':data.locality};
                        $scope.pushElement(address,$scope.addresses,'addresses');
                        var sociallink={
                          url:data.linkedInUrl
                        };
                        $scope.pushElement(sociallink,$scope.sociallinks,'sociallinks');
                        $scope.apply();
                      };
                    };
                     
                  }

      $scope.socialLinkOpener = function(socialLinkUrl){
            $scope.showLinkedinWindown=$scope.prepareUrl(socialLinkUrl);
            if (navigator.isChrome(navigator.sayswho)) {
                if (typeof (sessionStorage.isChromeExtensionInstalled) === 'undefined'){
                    $scope.browser='chrome';
                    $('#extensionNotInstalled').modal({backdrop: 'static', keyboard: false});
                }else{
                    var p=$("#newAccMain");
                    var offsets = document.getElementById('newAccMain').getBoundingClientRect();
                    var top = offsets.top + 120;
                    var left = offsets.left;
                    var width = document.getElementById('newAccMain').offsetWidth;
                    var height = document.getElementById('newAccMain').offsetHeight;
                    window.open($scope.showLinkedinWindown+'#iogrow','winname','width='+width+',height=500, left='+left+',top='+top);
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
            $scope.getLinkedinByUrl=function(url){
               $scope.inIsLoading=true;
               var par={'url' : url};
               Linkedin.getCompany(par,function(resp){
                      if(!resp.code){
                       var prof={};
                       prof.company_size=resp.company_size;
                       prof.headquarters=resp.headquarters;
                       prof.followers=resp.followers;
                       prof.founded=resp.founded;
                       prof.industry=resp.industry;
                       prof.logo=resp.logo;
                       prof.name=resp.name;
                       prof.summary=resp.summary;
                       prof.top_image=resp.top_image;
                       prof.type=resp.type;
                       prof.url=resp.url;
                       prof.website=resp.website;
                       prof.workers=JSON.parse(resp.workers);
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
            $scope.getLinkedinProfile=function(){
              if ($scope.account.name!=""&&$scope.account.name!=undefined&&$scope.account.name!=$scope.inProfile.name) {
                  var params={
                   "company":$scope.account.name
                  }                
                  if ($scope.infonodes.sociallinks==undefined) {
                    $scope.infonodes.sociallinks=[];
                  };
                  Linkedin.listCompanies(params,function(resp){
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
                       $scope.isLoading = false;
                       $scope.apply();
                      }else {
                         if(resp.code==401){
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
              };
       }
      $scope.deleteSocialLink = function(link,kind){
        if (link.entityKey) {
          var pars = {'entityKey':link.entityKey,'kind':kind};

        InfoNode.delete($scope,pars);
        if ($scope.linkedinUrl(link.url)) {
          $scope.inProfile={};
          $scope.inShortProfiles=[];
          var params={
              "company":$scope.account.name
              }
         Linkedin.listCompanies(params,function(resp){
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
                          angular.forEach(resp.items, function(item){
                              $scope.getLinkedinByUrl(item.url);
                        });
                      }
                    };
                       $scope.isLoading = false;
                       $scope.$apply();
                      }else {
                         if(resp.code==401){
                          $scope.isLoading = false;
                          $scope.$apply();
                         };
                        if (resp.code >= 503) {
                                $scope.inNoResults = true;
                                $scope.inIsSearching = false;
                                $scope.apply();
                            }
                      }
                }); 
        };
      }else{
        $scope.inShortProfiles=[];
        $scope.inProfile={};
        $scope.apply()
      };
  };
    $scope.isEmpty=function(obj){
        return jQuery.isEmptyObject(obj);
      }
      $scope.isEmptyArray=function(Array){
                return !(Array != undefined && Array.length > 0);;
            
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
   $scope.clearLinkedin=function(){
        $scope.inProfile={};
        $scope.inShortProfiles=[];
        $scope.inList=[];
        $scope.apply()
      }
      $scope.clearAccount=function(){
        $scope.account={};
        $scope.currentContact={};
        $scope.sociallinks=[];
        $scope.inList=[];
        $scope.websites=[];
        $scope.phones=[];
        $scope.emails=[];
        $scope.customfields=[];
        $scope.addresses=[];
        $scope.inProfile={};
        $scope.inShortProfiles=[];
        $scope.imageSrc = '/static/src/img/default_company.png';
        $scope.apply();
      }
      $scope.saveRelatedinUrl=function(shortProfile){
          $scope.relatedinList=[];
          $scope.inRelatedShortProfiles=[];
          $scope.relatedinProfile={};
          $scope.relatedinProfile=shortProfile;
          $scope.linkedShortProfile={};
          $scope.currentContact.sociallink={'url':$scope.relatedinProfile.url};
          $scope.savedSociallink=$scope.relatedinProfile.url;
          $scope.pushElement($scope.currentContact.sociallink,$scope.currentContact.sociallinks,'sociallinks');
          $scope.imageSrcnewContact = $scope.relatedinProfile.profile_picture;
          if (!$scope.currentContact.title) {
            $scope.currentContact.title = $scope.relatedinProfile.title;
          };
          $scope.currentContact.account=$scope.account.entityKey;
           
          $scope.relatedAddressModel=$scope.relatedinProfile.locality;
          $scope.apply();
      }
          $scope.getRelatedinByUrl=function(url){
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
                         $scope.inRelatedShortProfiles.push(prof);
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
             $scope.getRelatedinProfile=function(){
              var params={
                "firstname":$scope.currentContact.firstname,
                "lastname":$scope.currentContact.lastname
                }
                var linkedurl=null;
                $scope.inNoResults=false;
                if ($scope.currentContact.sociallinks==undefined) {
                  $scope.currentContact.sociallinks=[];
                };
                  Linkedin.listPeople(params,function(resp){
                     $scope.inIsSearching=true;
                     $scope.inRelatedShortProfiles=[];
                     $scope.relatedinProfile={};
                     if(!resp.code){
                      $scope.inIsSearching=false;
                      if (resp.items==undefined) {
                        $scope.relatedinList=[];
                        $scope.inNoResults=true;
                        $scope.inIsSearching=false;
                      }else{
                        $scope.relatedinList=resp.items;
                      };
                         $scope.isLoading = false;
                         $scope.$apply();
                        }else {
                           if(resp.code==401){
                            $scope.isLoading = false;
                            $scope.$apply();
                           };
                        }
                  });            
            }
          $scope.clearContact=function(){

              $scope.currentContact={};
              $scope.currentContact.sociallinks=[];
              $scope.relatedinList=[];
              $scope.currentContact.websites=[];
              $scope.currentContact.phones=[];
              $scope.currentContact.emails=[];
              $scope.currentContact.customfields=[];
              $scope.currentContact.addresses=[];
              $scope.relatedinProfile={};
              $scope.relatedAddressModel=null;
              $scope.inRelatedShortProfiles=[];
              $scope.imageSrcnewContact= '/static/src/img/avatar_contact.jpg';
              $scope.imageSrc = '/static/src/img/default_company.png';
              $scope.apply();

            }
                    $scope.prepareRelated = function() {
            var infonodes = [];
            angular.forEach($scope.currentContact.websites, function(website) {
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
            angular.forEach($scope.currentContact.sociallinks, function(sociallink) {
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
            angular.forEach($scope.currentContact.customfields, function(customfield) {
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
            angular.forEach($scope.currentContact.addresses, function(address){
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
              if (address.formatted) {
                infonode.fields.push({"field": "formatted","value": address.formatted});
              };
              infonodes.push(infonode);
          });
            return infonodes;
        };
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
                  return !(Array != undefined && Array.length > 0);;
              
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
        //HKA 01.06.2014 Delete the infonode on DOM
        $scope.deleteInfos = function(arr, index) {
            arr.splice(index, 1);
        }
        $scope.runTheProcess = function() {
            $scope.getCustomFields("accounts");
            $scope.mapAutocomplete();
            Map.justAutocomplete($scope,"relatedContactAddress",$scope.currentContact.address);
            ga('send', 'pageview', '/accounts/new');

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

                    }
            }
        };
        $scope.mapAutocomplete=function(){
            $scope.addresses = $scope.account.addresses;
            Map.autocomplete ($scope,"pac-input");
        }
        
        $scope.addGeo = function(address){
               $scope.infonodes.addresses.push(address);
               $scope.addresses.push(address);
               $scope.apply();
            };
        $scope.setLocation=function(address){
            Map.setLocation($scope,address);
        }
        $scope.notFoundAddress=function(address,inputId){
            $scope.addressNotFound=address.name;
            $('#confirmNoGeoAddress').modal('show');
            $scope.apply(); 

            $('#'+inputId).val("");           
        }
        $scope.confirmaddress=function(){
             $scope.account.addresses.push({'formatted':$scope.addressNotFound});
             $scope.addressNotFound='';
             $('#confirmNoGeoAddress').modal('hide');
             $scope.apply();

        }
        // We need to call this to refresh token when user credentials are invalid
        $scope.refreshToken = function() {
            Auth.refreshToken();
        };
        // new Lead
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

          $scope.prepareUrl=function(url){
                    var pattern=/^[a-zA-Z]+:\/\//;
                     if(!pattern.test(url)){                        
                         url = 'http://' + url;
                     }
                     return url;
        }
        $scope.selectContact = function(){
            $scope.existcontact = {
                        'firstname': $scope.searchContactQuery.firstname,
                        'lastname':  $scope.searchContactQuery.lastname,
                        'entityKey': $scope.searchContactQuery.entityKey
            }
            $scope.existingcontacts.push($scope.existcontact);
            $scope.apply();

        };
        $scope.changeRelatedForm =function(){
        }
        $scope.addContact = function(current) {
            
            if (current.firstname != null && current.lastname != null) {
                $scope.contact = {
                    'firstname': current.firstname,
                    'lastname': current.lastname,
                    'access': $scope.account.access||'public'
                }
                if (current.title != null) {
                    $scope.contact.title = current.title;
                }
                ;
                if (current.phone != null) {
                    $scope.contact.phones = [{'number': current.phone, 'type': 'work'}];
                }
                if (current.email != null) {
                    $scope.contact.emails = [{'email': current.email}];
                }
                if (current.address != null) {
                    $scope.contact.addresses = [{'address': current.address}];
               } ;
                if (!$scope.isEmptyArray(current.sociallinks)) {

                  if ($scope.contact.infonodes==undefined) {
                      $scope.contact.infonodes=[];
                  };
                    $scope.contact.infonodes.push({'kind': 'sociallinks','fields': [{'field': "url",'value': current.sociallink}]})
                } ;
                if ($scope.account.contacts==undefined) {
                  $scope.account.contacts=[];
                };
                $scope.account.contacts.push($scope.contact);
                $scope.currentContact = {};
            } else {
                $scope.currentContact = {};
            }
            ;

        }
        $scope.addLinkedinContact = function(linkedincontact) {
            if (!$scope.newRelatedContact) {
               $scope.newRelatedContact=true;
            };
            $scope.addContact($scope.currentContact);
            if (linkedincontact.firstname!=undefined||linkedincontact.lastname!=undefined) {
              $scope.currentContact.firstname=linkedincontact.firstname;
              $scope.currentContact.lastname=linkedincontact.lastname;
              if (linkedincontact.function!=undefined) {
                $scope.currentContact.title=linkedincontact.function;
              };
              if (linkedincontact.url!=undefined) {
                $scope.currentContact.sociallink=linkedincontact.url;
              }; 
              if ($scope.linkedProfile.headquarters!=undefined) {
                $scope.currentContact.address=$scope.linkedProfile.headquarters;
              };                  
            };    
            $scope.linkedProfile.workers.splice($scope.linkedProfile.workers.indexOf(linkedincontact),1);
        }


        $scope.unselectContact = function(index) {
            $scope.account.contacts.splice(index, 1);
        }
        $scope.prepareInfonodes = function() {
            var infonodes = [];
            angular.forEach($scope.websites, function(website) {
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
            angular.forEach($scope.sociallinks, function(sociallink) {
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
            angular.forEach($scope.customfields, function(customfield) {
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
            angular.forEach($scope.infonodes.addresses, function(address){
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
              if (address.formatted) {
                infonode.fields.push({"field": "formatted","value": address.formatted});
              };
              infonodes.push(infonode);
          });
            return infonodes;
        };
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
                if (data.docs) {
                    $scope.logo.logo_img_id = data.docs[0].id;
                    $scope.logo.logo_img_url = data.docs[0].url;
                    $scope.imageSrc = 'https://docs.google.com/uc?id=' + data.docs[0].id;
                    $scope.apply();
                }
            }
        }
        $scope.hilightLinkedin = function() {

            $('#linkedinSearch').effect("bounce", "slow");
            $('#linkedinSearch .caption').effect("highlight", "slow");
            $('#linkedinSearch').effect("highlight", "slow");
        }
        $scope.accountInserted = function(resp) {
            window.location.replace('/#/accounts');
        };
        $scope.save = function(account) {
         
            $scope.addContact($scope.currentContact);
            if (account.name) {
                var params = {
                    'name': account.name,
                    'cover_image':account.cover_image,
                    'account_type': account.account_type,
                    'industry': account.industry,
                    'tagline': account.tagline,
                    'introduction': account.introduction,
                    'phones': $scope.phones,
                    'emails': $scope.emails,
                    'addresses': $scope.addresses,
                    'infonodes': $scope.prepareInfonodes(),
                    'access': account.access||'public',
                    'contacts': account.contacts,
                    'existing_contacts':$scope.existingcontacts,
                    'notes':$scope.notes,
                    'linkedin_profile':account.linkedin_profile
                };

                if ($scope.logo.logo_img_id) {
                    params['logo_img_id'] = $scope.logo.logo_img_id;
                    params['logo_img_url'] = $scope.logo.logo_img_url;
                }else{
                   params['logo_img_url'] = account.logo_img_url;
                }
                Account.insert($scope, params);

            }else{
              $scope.account_err.name=true;
            }
        };
        $scope.accountInserted = function(resp){
          window.location.replace('/#/accounts/show/'+resp.id);
        };
        $scope.addAccountOnKey = function(account) {
            if (event.keyCode == 13 && account) {
                $scope.save(account);
            }
        };
        // Google+ Authentication
        Auth.init($scope);


    }]);
