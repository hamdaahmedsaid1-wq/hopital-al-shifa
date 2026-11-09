const express = require("express");
const router = express.Router();
const db = require("../config/database");

router.get("/", async (req, res) => {
  try {
    const [chambres] = await db.query(`
      SELECT
        c.id_chambre,
        c.numero_chambre,
        c.type_chambre,
        c.id_service,
        s.nom_service
      FROM chambre c
      INNER JOIN service s
        ON c.id_service = s.id_service
      ORDER BY c.numero_chambre
    `);

    res.json(chambres);

  } catch (error) {
    console.error("Erreur chambres :", error);

    res.status(500).json({
      message: "Erreur lors du chargement des chambres"
    });
  }
});

module.exports = router;