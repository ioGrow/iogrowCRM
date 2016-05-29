
var lunchMapsLinkedin=function(address){
        var p=$("#newAccMain");
        var offsets = document.getElementById('newAccMain').getBoundingClientRect();
        var top = offsets.top + 118;
        var left = offsets.left;
        var width = document.getElementById('newAccMain').offsetWidth;
        var height = document.getElementById('newAccMain').offsetHeight;
        window.open('http://www.google.com/maps/search/'+address,'winname','width='+width+',height=500, left='+left+',top='+top);
 }
 var lunchMaps=function(lat,lng,address){
                    var p=$("#newAccMain");
                    var offsets = document.getElementById('newAccMain').getBoundingClientRect();
                    var top = offsets.top + 118;
                    var left = offsets.left;
                    var width = document.getElementById('newAccMain').offsetWidth;
                    var height = document.getElementById('newAccMain').offsetHeight;
              if (lat&&lng) {
                window.open('http://www.google.com/maps/place/'+lat+','+lng,'winname','width='+width+',height=500, left='+left+',top='+top);
              }else{
                 var locality=address.formatted || address.street+' '+address.city+' '+address.state+' '+address.country;
                 window.open('http://www.google.com/maps/search/'+locality,'winname','width='+width+',height=500, left='+left+',top='+top);
              };
}
app.directive('edittooltip',  function() {
   return {
    restrict: 'A',
    require:'?ngModel',
    link: function ($scope, elem, attrs,ngModel) {
     var field=$(elem);
     field.popover({
          html: true,
          placement: 'auto',
          delay: {show: 50, hide: 400},
          trigger:'click hover',
          content: '<div class="customTip"><span id="inlineDeleteElement" ><i class="fa fa-trash-o"></i></span><span  id="inlineEditElement">edit</span></div>'
      }).parent().on('click', '#inlineEditElement', function() {
          var item=field.attr('e-form');
          $scope[item].$show();
      }).on('click', '#inlineDeleteElement', function() {
          $scope.beforedeleteInfonde();
      });
  }
}});
app.directive('ngBlur', ['$parse', function($parse) {
  return function(scope, element, attr) {
    var fn = $parse(attr['ngBlur']);
    element.bind('blur', function(event) {
      scope.$apply(function() {
        fn(scope, {$event:event});
      });
    });
  }
}]);
app.directive('ngEnter', ['$parse', function($parse) {
  return function(scope, element, attr) {
    var fn = $parse(attr['ngEnter']);
    element.bind("keydown keypress", function(event) {
       if(event.which === 13) {
          scope.$apply(function() {
            fn(scope, {$event:event});
          });
       }
    });
  }
}]);
app.directive("checkboxGroup", function() {
        return {
            restrict: "A",
            link: function(scope, elem, attrs) {
                // Determine initial checked boxes
                if (scope.array.indexOf(scope.item.id) !== -1) {
                    elem[0].checked = true;
                }

                // Update array on click
                elem.bind('click', function() {
                    var index = scope.array.indexOf(scope.item.id);
                    // Add if checked
                    if (elem[0].checked) {
                        if (index === -1) scope.array.push(scope.item.id);
                    }
                    // Remove if unchecked
                    else {
                        if (index !== -1) scope.array.splice(index, 1);
                    }
                    // Sort and update DOM display
                    scope.$apply(scope.array.sort(function(a, b) {
                        return a - b
                    }));
                });
            }
        }
    });
app.directive('errSrc', function() {
  return {
    link: function(scope, element, attrs) {
      element.bind('error', function() {
        if (attrs.src != attrs.errSrc) {
          attrs.$set('src', attrs.errSrc);
        }
      });
    }
  }
});

app.directive('currency',  function() {
  return {
    restrict: 'A',
    require:'?ngModel',
    link: function ($scope, elem, attrs,ngModel) {

        var all_currency=[
                  {"value":"USD" , "symbol":"$"},
                  {"value":"EUR", "symbol":"€"},
                  {"value":"CAD", "symbol":"$"},
                  {"value":"GBP", "symbol":"£"},
                  {"value":"AUD", "symbol":"$"},
                  {"value":"", "symbol":""},
                  {"value":"AED", "symbol":"د.إ"},
                  {"value":"ANG", "symbol":"ƒ"},
                  {"value":"AOA", "symbol":"AOA"},
                  {"value":"ARS", "symbol":"$"},
                  {"value":"BAM", "symbol":"KM"},
                  {"value":"BBD", "symbol":"$"},
                  {"value":"BGL", "symbol":"лв"},
                  {"value":"BHD", "symbol":"BD"},
                  {"value":"BND", "symbol":"$"},
                  {"value":"BRL", "symbol":"R$"},
                  {"value":"BTC", "symbol":"฿"},
                  {"value":"CHF", "symbol":"Fr"},
                  {"value":"CLF", "symbol":"UF"},
                  {"value":"CLP", "symbol":"$"},
                  {"value":"CNY", "symbol":"¥"},
                  {"value":"COP", "symbol":"$"},
                  {"value":"CRC", "symbol":"₡"},
                  {"value":"CZK", "symbol":"Kč"},
                  {"value":"DKK", "symbol":"kr"},
                  {"value":"EEK", "symbol":"KR"},
                  {"value":"EGP", "symbol":"E£"},
                  {"value":"FJD", "symbol":"FJ$"},
                  {"value":"GTQ", "symbol":"Q"},
                  {"value":"HKD", "symbol":"$"},
                  {"value":"HRK", "symbol":"kn"},
                  {"value":"HUF", "symbol":"Ft"},
                  {"value":"IDR", "symbol":"Rp"},
                  {"value":"ILS", "symbol":"₪"},
                  {"value":"INR", "symbol":"₨"},
                  {"value":"IRR", "symbol":"ریال"},
                  {"value":"ISK", "symbol":"kr"},
                  {"value":"JOD", "symbol":"د.ا"},
                  {"value":"JPY", "symbol":"¥"},
                  {"value":"KES", "symbol":"KSh"},
                  {"value":"KRW", "symbol":"₩"},
                  {"value":"KWD", "symbol":"KD"},
                  {"value":"KYD", "symbol":"$"},
                  {"value":"LTL", "symbol":"Lt"},
                  {"value":"LVL", "symbol":"Ls"},
                  {"value":"MAD", "symbol":"د.م."},
                  {"value":"MVR", "symbol":"Rf"},
                  {"value":"MXN", "symbol":"$"},
                  {"value":"MYR", "symbol":"RM"},
                  {"value":"NGN", "symbol":"₦"},
                  {"value":"NOK", "symbol":"kr"},
                  {"value":"NZD", "symbol":"$"},
                  {"value":"OMR", "symbol":"ر.ع"},
                  {"value":"PEN", "symbol":"S/."},
                  {"value":"PHP", "symbol":"₱"},
                  {"value":"PLN", "symbol":"zł"},
                  {"value":"QAR", "symbol":"ر.ق"},
                  {"value":"RON", "symbol":"L"},
                  {"value":"RUB", "symbol":"руб."},
                  {"value":"SAR", "symbol":"ر.س"},
                  {"value":"SEK", "symbol":"kr"},
                  {"value":"SGD", "symbol":"$"},
                  {"value":"THB", "symbol":"฿"},
                  {"value":"TRY", "symbol":"TL"},
                  {"value":"TTD", "symbol":"$"},
                  {"value":"TWD", "symbol":"$"},
                  {"value":"UAH", "symbol":"₴"},
                  {"value":"VEF", "symbol":"Bs F"},
                  {"value":"VND", "symbol":"₫"},
                  {"value":"XCD", "symbol":"$"},
                  {"value":"ZAR", "symbol":"R"}];
          $.each(all_currency, function (i, item) {
            $(elem).append('<option value='+item.value+'>'+item.symbol+ " - "+item.value+'</option>');
          });

     }
}});
app.directive('amount', function() {
    return {
      restrict: 'A',
      require:'?ngModel',
      link: function ($scope, elem, attrs,ngModel) {
        var field=$(elem);
        field.blur(function() {
         var value=$(this).val();
          if (value!='') {
            var num=toffloat(value,'.', ',')
          $(this).val(toFormat(num,2, 3,'.', ','));
          };
        });
        function toffloat(stringVar,s, c) {
            var regex1 = new RegExp('\\'+s+'', "g");
            var regex1 = new RegExp('\\'+c+'', "g");
            stringVar=stringVar.replace(regex1, '');
            stringVar=stringVar.replace(regex1, '\.');
            return parseFloat(stringVar);
         }
        function toFormat(floatNum,n, x, s, c) {
           var re = '\\d(?=(\\d{' + (x || 3) + '})+' + (n > 0 ? '\\D' : '$') + ')',
              num = floatNum.toFixed(Math.max(0, ~~n));
          
          return (c ? num.replace('.', c) : num).replace(new RegExp(re, 'g'), '$&' + (s || ','));
         }
      }
 }
});
app.directive('ngDrag', ['$parse', function($parse) {
  return function(scope, element, attr) {
    var fn = $parse(attr['ngDrag']);
    element.bind('drag', function(event) {
      scope.$apply(function() {
        fn(scope, {$event:event});
      });
    });
  }
}]);
app.directive('ngDrop', ['$parse', function($parse) {
  return function(scope, element, attr) {
    var fn = $parse(attr['ngDrop']);
    element.bind('drop', function(event) {
      scope.$apply(function() {
        fn(scope, {$event:event});
      });
    });
  }
}]);
app.directive('draggable', function() {
   return function(scope, element) {
        // this gives us the native JS object
        var el = element[0];

        el.draggable = true;

        el.addEventListener(
            'dragstart',
            function(e) {
                e.dataTransfer.effectAllowed = 'move';
                e.dataTransfer.setData('Text', this.id);
                this.classList.add('drag');
                return false;
            },
            false
        );

        el.addEventListener(
            'dragend',
            function(e) {
                this.classList.remove('drag');
                return false;
            },
            false
        );
        el.addEventListener(
            'drop',
            function(e) {
                // Stops some browsers from redirecting.
                if (e.stopPropagation) e.stopPropagation();

                this.classList.remove('over');

                return false;
            },
            false
        );
    }
});

app.directive('droppable', function() {
    return function(scope, element) {
        var el = element[0];
        el.addEventListener(
            'dragover',
            function(e) { 
                e.dataTransfer.dropEffect = 'move';
                // allows us to drop
                if (e.preventDefault) e.preventDefault();
                e.stopPropagation();
                this.classList.add('over');
                $(this).parent().removeAttr("droppable");
                return false;
            },
            false
        );
        el.addEventListener(
            'dragenter',
            function(e) {
                this.classList.add('over');
                $(this).parent().removeAttr("droppable");
                return false;
            },
            false
        );

        el.addEventListener(
            'dragleave',
            function(e) {
                this.classList.remove('over');
                $(this).parent().addAttr("droppable");
                return false;
            },
            false
        );
        el.addEventListener(
            'drop',
            function(e) {
                // Stops some browsers from redirecting.
                if (e.stopPropagation) e.stopPropagation();

                this.classList.remove('over');
                return false;
            },
            false
        );
    }
});
app.directive('searchresult', function($compile) {
      return {
      restrict: 'A',
      require:'?ngModel',
       link: function($scope, element, attrs,ngModel) {
        var resultsName=attrs.results;
        var items=$scope[resultsName];
        var index= parseInt(attrs.resultindex);
        var item=items[index];
        var  el= "";
        var elmnt=$(element);
          switch(item.type) {
            case 'Case':
                el='<li class="linkedinListItem withoutimgitem"><div class="pic"><i class="fa fa-suitcase"></i></div><div class="text"><ul class="list-group linkedinItemDetails"><li class="likedinItemName"><a href="/#/cases/show/'+item.id+'">'+item.title+'</a></li><!--<li class="likedinItemType"><i class="fa fa-user"></i>Elon Musk</li><li class="likedinItemAddress"><i class="fa fa-building"></i>Tesla Motors</li>--><li class="likedinType"><span class="pull-right">Case</span></li></ul></div><div class="clearfix"></div></li>'
                $(elmnt).append(el);  
                break;
            case 'Contact':
                 el='<div class="item-content"><div class="pic"><img src="/static/src/img/avatar_contact.jpg" ></div><div class="text"><ul class="list-group linkedinItemDetails"><li class="likedinItemName"><a href="/#/contacts/show/'+item.id+'">'+item.title+'</a></li><!--<li class="likedinItemType">Customer Development &amp; Secret History, Teaching </li><li class="likedinItemAddress"><i class="fa fa-building"></i>Stanford, Berkeley and Columbia</li>--><li class="likedinType"><span class="pull-right">Contact</span></li></ul></div><div class="clearfix"></div></div>';
                $(elmnt).append(el); 
                break;
            case 'Lead':
                 el='<div class="item-content"><div class="pic"><img src="/static/src/img/avatar_contact.jpg" ></div><div class="text"><ul class="list-group linkedinItemDetails"><li class="likedinItemName"><a href="/#/leads/show/'+item.id+'">'+item.title+'</a></li><!--<li class="likedinItemType">Customer Development &amp; Secret History, Teaching </li><li class="likedinItemAddress"><i class="fa fa-building"></i>Stanford, Berkeley and Columbia</li>--><li class="likedinType"><span class="pull-right">Lead</span></li></ul></div><div class="clearfix"></div></div>';
                $(elmnt).append(el); 
                break;
            case 'Account':
                el='  <li class="linkedinListItem" ><div class="pic" ><img src="/static/src/img/default_company.png"></div><div class="text" ><ul class="list-group linkedinItemDetails" ><li class="likedinItemName" ><a href="/#/accounts/show/'+item.id+'">'+item.title+'</a></li><!--<li class="likedinItemType" >Logiciels informatiques</li><li class="likedinItemAddress" ><i class="fa fa-map-marker" ></i>Région de Seattle , États-Unis+ de 10 000 employés</li>--><li class="likedinType" ><span class="pull-right">Account</span></li></ul></div><div class="clearfix"></div></li>'
                $(elmnt).append(el);
                break;
            case 'Task':
                 el='<li class="linkedinListItem withoutimgitem"><div class="pic"><i class="fa fa-check"></i></div><div class="text"><ul class="list-group linkedinItemDetails" ><li class="likedinItemName"><a href="/#/tasks/show/'+item.id+'">'+item.title+'</a></li><!--<li class="likedinItemType" ><i class="fa fa-user" ></i>Tedj, Yacine, Hakim</li><li class="likedinItemAddress" ><i class="fa fa-calendar" ></i>May 27th, 2015</li>--><li class="likedinType" ><span class="pull-right">Task</span></li></ul></div><div class="clearfix"></div></li>'
                 $(elmnt).append(el);  
                break;
            case 'Event':
                el='<li class="linkedinListItem withoutimgitem" ><div class="pic" ><i class="fa fa-calendar"></i></div><div class="text" ><ul class="list-group linkedinItemDetails" ><li class="likedinItemName" ><a href="/#/events/show/'+item.id+'">'+item.title+'</a></li><!--<li class="likedinItemType" ><i class="fa fa-calendar" ></i> May 27th–29th, 2015 </li><li class="likedinItemAddress" ><i class="fa fa-map-marker" ></i>Amelia Island, FL</li>--><li class="likedinType" ><span class="pull-right">Event</span></li></ul></div><div class="clearfix"></div></li>'
                $(elmnt).append(el);  
                break;
             case 'Opportunity':
                 el='<li class="linkedinListItem withoutimgitem" ><div class="pic" ><i class="fa fa-money"></i></div><div class="text" ><ul class="list-group linkedinItemDetails" ><li class="likedinItemName" ><a href="/#/opportunities/show/'+item.id+'">'+item.title+'</a></li><!--<li class="likedinItemType" ><i class="fa fa-user" ></i>Satya Nadella</li><li class="likedinItemAddress" ><i class="fa fa-building" ></i>Microsoft</li>--><li class="likedinType" ><span class="pull-right">Opportunity</span></li></ul></div><div class="clearfix"></div></li>'
                 $(elmnt).append(el);  
                break;
          }
    }
  }
});
app.directive('editoptions', function($compile) {
      return {
      restrict: 'A',
      require:'?ngModel',
       link: function($scope, element, attrs,ngModel) {
        $scope.data=attrs.editdataattr;
        $scope.showVariable=attrs.editshow;
        var element=$(element).parent();
        if($scope.editshow == 'undefined'){
            $(element).mouseenter(function() {
              if($(element).prop("tagName")=='LI'){
                    $(element).find(".page-meta").remove();
                     var edit = $(element).find("a[editable-text]" );
                     var trigger=$(edit).attr("e-form"); 
                    
                     var el = $compile('<span class="page-meta"><a  ng-hide="'+trigger+'.$visible" '+'ng-click="'+trigger+'.$show()'+'" class="btn-link addAnotherPhone"><i class="fa fa-pencil"></i></a></span>')($scope);
                     $(element).append(el);          
                      var el = $compile('<span class="page-meta"><a ng-hide="'+trigger+'.$visible" '+'ng-click="'+$scope.data+'"  class="btn-link addAnotherPhone"><i class="fa fa-trash-o"></i></a></span>')($scope);
                      $(element).append(el); 
               }
            });
             $(element).mouseleave(function() {
         
                  if($(element).prop("tagName")=='LI'){
                    $(element).find(".page-meta").remove();
                  }
            });
        }else{
          if($(element).prop("tagName")=='LI'){
                    $(element).find(".page-meta").remove();
                     var edit = $(element).find("a[editable-text]" );
                     var trigger=$(edit).attr("e-form"); 
                    
                     var el = $compile('<span class="page-meta"><a  ng-show="'+$scope.showVariable +'" ng-click="'+trigger+'.$show()'+'" class="btn-link addAnotherPhone"><i class="fa fa-pencil"></i></a></span>')($scope);
                     $(element).append(el);          
                      var el = $compile('<span class="page-meta"><a ng-show="'+$scope.showVariable +'" ng-click="'+$scope.data+'"  class="btn-link addAnotherPhone"><i class="fa fa-trash-o"></i></a></span>')($scope);
                      $(element).append(el); 
               }
        };
        
    }
  }
});
app.directive('cdatetimepicker', function($parse) {
      return {
      restrict: 'A',
      require:'?ngModel',
       link: function($scope, element, attrs,ngModel) {
        var dp = $(element);
        var params={
         lang:'de',
         i18n:{
          de:{
           months:[
            'Januar','Februar','März','April',
            'Mai','Juni','Juli','August',
            'September','Oktober','November','Dezember',
           ],
           dayOfWeek:[
            "So.", "Mo", "Di", "Mi", 
            "Do", "Fr", "Sa.",
           ]
          }
         },
         step:5,      
        format:'m/d/Y h:i a',
        formatTime:'g:i A',
        onChangeDateTime:function(current_time,$input){
              model.assign($scope,current_time);
                         $scope.$apply();

        } 
  
        };
        var model = $parse(attrs.model);
         dp.datetimepicker(params);

       dp.val(null);
       $scope.$watch(attrs.model, function(newValue, oldValue) {
              if (newValue==null) {
                dp.val(null);
              };
        });
    }
  }
});
app.directive('gototext', function($parse) {
      return {
      restrict: 'A',
      require:'ngModel',
      link: function($scope, element, attrs,ngModel) {
          var limit = 100;
          var model = $(element).text();
          var ellipsestext = "...";
          if (model!=null) {
              if(model.length > limit) {
              var shortText = model.substr(0, limit);
              var h = model.substr(limit-1, model.length - limit);
              var cont = shortText + '<span class="moreelipses less">'+ellipsestext+'</span>&nbsp;<span class="morecontent more">' + h + '</span>&nbsp;&nbsp;<span><a href="" class="morelink">'+moretext+'</a></span>';
              $(element).html(cont);
            }
            $(".morelink").click(function(){
              if($(".morelink").hasClass("less")) {
                $(this).removeClass("less");
                $(".morecontent").removeClass("less");
                $(".morecontent").addClass("more");
                $(".moreelipses").addClass("less");
                $(".moreelipses").removeClass("more");
                $(this).html(moretext);
              } else {
                $(this).addClass("less");        
                $(".moreelipses").addClass("more");
                $(".moreelipses").removeClass("less");
                $(".morecontent").removeClass("more");
                $(".morecontent").addClass("less");
                $(this).html(lesstext);
              }
              return false;
            });
          };
          
    }
  }
});
app.directive('taggable', ['$parse',function($parse) {
    return {
      restrict: 'A',
      require:'?ngModel',
      template: '<input typeahead="tag as tag.name  for tag in getSearchResult($viewValue) | filter:getSearchText($viewValue) | limitTo:8" typeahead-on-select="selectItem(<%=modelName%>)"/>',
      replace: true,

      link: function ($scope, elem, attrs,ngModel) {
        $scope.modelName=attrs.ngModel;
        $scope.attribute='name';
        $scope.currentAttribute='name';
        $scope.objectName='user';
        $scope.tagInfo=$scope[attrs.taggabledata];
        $scope.newTaskValue=null;
        function ReturnWord(text, caretPos) {
              var preText =text, posText =text, wordsBefore=[], wordsAfter=[], pre='', post='';
                preText = preText.substring(0, caretPos);
                wordsBefore= preText.split(" ");
                pre = wordsBefore[wordsBefore.length - 1]; 
                posText = posText.substring(caretPos);
                wordsAfter = posText.split(" ");
                post = wordsAfter[0];
                wordsBefore.splice(wordsBefore.length - 1,1);
                wordsAfter.splice(0,1);
              return {
                before:wordsBefore.join(' '),
                after:wordsAfter.join(' '),
                word:pre+post
              }
          }
        $scope.getSearchText=function(value){
                $scope.pattern=null;
                $scope.newTaskText=$(elem).val();
                $scope.newTaskValue=ReturnWord($(elem).val(),$(elem).caret()).word;
                $scope.matchPattern=false;
                $scope.returnedValue=undefined;
                
                angular.forEach($scope.tagInfo, function(item){
                     if (item.tag=='#') {$scope.pattern = /^#([\w]*)/;}
                     if (item.tag=='@') {$scope.pattern = /^@([\w]*)/;};
                     if (item.tag=='!') {$scope.pattern = /^!([\w]*)/;};
                     var text=$scope.newTaskValue;

                     if($scope.pattern.test($scope.newTaskValue)){
                          $scope.returnedValue = text.replace($scope.pattern, "$1");
                          $scope.matchPattern=true;
                        }else{
                          console.log('not matchPattern');
                        }
                    });
                if ($scope.matchPattern) {
                  return $scope.returnedValue;
                }else{
                  return null;
                };  
            }
          $scope.getSearchResult=function(value){
               
                if($scope.getSearchText(value)!=null){
                  var text= ReturnWord($(elem).val(),$(elem).caret()).word;
                  var tag= text.substring(0,1);
                  $scope.datar={};
                  angular.forEach($scope.tagInfo, function(item){
                    if (item.tag==tag) {
                      $scope.data=$scope[item.data.name];
                      $scope.currentAttribute=item.data.attribute;
                      $scope.datar=$scope.data;
                          angular.forEach($scope.datar, function(itm){
                          if (!itm.hasOwnProperty('name')) {
                                    itm.name = itm[$scope.currentAttribute];
                                }
                          }); 
                          $scope.objectName=item.data.name;
                      };
                    });
                  return $scope.datar;
                  }else{
                     return [];
                  }
          }
        $scope.selectItem = function(value){
          angular.forEach($scope.tagInfo, function(item){
              if (item.data.name==$scope.objectName) {
                  if ($scope.currentAttribute!='name') {
                      delete value["value"];
                  };
                  if (item.selected.indexOf(value) == -1) {
                   item.selected.push(value);
                   }
                  var text= ReturnWord($(elem).val(),$(elem).caret()).word;
                  var beforeText= ReturnWord($(elem).val(),$(elem).caret()).before;
                  var afterText= ReturnWord($(elem).val(),$(elem).caret()).after;
                  var tag= text.substring(0,1);
                  $parse(attrs.ngModel).assign($scope, beforeText+' '+tag+value[item.data.attribute]+' '+afterText);
              };
           });
           
         };

      }
  }
}]);
app.directive('fittext', function($timeout) {
  'use strict';

  return {
    scope: {
      minFontSize: '@',
      maxFontSize: '@',
      fontt: '@',
      text: '@',
      firstname: '=',
      lastname: '=',
    },
    restrict: 'C',
    transclude: true,
    template: '<span ng-transclude class="textContainer" ng-bind="text"></span>',
    controller: function($scope, $element, $attrs) {
      var maxFontSize = $scope.maxFontSize || 50;
      var minFontSize = $scope.minFontSize || 8;
      // text container
      var textContainer = $element[0].querySelector('.textContainer');

      // max dimensions for text container
      var maxHeight = $element[0].offsetHeight;
      var maxWidth = $element[0].offsetWidth;

      var textContainerHeight;
      var textContainerWidth;
      var fontSize = maxFontSize;

      var resizeText = function(){
        $timeout(function(){
          // set new font size and determine resulting dimensions
          textContainer.style.fontSize = fontSize + 'px';
          textContainerHeight = textContainer.offsetHeight;
          textContainerWidth = textContainer.offsetWidth;

          if((textContainerHeight > maxHeight || textContainerWidth > maxWidth) && fontSize > minFontSize){

            // shrink font size
            var ratioHeight = Math.floor(textContainerHeight / maxHeight);
            var ratioWidth = Math.floor(textContainerWidth / maxWidth);
            var shrinkFactor = ratioHeight > ratioWidth ? ratioHeight : ratioWidth;
            fontSize -= shrinkFactor;
            resizeText();
          }
        }, 0);
      };

      // watch for changes to text
      $scope.$watch('text', function(newText, oldText){
        if(newText === undefined) return;

        // text was deleted
        if(oldText !== undefined && newText.length < oldText.length){
          fontSize = maxFontSize;
        }
        resizeText();
      });
    }
  };
});

app.directive('parseUrl', function () {
    var urlPattern = /(http|ftp|https):\/\/[\w-]+(\.[\w-]+)+([\w.,@?^=%&amp;:\/~+#-]*[\w@?^=%&amp;\/~+#-])?/gi;
    return {
        restrict: 'A',
        require: 'ngModel',
        replace: true,
        scope: {
            props: '=parseUrl',
            ngModel: '=ngModel'
        },
        link: function compile(scope, element, attrs, controller) {
            scope.$watch('ngModel', function (value) {
                var match = urlPattern.exec(value);
                var test0=match[0];
                var html = value.replace(urlPattern, '<a target="' + scope.props.target + '" href="$&">$&</a>') + " | " + scope.props.otherProp;
                element.html(html);
            });
        }
    };
});
app.directive('stopEvent', function () {
        return {
            restrict: 'A',
            link: function (scope, element, attr) {
                element.bind(attr.stopEvent, function (e) {
                    e.stopPropagation();
                });
            }
        };
     });