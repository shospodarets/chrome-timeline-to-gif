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
var TimelineToImages = require('./components/timeline-to-images').TimelineToImages;
var ImagesToGif = require('./components/images-to-gif').ImagesToGif;

var App = function () {
    // APP
    this.$container = $('#container');
    this.progressIndicator = new ProgressIndicator({
        $container: this.$container
    });
    this.timelineToImages = new TimelineToImages({
        progressIndicator: this.progressIndicator
    });
    this.fileLoader = new FileLoader({
        $container: this.$container,
        progressIndicator: this.progressIndicator
    });
    this.imagesToGif = new ImagesToGif({
        progressIndicator: this.progressIndicator
    });

    this.bindEvents();
};

App.prototype.bindEvents = function () {
    this.fileLoader.on('json-parsed', function (data) {
        this.timelineToImages.trigger('processJSON', data);
    }.bind(this));
    this.timelineToImages.on('converted-to-images', function (data) {
        this.imagesToGif.trigger('imagesToGif', data);
    }.bind(this));
};

exports.App = App;