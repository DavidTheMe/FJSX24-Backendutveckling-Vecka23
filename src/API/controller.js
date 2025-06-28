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
}

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

const createAccount = (req, res) => {
  const { username, password } = req.body;

  pool.query(queries.getUsers, (error, results) => {

    if (error) {
      return res.status(500).send("Database error");
    }

    //Add account to db
    const currentTime = new Date();

    pool.query(queries.registerNewUser, [username, password, currentTime], (error, results) => {
      if (error) throw error;
      res.status(201).send("Account created!");
      console.log("Account created!");
    })

  });
};

const login = (req, res) => {

  const username = req.params.username;
  const { password } = req.body;

  pool.query(queries.getUsers, (error, results) => {
    if (error) {
      console.error(error);
      return res.status(500).json({ message: "Database error" });
    }

    // Check if user exists
    const user = results.rows.find(user => user.username === username);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Check password
    if (user.password !== password) {
      return res.status(401).json({ message: "Incorrect password" });
    }

    //Token
    const accessToken = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET);
    res.json({ accessToken: accessToken });

    // Success
    //return res.status(200).json({ message: "Login successful" });
  });
};

function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.sendStatus(401);

  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;  // assume user object has id field
    next();
  });
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

/*
const getNotesInBoard = (req, res) => {
    pool.query(queries.getNotesInBoard, (error, results) => {
        if (error) {
            throw error;
        }
        res.status(200).json(results.rows);
    })
}

const getNoteById = (req, res) => {
    const id = parseInt(req.params.id);
    pool.query(queries.getNoteById, [id], (error, results) => {
        if (error) throw error;
        res.status(200).json(results.rows)
    });
}

const addNote = (req, res) => {
    const { title, artist, releaseDate, length } = req.body;

    pool.query(queries.getNotesByTitle, [title], (error, results) => {

        if (error) {
            return res.status(500).send("Database error");
        }

        //Add note to db
        pool.query(queries.addnote, [title, artist, releaseDate, length], (error, results) => {
            if (error) throw error;
            res.status(201).send("Note created!");
            console.log("Note created!");
        })

    });
};

const removeNoteById = (req, res) => {
    const id = parseInt(req.params.id);

    pool.query(queries.getNoteById, [id], (error, results) => {
        if (error) {
            console.error(error);
            return res.status(500).send("Server error");
        }

        if (results.rowCount === 0) {
            return res.status(404).send("Note not found");
        }

        pool.query(queries.removeNoteById, [id], (error, results) => {
            if (error) {
                console.error(error);
                return res.status(500).send("Server error");
            }

            res.status(200).send("Note successfully deleted");
        });
    });
};

const updateNoteById = (req, res) => {
  const id = parseInt(req.params.id);
  const { title, artist, releaseDate, length } = req.body;

  // Build the fields to update dynamically
  const fields = [];
  const values = [];
  let idx = 1;

  if (title !== undefined) {
    fields.push(`title = $${idx++}`);
    values.push(title);
  }
  if (artist !== undefined) {
    fields.push(`artist = $${idx++}`);
    values.push(artist);
  }
  if (releaseDate !== undefined) {
    fields.push(`releaseDate = $${idx++}`);
    values.push(releaseDate);
  }
  if (length !== undefined) {
    fields.push(`length = $${idx++}`);
    values.push(length);
  }

  if (fields.length === 0) {
    return res.status(400).send("No fields provided for update.");
  }

  // Add the id as the last parameter
  values.push(id);

  const query = `
    UPDATE notes
    SET ${fields.join(", ")}
    WHERE id = $${idx}
    RETURNING *;
  `;

  pool.query(query, values, (error, results) => {
    if (error) {
      console.error(error);
      return res.status(500).send("Server error");
    }

    if (results.rowCount === 0) {
      return res.status(404).send("Album not found");
    }

    const updatedFields = Object.keys(req.body).filter(key => req.body[key] !== undefined);
    res.send(`Updated fields: ${updatedFields.join(", ")}`);
  });
};
*/




module.exports = {
  createAccount,
  getUsers,
  getUserByName,
  login,
  getUserBoards,
  authenticateToken,
  createBoard,
  deleteBoard,
}