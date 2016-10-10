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
        bindToController: true,
        link: linkFunc
      };
    });

  function linkFunc(scope) {
    var $sidebar = $("#search"),
      $window = $(window),
      offset = $sidebar.offset(),
      topPadding = 0;


    $window.scroll(function () {
      if ($window.scrollTop() > 115 && $window.width() > 991 && scope.mainVm.trialsList && scope.mainVm.trialsList.length > 3) {
        $sidebar.addClass('affix');
        $sidebar.removeClass('affix-top');
      } else {
        $sidebar.addClass('affix-top');
        $sidebar.removeClass('affix');
      }
    });
  }

  MainCtrl.$inject = ['$http', '$state', '$stateParams'];

  function MainCtrl($http, $state, $stateParams) {
    var vm = this;

    vm.thing = {};
    vm.searchParams = {
      page: 1,
      limit: 10
    };
    vm.status = '';
    vm.startIndex = 1;
    vm.endIndex = 20;

    if ($stateParams.location) {
      vm.searchParams.location = $stateParams.location;
    }

    if ($stateParams.age) {
      vm.searchParams.age = $stateParams.age;
    }

    if ($stateParams.search) {
      vm.searchParams.search = $stateParams.search;
    }

    if ($stateParams.study_vals) {
      vm.searchParams.study_type = {};
      if (angular.isArray($stateParams.study_vals)) {
        angular.forEach($stateParams.study_vals, function (val) {
          vm.searchParams.study_type[val] = true;
        })
      } else {
        vm.searchParams.study_type[$stateParams.study_vals] = true;
      }
    }

    vm.removeSearchParam = function(index, val){

      if(!val){
        delete vm.searchParams[index];
      } else {
        delete vm.searchParams.study_type[val];
      }
      
      vm.search();
    }

    vm.getThings = function () {
      vm.searchParams.study_vals = [];
      for (var param in vm.searchParams.study_type) {
        if (vm.searchParams.study_type[param]) {
          vm.searchParams.study_vals.push(param);
        }
      };

      $state.transitionTo('home', vm.searchParams);
      $http.get('/api/trials', {
        params: vm.searchParams
      })
        .then(function (response) {
          vm.trialsList = vm.trialsList.concat(response.data.trials);
          vm.total = response.data.total;
          vm.endIndex = vm.trialsList.length;
          vm.lastSearch = angular.copy(vm.searchParams);
        });
    };
    vm.getThings();

    vm.loadMore = function () {
      vm.searchParams.page++;
      vm.getThings();
    }

    vm.search = function () {
      vm.page = 0;
      vm.clearTrials();
      vm.resetPaging();
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

    vm.resetPaging = function () {
      vm.searchParams.page = 1;
    }

    vm.clearTrials();

  }
})();
