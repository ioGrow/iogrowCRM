app.controller('dashboardCtrl', ['$scope','Auth','Import',
    function($scope,Auth,Import) {
     $("ul.page-sidebar-menu li").removeClass("active");
     $("#id_Imports").addClass("active");
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

     $scope.chartIsReady=false;
     $scope.nbLeads=1349;
     $scope.alltarget=254620;
     $scope.frcstblePline=14725896;
     $scope.frcstblePlineByOwner=[];
     $scope.targetByOwner=[];
     $scope.leadsByOwner=[['Mohamed Amine',151],  ['Ilyes Boudjelthia',45], ['Tedj MEABIOU',78],['Hadji Hicham',69], ['Arezki Lebdiri',36], ['Ben Belfodil',78], ['Hakim Karriche',123], ['Yacine Hamidia',145], ['Karriche Hakim',96], ['Idriss Belamri',98], ['Meziane Hadjadj',79]],
     $scope.leadsBySource=[["Social media",71398],["email campaign",29449],["Call",37076]];
     // What to do after authentication
     $scope.runTheProcess = function(){

     };
     // We need to call this to refresh token when user credentials are invalid
     $scope.refreshToken = function() {
            Auth.refreshToken();
     };
     $scope.prepareDataForCharts=function(){
      
     };
    $scope.dataForLeadsSource=[["Source","Number"]];
    $scope.dataForLeadsSource=$scope.dataForLeadsSource.concat($scope.leadsBySource);
    $scope.dataForLeadsOwner=[['Owner', 'leads']];
    $scope.dataForLeadsOwner=$scope.dataForLeadsOwner.concat($scope.leadsByOwner);
     $scope.chartForLeadsSource={
          "type": "PieChart",
          "data": $scope.dataForLeadsSource,
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
      $scope.chartObject = {
      "type": "BarChart",
      "cssStyle": "width:100%",
      "displayed": true,
      "data": [
        ['Owner', 'Forcastable Pipline', 'Target'],
                ['Mohamed Amine',2654,789], 
                ['Ilyes Boudjelthia',456,1420], 
                ['Tedj MEABIOU',1254,236], 
                ['Hadji Hicham',2654,789], 
                ['Arezki Lebdiri',2654,789], 
                ['Ben Belfodil',785,789], 
                ['Hakim Karriche',741,250], 
                ['Yacine Hamidia',2540,1542], 
                ['Karriche Hakim',1258,789], 
                ['Idriss Belamri',789,789], 
                ['Meziane Hadjadj',1234,789]
      ],
      "options": {
            bar: {groupWidth: "35%"},
            height: 500,
            vAxis: {title: 'Owner',  titleTextStyle: {color: 'red'}},
            chartArea:{top:20,height:"85%"}
      },
      "formatters": {},
      "view":{'columns':[0, 1,
                        { calc: "stringify",
                         sourceColumn: 1,
                         type: "string",
                         role: "annotation" },2,
                         { calc: "stringify",
                         sourceColumn: 2,
                         type: "string",
                         role: "annotation" }]}
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

app.controller('ImportNewCtrl', ['$scope','Auth','Import',
    function($scope,Auth,Import) {
     $("ul.page-sidebar-menu li").removeClass("active");
     $("#id_Imports").addClass("active");
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

     // What to do after authentication
     $scope.runTheProcess = function(){
          var params = {'limit':7}
     };
     // We need to call this to refresh token when user credentials are invalid
     $scope.refreshToken = function() {
            Auth.refreshToken();
     };
    $scope.import=function(highrise){
     Import.highrise($scope,highrise);
    }
      
    
    // Google+ Authentication 
    Auth.init($scope);
     
     
}]);

