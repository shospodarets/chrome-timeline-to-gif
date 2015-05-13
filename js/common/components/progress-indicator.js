'use strict';
var UTILS = require('../utils/utils'),
    EventsSystem = require('../utils/events-system').EventsSystem;


var ProgressIndicator = function (options) {
    // http://getbootstrap.com/components/#progress-animated
    // http://notifyjs.com/
    // http://www.html5rocks.com/en/tutorials/file/dndfiles/ - progress

    this.options = options || {};
    this.isActive = false;

    this.createDom();
    this.bindEvents();
};

UTILS.inherit(ProgressIndicator, EventsSystem);

// DOM
ProgressIndicator.prototype.createDom = function () {
    this.$container = $('\
        <div class="modal" id="progress-indicator-modal" tabindex="-1" role="dialog" aria-hidden="true">\
            <div class="modal-dialog">\
                <div class="modal-content">\
                    <div class="modal-header">\
                        <h4 class="modal-title">Modal title</h4>\
                    </div>\
                    <div class="modal-body">\
                        <div class="clearfix">\
                            <div class="progress-bar progress-bar-striped active"></div>\
                        </div>\
                    </div>\
                </div>\
            </div>\
        </div>\
    ');

    this.$title = this.$container.find('.modal-title');
    this.$progressBar = this.$container.find('.progress-bar');
};

// EVENTS
ProgressIndicator.prototype.bindEvents = function () {
};

// METHODS
/**
 * Shows progressbar
 *
 * @param [title] {String}
 * @param [progress] {Number}
 */
ProgressIndicator.prototype.show = function (title, progress) {
    this.isActive = true;
    this.setTitle(title);

    this.setProgress(progress);

    $(this.$container).modal({
        keyboard: false,
        backdrop: 'static',
        show: true
    });
};

ProgressIndicator.prototype.hide = function () {
    $(this.$container).modal('hide');
    this.isActive = false;
};

ProgressIndicator.prototype.setTitle = function (title) {
    if (title) {
        this.$title.text(title);
        this.$title.show();
    } else {
        this.$title.hide();
    }
};

ProgressIndicator.prototype.setProgress = function (progress) {
    if (progress && progress >= 0 && progress <= 100) {
        progress = parseInt(progress * 100) / 100;// take maximum two signs after comma

        this.$progressBar.css('width', progress + '%');
        this.$progressBar.text(progress + '%');
    } else {
        // show just loader
        this.$progressBar.css('width', '100%');
        this.$progressBar.text(' ');
    }
};

// EXPORT
exports.ProgressIndicator = ProgressIndicator;