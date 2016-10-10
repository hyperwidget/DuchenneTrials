(function() {
  'use strict';

  angular
    .module('app')
    .config(routes);

  routes.$inject = ['$stateProvider', '$urlRouterProvider'];

  function routes($stateProvider, $urlRouterProvider) {

    $stateProvider.state('home', {
      url: '/?page&limit&location&search&age&study_vals',
      reloadOnSearch: false,
      template: '<main></main>'
    });

    $stateProvider.state('trial', {
      url: '/{trialId}',
      template: '<trial></trial>',
      reloadOnSearch: false
    });

    $urlRouterProvider.otherwise('/');
  }
})();
