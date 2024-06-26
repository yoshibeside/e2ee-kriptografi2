import { useRef, useState } from "react";
import { useContext } from "react";
import { Stack } from "react-bootstrap";
import { AuthContext } from "../../context/AuthContext";
import { ChatContext } from "../../context/ChatContext";
import { useFetchRecipientUser } from "../../hooks/useFetchRecipient";
import moment from "moment";
import InputEmoji from "react-input-emoji";
import { useEffect } from "react";
import { Tooltip } from "react-tooltip";

const ChatBox = () => {
  const { user } = useContext(AuthContext);
  const { currentChat, messages, sendTextMessage, isMessagesLoading, clickVerify, verified, inputSign, updateMessage, insertKeys } =
    useContext(ChatContext);
  const { recipientUser } = useFetchRecipientUser(currentChat, user);
  const [textMessage, setTextMessage] = useState("");
  const scroll = useRef();

  useEffect(() => {
    scroll.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const getElement = (messageId, text, r, s, senderId) => {
    if (senderId == user._id) 
      return (
        <button 
          className="message-header text-green-500 hover:text-green-600" 
          data-tooltip-id="verified-message"
          data-tooltip-variant="info">
          Signed
        </button>
      ) 
    if (!verified.find((id) => id==messageId)) 
    return (
      <button 
        className="message-header text-yellow-500 hover:text-yellow-600" 
        data-tooltip-id="unverified-message"
        data-tooltip-variant="info"
        onClick={() => clickVerify(messageId, text, r, s)}>
        Unverified
    </button>
    )
    return (
      <button 
        className="message-header text-green-500 hover:text-green-600" 
        data-tooltip-id="verified-message"
        data-tooltip-variant="info">
        Verified
      </button>
    )
  }

  if (!recipientUser)
    return (
      <p style={{ textAlign: "center", width: "100%" }}>
        No conversation selected yet..
      </p>
    );

  if (isMessagesLoading){
    return (
      <p style={{ textAlign: "center", width: "100%" }}>Loading chat...</p>
    );

  } else {
      return (
        <Stack gap={4} className="chat-box">
          <Stack direction="horizontal" className="justify-between">
            <div className="chat-header w-full">
              <strong className="ml-40 p-2">{recipientUser?.name}</strong>
            </div>  
            <div className="chat-header w-1/4"> 
              <button className=" bg-violet-800 p-2.5 text-sm rounded-md hover:bg-violet-900" onClick={()=>insertKeys(user._id, currentChat.members.find((m) => m !== user._id))}>Update Key</button>
            </div>
          </Stack>
          
          <Stack gap={3} className="messages">
            {!messages && <p>No messages yet..</p>}
            {messages &&
              messages?.map((message, index) => (
                <Stack
                  className={`${
                    message?.senderId === user?._id
                      ? "message self align-self-end flex-grow-0"
                      : "message align-self-start flex-grow-0"
                  }`}
                  key={index}
                  ref={scroll}
                >
                  {message?.signed? (
                    getElement(message._id, message?.text, BigInt(message.signed.r),BigInt( message.signed.s), message?.senderId)
                  ) : null }
                  
                  <span>{message.text}</span>
                  <span className="message-footer">
                    {moment(message.createdAt).calendar()}
                  </span>
                </Stack>
              ))}
    
              <Tooltip id="unverified-message">
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                  }}
                >
                  <span>
                    Verify the message <b>with</b> Schnorr's
                  </span>
                </div>
              </Tooltip>
    
              <Tooltip id="verified-message">
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                  }}
                >
                  <span>
                    Message Verified
                  </span>
                </div>
              </Tooltip>
    
          </Stack>
          <Stack direction="horizontal" className="chat-input flex-grow-0" gap={2}>
            <InputEmoji
              value={textMessage}
              onChange={setTextMessage}
              fontFamily="nunito"
              borderColor="rgba(72, 112, 223, 0.2)"
            />
            <button
              className="send-btn-schnorr flex justify-center"
              onClick={() => {
                updateMessage(textMessage, currentChat._id)
                setTextMessage("")
                inputSign()
              }}
              data-tooltip-id="schnorr-send-message"
              data-tooltip-variant="info"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                fill="currentColor"
                className="bi bi-send-fill"
                viewBox="0 0 16 16"
              >
                <path d="M15.964.686a.5.5 0 0 0-.65-.65L.767 5.855H.766l-.452.18a.5.5 0 0 0-.082.887l.41.26.001.002 4.995 3.178 3.178 4.995.002.002.26.41a.5.5 0 0 0 .886-.083l6-15Zm-1.833 1.89L6.637 10.07l-.215-.338a.5.5 0 0 0-.154-.154l-.338-.215 7.494-7.494 1.178-.471-.47 1.178Z" />
              </svg>
            </button>
            <button
              className="send-btn flex justify-center"
              onClick={() => {
                sendTextMessage(textMessage, user, currentChat._id, setTextMessage);
              }}
              data-tooltip-id="normal-send-message"
              data-tooltip-variant="info"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                fill="currentColor"
                className="bi bi-send-fill"
                viewBox="0 0 16 16"
              >
                <path d="M15.964.686a.5.5 0 0 0-.65-.65L.767 5.855H.766l-.452.18a.5.5 0 0 0-.082.887l.41.26.001.002 4.995 3.178 3.178 4.995.002.002.26.41a.5.5 0 0 0 .886-.083l6-15Zm-1.833 1.89L6.637 10.07l-.215-.338a.5.5 0 0 0-.154-.154l-.338-.215 7.494-7.494 1.178-.471-.47 1.178Z" />
              </svg>
            </button>
            <Tooltip id="schnorr-send-message">
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                }}
              >
                <span>
                  Send message <b>with</b> Schnorr's
                </span>
                <span>Scheme digital signature</span>
              </div>
            </Tooltip>
            <Tooltip id="normal-send-message">
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                }}
              >
                <span>
                  Send message <b>without</b>
                </span>
                <span>digital signature</span>
              </div>
            </Tooltip>
          </Stack>
        </Stack>
      );
    };
  }

export default ChatBox;
