import React, { useEffect, useState } from 'react';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';
import LoadingButton from '@mui/lab/LoadingButton';
import AutoFixHighIcon from '@mui/icons-material/AutoFixHigh';
import './styles/main.css';

export const App = (): JSX.Element => {
    const [meetId, setMeetId] = useState<string>('');
    const [chat, setChat] = useState<any>([]);
    const [startChatIndex, setStartChatIndex] = useState<number | null>(null);
    const [endChatIndex, setEndChatIndex] = useState<number | null>(null);
    const [response, setResponse] = useState<any>(null);
    const [loading, setLoading] = useState<boolean>(false);

    const handleIncomingMessageFromPage = (event: any) => {
        console.log('event', event.data);
        if (event.data.type === 'FULL_CURRENT_CHATS') {
            if (
                document.location.href.match('https://zoom.us/*') &&
                event.data.clientType === 'ZOOM'
            ) {
                if (!meetId) {
                    setMeetId(event.data.data.meetId);
                }
                setChat(event.data.data.chats[event.data.data.meetId]);
            } else if (
                document.location.href.match('https://meet.google.com/*') &&
                event.data.clientType === 'GOOGLE MEET'
            ) {
                if (!meetId) {
                    setMeetId(event.data.data.meetId);
                }
                setChat(event.data.data.chats[event.data.data.meetId]);
            }
        }
        // if type is CHATGPT_RESPONSE then set response
        if (event.data.type === 'CHATGPT_RESPONSE') {
            setLoading(false);
            setResponse(event.data.data);
        }
        // if it is a FAILED_RESPONSE then set response to "(Sorry response failed to generate please rejoin the meet and try again)"
        if (event.data.type === 'FAILED_RESPONSE') {
            setLoading(false);
            setResponse({
                generatedResponse:
                    'Sorry, there was a problem! Please try rejoining the meeting.',
                startChatIndex: null,
                endChatIndex: null,
            });
        }
    };
    useEffect(() => {
        // trigger parent.postMessage({ type: "GET_CHATGPT_RESPONSE", data: { meetId } }, "*"); after 500ms has passed
        setTimeout(() => {
            parent.postMessage(
                { type: 'GET_CHATGPT_RESPONSE', data: { meetId } },
                '*',
            );
        }, 500);

        parent.postMessage({ type: 'APP_LOADED' }, '*');
        window.addEventListener('message', handleIncomingMessageFromPage);
        return () => {
            window.removeEventListener(
                'message',
                handleIncomingMessageFromPage,
            );
        };
    }, [setMeetId, setChat, setResponse, meetId]);

    console.log('popup chat', chat);

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
                type: 'GET_RESPONSE',
                data: { meetId, startChatIndex, endChatIndex },
            },
            '*',
        );
        setLoading(true);
        setStartChatIndex(null);
        setEndChatIndex(null);
    };

    return (
        <div id='rootContainer'>
            {/* create a div that covers with classname handleContainer that contains DragIndicatorIcon of size large rotated 90 degrees and of color black */}
            <div className='handleContainer'>
                <DragIndicatorIcon
                    sx={{
                        fontSize: 'large',
                        transform: 'rotate(90deg)',
                        color: 'black',
                    }}
                />
            </div>
            <div
                style={{
                    margin: 0,
                }}
            >
                <h2
                    style={{
                        display: 'flex',
                        margin: 0,
                        justifyContent: 'center',
                    }}
                >
                    Tech Interview Cheat
                </h2>
                <h5
                    style={{
                        display: 'flex',
                        margin: 0,
                        justifyContent: 'center',
                        paddingBottom: '5px',
                    }}
                >
                    Coding is not about memorization
                </h5>
            </div>
            <div id='chatContainer'>
                {/* This extra div is to make the content in the parent div not need to be reversed, due to the 'column-reverse in #chatContainer  */}
                <div>
                    {chat?.map((chatInstance: any, index: number) => {
                        return (
                            <div
                                onClick={() => selectChatInstance(index)}
                                key={chatInstance.ticId}
                                className={`
                ${
                    chatInstance.role.toUpperCase() === 'YOU'
                        ? 'youChatInstance'
                        : 'interviewerChatInstance'
                }
                  ${startChatIndex === index ? 'selectedChatStart' : ''}
                  ${endChatIndex === index ? 'selectedChatEnd' : ''}
                  `}
                            >
                                {chatInstance?.content}
                            </div>
                        );
                    })}
                </div>
            </div>
            <div id='selectedIndexes'>
                <div>
                    {startChatIndex !== null ? (
                        <>
                            'Selection:'
                            <strong id='startContentEx'>
                                {startChatIndex !== null &&
                                    chat[startChatIndex]?.content}
                                ...
                            </strong>{' '}
                            <strong id='endContentEx'>
                                {endChatIndex !== null &&
                                    chat[endChatIndex]?.content}
                            </strong>
                        </>
                    ) : null}
                </div>
            </div>
            <div id='generateResponse'>
                <LoadingButton
                    size='small'
                    onClick={generateResponse}
                    endIcon={<AutoFixHighIcon />}
                    loading={loading}
                    loadingPosition='end'
                    variant='contained'
                >
                    Ask AI
                </LoadingButton>
            </div>
            <div
                style={{
                    display: 'flex',
                    justifyContent: 'center',
                    paddingBottom: '5px',
                    flexDirection: 'column',
                    textAlign: 'center',
                }}
            >
                {response && !startChatIndex ? (
                    <>
                        'Responding to:'
                        <strong id='responseStartContentEx'>
                            {response &&
                                response.startChatIndex !== null &&
                                chat[response.startChatIndex]?.content}
                        </strong>{' '}
                        {response ? '...' : null}
                        <strong id='responseEndContentEx'>
                            {response &&
                                response.endChatIndex !== null &&
                                chat[response.endChatIndex]?.content}
                        </strong>
                    </>
                ) : null}
            </div>
            <div id='responseContainer'>
                {(response && response.generatedResponse) ||
                    'Response will show here'}
            </div>
        </div>
    );
};
