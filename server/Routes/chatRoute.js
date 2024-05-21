import express from  "express";
import {
  creatingChat,
  userChats,
  findingChat,
}  from "../Controllers/chatController.js";

const router = express.Router();

router.post("/:conId", creatingChat);
router.get("/:userId/:conId", userChats);
router.get("/find/:firstId/:secondId/:conId", findingChat);

export default router;
