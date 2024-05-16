import express from "express";
import {
  creatingMessage,
  gettingMessages,
} from "../Controllers/messageController.js";

const router = express.Router();

router.post("/", creatingMessage);
router.get("/:chatId", gettingMessages);

export default router;
