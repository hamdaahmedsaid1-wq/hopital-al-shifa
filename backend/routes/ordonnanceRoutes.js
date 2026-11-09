const express = require("express");

const router = express.Router();

const controller =
  require("../controllers/ordonnanceController");

router.get(
  "/",
  controller.getOrdonnances
);

router.get(
  "/:id",
  controller.getOrdonnanceById
);

router.post(
  "/",
  controller.createOrdonnance
);

router.delete(
  "/:id",
  controller.deleteOrdonnance
);

module.exports = router;