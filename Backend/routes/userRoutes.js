const express= require("express");
const verifyToken= require("../middleware/authMiddleware");
const authorizeRoles = require("../middleware/roleMiddleware");
const router= express.Router();



//Only admin can access this router
router.get("/admin",verifyToken,authorizeRoles ("admin"),(req,res) => {
    res.json({message:"Welcome Admin"});

});

//Both admin and users can access this router
router.get("/user",verifyToken,authorizeRoles ("admin","user"),(req,res) => {
    res.json({message:"Welcome User"});

});

module.exports=router