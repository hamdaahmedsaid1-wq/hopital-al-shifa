const db = require("../config/database");

exports.getConsultations = async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT
        c.*,
        p.nom AS nom_patient,
        p.prenom AS prenom_patient,
        m.nom AS nom_medecin,
        m.prenom AS prenom_medecin

       FROM consultation c

       JOIN patient p
       ON c.id_patient = p.id_patient

       JOIN medecin m
       ON c.id_medecin = m.id_medecin

       ORDER BY c.date_consultation DESC`
    );

    res.json(rows);

  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Erreur serveur"
    });
  }
};


exports.getConsultationById = async (req, res) => {
  try {
    const [rows] = await db.query(
      "SELECT * FROM consultation WHERE id_consultation = ?",
      [req.params.id]
    );

    if (!rows.length) {
      return res.status(404).json({
        message: "Consultation introuvable"
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


exports.createConsultation = async (req, res) => {
  try {
    const {
      date_consultation,
      diagnostic,
      observations,
      id_patient,
      id_medecin
    } = req.body;

    const [result] = await db.query(
      `INSERT INTO consultation
      (
        date_consultation,
        diagnostic,
        observations,
        id_patient,
        id_medecin
      )

      VALUES (?, ?, ?, ?, ?)`,
      [
        date_consultation,
        diagnostic,
        observations,
        id_patient,
        id_medecin
      ]
    );

    res.status(201).json({
      message: "Consultation ajoutée",
      id_consultation: result.insertId
    });

  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Erreur ajout consultation"
    });
  }
};


exports.updateConsultation = async (req, res) => {
  try {
    const {
      date_consultation,
      diagnostic,
      observations,
      id_patient,
      id_medecin
    } = req.body;

    const [result] = await db.query(
      `UPDATE consultation

       SET date_consultation = ?,
           diagnostic = ?,
           observations = ?,
           id_patient = ?,
           id_medecin = ?

       WHERE id_consultation = ?`,
      [
        date_consultation,
        diagnostic,
        observations,
        id_patient,
        id_medecin,
        req.params.id
      ]
    );

    if (!result.affectedRows) {
      return res.status(404).json({
        message: "Consultation introuvable"
      });
    }

    res.json({
      message: "Consultation modifiée"
    });

  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Erreur modification consultation"
    });
  }
};


exports.deleteConsultation = async (req, res) => {
  try {
    const [result] = await db.query(
      "DELETE FROM consultation WHERE id_consultation = ?",
      [req.params.id]
    );

    if (!result.affectedRows) {
      return res.status(404).json({
        message: "Consultation introuvable"
      });
    }

    res.json({
      message: "Consultation supprimée"
    });

  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Suppression impossible"
    });
  }
};

exports.updateConsultation = async (req, res) => {
  try {
    const {
      date_consultation,
      diagnostic,
      observations,
      id_patient,
      id_medecin
    } = req.body;

    const [result] = await db.query(
      `UPDATE consultation

       SET date_consultation = ?,
           diagnostic = ?,
           observations = ?,
           id_patient = ?,
           id_medecin = ?

       WHERE id_consultation = ?`,
      [
        date_consultation,
        diagnostic,
        observations,
        id_patient,
        id_medecin,
        req.params.id
      ]
    );

    if (!result.affectedRows) {
      return res.status(404).json({
        message: "Consultation introuvable"
      });
    }

    res.json({
      message: "Consultation modifiée"
    });

  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Erreur modification consultation"
    });
  }
};


exports.deleteConsultation = async (req, res) => {
  try {
    const [result] = await db.query(
      "DELETE FROM consultation WHERE id_consultation = ?",
      [req.params.id]
    );

    if (!result.affectedRows) {
      return res.status(404).json({
        message: "Consultation introuvable"
      });
    }

    res.json({
      message: "Consultation supprimée"
    });

  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Suppression impossible"
    });
  }
};