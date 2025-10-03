// hooks/useFriendRequestsCount.js
import { useQuery } from "@tanstack/react-query";
import { getFriendRequests } from "../lib/api";

export const useFriendRequestsCount = () => {
  const { data: friendRequests, isLoading, isError } = useQuery({
    queryKey: ["friendRequests"],
    queryFn: getFriendRequests,
    // Optional: Increase staleness time if you don't need instant updates globally
    // staleTime: 1000 * 60 * 5, // e.g., 5 minutes
  });

  const incomingCount = friendRequests?.incomingReqs?.length || 0;
  
  return { 
    incomingCount, 
    isLoading,
    isError
  };
};