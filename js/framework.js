/* Goals:
 *  - Allow for heirarchical page structures
 *  - Allow for non-heirarchical modal-style content
 *  - In-app help can be a modal layer
 *  - Allow orgponents to orgmunicate via events
 *
 */

var org;
if(org == null) org = {};
if(org.tomasino == undefined)org.tomasino = {};
org.tomasino.clm = {
	VERSION: "0.0.1",
	pageData: null,
	DEBUG: true
};

org.tomasino.clm.initialize = function () {
	if (DEBUG) console.log ("org.tomasino.clm VERSION:", org.tomasino.clm.VERSION);
};

org.tomasino.clm.createPage = function ( dataURL ) {
	dataURL = dataURL || 'asset.json';
	$.getJSON( dataURL, function( data ) {
		org.tomasino.clm.pageData = data;
		if (DEBUG) console.log (data);
	});
};

org.tomasino.clm.initialize();
