import { Server } from "socket.io";
import ecc from "./lib/ecc.js";
import { executeMode } from "../client/src/lib/blockmodes.js";

const io = new Server({
  cors: {
    origin: true,
  },
});

let onlineUsers = [];
let sharedKeys = [];

const getSharedKey = (socketId) => {
  const result = sharedKeys.find((key) => key.socketId === socketId);
  if (!result) {
    return null;
  }
  return result.sharedKey;
};

const encryptMessage = (message, sharedKey) => {
  const message_string = JSON.stringify(message);
  const encrypted = executeMode("ecb", message_string, sharedKey, false, true, false)
  return encrypted;
};

const decryptMessage = (message, sharedKey) => {
  const decrypted = executeMode("ecb", message, sharedKey, true, false, true)
  return JSON.parse(decrypted);
}

const sendToAllUsers = (message, topic) => {
  sharedKeys.forEach((user) => {
    const message_string = JSON.stringify(message);
    const encrypted = encryptMessage(message_string, user.sharedKey);
    io.to(user.socketId).emit(topic, {encrypted});
  });
}

io.on("connection", (socket) => {
    // on connection despite with or without user
  socket.on("getAClient", (data) => {
    // calculate the Key (keep in database)
    const privateKey = ecc.generatePrivate();
    const sharedKey = ecc.generateSharedKey(privateKey, [BigInt(data.publicKey[0]), BigInt(data.publicKey[1])])
    sharedKeys.push({socketId: socket.id, sharedKey: sharedKey.join("").toString()});
    // emit to specific user (Send B)
    const publicKeyB = ecc.generatePublic(privateKey)
    socket.emit("receiveB", {publicKey: [publicKeyB[0].toString(), publicKeyB[1].toString()]})
  });

  // add user
  socket.on("addNewUser", (userId) => {
    const key = getSharedKey(socket.id)

    if (key === null || !userId) return;

    const id = decryptMessage (userId.encrypted, key)

    !onlineUsers.some((user) => user.userId === id.encrypted) &&
      onlineUsers.push({
        userId: id.encrypted,
        socketId: socket.id,
      });

    console.log("Connected Users:", onlineUsers);

    // send active users
    sendToAllUsers(onlineUsers, "getUsers");
  });

  // add message
  socket.on("sendMessage", (messageEnc) => {
    const key = getSharedKey(socket.id)
    if (key === null) return;
    const message = decryptMessage (messageEnc.encrypted, getSharedKey(socket.id))
    const user = onlineUsers.find(
      (user) => user.userId === message.recipientId
    );

    if (user) {
      const encrypted_msg = encryptMessage(message, getSharedKey(user.socketId))
      const encrypted_ntf = encryptMessage({
        senderId: message.senderId,
        isRead: false,
        date: new Date(),
      }, getSharedKey(user.socketId))
      io.to(user.socketId).emit("getMessage", {encrypted: encrypted_msg});
      io.to(user.socketId).emit("getNotification", {encrypted: encrypted_ntf})
    }
  });

  socket.on("disconnect", () => {
    console.log("DISCONNECTED", socket.id)
    onlineUsers = onlineUsers.filter((user) => user.socketId !== socket.id);
    sharedKeys = sharedKeys.filter((key) => key.socketId !== socket.id);

    // send active users
    sendToAllUsers(onlineUsers, "getUsers");
  });
});

io.listen(3000);
