const express = require("express");

const router = express.Router();

const controller =
  require("../controllers/paiementController");

router.get(
  "/",
  controller.getPaiements
);

router.post(
  "/",
  controller.createPaiement
);

router.delete(
  "/:id",
  controller.deletePaiement
);

module.exports = router;