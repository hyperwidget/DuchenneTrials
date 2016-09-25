(function () {
  'use strict';

  angular
    .module('app')
    .directive('main', function () {
      return {
        restrict: 'E',
        templateUrl: 'app/components/main/main.html',
        controller: MainCtrl,
        controllerAs: 'mainVm',
        bindToController: true
      };
    });

  MainCtrl.$inject = ['$http'];

  function MainCtrl($http) {
    var vm = this;

    vm.thing = {};
    vm.searchParams = {};
    vm.status = '';
    vm.page = 0;

    vm.getThings = function () {
      $http.get('/api/trials', {
        params: vm.searchParams
      })
        .then(function (response) {
          vm.trialsList = vm.trialsList.concat(response.data);
        });
    };
    vm.getThings();

    vm.search = function () {
      vm.page = 0;
      vm.clearTrials();
      vm.getThings();
    }

    vm.postThings = function () {
      vm.clearTrials();
      $http.post('/api/trials/refresh')
        .then(function () {
          vm.getThings();
        });
    };

    vm.clearTrials = function () {
      vm.trialsList = [];
    }
    vm.clearTrials();

  }
})();
