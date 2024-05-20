import express from "express";
import {
  registerUser,
  loginUser,
  findUser,
  getUsers,
} from "../Controllers/userController.js";
import authenticate from "../Middleware/authenticate.js";

const router = express.Router();

router.post("/register", registerUser);
router.post("/login", loginUser);
router.get("/find/:userId",authenticate, findUser);
router.get("/",authenticate, getUsers);

export default router;
