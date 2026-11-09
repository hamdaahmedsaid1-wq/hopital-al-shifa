const db = require("../config/database");

exports.getMedecins = async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT
        m.*,
        s.nom_specialite,
        se.nom_service

       FROM medecin m

       LEFT JOIN specialite s
       ON m.id_specialite = s.id_specialite

       LEFT JOIN service se
       ON m.id_service = se.id_service

       ORDER BY m.id_medecin DESC`
    );

    res.json(rows);

  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Erreur serveur"
    });
  }
};


exports.getMedecinById = async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT
        m.*,
        s.nom_specialite,
        se.nom_service

       FROM medecin m

       LEFT JOIN specialite s
       ON m.id_specialite = s.id_specialite

       LEFT JOIN service se
       ON m.id_service = se.id_service

       WHERE m.id_medecin = ?`,
      [req.params.id]
    );

    if (rows.length === 0) {
      return res.status(404).json({
        message: "Médecin introuvable"
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


exports.createMedecin = async (req, res) => {
  try {
    const {
      nom,
      prenom,
      telephone,
      email,
      id_specialite,
      id_service
    } = req.body;

    const [result] = await db.query(
      `INSERT INTO medecin
      (
        nom,
        prenom,
        telephone,
        email,
        id_specialite,
        id_service
      )

      VALUES (?, ?, ?, ?, ?, ?)`,
      [
        nom,
        prenom,
        telephone,
        email,
        id_specialite,
        id_service
      ]
    );

    res.status(201).json({
      message: "Médecin ajouté",
      id_medecin: result.insertId
    });

  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Erreur ajout médecin"
    });
  }
};


exports.updateMedecin = async (req, res) => {
  try {
    const {
      nom,
      prenom,
      telephone,
      email,
      id_specialite,
      id_service
    } = req.body;

    const [result] = await db.query(
      `UPDATE medecin

       SET nom = ?,
           prenom = ?,
           telephone = ?,
           email = ?,
           id_specialite = ?,
           id_service = ?

       WHERE id_medecin = ?`,
      [
        nom,
        prenom,
        telephone,
        email,
        id_specialite,
        id_service,
        req.params.id
      ]
    );

    if (!result.affectedRows) {
      return res.status(404).json({
        message: "Médecin introuvable"
      });
    }

    res.json({
      message: "Médecin modifié"
    });

  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Erreur modification médecin"
    });
  }
};


exports.deleteMedecin = async (req, res) => {
  try {
    const [result] = await db.query(
      "DELETE FROM medecin WHERE id_medecin = ?",
      [req.params.id]
    );

    if (!result.affectedRows) {
      return res.status(404).json({
        message: "Médecin introuvable"
      });
    }

    res.json({
      message: "Médecin supprimé"
    });

  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Suppression impossible"
    });
  }
};