const jwt = require("jsonwebtoken");
const userId = "cmiudlvlk0000bg2b1kdj1go2";
const secret = "E2!h7fX9y!R#8uP@bqT4zL6wV0jN3sD%";
const token = jwt.sign({ userId, role: "Admin", type: "access" }, secret, { expiresIn: "1h" });
console.log(token);
