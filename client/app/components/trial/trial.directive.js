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
      $window = $(window),
      offset = $eligibility.offset(),
      topPadding = 0;


    $window.scroll(function () {
      if ($window.scrollTop() > 115 && $window.width() > 991) {
        $eligibility.css({
          marginTop: $window.scrollTop() - 115 + topPadding
        });
      } else {
        $eligibility.css({
          marginTop: 0
        });
      }
    });
  }

  TrialCtrl.$inject = ['$http', '$state', '$anchorScroll', '$location'];

  function TrialCtrl($http, $state, $anchorScroll, $location) {
    var vm = this;

    vm.getThing = function () {
      $http.get('/api/trials/' + $state.params.trialId)
        .then(function (response) {
          vm.trial = response.data;
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
  }
})();
