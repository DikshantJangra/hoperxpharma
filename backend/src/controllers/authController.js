const prisma = require("../db/prisma.js");
const { hashPassword, verifyPassword } = require("../Utils/bcryptPassword.js");
const { generateToken } = require("../Utils/token.js");

const signupUser = async (req, res) => {
  const { email, phoneNumber, password, confirmPassword } = req.body;

  if (!email || !phoneNumber || !password || !confirmPassword) {
    return res.status(400).json({ message: "All fields are required!" });
  }

  if (password !== confirmPassword) {
    return res.status(400).json({ message: "Passwords do not match!" });
  }

  try {
    const existingUser = await prisma.user.findFirst({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists!" });
    }

    const hashedPassword = await hashPassword(password);
    const newUser = await prisma.user.create({
      data: { email, phoneNumber, password: hashedPassword },
    });

    const tokens = generateToken(newUser.id);
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
    const user = await prisma.user.findFirst({ where: { email } });
    if (!user) {
      return res.status(401).json({ message: "Invalid credentials!" });
    }

    const isPasswordValid = await verifyPassword(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: "Invalid credentials!" });
    }

    const tokens = generateToken(user.id);
    return res.status(200).json({ message: "Login successful!", token: tokens.accessTokens });
  } catch (err) {
    return res.status(500).json({ message: "Server Error!" });
  }
};

module.exports = { signupUser, loginUser };
