import {findChat, makeChat, findChats} from '../lib/firebase.js';
import encryptResponse from '../lib/encryptresponse.js';

const creatingChat = async (req, res, next) => {
  const { senderId, receiverId } = req.body;
  try {
    // check if a chat already exist
    const chat = await findChat(senderId, receiverId);

    if (chat) {
      const encrypt = encryptResponse(req.body.shared, chat)
      res.status(200).json({encrypted: encrypt, key: req.body.shared});
    } 

    const newChat = await makeChat(senderId, receiverId);
    const encrypt = encryptResponse(req.body.shared, newChat)
    res.status(200).json({encrypted: encrypt, key: req.body.shared});
  } catch (error) {
    next(error)
  }
};

const userChats = async (req, res, next) => {
  const userId = req.params.userId;

  try {
    const chats = await findChats(userId);
    const encrypt = encryptResponse(req.body.shared, chats)
    res.status(200).json({encrypted: encrypt, key: req.body.shared});
  } catch (error) {
    next(error)
  }
};

const findingChat = async (req, res, next) => {
  const firstId = req.params.firstId;
  const secondId = req.params.secondId;

  try {
    const chat = findChat(firstId, secondId);

    const encrypt = encryptResponse(req.body.shared, chat)
    res.status(200).json({encrypted: encrypt, key: req.body.shared});
  } catch (error) {
    next(error)
  }
};

export { creatingChat, userChats, findingChat };
