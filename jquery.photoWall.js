/*!
 * jQuery photoWall.js v2.0.0
 * http://jeremyjcpaul.com
 * https://github.com/jeremyjcpaul/photowall
 *
 * Copyright 2015 Jeremy JC Paul
 * Released under the MIT license.
 * https://github.com/jeremyjcpaul/photowall/blob/master/MIT-LICENSE.txt
 *
 * Date: 14/12/2015
 */
;(function ($, window, document, undefined) {
	'use strict';

	var element = null;
	var jelement = null;
	var pwCurrentSlide = 0;
	var pwCurrentPreviewer = 0;

	var pluginName = 'photoWall',
        // key used in $.data()
        dataKey = 'plugin_' + pluginName;

	// Default plugin options.
	// Options can be overwritten when initializing plugin, by
	// passing an object literal, or after initialization:
	// $('.photoWall').photoWall('option', 'key', value);
	var defaults = {
		speed: 500,
		topOffset: 30,
		beforeInit: function() {},
		afterInit: function() {},
		beforeNextPrev: function() {},
		afterNextPrev: function() {},
		beforeNext: function() {},
		afterNext: function() {},
		beforePrev: function() {},
		afterPrev: function() {},
		beforeClose: function() {},
		afterClose: function() {},
		onDestroy: function() {}
	};


	/**
	 * Callback hooks.
	 * Usage: In the defaults object specify a callback function:
	 * hookName: function() {}
	 * Then somewhere in the plugin trigger the callback:
	 * hook('hookName');
	 */
	function _hook(instance, hookName) {
		if (instance.settings[hookName] !== undefined) {
			instance.settings[hookName].call(instance.element);
		}
	}

	function _initSlideGroupsAndPreviewers(instance) {
		//remove previewers
		instance.jelement.children('.pw-previewer').remove();
		if (instance.jelement.children('.pw-slide-group').length > 0) {
			//unwrap slides from their groups, remove data attribute - if groups exist
			instance.jelement.find('.pw-slide').unwrap().removeAttr('data-groupid');
		}

		//get the total width of the photoWall
		var totalWidth = instance.jelement.width();

		//append a temporary store to the body
		//populate the tempStore with the photowall contents
		//this prepares the DOM for wrapping up the slides based on width capacity
		instance.jelement.append('<div class="pw-tempStore" />');
		instance.jelement.children('.pw-tempStore').append(instance.jelement.contents().not('.pw-tempStore'));

		//used to name each slide group
		var currentGroupID = 1;
		//used to ensure that the width of each row is less than the total width
		var currentGroupWidth = 0;

		//create the first slide group in the photowall element
		instance.jelement.append('<div class="pw-slide-group pwsg-' + currentGroupID + '" />');
		//create the first previewer in the photowall element
		instance.jelement.append('<div class="pw-previewer pw-preview-' + currentGroupID + ' hide" data-groupid="' + currentGroupID + '"></div>');

		//iterate over each slide
		instance.jelement.children('.pw-tempStore').children('.pw-slide').each(function() {
			if ((currentGroupWidth + $(this).width()) <= totalWidth) {
				//the current slide can fit into the current slide group

				//append the current slide to the slide group
				instance.jelement.children('.pwsg-' + currentGroupID).append($(this));
				//increment the current group's width
				currentGroupWidth += $(this).width();
			} else {
				//this slide won't fit into the current slide group

				//increment the group ID for a new slide group to be made
				currentGroupID++;
				//create the new slide group in the photowall element
				instance.jelement.append('<div class="pw-slide-group pwsg-' + currentGroupID + '" />');
				//append the current slide to the new group
				instance.jelement.children('.pwsg-' + currentGroupID).append($(this));
				//set the current group's width to the current slide width
				currentGroupWidth = $(this).width();

				//append the previewer for this group
				instance.jelement.append('<div class="pw-previewer pw-preview-' + currentGroupID + ' hide" data-groupid="' + currentGroupID + '"></div>');
			}

			//set the group ID on the slide element
			$(this).attr('data-groupid', currentGroupID);
		});

		//remove the temporary store
		instance.jelement.children('.pw-tempStore').remove();
	}

	function _initSlideClickEvents(instance) {
        instance.jelement.on('click', '.pw-slide', function() {
			instance.pwCurrentSlide = $(this);

			//get the current previewer
			instance.pwCurrentPreviewer = instance.pwCurrentSlide.parent().nextAll('.pw-previewer:first');
			//get the old previewer
			var oldPreviewer = instance.jelement.find('.curPreview');

			//get the current slide group ID
			var currSlideGroupID = instance.pwCurrentSlide.attr('data-groupid');
			//try to get the current previewer group ID
			var currPreviewerGroupID = -1;
			if (oldPreviewer.length > 0) {
				currPreviewerGroupID = oldPreviewer.attr('data-groupid');
			}

			//if the current slide group ID is different to the current previer group ID
			//make sure all previewers are hidden and own the right classes
			if (currSlideGroupID != currPreviewerGroupID) {
				instance.jelement.find('.pw-previewer').addClass('hide').removeClass('curPreview').stop().slideUp(instance.settings.speed);
			}

			//empty the previewer contents and add the close button
			instance.pwCurrentPreviewer.empty();
			instance.pwCurrentPreviewer.append('<span class="pw-previewer-close">x</span>');

			//set up the click event for the close button
			instance.jelement.find('.pw-previewer-close').click(function() {
				instance.close();
			});

			//clone and append slide image to the previewer and wrap in a container for styling that is separate to pw-slide
			instance.pwCurrentSlide.children('.pw-image').clone().appendTo(instance.pwCurrentPreviewer);
			instance.pwCurrentPreviewer.children('.pw-image').wrapAll('<div class="pw-image-container" />');
			//clone and append the description element to the previewer
			instance.pwCurrentSlide.children('.pw-image-desc').clone().appendTo(instance.pwCurrentPreviewer);

			// ensure images in previewer aren't lazy loaded
			instance.pwCurrentPreviewer.find('.pw-image').each(function() {
				var curImage = $(this);
				if (curImage.data('original').length) {
					curImage.attr('src', curImage.data('original'));
				}
			});

			//open the previewer now that it's built
			instance.pwCurrentPreviewer.slideDown(instance.settings.speed, function() {
				var thisPreviewer = $(this);

				//determine whether the previewer needs sliding into view
				if ($('body').scrollTop() != (thisPreviewer.offset().top - instance.settings.topOffset)) {
					//slide the previewer into view, minus the top offset option
					$('html,body').animate({
						scrollTop: thisPreviewer.offset().top - instance.settings.topOffset
					}, instance.settings.speed);
				}
			}).removeClass('hide').addClass('curPreview');
        });
	}

	function _initKeyboardEvents(instance) {
		//set-up keyboard events
		$(document).keydown(function(e) {
			switch(e.which) {
				case 27: //ESC
					instance.close();
					break;

				case 37: //LEFT ARROW
					instance.prev();
					break;

				case 39: //RIGHT ARROW
					instance.next();
					break;

				default:
					return; //return so that e.preventDefault() isn't actioned
			}

			//stop any other keypress behaviour
			e.preventDefault();
		});
	}

	function _initWindowResize(instance) {
		//regroup slides after window resize
		var resizeTimer;
		$(window).resize(function() {
			//if timer exists
			if (resizeTimer) {
				//clear any previous pending timer
				clearTimeout(resizeTimer);
			}

			//set new timer
			resizeTimer = setTimeout(function() {
				//reset timer
				resizeTimer = null;

				//resize logic - it will only be called when there's been a pause in resize events

				//regroup slides and recreate previewers
				_initSlideGroupsAndPreviewers(instance);
			}, 500);
		});
	}

	// The actual plugin constructor
	function Plugin(element, options) {
		//private variables
		this.element = element;
		this.jelement = $(this.element);
		this.pwCurrentSlide = 0;
		this.pwCurrentPreviewer = 0;

		// jQuery has an extend method which merges the contents of two or
		// more objects, storing the result in the first object. The first object
		// is generally empty as we don't want to alter the default options for
		// future instances of the plugin
		this.settings = $.extend({}, defaults, options);
		this._defaults = defaults;
		this._name = pluginName;
		this.init();
	}

	// Avoid Plugin.prototype conflicts
	$.extend(Plugin.prototype, {
		/**
		 * Initialize plugin.
		 */
		init: function() {
			var self = this;

			//add callback event
			_hook(this, 'beforeInit');

			$(window).load(function() {
				//add all required classes
				self.jelement.children('div').addClass('pw-slide');
				self.jelement.children('.pw-slide').children('img').addClass('pw-image');
				self.jelement.children('.pw-slide').children('div').addClass('pw-image-desc');

				//get the total width of the photoWall
				var totalWidth = self.jelement.width();

				_initSlideGroupsAndPreviewers(self);
				_initSlideClickEvents(self);
				_initKeyboardEvents(self);
				_initWindowResize(self);

				//add callback event
				_hook(self, 'afterInit');
			});
		},

		/**
		 * Get/set a plugin option.
		 * Get usage: $('.photowall').photoWall('option', 'key');
		 * Set usage: $('.photowall').photoWall('option', 'key', value);
		 */
		option: function(key, val) {
			if (val) {
				this.settings[key] = val;
			} else {
				return this.settings[key];
			}
		},

		/**
		 * Open image detail with index.
		 * Usage: $('.photowall').photowall('select', value);
		 */
		select: function(val) {
			this.jelement.find('.pw-slide:eq(' + val.toString() + ')').click();
		},

		/**
		 * Open image detail with ID.
		 * Usage: $('.photowall').photowall('select', id);
		 */
		selectById: function(id) {
			this.jelement.find('.pw-slide#' + id.toString()).click();
		},

		/**
		 * Open image detail for the first image.
		 * Usage: $('.photowall').photowall('selectFirst');
		 */
		selectFirst: function() {
			this.jelement.find('.pw-slide:first').click();
		},

		/**
		 * Open image detail for the last image.
		 * Usage: $('.photowall').photowall('selectLast');
		 */
		selectLast: function() {
			this.jelement.find('.pw-slide:last').click();
		},

		/**
		 * Close image detail.
		 * Usage: $('.photowall').photowall('close');
		 */
		close: function() {
			var self = this;

			//add callback event
			_hook(this, 'beforeClose');

			//reset the current variables
			this.pwCurrentSlide = 0;
			this.pwCurrentPreviewer.empty();
			this.pwCurrentPreviewer = 0;

			//ensure all previewers are hidden
			this.jelement.find('.pw-previewer').stop().slideUp(this.settings.speed, function() {
				$(this).addClass('hide');

				//add callback event
				_hook(self, 'afterClose');
			});
		},

		/**
		 * Open next image detail.
		 * Usage: $('.photowall').photoWall('next');
		 */
		next: function() {
			//add callback events
			_hook(this, 'beforeNext');
			_hook(this, 'beforeNextPrev');

			if (this.pwCurrentSlide.next().length == 0) {
				//reached the end of the current slide group

				var nextSlideGroup = this.pwCurrentSlide.parent().nextAll('.pw-slide-group:first');

				//if there aren't anymore slide groups then navigate to the first slide
				//else navigate to the first slide in the next slide group
				if (nextSlideGroup.length == 0) {
					this.jelement.find('.pw-slide:first').click();
				} else {
					nextSlideGroup.children('.pw-slide:first').click();
				}
			} else {
				//get new current slide
				this.pwCurrentSlide = this.pwCurrentSlide.nextAll('.pw-slide:first');

				//empty the image container and insert new slide image
				this.pwCurrentPreviewer.children('.pw-image-container').empty().append(this.pwCurrentSlide.children('.pw-image').clone());
				//replace the description html
				this.pwCurrentPreviewer.children('.pw-image-desc').html(this.pwCurrentSlide.children('.pw-image-desc').html());
			}

			//add callback events
			_hook(this, 'afterNext');
			_hook(this, 'afterNextPrev');
		},

		/**
		 * Open previous image detail.
		 * Usage: $('.photowall').photoWall('prev');
		 */
		prev: function() {
			//add callback events
			_hook(this, 'beforePrev');
			_hook(this, 'beforeNextPrev');

			if (this.pwCurrentSlide.prev().length == 0) {
				//reached the end of the current slide group

				var prevSlideGroup = this.pwCurrentSlide.parent().prevAll('.pw-slide-group:first');//.children('.pw-slide:last').click();

				//if there aren't anymore slide groups then navigate to the last slide
				//else navigate to the last slide in the previous slide group
				if (prevSlideGroup.length == 0) {
					this.jelement.find('.pw-slide:last').click();
				} else {
					prevSlideGroup.children('.pw-slide:last').click();
				}
			} else {
				//get new current slide
				this.pwCurrentSlide = this.pwCurrentSlide.prevAll('.pw-slide:first');

				//empty the image container and insert new slide image
				this.pwCurrentPreviewer.children('.pw-image-container').empty().append(this.pwCurrentSlide.children('.pw-image').clone());
				//replace the description html
				this.pwCurrentPreviewer.children('.pw-image-desc').html(this.pwCurrentSlide.children('.pw-image-desc').html());
			}

			//add callback events
			_hook(this, 'afterPrev');
			_hook(this, 'afterNextPrev');
		},

		/**
		 * Destroy plugin.
		 * Usage: $('.photowall').photoWall('destroy');
		 */
		destroy: function() {
			var self = this;

			// Iterate over each matching element.
			this.jelement.each(function() {
				self.jelement = $(this);

				// remove previewers
				self.jelement.children('.pw-previewer').remove();
				// unwrap slides from their groups, remove data attribute, event bindings and class
				self.jelement.find('.pw-slide').unwrap().unbind().removeAttr('data-groupid').removeClass('pw-slide');
				// remove classes from slide elements
				self.jelement.find('.pw-image').removeClass('pw-image');
				self.jelement.find('.pw-image-desc').removeClass('pw-image-desc');

				//add callback event
				_hook(self, 'onDestroy');

				// Remove Plugin instance from the element.
				self.jelement.removeData(dataKey);
			});
		},
	});

	// A really lightweight plugin wrapper around the constructor,
	// preventing against multiple instantiations
	$.fn[pluginName] = function(options) {
        var plugin = this.data(dataKey);

        // has plugin instantiated ?
        if (plugin instanceof Plugin) {
            // if have options arguments, call plugin.init() again
            if (typeof options !== 'undefined') {
                plugin.init(options);
            }
        } else {
            plugin = new Plugin(this, options);
            this.data(dataKey, plugin);
        }

        return plugin;
	};
})(jQuery, window, document);