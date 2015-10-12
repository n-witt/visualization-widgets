/**
 * This module is implements the listeners for incoming messages
 */
define(['resultListLib'], function(helper){
   window.onmessage = function(e) {
      if (e.data.event) {
         if (e.data.event === 'eexcess.newResults') {
            helper.showResults(e.data.data);
         } else if (e.data.event === 'eexcess.queryTriggered') {
            helper.showLoadingScreen();
         } else if (e.data.event === 'eexcess.error') {
             helper.showError(e.data.data);
         } else if (e.data.event === 'eexcess.registerButton.perResult') {
            helper.registerButtonPerResult(e.data);
         }
      }
   };
   window.top.postMessage({event: "eexcess.msgListenerLoaded"}, '*');
});
