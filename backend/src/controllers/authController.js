const { configDotenv } = require("dotenv");
const prisma = require("../db/prisma.js");
const { hashPassword, verifyPassword } = require("../Utils/bcryptPassword.js");
const { generateToken } = require("../Utils/token.js");
configDotenv();
const signupUser = async (req, res) => {
  const { name, email, phoneNumber, password, confirmPassword } = req.body;

  if (!name || !email || !phoneNumber || !password || !confirmPassword) {
    return res.status(400).json({ message: "All fields are required!" });
  }

  if (password !== confirmPassword) {
    return res.status(400).json({ message: "Passwords do not match!" });
  }

  try {
    const existingUser = await prisma.users.findFirst({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists!" });
    }

    const hashedPassword = await hashPassword(password);
    const newUser = await prisma.users.create({
      data: { name, email, phoneNumber, password: hashedPassword },
    });

    const tokens = generateToken(newUser.id);
    res.cookie('token', tokens.accessTokens, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax', maxAge: 24 * 60 * 60 * 1000 });
    return res.status(201).json({ message: "User created successfully!", token: tokens.accessTokens });
  } catch (err) {
    return res.status(500).json({ message: "Server Error!" });
  }
};

const loginUser = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: "Email and password required!" });
  }

  try {
    const user = await prisma.users.findFirst({ where: { email } });
    if (!user) {
      return res.status(401).json({ message: "Invalid credentials!" });
    }

    const isPasswordValid = await verifyPassword(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: "Invalid credentials!" });
    }

    const tokens = generateToken(user.id);
    res.cookie('token', tokens.accessTokens, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax', maxAge: 24 * 60 * 60 * 1000 });
    return res.status(200).json({ message: "Login successful!", token: tokens.accessTokens });
  } catch (err) {
    return res.status(500).json({ message: "Server Error!" });
  }
};

module.exports = { signupUser, loginUser };
