const express= require("express");
const verifyToken= require("../middleware/authMiddleware");
const router= express.Router();

//Only admin can access this router
router.get("/admin",verifyToken,(req,res) => {
    res.json({message:"Welcome Admin"});

});

//Both admin and users can access this router
router.get("/user",(req,res) => {
    res.json({message:"Welcome User"});

});

module.exports=router