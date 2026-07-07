const express = require('express');
const router = express.Router();
const upload = require('../utils/multer')

const { registerUser,
    loginUser,
    updateUser,
    listUsers,
    updateUserRole,
    deactivateUserById,
    reactivateUserById,
    changePassword,
    adminChangePassword,
    getCurrentUser,
    deactivateUser,
    sendToken

} = require('../controllers/user')
const { isAuthenticatedUser, isAdminUser } = require('../middlewares/auth')

router.post('/register', upload.single('image'), registerUser)
router.post('/login', loginUser)
router.post('/send-token', sendToken)
router.post('/update-profile', isAuthenticatedUser, upload.single('image'), updateUser)
router.get('/me', isAuthenticatedUser, getCurrentUser)
router.get('/users', isAuthenticatedUser, isAdminUser, listUsers)
router.put('/users/:id/role', isAuthenticatedUser, isAdminUser, updateUserRole)
router.put('/users/:id/deactivate', isAuthenticatedUser, isAdminUser, deactivateUserById)
router.put('/users/:id/reactivate', isAuthenticatedUser, isAdminUser, reactivateUserById)
router.put('/users/:id/password', isAuthenticatedUser, isAdminUser, adminChangePassword)
router.delete('/deactivate', deactivateUser)
router.post('/change-password', isAuthenticatedUser, changePassword)
module.exports = router