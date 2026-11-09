const express = require("express");
const router = express.Router();
const db = require("../config/database");

router.get("/", async (req, res) => {
  try {
    const [services] = await db.query(`
      SELECT id_service, nom_service, localisation
      FROM service
      ORDER BY nom_service
    `);

    res.json(services);

  } catch (error) {
    console.error("Erreur services :", error);

    res.status(500).json({
      message: "Erreur lors du chargement des services"
    });
  }
});

module.exports = router;