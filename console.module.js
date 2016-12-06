(function(){
    "use strict";

    angular.module("console", ['httpRequest'])

    .service('ConsoleService', ['HttpRequestService', '$httpParamSerializer', '$log', 
    function(httpRequest, $httpParamSerializer, $log){

        return {

            loadScripts: function(){
                return httpRequest.request({
                    url: "/pmis/STND_PMIS/test/console/scripts.json.jsp"
                }).then(function( response ){
                    return response.data;
                });
            },

            execute: function(script){
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
        templateUrl: 'console.html',
        controller: ["$log", 'ConsoleService', function($log, consoleService){
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

            $ctrl.execute = function(){
                consoleService.execute(editor.getValue()).then(function(result){
                    $ctrl.result = result;
                });
            }

            consoleService.loadScripts().then(function(scripts){
                $log.log(scripts);
                $ctrl.scripts = scripts;
            });
        }]
    });

})();