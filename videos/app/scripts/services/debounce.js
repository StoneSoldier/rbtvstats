'use strict';

/**
 * @ngdoc service
 * @name rbtvCrawlerApp.debounce
 * @description
 * # debounce
 * Service in the rbtvCrawlerApp.
 */
app.service('DebounceSrv', function($rootScope, $timeout) {
    return function() {
        var timeout = null;

        return function(func, delay) {
            delay = delay || 2000;

            if (typeof(func) !== 'function') {
                return;
            }

            if ($timeout.cancel(timeout)) {
                $rootScope.debounceCount--;
            }

            $rootScope.debounceCount++;

            timeout = $timeout(function() {
                $rootScope.debounceCount--;
                timeout = null;
                func();
            }, delay);
        }
    };
});
