'use strict';

var UTILS = require('../utils/utils'),
    EventsSystem = require('../utils/events-system').EventsSystem;

var TimelineToImages = function (options) {
    this.options = options || {};

    this.canvasData = {};

    this.bindEvents();
};

UTILS.inherit(TimelineToImages, EventsSystem);

TimelineToImages.prototype.initCanvasAndEncoder = function (params) {
    // CANVAS
    var canvas = document.getElementById('c');
    var context = canvas.getContext('2d');
    // SET SIZE
    var width = params.width || canvas.width;
    var height = params.height || canvas.height;
    canvas.width = width;
    canvas.height = height;
    // FILL
    context.fillStyle = 'rgb(255,255,255)';
    context.fillRect(0, 0, canvas.width, canvas.height); //GIF can't do transparent so do white
    // STORE
    this.canvasData = {
        canvas: canvas,
        context: context,
        width: width,
        height: height
    }
};

/**
 * @param data
 * @param data.jsonData {Array}
 * @param data.fileName {String}
 */
TimelineToImages.prototype.processJSON = function (data) {
    var msg;
    var jsonData = data.jsonData;
    var fileName = data.fileName;
    if (!Array.isArray(jsonData)) {
        this.options.progressIndicator.hide();
        msg = 'JSON data is expected to be an Array (is it not Chrome Timeline data?)';
        console.error(msg);
        $.notify(
            msg,
            "error"
        );
        return;
    }
    var capturedFrames = jsonData.filter(function (el) {
        if (el['name'] === 'CaptureFrame') {
            return el;
        }
    });
    if (!capturedFrames.length) {
        this.options.progressIndicator.hide();
        msg = 'There is no captured frames data in provided file';
        console.log(msg);
        $.notify(
            msg,
            "warn"
        );
        return;
    }

    this.initCanvas(capturedFrames, fileName);
};

// all screenshots are expected to have the same size
TimelineToImages.prototype.screenshotToImg = function (screenshotData) {
    return new Promise(function (resolve, reject) {
        var imgData = 'data:image/png;base64,' + screenshotData;
        var img = new Image();
        img.onload = function () {
            resolve({
                width: img.width,
                height: img.height,
                img: img
            });
        };
        img.onerror = function (err) {
            reject({
                err: err,
                screenshotData: screenshotData
            });
        };
        img.src = imgData;
    });
};

TimelineToImages.prototype.initCanvas = function (capturedFrames, fileName) {
    this.screenshotToImg(capturedFrames[0].args.data)
        .then(function (imgParams) {
            this.initCanvasAndEncoder(imgParams);
            this.dataToGif(capturedFrames, fileName);
        }.bind(this), function (params) {
            this.options.progressIndicator.hide();
            var msg = 'An error occurred when tried to load screenshot data as image';
            console.error(msg, params.screenshotData, params.err);
            $.notify(
                msg,
                "error"
            );
        }.bind(this));
};

TimelineToImages.prototype.screenshotAsImages = function (capturedFrames) {
    var promises = [];
    var allScreenshots = capturedFrames.length;
    var todoScreenshots = allScreenshots;

    capturedFrames.forEach(function (capturedFrame) {
        if (!capturedFrame.args.data) {
            // empty frames in timeline data?
            todoScreenshots--;
            promises.push(
                Promise.resolve({})// resolved promise
            )
        } else {
            promises.push(
                this.screenshotToImg(capturedFrame.args.data)
                    .then(function (data) {
                        todoScreenshots--;
                        var progress = (allScreenshots - todoScreenshots) / allScreenshots * 100;
                        this.options.progressIndicator.setProgress(progress);
                        return data;// to keep Promise response
                    }.bind(this), function () {
                        todoScreenshots--;
                    })
            )
        }
    }.bind(this));
    return promises;
};

TimelineToImages.prototype.dataToGif = function (capturedFrames, fileName) {
    this.options.progressIndicator.show('Loading screenshots as images');
    Promise.all(
        this.screenshotAsImages(capturedFrames)
    )
        .then(function (loadedImages) {
            //this.options.progressIndicator.hide();// prevent hiding between steps
            this.trigger('converted-to-images', {
                capturedFrames: capturedFrames,
                loadedImages: loadedImages,
                fileName: fileName,
                canvasData: this.canvasData
            });
        }.bind(this), function (err) {
            this.options.progressIndicator.hide();
            var msg = 'An error occured when tried to load timeline screenshots data to images';
            console.error(msg, err);
            $.notify(
                msg,
                "error"
            );
        }.bind(this));
};

// EVENTS
TimelineToImages.prototype.bindEvents = function () {
    this.on('processJSON', this.processJSON.bind(this));
};

exports.TimelineToImages = TimelineToImages;
