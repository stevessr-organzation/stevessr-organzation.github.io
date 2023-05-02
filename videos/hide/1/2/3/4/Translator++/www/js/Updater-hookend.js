console.log("running hookend");

void function() {
	if (window.dv_LoginState == "loggedin") {
		console.log("login state : logged in");
		window.opener.postMessage("hello world", '*');		
		//console.log(window.opener);
		window.close();
	}
	
	if (window.location.host == "www.patreon.com") {
		// show loading indicator
		$(document).ready(function() {
			console.log("Document loaded");
			
			var $loadingOverlay = $(`<div id="busyOverlay" class="pitchBlack hidden" >
	<div class="lds-roller"><div></div><div></div><div></div><div></div><div></div><div></div><div></div><div></div></div>
	<div class="loading-text" data-tran="">工作中</div>
</div>
<style>
/*LOADER*/
#busyOverlay {
	background: rgba(0,0,0, .6);
    position: fixed;
    top: 0px;
    left: 0px;
    width: 100vw;
    height: 100vh;
    z-index: 1010;
}

.lds-roller {
  display: inline-block;
  position: relative;
  width: 64px;
  height: 64px;
}
.lds-roller div {
  animation: lds-roller 1.2s cubic-bezier(0.5, 0, 0.5, 1) infinite;
  transform-origin: 32px 32px;
}
.lds-roller div:after {
  content: " ";
  display: block;
  position: absolute;
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #cef;
  margin: -3px 0 0 -3px;
}
.lds-roller div:nth-child(1) {
  animation-delay: -0.036s;
}
.lds-roller div:nth-child(1):after {
  top: 50px;
  left: 50px;
}
.lds-roller div:nth-child(2) {
  animation-delay: -0.072s;
}
.lds-roller div:nth-child(2):after {
  top: 54px;
  left: 45px;
}
.lds-roller div:nth-child(3) {
  animation-delay: -0.108s;
}
.lds-roller div:nth-child(3):after {
  top: 57px;
  left: 39px;
}
.lds-roller div:nth-child(4) {
  animation-delay: -0.144s;
}
.lds-roller div:nth-child(4):after {
  top: 58px;
  left: 32px;
}
.lds-roller div:nth-child(5) {
  animation-delay: -0.18s;
}
.lds-roller div:nth-child(5):after {
  top: 57px;
  left: 25px;
}
.lds-roller div:nth-child(6) {
  animation-delay: -0.216s;
}
.lds-roller div:nth-child(6):after {
  top: 54px;
  left: 19px;
}
.lds-roller div:nth-child(7) {
  animation-delay: -0.252s;
}
.lds-roller div:nth-child(7):after {
  top: 50px;
  left: 14px;
}
.lds-roller div:nth-child(8) {
  animation-delay: -0.288s;
}
.lds-roller div:nth-child(8):after {
  top: 45px;
  left: 10px;
}
@keyframes lds-roller {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}
#busyOverlay .lds-roller {
	position:fixed;
	top:calc(50vh - 32px);
	left:calc(50vw - 32px);
}

@keyframes flashing {
	0% { 
		opacity: 0.3;
	}
	50% { 
		opacity: 1; 
	}
	100% { 
		opacity: 0.3; 
	}
}
#busyOverlay .loading-text {
    text-shadow: none;
    width: 80px;
    display: block;
    text-align: center;
    line-height: 32px;
    position: fixed;
    left: calc(50vw - 40px);
    top: calc(50vh - 16px);
	font-size: 10px;
	animation-name: flashing;
	animation-duration: .6s; /* or: Xms */
	animation-iteration-count: infinite;
	/*animation-direction: alternate;  or: normal */
	animation-timing-function: ease-out; /* or: ease, ease-in, ease-in-out, linear, cubic-bezier(x1, y1, x2, y2) */
	animation-fill-mode: forwards; /* or: backwards, both, none */
	/*animation-delay: 2s;  or: Xms */	
	color: #fff;
}

.hidden {
	display:none;
}
</style>

`);
			$("body").append($loadingOverlay);
			$("a, input[type=submit], input[type=button]").on("click", function() {
				$("#busyOverlay").removeClass("hidden");
			});
		})
	}
}();