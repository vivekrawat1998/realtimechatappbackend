const jwt = require("jsonwebtoken");

const jwtSecretKey = "your_jwt_secret_key"; 

const verifyToken = (req, res, next) => {
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(' ')[1];

    console.log("Authorization Header:", authHeader);
    console.log("Token being verified:", token);

    if (!token) {
        return res.status(403).send({ message: "No token provided!" });
    }

    jwt.verify(token, jwtSecretKey, (err, decoded) => {
        if (err) {
            console.log("Token verification error:", err);
            return res.status(401).send({ message: "Unauthorized!" });
        }
        req.userId = decoded.id;
        req.userRole = decoded.role;
        console.log("Decoded user:", decoded);
        next();
    });
};

const isAdmin = (req, res, next) => {
    console.log("User role:", req.userRole);
    if (req.userRole !== 'admin') {
        return res.status(403).send({ message: "Require Admin Role!" });
    }
    next();
};


module.exports = { verifyToken, isAdmin };
