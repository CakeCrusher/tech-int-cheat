console.log("Popup!!")

let chat = []
let startChat = null
let endChat = null;

// get element of id selectedIndexes
const startContentEx = document.getElementById("startContentEx");
const endContentEx = document.getElementById("endContentEx");

// check the current tab url
let meetId = null;
chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
  const currentTab = tabs[0];
  const url = currentTab.url;
  meetId = url.split('?')[0].split('/').pop();
});

const generateResponseBtn = document.getElementById("gernerateResponse");
// add event listener to the button of id gernerateResponse
generateResponseBtn.addEventListener("click", function () {
  // send a message to the service worker of type "GENERATE_RESPONSE" with the startChat and endChat
  chrome.runtime.sendMessage({ type: "GET_RESPONSE", data: { meetId, startChat, endChat } });
})


const selectChatInstance = (targetChatInstanceElement) => {
  // get ticId attribute from the targetChatInstanceElement
  const targetTicId = targetChatInstanceElement.getAttribute("ticid");
  const chatIndex = chat.findIndex(chatInstance => chatInstance.ticId === targetTicId);
  if (startChat === null) {
    startChat = chatIndex;
    targetChatInstanceElement.classList.add("selectedChatStart");
  } else if (endChat === null) {
    endChat = chatIndex;
    targetChatInstanceElement.classList.add("selectedChatEnd");
  } else {
    // find startChat and endChat divs and remove their respective classes
    const startChatDiv = document.querySelector(`[ticId="${chat[startChat].ticId}"]`);
    const endChatDiv = document.querySelector(`[ticId="${chat[endChat].ticId}"]`);
    startChatDiv.classList.remove("selectedChatStart");
    endChatDiv.classList.remove("selectedChatEnd");
    startChat = null;
    endChat = null;
  }

  console.log("startChat", startChat, "endChat", endChat)
  // updated the startContentEx and endContentEx with the content of the chatInstance
  startContentEx.innerText = startChat !== null ? chat[startChat].content : "";
  endContentEx.innerText = endChat !== null ? chat[endChat].content : "";
  // if both start chat and end chat exist then enable the generateResponseBtn
  if (startChat !== null && endChat !== null) {
    generateResponseBtn.disabled = false;
  } else {
    generateResponseBtn.disabled = true;
  }

}


chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === "FULL_CURRENT_CHATS" && meetId && request.data.chats[meetId]) {
    // iterate through the chat and populate the chatContainer div with divs containing the class youChatInstance and interviewerChatInstance depending on the role, the text content of the div should be the content
    const chatContainer = document.getElementById("chatContainer");
    // only add a new div if the ticId is not already in the chatContainer
    console.log("request.data.chat", request.data.chat)
    chat = request.data.chats[meetId]
    chat.forEach(chatInstance => {
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
      })
      
      if (document.querySelector(`[ticId="${chatInstance.ticId}"]`) === null) {
        chatContainer.appendChild(chatDiv);
      } else if (chatInstance.ticId) {
        // get the div with the ticId and update the innerText
        const existingChatDiv = document.querySelector(`[ticId="${chatInstance.ticId}"]`);
        existingChatDiv.innerText = chatInstance.content;
      }
    }
    );
  }
  if (request.type === "CHATGPT_RESPONSE") {
    // get the element of id "responseContext" and populate the inner text with startChat and endChat
    const responseContext = document.getElementById("responseContext");
    responseContext.innerText = `Response from chat " ${chat[startChat].content} " to " ${chat[endChat].content} "`;

    // get element of id "responseContainer" and populate the inner text with the response
    const responseContainer = document.getElementById("responseContainer");
    responseContainer.innerText = request.data.generatedResponse;
  }
})