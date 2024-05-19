import { createContext, useEffect, useState } from "react";
import { io } from "socket.io-client";
import ecc from "../lib/ecc.js";
import { postRequest } from "../utils/service.js";

export const ConContext = createContext();

export const ConContextProvider = ({ children, user }) => {

    const [socket, setSocket] = useState(null);
    const [privateKey, setPrivateKey] = useState(null);

    // initialize socket
    useEffect(() => {
        const newSocket = io("http://localhost:3000");
        setSocket(newSocket);

        return () => {
        newSocket.disconnect();
        };
    }, [user]);

    useEffect(() => {
        if (!socket) return;
        setPrivateKey(ecc.generatePrivate())

        return () => {
          setPrivateKey(null);
        };
    }, [socket])

    useEffect(() => {
        if (!socket || !privateKey) return;

        socket.on("receivePG", () => {
            const publicKey = ecc.generatePublic(privateKey)
            socket.emit("getAClient", {publicKey: [publicKey[0].toString(), publicKey[1].toString()]})
        })

        socket.on("receiveB", (data) => {
            const publicKey = [BigInt(data.publicKey[0]), BigInt(data.publicKey[1])]
            const sharedKey = ecc.generateSharedKey(privateKey, publicKey)
            localStorage.setItem("sharedKey", sharedKey.join(""))
        });

        return () => {
          socket.off("receivePG");
          socket.off("receiveB");
        };
    }, [privateKey])

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