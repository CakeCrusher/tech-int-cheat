console.log("Popup!!")
// send a message to the service worker of type "RECORD"

const startBtn = document.getElementById("start_rec_btn");
// add event listener to the button
startBtn.addEventListener("click", function () {
  chrome.runtime.sendMessage({ type: "RECORD" });
})

// get element of id "btn"
const btn = document.getElementById("btn");
// add event listener to the button
btn.addEventListener("click", function () {
  chrome.runtime.sendMessage({ type: "STOP_RECORDING" });
})

// listen to message with type "SUGGESTED_CODE"
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === "SUGGESTED_CODE") {
    // get element of id "code"
    const code = document.getElementById("code");
    // set the innerHTML of the code element to the code
    code.innerText = request.code;
    console.log("Popup received message", request.code);
  }
})