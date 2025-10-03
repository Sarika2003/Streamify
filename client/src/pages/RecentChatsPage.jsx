import { useEffect, useState } from "react";
import useAuthUser from "../hooks/useAuthUser";
import { useQuery } from "@tanstack/react-query";
import { getStreamToken } from "../lib/api";
import { Link } from "react-router";
import ChatLoader from "../components/ChatLoader";
import { useChatStore } from "../store/useChatStore";

const RecentChatsPage = () => {
  const { authUser } = useAuthUser();
  const [channels, setChannels] = useState([]);
  const [loading, setLoading] = useState(true);

  const { chatClient, initClient, isClientReady } = useChatStore();

  const { data: tokenData } = useQuery({
    queryKey: ["streamToken"],
    queryFn: getStreamToken,
    enabled: !!authUser,
  });

  // Initializes the global Stream Chat client.
  useEffect(() => {
    const setupClient = async () => {
      if (!authUser || !tokenData?.token) return;
      await initClient(authUser, tokenData.token);
    };
    setupClient();
  }, [authUser, tokenData, initClient]);

  // Fetches initial channels, monitors active channels, and sets up listeners.
  useEffect(() => {
    if (!isClientReady || !chatClient || !authUser) return;

    const fetchInitialChannels = async () => {
      const channelFilters = { type: 'messaging', members: { $in: [authUser._id] } };
      const sort = { last_message_at: -1 };

      try {
        await chatClient.queryChannels(channelFilters, sort, { message_limit: 1 });
        updateChannelsList();
      } catch (error) {
        console.error("Failed to query initial channels:", error);
        setLoading(false);
      }
    };

    const updateChannelsList = () => {
      const allActiveChannels = Object.values(chatClient.activeChannels);

      const sortedChannels = allActiveChannels
        .filter(c => c.type === 'messaging')
        .sort((a, b) => {
          const timeA = a.state.last_message_at?.getTime() || 0;
          const timeB = b.state.last_message_at?.getTime() || 0;
          return timeB - timeA;
        });

      setChannels(sortedChannels);
      setLoading(false);
    };

    if (Object.keys(chatClient.activeChannels).length === 0) {
      fetchInitialChannels();
    } else {
      updateChannelsList();
    }

    // Set up listeners for real-time updates.
    chatClient.on("channel.updated", updateChannelsList);
    chatClient.on("channel.new", updateChannelsList);
    chatClient.on("message.new", updateChannelsList);

    // Cleanup: Remove listeners upon unmount.
    return () => {
      chatClient.off("channel.updated", updateChannelsList);
      chatClient.off("channel.new", updateChannelsList);
      chatClient.off("message.new", updateChannelsList);
    };
  }, [chatClient, isClientReady, authUser]);


  if (loading || !isClientReady || !chatClient) return <ChatLoader />;

  const currentUserId = authUser._id;

  return (
    <div className="p-4 mx-auto">
      <h1 className="text-2xl font-bold mb-4">Recent Chats</h1>

      {channels.length === 0 ? (
        <div className="card bg-base-200 p-6 text-center shadow-lg mx-auto max-w-lg">
          <h3 className="font-semibold text-xl mb-3">
            👋 No Friends Yet
          </h3>
          <p className="text-base-content opacity-70">
            Connect with language partners to start practicing together!
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {channels.map((channel) => {
            const channelId = channel.id;

            const otherMember = Object.values(channel.state.members).find(
              (member) => member.user.id !== currentUserId
            );

            const friend = otherMember?.user;

            const messages = channel.state.messages || [];
            const lastMessage = messages[messages.length - 1];

            const unreadCount = channel.countUnread();

            if (!friend) return null;

            return (
              <Link
                key={channelId}
                to={`/chat/${friend.id}`}
                className="flex items-center justify-between p-3 bg-base-200 rounded-lg hover:bg-base-300"
              >
                <div className="flex items-center gap-3">
                  <img
                    src={friend.image || friend.profilePic || 'default-avatar.png'}
                    alt={friend.name}
                    className="w-12 h-12 rounded-full object-cover"
                  />
                  <div className="flex flex-col">
                    <span className="font-semibold">{friend.name || friend.fullName}</span>
                    <span className="text-sm text-gray-500 truncate max-w-xs">
                      {lastMessage?.text || "Say hi 👋"}
                    </span>
                  </div>
                </div>

                <div className="flex flex-col items-end">
                  <span className="text-xs text-gray-400">
                    {lastMessage?.created_at
                      ? new Date(lastMessage.created_at).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })
                      : ""}
                  </span>

                  {unreadCount > 0 && (
                    <span className="text-xs bg-primary text-white px-2 rounded-full">
                      {unreadCount}
                    </span>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default RecentChatsPage;