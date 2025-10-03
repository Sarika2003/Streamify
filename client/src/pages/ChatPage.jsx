import { useEffect, useState } from "react";
import { useParams } from "react-router";
import useAuthUser from "../hooks/useAuthUser";
import { useQuery } from "@tanstack/react-query";
import { getStreamToken } from "../lib/api";
import {
  Channel, ChannelHeader, Chat, MessageInput, MessageList, Thread, Window,
} from "stream-chat-react";
import toast from "react-hot-toast";
import ChatLoader from "../components/ChatLoader";
import CallButton from "../components/CallButton";
import { useChatStore } from "../store/useChatStore";

const ChatPage = () => {
  const { id: targetUserId } = useParams();
  const [loading, setLoading] = useState(true);
  const { authUser } = useAuthUser();

  const {
    chatClient, currentChannel, initClient, initChannel, isClientReady,
  } = useChatStore();

  const { data: tokenData } = useQuery({
    queryKey: ["streamToken"],
    queryFn: getStreamToken,
    enabled: !!authUser,
  });

  // Initializes the global Stream Chat client connection.
  useEffect(() => {
    const setupClient = async () => {
      if (!tokenData?.token || !authUser) return;
      await initClient(authUser, tokenData.token);
    };
    setupClient();

  }, [tokenData, authUser, initClient]);

  // Sets up the channel (waits until the client connection is ready).
  useEffect(() => {
    const setupChannel = async () => {
      // Gating logic: Wait until the client is fully initialized/connected
      if (!isClientReady || !chatClient) return;

      try {
        const channel = await initChannel(authUser._id, targetUserId);

        if (channel) {
          setLoading(false);
        }
      } catch (error) {
        console.error("Error setting up channel:", error.message);
        toast.error("Failed to load chat: " + error.message);
        setLoading(false);
      }
    };

    setupChannel();

  }, [isClientReady, chatClient, authUser, targetUserId, initChannel]);

  // Sends the video call link into the current channel.
  const handleVideoCall = () => {
    if (currentChannel) {
      const callUrl = `${window.location.origin}/call/${currentChannel.id}`;
      currentChannel.sendMessage({
        text: `I've started a video call. Join me here: ${callUrl}`,
      });
      toast.success("Video call link sent successfully!");
    }
  };

  if (loading || !chatClient || !currentChannel) return <ChatLoader />;

  return (
    <div className="h-[93vh]">
      <Chat client={chatClient}>
        <Channel channel={currentChannel}>
          <div className="w-full relative">
            <CallButton handleVideoCall={handleVideoCall} />
            <Window>
              <ChannelHeader />
              <MessageList />
              <MessageInput focus />
            </Window>
          </div>
          <Thread />
        </Channel>
      </Chat>
    </div>
  );
};
export default ChatPage;