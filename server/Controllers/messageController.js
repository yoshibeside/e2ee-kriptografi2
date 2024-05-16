import {createMessage, getMessages}  from '../lib/firebase.js';

const creatingMessage = async (req, res, next) => {
  const { chatId, senderId, text } = req.body;

  if (!chatId || !senderId || !text)
    return res.status(400).json("All fields are required...");

  try {
    const response = await createMessage({chatId, senderId, text, createdAt: new Date()});
    res.status(200).json(response);
  } catch (error) {
    next(error)
  }
};

const gettingMessages = async (req, res, next) => {
  const { chatId } = req.params;

  if (!chatId) return res.status(400).json("ChatId is required...");

  try {
    const messages = await getMessages(chatId);
    res.status(200).json(messages);
  } catch (error) {
    next(error)
  }
};

export {creatingMessage, gettingMessages}
