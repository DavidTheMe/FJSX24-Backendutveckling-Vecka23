//Notes
const getNotesInBoard = "SELECT * FROM notesapp.posts WHERE ownerId = $1";
const getNoteById = "SELECT * FROM notesapp.posts WHERE id = $1";
const createNote = "INSERT INTO notesapp.posts (boardId, title, description, createdAt) VALUES ($1, $2, $3, $4)";
const removeNote = "DELETE FROM notesapp.posts WHERE id = $1";
const deleteNotesOfBoard = "DELETE * FROM notesapp.boards WHERE boardId = $1";

//Boards
const getUserBoards = "SELECT * FROM notesapp.boards WHERE ownerId = $1";
const createBoard = "INSERT INTO notesapp.boards (ownerId, name, description, lastUpdated, createdat) VALUES ($1, $2, $3, $4, $5)";
const deleteBoard = "DELETE FROM notesapp.boards WHERE id = $1";
const deleteBoardsOfUser = "DELETE * FROM notesapp.boards WHERE ownerId = $1";
const getBoardById = "SELECT * FROM notesapp.boards WHERE id = $1";
const updateBoard = "UPDATE notesapp.boards SET name = $1, description = $2, lastUpdated = CURRENT_TIMESTAMP WHERE id = $3";


//Users
const getUsers = "SELECT * FROM notesapp.users";
const getUserById = "SELECT * FROM notesapp.users WHERE id = $1";
const getUserByUsername = "SELECT * FROM notesapp.users WHERE username = $1";
const registerNewUser = "INSERT INTO notesapp.users (username, password, createdAt) VALUES ($1, $2, $3) RETURNING id";
const deleteUser = "DELETE FROM notesapp.users WHERE id = $1";

//authentication
const createAccessTokenEntry = "INSERT INTO notesapp.accesstokens (ownerId) VALUES ($1)"
const updateAccessToken = 'UPDATE notesapp.accesstokens SET accesstoken = $1 WHERE ownerId = $2';
const getAccessToken = 'SELECT accesstoken FROM notesapp.accesstokens WHERE ownerId = $1';



module.exports = {
    getNotesInBoard,
    getNoteById,
    createNote,
    removeNote,
    deleteNotesOfBoard,

    getUserBoards,
    createBoard,
    deleteBoard,
    deleteBoardsOfUser,
    getBoardById,
    updateBoard,

    getUsers,
    getUserById,
    getUserByUsername,
    registerNewUser,
    deleteUser,

    createAccessTokenEntry,
    updateAccessToken,
    getAccessToken,
};