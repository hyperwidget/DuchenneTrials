(function () {
  'use strict';

  angular
    .module('app', ['ngAnimate', 'ngCookies', 'ngTouch', 'ngSanitize', 'ui.router', 'pascalprecht.translate', 'tmh.dynamicLocale', 'appTemplates']);


  // angular
  //   .module('app')
  //   .filter('clean', function () {
  //     return function (input) {
  //       var cleaned = input;
  //       // cleaned = input.replace(/\/r\/ng  ', '')
  //       cleaned = input.replace(/\n|\r\n|\r\t/g, '');

  //       return cleaned
  //       // var i, c, txt = "";
  //       // for (i = 0; i < x.length; i++) {
  //       //   c = x[i];
  //       //   if (i % 2 == 0) {
  //       //     c = c.toUpperCase();
  //       //   }
  //       //   txt += c;
  //       // }
  //       // return txt;
  //     };
  //   });

})();
