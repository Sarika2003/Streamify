// src/context/ChatProvider.jsx
import { createContext, useContext, useEffect, useState } from "react";
import { StreamChat } from "stream-chat";
import { useQuery } from "@tanstack/react-query";
import { getStreamToken } from "../lib/api";
import useAuthUser from "../hooks/useAuthUser";

const ChatContext = createContext(null);

const STREAM_API_KEY = import.meta.env.VITE_STREAM_API_KEY;

export const ChatProvider = ({ children }) => {
  const { authUser } = useAuthUser();
  const { data: tokenData } = useQuery({
    queryKey: ["streamToken"],
    queryFn: getStreamToken,
    enabled: !!authUser,
  });

  const [chatClient, setChatClient] = useState(null);
  const [isClientReady, setIsClientReady] = useState(false);

  useEffect(() => {
    const init = async () => {
      if (!authUser || !tokenData?.token) return;

      const client = StreamChat.getInstance(STREAM_API_KEY);

      if (!client.userID) {
        await client.connectUser(
          {
            id: authUser._id,
            name: authUser.fullName,
            image: authUser.profilePic,
          },
          tokenData.token
        );
      }

      setChatClient(client);
      setIsClientReady(true);
    };

    init();

    return () => {
      if (chatClient) chatClient.disconnectUser();
    };
  }, [authUser, tokenData]);

  return (
    <ChatContext.Provider value={{ chatClient, isClientReady }}>
      {children}
    </ChatContext.Provider>
  );
};

export const useChatClient = () => useContext(ChatContext);
