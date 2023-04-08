const randomId = () => {
  let id = '';
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  for (let i = 0; i < 5; i++) {
    id += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return id;
}

// repeat every 1 second
const chat = []
setInterval(function () {
  try {
    const chatDivs = document.querySelectorAll('div.iOzk7');
    const ccContainer = Array.from(chatDivs).filter(div => {
      return div.style.display != 'none'
    })[0];
    let speakerContainers = ccContainer.querySelectorAll('.TBMuR.bj4p3b')
    // create a function that creates a random id of length 10

    speakerContainers.forEach(speaker => {
      console.log(speaker)
      const ticIdOnDiv = speaker.getAttribute('ticId');
      const ticId = ticIdOnDiv ? ticIdOnDiv : randomId();
      const name = speaker.querySelector('.jxFHg').textContent;
      const content = speaker.querySelector('.iTTPOb.VbkSUe').textContent;
      const chatInstance = { role: name, content: content.trim(), ticId }
      if (ticIdOnDiv) {
        const chatIndex = chat.findIndex(chatInstance => chatInstance.ticId === ticId);
        chat[chatIndex].content =  chatInstance.content;
      } else {
        chat.push(chatInstance);
        speaker.setAttribute('ticId', ticId);
      }
    });
    // send chat to service worker
    console.log(chat);
    chrome.runtime.sendMessage({ type: "CURRENT_CHAT", data: { chat } });
  } catch (e) {
    console.log("no CC", e);
  }
}, 1000);
