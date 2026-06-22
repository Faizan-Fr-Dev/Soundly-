const userModel = require("../models/user.model");
const jwt = require("jsonwebtoken");
const bcryptjs = require("bcryptjs");


async function registerUser(req, res) {
  const { username, email, password, role = "user" } = req.body;

  const isUserAlreadyExists = await userModel.findOne({
    $or: [{ username }, { email }],
  });

  if (isUserAlreadyExists) {
    return res.status(400).json({
      message: "User Already exists!!",
    });
  }

  const hash = await bcryptjs.hash(password, 10);

  const user = await userModel.create({
    username,
    email,
    password: hash,
    role,
  });

  const token = jwt.sign(
    {
      id: user._id,
      role: user.role,
    },
    process.env.JWT_SECRET,
  );

  res.cookie("token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
  });

  return res.status(201).json({
    message: "User registered successfully",
    user: {
      id: user._id,
      username: user.username,
      email: user.email,
      role: user.role,
      profileImage: user.profileImage || "",
    },
  });
}
async function loginUser(req, res) {
  const { username, email, password } = req.body;

  const loginIdentifier = username || email;

  const user = await userModel.findOne({
    $or: [{ username: loginIdentifier }, { email: loginIdentifier }],
  });

  if (!user) {
    return res.status(401).json({
      message: "Invalid Credentials",
    });
  }

  const isPasswordValid = await bcryptjs.compare(password, user.password);

  if (!isPasswordValid) {
    return res.status(401).json({
      message: "Invalid Credentials",
    });
  }

  const token = jwt.sign(
    { id: user._id, role: user.role },
    process.env.JWT_SECRET,
  );

  res.cookie("token", token, {
    httpOnly: true,
  });

  return res.status(200).json({
    message: "User logged in successfully",
    user: {
      id: user._id,
      username: user.username,
      email: user.email,
      role: user.role,
      profileImage: user.profileImage || "",
    },
  });
}


async function logoutUser(req,res){
  res.clearCookie("token")
  res.status(200).json({message:"Logged out successfully!!!"})
}

// ─── Profile picture update ────────────────────────────────────────────
async function updateProfilePicture(req, res) {
  try {
    const { profileImage } = req.body;
    if (!profileImage) {
      return res.status(400).json({ message: "profileImage URL is required" });
    }

    const user = await userModel.findByIdAndUpdate(
      req.user.id,
      { profileImage },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.status(200).json({
      message: "Profile picture updated!",
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        profileImage: user.profileImage || "",
      },
    });
  } catch (error) {
    console.error("Profile picture error:", error);
    return res.status(500).json({ message: error.message || "Failed to update profile picture" });
  }
}

module.exports = { registerUser, loginUser, logoutUser, updateProfilePicture };
