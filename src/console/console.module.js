(function(){
    "use strict";

    angular.module("console", ['httpRequest'])

    .service('consoleService', ['HttpRequestService', '$httpParamSerializer', '$log', 
    function(httpRequest, $httpParamSerializer, $log){

        return {

            loadScripts: function(){
                return httpRequest.request({
                    url: "/pmis/STND_PMIS/test/console/scripts.json.jsp"
                }).then(function( response ){
                    return response.data;
                });
            },

            loadScript: function(filename){
                return httpRequest.request({
                    url: "/pmis/STND_PMIS/test/console/example/" + filename
                }).then(function( response ){
                    $log.log(response.data);
                    return response.data;
                });
            },

            executeScript: function(script){
                return httpRequest.request({
                    url: "/Test/Console/execute.action",
                    data: $httpParamSerializer({
                        "script.body" : script,
                        "__RESPONSE_TYPE__": "json"
                    }),
                    method: "POST",
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded'
                    }
                }).then(function( response ){
                    return response.data.log;
                });
            }

        };

    }])

    .component('console', {
        templateUrl: 'console/console.html',
        controller: ["$log", '$scope', '$routeParams', 'consoleService', function($log, $scope, $routeParams, consoleService){
            var $ctrl = this;

            // create the codemirror editor
            angular.bind(this, withEditor, $scope)();

            // $scope.$watch(function(){
            //     return $ctrl.script;
            // }, function(nvalue, ovalue){
            //     nvalue && consoleService.loadScript(nvalue)
            //     .then(function(script){
            //         $ctrl.code = script;
            //     });
            // });

            $ctrl.execute = function(){
                consoleService.executeScript($ctrl.code)
                .then(function(result){
                    $ctrl.result = result;
                });
            }

            $ctrl.loadScript = function(script){
                $ctrl.script = script;
                consoleService.loadScript(script).then(function(data){
                    $ctrl.code = data;
                });
            }

            consoleService.loadScripts()
            .then(function(scripts){
                $log.log(scripts);
                $ctrl.scripts = scripts;
            });
            
            $ctrl.loadScript($routeParams.script);
            
        }]
    });

    var withEditor = function($scope){
        // this is the controller
        var $ctrl = this;

        var scriptEl = angular.element('#code');
        var editor = CodeMirror.fromTextArea(scriptEl[0], {
            mode : {
                name : "python",
                version : 2,
                singleLineStringErrors : false
            },
            lineNumbers : true,
            indentUnit : 4,
            tabMode : "shift",
            matchBrackets : true
        });
        editor.on('change', function(){
            $ctrl.code = editor.getValue();
        });
        $scope.$watch(function(){
            return $ctrl.code;
        }, function(nvalue){
            nvalue && editor.setValue(nvalue);
        });
    }

})();