import {createMessage, getMessages}  from '../lib/firebase.js';
import encryptResponse from '../lib/encryptresponse.js';

const creatingMessage = async (req, res, next) => {
  const { chatId, senderId, text } = req.body;

  if (!chatId || !senderId || !text)
    return res.status(400).json(encryptResponse(req.body.shared, "All fields are required..."));

  try {
    const response = await createMessage({chatId, senderId, text, createdAt: new Date()});

    const encrypt = encryptResponse(req.body.shared, response)
    res.status(200).json({encrypted: encrypt, key: req.body.shared});
  } catch (error) {
    next(error)
  }
};

const gettingMessages = async (req, res, next) => {
  const { chatId } = req.params;

  if (!chatId) return res.status(400).json(encryptResponse(req.body.shared, "ChatId is required..."));

  try {
    const messages = await getMessages(chatId);
    messages.sort((a, b) => a.createdAt - b.createdAt);

    const encrypt = encryptResponse(req.body.shared, messages)
    res.status(200).json({encrypted: encrypt, key: req.body.shared});
  } catch (error) {
    next(error)
  }
};

export {creatingMessage, gettingMessages}
