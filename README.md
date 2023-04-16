# tech-int-cheat
A chrome extension that pairs with OpenAI generative models (soon ChatGTP) to cheat on technical interviews

## Demo


https://user-images.githubusercontent.com/37946988/230748213-d10e9979-faa5-40b4-a622-396dfd877876.mp4

## How it works
Currently it only works on google meet as it depends on its closed captions,  therefore you must turn closed captions on. Then the chat will start getting recorded. Then select the start and end of chat to prompt chatgpt with, finally press generate response. Wait a couple of seconds, and you will have your response.

## Issues of note
- Since it is dependant on Google Meet closed captions, if the closed captions are incorrect the chat will be too. 

## TODO
- [x] allow you to select text to analyze
- [ ] refactor client to use a React build with TypeScript
- [ ] allow you to input your own OpenAI API key
- [ ] allow editing of the chat
- [ ] display answers on the meeting page
- [ ] anticipate questions and generate responses automatically
 
### [2 hour live coding](https://youtu.be/9UeUDISNm1A)
### [5 hour live updating](https://www.youtube.com/watch?v=GiPevjughzc)

## How it works

![image](https://user-images.githubusercontent.com/37946988/207682493-a11d9229-96b1-4ead-9e8c-bdd571efe406.png)
![image](https://user-images.githubusercontent.com/37946988/230748250-56ef62d0-68f7-4f86-b064-aa6f893373e0.png)

[systems diagram](https://www.figma.com/file/H707JodSalGWCyAHyGVVfA/interview-cheat-chrome-extension?node-id=0%3A1&t=tvstjyEtM2OKomLB-1)

[Backend repo](https://github.com/CakeCrusher/tech-int-cheat-backend)
