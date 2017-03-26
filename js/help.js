var org;
if (org === null) org = {};
if (org.tomasino == undefined) org.tomasino = {};
if (org.tomasino.clm  == undefined) org.tomasino.clm = {};

org.tomasino.clm.help = {
    VERSION: "0.0.1",
    DEBUG: true,
    _modes: ['help'],
    _activeMode: 'help',

    EVENT_MODECHANGE: 'event_modechange',

    /* Package log method
    */
    log : function () {
        if (org.tomasino.clm.help.DEBUG)
            console.log (
                "[org.tomasino.clm.help]",
                Array.prototype.join.call(arguments, " ") );
    },

    getModes : function () {
        return _modes.concat(); // copy
    },

    addMode : function (newMode) {
        if (typeof newMode === 'string')
            if (_modes.indexOf(newMode) === -1)
                _modes.push(newMode);
    },

    setMode : function (mode) {
        if (typeof newMode === 'string')
            if (_modes.indexOf(newMode) !== -1) {
                _activeMode = mode;

            }
    }

};

/* vi: set shiftwidth=4 tabstop=4 expandtab: */
