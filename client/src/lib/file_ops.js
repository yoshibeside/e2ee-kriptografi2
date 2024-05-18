import { writeFileSync, readFileSync } from "fs";

function saveKeyToFile(key, filePath) {
  writeFileSync(filePath, key.toString(16), "utf-8");
}

function loadKeyFromFile(filePath) {
  return BigInt(`0x${readFileSync(filePath, "utf-8")}`);
}
