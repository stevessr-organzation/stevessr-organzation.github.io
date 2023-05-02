// select the translator
const translator = trans["deepl"];

// split keyText into lines
var keyTextLines = this.keyText.replaceAll("\r").split("\n");

// translate the text
// for some weird reason the editor treat the "await" token as an error
// the await token is perfectly correct ES7 code for executing asynchronous function
var translated = await translator.translate([keyTextLines]);

// set the transaltion into the currently selected cell
// I will let the first line as is, I will translate it manually by search and replace command latter.
this.setText(translated.translation[0]);
