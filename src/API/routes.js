const { Router } = require("express");
const controller = require('./controller');

const router = Router();

//Accounts
router.get("/users", controller.getUsers);
router.get("/users/:username", controller.getUserByName);
router.post("/users", controller.createAccount);
router.post("/users/:username", controller.login);
router.delete("/users/:id", controller.authenticateToken, controller.deleteUser);

//Authentication

//Boards
router.get("/boards", controller.authenticateToken, controller.getUserBoards);
router.post("/boards", controller.authenticateToken, controller.createBoard);
router.delete("/boards", controller.authenticateToken, controller.deleteBoard);



module.exports = router;