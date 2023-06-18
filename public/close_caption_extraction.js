const randomId = () => {
    let id = '';
    const characters =
        'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    for (let i = 0; i < 5; i++) {
        id += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return id;
};

if (document.location.href.match('https://zoom.us/*')) {
    console.log('STARTING IN ZOOM');

    const chat = [];
    const tempChat = {};

    setInterval(function () {
        try {
            const chatDiv = document.getElementsByClassName(
                'live-transcription-subtitle__item',
            );

            if (!chatDiv || chatDiv[0]?.innerHTML?.length < 1) {
                console.log('no chatDivs');
                return;
            }
            // debugger;

            // const ccContainer = Array.from(chatDivs).filter((div) => {
            //     return div.style.display != 'none';
            // })[0];
            // let speakerContainers =
            //     ccContainer.querySelectorAll('.TBMuR.bj4p3b');
            // create a function that creates a random id of length 10

            // speakerContainers.forEach((speaker) => {
            // const ticIdOnDiv = speaker.getAttribute('ticId');
            const ticId = randomId();
            // We're grabbing directly from the HTML so we don't know who is speaking. So, we're defaulting to one user role.
            const name = 'assistant';
            const content = chatDiv[0].innerHTML;

            if (content === 'Live Transcription is turned on') {
                return;
            }

            if (!tempChat[ticId]) {
                tempChat[ticId] = { content: [], timeModified: Date.now() };
            }

            tempChat[ticId].content.push(content);
            tempChat[ticId].timeModified = Date.now();

            const chatInstance = {
                role: name,
                content: tempChat[ticId].content,
                ticId,
            };
            // if (ticIdOnDiv) {
            // const chatIndex = chat.findIndex(
            //     (chatInstance) => chatInstance.ticId === ticId,
            // );
            // chat[chatIndex].content = chatInstance.content;
            // } else {
            chat.push(chatInstance);
            console.log(
                `//speakerContainers.forEach ~ chatInstance:`,
                chatInstance,
            );
            // speaker.setAttribute('ticId', ticId);
            // }
            // });
            // cleanup tempChat if any ticId has not been modified in the last 10 seconds
            Object.keys(tempChat).forEach((ticId) => {
                if (Date.now() - tempChat[ticId].timeModified > 10000) {
                    delete tempChat[ticId];
                }
            });
            // send chat to service worker
            const meetId = window.location.href.split('/')[4];
            console.log('sending chat', chat);
            chrome.runtime.sendMessage({
                type: 'CURRENT_CHAT',
                data: { chat, meetId },
                clientType: 'ZOOM',
            });
        } catch (e) {
            // console.log("no CC", e);
        }
    }, 1000);
} else if (document.location.href.match('https://meet.google.com/*')) {
    // repeat every 1 second
    const chat = [];
    const tempChat = {}; // {ticId: {content: ["", ...], timeModified: Date }}
    setInterval(function () {
        try {
            const chatDivs = document.querySelectorAll('div.iOzk7');
            const ccContainer = Array.from(chatDivs).filter((div) => {
                return div.style.display != 'none';
            })[0];
            let speakerContainers =
                ccContainer.querySelectorAll('.TBMuR.bj4p3b');
            // create a function that creates a random id of length 10

            speakerContainers.forEach((speaker) => {
                const ticIdOnDiv = speaker.getAttribute('ticId');
                const ticId = ticIdOnDiv ? ticIdOnDiv : randomId();
                const name = speaker.querySelector('.jxFHg').textContent;
                const content = speaker.querySelector('.iTTPOb.VbkSUe');
                console.log(`speakerContainers.forEach ~ content:`, content);
                // for each span within content that does not contain ticAdded, add its text content to the tempChat[ticId].content array and mark it as added by adding an attribute ticAdded to it
                // for the last span replace the last element of the tempChat[ticId].content array with the text content of the last span
                if (!tempChat[ticId]) {
                    tempChat[ticId] = { content: [], timeModified: Date.now() };
                }
                for (let i = 0; i < content.children.length; i++) {
                    const span = content.children[i];
                    if (!span.getAttribute('ticAdded')) {
                        tempChat[ticId].content.push(span.textContent);
                        span.setAttribute('ticAdded', true);
                        tempChat[ticId].timeModified = Date.now();
                    } else if (i === content.children.length - 1) {
                        tempChat[ticId].content[
                            tempChat[ticId].content.length - 1
                        ] = span.textContent;
                        tempChat[ticId].timeModified = Date.now();
                    }
                }
                const chatInstance = {
                    role: name,
                    content: tempChat[ticId].content.join(' '),
                    ticId,
                };
                // const chatInstance = { role: name, content: content.trim(), ticId };
                if (ticIdOnDiv) {
                    const chatIndex = chat.findIndex(
                        (chatInstance) => chatInstance.ticId === ticId,
                    );
                    chat[chatIndex].content = chatInstance.content;
                } else {
                    chat.push(chatInstance);
                    speaker.setAttribute('ticId', ticId);
                }
            });
            // cleanup tempChat if any ticId has not been modified in the last 10 seconds
            Object.keys(tempChat).forEach((ticId) => {
                if (Date.now() - tempChat[ticId].timeModified > 10000) {
                    delete tempChat[ticId];
                }
            });
            // send chat to service worker
            const meetId = window.location.href.split('?')[0].split('/').pop();
            console.log('sending chat', chat);
            chrome.runtime.sendMessage({
                type: 'CURRENT_CHAT',
                data: { chat, meetId },
                clientType: 'GOOGLE MEET',
            });
        } catch (e) {
            // console.log("no CC", e);
        }
    }, 1000);
}
