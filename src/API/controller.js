require('dotenv').config();

const pool = require('../../db')
const queries = require('./queries');
const client = require('../../db');

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
  const clientConn = await client.connect();  // get a client from the pool for transaction
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password required' });
    }

    // Check if username already exists
    const existingUser = await clientConn.query(queries.getUserByUsername,
      [username]
    );
    if (existingUser.rows.length > 0) {
      return res.status(409).json({ error: 'Username already exists' });
    }

    await clientConn.query('BEGIN'); // Start transaction

    const currentTime = new Date();

    // Create user
    const userResult = await clientConn.query(
      queries.registerNewUser,
      [username, password, currentTime]
    );

    const userId = userResult.rows[0].id;

    // Create access token entry
    await clientConn.query(
      queries.createAccessTokenEntry,
      [userId]
    );

    await clientConn.query('COMMIT'); // Commit transaction

    console.log("Account and access token table entry created!");

    res.status(200).json({
      message: "Account created!",
      userId,
    });
  } catch (error) {
    await clientConn.query('ROLLBACK'); // Roll back transaction on error
    console.error("Error during account creation:", error);
    res.status(500).json({ error: "Failed to create account" });
  } finally {
    clientConn.release(); // release client back to the pool
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
      return res.status(400).json({ message: "Incorrect password" });
    }

    // Generate tokens
    const accessToken = generateAccessToken(user);

    // Update token in DB
    pool.query(
      queries.updateAccessToken,
      [accessToken, user.id],
      (error, results) => {
        if (error) {
          console.error("Error updating refresh token:", error);
          return res.status(500).json({ message: "Database error while updating refresh token" });
        }
        // Only send success response after token update succeeded
        return res.status(200).json({ "Successful login!": accessToken });
      }
    );
  });
};


async function authenticateToken(req, res, next) {

  pool.query(
    queries.updateAccessToken,
    [refreshToken, user.id],
    (error, results) => {
      if (error) {
        console.error("Error updating refresh token:", error);
        return res.status(500).json({ message: "Database error while updating refresh token" });
      }

      res.json({ accessToken, refreshToken });
    }
  );

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