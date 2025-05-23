console.log("Popup!!");

let chat = [];
let startChat = null;
let endChat = null;
let speakers = [];
let speakerColorMap = {};

// get element of id selectedIndexes
const startContentEx = document.getElementById("startContentEx");
const endContentEx = document.getElementById("endContentEx");
const responseStartContentEx = document.getElementById(
  "responseStartContentEx"
);
const responseEndContentEx = document.getElementById("responseEndContentEx");
const responseContainer = document.getElementById("responseContainer");

// check the current tab url
let meetId = null;
chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
  const currentTab = tabs[0];
  const url = currentTab.url;
  meetId = url.split("?")[0].split("/").pop();
});

const assignSpeakerColors = (speakersList) => {
  speakersList.forEach((speaker, index) => {
    if (!speakerColorMap[speaker]) {
      speakerColorMap[speaker] = index % 10; // Use modulo for color cycling
    }
  });
};

const createChatMessageElement = (chatInstance) => {
  const messageDiv = document.createElement("div");
  messageDiv.classList.add("chatMessage");
  messageDiv.setAttribute("ticId", chatInstance.ticId);
  
  // Add positioning class
  if (chatInstance.isCurrentUser) {
    messageDiv.classList.add("currentUser");
  } else {
    messageDiv.classList.add("otherUser");
    // Add speaker color class for non-current users
    const colorIndex = speakerColorMap[chatInstance.role];
    if (colorIndex !== undefined) {
      messageDiv.classList.add(`speaker-${colorIndex}`);
    }
  }
  
  // Create speaker name element (show for ALL users now, including current user)
  const speakerNameDiv = document.createElement("div");
  speakerNameDiv.classList.add("speakerName");
  speakerNameDiv.textContent = chatInstance.role;
  messageDiv.appendChild(speakerNameDiv);
  
  // Create chat bubble
  const bubbleDiv = document.createElement("div");
  bubbleDiv.classList.add("chatBubble");
  bubbleDiv.textContent = chatInstance.content;
  messageDiv.appendChild(bubbleDiv);
  
  // Add click event listener
  messageDiv.addEventListener("click", function () {
    selectChatInstance(messageDiv);
  });
  
  return messageDiv;
};

const formatChatForExport = () => {
  return chat.map(chatInstance => ({
    name: chatInstance.role,
    content: chatInstance.content
  }));
};

const exportChatAsJSON = () => {
  try {
    if (!chat || chat.length === 0) {
      alert('No chat data available to export');
      return;
    }
    
    const exportData = formatChatForExport();
    const jsonString = JSON.stringify(exportData, null, 2);
    
    // Create a blob and download link
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    // Create a temporary download link
    const a = document.createElement('a');
    a.href = url;
    a.download = `chat-export-${meetId || 'unknown'}-${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
  } catch (error) {
    console.error('Error exporting chat:', error);
    alert('Error exporting chat. Please try again.');
  }
};

const copyChatToClipboard = async () => {
  try {
    if (!chat || chat.length === 0) {
      alert('No chat data available to copy');
      return;
    }
    
    const exportData = formatChatForExport();
    const jsonString = JSON.stringify(exportData, null, 2);
    
    await navigator.clipboard.writeText(jsonString);
    
    // Temporarily change button text to show success
    const copyBtn = document.getElementById('copyChat');
    const originalText = copyBtn.textContent;
    copyBtn.textContent = 'Copied!';
    copyBtn.style.backgroundColor = '#4caf50';
    
    setTimeout(() => {
      copyBtn.textContent = originalText;
      copyBtn.style.backgroundColor = '#2196f3';
    }, 1500);
    
  } catch (error) {
    console.error('Error copying to clipboard:', error);
    alert('Error copying to clipboard. Please try again.');
  }
};

const reactToSelectedChats = () => {
  // remove the class selectedChatStart and selectedChatEnd from all the divs
  const chatInstances = document.querySelectorAll(".chatMessage");
  chatInstances.forEach((chatInstance) => {
    chatInstance.classList.remove("selectedChatStart");
    chatInstance.classList.remove("selectedChatEnd");
  });
  
  // find the startChat and endChat divs and add the class selectedChatStart and selectedChatEnd respectively
  if (startChat !== null) {
    const startChatInstance = document.querySelector(
      `[ticid="${chat[startChat].ticId}"]`
    );
    if (startChatInstance) {
      startChatInstance.classList.add("selectedChatStart");
    }
  }
  if (endChat !== null) {
    const endChatInstance = document.querySelector(
      `[ticid="${chat[endChat].ticId}"]`
    );
    if (endChatInstance) {
      endChatInstance.classList.add("selectedChatEnd");
    }
  }

  startContentEx.innerText = startChat !== null ? chat[startChat].content : "";
  endContentEx.innerText = endChat !== null ? chat[endChat].content : "";

  if (startChat !== null && endChat !== null) {
    generateResponseBtn.disabled = false;
  } else {
    generateResponseBtn.disabled = true;
  }
};

const generateResponseBtn = document.getElementById("gernerateResponse");
const exportChatBtn = document.getElementById("exportChat");
const copyChatBtn = document.getElementById("copyChat");

// add event listener to the button of id gernerateResponse
generateResponseBtn.addEventListener("click", function () {
  // send a message to the service worker of type "GENERATE_RESPONSE" with the startChat and endChat
  chrome.runtime.sendMessage({
    type: "GET_RESPONSE",
    data: { meetId, startChat, endChat },
  });
  startChat = null;
  endChat = null;
  reactToSelectedChats();
});

// add event listener to the export chat button
exportChatBtn.addEventListener("click", exportChatAsJSON);

// add event listener to the copy chat button
copyChatBtn.addEventListener("click", copyChatToClipboard);

const selectChatInstance = (targetChatInstanceElement) => {
  // get ticId attribute from the targetChatInstanceElement
  const targetTicId = targetChatInstanceElement.getAttribute("ticid");
  const chatIndex = chat.findIndex(
    (chatInstance) => chatInstance.ticId === targetTicId
  );
  if (startChat === null) {
    startChat = chatIndex;
  } else if (endChat === null) {
    if (chatIndex < startChat) {
      startChat = chatIndex;
    } else {
      endChat = chatIndex;
    }
  } else {
    startChat = null;
    endChat = null;
  }

  reactToSelectedChats();
};

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (
    request.type === "FULL_CURRENT_CHATS" &&
    meetId &&
    request.data.chats[meetId]
  ) {
    const chatContainer = document.getElementById("chatContainer");
    chat = request.data.chats[meetId];
    
    // Update speakers list and assign colors
    if (request.data.speakers) {
      speakers = request.data.speakers;
      assignSpeakerColors(speakers);
    }

    // Enable/disable export buttons based on chat availability
    const hasChat = chat && chat.length > 0;
    exportChatBtn.disabled = !hasChat;
    copyChatBtn.disabled = !hasChat;

    // if there is nothing inside the responseContainer.innerText then send a message to the service worker of type "GET_CHATGPT_RESPONSE"
    if (responseContainer.innerText.includes("(Response will show here)")) {
      chrome.runtime.sendMessage({
        type: "GET_CHATGPT_RESPONSE",
        data: { meetId },
      });
    }

    // Clear the entire container and recreate all messages for consistent styling
    chatContainer.innerHTML = '';
    
    // Recreate all messages with consistent styling
    chat.forEach((chatInstance) => {
      const messageElement = createChatMessageElement(chatInstance);
      chatContainer.appendChild(messageElement);
    });
    
    // Reapply selection highlighting if any
    reactToSelectedChats();
  }
  if (request.type === "CHATGPT_RESPONSE") {
    responseStartContentEx.innerText = chat[request.data.startChat].content;
    responseEndContentEx.innerText = chat[request.data.endChat].content;
    responseContainer.innerText = request.data.generatedResponse;
  }
  if (request.type === "FAILED_RESPONSE") {
    responseStartContentEx.innerText = "";
    responseEndContentEx.innerText = "";
    responseContainer.innerText = "(Sorry response failed to generate please rejoin the meet and try again)";
  }
});
