const db = require("../config/database");

exports.getPaiements = async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT
        pa.*,
        f.montant_total,
        p.nom AS nom_patient,
        p.prenom AS prenom_patient

       FROM paiement pa

       JOIN facture f
       ON pa.id_facture = f.id_facture

       JOIN patient p
       ON f.id_patient = p.id_patient

       ORDER BY pa.date_paiement DESC`
    );

    res.json(rows);

  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Erreur serveur"
    });
  }
};


exports.createPaiement = async (req, res) => {
  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    const {
      date_paiement,
      montant,
      mode_paiement,
      id_facture
    } = req.body;

    const [factures] = await connection.query(
      "SELECT montant_total FROM facture WHERE id_facture = ?",
      [id_facture]
    );

    if (!factures.length) {
      await connection.rollback();

      return res.status(404).json({
        message: "Facture introuvable"
      });
    }

    const [result] = await connection.query(
      `INSERT INTO paiement
      (
        date_paiement,
        montant,
        mode_paiement,
        id_facture
      )

      VALUES (?, ?, ?, ?)`,
      [
        date_paiement,
        montant,
        mode_paiement,
        id_facture
      ]
    );

    const [somme] = await connection.query(
      `SELECT SUM(montant) AS total_paye
       FROM paiement
       WHERE id_facture = ?`,
      [id_facture]
    );

    const totalPaye =
      Number(somme[0].total_paye || 0);

    const totalFacture =
      Number(factures[0].montant_total);

    let statut = "NON_PAYEE";

    if (totalPaye >= totalFacture) {
      statut = "PAYEE";
    } else if (totalPaye > 0) {
      statut = "PARTIELLE";
    }

    await connection.query(
      `UPDATE facture
       SET statut = ?
       WHERE id_facture = ?`,
      [
        statut,
        id_facture
      ]
    );

    await connection.commit();

    res.status(201).json({
      message: "Paiement enregistré",
      id_paiement: result.insertId,
      statut_facture: statut
    });

  } catch (error) {
    await connection.rollback();

    console.error(error);

    res.status(500).json({
      message: "Erreur paiement"
    });

  } finally {
    connection.release();
  }
};


exports.deletePaiement = async (req, res) => {
  try {
    const [result] = await db.query(
      "DELETE FROM paiement WHERE id_paiement = ?",
      [req.params.id]
    );

    if (!result.affectedRows) {
      return res.status(404).json({
        message: "Paiement introuvable"
      });
    }

    res.json({
      message: "Paiement supprimé"
    });

  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Suppression impossible"
    });
  }
};