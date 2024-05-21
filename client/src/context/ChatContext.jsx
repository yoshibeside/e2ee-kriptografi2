import { useCallback, useContext, useEffect, useState } from "react";
import { createContext } from "react";
import { baseUrl, getRequest, postRequest } from "../utils/service";
import { io } from "socket.io-client";
import { ConContext } from "./ConContext";
import ECC from "../lib/ecc.js";
import { encryptMessage, decryptMessage } from "../lib/ecc_helper.js";

export const ChatContext = createContext();

export const ChatContextProvider = ({ children, user }) => {
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
  const { socket } = useContext(ConContext);

  const [showModal, setShowModal] = useState({
    bool: false,
    sender: null,
    receiver: null,
  });

  // create a state model for the private, public, and partner's public key in each chat id
  const [keys, setKeys] = useState([]);

  // Helper function to store plain text messages in local storage
  const storeMessageLocally = (chatId, message, createdAt) => {
    const chatHistory = JSON.parse(localStorage.getItem("chatHistory")) || {};
    if (!chatHistory[chatId]) {
      chatHistory[chatId] = [];
    }
    chatHistory[chatId].push({ text: message, createdAt });
    localStorage.setItem("chatHistory", JSON.stringify(chatHistory));
  };

  // Fetch plain text messages from local storage
  const fetchLocalMessages = (chatId) => {
    const chatHistory = JSON.parse(localStorage.getItem("chatHistory")) || {};
    return chatHistory[chatId] || [];
  };

  // set online users
  useEffect(() => {
    if (socket === null) return;

    socket.emit("addNewUser", user?._id);
    socket.on("getUsers", (res) => {
      setOnlineUsers(res);
    });

    return () => {
      socket.off("getUsers");
    };
  }, [socket]);

  // send message
  useEffect(() => {
    if (socket === null) return;

    const recipientId = currentChat?.members.find((id) => id !== user?._id);

    socket.emit("sendMessage", { ...newMessage, recipientId });
  }, [newMessage]);

  // receive message and notifications
  useEffect(() => {
    if (socket === null) return;

    socket.on("getMessage", (res) => {
      if (currentChat?._id !== res.chatId) return;

      const encryptedMessageString = res.text;
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

      setMessages((prev) => [...prev, { ...res, text: decryptedMessage }]);
    });

    socket.on("getNotification", (res) => {
      const isChatOpen = currentChat?.members.some((Id) => Id === res.senderId);

      if (isChatOpen) {
        setNotifications((prev) => [{ ...res, isRead: true }, ...prev]);
      } else {
        setNotifications((prev) => [res, ...prev]);
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
          (local) => local.createdAt === message.createdAt
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

  useEffect(() => {
    console.log("the current chat", currentChat);
  }, [currentChat]);

  useEffect(() => {
    if (keys.length === 0) return;
    console.log(keys);
  }, [keys]);

  const sendTextMessage = useCallback(
    async (textMessage, sender, currentChatId, setTextMessage) => {
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

      const response = await postRequest(
        `${baseUrl}/messages`,
        JSON.stringify({
          chatId: currentChatId,
          senderId: sender._id,
          text: encryptedMessageString,
        })
      );

      if (response.error) {
        return setSendTextMessageError(response);
      }

      const { createdAt } = response;

      storeMessageLocally(currentChatId, textMessage, createdAt);

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
      }}
    >
      {children}
    </ChatContext.Provider>
  );
};
