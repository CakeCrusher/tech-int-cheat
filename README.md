# tech-int-cheat
A Chrome extension that pairs with OpenAI generative models (soon ChatGTP) to cheat on technical interviews

[Install via the Chrome Web Extension Store](https://chrome.google.com/webstore/detail/tech-int-cheat/ldignaknonbhlddmhbfpempkbkdmbopo?hl=en&authuser=0)

## Demo
https://user-images.githubusercontent.com/37946988/230748213-d10e9979-faa5-40b4-a622-396dfd877876.mp4

## How it works
Currently the extension only works on Google Meet and Zoom (only in the Zoom browser, not the Zoom desktop app).

### Usage Instructions:
1. Install the extension via the Chrome Web Store
2. Log into a Google Meet or Zoom meeting and enable Closed Captioning
   1. (IMPORTANT!) If you're using Zoom, the host will need to enable a few settings for the extension to work. They need to make these changes from their Zoom.us profile settings page not the desktop app. The desktop app doesn't have these options.
   2. The meeting host will need to enable the Live Transcription options (Closed Caption)
   3. The meeting host will need to enable the option to let you to join the meeting from your browser, not from the desktop app, since this is a browser extension only.
3. Speak into the microphone
4. Open the Tech-Int-Cheat extension on the browser toolbar and you'll see text bubbles.
5. Select which text you'd like to be sent to ChatGPT
6. Click 'Generate Response'
7. Wait for the response to be returned

## Issues of note
- Since it is dependent on Google Meet closed captions, if the closed captions are incorrect the chat will be too.

## TODO
- [x] allow you to select text to analyze
- [ ] refactor client to use a React build with TypeScript
- [ ] allow you to input your own OpenAI API key
- [ ] allow editing of the chat
- [ ] display answers on the meeting page
- [ ] anticipate questions and generate responses automatically

# Contributing
## Setup
Clone the [extension](https://github.com/CakeCrusher/tech-int-cheat) and [backend server](https://github.com/CakeCrusher/tech-int-cheat-backend) repos.

### Load the Extension in your Browser
- Install dependencies with `npm install`
- Build the extension with `npm run build` or `npm run watch` (note: Node supported version: 16.20.0)
- Go to your browser's extension page
- Toggle developer mode
- Click the 'Load Unpacked' button
- Select the generated `./build` folder in the extension directory

You may need to change the target for the request away from the AWS server to your local server, depending on what you're doing. If you need to do this, your local python server address/URL is probably `http://127.0.0.1:5000/infer_response`. Simply swap that out for the AWS URL.

### Backend Setup
- Navigate to flaskAPI root
- Make sure python and pip are installed
- Run `pip install -r requirements.txt` to install dependencies
- Run `python main.py` to run the flask server

You will probably need your own OpenAI API Key. The server checks for this key in the environmental vars, so you'll have to set that in your local env or simply override the API Key variable at the top of `main.py`.

### Making Changes

When you make a change to the extension, you will need to reload the extension (in the browser extension tab) and reload the Google Meet tab (in order for the extension on the toolbar to be reloaded). Remember to enable Closed Captioning when you get back into the meet again, each time.

If you want to see the console for the extension, you can open it up, right click, and inspect it. However, this will close that window everytime you navigate away from the extension. A better way to do this is to go to the Extension tab in your browser, and click "service worker", which will popup an inspection tab for the extension that will persist.

### Developer Notes
- If you want to see the console logs or use the debugger for content scripts (like background.js or content.js), you need to open up the extension developer console. Go to the browser extension page, click the 'Settings' or 'Details' button on the tech-int-cheat extension, and click the 'Service Worker' or 'Inspect Views' button and navigate to the console tab in the new window that will pop up.

### [2 hour live coding](https://youtu.be/9UeUDISNm1A)
### [5 hour live updating](https://www.youtube.com/watch?v=GiPevjughzc)

## How it works

![image](https://user-images.githubusercontent.com/37946988/207682493-a11d9229-96b1-4ead-9e8c-bdd571efe406.png)
![image](https://user-images.githubusercontent.com/37946988/230748250-56ef62d0-68f7-4f86-b064-aa6f893373e0.png)

[systems diagram](https://www.figma.com/file/H707JodSalGWCyAHyGVVfA/interview-cheat-chrome-extension?node-id=0%3A1&t=tvstjyEtM2OKomLB-1)

[Backend repo](https://github.com/CakeCrusher/tech-int-cheat-backend)
