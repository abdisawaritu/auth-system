export const authenticateUser = (req, res, next) => {
  // Check whether the session contains an authenticated user.
  if (!req.session?.user?.id) {
    return res.status(401).json({
      success: false,
      message: "Authentication required. Please log in.",
    });
  }

  // The user has an authenticated session.
  next();
};
