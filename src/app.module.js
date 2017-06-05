(function(){
    "use strict";

    var app = angular.module("app", ['ngRoute', 'console']);

    app.config(['$locationProvider', '$routeProvider',
        function config($locationProvider, $routeProvider) {
        $locationProvider.hashPrefix('!');

        $routeProvider.
            when('/', {
                template: '<console></console>'
            }).
            when('/console/:script', {
                template: '<console></console>'
            }).
            otherwise('/');
        }
    ]);
    
    app.controller("AppController", ['$log', function($log){
        var $ctrl = this;
        
        // init for top menu
        $ctrl.menu = '1';

    }]);

})();