import { Stack } from "react-bootstrap";
import { Form } from "react-bootstrap";
import { useState } from "react";
import { Button } from "react-bootstrap";
import { useContext } from "react";
import { ChatContext } from "../context/ChatContext";
import { toast } from "react-toastify";

const ModalSchnorr = () => {
  const { showSchnorr, closeSchnorr, verifying } = useContext(ChatContext);
  const [selectedFile1, setSelectedFile1] = useState(null);

  const handleSubmit = async (e) => {
    if (!selectedFile1) {
      toast.error("Please upload all files");
      console.log("Please upload all files");
      return;
    }

    try {
      const [partnerPublicKey] = await Promise.all([
        readFile(selectedFile1),
      ]);

      const partnerPublicKeyBigInt = BigInt(partnerPublicKey);

      const error = verifying(partnerPublicKeyBigInt);
      if (error) {
        toast.error(error);
      }
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
      case "partnerpublickey":
        setSelectedFile1(file);
        break;
      default:
        break;
    }
  };

  return (
    <>
      <div
        className={`${
            showSchnorr ? "fixed" : "hidden"
        } inset-0 justify-center items-center overflow-auto flex w-full p-4 z-10 bg-gray-600 bg-opacity-75`}
      >
        <div
          id="card"
          className="flex justify-center bg-gray-800 p-8 rounded-md"
        >
          <Stack direction="vertical" gap={3}>
            <Stack direction="horizontal" className="justify-between" gap={2}>
                <h1 className="text-2xl text-white align-self-center">Digital Signing</h1>
                <button className="exit" onClick={closeSchnorr}>X</button>
            </Stack>    
            <Stack direction="horizontal" className="items-center" gap={2}>
              <p>Partner's Public Key: </p>
              <Form.Control
                type="file"
                id="partnerpublickey"
                accept=".scpub"
                onChange={handleFileInput}
              />
            </Stack>
            <Button variant="primary" type="submit" onClick={()=>handleSubmit()}>
              Set
            </Button>
          </Stack>
        </div>
      </div>
    </>
  );
};

export default ModalSchnorr;
