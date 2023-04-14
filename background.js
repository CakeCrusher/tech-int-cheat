console.log("Background!!");

let chats = {}; // { meetId: [ { ticId, role, content } ] }
let chatGptResponses = {}; // { meetId: { generatedResponse, startChat, endChat } }
chrome.runtime.onMessage.addListener(async (request, sender, sendResponse) => {
  // if request is of type CURRENT_CHAT then concat on the ticId
  if (request.type === "CURRENT_CHAT") {
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
    chrome.runtime.sendMessage({ type: "FULL_CURRENT_CHATS", data: { chats } });
  }
  if (request.type === "GET_RESPONSE") {
    const { meetId, startChat, endChat } = request.data;
    // get the slice of chat from startChat to endChat and make a deep copy of it
    const chat = chats[meetId];
    const chatSlice = JSON.parse(
      JSON.stringify(chat.slice(startChat, endChat + 1))
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

    // send the preprocessedChatSlice to the backend https://635f-68-234-232-23.ngrok.io/infer_response and pass the preprocessedChatSlice as the json body
    const response = await fetch(
      `https://t23m9fecmc.execute-api.us-east-2.amazonaws.com/Prod/infer_response`,
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
    const generatedResponse = responseJson.response;

    // send the generatedResponse back to the popup
    chatGptResponses[meetId] = { generatedResponse, startChat, endChat };
    chrome.runtime.sendMessage({
      type: "CHATGPT_RESPONSE",
      data: chatGptResponses[meetId],
    });
  }
  // if request is of type GET_RESPONSE then send the response back to the popup
  if (request.type === "GET_CHATGPT_RESPONSE") {
    const { meetId } = request.data;
    if (chatGptResponses[meetId]) {
      chrome.runtime.sendMessage({
        type: "CHATGPT_RESPONSE",
        data: chatGptResponses[meetId],
      });
    }
  }
});
