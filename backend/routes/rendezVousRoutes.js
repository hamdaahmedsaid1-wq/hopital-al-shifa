const express = require("express");

const router = express.Router();

const controller =
  require("../controllers/rendezVousController");

router.get(
  "/",
  controller.getRendezVous
);

router.get(
  "/:id",
  controller.getRendezVousById
);

router.post(
  "/",
  controller.createRendezVous
);

router.put(
  "/:id",
  controller.updateRendezVous
);

router.delete(
  "/:id",
  controller.deleteRendezVous
);

module.exports = router;