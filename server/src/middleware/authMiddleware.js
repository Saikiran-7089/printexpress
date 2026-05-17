const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || "printexpress_ultra_secret_key";

/**
 * Express Middleware verifying JWT presence in cookies or request headers
 */
function verifyToken(req, res, next) {
  let token = null;

  // Extract from Cookie headers (Next.js server requests)
  if (req.headers.cookie) {
    const cookieString = req.headers.cookie;
    const cookies = cookieString.split(';').reduce((acc, current) => {
      const [key, value] = current.trim().split('=');
      if (key && value) acc[key] = value;
      return acc;
    }, {});
    token = cookies.token;
  }

  // Fallback to Bearer token in Authorization header
  if (!token && req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({ error: "Access denied. Authentication credentials required." });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded; // Object structure: { id, registrationNumber, role, name }
    next();
  } catch (error) {
    console.error("[AuthMiddleware] JWT Verification Failed:", error.message);
    return res.status(401).json({ error: "Session expired or invalid token." });
  }
}

/**
 * Access restriction guard by User Role
 * @param {string} role - 'CUSTOMER' or 'ADMIN'
 */
function requireRole(role) {
  return (req, res, next) => {
    verifyToken(req, res, () => {
      if (req.user && req.user.role === role) {
        next();
      } else {
        return res.status(403).json({ 
          error: `Forbidden. This operational panel requires administrative privileges (${role}).` 
        });
      }
    });
  };
}

module.exports = {
  verifyToken,
  requireCustomer: requireRole('CUSTOMER'),
  requireAdmin: requireRole('ADMIN')
};
