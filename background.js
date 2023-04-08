console.log("Background!!");
// listen for messages from the content script of type "CLOSED_CAPTIONS"
let isRecording = false;
let allMessages = [];
let chat = []
chrome.runtime.onMessage.addListener(async (request, sender, sendResponse) => {
  // if request is of type CURRENT_CHAT then concat on the ticId
  if (request.type === "CURRENT_CHAT") {
    const passedChat = request.data.chat;
    passedChat.forEach(passedChatInstance => {
      const chatIndex = chat.findIndex(chatInstance => chatInstance.ticId === passedChatInstance.ticId);
      if (chatIndex > -1) {
        chat[chatIndex].content =  passedChatInstance.content;
      } else {
        chat.push(passedChatInstance);
      }
    });
    console.log("Background chat: ", chat)
    chrome.runtime.sendMessage({ type: "FULL_CURRENT_CHAT", data: { chat } });
  }
  if (request.type === "CLOSED_CAPTION") {
    if (isRecording) {
      allMessages.push(request.message);
    }
    // console.log("Background received message", request.message);
  }
  if (request.type === "RECORD") {
    isRecording = true;
    console.log("Began recording", isRecording);
  }
  if (request.type === "STOP_RECORDING") {
    isRecording = false;
    if (allMessages.length > 0) {
      const command = allMessages.join("");
      // make a  request get request to the url "https://tech-int-cheat-backend.herokuapp.com/infer_code?command=build%20a%20function%20that%20returns%20buzz%20if%20the%20input%20is%20divisible%20by%207%2C%20and%20fizz%20if%20the%20input%20is%20divisible%20by%205%2C%20and%20fizzbuzz%20if%20the%20input%20is%20divisible%20by%20both%205%20and%207.%20Otherwise%2C%20return%20the%20input.%20For%20example%2C%20if%20the%20input%20is%203%2C%20the%20output%20should%20be%203.%20If%20the%20input%20is%205%2C%20the%20output%20should%20be%20fizz.%20If%20the%20input%20is%2015%2C%20the%20output%20should%20be%20fizzbuzz.%20If%20the%20input%20is%207%2C%20the%20output%20should%20be%20buzz."
      console.log("Command: ", command);
      const response = await fetch(
        `https://tech-int-cheat-backend.herokuapp.com/infer_code?command=${command}.`
      );
      const body = await response.json();
      // console.log("Response: ", body);
      allMessages = [];
      console.log("Finished recording", isRecording);
      // // send message of type "SUGGESTED_CODE" to the with content "Hello from background!"
      chrome.runtime.sendMessage({ type: "SUGGESTED_CODE", code: body.output });
    } else {
      console.log("No messages");
    }
  } 
});
