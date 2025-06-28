const { Router } = require("express");
const controller = require('./controller');

const router = Router();

//Accounts
router.get("/users", controller.authenticateToken, controller.getUsers);
router.get("/users/:username", controller.authenticateToken, controller.getUserByName);
router.post("/users", controller.createAccount);
router.post("/users/:username", controller.login);

//Boards
router.get("/boards", controller.authenticateToken, controller.getUserBoards);
router.post("/boards", controller.authenticateToken, controller.createBoard);
router.delete("/boards", controller.authenticateToken, controller.deleteBoard);



module.exports = router;