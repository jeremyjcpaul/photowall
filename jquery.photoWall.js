
;(function($) {
  var pluginName = 'photoWall';
	//private variables		
	var $pwCurrentSlide = 0;
	var $pwCurrentPreviewer = 0;
 
  /**
   * Plugin object constructor.
   * Implements the Revealing Module Pattern.
   */
  function Plugin(element, options) {
    // References to DOM and jQuery versions of element.
    var el = element;
    var $el = $(element);
 
    // Extend default options with those supplied by user.
    options = $.extend({}, $.fn[pluginName].defaults, options);
 
    /**
     * Initialize plugin.
     */
    function init() {
    	hook('beforeInit');
    	
		$(window).load(function() {
			$(".pw-previewer").remove();
			$(".pw-slide").attr("class", "pw-slide");

			var $offset = 0;

			$(".pw-slide").each(function() {
				$(this).addClass("offset-"+$(this).offset().top);
				$(this).attr("offset", $(this).offset().top);

				if($offset != 0)
				{
					var $newOffset = $(this).offset().top;

					if($offset != $newOffset)
					{
						$(this).prev().addClass("pw-slide-group-last");
						$(this).addClass("pw-slide-group-first").before("<div class='pw-previewer pw-preview-" + $offset + " hide' offset='"+ $offset +"'></div>");
	
						$offset = $newOffset;
					}
				}
				else
				{
					$offset = $(this).offset().top;					
				}
			});

			$el.append("<div class='pw-previewer pw-preview-" + $offset + " hide' offset='"+ $offset +"'></div>");
 			
 			$el.children(".pw-slide:first").addClass("pw-slide-group-first");
			$el.children(".pw-slide:last").addClass("pw-slide-group-last");
 
      		hook('afterInit');
		});
	
		//set-up click events
		$(".pw-slide").click(function() {
			$pwCurrentSlide = $(this);
						
			//$(".pw-previewer").addClass("hide").stop().slideUp(options.speed);
			$previewer = $pwCurrentSlide.nextAll(".pw-previewer:first");
			$pwCurrentPreviewer = $previewer;

			$slideOffset = $pwCurrentSlide.attr('offset');
			$oldPreview = $(".curPreview");
			$previewOffset = null;
			if($oldPreview.length > 0) {
				$previewOffset = $oldPreview.attr('offset');
			}
			
			if($slideOffset != $previewOffset) {
				$(".pw-previewer").addClass("hide").removeClass("curPreview").stop().slideUp(options.speed);
			}
			
			$previewer.empty();
			$previewer.append("<span class='pw-previewer-close'>x</span>");
			$(".pw-previewer-close").click(function() {
				$(".pw-previewer").addClass("hide").removeClass("curPreview").stop().slideUp(options.speed);
				//$pwCurrentPreviewer.empty();
				$pwCurrentSlide = 0;
				$pwCurrentPreviewer = 0;
			});

			$(this).children("img").clone().appendTo($previewer);
			$previewer.children(".pw-image").wrapAll("<div class='pw-image-container' />");
			$(this).children(".pw-image-desc").clone().appendTo($previewer);

			
			$previewer.slideDown(options.speed, function() {
				if($('body').scrollTop() != ($previewer.offset().top - options.topOffset)
				   && ($(document).height() - $(window).height() - $('body').scrollTop()) > $('.pw-image:first').height()
				   ) {
					$('html,body').animate({
						scrollTop: $previewer.offset().top - options.topOffset
					}, options.speed);
				}
			}).removeClass("hide").addClass("curPreview");		
		});
		
		//set-up keyboard events
		$(document).keydown(function(e){
			switch(e.which) 
			{
				case 27: //ESC
					close();
					break;
	
				case 37: //LEFT ARROW
					prev();
					break;

				case 39: //RIGHT ARROW
					next();
					break;

				default: 
					return;
			}
		
			e.preventDefault();
		});
    }
 
    /**
     * Get/set a plugin option.
     * Get usage: $('.photowall').photoWall('option', 'key');
     * Set usage: $('.photowall').photoWall('option', 'key', value);
     */
    function option(key, val) {
      if (val) {
        options[key] = val;
      } else {
        return options[key];
      }
    }
 
    /**
     * Open image detail with index.
     * Usage: $('.photowall').photowall('select', value);
     */
    function select(val) {
		$(".pw-slide:eq(" + val.toString() + ")").click();
	}
 
    /**
     * Open image detail with ID.
     * Usage: $('.photowall').photowall('select', id);
     */
    function selectById(id) {
		$(".pw-slide#" + id.toString()).click();
	}
 
    /**
     * Open image detail for the first image.
     * Usage: $('.photowall').photowall('selectFirst');
     */
    function selectFirst() {
		$(".pw-slide:first").click();
	}
 
    /**
     * Open image detail for the last image.
     * Usage: $('.photowall').photowall('selectLast');
     */
    function selectLast() {
		$(".pw-slide:last").click();
	}
 
    /**
     * Close image detail.
     * Usage: $('.photowall').photowall('close');
     */
	function close() {	
		hook('beforeClose');
	
		$pwCurrentSlide = 0;
		$pwCurrentPreviewer.empty();
		$pwCurrentPreviewer = 0;

		$(".pw-previewer").addClass("hide").stop().slideUp(options.speed);
	
		hook('afterClose');
	}
 
    /**
     * Open next image detail.
     * Usage: $('.photowall').photoWall('next');
     */
    function next() {
		hook('beforeNext');
		hook('beforeNextPrev');

		if($pwCurrentSlide.next().hasClass("pw-previewer"))
		{
			if($pwCurrentSlide.nextAll(".pw-slide:first").length == 0)
				$(".pw-slide:first").click();
			else
				$pwCurrentSlide.nextAll(".pw-slide-group-first:first").click();			
		}
		else
		{
			$newContent = $pwCurrentSlide.nextAll(".pw-slide:first");		
			$pwCurrentSlide = $newContent;

			$pwCurrentPreviewer.empty();
			$pwCurrentPreviewer.append("<span class='pw-previewer-close'>x</span>");
			$(".pw-previewer-close").click(function() {
				$pwCurrentSlide = 0;
				$pwCurrentPreviewer.empty();
				$pwCurrentPreviewer = 0;

				$(".pw-previewer").addClass("hide").stop().slideUp(options.speed);
			});

			$newContent.children().clone().appendTo($pwCurrentPreviewer);
		}
	
		$('html,body').animate({
			scrollTop: $pwCurrentPreviewer.children("img").offset().top - options.topOffset
		}, options.speed);
		
		hook('afterNext');
		hook('afterNextPrev');
	}
	
    /**
     * Open previous image detail.
     * Usage: $('.photowall').photoWall('prev');
     */
	function prev()
	{
		hook('beforePrev');
		hook('beforeNextPrev');

		if($pwCurrentSlide.prev().hasClass("pw-previewer"))
		{	
			$pwCurrentSlide.prevAll(".pw-slide-group-last:first").click();
		}
		else
		{
			if($pwCurrentSlide.prevAll(".pw-slide:first").length == 0)
			{
				$(".pw-slide:last").click();
				$newContent = $(".pw-slide:last");
			}
			else
			{
				$newContent = $pwCurrentSlide.prevAll(".pw-slide:first");
			}

			$pwCurrentSlide = $newContent;

			$pwCurrentPreviewer.empty();
			$pwCurrentPreviewer.append("<span class='pw-previewer-close'>x</span>");
			$(".pw-previewer-close").click(function() {
				$pwCurrentSlide = 0;
				$pwCurrentPreviewer.empty();
				$pwCurrentPreviewer = 0;

				$(".pw-previewer").addClass("hide").stop().slideUp(options.speed);
			});

			$newContent.children().clone().appendTo($pwCurrentPreviewer);
		}
	
		$('html,body').animate({
			scrollTop: $pwCurrentPreviewer.offset().top - options.topOffset
		}, options.speed);
	
		hook('afterPrev');
		hook('afterNextPrev');	
	}
	
    /**
     * Destroy plugin.
     * Usage: $('.photowall').photoWall('destroy');
     */
    function destroy() {
      // Iterate over each matching element.
      $el.each(function() {
        var el = this;
        var $el = $(this);

		$(".pw-slide").unbind().attr("class", "pw-slide");
		$(".pw-previewer").remove();
 
        hook('onDestroy');
        // Remove Plugin instance from the element.
        $el.removeData('plugin_' + pluginName);
      });
    }
 
    /**
     * Callback hooks.
     * Usage: In the defaults object specify a callback function:
     * hookName: function() {}
     * Then somewhere in the plugin trigger the callback:
     * hook('hookName');
     */
    function hook(hookName) {
      if (options[hookName] !== undefined) {
        options[hookName].call(el);
      }
    }
 
 
    // Initialize the plugin instance.
    init();
 
 
    // Expose methods of Plugin we wish to be public.
    return {
      option: option,
      select: select,
      selectById: selectById,
      selectFirst: selectFirst,
      selectLast: selectLast,
      close: close,
      next: next,
      prev: prev,
      destroy: destroy
    };
  }
 
 
  /**
   * Plugin definition.
   */
  $.fn[pluginName] = function(options) {
    // If the first parameter is a string, treat this as a call to
    // a public method.
    if (typeof arguments[0] === 'string') {
      var methodName = arguments[0];
      var args = Array.prototype.slice.call(arguments, 1);
      var returnVal;
      this.each(function() {
        // Check that the element has a plugin instance, and that
        // the requested public method exists.
        if ($.data(this, 'plugin_' + pluginName) && typeof $.data(this, 'plugin_' + pluginName)[methodName] === 'function') {
          // Call the method of the Plugin instance, and Pass it
          // the supplied arguments.
          returnVal = $.data(this, 'plugin_' + pluginName)[methodName].apply(this, args);
        } else {
          throw new Error('Method ' +  methodName + ' does not exist on jQuery.' + pluginName);
        }
      });
      if (returnVal !== undefined){
        // If the method returned a value, return the value.
        return returnVal;
      } else {
        // Otherwise, returning 'this' preserves chainability.
        return this;
      }
    // If the first parameter is an object (options), or was omitted,
    // instantiate a new instance of the plugin.
    } else if (typeof options === "object" || !options) {
      return this.each(function() {
        // Only allow the plugin to be instantiated once.
        if (!$.data(this, 'plugin_' + pluginName)) {
          // Pass options to Plugin constructor, and store Plugin
          // instance in the elements jQuery data object.
          $.data(this, 'plugin_' + pluginName, new Plugin(this, options));
        }
      });
    }
  };
 
  // Default plugin options.
  // Options can be overwritten when initializing plugin, by
  // passing an object literal, or after initialization:
  // $('.photoWall').photoWall('option', 'key', value);
  $.fn[pluginName].defaults = {
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
 
})(jQuery);
