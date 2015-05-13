'use strict';

var UTILS = require('../utils/utils'),
    EventsSystem = require('../utils/events-system').EventsSystem;

var ImagesToGif = function (options) {
    this.options = options || {};

    this.encoder = undefined;
    this.canvasData = undefined;
    this.worker = new Worker("js/web-workers/worker.js");

    this.bindEvents();

    // ToDo Worker and progress indicator
    this.worker.onmessage = function (e) {
        console.log('Message received from worker', e);
        //myWorker.terminate();
    };

    this.worker.postMessage('test message');
    console.log('Message posted to worker');
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

ImagesToGif.prototype.canvasToImg = function () {
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
    var capturedFrames = data.capturedFrames;
    var loadedImages = data.loadedImages;
    var fileName = data.fileName;
    this.canvasData = data.canvasData;

    this.initEncoder();
    loadedImages.forEach(function (loadedImage, i) {
        if (i === loadedImages.length) {
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
    }.bind(this));
    var data_url = this.canvasToImg();
    var img = new Image();
    document.body.appendChild(img);
    img.src = data_url;
    this.downloadCanvasAsImage(data_url, fileName);
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
