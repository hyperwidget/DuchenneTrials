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

  function linkFunc() {
    var $sidebar = $("#search"),
      $window = $(window),
      offset = $sidebar.offset(),
      topPadding = 0;


    $window.scroll(function () {
      if ($window.scrollTop() > 115 && $window.width() > 991) {
        $sidebar.css({
          marginTop: $window.scrollTop() - 115 + topPadding
        });
      } else {
        $sidebar.css({
          marginTop: 0
        });
      }
    });
  }

  MainCtrl.$inject = ['$http'];

  function MainCtrl($http) {
    var vm = this;

    vm.thing = {};
    vm.searchParams = {
      page: 1,
      limit: 10
    };
    vm.status = '';
    vm.startIndex = 1;
    vm.endIndex = 20;

    vm.getThings = function () {
      $http.get('/api/trials', {
        params: vm.searchParams
      })
        .then(function (response) {
          vm.trialsList = vm.trialsList.concat(response.data.trials);
          vm.total = response.data.total;
          vm.endIndex = vm.trialsList.length;
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
