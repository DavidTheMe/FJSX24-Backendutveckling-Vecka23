const { Router } = require("express");
const controller = require('./controller');

const router = Router();

/**
 * @swagger
 * components:
 *   securitySchemes:
 *     bearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 *   schemas:
 *     CreateAccountRequest:
 *       type: object
 *       required:
 *         - username
 *         - password
 *       properties:
 *         username:
 *           type: string
 *         password:
 *           type: string
 *     LoginRequest:
 *       type: object
 *       required:
 *         - password
 *       properties:
 *         password:
 *           type: string
 *     CreateBoardRequest:
 *       type: object
 *       required:
 *         - ownerId
 *         - name
 *         - description
 *       properties:
 *         ownerId:
 *           type: integer
 *         name:
 *           type: string
 *         description:
 *           type: string
 *     EditBoardRequest:
 *       type: object
 *       required:
 *         - id
 *       properties:
 *         id:
 *           type: integer
 *         name:
 *           type: string
 *         description:
 *           type: string
 *     DeleteBoardRequest:
 *       type: object
 *       required:
 *         - id
 *       properties:
 *         id:
 *           type: integer
 */

/**
 * @swagger
 * /api/users/signup:
 *   post:
 *     tags:
 *       - Users
 *     summary: Create a new user account
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateAccountRequest'
 *     responses:
 *       '200':
 *         description: Account created successfully
 *       '400':
 *         description: Missing username or password
 *       '409':
 *         description: Username already exists
 */

/**
 * @swagger
 * /api/users/{username}:
 *   post:
 *     tags:
 *       - Users
 *     summary: Log in a user
 *     parameters:
 *       - name: username
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LoginRequest'
 *     responses:
 *       '200':
 *         description: Successful login with access token
 *       '400':
 *         description: Incorrect password
 *       '404':
 *         description: User not found
 */

/**
 * @swagger
 * /api/boards:
 *   get:
 *     tags:
 *       - Boards
 *     summary: Get boards for a user
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               userId:
 *                 type: integer
 *     responses:
 *       '200':
 *         description: List of boards
 *       '400':
 *         description: Missing userId
 *       '404':
 *         description: User not found
 *   post:
 *     tags:
 *       - Boards
 *     summary: Create a new board
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateBoardRequest'
 *     responses:
 *       '201':
 *         description: Board created
 *       '400':
 *         description: Missing required fields
 *   put:
 *     tags:
 *       - Boards
 *     summary: Edit a board
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/EditBoardRequest'
 *     responses:
 *       '200':
 *         description: Board updated
 *       '400':
 *         description: Missing board id
 *       '403':
 *         description: Not authorized
 *       '404':
 *         description: Board not found
 *   delete:
 *     tags:
 *       - Boards
 *     summary: Delete a board
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/DeleteBoardRequest'
 *     responses:
 *       '200':
 *         description: Board deleted
 *       '400':
 *         description: Missing board id
 *       '403':
 *         description: Not authorized
 *       '404':
 *         description: Board not found
 */






/*
router.get("/api/users", controller.getUsers);
router.get("/apiusers/:username", controller.getUserByName);
router.delete("/api/users/:id", controller.authenticateToken, controller.deleteUser);
*/




// /api/notes 	GET 	Hämta anteckningar
router.get("/api/boards", controller.authenticateToken, controller.getUserBoards);

// /api/notes 	POST 	Spara en anteckning
router.post("/api/boards", controller.authenticateToken, controller.createBoard);

// /api/notes 	PUT 	Ändra en anteckning
router.put("/api/boards", controller.authenticateToken, controller.editBoard);

// /api/notes 	DELETE 	Ta bort en anteckning
router.delete("/api/boards", controller.authenticateToken, controller.deleteBoard);

// /api/user/signup 	POST 	Skapa konto
router.post("/api/users/signup", controller.createAccount);

// /api/user/login 	POST 	Logga in
router.post("/api/users/:username", controller.login);

// /api/notes/search 	GET 	Söka bland anteckningar (VG-krav). Sökning sker på titel.



module.exports = router;