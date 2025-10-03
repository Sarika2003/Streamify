import { create } from "zustand";
import { StreamChat } from "stream-chat";

const STREAM_API_KEY = import.meta.env.VITE_STREAM_API_KEY;

export const useChatStore = create((set, get) => ({
  chatClient: null,
  currentChannel: null,
  isClientReady: false,

  // Initializes and connects the Stream Chat client
  initClient: async (authUser, token) => {
    if (!authUser || !token || !STREAM_API_KEY) return;

    let client = get().chatClient;
    if (!client) {
      client = StreamChat.getInstance(STREAM_API_KEY);
    }

    // Return early if already connected and authenticated.
    if (client.userID === authUser._id && client.tokenManager.token) {
      set({ chatClient: client, isClientReady: true });
      return client;
    }

    // Disconnect existing user if necessary.
    if (client.userID) {
      await client.disconnectUser().catch(() => {});
    }

    try {
      await client.connectUser(
        {
          id: authUser._id,
          name: authUser.fullName,
          image: authUser.profilePic,
        },
        token
      );
      set({ chatClient: client, isClientReady: true });
      return client;
    } catch (e) {
      console.error("Stream connection failed:", e);
      set({ chatClient: null, isClientReady: false });
      return null;
    }
  },

  // Initializes and watches a specific messaging channel between two users.
  initChannel: async (authUserId, targetUserId) => {
    const client = get().chatClient;

    if (!client || !client.userID || !client.tokenManager.token) {
      throw new Error("Client is not ready/authenticated.");
    }

    const channelId = [authUserId, targetUserId].sort().join("-");

    // Check if the channel is already active in the client's memory.
    let channel = client.activeChannels[`messaging:${channelId}`];

    if (!channel) {
      channel = client.channel("messaging", channelId, {
        members: [authUserId, targetUserId],
      });
      await channel.watch(); 
    }

    set({ currentChannel: channel });
    return channel;
  },

  // Disconnects the user 
  disconnectClient: async () => {
    const client = get().chatClient;
    if (client) {
      await client.disconnectUser().catch(() => {});
      set({ chatClient: null, currentChannel: null, isClientReady: false });
    }
  },
}));