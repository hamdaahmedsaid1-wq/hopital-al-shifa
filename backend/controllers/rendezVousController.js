const db = require("../config/database");

exports.getRendezVous = async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT
        r.*,
        p.nom AS nom_patient,
        p.prenom AS prenom_patient,
        m.nom AS nom_medecin,
        m.prenom AS prenom_medecin

       FROM rendez_vous r

       JOIN patient p
       ON r.id_patient = p.id_patient

       JOIN medecin m
       ON r.id_medecin = m.id_medecin

       ORDER BY r.date_rdv DESC,
                r.heure_rdv DESC`
    );

    res.json(rows);

  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Erreur serveur"
    });
  }
};


exports.getRendezVousById = async (req, res) => {
  try {
    const [rows] = await db.query(
      "SELECT * FROM rendez_vous WHERE id_rendez_vous = ?",
      [req.params.id]
    );

    if (!rows.length) {
      return res.status(404).json({
        message: "Rendez-vous introuvable"
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


exports.createRendezVous = async (req, res) => {
  try {
    const {
      date_rdv,
      heure_rdv,
      motif,
      statut,
      id_patient,
      id_medecin
    } = req.body;

    const [result] = await db.query(
      `INSERT INTO rendez_vous
      (
        date_rdv,
        heure_rdv,
        motif,
        statut,
        id_patient,
        id_medecin
      )

      VALUES (?, ?, ?, ?, ?, ?)`,
      [
        date_rdv,
        heure_rdv,
        motif,
        statut || "EN_ATTENTE",
        id_patient,
        id_medecin
      ]
    );

    res.status(201).json({
      message: "Rendez-vous créé",
      id_rendez_vous: result.insertId
    });

  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Erreur création rendez-vous"
    });
  }
};


exports.updateRendezVous = async (req, res) => {
  try {
    const {
      date_rdv,
      heure_rdv,
      motif,
      statut,
      id_patient,
      id_medecin
    } = req.body;

    const [result] = await db.query(
      `UPDATE rendez_vous

       SET date_rdv = ?,
           heure_rdv = ?,
           motif = ?,
           statut = ?,
           id_patient = ?,
           id_medecin = ?

       WHERE id_rendez_vous = ?`,
      [
        date_rdv,
        heure_rdv,
        motif,
        statut,
        id_patient,
        id_medecin,
        req.params.id
      ]
    );

    if (!result.affectedRows) {
      return res.status(404).json({
        message: "Rendez-vous introuvable"
      });
    }

    res.json({
      message: "Rendez-vous modifié"
    });

  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Erreur modification rendez-vous"
    });
  }
};


exports.deleteRendezVous = async (req, res) => {
  try {
    const [result] = await db.query(
      "DELETE FROM rendez_vous WHERE id_rendez_vous = ?",
      [req.params.id]
    );

    if (!result.affectedRows) {
      return res.status(404).json({
        message: "Rendez-vous introuvable"
      });
    }

    res.json({
      message: "Rendez-vous supprimé"
    });

  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Suppression impossible"
    });
  }
};