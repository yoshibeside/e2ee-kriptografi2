import ecc from "../lib/ecc.js";
import {executeMode} from "../lib/blockmodes.js";

export class Connections {
    constructor() {
        this.onlineUsers = [];
    }
}

export function middlewarecon (connections) {
    return async (req, res, next) => {
        let { con_id, encrypted } = req.body;
        if (!con_id) con_id = req.headers.con_id;
        try {
            const connection = connections.find((user) => {return user.con_id === con_id});
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
        const { con_id, pub_key } = req.body;
        try {
            if (!connections.find((user) => { user.con_id === con_id})) {
                const generateKey = ecc.generateKeys();
                let sharedKey = ecc.generateSharedKey(generateKey.privateKey, [BigInt(pub_key[0]), BigInt(pub_key[1])]);
                sharedKey = sharedKey.join("")
                connections.push({con_id, sharedKey});
                res.status(200).json({pub_key: [generateKey.publicKey[0].toString(), generateKey.publicKey[1].toString()]})
            } 
        } catch (error) {
            next(error)
        }
    }
}

export function deleteConnection(connections) {
    return async (req, res, next) => {
        const { con_id } = req.body;
        try {
            const index = connections.findIndex((user) => {return user.con_id === con_id});
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
