import { executeMode } from "./blockmodes";

export const encrypt = (data, sharedKey) => {
    const content = JSON.stringify(data);
    const encrypted = executeMode("ecb", content, sharedKey, false, true, false);
    return {encrypted};
}

export const decrypt = (data, sharedKey) => {
    try {
        const decrypted = executeMode("ecb", data, sharedKey, true, false, true);
        return JSON.parse(decrypted);
    } catch (error) {
        console.log("Error decrypting data:");
    }
}

