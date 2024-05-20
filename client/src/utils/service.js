export const baseUrl = "http://localhost:5000/api";
import { executeMode } from "../lib/blockmodes";

const encrypt = (data) => {
  const content = data.toString();
  const key = localStorage.getItem("sharedKeyW").toString();
  const encrypted = executeMode("ecb", content, key, false, true, false);
  return encrypted;
}

const decrypt = (data) => {
  try {
    const key = localStorage.getItem("sharedKeyW").toString();
    const decrypted = executeMode("ecb", data, key, true, false, true);
    return JSON.parse(decrypted);
  } catch (error) {
    console.log("Error decrypting data:");
  }
}

export const postRequestUnEncrypt = async (url, body) => {
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "authorization": `Bearer ${localStorage.getItem("Token")}`,
    },
    body
  });

  const data = await response.json();
  
  if (!response.ok) {
    let message;

    if (data?.message) {
      message = data.message;
    } else {
      message = data;
    }

    return { error: true, status: response.status, message };
  }

  return data;
};

export const postRequest = async (url, body) => {
  const con_id = localStorage.getItem("con_id");
  const encryptbody = await encrypt(body);

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "authorization": `Bearer ${localStorage.getItem("Token")}`,
    },
    body: JSON.stringify({con_id, encrypted: encryptbody})
  });

  const data = await response.json();
  
  if (!response.ok) {
    let message;

    if (data?.message) {
      message = data.message;
    } else {
      message = data;
    }

    return { error: true, status: response.status, message };
  }

  if (data.encrypted) {
    const decrypted = decrypt(data.encrypted);
    return decrypted;
  }

  return data;
};

export const getRequest = async (url) => {
  const response = await fetch(url, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      "authorization": `Bearer ${localStorage.getItem("Token")}`,
      "con_id": localStorage.getItem("con_id")
    },
  });

  const data = await response.json();

  if (!response.ok) {
    let message = "An error occured...";

    if (data?.message) {
      message = data.message;
    }

    return { error: true, status: response.status, message };
  }

  if (data.encrypted) {
    const decrypted = decrypt(data.encrypted);
    return decrypted;
  }

  return data;
};


export const deleteRequest = async (url) => {
  const con_id = localStorage.getItem("con_id");
  
  const response = await fetch(url, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({con_id})
  });

  const data = await response.json();

  if (!response.ok) {
    let message = "An error occured...";

    if (data?.message) {
      message = data.message;
    }

    return { error: true, status: response.status, message };
  }

  if (data.encrypted) {
    const decrypted = decrypt(data.encrypted);
    return decrypted;
  }

  return data;
};
