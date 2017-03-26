var org;
if (org == null) org = {};
if (org.tomasino == undefined) org.tomasino = {};

org.tomasino.clm = {
    VERSION: "0.0.1",
    DEBUG: true,
    _presentationStructure: null,
    _currentSlide: null,
    _events: {},

    /* Package log method
    */
    log : function () {
        if (org.tomasino.clm.DEBUG) console.log ( "[org.tomasino.clm]", Array.prototype.join.call(arguments, " ") );
    },

    /* Configure startup values
    */
    initialize : function () {
        org.tomasino.clm.log ( "VERSION:", org.tomasino.clm.VERSION );

        // Prevent images from dragging. Fixes swipe issues.
        $(document).bind("dragstart", function() { return false; });
        document.addEventListener('touchmove', function (e) { e.preventDefault(); }, false);
    },

    /* Start data processing, routing, etc
    */
    start : function () {
        /* Check for deep links
        */
        if(window.localStorage.getItem('veevanav')) {
            org.tomasino.clm.log ("Detected deep link information");
            org.tomasino.clm.publish('deeplink', window.localStorage.getItem('veevanav') );
            window.localStorage.removeItem('veevanav');
        }
    },

    /* Set current slide's ID. Used by navigational methods to know our origin
    */
    setCurrentSlideID : function ( id ) {
        org.tomasino.clm._currentSlide = id;
        org.tomasino.clm.log ("Current Slide ID:", id);
        org.tomasino.clm.publish('currentSlideID', id);
    },

    getCurrentSlideID : function () {
        return org.tomasino.clm._currentSlide;
    },

    getCurrentSlideKeyMessage : function () {
        var s = org.tomasino.clm._presentationStructure;
        if (s) {
            var i = s.slides.length; while (i--) {
                if (s.slides[i].id === id) {
                    return s.slides[i].keyMessage;
                    break;
                }
            }
        } else {
            org.tomasino.clm.log ("Navigation not configured");
        }
    },

    getCurrentSlideJobCode : function () {
        var s = org.tomasino.clm._presentationStructure;
        if (s) {
            var i = s.slides.length; while (i--) {
                if (s.slides[i].id === id) {
                    return s.slides[i].jobCode;
                    break;
                }
            }
        } else {
            org.tomasino.clm.log ("Navigation not configured");
        }
    },

    /* Navigation structural definition
     *
     * Expects a data object with an array named "slides" referencing all
     * slides in the current presentation and their Media_File_Name_vod__c
     */
    navCreate : function ( presentationStructure ) {
        if (! "presentationName" in presentationStructure) {
            org.tomasino.clm.log ("Presentation structure missing 'presentationName'");
        } else if (! "presentationID" in presentationStructure) {
            org.tomasino.clm.log ("Presentation structure missing 'presentationID'");
        } else if (! "slides" in presentationStructure) {
            org.tomasino.clm.log ("Invalid presentation Slide structure");
        } else if (! presentationStructure.slides.length > 0) {
            org.tomasino.clm.log ("Invalid presentation Slide structure");
        }

        org.tomasino.clm._presentationStructure = presentationStructure;
    },

    /* Pre-navigation data handling
     *
     * Creates necessary storage objects for deep linking and
     * history prior to navigation. Supports old page/state deep linking
     * as version 1. New arbitrary deep linking is version 2.
     */
    navPrepare : function (deepLink) {
        if (! "version" in deepLink) {
            org.tomasino.clm.log ("DeepLinking version required");
        } else {
            switch (deepLink.version) {
                case 1:
                    org.tomasino.clm.log ("Prepared deep link information (version 1)");
                    window.localStorage.removeItem('veevanav');
                    window.localStorage.setItem('veevanav', { "page": deepLink.page, "state": deepLink.state } );
                    break;
                case 2:
                    org.tomasino.clm.log ("Prepared deep link information (version 2)");
                    window.localStorage.removeItem('veevanav');
                    window.localStorage.setItem('veevanav', deepLink);
                    var s = org.tomasino.clm._presentationStructure;
                    var c = org.tomasino.clm._currentSlide;
                    var keyMessage = null;
                    var presentationID = null;
                    if (s) {
                        presentationID = s.presentationID;
                        if (c) {
                            var i = s.slides.length; while (i--) {
                                if (s.slides[i].id === c) {
                                    keyMessage = s.slides[i].keyMessage;
                                    window.localStorage.removeItem('veevahistory');
                                    window.localStorage.setItem('veevahistory', { "keyMessage": keyMessage, "presentationID": presentationID} );
                                }
                            }
                        }
                    }
                    break;
            }
        }
    },

    /* Navigate to next asset in presentation structure
     *
     * (Optional) pass deep linking object
     */
    navNext : function (deepLink) {
        var s = org.tomasino.clm._presentationStructure;
        var c = org.tomasino.clm._currentSlide;
        if (s) {
            if (c) {
                var i = s.slides.length; while (i--) {
                    if (s.slides[i].id === c) {
                        if (i < (s.slides.length - 1)) { // Only navigate prev is there is a prev
                            if (deepLink) org.tomasino.clm.navPrepare(deepLink);
                            org.tomasino.clm.log ("Navigate to", s.slides[i+1].id);
                            com.veeva.clm.gotoSlide(s.slides[i+1].keyMessage);
                        }
                    }
                }
            } else {
                org.tomasino.clm.log ("Current Slide not configured");
            }
        } else {
            org.tomasino.clm.log ("Navigation not configured");
        }
    },

    /* Navigate to previous asset in presentation structure
     *
     * (Optional) pass deep linking object
     */
    navPrev : function (deepLink) {
        var s = org.tomasino.clm._presentationStructure;
        var c = org.tomasino.clm._currentSlide;
        if (s) {
            if (c) {
                var i = s.slides.length; while (i--) {
                    if (s.slides[i].id === c) {
                        if (i > 0) { // Only navigate prev is there is a prev
                            if (deepLink) org.tomasino.clm.navPrepare(deepLink);
                            org.tomasino.clm.log ("Navigate to", s.slides[i-1].id);
                            com.veeva.clm.gotoSlide(s.slides[i-1].keyMessage);
                        }
                    }
                }
            } else {
                org.tomasino.clm.log ("Current Slide not configured");
            }
        } else {
            org.tomasino.clm.log ("Navigation not configured");
        }
    },

    /* Navigate to an Asset in this presentation by its ID
     *
     * (Optional) pass deep linking object
     */
    navToID : function (id, deepLink) {
        var s = org.tomasino.clm._presentationStructure;
        if (s) {
            var i = s.slides.length; while (i--) {
                if (s.slides[i].id === id) {
                    if (deepLink) org.tomasino.clm.navPrepare(deepLink);
                    org.tomasino.clm.log ("Navigate to", s.slides[i].id, '('+s.slides[i].keyMessage+')');
                    com.veeva.clm.gotoSlide(s.slides[i].keyMessage);
                    break;
                }
            }
        } else {
            org.tomasino.clm.log ("Navigation not configured");
        }
    },

    /* Track an event
     *
     * id, type, and description required
     */
    trackEvent : function ( id, type, desc ) {
        var trackingObj = {
            'Track_Element_Id_vod__c': id,
            'Track_Element_Type_vod__c': type,
            'Track_Element_Description_vod__c': desc
        }
        org.tomasino.clm.log ("Track:", id, type, desc);
        com.veeva.clm.generateSaveRecordRequest ('Call_Clickstream_vod__c', trackingObj, 'org.tomasino.clm._trackEventCallback');
    },

    _trackEventCallback : function (data) {
        org.tomasino.clm.log ("Tracking complete");
    },

    /* Subscribe to an event.
     *
     * Returns an observable object with the "remove" method for easy cleanup
    */
    subscribe : function(eventName, listener) {
        if(!org.tomasino.clm._events.hasOwnProperty.call(org.tomasino.clm._events, eventName))
            org.tomasino.clm._events[eventName] = [];

        var index = org.tomasino.clm._events[eventName].push(listener) -1;

        // Provide handle back for removal of eventName
        return {
            remove: function() {
                delete org.tomasino.clm._events[eventName][index];
            }
        };
    },

    /* Publish to an event
     *
     * (Optional) pass any object along as payload
     */
    publish : function(eventName, info) {
        if(!org.tomasino.clm._events.hasOwnProperty.call(org.tomasino.clm._events, eventName)) return;

        org.tomasino.clm._events[eventName].forEach(function(item) {
            item(info != undefined ? info : {});
        });
    }

};

/* vi: set shiftwidth=4 tabstop=4 expandtab: */
