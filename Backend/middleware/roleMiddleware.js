const authorizeRoles = (...allowedRoles)=>{

    return (req,res,next) => {

        const userRole = req.user?.role?.toLowerCase();

        const normalizedAllowed = allowedRoles.map(r => r.toLowerCase());

        if(!normalizedAllowed.includes(userRole)){
            return res.status(403).json({
                message:"Access denied: insufficient permissions"
            });
        }

        next ();
    };
};

module.exports = authorizeRoles;
