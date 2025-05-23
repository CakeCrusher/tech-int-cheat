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
  
  // Create speaker name element (only show for others, not for current user)
  if (!chatInstance.isCurrentUser) {
    const speakerNameDiv = document.createElement("div");
    speakerNameDiv.classList.add("speakerName");
    speakerNameDiv.textContent = chatInstance.role;
    messageDiv.appendChild(speakerNameDiv);
  }
  
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

    // if there is nothing inside the responseContainer.innerText then send a message to the service worker of type "GET_CHATGPT_RESPONSE"
    if (responseContainer.innerText.includes("(Response will show here)")) {
      chrome.runtime.sendMessage({
        type: "GET_CHATGPT_RESPONSE",
        data: { meetId },
      });
    }

    chat.forEach((chatInstance) => {
      const existingElement = document.querySelector(`[ticId="${chatInstance.ticId}"]`);
      
      if (!existingElement) {
        // Create new message element
        const messageElement = createChatMessageElement(chatInstance);
        chatContainer.appendChild(messageElement);
      } else {
        // Update existing message content
        const bubbleElement = existingElement.querySelector('.chatBubble');
        if (bubbleElement) {
          bubbleElement.textContent = chatInstance.content;
        }
      }
    });
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
