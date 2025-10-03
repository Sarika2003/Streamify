import express from "express"
import "dotenv/config"
import cors from "cors"
import path from "path";
import authRoutes from "./routes/authRoutes.js"
import userRoutes from "./routes/userRoutes.js"
import chatRoutes from "./routes/chatRoutes.js"

import { connectDB } from "./lib/db.js";
import cookieParser from "cookie-parser"


connectDB();

const app = express();
const PORT = process.env.PORT;

const __dirname = path.resolve();


app.use(cors({
  origin: "http://localhost:5173",
  credentials:true //allow frontend to send the cookies
}));

app.use(express.json());
app.use(cookieParser());


app.use("/api/auth" , authRoutes);
app.use("/api/users" , userRoutes);
app.use("/api/chat" , chatRoutes);

if(process.env.NODE_ENV === "production"){
  app.use(express.static(path.join(__dirname , "../client/dist")));

  app.get("*" , (req,res)=>{
    res.sendFile(path.join(__dirname , "../client" , "dist" , "index.html" ));
  })
}



app.listen(PORT , ()=>{
    console.log(`server is running at port ${PORT}` );
  
})