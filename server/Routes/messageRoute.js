import express from "express";
import {
  creatingMessage,
  gettingMessages,
} from "../Controllers/messageController.js";

const router = express.Router();

router.post("/:conId", creatingMessage);
router.get("/:chatId/:conId", gettingMessages);

export default router;
