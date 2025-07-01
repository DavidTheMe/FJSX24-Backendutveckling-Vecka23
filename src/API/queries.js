//Notes
const getNotesInBoard = "SELECT * FROM notesapp.posts WHERE ownerId = $1";
const getNoteById = "SELECT * FROM notesapp.posts WHERE id = $1";
const createNote = "INSERT INTO notesapp.posts (boardId, title, description, createdAt) VALUES ($1, $2, $3, $4)";
const removeNote = "DELETE FROM notesapp.posts WHERE id = $1";
const deleteNotesOfBoard = "DELETE * FROM notesapp.boards WHERE boardId = $1";

//Boards
const getUserBoards = "SELECT * FROM notesapp.boards WHERE ownerId = $1";
const createBoard = "INSERT INTO notesapp.boards (ownerId, name, description, lastUpdated) VALUES ($1, $2, $3, $4)";
const deleteBoard = "DELETE FROM notesapp.boards WHERE id = $1";
const deleteBoardsOfUser = "DELETE * FROM notesapp.boards WHERE ownerId = $1";

//Users
const getUsers = "SELECT * FROM notesapp.users";
const getUserById = "SELECT * FROM notesapp.users WHERE id = $1";
const getUserByUsername = "SELECT * FROM notesapp.users WHERE username = $1";
const registerNewUser = "INSERT INTO notesapp.users (username, password, createdAt) VALUES ($1, $2, $3) RETURNING id";
const deleteUser = "DELETE FROM notesapp.users WHERE id = $1";

//authentication
const createAccessTokenEntry = "INSERT INTO notesapp.accesstokens (ownerId) VALUES ($1)"
const updateAccessToken = 'UPDATE notesapp.accesstokens SET accesstokens = $1 WHERE userId = $2';
const getRefreshToken = 'SELECT refreshtoken FROM notesapp.refreshtokens WHERE userId = $1';



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

    getUsers,
    getUserById,
    getUserByUsername,
    registerNewUser,
    deleteUser,

    createAccessTokenEntry,
    updateAccessToken,
    getRefreshToken,
};