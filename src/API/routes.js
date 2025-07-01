const { Router } = require("express");
const controller = require('./controller');

const router = Router();

/*
router.get("/api/users", controller.getUsers);
router.get("/apiusers/:username", controller.getUserByName);
router.delete("/api/users/:id", controller.authenticateToken, controller.deleteUser);
*/



module.exports = router;

// /api/notes 	GET 	Hämta anteckningar
router.get("/api/boards", /*controller.authenticateToken,*/ controller.getUserBoards);

// /api/notes 	POST 	Spara en anteckning
router.post("/api/boards", /*controller.authenticateToken,*/ controller.createBoard);

// /api/notes 	PUT 	Ändra en anteckning

// /api/notes 	DELETE 	Ta bort en anteckning
router.delete("/api/boards", /*controller.authenticateToken,*/ controller.deleteBoard);

// /api/user/signup 	POST 	Skapa konto
router.post("/api/users/signup", controller.createAccount);

// /api/user/login 	POST 	Logga in
router.post("/api/users/:username", controller.login);

// /api/notes/search 	GET 	Söka bland anteckningar (VG-krav). Sökning sker på titel.
