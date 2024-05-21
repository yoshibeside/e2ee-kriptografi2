import ecc from "../lib/ecc.js";
import {executeMode} from "../lib/blockmodes.js";

export class Connections {
    constructor() {
        this.onlineUsers = [];
    }
}

export function middlewarecon (connections) {
    return async (req, res, next) => {
        const  conId  = req.originalUrl.split("/").pop();
        const { encrypted } = req.body;
        try {
            const connection = connections.find((user) => {return user.con_id === conId});
            if (req.method === "GET" && connection) {
                req.body.shared = connection.sharedKey;
                return next();
            }
            if (connection) {
                // decrypt the message
                const key = connection.sharedKey;
                const body = executeMode("ecb", encrypted, key, true, false, true);
                req.body = JSON.parse(body);    
                req.body.shared = connection.sharedKey;          
                next();
            } else {
                res.status(404).json("Connection not found")
            }
        } catch (error) {
            next(error)
        }
    }
}


export function makeConnection(connections) {
    return async (req, res, next) => {
        const { conId, pub_key } = req.params;
        const temp_key = pub_key.split(",");
        try {
            if (!connections.find((user) => { user.con_id === conId})) {
                const generateKey = ecc.generateKeys();
                let sharedKey = ecc.generateSharedKey(generateKey.privateKey, [BigInt(temp_key[0]), BigInt(temp_key[1])]);
                sharedKey = sharedKey.join("")
                connections.push({con_id: conId, sharedKey});
                res.status(200).json({pub_key: [generateKey.publicKey[0].toString(), generateKey.publicKey[1].toString()]})
            } 
        } catch (error) {
            next(error)
        }
    }
}

export function deleteConnection(connections) {
    return async (req, res, next) => {
        const { conId } = req.params;
        try {
            const index = connections.findIndex((user) => {return user.con_id === conId});
            if (index !== -1) {
                connections.splice(index, 1);
                res.status(200).json("Connection deleted")
            } else {
                res.status(404).json("Connection not found")
            }
        } catch (error) {
            next(error)
        }
    }
}
