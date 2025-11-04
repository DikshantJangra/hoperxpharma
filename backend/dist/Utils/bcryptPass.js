import bcrypt from "bcrypt";
const saltRounds = 12;
const hashPassword = async (password) => {
    return await bcrypt.hash(password, saltRounds);
};
const verifyPassword = async (password, hashedPassword) => {
    return await bcrypt.compare(password, hashedPassword);
};
export { hashPassword, verifyPassword };
//# sourceMappingURL=bcryptPass.js.map