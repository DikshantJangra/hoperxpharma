const jwt = require('jsonwebtoken');
require('dotenv').config();

const generateToken = () => {
    const payload = {
        id: 'cmie9akaf001v14biv908o1qb', // User ID from check-pos.js output
        role: 'PHARMACIST',
        email: 'Hopeuser1@gmail.com'
    };

    const secret = process.env.JWT_SECRET || 'your_jwt_secret_key_here';
    const token = jwt.sign(payload, secret, { expiresIn: '1d' });
    console.log(token);
};

generateToken();
