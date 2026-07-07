const db = require('../models');
const User = db.User;
const Customer = db.Customer;
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const sendEmail = require('../utils/sendEmail');

const registerUser = async (req, res) => {
    try {
        const { firstName, lastName, title, birthDate, gender, phone, password, email } = req.body;
        const name = [firstName, lastName].filter(Boolean).join(' ').trim();
        let imagePath = null;

        if (req.file) {
            imagePath = req.file.path.replace(/\\/g, '/');
        }

        // Validate required fields
        if (!name || !password || !email) {
            return res.status(400).json({ error: 'First name, last name, email, and password are required' });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create user
        const user = await User.create({
            name,
            email,
            password: hashedPassword
        });

        const customer = await Customer.create({
            user_id: user.id,
            fname: firstName,
            lname: lastName,
            phone: phone || null,
            image_path: imagePath
        });

        // generate token and save
        const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: '7d' });
        await user.update({ token });

        return res.status(201).json({
            success: true,
            message: 'User registered successfully',
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                customer: {
                    fname: customer.fname,
                    lname: customer.lname,
                    phone: customer.phone
                }
            },
            token
        });
    } catch (error) {
        console.log(error);
        if (error.name === 'SequelizeUniqueConstraintError') {
            return res.status(409).json({ error: 'Email already exists' });
        }
        return res.status(500).json({ error: 'Error registering user', details: error.message });
    }
};

const loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required' });
        }

        let user;
        try {
            // Attempt normal Sequelize lookup
            user = await User.findOne({
                where: {
                    email,
                    deleted_at: null
                }
            });
        } catch (dbErr) {
            // If DB schema differs (missing columns like `role`), fallback to raw query
            console.warn('Sequelize lookup failed, falling back to raw query ->', dbErr && dbErr.message);
            const sql = 'SELECT id, name, email, password, deleted_at FROM users WHERE email = ? AND deleted_at IS NULL LIMIT 1';
            const [results] = await db.sequelize.query(sql, { replacements: [email], type: db.Sequelize.QueryTypes.SELECT });
            if (results && results.id) {
                user = results; // plain object with fields
            } else {
                user = null;
            }
        }

        if (!user) {
            return res.status(401).json({ success: false, message: 'Invalid email or password' });
        }

        // Compare passwords
        const match = await bcrypt.compare(password, user.password);
        if (!match) {
            return res.status(401).json({ success: false, message: 'Invalid email or password' });
        }


        // Generate JWT token
        const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: '7d' });

        // save token to user record — use model update when possible, otherwise raw SQL
        try {
            if (user.update) {
                await user.update({ token });
            } else {
                await db.sequelize.query('UPDATE users SET token = ? WHERE id = ?', { replacements: [token, user.id] });
            }
        } catch (uerr) {
            console.warn('Failed to persist token to users table', uerr && uerr.message);
        }

        let customer = await Customer.findOne({ where: { user_id: user.id } });
        if (!customer) {
            const [fname, ...lnameParts] = user.name.split(' ');
            const lname = lnameParts.join(' ') || '';
            customer = await Customer.create({
                user_id: user.id,
                fname: fname || user.name,
                lname: lname || ''
            });
        }

        const userResponse = {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role || 'user',
            customer: customer ? {
                fname: customer.fname,
                lname: customer.lname,
                addressline: customer.addressline,
                zipcode: customer.zipcode,
                phone: customer.phone,
                image_path: customer.image_path
            } : null
        };

        return res.status(200).json({
            success: true,
            message: 'Welcome back',
            user: userResponse,
            token
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ error: 'Error logging in', details: error.message });
    }
};

const updateUser = async (req, res) => {
    try {
        const { fname, lname, addressline, zipcode, phone, userId } = req.body;

        // Validate required field
        if (!userId) {
            return res.status(400).json({ error: 'User ID is required' });
        }

        let imagePath = null;
        if (req.file) {
            imagePath = req.file.path.replace(/\\/g, "/");
        }

        // Find or create customer record
        const [customer, created] = await Customer.findOrCreate({
            where: { user_id: userId },
            defaults: {
                fname,
                lname,
                addressline,
                zipcode,
                phone,
                image_path: imagePath,
                user_id: userId
            }
        });

        // Update if already exists
        if (!created) {
            await customer.update({
                fname: fname || customer.fname,
                lname: lname || customer.lname,
                addressline: addressline || customer.addressline,
                zipcode: zipcode || customer.zipcode,
                phone: phone || customer.phone,
                image_path: imagePath || customer.image_path
            });
        }

        return res.status(200).json({
            success: true,
            message: 'Profile updated successfully',
            customer
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ error: 'Error updating profile', details: error.message });
    }
};

const listUsers = async (req, res) => {
    try {
        const users = await User.findAll({
            attributes: ['id', 'name', 'email', 'role', 'deleted_at', 'created_at', 'updated_at']
        });
        return res.status(200).json({ success: true, users });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ error: 'Error listing users', details: error.message });
    }
};

const getCurrentUser = async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({ error: 'Authentication required' });
        }
        const user = req.user;
        const customer = await Customer.findOne({ where: { user_id: user.id } });
        return res.status(200).json({
            success: true,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                customer: customer ? {
                    fname: customer.fname,
                    lname: customer.lname,
                    addressline: customer.addressline,
                    zipcode: customer.zipcode,
                    phone: customer.phone,
                    image_path: customer.image_path
                } : null
            }
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ error: 'Error fetching current user', details: error.message });
    }
};

const updateUserRole = async (req, res) => {
    try {
        const userId = Number(req.params.id);
        const { role } = req.body;
        if (!['user', 'admin'].includes(role)) {
            return res.status(400).json({ error: 'Invalid role' });
        }
        const user = await User.findOne({ where: { id: userId } });
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        await user.update({ role });
        return res.status(200).json({ success: true, user: { id: user.id, email: user.email, role: user.role } });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ error: 'Error updating user role', details: error.message });
    }
};

const changePassword = async (req, res) => {
    try {
        const userId = req.body.user?.id;
        const { currentPassword, newPassword } = req.body;

        if (!userId) return res.status(401).json({ error: 'Authentication required' });
        if (!currentPassword || !newPassword) return res.status(400).json({ error: 'Current and new password are required' });
        if (typeof newPassword !== 'string' || newPassword.length < 6 || !/\d/.test(newPassword)) {
            return res.status(400).json({ error: 'Password must be at least 6 characters and include a number' });
        }

        const user = await User.findOne({ where: { id: userId } });
        if (!user) return res.status(404).json({ error: 'User not found' });

        const match = await bcrypt.compare(String(currentPassword), user.password);
        if (!match) return res.status(403).json({ error: 'Current password is incorrect' });

        const hashed = await bcrypt.hash(String(newPassword), 10);
        await user.update({ password: hashed });
        return res.status(200).json({ success: true, message: 'Password changed successfully' });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: 'Unable to change password', details: error.message });
    }
};

const adminChangePassword = async (req, res) => {
    try {
        const adminId = req.body.user?.id;
        const targetId = Number(req.params.id);
        const { newPassword } = req.body;

        if (!adminId) return res.status(401).json({ error: 'Authentication required' });
        const adminUser = await User.findOne({ where: { id: adminId } });
        if (!adminUser || adminUser.role !== 'admin') return res.status(403).json({ error: 'Admin access required' });

        if (!newPassword || typeof newPassword !== 'string' || newPassword.length < 6 || !/\d/.test(newPassword)) {
            return res.status(400).json({ error: 'Password must be at least 6 characters and include a number' });
        }

        const target = await User.findOne({ where: { id: targetId } });
        if (!target) return res.status(404).json({ error: 'Target user not found' });

        const hashed = await bcrypt.hash(String(newPassword), 10);
        await target.update({ password: hashed });
        return res.status(200).json({ success: true, message: `Password updated for user ${target.email}` });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: 'Unable to change password', details: error.message });
    }
};

const deactivateUserById = async (req, res) => {
    try {
        const userId = Number(req.params.id);
        if (!userId) {
            return res.status(400).json({ error: 'User ID is required' });
        }
        if (req.user && req.user.id === userId) {
            return res.status(400).json({ error: 'You cannot deactivate yourself' });
        }
        const user = await User.findOne({ where: { id: userId } });
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        const timestamp = new Date();
        await user.update({ deleted_at: timestamp });
        return res.status(200).json({ success: true, message: 'User deactivated successfully', id: user.id, deleted_at: timestamp });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ error: 'Error deactivating user', details: error.message });
    }
};

const reactivateUserById = async (req, res) => {
    try {
        const userId = Number(req.params.id);
        if (!userId) {
            return res.status(400).json({ error: 'User ID is required' });
        }
        const user = await User.findOne({ where: { id: userId } });
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        await user.update({ deleted_at: null });
        return res.status(200).json({ success: true, message: 'User reactivated successfully', id: user.id, deleted_at: null });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ error: 'Error reactivating user', details: error.message });
    }
};

const deactivateUser = async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({ error: 'Email is required' });
        }

        // Find and update user
        const user = await User.findOne({ where: { email } });

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        const timestamp = new Date();
        await user.update({ deleted_at: timestamp });

        return res.status(200).json({
            success: true,
            message: 'User deactivated successfully',
            email,
            deleted_at: timestamp
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ error: 'Error deactivating user', details: error.message });
    }
};

const sendToken = async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) return res.status(400).json({ error: 'Email is required' });

        const user = await User.findOne({ where: { email } });
        if (!user) return res.status(404).json({ error: 'User not found' });

        const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: '7d' });
        await user.update({ token });

        await sendEmail({
            email: user.email,
            subject: 'Your Bookverse token',
            message: `Your authentication token: ${token}`
        });

        return res.status(200).json({ success: true, message: 'Token sent to email' });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ error: 'Unable to send token', details: error.message });
    }
};

module.exports = { registerUser, loginUser, updateUser, listUsers, getCurrentUser, updateUserRole, deactivateUserById, reactivateUserById, deactivateUser, sendToken, changePassword, adminChangePassword };
// const connection = require('../config/_database');
// const bcrypt = require('bcrypt')
// const jwt = require('jsonwebtoken')

// const registerUser = async (req, res) => {
//     // {
//     //   "name": "steve",
//     //   "email": "steve@gmail.com",
//     //   "password": "password"
//     // }
//     console.log(req.body)
//     const { name, password, email, } = req.body;
//     const hashedPassword = await bcrypt.hash(password, 10);
//     const userSql = 'INSERT INTO users (name, password, email) VALUES (?, ?, ?)';
//     try {
//         connection.execute(userSql, [name, hashedPassword, email], (err, result) => {
//             if (err instanceof Error) {
//                 console.log(err);

//                 return res.status(401).json({
//                     error: err
//                 });
//             }

//             return res.status(200).json({
//                 success: true,
//                 result
//             })
//         });
//     } catch (error) {
//         console.log(error)
//     }

// };

// const loginUser = (req, res) => {
//     const { email, password } = req.body;
//     const sql = 'SELECT id, name, email, password FROM users WHERE email = ? AND deleted_at IS NULL';
//     connection.execute(sql, [email], async (err, results) => {
//         if (err) {
//             console.log(err);
//             return res.status(500).json({ error: 'Error logging in', details: err });
//         }
//         if (results.length === 0) {
//             return res.status(401).json({ success: false, message: 'Invalid email or password' });
//         }

//         const user = results[0];

//         const match = await bcrypt.compare(password, user.password);
//         if (!match) {
//             return res.status(401).json({ success: false, message: 'Invalid email or password' });
//         }

//         // Remove password from response
//         delete user.password;
//         const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET,);

//         return res.status(200).json({
//             success: "welcome back",
//             user: results[0],
//             token
//         });
//     });
// };

// const updateUser = (req, res) => {
//     // {
//     //   "name": "steve",
//     //   "email": "steve@gmail.com",
//     //   "password": "password"
//     // }
//     console.log(req.body, req.file)
//     const { fname, lname, addressline, town, zipcode, phone, userId, } = req.body;

//     if (req.file) {
//         image = req.file.path.replace(/\\/g, "/");
//     }
//     //     INSERT INTO users(user_id, username, email)
//     //   VALUES(1, 'john_doe', 'john@example.com')
//     // ON DUPLICATE KEY UPDATE email = 'john@example.com';
//     const userSql = `
//   INSERT INTO customer 
//     (fname, lname, addressline,  zipcode, phone, image_path, user_id)
//   VALUES (?, ?, ?, ?, ?, ?, ?)
//   ON DUPLICATE KEY UPDATE 
//     fname = VALUES(fname),
//     lname = VALUES(lname),
//     addressline = VALUES(addressline),
   
//     zipcode = VALUES(zipcode),
//     phone = VALUES(phone),
//     image_path = VALUES(image_path)`;
//     const params = [fname, lname, addressline, zipcode, phone, image, userId];

//     try {
//         connection.execute(userSql, params, (err, result) => {
//             if (err instanceof Error) {
//                 console.log(err);

//                 return res.status(401).json({
//                     error: err
//                 });
//             }

//             return res.status(200).json({
//                 success: true,
//                 message: 'profile updated',
//                 result
//             })
//         });
//     } catch (error) {
//         console.log(error)
//     }

// };

// const deactivateUser = (req, res) => {
//     const { email } = req.body;
//     if (!email) {
//         return res.status(400).json({ error: 'Email is required' });
//     }

//     const sql = 'UPDATE users SET deleted_at = ? WHERE email = ?';
//     const timestamp = new Date();

//     connection.execute(sql, [timestamp, email], (err, result) => {
//         if (err) {
//             console.log(err);
//             return res.status(500).json({ error: 'Error deactivating user', details: err });
//         }
//         if (result.affectedRows === 0) {
//             return res.status(404).json({ error: 'User not found' });
//         }
//         return res.status(200).json({
//             success: true,
//             message: 'User deactivated successfully',
//             email,
//             deleted_at: timestamp
//         });
//     });
// };

// module.exports = { registerUser, loginUser, updateUser, deactivateUser };