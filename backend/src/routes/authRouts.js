const { signupUser, loginUser } = require("../controllers/authController.js");
const { Router } = require("express");

const router = Router();

router.post("/signup", signupUser)
router.post("/login", loginUser)

module.exports = router;