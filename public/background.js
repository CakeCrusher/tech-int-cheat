/* global chrome */
chrome.action.onClicked.addListener(function (tab) {
  chrome.tabs.sendMessage(tab.id, { message: "load" });
});

chrome.webNavigation.onCompleted.addListener(function (details) {
  if (details.frameId === 0) {
    chrome.storage.sync.get(["currentPage"], (data) => {
      if (details.url.includes(data.currentPage)) {
        chrome.tabs.sendMessage(details.tabId, { message: "load" });
      }
    });
  }
});

const dataToSend = (data) => {
  chrome.tabs.query({}, function (tabs) {
    tabs.forEach((tab) => {
      chrome.tabs.sendMessage(tab.id, data);
    });
  });
};

console.log("Background!!");

let chats = {}; // { meetId: [ { ticId, role, content } ] }
let chatGptResponses = {}; // { meetId: { generatedResponse, startChatIndex, endChatIndex } }
chrome.runtime.onMessage.addListener(async (request, sender, sendResponse) => {
  // if request is of type CURRENT_CHAT then concat on the ticId
  if (request.type === "CURRENT_CHAT") {
    console.log("CURRENT_CHAT", request.data.chat);
    const meetId = request.data.meetId;
    const passedChat = request.data.chat;
    if (!chats[meetId]) {
      chats[meetId] = [];
    }
    const chat = chats[meetId];
    passedChat.forEach((passedChatInstance) => {
      const chatIndex = chat.findIndex(
        (chatInstance) => chatInstance.ticId === passedChatInstance.ticId
      );
      if (chatIndex > -1) {
        chat[chatIndex].content = passedChatInstance.content;
      } else {
        chat.push(passedChatInstance);
      }
    });
    // get the tab url of each tab
    chrome.tabs.query({}, function (tabs) {
      tabs.forEach((tab) => {
        const url = tab.url;
        const meetId = url.split("?")[0].split("/").pop();
        chrome.tabs.sendMessage(tab.id, {
          type: "FULL_CURRENT_CHATS",
          data: { chats, meetId },
        });
      });
    });
  }
  if (request.type === "GET_RESPONSE") {
    const { meetId, startChatIndex, endChatIndex } = request.data;
    // get the slice of chat from startChat to endChat and make a deep copy of it
    const chat = chats[meetId];
    const chatSlice = JSON.parse(
      JSON.stringify(chat.slice(startChatIndex, endChatIndex + 1))
    );
    // preprocess the chatSlice so that any recurring roles are merged into one
    const preprocessedChatSlice = [];
    let i = 0;
    let currentChatInstance = null;
    while (i < chatSlice.length) {
      currentChatInstance = chatSlice[i];
      const nextChatInstance = chatSlice[i + 1];
      if (
        nextChatInstance &&
        currentChatInstance.role === nextChatInstance.role
      ) {
        currentChatInstance.content += " " + nextChatInstance.content;
        chatSlice.splice(i + 1, 1);
      } else {
        delete currentChatInstance.ticId;
        preprocessedChatSlice.push(currentChatInstance);
        i++;
      }
    }

    console.log("preprocessedChatSlice", preprocessedChatSlice);

    // send the preprocessedChatSlice to the backend https://635f-68-234-232-23.ngrok.io/infer_response and pass the preprocessedChatSlice as the json body
    const response = await fetch(
      `https://tech-int-cheat-backend.herokuapp.com/infer_response`,
      {
        method: "POST",
        mode: "cors",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(preprocessedChatSlice),
      }
    );
    const responseJson = await response.json();
    console.log("responseJson", responseJson);
    const generatedResponse = responseJson.response;

    // if response fails then send a message for FAILED_RESPONSE
    if (!generatedResponse) {
      dataToSend({
        type: "FAILED_RESPONSE",
      });
      return;
    } else {
      // send the generatedResponse back to the popup
      chatGptResponses[meetId] = {
        generatedResponse,
        startChatIndex,
        endChatIndex,
      };
      dataToSend({
        type: "CHATGPT_RESPONSE",
        data: chatGptResponses[meetId],
      });
    }
  }
  // if request is of type GET_RESPONSE then send the response back to the popup
  if (request.type === "GET_CHATGPT_RESPONSE") {
    const { meetId } = request.data;
    if (chatGptResponses[meetId]) {
      dataToSend({
        type: "CHATGPT_RESPONSE",
        data: chatGptResponses[meetId],
      });
    }
  }
});
