speech = {};
trans.config = trans.config||{};
trans.config.useSpeech = trans.config.useSpeech||true;


function speak(text, callback) {
    var u = new SpeechSynthesisUtterance();
    u.text = text;
    u.lang = 'ja-JP';
 
    u.onend = function () {
        if (callback) {
            callback();
        }
    };
 
    u.onerror = function (e) {
        if (callback) {
            callback(e);
        }
    };
 
    speechSynthesis.speak(u);
}

// from http://stephenwalther.com/archive/2015/01/05/using-html5-speech-recognition-and-text-to-speech
// more https://developers.google.com/web/updates/2014/01/Web-apps-that-talk-Introduction-to-the-Speech-Synthesis-API