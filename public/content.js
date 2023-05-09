/* global chrome */
/* global tippy */

let finder;
(async () => {
  const src = chrome.runtime.getURL("./finder.js");
  finder = await import(src);
})();

chrome.runtime.onMessage.addListener(function (event) {
  if (event.message !== "load") {
    return;
  }
  main();
});

let extensionIframe;
const selectNodeOverlay = document.createElement("div");
selectNodeOverlay.classList.add("select-overlay");
const overlayContent = document.createElement("div");
selectNodeOverlay.appendChild(overlayContent);

function dragElement(elmnt) {
  var pos1 = 0,
    pos2 = 0,
    pos3 = 0,
    pos4 = 0;
  document.querySelector("#extension-window .handle").onmousedown =
    dragMouseDown;

  function dragMouseDown(e) {
    e.target.classList.add("grabbing");
    e = e || window.event;
    e.preventDefault();
    pos3 = e.clientX;
    pos4 = e.clientY;
    document.onmouseup = closeDragElement;
    document.onmousemove = elementDrag;
  }

  function elementDrag(e) {
    e = e || window.event;
    e.preventDefault();
    pos1 = pos3 - e.clientX;
    pos2 = pos4 - e.clientY;
    pos3 = e.clientX;
    pos4 = e.clientY;
    elmnt.style.top = elmnt.offsetTop - pos2 + "px";
    elmnt.style.left = elmnt.offsetLeft - pos1 + "px";
  }

  function closeDragElement() {
    document
      .querySelector("#extension-window .handle")
      .classList.remove("grabbing");
    // stop moving when mouse button is released:
    document.onmouseup = null;
    document.onmousemove = null;
  }
}

function main() {
  const existingWindow = document.querySelector("#extension-window");
  if (existingWindow) {
    existingWindow.parentNode.removeChild(existingWindow);
    chrome.storage.sync.clear();
    return;
  }
  const extensionOrigin = "chrome-extension://" + chrome.runtime.id;
  if (!location.ancestorOrigins.contains(extensionOrigin)) {
    fetch(chrome.runtime.getURL("index.html"))
      .then((response) => response.text())
      .then((html) => {
        const draggable = document.createElement("div");
        const handle = document.createElement("div");
        draggable.id = "extension-window";
        handle.classList = ["handle"];
        const iframe = document.createElement("iframe");
        iframe.id = "extension-iframe";
        draggable.appendChild(handle);
        draggable.appendChild(iframe);
        document.body.appendChild(draggable);
        const reactHTML = html.replace(
          /\/static\//g,
          `${extensionOrigin}/static/`
        );
        chrome.storage.sync.set({ currentPage: window.location.hostname });
        const iframeDoc = iframe.contentWindow.document;
        iframeDoc.write(reactHTML);
        iframeDoc.close();
        dragElement(document.getElementById("extension-window"));
        extensionIframe = iframe;
        document.body.prepend(selectNodeOverlay);
      })
      .catch((error) => {
        console.warn(error);
      });
  }
}
