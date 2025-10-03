import User from "../models/userModel.js";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import { upsertStreamUser } from "../lib/stream.js";

dotenv.config();

//SIGNUP
export async function signup(req, res) {
  const { fullName, email, password } = req.body;

  try {
    if (!email || !password || !fullName) {
      return res.status(400).json({ message: "All fields are required" });
    }

    //validate password
    if (password.length < 6) {
      return res
        .status(400)
        .json({ message: "Password must be at least 6 characters" });
    }

    //validate email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: "Invalid email format" });
    }

    //check if email exist (email must be unique)
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res
        .status(400)
        .json({ message: "Email already exists , please use a different one" });
    }

    //random avatars
    const idx = Math.floor(Math.random() * 100) + 1; //generate a num between 1-100
    const randomAvatar = `https://avatar.iran.liara.run/public/${idx}.png`;

    //create new User
    const newUser = await User.create({
      email,
      fullName,
      password,
      profilePic: randomAvatar,
    });

    // when the user will signup we will also create his/her Stream instance
    try {
      await upsertStreamUser({
        id: newUser._id.toString(),
        name: newUser.fullName,
        image: newUser.profilePic || "",
      });
      console.log(`Stream user created for ${newUser.fullName}`);
    } catch (error) {
        console.log("Error creating Stream user:" , error);
    }

    //create token
    const token = jwt.sign(
      { userId: newUser._id },
      process.env.JWT_SECRET_KEY,
      {
        expiresIn: "7d",
      }
    );

    res.cookie("token", token, {
      maxAge: 7 * 24 * 60 * 60 * 1000,
      httpOnly: true, //prevent XSS attacks
      sameSite: "strict", //prevent CSRF attacks
      // secure : process.env.NODE_ENV=== "production"
      secure: false,
    });

    res.status(201).json({ success: true, user: newUser });
  } catch (error) {
    console.log("error in signup", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
}

//LOGIN
export async function login(req, res) {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: "Invalid email or password" });
    }

    const isPasswordCorrect = await user.matchPassword(password);

    if (!isPasswordCorrect) {
      return res.status(404).json({ message: "Invalid email or password" });
    }

    //create token
    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET_KEY, {
      expiresIn: "7d",
    });

    res.cookie("token", token, {
      maxAge: 7 * 24 * 60 * 60 * 1000,
      httpOnly: true, //prevent XSS attacks
      sameSite: "strict", //prevent CSRF attacks
      // secure : process.env.NODE_ENV=== "production"
      secure: false,
    });

    res.status(200).json({ success: true, user });
  } catch (error) {
    console.log("error in login", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
}

//LOGOUT
export async function logout(req, res) {
  res.clearCookie("token");
  res.status(200).json({ success: true, message: "Logout successful" });
}

//ONBOARING
export  async function onboard(req, res){
  try{
    const userId = req.user._id;

    const {fullName , bio , nativeLanguage , learningLanguage , location} = req.body;

    if(!fullName || !bio || !nativeLanguage || !learningLanguage || !location){
      return res.status(400).json({
        message: "All fields are required",
      missingFields: [
        !fullName && "fullName",
        !bio && "bio" ,
        !nativeLanguage && "nativeLanguage",
        !learningLanguage && "learningLanguage",
        !location && "location"
      ].filter(Boolean),
    });
    }

    const updatedUser= await User.findByIdAndUpdate(userId , {
      ...req.body,
      isOnboarded : true,
    } , {new:true}) //will give updated user

    if(!updatedUser) {
      return res.status(404).josn({message:"User not found"});
    }

    //update user in Stream as well
    try{
       await upsertStreamUser({
      id: updatedUser._id.toString(),
      name:updatedUser.fullName,
      image: updatedUser.profilePic || "",
      
       })

       console.log(`Stram user updated after onboarding for ${updatedUser.fullName}`);

    }catch(streamError){
      console.log("Error updating Stream user during onboarding" , streamError.message);
    }

   return res.status(200).json({message:{success:true , user:updatedUser}});

  }catch(error){
    console.error("Onboarding error" , error);
    res.status(500).json({message:"Internal Server Error"});
  }
}
