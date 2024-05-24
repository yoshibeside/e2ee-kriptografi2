import { createContext, useEffect, useState, useContext } from "react";
import { io } from "socket.io-client";
import ecc from "../lib/ecc.js";
import { baseUrl, postRequestUnEncrypt, deleteRequest, getRequest } from "../utils/service.js";
import { AuthContext } from "./AuthContext.jsx";

export const ConContext = createContext();

export const ConContextProvider = ({ children }) => {

	const {user} = useContext(AuthContext);

    const [socket, setSocket] = useState(null);
    const [privateKey, setPrivateKey] = useState(null);
	const [sharedKey, setSharedKey] = useState(false);

    // initialize socket
    useEffect(() => {
        const newSocket = io("http://localhost:3000");
        setSocket(newSocket);

        const id = Math.floor(Math.random() * 1000000).toString();
        localStorage.setItem("con_id", id)
        async function makeConnection() {
            // randomize
            const key = ecc.generateKeys();
            const response = await postRequestUnEncrypt(`${baseUrl}/connections`, {pub_key: [key.publicKey[0].toString(), key.publicKey[1].toString()]})
            const public_key = [BigInt(response.pub_key[0]), BigInt(response.pub_key[1])]
            const sharedKey = ecc.scalarMult(key.privateKey, public_key)
            localStorage.setItem("sharedKeyW", sharedKey.join(""))
        }

        async function deleteConnection() {
            await deleteRequest(`${baseUrl}/connections`)
        }

        makeConnection();
        
        return () => {
			console.log("disconnecting")
            newSocket.disconnect();
            deleteConnection();
        };
    }, []);

    useEffect(() => {
        if (!socket) return;
        setPrivateKey(ecc.generatePrivate())

        return () => {
          setPrivateKey(null);
        };
    }, [socket])

    useEffect(() => {
        if (!socket || !privateKey || !user) return;

		const publicKey = ecc.generatePublic(privateKey)
		socket.emit("getAClient", {publicKey: [publicKey[0].toString(), publicKey[1].toString()]})

        socket.on("receiveB", (data) => {
            const publicKey = [BigInt(data.publicKey[0]), BigInt(data.publicKey[1])]
            const sharedKey = ecc.scalarMult(privateKey, publicKey)
            localStorage.setItem("sharedKey", sharedKey.join(""))
			setSharedKey(true)
        });

        return () => {
          socket.off("receivePG");
          socket.off("receiveB");
		  setSharedKey(false)
        };
    }, [privateKey, socket, user])

    return (
        <ConContext.Provider
          value={{
            socket,
			sharedKey
          }}
        >
          {children}
        </ConContext.Provider>
      );
}