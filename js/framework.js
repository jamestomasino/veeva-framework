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
	VERSION: "0.0.1"
};

org.tomasino.clm.initialize = function () {
	console.log ("org.tomasino.clm VERSION:", org.tomasino.clm.VERSION);
};

org.tomasino.clm.initialize();
