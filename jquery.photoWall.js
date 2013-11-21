/*!
 * jQuery photoWall.js v1.0.0
 * http://jeremyjcpaul.com
 * https://github.com/jeremyjcpaul/photowall
 *
 * Copyright 2013 Jeremy JC Paul
 * Released under the MIT license.
 * https://github.com/jeremyjcpaul/photowall/blob/master/MIT-LICENSE.txt
 *
 * Date: 21/11/2013
 */
;(function($) 
{
  var pluginName = 'photoWall';
  //private variables
  var $pwCurrentSlide = 0;
  var $pwCurrentPreviewer = 0;
 
  /**
   * Plugin object constructor.
   * Implements the Revealing Module Pattern.
   */
  function Plugin(element, options)
  {
    // References to DOM and jQuery versions of element.
    var el = element;
    var $el = $(element);
 
    // Extend default options with those supplied by user.
    options = $.extend({}, $.fn.photoWall.defaults, options);
 
    /**
     * Initialize plugin.
     */
    function init() 
    {
      //add callback event
    	hook('beforeInit');
      
    	
      $(window).load(function() 
      {
        //add all required classes
        $el.children("div").addClass("pw-slide");
        $el.children(".pw-slide").children("img").addClass("pw-image");
        $el.children(".pw-slide").children("div").addClass("pw-image-desc");

        //get the total width of the photoWall
        var totalWidth = $el.width();
        
        
        //group slides and create previewers
        setUpSlideGroupsAndPreviewers();
      
	
        //set-up slide click events
        $el.find(".pw-slide").on("click", function() 
        {
          $pwCurrentSlide = $(this);
          
          
          //get the current previewer
          $pwCurrentPreviewer = $pwCurrentSlide.parent().nextAll(".pw-previewer:first");
          //get the old previewer
          $oldPreviewer = $el.find(".curPreview");
          
          //get the current slide group ID
          $currSlideGroupID = $pwCurrentSlide.attr('data-groupid');        
          //try to get the current previewer group ID
          $currPreviewerGroupID = -1;
          if($oldPreviewer.length > 0) {
            $currPreviewerGroupID = $oldPreviewer.attr('data-groupid');
          }
          
          //if the current slide group ID is different to the current previer group ID 
          //make sure all previewers are hidden and own the right classes
          if($currSlideGroupID != $currPreviewerGroupID) 
          {
            $el.find(".pw-previewer").addClass("hide").removeClass("curPreview").stop().slideUp(options.speed);
          }
          
          
          //empty the previewer contents and add the close button
          $pwCurrentPreviewer.empty();
          $pwCurrentPreviewer.append("<span class='pw-previewer-close'>x</span>");
                  
          //set up the click event for the close button
          $el.find(".pw-previewer-close").click(function() 
          {
            close();
          });
                    
          //clone and append slide image to the previewer and wrap in a container for styling that is separate to pw-slide
          $(this).children(".pw-image").clone().appendTo($pwCurrentPreviewer);
          $pwCurrentPreviewer.children(".pw-image").wrapAll("<div class='pw-image-container' />");
          //clone and append the description element to the previewer
          $(this).children(".pw-image-desc").clone().appendTo($pwCurrentPreviewer);


          //open the previewer now that it's built
          $pwCurrentPreviewer.slideDown(options.speed, function() 
          {
            $this = $(this);
          
            //determine whether the previewer needs sliding into view
            if($('body').scrollTop() != ($this.offset().top - options.topOffset))
            {
              //slide the previewer into view, minus the top offset option
              $('html,body').animate(
              {
                scrollTop: $this.offset().top - options.topOffset
              }, options.speed);
            }
          }).removeClass("hide").addClass("curPreview");
        });
        
        //set-up keyboard events
        $(document).keydown(function(e)
        {
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
              return; //return so that e.preventDefault() isn't actioned
          }
        
          //stop any other keypress behaviour
          e.preventDefault();
        });
        
        
        //regroup slides after window resize
        var resizeTimer;
        $(window).resize(function () 
        {
          //if timer exists
          if (resizeTimer) 
          {
            //clear any previous pending timer
            clearTimeout(resizeTimer);   
          }
          
          //set new timer
          resizeTimer = setTimeout(function() 
          {
            //reset timer
            resizeTimer = null;
              
            //resize logic - it will only be called when there's been a pause in resize events
            
            //regroup slides and recreate previewers
            setUpSlideGroupsAndPreviewers();
      
          }, 500);  
        });
      
      });
      
      
      //add callback event
      hook('afterInit');
    }
    
    
    //private function to set up groups and peviewers
    function setUpSlideGroupsAndPreviewers()
    {
      //remove previewers
      $el.children(".pw-previewer").remove();
      if($el.children(".pw-slide-group").length > 0)
      {
        //unwrap slides from their groups, remove data attribute - if groups exist
        $el.find(".pw-slide").unwrap().removeAttr("data-groupid");        
      }
    
      //get the total width of the photoWall
      var totalWidth = $el.width();
      
      //append a temporary store to the body
      //populate the tempStore with the photowall contents
      //this prepares the DOM for wrapping up the slides based on width capacity
      $el.append("<div class='pw-tempStore' />");
      $el.children(".pw-tempStore").append($el.contents().not(".pw-tempStore"));
      
      
      //used to name each slide group
      var currentGroupID = 1;
      //used to ensure that the width of each row is less than the total width 
      var currentGroupWidth = 0;
      
      //create the first slide group in the photowall element
      $el.append("<div class='pw-slide-group pwsg-" + currentGroupID + "' />");
      //create the first previewer in the photowall element
      $el.append("<div class='pw-previewer pw-preview-" + currentGroupID + " hide' data-groupid='" + currentGroupID + "'></div>");
      
      //iterate over each slide
      $el.children(".pw-tempStore").children(".pw-slide").each(function() 
      {          
        if((currentGroupWidth + $(this).width()) <=  totalWidth)
        {
          //the current slide can fit into the current slide group
          
          //append the current slide to the slide group
          $el.children(".pwsg-" + currentGroupID).append($(this));	
          //increment the current group's width
          currentGroupWidth += $(this).width();
        }
        else
        {
          //this slide won't fit into the current slide group
          
          //increment the group ID for a new slide group to be made
          currentGroupID++;
          //create the new slide group in the photowall element 
          $el.append("<div class='pw-slide-group pwsg-" + currentGroupID + "' />");
          //append the current slide to the new group
          $el.children(".pwsg-" + currentGroupID).append($(this));	
          //set the current group's width to the current slide width
          currentGroupWidth = $(this).width();
          
          //append the previewer for this group
          $el.append("<div class='pw-previewer pw-preview-" + currentGroupID + " hide' data-groupid='" + currentGroupID + "'></div>");
        }
        
        //set the group ID on the slide element
        $(this).attr("data-groupid", currentGroupID);
      });
      
      
      //remove the temporary store
      $el.children(".pw-tempStore").remove();
    }
    
 
    /**
     * Get/set a plugin option.
     * Get usage: $('.photowall').photoWall('option', 'key');
     * Set usage: $('.photowall').photoWall('option', 'key', value);
     */
    function option(key, val) 
    {
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
    function select(val) 
    {
      $el.find(".pw-slide:eq(" + val.toString() + ")").click();
    }
 
    /**
     * Open image detail with ID.
     * Usage: $('.photowall').photowall('select', id);
     */
    function selectById(id) 
    {
      $el.find(".pw-slide#" + id.toString()).click();
    }
 
    /**
     * Open image detail for the first image.
     * Usage: $('.photowall').photowall('selectFirst');
     */
    function selectFirst() 
    {
      $el.find(".pw-slide:first").click();
    }
 
    /**
     * Open image detail for the last image.
     * Usage: $('.photowall').photowall('selectLast');
     */
    function selectLast() 
    {
      $el.find(".pw-slide:last").click();
    }
 
    /**
     * Close image detail.
     * Usage: $('.photowall').photowall('close');
     */
    function close() 
    {
      //add callback event      
      hook('beforeClose');
    
      //reset the current variables
      $pwCurrentSlide = 0;
      $pwCurrentPreviewer.empty();
      $pwCurrentPreviewer = 0;

      //ensure all previewers are hidden
      $el.find(".pw-previewer").addClass("hide").stop().slideUp(options.speed);
    
      //add callback event
      hook('afterClose');
    }
 
    /**
     * Open next image detail.
     * Usage: $('.photowall').photoWall('next');
     */
    function next() 
    {
      //add callback events
      hook('beforeNext');
      hook('beforeNextPrev');
      

      if($pwCurrentSlide.next().length == 0)
      {
        //reached the end of the current slide group
        
        $nextSlideGroup = $pwCurrentSlide.parent().nextAll(".pw-slide-group:first");
        
        //if there aren't anymore slide groups then navigate to the first slide
        //else navigate to the first slide in the next slide group
        if($nextSlideGroup.length == 0)
          $el.find(".pw-slide:first").click();
        else
          $nextSlideGroup.children(".pw-slide:first").click();			
      }
      else
      {
        //get new current slide
        $pwCurrentSlide = $pwCurrentSlide.nextAll(".pw-slide:first");
        
        //empty the image container and insert new slide image
        $pwCurrentPreviewer.children(".pw-image-container").empty().append($pwCurrentSlide.children(".pw-image").clone());
        //replace the description html
        $pwCurrentPreviewer.children(".pw-image-desc").html($pwCurrentSlide.children(".pw-image-desc").html());
      }
      
      
      //add callback events
      hook('afterNext');
      hook('afterNextPrev');
    }
	
    /**
     * Open previous image detail.
     * Usage: $('.photowall').photoWall('prev');
     */
    function prev()
    {
      //add callback events
      hook('beforePrev');
      hook('beforeNextPrev');
      

      if($pwCurrentSlide.prev().length == 0)
      {	
        //reached the end of the current slide group
        
        $prevSlideGroup = $pwCurrentSlide.parent().prevAll(".pw-slide-group:first");//.children(".pw-slide:last").click();
        
        //if there aren't anymore slide groups then navigate to the last slide
        //else navigate to the last slide in the previous slide group
        if($prevSlideGroup.length == 0)
          $el.find(".pw-slide:last").click();
        else
          $prevSlideGroup.children(".pw-slide:last").click();			
      }
      else
      {
        //get new current slide
        $pwCurrentSlide = $pwCurrentSlide.prevAll(".pw-slide:first");
       
        //empty the image container and insert new slide image
        $pwCurrentPreviewer.children(".pw-image-container").empty().append($pwCurrentSlide.children(".pw-image").clone());
        //replace the description html
        $pwCurrentPreviewer.children(".pw-image-desc").html($pwCurrentSlide.children(".pw-image-desc").html());
      }
          
    
      //add callback events
      hook('afterPrev');
      hook('afterNextPrev');	
    }
	
    /**
     * Destroy plugin.
     * Usage: $('.photowall').photoWall('destroy');
     */
    function destroy() 
    {
      // Iterate over each matching element.
      $el.each(function() 
      {
        var el = this;
        var $el = $(this);
        
        
        //remove previewers
        $el.children(".pw-previewer").remove();
        //unwrap slides from their groups, remove data attribute, event bindings and class
        $el.find(".pw-slide").unwrap().unbind().removeAttr("data-groupid").removeClass("pw-slide");
        //remove classes from slide elements
        $el.find(".pw-image").removeClass("pw-image");
        $el.find(".pw-image-desc").removeClass("pw-image-desc");
 
 
        //add callback event
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
    function hook(hookName) 
    {
      if (options[hookName] !== undefined) 
      {
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
  $.fn.photoWall = function(options) 
  {
    // If the first parameter is a string, treat this as a call to
    // a public method.
    if (typeof arguments[0] === 'string') 
    {
      var methodName = arguments[0];
      var args = Array.prototype.slice.call(arguments, 1);
      var returnVal;
      
      this.each(function() 
      {
        // Check that the element has a plugin instance, and that
        // the requested public method exists.
        if ($.data(this, 'plugin_' + pluginName) && typeof $.data(this, 'plugin_' + pluginName)[methodName] === 'function') 
        {
          // Call the method of the Plugin instance, and Pass it
          // the supplied arguments.
          returnVal = $.data(this, 'plugin_' + pluginName)[methodName].apply(this, args);
        } 
        else 
        {
          throw new Error('Method ' +  methodName + ' does not exist on jQuery.' + pluginName);
        }
      });
      
      if (returnVal !== undefined)
      {
        // If the method returned a value, return the value.
        return returnVal;
      } 
      else 
      {
        // Otherwise, returning 'this' preserves chainability.
        return this;
      }
    } 
    else if (typeof options === "object" || !options) 
    {
    // If the first parameter is an object (options), or was omitted,
    // instantiate a new instance of the plugin.
    
      return this.each(function() 
      {
        // Only allow the plugin to be instantiated once.
        if (!$.data(this, 'plugin_' + pluginName)) 
        {
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
  $.fn.photoWall.defaults = 
  {
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
