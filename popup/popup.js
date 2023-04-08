console.log("Popup!!");

let chat = [];
let startChat = null;
let endChat = null;

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

const reactToSelectedChats = () => {
  // remove the class selectedChatStart and selectedChatEnd from all the divs
  const chatInstances = document.querySelectorAll(
    ".youChatInstance, .interviewerChatInstance"
  );
  chatInstances.forEach((chatInstance) => {
    chatInstance.classList.remove("selectedChatStart");
    chatInstance.classList.remove("selectedChatEnd");
  });
  // find the startChat and endChat divs and add the class selectedChatStart and selectedChatEnd respectively
  if (startChat !== null) {
    const startChatInstance = document.querySelector(
      `[ticid="${chat[startChat].ticId}"]`
    );
    startChatInstance.classList.add("selectedChatStart");
  }
  if (endChat !== null) {
    const endChatInstance = document.querySelector(
      `[ticid="${chat[endChat].ticId}"]`
    );
    endChatInstance.classList.add("selectedChatEnd");
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
    // iterate through the chat and populate the chatContainer div with divs containing the class youChatInstance and interviewerChatInstance depending on the role, the text content of the div should be the content
    const chatContainer = document.getElementById("chatContainer");
    // only add a new div if the ticId is not already in the chatContainer
    chat = request.data.chats[meetId];

    // if there is nothing inside the responseContainer.innerText then send a message to the service worker of type "GET_CHATGPT_RESPONSE"
    if (responseContainer.innerText.includes("(Response will show here)")) {
      chrome.runtime.sendMessage({
        type: "GET_CHATGPT_RESPONSE",
        data: { meetId },
      });
    }

    chat.forEach((chatInstance) => {
      const chatDiv = document.createElement("div");
      chatDiv.innerText = chatInstance.content;
      if (chatInstance.role.toUpperCase() === "YOU") {
        chatDiv.classList.add("youChatInstance");
      } else {
        chatDiv.classList.add("interviewerChatInstance");
      }
      // add an attribute ticId with the value of the ticId
      chatDiv.setAttribute("ticId", chatInstance.ticId);

      chatDiv.addEventListener("click", function () {
        selectChatInstance(chatDiv);
      });

      if (document.querySelector(`[ticId="${chatInstance.ticId}"]`) === null) {
        chatContainer.appendChild(chatDiv);
      } else if (chatInstance.ticId) {
        // get the div with the ticId and update the innerText
        const existingChatDiv = document.querySelector(
          `[ticId="${chatInstance.ticId}"]`
        );
        existingChatDiv.innerText = chatInstance.content;
      }
    });
  }
  if (request.type === "CHATGPT_RESPONSE") {
    responseStartContentEx.innerText = chat[request.data.startChat].content;
    responseEndContentEx.innerText = chat[request.data.endChat].content;
    responseContainer.innerText = request.data.generatedResponse;
  }
});
