const jwt = require("jsonwebtoken");

const verifyToken = (req, res, next) => {
    // Get token from headers
    let authHeader = req.headers.Authorization || req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ message: "No token, authorization denied" });
    }

    const token = authHeader.split(" ")[1];

    try {
        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // ✅ Set decoded user info to req.user
        req.user = decoded;

        console.log("Decoded user:", req.user); // optional debug

        next(); // VERY IMPORTANT
    } catch (err) {
        return res.status(400).json({ message: "Token is not valid" });
    }
};

module.exports = verifyToken;
