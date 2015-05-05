var TimelineToGif = function (options) {
    this.canvasData = {};
    this.encoder = undefined;

    this.getTimelineData(options.url)
        .then(this.onJsonSuccess.bind(this), function (err) {
            console.error('An error occurred when tried to get a JSON', err);
        });
}

TimelineToGif.prototype.initCanvasAndEncoder = function (params) {
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
}

TimelineToGif.prototype.initEncoder = function (loopsNumber) {
    //0  -> loop forever
    //1+ -> loop n times then stop
    loopsNumber = loopsNumber || 0;

    this.encoder = new GIFEncoder();
    this.encoder.setRepeat(loopsNumber);
    this.encoder.start();
}

TimelineToGif.prototype.canvasToGif = function (delay) {// in ms
    this.encoder.setDelay(delay); //go to next frame every n milliseconds
    this.encoder.addFrame(this.canvasData.context);
}

TimelineToGif.prototype.canvasToImg = function () {
    this.encoder.finish();
    var binary_gif = this.encoder.stream().getData() //notice this is different from the as3gif package!
    return 'data:image/gif;base64,' + btoa(binary_gif);
}

TimelineToGif.prototype.getTimelineData = function (url) {
    return $.ajax({
        type: "GET",
        url: url,
        dataType: "json"
    });
};

TimelineToGif.prototype.onJsonSuccess = function (data) {
    if (!Array.isArray(data)) {
        console.error('JSON data is expected to be an Array (is it not Chrome Timeline data?)');
        return;
    }
    var capturedFrames = data.filter(function (el) {
        if (el['name'] === 'CaptureFrame') {
            return el;
        }
    });
    if (!capturedFrames.length) {
        console.log('There is no captured frames data in provided file');
        return;
    }

    this.initCanvas(capturedFrames);
}

// all screenshots are expected to have the same size
TimelineToGif.prototype.screenshotToImg = function (screenshotData) {
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
        }
        img.src = imgData;
    });
}

TimelineToGif.prototype.initCanvas = function (capturedFrames) {
    this.screenshotToImg(capturedFrames[0].args.data)
        .then(function (imgParams) {
            this.initCanvasAndEncoder(imgParams);
            this.dataToGif(capturedFrames);
        }.bind(this), function (params) {
            console.error('An error occurred when tried to load screenshot data ', params.screenshotData, 'as image:', params.err);
        });
}

TimelineToGif.prototype.screenshotToCanvas = function (params) {
    this.canvasData.context
        .drawImage(params.img, 0, 0);
}

TimelineToGif.prototype.screenshotAsImages = function (capturedFrames) {
    var promises = [];
    capturedFrames.forEach(function (capturedFrame) {
        if (!capturedFrame.args.data) {
            // empty frames in timeline data?
            promises.push(
                Promise.resolve({})// resolved promise
            )
        } else {
            promises.push(
                this.screenshotToImg(capturedFrame.args.data)
            )
        }
    }.bind(this));
    return promises;
}

TimelineToGif.prototype.dataToGif = function (capturedFrames) {
    Promise.all(
        this.screenshotAsImages(capturedFrames)
    )
        .then(function (loadedImages) {
            this.imagesToGif(capturedFrames, loadedImages);
        }.bind(this), function (err) {
            console.error('An error occured when tried to load timeline screenshots data to images', err);
        });
}

TimelineToGif.prototype.imagesToGif = function (capturedFrames, loadedImages) {
    //var capturedFrameExample = {
    //    args: {
    //        data: "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…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"
    //    },
    //    cat: "disabled-by-default-devtools.screenshot",
    //    name: "CaptureFrame",
    //    ph: "I",
    //    pid: 16378,
    //    s: "t",
    //    tid: 4879,
    //    ts: 417887820300,
    //    tts: 289655489
    //};

    //var loadedImageExample = {
    //    width: 400,
    //    height: 600,
    //    img: 'IMGElement'
    //};

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
    this.downloadCanvasAsImage(data_url);
    // ToDo progress indicator
    // ToDo Upload, drag-n-drop
}

TimelineToGif.prototype.downloadCanvasAsImage = function (data_url) {
    var link = document.createElement('a');
    link.href = data_url;
    link.setAttribute('download', 'FileName.gif');// ToDo filename the same as TimeLine?
    link.innerHTML = 'Click to download the result GIF';
    document.body.appendChild(link);
    //link.click();
}

var timelineToGif = new TimelineToGif({
    //url: 'inc/TimelineRawData-20150505T105858.json'
    //url: 'inc/TimelineRawData-20150505T132122.json'
    url: 'inc/TimelineRawData-20150505T132854.json'
    //url: 'inc/chrome.json'
});