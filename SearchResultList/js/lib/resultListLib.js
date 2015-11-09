/*
 * Contains methods that are used in different places all over the project.
 */

define(['jquery', 'settings', 'jquery_ui', 'jquery_raty'], function($, settings, jQuery_ui, raty){
   $widgets = {
      loader: $('<div class="eexcess_loading" style="display:none"><img src="' + settings.pathToMedia + 'loading.gif" /></div>'),
      list: $('<ul id="recommendationList" class="block_list" data-total="0"></ul>').append($('<li>no results</li>')),
      dialog: $('<div style="display:none"><div>').append('<p></p>'),
      error: $('<p style="display:none">sorry, something went wrong...</p>'),
      innerContainer: $('<div class="scrollable-y"></div>')
   };


   /**
    * Displays errors.
    *
    * @param errorData: determines the error message. If it is equal to 'timeout' a timeout
    *                   message is shown. Otherwise a general message is shown.
    */
   function showError(errorData) {
      settings.hostTag.find('.pagination').remove();
      $widgets.list.empty();
      $widgets.loader.hide();
      if (errorData === 'timeout') {
         $widgets.error.text('Sorry, the server takes too long to respond. Please try again later');
      } else if(errorData === 'noResults'){
         $widgets.error.text('No results');
      } else {
         $widgets.error.text('Sorry, something went wrong');
      }
      $widgets.error.show();
       $('#eexcess_thumb').hide();
   };

   /**
    * Hides the currently displayed UI widgets and shows a loading screen instead.
    */
   function showLoadingScreen() {
      $('#result_gallery').remove();
      $('#eexcess_thumb').hide();
      settings.hostTag.find('.pagination').remove();
      $widgets.error.hide();
      $widgets.list.empty();
      $('.empty_result').hide();
      $widgets.loader.show();
   };

   /**
    * Assembles an a-tag and binds an event handler to it
    */
   function link(url, img, title) {
     var link = $('<a href="' + url + '">' + title + '</a>');
     link.click(function(evt) {
         evt.preventDefault();
         settings.previewHandler(url);
     });
     thumbnail(link, img);
     return link;
   };

   /**
    * Binds a hover and mouseover events to a link
    */
   function thumbnail(link, img) {
      // thumbnail on hover
      var xOffset = 10;
      var yOffset = 30;
      link.hover(
         function(e) {
            $('#eexcess_thumb_img').attr('src', img).css('max-width', '280px');
            $('#eexcess_thumb')
                .css('position', 'absolute')
                .css('top', (e.pageY - xOffset) + 'px')
                .css('left', (e.pageX + yOffset) + 'px')
                .css('z-index', 9999)
                .show();
         },
         function() {
           $('#eexcess_thumb').hide();
         });
      link.mousemove(function(e) {
         $('#eexcess_thumb')
            .css('top', (e.pageY - xOffset) + 'px')
            .css('left', (e.pageX + yOffset) + 'px');
      });
   };

   /**
    * Updates the UI to show new recommendations
    *
    * @param data: the results to be displayed
    */
   function showResults(data) {
      if(data.result.length == 0){
         showError("noResults");
         return;
      }
      $('.eexcess_tabs li.active').removeClass('active');
      $('.eexcess_tabs li').first().addClass('active');
      $('#result_gallery').remove();
      $widgets.error.hide();
      $widgets.loader.hide();
      $widgets.list.empty();

      if (data === null || data.totalResults === 0 || data.totalResults === '0') {
         $widgets.list.append($('<li>no results</li>'));
          return;
      }
      if(Array.isArray(data.result)){
         $widgets.list.attr('data-total', data.result.length);
      } else {
         throw new Error("Invalid result data received");
      }

      var height = (window.innerHeight || document.body.clientHeight) - 120;
      settings.itemsShown = Math.floor(height / 50);

      var _pagination = $('<div class="pagination"></div>');
      var pages = (Math.ceil(data.result.length / settings.itemsShown) > 10) ? 10 : Math.ceil(data.result.length / settings.itemsShown);

      if (pages > 1) {
         for (var i = 1; i <= pages; i++) {
            var _btn = $('<a href="#" class="page gradient">' + i + '</a>');
               if (i == 1) {
                  _btn.addClass('active');
               }
               _pagination.append(_btn);
          }

          if (settings.hostTag.find('.pagination').length != 0) {
             settings.hostTag.find('.pagination').remove();
          }

          settings.hostTag.append(_pagination);
      }
      moreResults(data.result);
   };

   /**
    * Continueation of the showResults method.
    * Todo: is this really required?
    */
   function moreResults(items) {
      var offset = $widgets.list.children('li').length;
      for (var i = 0, len = items.length; i < len; i++) {
         var item = items[i];
         var img = item.previewImage;
         if (typeof img === 'undefined' || img === '') {
            img = settings.pathToMedia + 'no-img.png';
         }
         var title = item.title;

         if (typeof title === 'undefined') {
            title = 'no title';
         }
         var pos = i + offset;
         var li = $('<li data-pos="' + pos + '" data-id="' + item.documentBadge.id + '"></li>');

         $widgets.list.append(li);


         if (i >= settings.itemsShown) {
             li.hide();
         }

         var containerL = $('<div class="resCtL"></div>');
         li.append(containerL);
         containerL.append(link(item.documentBadge.uri, img, '<img class="eexcess_previewIMG" src="' + img + '" />'));

         // contents
         var resCt = $('<div class="eexcess_resContainer"></div>');
         resCt.append(link(item.documentBadge.uri, img, title));
         li.append(resCt);

         // partner icon and name
         if (typeof item.documentBadge.provider !== 'undefined') {
            var providerName = item.documentBadge.provider.charAt(0).toUpperCase() + item.documentBadge.provider.slice(1);
            containerL.append($('<img alt="provided by ' + providerName + '" title="provided by ' + providerName + '" src="' + settings.pathToMedia + 'icons/' + item.documentBadge.provider + '-favicon.ico" class="partner_icon" />'));
         }

          // description
          if (typeof item.description !== 'undefined' && item.description !== '') {
             var shortDescription = shortenDescription(item.description);
             resCt.append($('<p class="result_description">' + shortDescription + '</p>'));
          }

          resCt.append($('<p style="clear:both;"></p>'));

         // custom buttons
         var buttons = JSON.parse(sessionStorage.getItem("Buttons"));
         if(Array.isArray(buttons)){
            for(var j=0; j<buttons.length; j++){
                var button = $(buttons[j].html),
                event = buttons[j].responseEvent;
                // don't insert the imageCitation button when there is no image
                if(event == "eexcess.imageCitationRequest" && !items[i].hasOwnProperty("previewImage")){
                   // don't insert the button
                } else {
                    button = button.attr("data-documentsMetadata", JSON.stringify(item));
                    button.click(function(){
                        var documentsMetadata = JSON.parse($(this).attr("data-documentsMetadata"));
                        event = $(this).find("img").attr("data-method");
                        window.top.postMessage({
                            event: event,
                            documentsMetadata: documentsMetadata
                        }, '*');
                    });
                    li.prepend(button);
                }
      
            }
         }
      }
      settings.hostTag.find('.eexcess_previewIMG').error(function() {
         $(this).unbind("error").attr("src", settings.pathToMedia + 'no-img.png');
      });
   };

   /**
    * Shortens a String. Strings are beeing truncated to 100 character.
    * Word barriers are respected. Therefor the string can be slightly longer.
    *
    * @param description: The string that need truncation
    */
   function shortenDescription(description) {
      var firstPart = description.substring(0, 100),
      remainder = description.substring(100, description.length),
      endPos = remainder.search(/[.!?; ]/);
      if (endPos != -1) {
         firstPart += remainder.substring(0, endPos);
         firstPart += "...";
      }
      return firstPart;
   };

   /**
    * Inserts a new HTML tag + code into
    */
   function registerButtonPerResult(data){
      // checking input data
      if(data instanceof Object){
         if(!(data.hasOwnProperty("html") &&
            data.hasOwnProperty("responseEvent"))){

            throw new Error("Isufficient parameter." +
               "The parameters 'html' and 'responseEvent' are required");
         }
         if(typeof data.responseEvent !== "string"){
            throw new Error("Invalid parameter types passed");
         }
         try{
            $(data.html);
         } catch(e){
            throw new Error("Syntax error. Invalid HTML passed");
         }
      }

      var alreadyRegistered = false;
      var buttons = sessionStorage.getItem("Buttons");
      if(buttons !== null){
         buttons = JSON.parse(buttons);
         if(Array.isArray(buttons)){
            for(var i=0; i<buttons.length; i++){
               if(buttons[i].responseEvent == data.responseEvent){
                  alreadyRegistered = true;
               }
            }
         } else {
            throw new Error("Invalid data in SessionCache");
         }
      }

      if(alreadyRegistered){
         console.warn("Registering button failed. A button with the response " + 
            "Event '" + data.responseEvent + "' is already registered.");
      } else {
         if(buttons == null){
            buttons = [];
         }
         buttons.push({
            html: data.html,
            responseEvent: data.responseEvent
         });
         sessionStorage.setItem("Buttons", JSON.stringify(buttons));
      }
   }

   /**
    * Makes some objects publicly available
    */
   return {
      $widgets: $widgets,
      showResults: showResults,
      showLoadingScreen: showLoadingScreen,
      showError: showError,
      registerButtonPerResult: registerButtonPerResult,
   };
});
