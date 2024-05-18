import { Stack } from "react-bootstrap";
import { Form } from "react-bootstrap";
import { useEffect, useState } from "react";
import { Button } from "react-bootstrap";
import { useContext } from "react";
import { ChatContext } from "../context/ChatContext";
import { ToastContainer, toast } from "react-toastify";

const ModalKey = () => {
    
    const {showModal, addKey} = useContext(ChatContext)
    const [selectedFile1, setSelectedFile1] = useState(null);
    const [selectedFile2, setSelectedFile2] = useState(null);
    const [selectedFile3, setSelectedFile3] = useState(null);


    const handleSubmit = (e) => {
        if (!selectedFile1 || !selectedFile2 || !selectedFile3) {
            toast.error("Please upload all files")
            console.log("Please upload all files")
            return
        }

        // Process the file first here
        const dummyprivate="dummyprivatekey"
        const dummypublic="dummypublickey"
        const dummypartner="dummypartnerpublickey"

        // useCallback
        addKey(dummyprivate, dummypublic, dummypartner)
    }

    const handleFileInput = (event) => {
        const inputId = event.target.id;
        setSelectedFile(inputId, event.target.files[0]); // Helper function
      };
    
      const setSelectedFile = (id, file) => {
        switch (id) {
          case "myprivatekey":
            setSelectedFile1(file);
            break;
          case "mypublickey":
            setSelectedFile2(file);
            break;
          case "partnerpublickey":
            setSelectedFile3(file);
            break;
          default:
            break;
        }
      };
  
    return (
        <>
        <ToastContainer/>
        <div className={`${showModal.bool? "fixed": "hidden"} inset-0 justify-center items-center overflow-auto flex w-full p-4 z-10 bg-gray-600 bg-opacity-75`} >
            <div id="card" className="flex justify-center bg-gray-800 p-8 rounded-md"> 
            <Stack direction="vertical" gap={3}>
                <Stack direction="horizontal" className="items-center" gap={2}>
                    <p>Personal Private Key: </p>
                    <Form.Control
                        type="file"
                        id="myprivatekey"
                        onChange={handleFileInput}
                    />
                </Stack>
                <Stack direction="horizontal" className="items-center" gap={2}>
                    <p>Personal Public Key: </p>
                    <Form.Control
                        type="file"
                        id="mypublickey"
                        onChange={handleFileInput}
                    />
                </Stack>
                <Stack direction="horizontal" className="items-center" gap={2}>
                    <p>Partner's Public Key: </p>
                    <Form.Control
                        type="file"
                        id="partnerpublickey"
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
