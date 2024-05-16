import { initializeApp } from 'firebase/app';
import {getFirestore, doc, setDoc, addDoc, collection, query, where, getDoc, getDocs} from 'firebase/firestore';
import dotenv from "dotenv";

dotenv.config();

const firebaseConfig = {
    apiKey: process.env.FIREBASE_API_KEY,
    authDomain: process.env.FIREBASE_AUTH_DOMAIN,
    projectId: process.env.FIREBASE_PROJECT_ID,
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.FIREBASE_APP_ID,
    };

const firebaseApp = initializeApp(firebaseConfig);


let app;
let firestoreDb;

const initializeFirebaseApp = () => {
    try {
        app = initializeApp(firebaseConfig)
        firestoreDb = getFirestore(app);
        return app;
    } catch (error) {
        console.log('Firebase initialization error', error.stack);
    }
}

const getFirebaseApp = () => app;

const createUser = async (user_data) => {
    try {
        // generate a new user id
        const colref = collection(firestoreDb, 'users');
        const data = await addDoc(colref, user_data); 
        return data.id;
    } catch (error) {
        console.log('Error creating user', error.stack);
    }
}

async function getEmail(email) {
    try {
        const userRef =  collection(firestoreDb, 'users');
        const q = query(userRef, where('email', '==', email));
        const snapshot = await getDocs(q);

        if (snapshot.empty) {
            return false;
        } else {           
            return {...snapshot.docs[0].data(), id: snapshot.docs[0].id};
        }
    } catch (error) {
        console.log('Error getting user', error.stack);
        return error;
    }
}

const findUserByID = async (id) => {
    try {
        const userRef =  doc(firestoreDb, 'users', id);
        const snapshot = await getDoc(userRef);

        if (snapshot.empty) {
            return false;
        } else {      
            return {...snapshot.data(), _id: snapshot.id}
        }
    } catch (error) {
        console.log('Error getting user', error.stack);
        return error;
    }
}

const getAllUsers = async () => {
    try {
        const userRef =  collection(firestoreDb, 'users');
        const snapshot = await getDocs(userRef);

        if (snapshot.empty) {
            console.log('No matching documents found.');
            return false;
        } else {           
            return snapshot.docs.map(doc => ({...doc.data(), _id: doc.id}));
        }
    } catch (error) {
        console.log('Error getting user', error.stack);
        return error;
    }
}

const findChat = async (firstId, secondId) => {
    try {
        const chatRef = collection(firestoreDb, 'chats');
        const q = query(chatRef, where ('members', '==', [firstId, secondId]));
        const snapshot = await getDocs(q);

        if (snapshot.empty) {
            return false;
        } else {           
            return snapshot.docs.map(doc => ({...doc.data(), id: doc.id}));
        }
    } catch (error) {
        console.log('Error getting user', error.stack);
        return error;
    }
}

const makeChat = async (senderId, receiverId) => {
    try {
        const chatRef = collection(firestoreDb, 'chats');
        const data = await addDoc(chatRef, {members: [senderId, receiverId]});
        return {members: [senderId, receiverId], _id: data.id};
    } catch (error) {
        console.log('Error creating chat', error.stack);
    }
}

const findChats = async (userId) => {
    try {
        const chatRef = collection(firestoreDb, 'chats');
        const q = query(chatRef, where ('members', 'array-contains', userId));  
        const snapshot = await getDocs(q);

        if (snapshot.empty) {
            return [];
        } else {           
            return snapshot.docs.map(doc => ({...doc.data(), _id: doc.id}));
        }
    } catch (error) {
        console.log('Error getting user', error.stack);
        return error;
    }

}

const createMessage = async (message_data) => {
    try {
        const messageRef = collection(firestoreDb, 'messages');
        const data = await addDoc(messageRef, message_data);
        return { ...message_data, _id: data.id};
    } catch (error) {
        console.log('Error creating message', error.stack);
    }
}

const getMessages = async (chatId) => {
    try {
        const messageRef = collection(firestoreDb, 'messages');
        const q = query(messageRef, where ('chatId', '==', chatId));
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({...doc.data(), _id: doc.id, createdAt: doc.data().createdAt.toDate()}));
    } catch (error) {
        console.log('Error getting messages', error.stack);
        return error;
    }
}
 

export {initializeFirebaseApp,
    getFirebaseApp,
    createUser,
    findUserByID,
    getAllUsers,
    findChat,
    makeChat,
    findChats,
    createMessage,
    getMessages,
    getEmail}