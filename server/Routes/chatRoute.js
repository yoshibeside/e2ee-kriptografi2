import express from  "express";
import {
  creatingChat,
  userChats,
  findingChat,
}  from "../Controllers/chatController.js";

const router = express.Router();

router.post("/", creatingChat);
router.get("/:userId", userChats);
router.get("/find/:firstId/:secondId", findingChat);

export default router;
