const randomId = () => {
  let id = "";
  const characters =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  for (let i = 0; i < 5; i++) {
    id += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return id;
};

// repeat every 1 second
const chat = [];
const tempChat = {}; // {ticId: {content: string, timeModified: Date }}
setInterval(function () {
  try {
    const chatDivs = document.querySelectorAll("div.iOzk7");
    const ccContainer = Array.from(chatDivs).filter((div) => {
      return div.style.display != "none";
    })[0];
    let speakerContainers = ccContainer.querySelectorAll(".nMcdL.bj4p3b");

    speakerContainers.forEach((speaker) => {
      const ticIdOnDiv = speaker.getAttribute("ticId");
      const ticId = ticIdOnDiv ? ticIdOnDiv : randomId();
      const nameElement = speaker.querySelector(".jxFHg .NWpY1d");
      const name = nameElement ? nameElement.textContent : "Unknown";
      const contentElement = speaker.querySelector(".bh44bd.VbkSUe");
      const content = contentElement ? contentElement.textContent.trim() : "";
      
      // Store or update content in tempChat
      if (!tempChat[ticId]) {
        tempChat[ticId] = { content: "", timeModified: Date.now() };
      }
      
      // Update content if it has changed
      if (tempChat[ticId].content !== content) {
        tempChat[ticId].content = content;
        tempChat[ticId].timeModified = Date.now();
      }
      
      const chatInstance = { role: name, content: tempChat[ticId].content, ticId };
      
      if (ticIdOnDiv) {
        const chatIndex = chat.findIndex(
          (chatInstance) => chatInstance.ticId === ticId
        );
        if (chatIndex !== -1) {
          chat[chatIndex].content = chatInstance.content;
        }
      } else {
        chat.push(chatInstance);
        speaker.setAttribute("ticId", ticId);
      }
    });
    
    // cleanup tempChat if any ticId has not been modified in the last 10 seconds
    Object.keys(tempChat).forEach((ticId) => {
      if (Date.now() - tempChat[ticId].timeModified > 10000) {
        delete tempChat[ticId];
      }
    });
    
    // send chat to service worker
    const meetId = window.location.href.split("?")[0].split("/").pop();
    chrome.runtime.sendMessage({
      type: "CURRENT_CHAT",
      data: { chat, meetId },
    });
  } catch (e) {
    console.log("no CC", e);
  }
}, 1000);
