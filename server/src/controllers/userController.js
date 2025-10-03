import User from "../models/userModel.js"
import FriendRequest from "../models/FriendRequestModel.js"

export async function getRecommendedUsers(req,res){
    try{
      const currentUserId = req.user.id;
    //   const currentUser = req.user; it can be a mistake we might not get  friends array
     const currentUser = await User.findById(req.user.id); //using this so that we get friends array


    if (!currentUser) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

      //return those users for which all conditions are true
      const recommendedUsers = await User.find({
        $and:[
          {_id: {$ne : currentUserId}}, //exclude current user
          {_id: {$nin: currentUser.friends}}, //exclude current user's friends
          {isOnboarded:true}

        ]  })

        res.status(200).json(recommendedUsers);
    }catch(error){
       console.error("Error in getRecommendedUsers controller" , error.message);
       res.status(500).json({message: "Internal Server Error"});
    }
}

export async function getMyFriends(req,res){
   try{
    
      const user = await User.findById(req.user.id)
      .select("friends")
      .populate("friends" , "fullName profilePic nativeLanguage learningLanguage");

     res.status(200).json(user.friends);
     
   }catch(error){
     console.error("Error in getMyFriends controller" , error.message);
     res.status(500).json({message: "Internal Server Error"});
   }
}

export async function sendFriendRequest(req, res){
    try{
      const myId = req.user.id;
      const {id:recipientId}  = req.params;

      //prevent sending req to yourself
      if(myId === recipientId) {
        return res.status(400).json({message:"You can't send friend request to yourself"});
       }

       const recipient = await User.findById(recipientId)
       if(!recipient) {
         return res.status(404).json({message:"User not found"});
       }

       //check if user is already friend
       if(recipient.friends.includes(myId)){
         return res.status(400).json({message:"You are already friends with this user"});
       }

       //check if req already exists
       const existingRequest = await FriendRequest.findOne({
        $or:[
            {sender:myId , recipient:recipientId},
            {sender:recipientId , recipient:myId},
        ],
       });
       
       if(existingRequest){
        return res.status(400).json({message:"A friend request already exist between you and this user"});
       }
       
       const friendRequest = await FriendRequest.create({
        sender: myId,
        recipient:recipientId,
       });

       res.status(201).json(friendRequest);

    }catch(error){
       console.error("Error in sendFriendRequest controller" , error.message);
       res.status(500).json({message:"Internal server error"});
    }
}

export async function acceptFriendRequest(req,res) {
    try{
       const {id:requestId}= req.params;

       const friendRequest = await FriendRequest.findById(requestId);

       if(!friendRequest){
        return res.status(404).json({message:"Friend request not found"});
       }

        //verify current user is the recipient
        if(friendRequest.recipient.toString() !== req.user.id){
            return res.status(403).json({message:"Your are not authorized to accdept this request"});
        }

        friendRequest.status = "accepted";
        await friendRequest.save();

        //add each user to the other's friends array
        //$addToSet: adds elements to an array only if they do not already exist.
        await User.findByIdAndUpdate(friendRequest.sender , {
            $addToSet: {friends: friendRequest.recipient},
        });

        await User.findByIdAndUpdate(friendRequest.recipient , {
            $addToSet: {friends: friendRequest.sender},
        });

        res.status(200).json({message:"Friend request accepted"});

    }catch(error){
       console.log("Erro in acceptFriendRequest controller" , error.message);
       res.status(500).json({message:"Internal Server Errro"});
    }
    
}

export async function getFriendRequest(req,res){
    try{
       const incomingReqs  = await FriendRequest.find({
         recipient:req.user.id,
         status:"pending",
       }).populate("sender" , "fullName profilePic nativeLanguage learningLanguage");

       const acceptedReqs  = await FriendRequest.find({
         sender:req.user.id,
         status:"accepted",
       }).populate("recipient" , "fullName profilePic");

       res.status(200).json({incomingReqs , acceptedReqs})
    }catch(error){
       console.log("Error in getPendingFriendRequests controller" , error.message);
       res.status(500).json({message: "Internal Server Error"});
    }
} 

export async function getOutgoingFriendReqs(req, res){
    try{
      const outgoingRequests = await FriendRequest.find({
        sender:req.user.id,
        status:"pending",
      }).populate("recipient" , "fullName profilePic nativeLanguage learningLanguage");

      res.status(200).json(outgoingRequests);
    }catch(error){
      console.log("Error in getOutgoingFriendReqs controller" ,error.message);
      res.status(500).json({message: "Internal Server Error"});
    }
}


export const updateProfile = async (req, res) => {
  try {
    const userId = req.user.id; 
    
    const { fullName, bio, location, profilePic, learningLanguage } = req.body;

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      {
        fullName,
        bio,
        location,
        profilePic,
        learningLanguage,
      },
      { new: true, runValidators: true } 
    ).select("-password"); 

    res.status(200).json({
      success: true,
      user: updatedUser,
    });
  } catch (error) {
    console.error("Error updating profile:", error);
    res.status(500).json({
      success: false,
      message: "Server error while updating profile",
    });
  }
};
