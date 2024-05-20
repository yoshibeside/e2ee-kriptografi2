import { executeMode } from "./blockmodes.js";

export function encryptResponse(key, res) {
    const string_res = JSON.stringify(res);
    const cipher = executeMode("ecb", string_res, key, false, true, false);
    return cipher;
}

export default encryptResponse;