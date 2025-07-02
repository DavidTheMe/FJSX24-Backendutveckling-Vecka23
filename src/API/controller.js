require('dotenv').config();
const bcrypt = require('bcrypt');
const pool = require('../../db');
const queries = require('./queries');
const client = require('../../db');
const jwt = require('jsonwebtoken');

const SALT_ROUNDS = 10;  // bcrypt salt rounds

const getUsers = (req, res) => {
  pool.query(queries.getUsers, (error, results) => {
    if (error) {
      throw error;
    }
    res.status(200).json(results.rows);
  });
};

const getUserByName = (req, res) => {
  const username = req.params.username;
  pool.query(queries.getUserByUsername, [username], (error, results) => {
    if (error) {
      console.error(error);
      return res.status(500).send("Database error");
    }
    res.status(200).json(results.rows);
  });
};

const createAccount = async (req, res) => {
  const clientConn = await client.connect();
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password required' });
    }

    // Check if username already exists
    const existingUser = await clientConn.query(queries.getUserByUsername, [username]);
    if (existingUser.rows.length > 0) {
      return res.status(409).json({ error: 'Username already exists' });
    }

    await clientConn.query('BEGIN');

    const currentTime = new Date();

    // Hash the password before storing
    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

    // Create user with hashed password
    const userResult = await clientConn.query(
      queries.registerNewUser,
      [username, hashedPassword, currentTime]
    );

    const userId = userResult.rows[0].id;

    // Create access token entry
    await clientConn.query(
      queries.createAccessTokenEntry,
      [userId]
    );

    await clientConn.query('COMMIT');

    console.log("Account and access token table entry created!");

    res.status(201).json({
      message: "Account created!",
      userId,
    });
  } catch (error) {
    await clientConn.query('ROLLBACK');
    console.error("Error during account creation:", error);
    res.status(500).json({ error: "Failed to create account" });
  } finally {
    clientConn.release();
  }
};

const login = (req, res) => {
  const username = req.params.username;
  const { password } = req.body;

  pool.query(queries.getUserByUsername, [username], async (error, results) => {
    if (error) {
      console.error(error);
      return res.status(500).json({ message: "Database error" });
    }

    if (results.rows.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    const user = results.rows[0];

    // Compare password using bcrypt
    const passwordMatch = await bcrypt.compare(password, user.password);

    if (!passwordMatch) {
      return res.status(400).json({ message: "Incorrect password" });
    }

    // Generate access token
    const accessToken = generateAccessToken({ id: user.id, username: user.username });

    // Update token in DB
    pool.query(
      queries.updateAccessToken,
      [accessToken, user.id],
      (error, results) => {
        if (error) {
          console.error("Error updating refresh token:", error);
          return res.status(500).json({ message: "Database error while updating refresh token" });
        }
        return res.status(200).json({ "Successful login!": accessToken });
      }
    );
  });
};

async function authenticateToken(req, res, next) {
  try {
    const authHeader = req.headers['authorization'];
    const tokenFromHeader = authHeader && authHeader.split(' ')[1];

    if (!tokenFromHeader) {
      return res.status(401).json({ message: "Access token required" });
    }

    jwt.verify(tokenFromHeader, process.env.ACCESS_TOKEN_SECRET, (err, decodedUser) => {
      if (!err) {
        const userId = decodedUser.id;
        req.userId = userId;

        pool.query(queries.getAccessToken, [userId], (dbErr, results) => {
          if (dbErr) {
            console.error("Database error while checking access token:", dbErr);
            return res.status(500).json({ message: "Database error while verifying access token" });
          }

          if (results.rows.length === 0) {
            return res.status(404).json({ message: "Access token not found" });
          }

          const accessTokenInDB = results.rows[0].accesstoken;

          if (accessTokenInDB !== tokenFromHeader) {
            return res.status(403).json({ message: "Access token mismatch" });
          }

          console.log("Access token verified");
          next();
        });
      } else if (err.name === "TokenExpiredError") {
        const decoded = jwt.decode(tokenFromHeader);
        if (!decoded || !decoded.id) {
          return res.status(400).json({ message: "Invalid token payload" });
        }

        const userId = decoded.id;
        req.userId = userId;

        pool.query(queries.getAccessToken, [userId], (dbErr, results) => {
          if (dbErr) {
            console.error("Database error while checking access token:", dbErr);
            return res.status(500).json({ message: "Database error while verifying expired token" });
          }

          if (results.rows.length === 0) {
            return res.status(404).json({ message: "Access token not found" });
          }

          const accessTokenInDB = results.rows[0].accesstoken;

          if (accessTokenInDB !== tokenFromHeader) {
            return res.status(403).json({ message: "Expired token mismatch or already used" });
          }

          const newToken = generateAccessToken({ id: userId });

          pool.query(
            queries.updateAccessToken,
            [newToken, userId],
            (updateErr) => {
              if (updateErr) {
                console.error("Error updating access token:", updateErr);
                return res.status(500).json({ message: "Failed to update access token" });
              }

              console.log("Expired token used once to issue new token.");

              return res.status(200).json({
                message: "Access token expired. New token issued.",
                accessToken: newToken
              });
            }
          );
        });
      } else {
        console.error("JWT verification error:", err);
        return res.status(403).json({ message: "Invalid access token" });
      }
    });
  } catch (error) {
    console.error("Unexpected error in authenticateToken:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
}

function generateAccessToken(user) {
  return jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '200s' });
}

const getUserBoards = (req, res) => {
  const userId = req.userId;

  pool.query(queries.getUserById, [userId], (error, userResults) => {
    if (error) {
      console.error("Error checking user existence:", error);
      return res.status(500).json({ message: "Database error while checking user" });
    }

    if (userResults.rows.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    pool.query(queries.getUserBoards, [userId], (error, boardResults) => {
      if (error) {
        console.error("Error retrieving user boards:", error);
        return res.status(500).json({ message: "Database error while retrieving boards" });
      }

      res.status(200).json({
        boards: boardResults.rows,
      });
    });
  });
};


const createBoard = (req, res) => {
  const { ownerId, name, description } = req.body;

  if (ownerId == null || name == null || description == null) {
    return res.status(400).json({ error: "All values must be provided: ownerId, name, description." });
  }

  // Check if the logged-in user matches the ownerId
  if (req.userId !== ownerId) {
    return res.status(403).json({ error: "You can only create boards for your own user account." });
  }

  const currentTime = new Date();

  pool.query(
    queries.createBoard,
    [ownerId, name, description, currentTime, currentTime],
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


const editBoard = (req, res) => {
  const { id, name, description } = req.body;

  if (!id) {
    return res.status(400).json({ error: "Board id is required." });
  }

  pool.query(queries.getBoardById, [id], (error, results) => {
    if (error) {
      console.error("Database error fetching board:", error);
      return res.status(500).json({ error: "Database error while fetching board." });
    }

    if (results.rows.length === 0) {
      return res.status(404).json({ error: "Board not found." });
    }

    const currentBoard = results.rows[0];

    if (currentBoard.ownerid !== req.userId) {
      return res.status(403).json({ error: "You are not authorized to edit this board." });
    }

    const updatedName = name !== undefined ? name : currentBoard.name;
    const updatedDescription = description !== undefined ? description : currentBoard.description;

    pool.query(
      queries.updateBoard,
      [updatedName, updatedDescription, id],
      (updateError, updateResults) => {
        if (updateError) {
          console.error("Database error updating board:", updateError);
          return res.status(500).json({ error: "Error updating board." });
        }

        if (updateResults.rowCount === 0) {
          return res.status(404).json({ error: "Board not found during update." });
        }

        console.log("Board updated!");
        res.status(200).json({ message: "Board updated successfully." });
      }
    );
  });
};

const deleteBoard = (req, res) => {
  const { id } = req.body;

  if (!id) {
    return res.status(400).json({ error: "Board id must be provided." });
  }

  pool.query(queries.getBoardById, [id], (error, results) => {
    if (error) {
      console.error("Database error fetching board:", error);
      return res.status(500).json({ error: "Database error while fetching board." });
    }

    if (results.rows.length === 0) {
      return res.status(404).json({ error: "Board not found." });
    }

    const board = results.rows[0];

    if (board.ownerid !== req.userId) {
      return res.status(403).json({ error: "You are not authorized to delete this board." });
    }

    pool.query(queries.deleteBoard, [id], (deleteErr, deleteResults) => {
      if (deleteErr) {
        console.error("Database error deleting board:", deleteErr);
        return res.status(500).json({ error: "Error deleting board." });
      }

      if (deleteResults.rowCount === 0) {
        return res.status(404).json({ error: "Board not found during deletion." });
      }

      console.log("Board deleted!");
      res.status(200).json({ message: "Board deleted successfully." });
    });
  });
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
  editBoard,
};
