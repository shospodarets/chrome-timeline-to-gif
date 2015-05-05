'use strict';

var jQuery = require('../../bower_components/jquery/dist/jquery.min');
// set global vars
window.jQuery = window.$ = jQuery;

var NotifyCombined = require('../../bower_components/notifyjs/dist/notify-combined');// invoke JS
var TimelineToGif = require('./components/timeline-to-gif').TimelineToGif;
var FileLoader = require('./components/file-loader').FileLoader;

var App = function () {
    // APP
    this.$container = $('#container');
    this.timelineToGif = new TimelineToGif();
    this.fileLoader = new FileLoader({
        $container: this.$container
    });

    this.bindEvents();
};

App.prototype.bindEvents = function () {
    this.fileLoader.on('json-parsed', function (jsonData) {
        this.timelineToGif.processJSON(jsonData);
    }.bind(this));
};

exports.App = App;