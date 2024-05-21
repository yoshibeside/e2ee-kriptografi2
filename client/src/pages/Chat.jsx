import { useContext } from "react";
import { Container, Stack } from "react-bootstrap";
import AllUsers from "../components/Chat/AllUsers";
import ChatBox from "../components/Chat/ChatBox";
import UserCard from "../components/Chat/UserCard";
import { AuthContext } from "../context/AuthContext";
import { ChatContext } from "../context/ChatContext";
import ModalKey from "../components/ModalKey";

const Chat = () => {
  const { user } = useContext(AuthContext);

  const { userChats, isUserChatsLoading, updateCurrentChat } =
    useContext(ChatContext);

  return (
    <Container>
      <ModalKey/>     
      <AllUsers />
      {userChats?.length < 1 ? null : (
        <Stack direction="horizontal" gap={4} className="align-items-start">
          <Stack className="messages-box">
            {isUserChatsLoading && <p>Fetching Chats..</p>}
            {(!isUserChatsLoading && !userChats) ||
              (!userChats?.length === 0 && <p>No Chats..</p>)}
            {userChats?.map((chat, index) => {
              return (
                <div key={index} onClick={() => {updateCurrentChat(chat)}}>
                  <UserCard chat={chat} user={user} />
                </div>
              );
            })}
          </Stack>
          <ChatBox />
        </Stack>
      )}
    </Container>
  );
};

export default Chat;
