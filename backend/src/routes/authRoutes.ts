import { signupUser } from "../controllers/authControllers";
import { Router } from "express";

const router = Router();

router.post("/signup", signupUser)
// router.post("/login", )

export default router;