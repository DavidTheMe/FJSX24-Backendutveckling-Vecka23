require('dotenv').config();

const pool = require('../../db')
const queries = require('./queries');

const jwt = require('jsonwebtoken');

const getUsers = (req, res) => {
  pool.query(queries.getUsers, (error, results) => {
    if (error) {
      throw error;
    }
    res.status(200).json(results.rows);
  })
};

const getUserByName = (req, res) => {
  const username = req.params.username;
  pool.query(queries.getUserByUsername, [username], (error, results) => {
    if (error) {
      console.error(error);
      return res.status(500).send("Database error");
    }
    res.status(200).json(results.rows);  // Note: returns an array (empty if no user)
  });
};

const createAccount = async (req, res) => {
  const client = await pool.connect();
  try {
    const { username, password } = req.body;
    const currentTime = new Date();

    await client.query("BEGIN");

    // Create user
    const userResult = await client.query(
      queries.registerNewUser,
      [username, password, currentTime]
    );

    const userId = userResult.rows[0].id;

    // Create refresh token entry
    await client.query(
      queries.createRefreshTokenEntry,
      [userId]
    );

    await client.query("COMMIT");

    console.log("Account and refresh token created!");

    res.status(201).json({
      message: "Account created!",
      refreshToken: "",
    });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Error during account creation:", error);
    res.status(500).json({ error: "Failed to create account" });
  } finally {
    client.release();
  }
};

const login = (req, res) => {
  const username = req.params.username;
  const { password } = req.body;

  pool.query(queries.getUsers, (error, results) => {
    if (error) {
      console.error(error);
      return res.status(500).json({ message: "Database error" });
    }

    const user = results.rows.find(user => user.username === username);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (user.password !== password) {
      return res.status(401).json({ message: "Incorrect password" });
    }

    // Generate tokens
    const accessToken = generateAccessToken(user);
    const refreshToken = jwt.sign(user, process.env.REFRESH_TOKEN_SECRET);

    // Update refresh token in DB
    pool.query(
      queries.updateRefreshToken, // e.g. "UPDATE refreshtokens SET refreshtoken = $1 WHERE user_id = $2"
      [refreshToken, user.id],
      (error, results) => {
        if (error) {
          console.error("Error updating refresh token:", error);
          return res.status(500).json({ message: "Database error while updating refresh token" });
        }

        res.json({ accessToken, refreshToken });
      }
    );
  });
};

async function authenticateToken(req, res, next) {
  try {
    const authHeader = req.headers['authorization'];
    const accessToken = authHeader && authHeader.split(' ')[1];
    if (!accessToken) {
      console.log("No access token provided");
      return res.sendStatus(401);
    }

    jwt.verify(accessToken, process.env.ACCESS_TOKEN_SECRET, async (err, user) => {
      if (!err) {
        console.log("Access token verified successfully");
        req.user = user;
        return next();
      }

      if (err.name !== 'TokenExpiredError') {
        console.log("Access token invalid:", err.message);
        return res.sendStatus(403);
      }

      // Token expired - decode without verifying signature to get user ID
      const decodedAccess = jwt.decode(accessToken);
      if (!decodedAccess || !decodedAccess.id) {
        console.log("Failed to decode access token or no id in token");
        return res.sendStatus(401);
      }

      const refreshToken = req.headers['refresh-token'];
      if (!refreshToken) {
        console.log("No refresh token provided");
        return res.sendStatus(401);
      }

      try {
        // Get stored refresh token from DB by user ID
        const { rows } = await pool.query(queries.getRefreshToken, [decodedAccess.id]);
        if (!rows.length) {
          console.log("No refresh token found in DB for user:", decodedAccess.id);
          return res.sendStatus(403);
        }

        const storedRefreshToken = rows[0].refreshtoken;
        if (storedRefreshToken !== refreshToken) {
          console.log("Provided refresh token does not match stored token");
          return res.sendStatus(403);
        }

        // Verify the refresh token itself
        jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET, (refreshErr, refreshUser) => {
          if (refreshErr) {
            console.log("Refresh token invalid:", refreshErr.message);
            return res.sendStatus(403);
          }

          console.log("Refresh token verified successfully");

          // Generate new access token
          const newAccessToken = generateAccessToken(refreshUser);

          console.log("New access token generated from refresh token");
          res.setHeader('new-access-token', newAccessToken);

          req.user = refreshUser;
          next();
        });

      } catch (dbErr) {
        console.error("Database error:", dbErr);
        return res.status(500).send("Database error");
      }
    });

  } catch (error) {
    console.error("Unexpected error in authenticateToken:", error);
    res.sendStatus(500);
  }
};

function generateAccessToken(user) {
  return jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '15s' })
}

const getUserBoards = (req, res) => {
  const userId = req.user.id;
  pool.query(queries.getUserBoards, [userId], (error, results) => {
    if (error) {
      console.error(error);
      return res.status(500).json({ message: "Database error" });
    }
    res.status(200).json({
      user: req.user,
      boards: results.rows
    });
  });
};

const createBoard = (req, res) => {
  const { ownerId, name, description } = req.body;

  if (ownerId == null || name == null || description == null) {
    return res.status(400).json({ error: "All values must be provided: ownerId, name, description." });
  }

  const currentTime = new Date();

  pool.query(
    queries.createBoard,
    [ownerId, name, description, currentTime],
    (error, results) => {
      if (error) {
        console.error("Database error:", error);
        return res.status(500).json({ error: "An error occurred while creating the board." });
      }

      console.log("Board created!");
      res.status(201).json({ message: "Board created successfully." });
    }
  );
};

const deleteBoard = (req, res) => {
  const { id } = req.body;

  if (id == null) {
    return res.status(400).json({ error: "All values must be provided: ownerId, name, description." });
  }

  pool.query(
    queries.deleteBoard,
    [id],
    (error, results) => {
      if (error) {
        console.error("Database error:", error);
        return res.status(500).json({ error: "An error occurred while deleting the board." });
      }

      console.log("Board deleted!");
      res.status(201).json({ message: "Board deleted successfully." });
    }
  );
};

const deleteUser = (req, res) => {
  const userId = req.params.id;

  pool.query(
    queries.deleteUser,
    [userId],
    (error, results) => {
      if (error) {
        console.error("Database error:", error);
        return res.status(500).json({ error: "An error occurred while deleting the user." });
      }

      console.log("User deleted!");
      res.status(200).json({ message: "User deleted successfully." });
    }
  );
};




module.exports = {
  createAccount,
  getUsers,
  getUserByName,
  login,
  getUserBoards,
  authenticateToken,
  createBoard,
  deleteBoard,
  deleteUser,
}