const express = require("express");
const authMiddleware = require("../middleware/authMiddleware");
const ClientController = require("../controllers/ClientController");

const router = express.Router();

router.get("/hierarchy", authMiddleware, ClientController.getHierarchy);
router.post("/", authMiddleware, ClientController.createClient);
router.put("/:id", authMiddleware, ClientController.updateClient);
router.delete("/:id", authMiddleware, ClientController.deleteClient);

module.exports = router;
