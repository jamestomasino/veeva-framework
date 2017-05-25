window.ns = window.ns || function (ns) {
    var n = ns.split('.'),
        p = window,
        c;
    for(var i=0; i < n.length; i++) {
        c=n[i];
        p[c]=p[c] || {
            modify: function(o) {
                for (var i in o) {
                    if (o.hasOwnProperty(i)) this[i] = o[i];
                }
            }
        };
        p=p[c];
    }
    return p;
}

ns('org.tomasino.clm').modify({
    VERSION: "0.0.2",
    DEBUG: true,
    _presentationStructure: null,
    _currentSlide: null,
    _events: {},
    _inCall: false,
    _accountID: '',

    EVENT_DEEPLINK: 'event_deeplink',
    EVENT_CURRENTSLIDEID: 'event_currentslideid',
    EVENT_CALLSTATUS: 'event_callstatus',

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

    /* Are we in a call?
     */
    inCall : function () {
        com.veeva.clm.getDataForCurrentObject("Account","ID", function (obj) {
            if (obj.success !== true) {
                org.tomasino.clm.log ('Account ID Callback Error', obj);
            } else {
                org.tomasino.clm._inCall = true;
                org.tomasino.clm._accountID = obj.Account.ID;
            }
            org.tomasino.clm.publish(org.tomasino.clm.EVENT_CALLSTATUS, obj.success);
        });
    },

    /* Per-Account Localstorage store
     */
    store: function (key, obj) {
        if (org.tomasino.clm._inCall) {
            var p = org.tomasino.clm._presentationStructure.presentationName;
            var a = org.tomasino.clm._accountID;
            var token = p + '_' + key + '_' + a;
            return window.localStorage.setItem(token, JSON.stringify(obj));
        } else {
            org.tomasino.clm.log ('ERROR - Not in call');
        }
    },

    /* Per-Account Localstorage get
     */
    get: function (key) {
        if (org.tomasino.clm._inCall) {
            var p = org.tomasino.clm._presentationStructure.presentationName;
            var a = org.tomasino.clm._accountID;
            var token = p + '_' + key + '_' + a;
            var value = window.localStorage.getItem(token);
            var returnObj;
            try {
                returnObj = JSON.parse(value);
            } catch (e) {
                returnObj = null;
            }
            return returnObj;
        } else {
            org.tomasino.clm.log ('ERROR - Not in call');
            return null;
        }
    },

    /* Start data processing, routing, etc
    */
    start : function () {
        /* Check for deep links
        */
        var value = window.localStorage.getItem('veevanav');
        if(value) {
            org.tomasino.clm.log ("Detected deep link information");
            var deeplinkobj;
            try {
                deeplinkobj = JSON.parse(value);
            } catch (e) {
                org.tomasino.clm.log ("Deep link format invalid:", value);
                deeplinkobj = { "version": 2, "error": true, "message": "Invalid JSON object" };
            }
            org.tomasino.clm.publish(org.tomasino.clm.EVENT_DEEPLINK, deeplinkobj);
            window.localStorage.removeItem('veevanav');
        }

        // Check if we're in a call. Can be called again to recheck.
        org.tomasino.clm.inCall();
    },

    /* Set current slide's ID. Used by navigational methods to know our origin
    */
    setCurrentSlideID : function ( id ) {
        org.tomasino.clm._currentSlide = id;
        org.tomasino.clm.log ("Current Slide ID:", id);
        org.tomasino.clm.publish(org.tomasino.clm.EVENT_CURRENTSLIDEID, id);
    },

    getCurrentSlideID : function () {
        return org.tomasino.clm._currentSlide;
    },

    getCurrentSlideKeyMessage : function () {
        var s = org.tomasino.clm._presentationStructure;
        if (s) {
            var i = s.slides.length; while (i--) {
                if (s.slides[i].id === org.tomasino.clm._currentSlide) {
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
                if (s.slides[i].id === org.tomasino.clm._currentSlide) {
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
                    window.localStorage.setItem('veevanav', JSON.stringify({ "page": deepLink.page, "state": deepLink.state }) );
                    break;
                case 2:
                    org.tomasino.clm.log ("Prepared deep link information (version 2)");
                    window.localStorage.removeItem('veevanav');
                    if (typeof deepLink !== 'string') deepLink = JSON.stringify(deepLink);
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
                                    window.localStorage.setItem('veevahistory', JSON.stringify({ "keyMessage": keyMessage, "presentationID": presentationID}) );
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
        com.veeva.clm.createRecord('Call_Clickstream_vod__c', trackingObj, org.tomasino.clm._trackEventCallback);
    },

    _trackEventCallback : function (data) {
        org.tomasino.clm.log(JSON.stringify(data));
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

});

/* vi: set shiftwidth=4 tabstop=4 expandtab: */
