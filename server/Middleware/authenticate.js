import express from  "express";
import jwt from "jsonwebtoken";

const authenticate = (req, res, next) => {
    try {
        
        const token = req.headers.authorization.split(" ")[1];
        console.log("tokennya masuk", token)
        const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);
        req.user = decoded;
        next();
    } catch (error) {
        return res.status(401).json("You are not authenticated...");
    }
}

export default authenticate;
