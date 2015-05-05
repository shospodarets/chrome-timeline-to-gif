'use strict';

var TimelineToGif = require('./components/timeline-to-gif').TimelineToGif;
var jQuery = require('../../bower_components/jquery/dist/jquery.min');
var FileLoader = require('./components/file-loader').FileLoader;

var App = function () {
    // set global vars
    window.jQuery = window.$ = jQuery;

    // APP
    this.$container = $('#container');
    this.timelineToGif = new TimelineToGif({
        //    //url: 'inc/TimelineRawData-20150505T105858.json'
        //    //url: 'inc/TimelineRawData-20150505T132122.json'
        url: 'inc/TimelineRawData-20150505T132854.json'
        //    //url: 'inc/chrome.json'
    });
    this.fileLoader = new FileLoader({
        $container: this.$container
    });
};

exports.App = App;