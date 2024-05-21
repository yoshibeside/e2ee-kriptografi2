import { createContext, useEffect, useState } from "react";
import { io } from "socket.io-client";
import ecc from "../lib/ecc.js";
import { baseUrl, postRequestUnEncrypt, deleteRequest } from "../utils/service.js";

export const ConContext = createContext();

export const ConContextProvider = ({ children, user }) => {

    const [socket, setSocket] = useState(null);
    const [privateKey, setPrivateKey] = useState(null);

    // initialize socket
    useEffect(() => {
        const newSocket = io("http://localhost:3000");
        setSocket(newSocket);

        const id = Math.floor(Math.random() * 1000000).toString();
        localStorage.setItem("con_id", id)
        async function makeConnection() {
            // randomize
            const key = ecc.generateKeys();
            const response = await postRequestUnEncrypt(`${baseUrl}/connections`, JSON.stringify({con_id: id, pub_key: [key.publicKey[0].toString(), key.publicKey[1].toString()]}))
            const public_key = [BigInt(response.pub_key[0]), BigInt(response.pub_key[1])]
            const sharedKey = ecc.scalarMult(key.privateKey, public_key)
            localStorage.setItem("sharedKeyW", sharedKey.join(""))
        }

        async function deleteConnection() {
            await deleteRequest(`${baseUrl}/connections`)
        }

        makeConnection();
        
        return () => {
            newSocket.disconnect();
            deleteConnection();
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
            const sharedKey = ecc.scalarMult(privateKey, publicKey)
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