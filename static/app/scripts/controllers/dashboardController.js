app.controller('dashboardCtrl', ['$scope','Auth','Import','Reports','Edge',
    function($scope,Auth,Import,Reports,Edge) {
     $("ul.page-sidebar-menu li").removeClass("active");
     $("#id_Dashboard").addClass("active");
     document.title = "Dashboard: Home";
     $scope.isSignedIn = false;
     $scope.immediateFailed = false;
     $scope.nextPageToken = undefined;
     $scope.prevPageToken = undefined;
     $scope.isLoading = false;
     $scope.pagination = {};
     $scope.currentPage = 01;
     $scope.pages = [];
     $scope.users = [];
     $scope.groups = [];
     $scope.highrise={};

     // the charts object
     $scope.chartOppoByOwner={};
     $scope.chartForLeadsOwner={};
     $scope.chartForLeadsSource={};

     // the charts data
     $scope.targetByOwner=[];
     $scope.oppoByOwner=[];
     $scope.LeadsOwner=[];
     $scope.LeadsSource=[];
     $scope.OppoStage=[];
     $scope.LeadStatus=[];

     $scope.chartIsReady=false;
     $scope.nbLeads=1349;
     $scope.alltarget=254620;
     $scope.total_amount=0;
     $scope.total_lead=0;
     
 

     // What to do after authentication
     $scope.runTheProcess = function(){
        Reports.Leads($scope,{})
     };

      
     // We need to call this to refresh token when user credentials are invalid
     $scope.refreshToken = function() {
        Auth.refreshToken();
     };
     $scope.prepareDataForCharts=function(data){
        $scope.total_amount=data.organization_opportunity_amount;
        $scope.total_lead=data.nbr_lead
        $scope.oppoByOwner.push(['Owner', 'Forcastable Pipline'])
        angular.forEach(data.org_oppo_owner,function(item){
         $scope.oppoByOwner.push([item.name,parseInt(item.amount_opportunity)])
        });
            
        $scope.chartOppoByOwner  = {
              "type": "BarChart",
              "cssStyle": "width:100%",
              "displayed": true,
              "data":$scope.oppoByOwner,
              "options": {
                    bar: {groupWidth: "35%"},
                    height: 500,
                    vAxis: {title: 'Owner',  titleTextStyle: {color: 'red'}},
                    chartArea:{top:20,left:150,height:"85%" ,width:"85%"},
                    legend: { position: "none" }
              },
              "formatters": {},
              "view": {}
            }
        
           $scope.LeadsOwner.push(['Owner', 'leads'])
            angular.forEach(data.leads_owner_org,function(item){
                $scope.LeadsOwner.push([item.name,parseInt(item.nbr_leads)])
            });
            

            $scope.chartForLeadsOwner={
                  "type": "BarChart",
                  "cssStyle": "width:100%",
                  "displayed": true,
                  "data":$scope.LeadsOwner,
                  "options": {
                        bar: {groupWidth: "35%"},
                        height: 500,
                        vAxis: {title: 'Owner',  titleTextStyle: {color: 'red'}},
                        chartArea:{top:20,left:150,height:"85%" ,width:"85%"},
                        legend: { position: "none" }
                  },
                  "formatters": {},
                  "view": {}
                }


            $scope.LeadsSource.push(['Owner', 'leads'])
            angular.forEach(data.leads_source_org,function(item){
                $scope.LeadsSource.push([item.name,parseInt(item.nbr_leads)])
            });
            $scope.chartForLeadsSource={
              "type": "PieChart",
              "data": $scope.LeadsSource,
              "options": {     
                "displayExactValues": true,
                "fontName":"Exo 2",
                'allowHtml':true,
                "legend":{position: 'bottom'},
                "titleTextStyle":{color: 'black', fontName: "Exo 2", fontSize: 14}
              },
              "formatters": {
                "number": [
                      {
                        "columnNum": 1,
                        "pattern": "$ #,##0.00"
                      }
                    ]
              },
              "displayed": true
            }
            data.org_oppo_stage.sort(function(a,b) {return  b.probability - a.probability});
            angular.forEach(data.org_oppo_stage,function(item){
                $scope.OppoStage.push({ amount: parseInt(item.amount_opportunity), status: item.name +"("+item.probability+"%)" })
            });
            
         $("#chartNormal").igFunnelChart({
            width: "100%",  //"325px",
            height: "200px",
            dataSource: $scope.OppoStage,
            valueMemberPath: "anmount",
            innerLabelMemberPath: "amount",
            innerLabelVisibility: "visible",
            outerLabelMemberPath: "status",
            outerLabelVisibility: "visible"
            });
        data.leads_status_org.sort(function(a,b) {return a.nbr_leads - b.nbr_leads});
        angular.forEach(data.leads_status_org,function(item){
                $scope.LeadStatus.push({ leads: parseInt(item.nbr_leads), status: item.name })
            });
        $("#chartNormal2").igFunnelChart({
        width: "100%",  //"325px",
        height: "200px",
        dataSource: $scope.LeadStatus,
        valueMemberPath: "leads",
        innerLabelMemberPath: "leads",
        innerLabelVisibility: "visible",
        outerLabelMemberPath: "status",
        outerLabelVisibility: "visible"
    });
         


     };
    $scope.dataForLeadsSource=[["Source","Number"]];
    $scope.dataForLeadsSource=$scope.dataForLeadsSource.concat($scope.leadsBySource);
    console.log($scope.dataForLeadsSource)
    $scope.dataForLeadsOwner=[['Owner', 'leads']];
    $scope.dataForLeadsOwner=$scope.dataForLeadsOwner.concat($scope.leadsByOwner);
    console.log($scope.dataForLeadsSource)
 
        $scope.testredy=function(){
            if (!$scope.chartIsReady) {
                $(window).trigger("resize");
                $scope.chartIsReady=true;    
            };
                        
        };
        $scope.showImg=function(url){
            window.open(url,'_blank');
        }
        $scope.getImgFromCanvas=function(el){
            var container = document.getElementById(el)
            var canvas=container.childNodes[0];
            var canvas1=container.childNodes[1];
            var canvas2=container.childNodes[2];
            var canvas3=container.childNodes[3];
            var ctx = canvas.getContext('2d');
                ctx.drawImage(canvas1, 0, 0);
                ctx.drawImage(canvas2, 0, 0);
                ctx.drawImage(canvas3, 0, 0);
            var dataUrl=canvas.toDataURL();
            console.log('dataUrl ');
            console.log(dataUrl);
            window.open(dataUrl,'_blank');
        }
    
    $scope.leadByOwnerChart = {
      "type": "BarChart",
      "cssStyle": "width:100%",
      "displayed": true,
      "data": $scope.dataForLeadsOwner,
      "options": {
            bar: {groupWidth: "35%"},
            height: 500,
            vAxis: {title: 'Owner',  titleTextStyle: {color: 'red'}},
            chartArea:{top:20,left:150,height:"85%" ,width:"85%"},
            legend: { position: "none" }
      },
      "formatters": {},
      "view": {}
    }
    $scope.getPosition= function(index){
        if(index<4){
         
          return index+1;
        }else{
          return (index%4)+1;
        }
     };
    // Google+ Authentication 
    Auth.init($scope);
     
     
}]);

