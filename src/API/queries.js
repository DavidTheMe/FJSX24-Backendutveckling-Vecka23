//Notes
const getNotesInBoard = "SELECT * FROM notesapp.posts WHERE ownerId = $1";
const getNoteById = "SELECT * FROM notesapp.posts WHERE id = $1";
const createNote = "INSERT INTO notesapp.posts (boardId, title, description, createdAt) VALUES ($1, $2, $3, $4)";
const removeNote = "DELETE FROM notesapp.posts WHERE id = $1";

//Boards
const getUserBoards = "SELECT * FROM notesapp.boards WHERE ownerId = $1";
const createBoard = "INSERT INTO notesapp.boards (ownerId, name, description, lastUpdated) VALUES ($1, $2, $3, $4)";
const deleteBoard = "DELETE FROM notesapp.boards WHERE id = $1";

//Users
const getUsers = "SELECT * FROM notesapp.users";
const getUserById = "SELECT * FROM notesapp.users WHERE id = $1";
const getUserByUsername = "SELECT * FROM notesapp.users WHERE username = $1";
const registerNewUser = "INSERT INTO notesapp.users (username, password, createdAt) VALUES ($1, $2, $3)";
const deleteUser = "DELETE FROM notesapp.users WHERE id = $1";

module.exports = {
    getNotesInBoard,
    getNoteById,
    createNote,
    removeNote,

    getUserBoards,
    createBoard,
    deleteBoard,

    getUsers,
    getUserById,
    getUserByUsername,
    registerNewUser,
    deleteUser,
};