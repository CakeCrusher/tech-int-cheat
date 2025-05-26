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
const speakers = new Set(); // Track all unique speakers
setInterval(function () {
  try {
    // Find the closed caption container in the new UI structure
    const chatDivs = document.querySelectorAll("div.iOzk7");
    let ccContainer = null;
    
    // First try the new UI structure approach
    if (chatDivs && chatDivs.length > 0) {
      // In the new UI, we take the first iOzk7 div that contains caption elements
      for (const div of chatDivs) {
        if (div.querySelector(".nMcdL.bj4p3b")) {
          ccContainer = div;
          break;
        }
      }
    }
    
    // Fallback to the previous approach if we couldn't find it with the new method
    if (!ccContainer) {
      ccContainer = Array.from(chatDivs).filter((div) => {
        return div.style.display != "none";
      })[0];
    }
    
    // If we still couldn't find it, exit
    if (!ccContainer) {
      throw new Error("Closed caption container not found");
    }
    
    let speakerContainers = ccContainer.querySelectorAll(".nMcdL.bj4p3b");

    speakerContainers.forEach((speaker) => {
      const ticIdOnDiv = speaker.getAttribute("ticId");
      const ticId = ticIdOnDiv ? ticIdOnDiv : randomId();
      const nameElement = speaker.querySelector(".jxFHg .NWpY1d");
      const name = nameElement ? nameElement.textContent : "Unknown";
      const contentElement = speaker.querySelector(".bh44bd.VbkSUe");
      const content = contentElement ? contentElement.textContent.trim() : "";
      
      // Track all speakers
      speakers.add(name);
      
      // Store or update content in tempChat
      if (!tempChat[ticId]) {
        tempChat[ticId] = { content: "", timeModified: Date.now() };
      }
      
      // Update content if it has changed
      if (tempChat[ticId].content !== content) {
        tempChat[ticId].content = content;
        tempChat[ticId].timeModified = Date.now();
      }
      
      const chatInstance = { 
        role: name, 
        content: tempChat[ticId].content, 
        ticId,
        isCurrentUser: name === "You"
      };
      
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
      data: { chat, meetId, speakers: Array.from(speakers) },
    });
  } catch (e) {
    console.log("no CC", e);
  }
}, 1000);
