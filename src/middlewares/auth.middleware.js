const jwt = require('jsonwebtoken');


async function authArtist(req,res,next){
    const token = req.cookies?.token;
    
        if (!token) {
          return res.status(401).json({
            message: "Unauthorized Request (No Token)",
          });
        }
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
        if (decoded.role !== "artist") {
          return res.status(403).json({
            message: "You don't have access to create music!",
          });
        }


        req.user = decoded
        next();
  } catch (err) {
    console.error("ERROR:", err.message);

    return res.status(401).json({
      message: "Unauthorized Request",
      error: err.message,
    });
  }
}


async function authUser(req,res,next){
    const token = req.cookies?.token;
    
        if (!token) {
          return res.status(401).json({
            message: "Unauthorized Request (No Token)",
          });
        }
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
        if (decoded.role !== "user") {
          return res.status(403).json({
            message: "You don't have access to create music!",
          });
        }
        req.user = decoded
        next();
  } catch (err) {
    console.error("ERROR:", err.message);

    return res.status(401).json({
      message: "Unauthorized Request",
      error: err.message,
    });
  }
}
module.exports = {authArtist , authUser};