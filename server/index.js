import cors from "cors";
import express from "express";
import chatRoute from "./Routes/chatRoute.js"
import messageRoute from "./Routes/messageRoute.js";
import userRoute from "./Routes/userRoute.js";
import errorhandler from "./Middleware/errorhandler.js";
import authenticate from "./Middleware/authenticate.js";
import {initializeFirebaseApp} from './lib/firebase.js';
import {middlewarecon, makeConnection, deleteConnection, Connections} from "./Controllers/connectionController.js";


const app = express();

app.use(express.json());
initializeFirebaseApp();
app.use(cors());

const connections = new Connections();

app.post("/api/connections", makeConnection(connections.onlineUsers));
app.delete("/api/connections", deleteConnection(connections.onlineUsers));

app.use("/api/users", middlewarecon(connections.onlineUsers), userRoute);
app.use("/api/chats",authenticate, middlewarecon(connections.onlineUsers), chatRoute);
app.use("/api/messages",authenticate, middlewarecon(connections.onlineUsers), messageRoute);

app.get("/", (req, res) => {
  res.send("Welcome to our chat API...");
});

app.use(errorhandler);

const port = process.env.PORT || 5000;

app.listen(port, () => {
  console.log(`Server running on port: ${port}...`);
});