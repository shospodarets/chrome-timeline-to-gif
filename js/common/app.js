'use strict';

// EXTERNAL scripts to be included inside result *min.js file
var jQuery = require('../../bower_components/jquery/dist/jquery.min');
// set global vars
window.jQuery = window.$ = jQuery;

// invoke JS
require('../../bower_components/bootstrap/dist/js/bootstrap.min.js');
require('../../bower_components/notifyjs/dist/notify-combined');

// COMPONENTS
var TimelineToGif = require('./components/timeline-to-gif').TimelineToGif;
var FileLoader = require('./components/file-loader').FileLoader;
var ProgressIndicator = require('./components/progress-indicator').ProgressIndicator;

var App = function () {
    // APP
    this.$container = $('#container');
    this.timelineToGif = new TimelineToGif();
    this.fileLoader = new FileLoader({
        $container: this.$container
    });
    this.progressIndicator = new ProgressIndicator({
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