import prisma from "../db/prisma.js";
import { hashPassword } from "../utils/bcryptPass.js";
import { generateToken } from "../Utils/token.js";

export const signupUser = async (req, res) => {
  const { name, email, phoneNumber, password, confirmPassword } = req.body;

  if (!name || !email || !phoneNumber || !password || !confirmPassword) {
    return res.status(400).json({ message: "All fields are required!" });
  }

  if (password !== confirmPassword) {
    return res.status(400).json({ message: "Passwords do not match!" });
  }

  try {
    const existingUser = await prisma.user.findFirst({
      where: { email },
    });

    if (existingUser) {
      return res
        .status(400)
        .json({ message: "Try with another email or phone number!" });
    }

    const hashedPassword = await hashPassword(password);

    const newUser = await prisma.user.create({
      data: {
        name,
        email,
        phoneNumber,
        password: hashedPassword,
      },
    });

    const token = generateToken(newUser.id);

    return res
      .status(201)
      .json({ message: "New user created!", token });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server Error!" });
  }
};
