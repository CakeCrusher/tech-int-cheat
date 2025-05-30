console.log("Background!!");

let chats = {}; // { meetId: [ { ticId, role, content, isCurrentUser } ] }
let speakers = {}; // { meetId: [speakerNames] }
let chatGptResponses = {}; // { meetId: { generatedResponse, startChat, endChat } }
chrome.runtime.onMessage.addListener(async (request, sender, sendResponse) => {
  // if request is of type CURRENT_CHAT then concat on the ticId
  if (request.type === "CURRENT_CHAT") {
    console.log("CURRENT_CHAT", request.data.chat)
    const meetId = request.data.meetId;
    const passedChat = request.data.chat;
    const passedSpeakers = request.data.speakers;
    
    if (!chats[meetId]) {
      chats[meetId] = [];
    }
    
    // Update speakers list
    if (passedSpeakers) {
      speakers[meetId] = passedSpeakers;
    }
    
    const chat = chats[meetId];
    passedChat.forEach((passedChatInstance) => {
      const chatIndex = chat.findIndex(
        (chatInstance) => chatInstance.ticId === passedChatInstance.ticId
      );
      if (chatIndex > -1) {
        chat[chatIndex].content = passedChatInstance.content;
        chat[chatIndex].isCurrentUser = passedChatInstance.isCurrentUser;
      } else {
        chat.push(passedChatInstance);
      }
    });
    chrome.runtime.sendMessage({ 
      type: "FULL_CURRENT_CHATS", 
      data: { 
        chats,
        speakers: speakers[meetId] || []
      } 
    });
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
        delete currentChatInstance.isCurrentUser;
        preprocessedChatSlice.push(currentChatInstance);
        i++;
      }
    }

    console.log("preprocessedChatSlice", preprocessedChatSlice)

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
    console.log("responseJson", responseJson)
    const generatedResponse = responseJson.response;
    
    // if response fails then send a message for FAILED_RESPONSE
    if (!generatedResponse) {
      chrome.runtime.sendMessage({
        type: "FAILED_RESPONSE"
      });
      return;
    } else {
      // send the generatedResponse back to the popup
      chatGptResponses[meetId] = { generatedResponse, startChat, endChat };
      chrome.runtime.sendMessage({
        type: "CHATGPT_RESPONSE",
        data: chatGptResponses[meetId],
      });
    }

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
