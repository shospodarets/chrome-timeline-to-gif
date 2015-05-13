'use strict';

// EXTERNAL scripts to be included inside result *min.js file
var jQuery = require('../../bower_components/jquery/dist/jquery.min');
// set global vars
window.jQuery = window.$ = jQuery;

// invoke JS
require('../../bower_components/bootstrap/dist/js/bootstrap.min.js');
require('../../bower_components/notifyjs/dist/notify-combined');

// COMPONENTS
var ProgressIndicator = require('./components/progress-indicator').ProgressIndicator;
var FileLoader = require('./components/file-loader').FileLoader;
var TimelineToGif = require('./components/timeline-to-gif').TimelineToGif;

var App = function () {
    // APP
    this.$container = $('#container');
    this.progressIndicator = new ProgressIndicator({
        $container: this.$container
    });
    this.timelineToGif = new TimelineToGif({
        progressIndicator: this.progressIndicator
    });
    this.fileLoader = new FileLoader({
        $container: this.$container,
        progressIndicator: this.progressIndicator
    });

    this.bindEvents();
};

App.prototype.bindEvents = function () {
    this.fileLoader.on('json-parsed', function (data) {
        this.timelineToGif.processJSON(data);
    }.bind(this));
};

exports.App = App;