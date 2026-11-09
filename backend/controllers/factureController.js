const db = require("../config/database");

exports.getFactures = async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT
        f.*,
        p.nom AS nom_patient,
        p.prenom AS prenom_patient

       FROM facture f

       JOIN patient p
       ON f.id_patient = p.id_patient

       ORDER BY f.date_facture DESC`
    );

    res.json(rows);

  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Erreur serveur"
    });
  }
};


exports.getFactureById = async (req, res) => {
  try {
    const [rows] = await db.query(
      "SELECT * FROM facture WHERE id_facture = ?",
      [req.params.id]
    );

    if (!rows.length) {
      return res.status(404).json({
        message: "Facture introuvable"
      });
    }

    res.json(rows[0]);

  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Erreur serveur"
    });
  }
};


exports.createFacture = async (req, res) => {
  try {
    const {
      date_facture,
      montant_total,
      statut,
      id_patient
    } = req.body;

    const [result] = await db.query(
      `INSERT INTO facture
      (
        date_facture,
        montant_total,
        statut,
        id_patient
      )

      VALUES (?, ?, ?, ?)`,
      [
        date_facture,
        montant_total,
        statut || "NON_PAYEE",
        id_patient
      ]
    );

    res.status(201).json({
      message: "Facture créée",
      id_facture: result.insertId
    });

  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Erreur création facture"
    });
  }
};


exports.updateFacture = async (req, res) => {
  try {
    const {
      date_facture,
      montant_total,
      statut,
      id_patient
    } = req.body;

    const [result] = await db.query(
      `UPDATE facture

       SET date_facture = ?,
           montant_total = ?,
           statut = ?,
           id_patient = ?

       WHERE id_facture = ?`,
      [
        date_facture,
        montant_total,
        statut,
        id_patient,
        req.params.id
      ]
    );

    if (!result.affectedRows) {
      return res.status(404).json({
        message: "Facture introuvable"
      });
    }

    res.json({
      message: "Facture modifiée"
    });

  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Erreur modification facture"
    });
  }
};


exports.deleteFacture = async (req, res) => {
  try {
    const [result] = await db.query(
      "DELETE FROM facture WHERE id_facture = ?",
      [req.params.id]
    );

    if (!result.affectedRows) {
      return res.status(404).json({
        message: "Facture introuvable"
      });
    }

    res.json({
      message: "Facture supprimée"
    });

  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Suppression impossible"
    });
  }
};