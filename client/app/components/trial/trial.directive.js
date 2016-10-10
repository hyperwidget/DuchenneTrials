(function () {
  'use strict';

  angular
    .module('app')
    .directive('trial', function () {
      return {
        restrict: 'E',
        templateUrl: 'app/components/trial/trial.html',
        controller: TrialCtrl,
        controllerAs: 'vm',
        bindToController: true,
        link: linkFunc
      };
    });

  function linkFunc() {
    var $eligibility = $("#eligibilityList"),
      $window = $(window);

    $window.scroll(function () {
      if ($window.scrollTop() > 115 && $window.width() > 991) {
        $eligibility.addClass('affix');
        $eligibility.removeClass('affix-top');
      } else {
        $eligibility.addClass('affix-top');
        $eligibility.removeClass('affix');
      }
    });
  }

  TrialCtrl.$inject = ['$http', '$state', '$anchorScroll', '$location'];

  function TrialCtrl($http, $state, $anchorScroll, $location) {
    var vm = this;
    vm.configThings = {};

    vm.getThing = function () {
      $http.get('/api/trials/' + $state.params.trialId)
        .then(function (response) {
          vm.trial = response.data;
          vm.configThings.locationIsArray = angular.isArray(vm.trial.location);
        });
    };
    vm.getThing();

    vm.goToAnchor = function (destination) {
      if ($location.hash() !== destination) {
        // set the $location.hash to `newHash` and
        // $anchorScroll will automatically scroll to it
        $location.hash(destination);
      } else {
        // call $anchorScroll() explicitly,
        // since $location.hash hasn't changed
        $anchorScroll();
      }
    };

    vm.isArray = angular.isArray;
  }
})();
