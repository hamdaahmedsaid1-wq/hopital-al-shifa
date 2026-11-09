const express = require("express");

const router = express.Router();

const controller =
  require("../controllers/medecinController");

router.get("/", controller.getMedecins);

router.get(
  "/:id",
  controller.getMedecinById
);

router.post(
  "/",
  controller.createMedecin
);

router.put(
  "/:id",
  controller.updateMedecin
);

router.delete(
  "/:id",
  controller.deleteMedecin
);

module.exports = router;