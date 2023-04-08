console.log("Popup!!")
// // send a message to the service worker of type "RECORD"

// const startBtn = document.getElementById("start_rec_btn");
// const statusSpan = document.getElementById("status");
// // add event listener to the button
// startBtn.addEventListener("click", function () {
//   statusSpan.innerText = "Recording...";
//   chrome.runtime.sendMessage({ type: "RECORD" });
// })

// // get element of id "btn"
// const btn = document.getElementById("btn");
// // add event listener to the button
// btn.addEventListener("click", function () {
//   statusSpan.innerText = "Awaiting results...";
//   chrome.runtime.sendMessage({ type: "STOP_RECORDING" });
// })

// listen to message with type "SUGGESTED_CODE"
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log("Popup received message", request)
  if (request.type === "FULL_CURRENT_CHAT") {
    // iterate through the chat and populate the chatContainer div with divs containing the class youChatInstance and interviewerChatInstance depending on the role, the text content of the div should be the content
    const chatContainer = document.getElementById("chatContainer");
    console.log("Popup chat: ", request.data.chat)
    // only add a new div if the ticId is not already in the chatContainer
    request.data.chat.forEach(chatInstance => {
      const chatDiv = document.createElement("div");
      chatDiv.innerText = chatInstance.content;
      if (chatInstance.role.toUpperCase() === "YOU") {
        chatDiv.classList.add("youChatInstance");
      } else {
        chatDiv.classList.add("interviewerChatInstance");
      }
      // add an attribute ticId with the value of the ticId
      chatDiv.setAttribute("ticId", chatInstance.ticId);
      console.log("Chat div: ", chatDiv)
      if (document.querySelector(`[ticId="${chatInstance.ticId}"]`) === null) {
        chatContainer.appendChild(chatDiv);
      }
    }
    );
    
  }
  if (request.type === "SUGGESTED_CODE") {
    // get element of id "code"
    statusSpan.innerText = "Idle";
    const code = document.getElementById("code");
    // set the innerHTML of the code element to the code
    code.innerText = request.code;
    console.log("Popup received message", request.code);
  }
})