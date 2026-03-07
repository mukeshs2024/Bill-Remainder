const { generateToken } = require('../utils/jwtUtils');
const { sendWelcomeEmail } = require('../utils/emailService');

/**
 * Auth Controller
 * Handles user registration, login, and authentication
 */

/**
 * Register new user
 */
exports.register = async (req, res, next) => {
  try {
    const User = global.User;
    const { username, email, password, firstName, lastName } = req.body;

    // Validation
    if (!username || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Username, email, and password are required'
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [{ email }, { username }]
    });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'User already exists with this email or username'
      });
    }

    // Create new user
    const newUser = await User.create({
      username,
      email,
      password,
      firstName: firstName || '',
      lastName: lastName || ''
    });

    // Send welcome email
    await sendWelcomeEmail(email, firstName || username);

    // Generate token
    const token = generateToken(newUser._id);

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      token,
      user: {
        _id: newUser._id,
        username: newUser.username,
        email: newUser.email,
        firstName: newUser.firstName,
        lastName: newUser.lastName
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Login user
 */
exports.login = async (req, res, next) => {
  try {
    const User = global.User;
    const { email, password } = req.body;

    console.log('[AUTH] Login attempt:', { email });

    // Validation
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required'
      });
    }

    // Find user and select password field
    const user = await User.findOne({ email }).select('+password');

    if (!user) {
      console.log('[AUTH] User not found:', email);
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Compare password
    const isPasswordValid = await user.comparePassword(password);

    if (!isPasswordValid) {
      console.log('[AUTH] Invalid password for user:', email);
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Generate token
    const token = generateToken(user._id);
    console.log('[AUTH] Token generated for user:', email);
    console.log('[AUTH] Token:', token.substring(0, 30) + '...');

    res.status(200).json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        _id: user._id,
        username: user.username,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get current user
 */
exports.getCurrentUser = async (req, res, next) => {
  try {
    const User = global.User;
    const user = await User.findById(req.userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.status(200).json({
      success: true,
      user: {
        _id: user._id,
        username: user.username,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update user profile
 */
exports.updateProfile = async (req, res, next) => {
  try {
    const User = global.User;
    const { firstName, lastName, phone, emailNotificationsEnabled, defaultReminderDays } = req.body;

    const user = await User.findByIdAndUpdate(
      req.userId,
      {
        firstName,
        lastName,
        phone,
        emailNotificationsEnabled,
        defaultReminderDays
      },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      user: {
        _id: user._id,
        username: user.username,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Change password
 */
exports.changePassword = async (req, res, next) => {
  try {
    const User = global.User;
    const { currentPassword, newPassword, confirmPassword } = req.body;

    // Validation
    if (!currentPassword || !newPassword || !confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'All password fields are required'
      });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'New passwords do not match'
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters long'
      });
    }

    // Get user with password field
    const user = await User.findById(req.userId).select('+password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Verify current password
    const isPasswordValid = await user.comparePassword(currentPassword);

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }

    // Update password
    user.password = newPassword;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Password changed successfully'
    });
  } catch (error) {
    next(error);
  }
};
/**
 * Verify Clerk token and issue JWT
 * This endpoint accepts Clerk session tokens and returns a JWT token
 */
exports.verifyClerkToken = async (req, res, next) => {
  try {
    const User = global.User;
    const { clerkToken, clerkUserId, email, firstName, lastName } = req.body;

    // Validation
    if (!clerkToken || !clerkUserId || !email) {
      return res.status(400).json({
        success: false,
        message: 'Clerk token, user ID, and email are required'
      });
    }

    console.log('[AUTH] Verifying Clerk token for user:', clerkUserId);

    // Find or create user by Clerk ID
    let user = await User.findOne({ clerkId: clerkUserId });

    if (!user) {
      // Create new user from Clerk data
      console.log('[AUTH] Creating new user from Clerk data:', email);
      user = await User.create({
        clerkId: clerkUserId,
        email,
        username: email.split('@')[0],
        firstName: firstName || '',
        lastName: lastName || '',
        password: null // Clerk handles password
      });
    } else {
      // Update user info if changed
      user.email = email;
      user.firstName = firstName || user.firstName;
      user.lastName = lastName || user.lastName;
      await user.save();
    }

    // Generate JWT token for API access
    const token = generateToken(user._id);

    console.log('[AUTH] JWT token issued for Clerk user:', clerkUserId);

    res.status(200).json({
      success: true,
      message: 'Token verified successfully',
      token,
      user: {
        _id: user._id,
        clerkId: user.clerkId,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName
      }
    });
  } catch (error) {
    console.error('[AUTH] Error verifying Clerk token:', error);
    next(error);
  }
};