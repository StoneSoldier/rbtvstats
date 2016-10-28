'use strict';

function binaryClosest(array, searchElement) {
    if (!searchElement) {
        return -1;
    }

    var minIndex = 0;
    var maxIndex = array.length - 1;
    var currentIndex;
    var currentElement;
    searchElement = searchElement._d.getTime();

    while (minIndex <= maxIndex) {
        currentIndex = Math.floor((minIndex + maxIndex) / 2);
        currentElement = array[currentIndex].time.getTime();

        if (currentElement === searchElement || maxIndex - minIndex <= 1) {
            return currentIndex;
        } else if (currentElement < searchElement) {
            minIndex = currentIndex + 1;
        } else if (currentElement > searchElement) {
            maxIndex = currentIndex - 1;
        }
    }

    return -1; //should not happen
}

function getPercentile(percentile, data) {
    function compare(a, b) {
        if (a.viewers < b.viewers)
            return -1;
        if (a.viewers > b.viewers)
            return 1;
        return 0;
    }

    data = data.concat().sort(compare);

    var i = (percentile / 100) * data.length;
    var result = -1;
    if (Math.floor(i) == i) {
        result = (data[i - 1].viewers + data[i].viewers) / 2;
    } else {
        result = data[Math.floor(i)].viewers;
    }

    return result;
}

/**
 * @ngdoc function
 * @name rbtvstatsApp.controller:LiveCtrl
 * @description
 * # LiveCtrl
 * Controller of the rbtvstatsApp
 */
app.controller('LiveCtrl', function($scope, $rootScope, $location, $timeout, StateSrv, DataSrv) {
    $scope.initFinished = false;

    $scope.init = function() {
        $scope.updateChartState = false;

        //model (default)
        $scope.model = {};
        $scope.model.stats = {};
        $scope.model.dateRange = {
            startDate: null,
            endDate: null
        };
        $scope.model.dateRangeOptions = {
            showDropdowns: true,
            timePicker: true,
            timePicker24Hour: true,
            locale: {
                format: 'DD.MM.YYYY',
                separator: ' - ',
                applyLabel: 'Anwenden',
                cancelLabel: 'Abbrechen',
                fromLabel: 'Bis',
                toLabel: 'Von',
                customRangeLabel: 'Manuell',
                weekLabel: 'W',
                daysOfWeek: [
                    'So',
                    'Mo',
                    'Di',
                    'Mi',
                    'Do',
                    'Fr',
                    'Sa'
                ],
                monthNames: [
                    'Januar',
                    'Frebruar',
                    'März',
                    'April',
                    'Mai',
                    'Juni',
                    'Juli',
                    'August',
                    'September',
                    'Oktober',
                    'November',
                    'Dezember'
                ],
                firstDay: 1
            },
            ranges: {}
        };

        //load model state
        $scope.model = StateSrv.load($location.path(), $scope.model);

        $scope.dateRange = {
            startDate: $scope.getFrom() || $scope.model.dateRange.startDate,
            endDate: $scope.getTo() || $scope.model.dateRange.endDate
        };

        if ($scope.liveMetadata.last && !$scope.dateRange.startDate) {
            $scope.dateRange.startDate = moment($scope.liveMetadata.last * 1000).subtract(24, 'h');
        }

        if ($scope.liveMetadata.last && !$scope.dateRange.endDate) {
            $scope.dateRange.endDate = moment($scope.liveMetadata.last * 1000);
        }

        $scope.$on('updateLiveData', function(event, args) {
            if ($scope.liveMetadata.last && !$scope.dateRange.startDate) {
                $scope.dateRange.startDate = moment($scope.liveMetadata.last * 1000).subtract(24, 'h');
            }

            if ($scope.liveMetadata.last && !$scope.dateRange.endDate) {
                $scope.dateRange.endDate = moment($scope.liveMetadata.last * 1000);
            }

            $scope.updateDatePicker();
            $scope.update();
        });

        $scope.$watch('dateRange', function(newVal, oldVal) {
            var param = {};

            if ($scope.dateRange.startDate) {
                param.from = $scope.dateRange.startDate.unix();
            }

            if ($scope.dateRange.endDate) {
                param.to = $scope.dateRange.endDate.unix();
            }

            $location.search(param);
            $scope.update();
        }, true);

        $scope.$on("$routeUpdate", function(event, route) {
            $scope.dateRange = {
                startDate: $scope.getFrom() || $scope.model.dateRange.startDate,
                endDate: $scope.getTo() || $scope.model.dateRange.endDate
            };
        });

        $scope.updateDatePicker();

        $timeout(function() {
            $scope.initFinished = true;
        }, 100);
    };

    $scope.getFrom = function() {
        var from = null;
        var params = $location.search();

        if (typeof params.from !== 'undefined') {
            from = moment.unix(parseInt(params.from, 10));
        }

        return from;
    };

    $scope.getTo = function() {
        var to = null;
        var params = $location.search();

        if (typeof params.to !== 'undefined') {
            to = moment.unix(parseInt(params.to, 10));
        }

        return to;
    };

    $scope.changeDate = function(num, type) {
        if (num < 0) {
            num = Math.abs(num);
            $scope.dateRange.startDate.subtract(num, type);
            $scope.dateRange.endDate.subtract(num, type);
        } else {
            $scope.dateRange.startDate.add(num, type);
            $scope.dateRange.endDate.add(num, type);
        }

        var diff = $scope.dateRange.endDate.diff($scope.dateRange.startDate) / 1000;
        if ($scope.dateRange.startDate < $scope.model.dateRangeOptions.minDate || $scope.dateRange.endDate < $scope.model.dateRangeOptions.minDate) {
            $scope.dateRange.startDate = moment($scope.model.dateRangeOptions.minDate);
            $scope.dateRange.endDate = moment($scope.model.dateRangeOptions.minDate).add(diff, 's');
        }

        if ($scope.dateRange.startDate > $scope.model.dateRangeOptions.maxDate || $scope.dateRange.endDate > $scope.model.dateRangeOptions.maxDate) {
            $scope.dateRange.startDate = moment($scope.model.dateRangeOptions.maxDate).subtract(diff, 's');
            $scope.dateRange.endDate = moment($scope.model.dateRangeOptions.maxDate);
        }
    };

    $scope.update = function() {
        if ($scope.dateRange.startDate && $scope.dateRange.endDate) {
            if (!$scope.dateRange.startDate.isSame($scope.model.dateRange.startDate) || !$scope.dateRange.endDate.isSame($scope.model.dateRange.endDate)) {
                $scope.model.dateRange.startDate = moment($scope.dateRange.startDate);
                $scope.model.dateRange.endDate = moment($scope.dateRange.endDate);

                $scope.updateChart();
            }
        }
    };

    $scope.updateDatePicker = function() {
        $scope.model.dateRangeOptions.minDate = moment($scope.liveMetadata.first * 1000);
        $scope.model.dateRangeOptions.maxDate = moment($scope.liveMetadata.last * 1000);

        $scope.model.dateRangeOptions.ranges = {};

        var momentMax = moment($scope.model.dateRangeOptions.maxDate);
        var momentStart = moment(momentMax).subtract(8, 'h');
        $scope.model.dateRangeOptions.ranges['Letzten 8 Stunden'] = [momentStart, momentMax];

        momentStart = moment(momentMax).subtract(24, 'h');
        $scope.model.dateRangeOptions.ranges['Letzten 24 Stunden'] = [momentStart, momentMax];

        momentStart = moment(momentMax).subtract(7, 'd');
        $scope.model.dateRangeOptions.ranges['Letzten 7 Tage'] = [momentStart, momentMax];

        momentStart = moment(momentMax).subtract(1, 'M');
        $scope.model.dateRangeOptions.ranges['Letzter Monat'] = [momentStart, momentMax];

        momentStart = moment(momentMax).subtract(1, 'y');
        $scope.model.dateRangeOptions.ranges['Letztes Jahr'] = [momentStart, momentMax];
    };

    $scope.updateChart = function() {
        if (!$scope.updateChartState) {
            $scope.updateChartState = true;

            $scope.model.stats = [];

            $timeout(function() {
                var from = $scope.dateRange.startDate.toDate();
                var to = $scope.dateRange.endDate.toDate();
                $scope.fetchLiveData(from, to).then(function() {
                    var chart = {};

                    if ($scope.live.length > 0) {
                        chart.labels = [];
                        chart.series = [];
                        chart.data = [
                            []
                        ];
                        chart.options = {
                            type: 'line',
                            header: 'Live Views',
                            width: '100%',
                            height: '430px',
                            legend: {
                                display: false
                            },
                            elements: {
                                point: {
                                    radius: 0,
                                    hitRadius: 5
                                }
                            },
                            scales: {
                                xAxes: [{
                                    type: 'time',
                                    ticks: {
                                        minRotation: 60,
                                        maxRotation: 60
                                    },
                                    time: {
                                        displayFormats: {
                                            second: 'HH:mm',
                                            minute: 'HH:mm',
                                            hour: 'HH:mm',
                                            day: 'DD.MM.YY',
                                            week: 'DD.MM.YY',
                                            month: 'DD.MM.YY',
                                            quarter: 'DD.MM.YY',
                                            year: 'DD.MM.YY',
                                        }
                                    }
                                }],
                                yAxes: [{
                                    stacked: true,
                                    scaleLabel: {
                                        display: true,
                                        labelString: 'Views'
                                    }
                                }]
                            }
                        };

                        chart.series.push('Live Views');

                        var maxDatapoints = 4000;
                        var startIndex = binaryClosest($scope.live, $scope.dateRange.startDate);
                        var endIndex = binaryClosest($scope.live, $scope.dateRange.endDate);
                        var numDatapoints = endIndex - startIndex;
                        var step = 1;

                        if (numDatapoints > maxDatapoints) {
                            step = Math.floor(numDatapoints / maxDatapoints);
                        }

                        if (startIndex > -1 && endIndex > -1) {
                            for (var i = startIndex; i <= endIndex; i += step) {
                                var data = $scope.live[i];
                                chart.labels.push(moment(data.time));
                                chart.data[0].push(data.viewers);
                            }

                            $scope.updateStats($scope.live.slice(startIndex, endIndex));
                        }
                    }

                    $scope.model.chart = chart;

                    $scope.updateChartState = false;
                });
            }, 100);
        }
    };

    $scope.updateStats = function(data) {
        var stats = [];

        if (data.length > 0) {
            //oldestDatapoints
            var oldestDatapoints = data[0];
            stats.push({
                title: 'Ältester Datenpunkt',
                value: {
                    type: 'text',
                    text: moment(oldestDatapoints.time).format('LLLL')
                }
            });

            //newestDatapoints
            var newestDatapoints = data[data.length - 1];
            stats.push({
                title: 'Neuster Datenpunkt',
                value: {
                    type: 'text',
                    text: moment(newestDatapoints.time).format('LLLL')
                }
            });

            //totalDatapoints
            var totalDatapoints = data.length;
            stats.push({
                title: 'Anzahl Datenpunkte',
                value: {
                    type: 'number',
                    text: totalDatapoints
                }
            });

            //minDatapoint + maxDatapoint
            var min = Number.POSITIVE_INFINITY;
            var minIndex = -1;
            var max = Number.NEGATIVE_INFINITY;
            var maxIndex = -1;
            for (var j = 0; j < data.length; j++) {
                var tmp = data[j].viewers;
                if (tmp < min) {
                    minIndex = j;
                    min = tmp;
                }
                if (tmp > max) {
                    maxIndex = j;
                    max = tmp;
                }
            }

            var minDatapoint = data[minIndex];
            stats.push({
                title: 'Minimum',
                value: {
                    type: 'number',
                    text: moment(minDatapoint.time).format('LLLL') + ' - ' + minDatapoint.viewers
                }
            });

            var maxDatapoint = data[maxIndex];
            stats.push({
                title: 'Maximum',
                value: {
                    type: 'number',
                    text: moment(maxDatapoint.time).format('LLLL') + ' - ' + maxDatapoint.viewers
                }
            });

            //meanViews
            var totalViews = 0;
            for (var j = 0; j < data.length; j++) {
                totalViews += data[j].viewers;
            }
            var meanViews = Math.round(totalViews / totalDatapoints);
            stats.push({
                title: 'Durchschnitt',
                value: {
                    type: 'number',
                    text: meanViews
                }
            });

            //q1Views
            var q1Views = getPercentile(25, data);
            stats.push({
                title: 'Quartil 25%',
                value: {
                    type: 'number',
                    text: q1Views
                }
            });

            //q2Views
            var q2Views = getPercentile(50, data);
            stats.push({
                title: 'Quartil 50% (Median)',
                value: {
                    type: 'number',
                    text: q2Views
                }
            });

            //q3Views
            var q3Views = getPercentile(75, data);
            stats.push({
                title: 'Quartil 75%',
                value: {
                    type: 'number',
                    text: q3Views
                }
            });
        }

        $scope.model.stats = stats;
    };

    $timeout($scope.init, 0);
});
