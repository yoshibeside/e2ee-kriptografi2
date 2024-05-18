import { createContext, useEffect, useState } from "react";
import { io } from "socket.io-client";

export const ConContext = createContext();

export const ConContextProvider = ({ children, user }) => {

    const [socket, setSocket] = useState(null);

    // initialize socket
    useEffect(() => {
        console.log("creating socket")
        const newSocket = io("http://localhost:3000");
        setSocket(newSocket);

        return () => {
        newSocket.disconnect();
        };
    }, [user]);

    useEffect(() => {
        if (!socket) return;

        socket.on("receivePG", (data) => {
            console.log("PG", data)
            socket.emit("getAClient", {"sending":2})
        })

        socket.on("receiveB", (data) => {
            console.log("receiveB", data)
            localStorage.setItem("KEY", "OMG")
        })

        return () => {
            localStorage.removeItem("KEY")
            socket.disconnect()
        };
        
    }, [socket])

    return (
        <ConContext.Provider
          value={{
            socket
          }}
        >
          {children}
        </ConContext.Provider>
      );
}