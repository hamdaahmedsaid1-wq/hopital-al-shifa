const db = require("../config/database");

// Récupérer tous les lits
exports.getLits = async (req, res) => {
  try {
    const [lits] = await db.query(`
      SELECT
        l.id_lit,
        l.numero_lit,
        l.statut,
        l.id_chambre,
        c.numero_chambre,
        c.id_service
      FROM lit l
      INNER JOIN chambre c
        ON l.id_chambre = c.id_chambre
      ORDER BY c.numero_chambre, l.numero_lit
    `);

    res.status(200).json(lits);

  } catch (error) {
    console.error("Erreur récupération lits :", error);

    res.status(500).json({
      message: "Erreur lors du chargement des lits"
    });
  }
};