import express from "express"
import { signup , login , logout , onboard} from "../controllers/authController.js"
import { protectRoute } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/signup" , signup)
router.post("/login" , login )
router.post("/logout" ,  logout)


router.post("/onboarding" , protectRoute , onboard)


//check if user is logged in 
router.get("/me", protectRoute, async (req, res) => {
  try {
    const user = await req.user.populate("friends", "_id fullName profilePic");

    res.status(200).json({ success: true, user });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});



export default router;

