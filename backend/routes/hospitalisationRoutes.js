const express = require("express");

const router = express.Router();

const controller =
  require("../controllers/hospitalisationController");

router.get(
  "/",
  controller.getHospitalisations
);

router.get(
  "/:id",
  controller.getHospitalisationById
);

router.post(
  "/",
  controller.createHospitalisation
);

router.put(
  "/:id/sortie",
  controller.sortiePatient
);

module.exports = router;