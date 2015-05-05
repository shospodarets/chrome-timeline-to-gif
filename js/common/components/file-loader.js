'use strict';
var FileLoader = function (options) {
    this.options = options || {};

    this.createDom();
    this.bindEvents();
    this.init();
};

FileLoader.prototype.createDom = function () {
    this.$container = $('\
        <div class="file-loader">\
        </div>\
    ');

    this.options.$container.append(this.$container);
};

FileLoader.prototype.bindEvents = function () {

};

FileLoader.prototype.init = function () {

};

exports.FileLoader = FileLoader;