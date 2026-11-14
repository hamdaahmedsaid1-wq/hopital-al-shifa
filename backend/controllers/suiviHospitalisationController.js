const db = require("../config/database");

// ==========================================
// 1. RÉCUPÉRER TOUS LES SUIVIS
// ==========================================

exports.getSuivis = async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT
        s.*,
        h.id_patient,
        h.date_entree,
        h.date_sortie,
        p.nom AS nom_patient,
        p.prenom AS prenom_patient,
        l.numero_lit,
        c.numero_chambre
      FROM suivi_hospitalisation s
      INNER JOIN hospitalisation h
        ON s.id_hospitalisation = h.id_hospitalisation
      INNER JOIN patient p
        ON h.id_patient = p.id_patient
      LEFT JOIN lit l
        ON h.id_lit = l.id_lit
      LEFT JOIN chambre c
        ON l.id_chambre = c.id_chambre
      ORDER BY s.date_suivi DESC, s.heure_suivi DESC
    `);

    res.json(rows);
  } catch (error) {
    console.error("Erreur getSuivis :", error);
    res.status(500).json({
      message: "Erreur lors du chargement des suivis"
    });
  }
};

// ==========================================
// 2. CRÉER UN SUIVI MÉDICAL
// ==========================================

exports.createSuivi = async (req, res) => {
  try {
    const {
      id_hospitalisation,
      date_suivi,
      heure_suivi,
      temperature,
      tension,
      frequence_cardiaque,
      saturation,
      etat_patient,
      observation
    } = req.body;

    if (!id_hospitalisation || !date_suivi || !observation) {
      return res.status(400).json({
        message: "Veuillez remplir les champs obligatoires."
      });
    }

    const [hospitalisations] = await db.query(
      `SELECT id_hospitalisation, date_sortie
       FROM hospitalisation
       WHERE id_hospitalisation = ?`,
      [id_hospitalisation]
    );

    if (hospitalisations.length === 0) {
      return res.status(404).json({
        message: "Hospitalisation introuvable."
      });
    }

    if (hospitalisations[0].date_sortie !== null) {
      return res.status(400).json({
        message: "Ce patient est déjà sorti de l'hôpital."
      });
    }

    const [result] = await db.query(
      `INSERT INTO suivi_hospitalisation
      (
        id_hospitalisation,
        date_suivi,
        heure_suivi,
        temperature,
        tension,
        frequence_cardiaque,
        saturation,
        etat_patient,
        observation
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id_hospitalisation,
        date_suivi,
        heure_suivi || null,
        temperature === "" ? null : temperature ?? null,
        tension || null,
        frequence_cardiaque === "" ? null : frequence_cardiaque ?? null,
        saturation === "" ? null : saturation ?? null,
        etat_patient || "stable",
        observation
      ]
    );

    res.status(201).json({
      message: "Suivi médical enregistré avec succès.",
      id_suivi: result.insertId
    });
  } catch (error) {
    console.error("Erreur createSuivi :", error);
    res.status(500).json({
      message: "Erreur lors de l'enregistrement du suivi."
    });
  }
};

// ==========================================
// 3. RÉCUPÉRER UN SUIVI PAR SON ID
// ==========================================

exports.getSuiviById = async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT
        s.*,
        h.id_patient,
        p.nom AS nom_patient,
        p.prenom AS prenom_patient
       FROM suivi_hospitalisation s
       INNER JOIN hospitalisation h
         ON s.id_hospitalisation = h.id_hospitalisation
       INNER JOIN patient p
         ON h.id_patient = p.id_patient
       WHERE s.id_suivi = ?`,
      [req.params.id]
    );

    if (rows.length === 0) {
      return res.status(404).json({
        message: "Suivi médical introuvable."
      });
    }

    res.json(rows[0]);
  } catch (error) {
    console.error("Erreur getSuiviById :", error);
    res.status(500).json({
      message: "Erreur lors du chargement du suivi."
    });
  }
};