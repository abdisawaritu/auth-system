import express from "express";

import {
  registerUser,
  loginUser,
  getCurrentUser,
  logoutUser,
} from "../controller/authController.js";

import { authenticateUser } from "../middleware/authMiddleware.js";

const router = express.Router();

// Public routes.
router.post("/register", registerUser);
router.post("/login", loginUser);

// Protected routes.
router.get("/me", authenticateUser, getCurrentUser);

router.get("/private", authenticateUser, (req, res) => {
  return res.status(200).json({
    success: true,
    message: "You have accessed a protected endpoint.",
    user: req.session.user,
  });
});

// Log out the authenticated user.
router.post("/logout", authenticateUser, logoutUser);

export default router;
