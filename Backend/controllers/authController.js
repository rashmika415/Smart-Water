const bcrypt = require("bcryptjs");

const jwt = require("jsonwebtoken");


const User=require("../models/userModel");

const register =async(req,res)=>{

    try{

    const{name,email,password,role}=req.body;
    const hashedPassword= await bcrypt.hash(password,10);

    const newUser = new User({name,email,password:hashedPassword,role})
    await newUser.save();
    res.status(201).json({message:`User Registered with username ${name} `});

}catch(err){ res.status(500).json({message:"Something went wrong"});}

};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: `User with email ${email} not found` });
    }

    // Compare password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    // Generate JWT
    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }  // ✅ fixed typo
    );

    res.status(200).json({ token });
  } catch (err) {
    console.error(err);  // ✅ always log the actual error for debugging
    res.status(500).json({ message: "Something went wrong" });
  }
};

module.exports={
    register,
    login,
}

