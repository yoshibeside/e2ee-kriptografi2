import cors from "cors";
import express from "express";
import chatRoute from "./Routes/chatRoute.js"
import messageRoute from "./Routes/messageRoute.js";
import userRoute from "./Routes/userRoute.js";
import errorhandler from "./Middleware/errorhandler.js";
import authenticate from "./Middleware/authenticate.js";
import {initializeFirebaseApp} from './lib/firebase.js';


const app = express();

app.use(express.json());
initializeFirebaseApp();
app.use(cors());

app.use("/api/users", userRoute);
app.use("/api/chats", chatRoute);
app.use("/api/messages", messageRoute);

app.get("/", (req, res) => {
  res.send("Welcome to our chat API...");
});

app.use(errorhandler);

const port = process.env.PORT || 5000;

app.listen(port, () => {
  console.log(`Server running on port: ${port}...`);
});