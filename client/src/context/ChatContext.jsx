import { useCallback, useContext, useEffect, useState } from "react";
import { createContext } from "react";
import { baseUrl, getRequest, postRequest } from "../utils/service";
import { io } from "socket.io-client";
import { ConContext } from "./ConContext";
import ECC from "../lib/ecc.js";

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

      setMessages((prev) => [...prev, res]);
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
  }, [socket, currentChat]);

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
    if (!(keys.find((k) => k.chatId === currentChat?._id))) return;
    if (showModal.bool) return;

    const getMessages = async () => {
      const response = await getRequest(
        `${baseUrl}/messages/${currentChat?._id}`
      );

      setIsMessagesLoading(false);

      if (response.error) {
        return setMessagesError(response.error);
      }

      setMessages(response);
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

  const addKey = useCallback((privateKey, partnerPublicKey, currentChat) => {
    setKeys((prev) => [
      ...prev,
      { chatId: currentChat._id, privateKey, partnerPublicKey },
    ]);
    setShowModal({ bool: false, sender: null, receiver: null });
  }, [keys]);

  useEffect(() => {
    console.log("the current chat", currentChat)
  }, [currentChat])


  useEffect(() => {
    if (keys.length === 0) return
    console.log(keys)
  }, [keys])

  const sendTextMessage = useCallback(
    async (textMessage, sender, currentChatId, setTextMessage) => {
      if (!textMessage) return console.log("You must type something...");

      // Encrypt message here
      const messageBigInt = messageToBigInt(textMessage);
      const encryptedPoint = ECC.scalarMult(messageBigInt, ECC.G);
      const encryptedMessage = ECC.scalarMult(
        keys[0].privateKey,
        encryptedPoint
      );

      const response = await postRequest(
        `${baseUrl}/messages`,
        JSON.stringify({
          chatId: currentChatId,
          senderId: sender._id,
          text: [encryptedMessage[0].toString(), encryptedMessage[1].toString()],
        })
      );

      if (response.error) {
        return setSendTextMessageError(response);
      }

      setNewMessage(response);
      setMessages((prev) => [...prev, response]);
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

  const messageToBigInt = (message) => {
    const encoder = new TextEncoder();
    const messageBytes = encoder.encode(message);
    let hexString = "";
    messageBytes.forEach((byte) => {
      hexString += byte.toString(16).padStart(2, "0");
    });
    return BigInt(`0x${hexString}`);
  };

  const bigIntToMessage = (bigInt) => {
    const hexString = bigInt.toString(16);
    const messageBytes = new Uint8Array(
      hexString.match(/.{1,2}/g).map((byte) => parseInt(byte, 16))
    );
    const decoder = new TextDecoder();
    return decoder.decode(messageBytes);
  };

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
      }}
    >
      {children}
    </ChatContext.Provider>
  );
};
