import { Stack } from "react-bootstrap";
import { Form } from "react-bootstrap";
import { useEffect, useState } from "react";
import { Button } from "react-bootstrap";
import { useContext } from "react";
import { ChatContext } from "../context/ChatContext";
import { toast } from "react-toastify";

const ModalKey = () => {
  const { showModal, addKey, currentChat } = useContext(ChatContext);
  const [selectedFile1, setSelectedFile1] = useState(null);
  const [selectedFile2, setSelectedFile2] = useState(null);

  const handleSubmit = async (e) => {
    if (!selectedFile1 || !selectedFile2) {
      toast.error("Please upload all files");
      console.log("Please upload all files");
      return;
    }

    try {
      const [privateKey, partnerPublicKey] = await Promise.all([
        readFile(selectedFile1),
        readFile(selectedFile2),
      ]);

      const myPrivateKey = BigInt(`0x${privateKey.trim()}`);
      const partnerPublicKeyBigInt = JSON.parse(partnerPublicKey).map((hex) =>
        BigInt(`0x${hex}`)
      );

      addKey(myPrivateKey, partnerPublicKeyBigInt, currentChat);
    } catch (error) {
      console.error("Error reading files:", error);
      toast.error("Failed to process the files");
    }
  };

  const readFile = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (event) => resolve(event.target.result);
      reader.onerror = (error) => reject(error);
      reader.readAsText(file);
    });
  };

  const handleFileInput = (event) => {
    const inputId = event.target.id;
    setSelectedFile(inputId, event.target.files[0]); // Helper function
  };

  const setSelectedFile = (id, file) => {
    switch (id) {
      case "myprivatekey":
        setSelectedFile1(file);
        break;
      case "partnerpublickey":
        setSelectedFile2(file);
        break;
      default:
        break;
    }
  };

  return (
    <>
      <div
        className={`${
          showModal.bool ? "fixed" : "hidden"
        } inset-0 justify-center items-center overflow-auto flex w-full p-4 z-10 bg-gray-600 bg-opacity-75`}
      >
        <div
          id="card"
          className="flex justify-center bg-gray-800 p-8 rounded-md"
        >
          <Stack direction="vertical" gap={3}>
            <Stack direction="horizontal" className="items-center" gap={2}>
              <p>Personal Private Key: </p>
              <Form.Control
                type="file"
                id="myprivatekey"
                accept=".ecprv"
                onChange={handleFileInput}
              />
            </Stack>
            <Stack direction="horizontal" className="items-center" gap={2}>
              <p>Partner's Public Key: </p>
              <Form.Control
                type="file"
                id="partnerpublickey"
                accept=".ecpub"
                onChange={handleFileInput}
              />
            </Stack>
            <Button variant="primary" type="submit" onClick={handleSubmit}>
              Set
            </Button>
          </Stack>
        </div>
      </div>
    </>
  );
};

export default ModalKey;
