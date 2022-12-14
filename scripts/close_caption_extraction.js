// console.log("injected!!");

// repeat every 1 second
const messagesHistory = []
const messages = [];
setInterval(function () {
  // get the current message
  // console.log("Running script");
  try {
    const current_messages = document.querySelectorAll(
      "div div.Mz6pEf.wY1pdd div"
    )[0].children;
    for (let i = 0; i < current_messages.length - 1; i++) {
      const message = current_messages[i].innerText;
      if (!messages.includes(message) && !messagesHistory.includes(message)) {
        if (messages.length > 4) {
          const oldMessage = messages.shift();
          if (messagesHistory.length > 30){
            messagesHistory.shift();
          }
          messagesHistory.push(oldMessage);
        }
        messages.push(message);
        // console.log(message);
      }
    }
  } catch (e) {
    // console.log("no CC", e);
  }
  // console.log("Messages", messages);
  for (let i = 0; i < messages.length; i++) {
    if (messagesHistory.length > 30){
      messagesHistory.shift()
    }
    const messageToSend = messages.shift()
    // console.log("Sending message", messageToSend)
    chrome.runtime.sendMessage({ type: "CLOSED_CAPTION", message: messageToSend });
    messagesHistory.push(messageToSend);
  }
}, 1000);

// send message the service_worker titled "CLOSED_CAPTIONS" which sends "messages"
