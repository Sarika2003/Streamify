import express from "express"
import {protectRoute} from "../middleware/authMiddleware.js"
import {getRecommendedUsers, getMyFriends , sendFriendRequest , acceptFriendRequest , getFriendRequest , getOutgoingFriendReqs, updateProfile} from "../controllers/userController.js"

const router = express.Router();

//apply auth middleware to all routes
router.use(protectRoute);

router.get("/" , getRecommendedUsers);
router.get("/friends" , getMyFriends);

router.post("/friend-request/:id" ,sendFriendRequest);
router.put("/friend-request/:id/accept" , acceptFriendRequest);

router.get("/friend-requests" , getFriendRequest);
router.get("/outgoing-friend-requests" , getOutgoingFriendReqs);

router.put("/update-profile", updateProfile);
 

export default router;