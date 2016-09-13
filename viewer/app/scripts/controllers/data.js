'use strict';

/**
 * @ngdoc function
 * @name rbtvstatsApp.controller:DataCtrl
 * @description
 * # DataCtrl
 * Controller of the rbtvstatsApp
 */
app.controller('DataCtrl', function($scope, $rootScope, $document, $q, $timeout, uuid4, StateSrv, DataSrv) {
    $scope.init = function() {
        $rootScope.state = {};
        $scope.loadingVideoData = true;
        $scope.loadingLiveData = true;
        $scope.videoMetadata = {};
        $scope.liveMetadata = {};
        $scope.videos = [];
        $scope.live = [];
        $scope.channels = [];
        $scope.shows = [];
        $scope.hosts = [];
        $scope.monthShortNames = ["Jan", "Feb", "Mär", "Apr", "Mai", "Jun", "Jul", "Aug", "Sep", "Okt", "Nov", "Dez"];
        $rootScope.alerts = [];

        $scope.$on("$routeChangeStart", function(event, next, current) {
            if (typeof current !== 'undefined') {
                if (typeof current.scope !== 'undefined') {
                    StateSrv.save(current.originalPath, current.scope.model);
                }
            }
        });

        $scope.update();
    };

    $scope.getType = function(obj) {
        if ($.isArray(obj)) {
            return 'array';
        } else {
            return typeof obj;
        }
    };

    $scope.findByKey = function(output, key) {
        for (var i = 0; i < output.length; i++) {
            if (output[i].key == key) {
                return output[i];
            }
        }

        var dataset = { key: key, value: [] };
        output.push(dataset);
        return dataset;
    };

    $scope.filterChannel = function(videos, channel) {
        var output = [];

        for (var i = 0; i < videos.length; i++) {
            var video = videos[i];

            if (video.channel == channel) {
                output.push(video);
            }
        }

        return output;
    };

    $scope.filterHost = function(videos, host) {
        var output = [];

        for (var i = 0; i < videos.length; i++) {
            var video = videos[i];

            if (video.hosts) {
                if (video.hosts.indexOf(host) > -1) {
                    output.push(video);
                }
            }
        }

        return output;
    };

    $scope.filterShow = function(videos, show) {
        var output = [];

        for (var i = 0; i < videos.length; i++) {
            var video = videos[i];

            if (video.shows) {
                if (video.shows.indexOf(show) > -1) {
                    output.push(video);
                }
            }
        }

        return output;
    };

    $scope.filterTime = function(videos, min, max) {
        var output = [];

        min = min || new Date();
        max = max || new Date();

        for (var i = 0; i < videos.length; i++) {
            var video = videos[i];
            var date = new Date(video.published * 1000);

            if (date > min && date < max) {
                output.push(video);
            }
        }

        return output;
    };

    $scope.groupChannel = function(videos) {
        var output = [];

        for (var i = 0; i < videos.length; i++) {
            var video = videos[i];
            var dataset = $scope.findByKey(output, video.channel);
            dataset.value.push(video);
        }

        return output;
    };

    $scope.groupMonthly = function(videos) {
        var output = [];

        var min = Number.MAX_VALUE;
        var max = 0;
        for (var i = 0; i < videos.length; i++) {
            var video = videos[i];
            if (video.published < min) {
                min = video.published;
            }
            if (video.published > max) {
                max = video.published;
            }
        }

        min = new Date(min * 1000);
        max = new Date(max * 1000);
        while (min < max) {
            var key = min.getFullYear() + '.' + ((min.getMonth() + 1 < 10) ? '0' : '') + (min.getMonth() + 1);
            $scope.findByKey(output, key);
            min.setMonth(min.getMonth() + 1);
        }

        for (var i = 0; i < videos.length; i++) {
            var video = videos[i];
            var date = new Date(video.published * 1000);
            var key = date.getFullYear() + '.' + ((date.getMonth() + 1 < 10) ? '0' : '') + (date.getMonth() + 1);
            var dataset = $scope.findByKey(output, key);
            dataset.value.push(video);
        }

        return output;
    };

    $scope.groupHosts = function(videos) {
        var output = [];

        for (var i = 0; i < videos.length; i++) {
            var video = videos[i];
            var hosts = video.hosts || [];
            for (var j = 0; j < hosts.length; j++) {
                var host = hosts[j];
                var dataset = $scope.findByKey(output, host);
                dataset.value.push(video);
            }
        }

        return output;
    };

    $scope.orderKey = function(a, b) {
        if (a.key < b.key)
            return -1;
        else if (a.key > b.key)
            return 1;
        else
            return 0;
    };

    $scope.orderValue = function(a, b) {
        if (a.value < b.value)
            return -1;
        else if (a.value > b.value)
            return 1;
        else
            return 0;
    };

    $scope.getAllShows = function(videos) {
        var allShows = [];

        for (var i = 0; i < videos.length; i++) {
            var shows = videos[i].shows || [];
            for (var k = 0; k < shows.length; k++) {
                var show = shows[k];
                if (show && allShows.indexOf(show) < 0) {
                    allShows.push(show);
                }
            }
        }

        allShows.sort();

        return allShows;
    };

    $scope.getAllHosts = function(videos) {
        var allHosts = [];

        for (var i = 0; i < videos.length; i++) {
            var hosts = videos[i].hosts || [];
            for (var k = 0; k < hosts.length; k++) {
                var host = hosts[k];
                if (host && allHosts.indexOf(host) < 0) {
                    allHosts.push(host);
                }
            }
        }

        allHosts.sort();

        return allHosts;
    };

    $scope.getAllChannels = function(videos) {
        var allChannels = [];

        for (var i = 0; i < videos.length; i++) {
            var channel = videos[i].channel;
            if (channel && allChannels.indexOf(channel) < 0) {
                allChannels.push(channel);
            }
        }

        allChannels.sort();

        return allChannels;
    };

    $scope.toList = function(array) {
        if ($.isArray(array)) {
            return array.join(", ");
        } else {
            return '';
        }
    };

    $scope.assignArray = function(array1, array2) {
        array1.length = 0;
        for (var i = 0; i < array2.length; i++) {
            array1.push(array2[i]);
        }
    };

    $rootScope.addAlert = function(alert) {
        alert.id = uuid4.generate();
        $rootScope.alerts.push(alert);
        $timeout($rootScope.closeAlert, 3000, true, alert.id)
    };

    $rootScope.closeAlert = function(id) {
        for (var i = 0; i < $rootScope.alerts.length; i++) {
            var alert = $rootScope.alerts[i];
            if (alert.id === id) {
                $rootScope.alerts.splice(i, 1);
            }
        }
    };

    $scope.update = function() {
        $scope.loadingVideoData = true;
        $scope.loadingLiveData = true;

        var promises = [];

        promises.push(DataSrv.getVideoData().then(function(data) {
            var videos = [];
            for (var key in data) {
                videos.push(data[key]);
            }

            $scope.assignArray($scope.videos, $scope.filterTime(videos, new Date(2015, 2, 3)));
            $scope.assignArray($scope.shows, $scope.getAllShows($scope.videos))
            $scope.assignArray($scope.hosts, $scope.getAllHosts($scope.videos));
            $scope.assignArray($scope.channels, $scope.getAllChannels($scope.videos));

            return DataSrv.getVideoMetadata().then(function(data) {
                $scope.videoMetadata = data;
                $scope.loadingVideoData = false;
            });
        }));

        promises.push(DataSrv.getLiveData().then(function(data) {
            var live = [];
            var lines = data.split('\n');
            for (var i = 0; i < lines.length; i++) {
                var line = lines[i].split(',');
                if (line.length === 2) {
                    live.push({
                        time: new Date(parseInt(line[0], 10) * 1000),
                        viewers: parseInt(line[1], 10)
                    });
                }
            }

            $scope.assignArray($scope.live, live);

            return DataSrv.getLiveMetadata().then(function(data) {
                $scope.liveMetadata = data;
                $scope.loadingLiveData = false;
            });
        }));

        $q.all(promises).then(function() {
            $scope.$broadcast('updateData');
        });
    };

    $scope.init();
});
