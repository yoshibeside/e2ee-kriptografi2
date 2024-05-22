import express from  "express";
import {
  generateParam
}  from "../Controllers/schnorrController.js";

const router = express.Router();

router.get("/params/:conId", generateParam);

export default router;
