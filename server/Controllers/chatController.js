import {findChat, makeChat, findChats} from '../lib/firebase.js';

const creatingChat = async (req, res, next) => {
  const { senderId, receiverId } = req.body;
  try {
    // check if a chat already exist
    const chat = await findChat(senderId, receiverId);

    if (chat) return res.status(200).json(chat);

    const newChat = await makeChat(senderId, receiverId);

    res.status(200).json(newChat);
  } catch (error) {
    next(error)
  }
};

const userChats = async (req, res, next) => {
  const userId = req.params.userId;

  try {
    const chats = await findChats(userId);

    res.status(200).json(chats);
  } catch (error) {
    next(error)
  }
};

const findingChat = async (req, res, next) => {
  const firstId = req.params.firstId;
  const secondId = req.params.secondId;

  try {
    const chat = findChat(firstId, secondId);

    res.status(200).json(chat);
  } catch (error) {
    next(error)
  }
};

export { creatingChat, userChats, findingChat };
