import { useCallback, useContext, useEffect, useState } from "react";
import { createContext } from "react";
import { baseUrl, getRequest, postRequest } from "../utils/service";
import { ConContext } from "./ConContext";
import { encryptMessage, decryptMessage } from "../lib/ecc_helper.js";
import { encrypt, decrypt } from "../lib/als_helper.js";
import SchnorrSignature from "../lib/schnorr.js";

export const ChatContext = createContext();

export const ChatContextProvider = ({ children, user }) => {
  const {sharedKey, socket} = useContext(ConContext);
  const [userChats, setUserChats] = useState(null);
  const [isUserChatsLoading, setIsUserChatsLoading] = useState(false);
  const [userChatsError, setUserChatsError] = useState(null);
  const [currentChat, setCurrentChat] = useState(null);
  const [messages, setMessages] = useState(null);
  const [messagesError, setMessagesError] = useState(null);
  const [isMessagesLoading, setIsMessagesLoading] = useState(false);
  // const [socket, setSocket] = useState(null);
  const [onlineUsers, setOnlineUsers] = useState(null);
  const [sendTextMessageError, setSendTextMessageError] = useState(null);
  const [newMessage, setNewMessage] = useState(null);
  const [potentialChats, setPotentialChats] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [text, setText] = useState("");
  const [chatId, setChatId] = useState("");
  const [signature, setSignature] = useState({r: null, s: null})
  const [Schnorr, setSchnorr] = useState(null);

  const [showModal, setShowModal] = useState({
    bool: false,
    sender: null,
    receiver: null,
  });
  const [showSchnorr, setShowSchnorr] = useState(false);
  const [showSchnorrPr, setShowSchnorrPr] = useState(false);


  // create a state model for the private, public, and partner's public key in each chat id
  const [keys, setKeys] = useState([]);

  // create a state model for the private, public, and partner's public key in each chat id
  const [verified, setVerified] = useState([]);
  const [idMessage, setIdMessage] = useState("");

  // Helper function to store plain text messages in local storage
  const storeMessageLocally = (chatId, message, createdAt, senderId) => {
    const chatHistory = JSON.parse(localStorage.getItem("chatHistory")) || {};
    if (!chatHistory[chatId]) {
      chatHistory[chatId] = [];
    }
    chatHistory[chatId].push({ text: message, createdAt, senderId });
    localStorage.setItem("chatHistory", JSON.stringify(chatHistory));
  };

  // Fetch plain text messages from local storage
  const fetchLocalMessages = (chatId) => {
    const chatHistory = JSON.parse(localStorage.getItem("chatHistory")) || {};
    return chatHistory[chatId] || [];
  };

  useEffect(() => {
    const getParams = async () => {
      const response = await getRequest(
        `${baseUrl}/schnorr/params`
      );

      if (response.error) {
        return setMessagesError(response.error);
      }
      setSchnorr(new SchnorrSignature(BigInt(response.p), BigInt(response.q), BigInt(response.alpha)));
    }
    getParams();
  }, []);


  // set online users
  useEffect(() => {
    const key = localStorage.getItem("sharedKey")
    if (!socket || !user?._id || !key || !sharedKey ) return;
    socket.emit("addNewUser", encrypt({ encrypted: user._id }, key));
    socket.on("getUsers", (res) => {
      const response = decrypt(res.encrypted, localStorage.getItem("sharedKey"))
      const objects = JSON.parse(response)
      setOnlineUsers(objects);
    });

    return () => {
      socket.off("getUsers");
    };
  }, [sharedKey, socket, user]);

  // send message
  useEffect(() => {
    if (socket === null) return;

    const recipientId = currentChat?.members.find((id) => id !== user?._id);

    socket.emit("sendMessage", encrypt({ ...newMessage, recipientId }, localStorage.getItem("sharedKey")));
  }, [newMessage]);

  // receive message and notifications
  useEffect(() => {
    if (socket === null) return;

    socket.on("getMessage", (res) => {
      const response = decrypt(res.encrypted, localStorage.getItem("sharedKey"))
      if (currentChat?._id !== response.chatId) return;

      const encryptedMessageString = response.text;
      const encryptedChunks = JSON.parse(encryptedMessageString).map(
        (chunk) => ({
          kG: chunk.kG.map((coord) => BigInt(`0x${coord}`)),
          PmPluskPb: chunk.PmPluskPb.map((coord) => BigInt(`0x${coord}`)),
        })
      );

      const decryptedMessage = decryptMessage(
        keys[0].privateKey,
        encryptedChunks
      );

        setMessages((prev) => [...prev, { ...response, text: decryptedMessage }]);
    });

    socket.on("getNotification", (res) => {
      const response = decrypt(res.encrypted, localStorage.getItem("sharedKey"))
      const isChatOpen = currentChat?.members.some((Id) => Id === response.senderId);

      if (isChatOpen) {
        setNotifications((prev) => [{ ...response, isRead: true }, ...prev]);
      } else {
        setNotifications((prev) => [response, ...prev]);
      }
    });

    return () => {
      socket.off("getMessage");
      socket.off("getNotification");
    };
  }, [socket, currentChat, keys]);

  useEffect(() => {
    const getKeys = async () => {
      if (!currentChat) return;
      if (keys.find((k) => k.chatId === currentChat?._id)) {
        return;
      } else {
        setShowModal({
          bool: true,
          sender: user._id,
          receiver: currentChat.members.find((m) => m !== user._id),
        });
        setIsMessagesLoading(true);
      }
    };

    getKeys();
  }, [currentChat]);

  useEffect(() => {
    if (!currentChat) return;
    if (!keys.find((k) => k.chatId === currentChat?._id)) return;
    if (showModal.bool) return;

    const getMessages = async () => {
      const response = await getRequest(
        `${baseUrl}/messages/${currentChat?._id}`
      );

      setIsMessagesLoading(false);

      if (response.error) {
        return setMessagesError(response.error);
      }

      const localMessages = fetchLocalMessages(currentChat?._id);
      const decryptedResponse = response.map((item) => {
        const encryptedMessageString = item.text;
        const encryptedChunks = JSON.parse(encryptedMessageString).map(
          (chunk) => ({
            kG: chunk.kG.map((coord) => BigInt(`0x${coord}`)),
            PmPluskPb: chunk.PmPluskPb.map((coord) => BigInt(`0x${coord}`)),
          })
        );
        const decryptedMessage = decryptMessage(
          keys[0].privateKey,
          encryptedChunks
        );
        return {
          ...item,
          text: decryptedMessage,
        };
      });

      // Combine messages and override the text portion if timestamps match
      const combinedMessages = decryptedResponse.map((message) => {
        const localMessage = localMessages.find(
          (local) => local.createdAt === message.createdAt && local.senderId === message.senderId
        );
        return localMessage ? { ...message, text: localMessage.text } : message;
      });

      combinedMessages.sort(
        (a, b) => new Date(a.createdAt) - new Date(b.createdAt)
      );

      setMessages(combinedMessages);
    };

    getMessages();
  }, [currentChat, keys, showModal.bool]);

  useEffect(() => {
    const getUsers = async () => {
      const response = await getRequest(`${baseUrl}/users`);

      if (response.error) {
        return console.log("Error fetching users:", response);
      }

      if (userChats) {
        const pChats = response?.filter((u) => {
          let isChatCreated = false;

          if (user._id === u._id) return false;

          isChatCreated = userChats?.some(
            (chat) => chat.members[0] === u._id || chat.members[1] === u._id
          );

          return !isChatCreated;
        });

        setPotentialChats(pChats);
      }

      setAllUsers(response);
    };

    getUsers();
  }, [userChats]);

  useEffect(() => {
    const getUserChats = async () => {
      setIsUserChatsLoading(true);
      setUserChatsError(null);

      if (user?._id) {
        const userId = user?._id;

        const response = await getRequest(`${baseUrl}/chats/${userId}`);

        if (response.error) {
          return setUserChatsError(response);
        }

        setUserChats(response);
      }

      setIsUserChatsLoading(false);
    };

    getUserChats();
  }, [user, notifications]);

  const updateCurrentChat = useCallback(async (chat) => {
    setCurrentChat(chat);
  }, []);

  const inputSign = useCallback(() => {
    setShowSchnorrPr(true);
  }, []);

  const sign = useCallback((privateKey) => {
    if (!privateKey) return
    const pair = Schnorr.sign(privateKey, text);

    if (!pair) {
      closeSchnorr();
      return ("Error signing message")
    }
    sendTextMessage(text, user, chatId, setText, (pair.r).toString(), pair.s.toString());
    closeSchnorr();
  }, [text, chatId, signature, Schnorr]);

  const closeSchnorr = useCallback(() => {
    setShowSchnorr(false);
    setShowSchnorrPr(false);
  }, []);

  const verifying = useCallback((publicKey) => {
    if (!text || !{signature} || !publicKey) return;
    const verified = Schnorr.verify(publicKey, text, signature);
    if (verified) {
      setVerified((prev) => [...prev, idMessage]);
      closeSchnorr();
    } else {
      closeSchnorr();
      return ("Error verifying message")
    }
  }, [text, signature, idMessage, Schnorr]);

  const clickVerify = useCallback((idMessage, message, r, s) => {
    setSignature({r, s});
    setText(message);
    setIdMessage(idMessage);
    setShowSchnorr(true);
  }, []);

  const addKey = useCallback(
    (privateKey, partnerPublicKey, currentChat) => {
      setKeys((prev) => [
        ...prev,
        { chatId: currentChat._id, privateKey, partnerPublicKey },
      ]);
      setShowModal({ bool: false, sender: null, receiver: null });
    },
    [keys]
  );

  const updateMessage = useCallback((textMessage, id)=> {
    setText(textMessage);
    setChatId(id);
  }, []);

  const sendTextMessage = useCallback(
    async (textMessage, sender, currentChatId, setTextMessage, r, s) => {
      if (!textMessage) return console.log("You must type something...");

      // Encrypt message here
      const encryptedChunks = encryptMessage(
        textMessage,
        keys[0].partnerPublicKey
      );

      const encryptedMessageString = JSON.stringify(
        encryptedChunks.map((chunk) => ({
          kG: chunk.kG.map((coord) => coord.toString(16)),
          PmPluskPb: chunk.PmPluskPb.map((coord) => coord.toString(16)),
        }))
      );
      let body = {}
      if (r && s) {
        body = {
          chatId: currentChatId,
          senderId: sender._id,
          text: encryptedMessageString,
          signed: {r, s}
        }
      } else {
        body = {
          chatId: currentChatId,
          senderId: sender._id,
          text: encryptedMessageString,
        }
      }

      const response = await postRequest(
        `${baseUrl}/messages`,
        JSON.stringify(body)
      );

      if (response.error) {
        return setSendTextMessageError(response);
      }

      const { createdAt } = response;

      storeMessageLocally(currentChatId, textMessage, createdAt, sender._id);

      setNewMessage(response);
      setMessages((prev) => [...prev, { ...response, text: textMessage }]);
      setTextMessage("");
    },
    [keys]
  );

  const createChat = useCallback(async (senderId, receiverId) => {
    const response = await postRequest(
      `${baseUrl}/chats`,
      JSON.stringify({ senderId, receiverId })
    );

    if (response.error) {
      return console.log("Error creating chat:", response);
    }

    setUserChats((prev) => [...prev, response]);
  }, []);

  const markAllNotificationsAsRead = useCallback((notifications) => {
    const modifiedNotifications = notifications.map((n) => {
      return { ...n, isRead: true };
    });

    setNotifications(modifiedNotifications);
  }, []);

  const markNotificationAsRead = useCallback(
    (n, userChats, user, notifications) => {
      // find chat to open
      const readChat = userChats.find((chat) => {
        const chatMembers = [user._id, n.senderId];
        const isDesiredChat = chat?.members.every((member) => {
          return chatMembers.includes(member);
        });

        return isDesiredChat;
      });

      // mark notification as read
      const modifiedNotifications = notifications.map((element) => {
        if (n.senderId === element.senderId) {
          return { ...n, isRead: true };
        } else {
          return element;
        }
      });

      updateCurrentChat(readChat);
      setNotifications(modifiedNotifications);
    },
    []
  );

  const markThisUserNotificationsAsRead = useCallback(
    (thisUserNotifications, notifications) => {
      // mark notification as read

      const modifiedNotifications = notifications.map((element) => {
        let notification;

        thisUserNotifications.forEach((n) => {
          if (n.senderId === element.senderId) {
            notification = { ...n, isRead: true };
          } else {
            notification = element;
          }
        });

        return notification;
      });

      setNotifications(modifiedNotifications);
    },
    []
  );

  return (
    <ChatContext.Provider
      value={{
        userChats,
        isUserChatsLoading,
        userChatsError,
        updateCurrentChat,
        currentChat,
        messages,
        messagesError,
        socket,
        sendTextMessage,
        onlineUsers,
        potentialChats,
        createChat,
        notifications,
        allUsers,
        markAllNotificationsAsRead,
        markNotificationAsRead,
        markThisUserNotificationsAsRead,
        newMessage,
        showModal,
        addKey,
        keys,
        clickVerify,
        showSchnorr,
        showSchnorrPr,
        closeSchnorr,
        inputSign,
        sign,
        updateMessage,
        verifying,
        verified,
        Schnorr,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
};
