'use strict';

var UTILS = require('../utils/utils'),
    EventsSystem = require('../utils/events-system').EventsSystem;

var ImagesToGif = function (options) {
    this.options = options || {};

    this.encoder = undefined;
    this.canvasData = undefined;

    this.createDom();
    this.bindEvents();
};

UTILS.inherit(ImagesToGif, EventsSystem);

ImagesToGif.prototype.createDom = function () {
    this.$container = $('.result');

    this.$imageWrapper = this.$container.find('.image-wrapper');
    this.$imageDownloadLink = this.$container.find('.btn-download');
};

ImagesToGif.prototype.initEncoder = function (loopsNumber) {
    //0  -> loop forever
    //1+ -> loop n times then stop
    loopsNumber = loopsNumber || 0;

    this.encoder = new GIFEncoder();
    this.encoder.setRepeat(loopsNumber);
    this.encoder.start();
};

ImagesToGif.prototype.encoderDataToDataURI = function () {
    this.encoder.finish();
    var binary_data = this.encoder.stream().getData(); //notice this is different from the as3gif package!
    delete this.encoder;// asking garbage collector to free allocated memory
    return 'data:image/gif;base64,' + btoa(binary_data);
};

ImagesToGif.prototype.canvasToGif = function (delay) {// in ms
    this.encoder.setDelay(delay); //go to a next frame after n milliseconds
    this.encoder.addFrame(this.canvasData.context);
};

/**
 * Parse time to a suitable format
 */
ImagesToGif.prototype.parseFrameTime = function (time) {
    time = time / 1e6;// to seconds

    if (time === 0) return parseFloat(time);// if time is round

    return time.toFixed(3);
};

/**
 * @param time in microseconds
 */
ImagesToGif.prototype.addTimeToCanvas = function (time) {
    var canvasData = this.canvasData;
    var ctx = canvasData.context;
    var indent = 5;
    var x = canvasData.width - indent;
    var y = canvasData.height - indent;
    var text = this.parseFrameTime(time) + 's';
    var fontSize = 20;// in pixels

    ctx.font = fontSize + "px Arial, Sans-serif";
    ctx.textAlign = "end";
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = indent;
    ctx.strokeText(text, x, y);
    ctx.fillStyle = '#ff2e6b';
    ctx.fillText(text, x, y);
};

/**
 * @param params {{Object}}
 *
 * params.loadedImage {{Object}}
 * params.loadedImage.img {{Image}}
 *
 * params.currentFrame {{Object}}
 * params.currentFrame.ts {{number}} time in microseconds
 *
 * params.firstFrame {{Object}}
 * params.firstFrame.ts {{number}} time in microseconds
 */
ImagesToGif.prototype.screenshotToCanvas = function (params) {
    this.canvasData.context
        .drawImage(params.loadedImage.img, 0, 0);

    // timing
    if (this.options.$showTimeCheckbox[0].checked) {
        this.addTimeToCanvas(params.currentFrame.ts - params.firstFrame.ts);
    }
};

ImagesToGif.prototype.imagesToGif = function (data) {
    this.canvasData = data.canvasData;
    var fileName = data.fileName;

    this.initEncoder();
    this.processImages(data)
        .then(function () {
            var dataURI = this.encoderDataToDataURI();

            this.showResultImage(dataURI);
            this.downloadCanvasAsImage(dataURIToBlobUrl(dataURI), fileName);
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
    if (i === loadedImages.length - 1) {
        resolve();
        return;// skip the last
    }
    var currentFrame = capturedFrames[i];
    var nextFrame = capturedFrames[i + 1];
    if (loadedImage.img) {
        this.screenshotToCanvas({
            loadedImage: loadedImage,
            currentFrame: currentFrame,
            firstFrame: capturedFrames[0]
        });

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
 * @returns {{Promise}}
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

// RESULT FUNCTIONS
ImagesToGif.prototype.showResultImage = function (dataURI) {
    var img = new Image();
    this.$imageWrapper.empty();
    this.$imageWrapper.append(img);
    img.src = dataURI;
    this.$container.show();
};

ImagesToGif.prototype.downloadCanvasAsImage = function (dataURI, fileName) {
    this.$imageDownloadLink.attr('href', dataURI);
    this.$imageDownloadLink.attr('download', fileName + '.gif');
};

// EVENTS
ImagesToGif.prototype.bindEvents = function () {
    this.on('imagesToGif', this.imagesToGif.bind(this));
};

// http://eugeneware.com/software-development/converting-base64-datauri-strings-into-blobs-or-typed-array
function convertDataURIToBinary(dataURI) {
    var BASE64_MARKER = ';base64,';
    var base64Index = dataURI.indexOf(BASE64_MARKER) + BASE64_MARKER.length;
    var base64 = dataURI.substring(base64Index);
    var raw = window.atob(base64);
    var rawLength = raw.length;
    var array = new Uint8Array(rawLength);

    for (var i = 0; i < rawLength; i++) {
        array[i] = raw.charCodeAt(i);
    }
    return array;
}

function dataURIToBlobUrl(dataURI){
    var arr = convertDataURIToBinary(dataURI);
    var blob = new Blob([arr], {type: 'image/gif'});
    return window.URL.createObjectURL(blob);
}

exports.ImagesToGif = ImagesToGif;
