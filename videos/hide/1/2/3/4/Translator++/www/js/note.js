var note = {};

var win = nw.Window.get();
win.restore(); // restore if minimized
win.show(); // show if hidden

win.setResizable(true);
win.height = 320;
win.width = 640;


note.getParameters = function() {
	return window.location.hash.substr(1);
}
note.saveData = function() {
	//console.log("Run note.saveData");
	var thisFile = note.getParameters();
	/*
	var thisNote = window.opener.trans.project.files[thisFile].note||"";
	console.log("ID : "+thisFile);
	$("#note").val(thisNote);
	*/
	window.opener.trans.project.files[thisFile].note = $("#note").val();
	window.opener.ui.evalFileNoteIcon();
}

note.loadData = function() {
	console.log("Run note.loadData");
	var thisFile = note.getParameters();
	var thisNote = window.opener.trans.project.files[thisFile].note||"";
	console.log("ID : "+thisFile);
	$("title").text(thisFile+" - Translator++ Notes");
	$("#note").val(thisNote);
}





$(document).ready(function() {
	console.log("document ready");
	note.loadData();
	
	$("#note").on("change", function(e) {
		note.saveData();
	});
});

$(window).on('hashchange', function(e) {
	console.log(note.getParameters());
	note.loadData();
});	



win.on('close', function() {
	// Hide the window to give user the feeling of closing immediately
	this.hide();
	window.opener.$(".menu-button.addNote").removeClass("checked");

	// unregister this window on parent window.
	if (typeof window.opener.ui.windows.note !== 'undefined') window.opener.ui.windows.note = undefined;

	// After closing the new window, close the main window.
	this.close(true);

});