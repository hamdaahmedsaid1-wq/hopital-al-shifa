const express = require("express");

const router = express.Router();

const accessAuth =
    require("../middlewares/accessAuth");

const medecinAccessController =
    require("../controllers/medecinAccessController");


router.get(
    "/mes-patients",
    accessAuth,
    medecinAccessController.getMesPatients
);


module.exports = router;