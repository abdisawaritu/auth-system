import express from "express";

import {
  registerUser,
  loginUser,
  getCurrentUser,
  logoutUser,
  verifyEmail,
  showVerificationPage,
  resendVerificationEmail,
  forgotPassword,
  resetPassword,
  showResetPasswordPage,
  changePassword,
} from "../controller/authController.js";

import { authenticateUser } from "../middleware/authMiddleware.js";

const router = express.Router();

// Phase 4: User registration
router.post("/register", registerUser);

// Phase 5: User login
router.post("/login", loginUser);
// Phase 9: Password management
router.post("/forgot-password", forgotPassword);

router.get("/reset-password", showResetPasswordPage);
router.post("/reset-password", resetPassword);

router.post(
  "/change-password",
  authenticateUser,
  changePassword
);

// Phase 8: Email verification
// GET displays the confirmation page without verifying the email.
router.get("/verify-email", showVerificationPage);

// POST validates the token and marks the email as verified.
router.post("/verify-email", verifyEmail);

// Phase 8: Resend verification email
router.post("/resend-verification", resendVerificationEmail);

// Phase 6: Get the currently authenticated user
router.get("/me", authenticateUser, getCurrentUser);

// Phase 6: Protected test endpoint
router.get("/private", authenticateUser, (req, res) => {
  return res.status(200).json({
    success: true,
    message: "You have accessed a protected endpoint.",
    user: req.session.user,
  });
});

// Phase 7: User logout
router.post("/logout", authenticateUser, logoutUser);

export default router;
