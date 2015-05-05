'use strict';

var UTILS = require('../utils/utils'),
    EventsSystem = require('../utils/events-system').EventsSystem;


var FileLoader = function (options) {
    this.options = options || {};

    this.createDom();
    this.bindEvents();
};

UTILS.inherit(FileLoader, EventsSystem);

// DOM
FileLoader.prototype.createDom = function () {
    this.$container = $('\
        <div class="file-loader">\
                <p>Upload Timeline Data file using button or just drag-n-drop it to the browser window</p>\
                <input class="file-input" type="file" />\
        </div>\
    ');
    this.$fileInput = this.$container.find('.file-input');

    this.options.$container.append(this.$container);
};

// EVENTS
FileLoader.prototype.bindEvents = function () {
    this.bindFileInput();
    this.bindDragOver();
    this.bindDrop();
};

FileLoader.prototype.bindFileInput = function () {
    var fileLoader = this;
    this.$fileInput.on('change', function (e) {
        fileLoader.processFiles(this.files);
    });
};

FileLoader.prototype.bindDrop = function () {
    $(document).bind('drop', function (e) {
        e.preventDefault();

        var files = e.originalEvent.target.files || e.originalEvent.dataTransfer.files;
        this.processFiles(files);
    }.bind(this));
};

FileLoader.prototype.bindDragOver = function () {
    // https://github.com/blueimp/jQuery-File-Upload/wiki/Drop-zone-effects
    // dropzone
    $(document).bind('dragover', function (e) {
        e.preventDefault();

        var timeout = window.dropZoneTimeout;
        if (!timeout) {
            document.body.classList.add('dragover');
        } else {
            clearTimeout(timeout);
        }

        window.dropZoneTimeout = setTimeout(function () {
            window.dropZoneTimeout = null;
            document.body.classList.remove('dragover');
        }.bind(this), 100);
    }.bind(this));
};

// PROCESS FILE
FileLoader.prototype.processFiles = function (files) {
    if (!this.checkErrors(files)) {
        return;
    }

    this.readJSON(files[0])
        .then(function (jsonData) {
            // ToDo messages: start loading file, progress, end + block UI
            this.trigger('json-parsed', jsonData);
        }.bind(this), function (err) {
            var msg = 'Cannot read JSON file';
            console.error(msg, err);
            $.notify(
                msg,
                "error"
            );
        }.bind(this));
};

FileLoader.prototype.checkErrors = function (files) {
    if (!files) {
        $.notify(
            'No files are provided for processing',
            "warn"
        );
        return;
    }
    // number of files
    if (!files.length) {
        $.notify(
            'At least one file is expected',
            "warn"
        );
        return;
    }
    if (files.length > 1) {
        $.notify(
            'One file is expected',
            "warn"
        );
        return;
    }

    var file = files[0];
    // file size
    if (file.size > 25 * 1024 * 1024) {
        $.notify(
            'Max file size is 25Mb',
            "warn"
        );
        return;
    }
    if (file.size < 1) {
        $.notify(
            'Min file size is 1 byte',
            "warn"
        );
        return;
    }
    // file type
    if (file.type !== 'application/json') {
        $.notify(
            'File is expected to have a JSON media type',
            "warn"
        );
        return;
    }

    return true;// success
};

// READ JSON
FileLoader.prototype.readJSON = function (file) {
    return new Promise(function (resolve, reject) {
        var reader = new FileReader();
        reader.onload = function (e) {
            resolve(
                JSON.parse(e.target.result)
            );
        };
        reader.onerror = reject;
        reader.onabort = reject;

        reader.readAsText(file);
    });
};

// EXPORT
exports.FileLoader = FileLoader;