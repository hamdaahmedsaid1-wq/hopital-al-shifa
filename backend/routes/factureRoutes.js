const express = require("express");

const router = express.Router();

const controller =
  require("../controllers/factureController");

router.get(
  "/",
  controller.getFactures
);

router.get(
  "/:id",
  controller.getFactureById
);

router.post(
  "/",
  controller.createFacture
);

router.put(
  "/:id",
  controller.updateFacture
);

router.delete(
  "/:id",
  controller.deleteFacture
);

module.exports = router;