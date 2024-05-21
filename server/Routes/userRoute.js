import express from "express";
import {
  registerUser,
  loginUser,
  findUser,
  getUsers,
} from "../Controllers/userController.js";
import authenticate from "../Middleware/authenticate.js";

const router = express.Router();

router.post("/register/:conId", registerUser);
router.post("/login/:conId", loginUser);
router.get("/find/:userId/:conId",authenticate, findUser);
router.get("/:conId",authenticate, getUsers);

export default router;
