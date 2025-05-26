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
    let ccContainer = null;
    let speakerContainers = null;
    
    // Method 1: First try to find the captions using the new accessibility attributes
    const captionsRegion = document.querySelector('div[role="region"][aria-label="Captions"]');
    if (captionsRegion) {
      speakerContainers = captionsRegion.querySelectorAll(".nMcdL.bj4p3b");
      if (speakerContainers && speakerContainers.length > 0) {
        ccContainer = captionsRegion;
      }
    }
    
    // Method 2: If that didn't work, look for iOzk7 divs that contain caption elements
    if (!ccContainer) {
      const chatDivs = document.querySelectorAll("div.iOzk7");
      if (chatDivs && chatDivs.length > 0) {
        for (const div of chatDivs) {
          const containers = div.querySelectorAll(".nMcdL.bj4p3b");
          if (containers && containers.length > 0) {
            ccContainer = div;
            speakerContainers = containers;
            break;
          }
        }
      }
    }
    
    // Method 3: Fallback to the original method as last resort
    if (!ccContainer) {
      const chatDivs = document.querySelectorAll("div.iOzk7");
      ccContainer = Array.from(chatDivs).filter((div) => {
        return div.style.display != "none";
      })[0];
      
      if (ccContainer) {
        speakerContainers = ccContainer.querySelectorAll(".nMcdL.bj4p3b");
      }
    }
    
    // If we still couldn't find it, exit with detailed error
    if (!ccContainer || !speakerContainers || speakerContainers.length === 0) {
      throw new Error("Closed caption container or speakers not found - UI may have changed again");
    }

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
    console.log("Closed caption extraction error:", e);
    // Log more diagnostic information to help debug issues
    const hasIozk7 = document.querySelectorAll("div.iOzk7").length > 0;
    const hasCaptionsRegion = document.querySelector('div[role="region"][aria-label="Captions"]') !== null;
    console.log("Diagnostic info - iOzk7 elements found:", hasIozk7);
    console.log("Diagnostic info - Captions region found:", hasCaptionsRegion);
  }
}, 1000);
