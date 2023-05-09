import React, { useEffect, useRef, useState } from "react";
import Button from "@mui/material/Button";
import "./styles/main.css";

export const App = (): JSX.Element => {
  const [meetId, setMeetId] = useState<string>("");
  const [chat, setChat] = useState<any>([]);
  const [startChatIndex, setStartChatIndex] = useState<number | null>(null);
  const [endChatIndex, setEndChatIndex] = useState<number | null>(null);
  const [response, setResponse] = useState<any>(null);
  const handleIncomingMessageFromPage = (event: any) => {
    console.log("event", event.data);
    if (event.data.type === "FULL_CURRENT_CHATS") {
      if (!meetId) {
        setMeetId(event.data.data.meetId);
      }
      console.log("setChat", event.data.data.chats[event.data.data.meetId]);
      setChat(event.data.data.chats[event.data.data.meetId]);
    }
    // if type is CHATGPT_RESPONSE then set response
    if (event.data.type === "CHATGPT_RESPONSE") {
      setResponse(event.data.data);
    }
    // if it is a FAILED_RESPONSE then set response to "(Sorry response failed to generate please rejoin the meet and try again)"
    if (event.data.type === "FAILED_RESPONSE") {
      setResponse({
        generatedResponse:
          "(Sorry response failed to generate please rejoin the meet and try again)",
        startChatIndex: null,
        endChatIndex: null,
      });
    }
  };
  useEffect(() => {
    // trigger parent.postMessage({ type: "GET_CHATGPT_RESPONSE", data: { meetId } }, "*"); after one second has passed
    setTimeout(() => {
      parent.postMessage(
        { type: "GET_CHATGPT_RESPONSE", data: { meetId } },
        "*"
      );
    }, 500);

    parent.postMessage({ type: "APP_LOADED" }, "*");
    window.addEventListener("message", handleIncomingMessageFromPage);
    return () => {
      window.removeEventListener("message", handleIncomingMessageFromPage);
    };
  }, [setMeetId, setChat, setResponse, meetId]);

  console.log("popup chat", chat);

  const selectChatInstance = (index: number) => {
    // get ticId attribute from the targetChatInstanceElement
    if (startChatIndex === null) {
      setStartChatIndex(index);
    } else if (endChatIndex === null) {
      if (index < startChatIndex) {
        setStartChatIndex(index);
      } else {
        setEndChatIndex(index);
      }
    } else {
      setStartChatIndex(null);
      setEndChatIndex(null);
    }
  };

  const generateResponse = () => {
    parent.postMessage(
      {
        type: "GET_RESPONSE",
        data: { meetId, startChatIndex, endChatIndex },
      },
      "*"
    );
    setStartChatIndex(null);
    setEndChatIndex(null);
  };

  return (
    <div>
      <Button variant="contained">Hello World</Button>
      <h1>tech-int-cheat</h1>
      <div id="chatContainer">
        {chat.map((chatInstance: any, index: number) => {
          return (
            <div
              onClick={() => selectChatInstance(index)}
              key={chatInstance.ticId}
              className={`
                ${
                  chatInstance.role.toUpperCase() === "YOU"
                    ? "youChatInstance"
                    : "interviewerChatInstance"
                }
                  ${startChatIndex === index ? "selectedChatStart" : ""}
                  ${endChatIndex === index ? "selectedChatEnd" : ""}
              `}
            >
              {chatInstance.content}
            </div>
          );
        })}
      </div>
      <div>
        Selected indexes:{" "}
        <strong id="startContentEx">
          {startChatIndex !== null && chat[startChatIndex].content}
        </strong>{" "}
        ...
        <strong id="endContentEx">
          {endChatIndex !== null && chat[endChatIndex].content}
        </strong>
      </div>
      <button
        onClick={generateResponse}
        id="gernerateResponse"
        disabled={!Boolean(startChatIndex !== null && endChatIndex !== null)}
      >
        generate response
      </button>
      <div>
        Response indexes:{" "}
        <strong id="responseStartContentEx">
          {response &&
            response.startChatIndex !== null &&
            chat[response.startChatIndex].content}
        </strong>{" "}
        ...
        <strong id="responseEndContentEx">
          {response &&
            response.endChatIndex !== null &&
            chat[response.endChatIndex].content}
        </strong>
      </div>
      <div id="responseContainer">
        {(response && response.generatedResponse) ||
          "(Response will show here)"}
      </div>
    </div>
  );
};
