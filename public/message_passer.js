chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log("to popup", request)
  extensionIframe.contentWindow.postMessage(request, "*");
})

window.addEventListener("message", function (event) {
  console.log("from popup", event.data)
  chrome.runtime.sendMessage(event.data);
});

