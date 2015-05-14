'use strict';

var UTILS = require('../utils/utils'),
    EventsSystem = require('../utils/events-system').EventsSystem;

var ImagesToGif = function (options) {
    this.options = options || {};

    this.encoder = undefined;
    this.canvasData = undefined;

    this.bindEvents();
};

UTILS.inherit(ImagesToGif, EventsSystem);

ImagesToGif.prototype.initEncoder = function (loopsNumber) {
    //0  -> loop forever
    //1+ -> loop n times then stop
    loopsNumber = loopsNumber || 0;

    this.encoder = new GIFEncoder();
    this.encoder.setRepeat(loopsNumber);
    this.encoder.start();
};

ImagesToGif.prototype.encoderDataToImg = function () {
    this.encoder.finish();
    var binary_gif = this.encoder.stream().getData(); //notice this is different from the as3gif package!
    return 'data:image/gif;base64,' + btoa(binary_gif);
};

ImagesToGif.prototype.canvasToGif = function (delay) {// in ms
    this.encoder.setDelay(delay); //go to next frame every n milliseconds
    this.encoder.addFrame(this.canvasData.context);
};

ImagesToGif.prototype.screenshotToCanvas = function (params) {
    this.canvasData.context
        .drawImage(params.img, 0, 0);
};

ImagesToGif.prototype.imagesToGif = function (data) {
    this.canvasData = data.canvasData;
    var fileName = data.fileName;

    this.initEncoder();
    this.processImages(data)
        .then(function () {
            var data_url = this.encoderDataToImg();
            var img = new Image();
            document.body.appendChild(img);
            img.src = data_url;
            this.downloadCanvasAsImage(data_url, fileName);
        }.bind(this), function (err) {
            var msg = 'An error occured when tried to process images from timeline data';
            console.error(msg, err);
            $.notify(
                msg,
                "error"
            );
        });
};

ImagesToGif.prototype.processImage = function (data, i, resolve, reject) {
    var capturedFrames = data.capturedFrames;
    var loadedImages = data.loadedImages;

    var progress = i / loadedImages.length * 100;
    this.options.progressIndicator.setProgress(progress);

    var loadedImage = loadedImages[i];
    if (i === loadedImages.length) {
        resolve();
        return;// skip the last
    }
    var currentFrame = capturedFrames[i];
    var nextFrame = capturedFrames[i + 1];
    if (loadedImage.img) {
        this.screenshotToCanvas(loadedImage);
        var currentFrameTime = currentFrame.ts;// in microseconds
        var nextFrameTime = nextFrame.ts;// in microseconds
        this.canvasToGif(currentFrame, (nextFrameTime - currentFrameTime) / 1000);
    } else {
        // empty frames in timeline data?
    }
    // next iteration
    setTimeout(function () {
        this.processImage(data, (i + 1), resolve, reject);
    }.bind(this), 20);
};

/**
 * Process images with timeout to prevent blocking UI
 * @returns {Promise}
 */
ImagesToGif.prototype.processImages = function (data) {
    this.options.progressIndicator.show('Encoding images to the result GIF');
    return new Promise(function (resolve, reject) {
            this.processImage(data, 0, resolve, reject);
        }.bind(this)
    ).then(function () {
            this.options.progressIndicator.hide();
        }.bind(this), function () {
            this.options.progressIndicator.hide();
        }.bind(this));
};

ImagesToGif.prototype.downloadCanvasAsImage = function (data_url, fileName) {
    var link = document.createElement('a');
    link.href = data_url;
    link.setAttribute('download', fileName + '.gif');
    link.innerHTML = 'Click to download the result GIF';
    document.body.appendChild(link);
    //link.click();
};

// EVENTS
ImagesToGif.prototype.bindEvents = function () {
    this.on('imagesToGif', this.imagesToGif.bind(this));
};

exports.ImagesToGif = ImagesToGif;
