const db = require("../config/database");
const jwt = require("jsonwebtoken");


// =========================================================
// CREER UN COMPTE
// =========================================================

exports.register = async (req, res) => {

  try {

    const {
      nom_utilisateur,
      nom,
      prenom,
      mot_de_passe,
      id_role
    } = req.body;


    if (
      !nom_utilisateur ||
      !mot_de_passe ||
      !id_role
    ) {

      return res.status(400).json({
        message: "Les champs obligatoires sont manquants"
      });

    }


    // Vérifier si l'utilisateur existe déjà

    const [existing] = await db.query(
      `
      SELECT id_utilisateur
      FROM utilisateur
      WHERE nom_utilisateur = ?
      `,
      [nom_utilisateur]
    );


    if (
      existing.length > 0
    ) {

      return res.status(409).json({
        message: "Cet utilisateur existe déjà"
      });

    }


    // Création du compte

    const [result] = await db.query(
      `
      INSERT INTO utilisateur
      (
        nom_utilisateur,
        nom,
        prenom,
        mot_de_passe,
        id_role
      )

      VALUES (?, ?, ?, ?, ?)
      `,
      [
        nom_utilisateur,
        nom || null,
        prenom || null,
        mot_de_passe,
        id_role
      ]
    );


    return res.status(201).json({

      message: "Compte créé avec succès",

      id_utilisateur:
        result.insertId

    });


  }

  catch (error) {

    console.error(
      "ERREUR REGISTER :",
      error
    );


    return res.status(500).json({
      message: "Erreur serveur"
    });

  }

};



// =========================================================
// CONNEXION
// =========================================================

exports.login = async (req, res) => {

  try {

    const {
      nom_utilisateur,
      mot_de_passe
    } = req.body;


    if (
      !nom_utilisateur ||
      !mot_de_passe
    ) {

      return res.status(400).json({

        message:
          "Nom utilisateur et mot de passe obligatoires"

      });

    }


    // =====================================================
    // RECHERCHER UTILISATEUR
    // =====================================================

    const [users] = await db.query(
      `
      SELECT

        u.id_utilisateur,

        u.nom_utilisateur,

        u.nom,

        u.prenom,

        u.mot_de_passe,

        u.id_role,

        r.nom_role

      FROM utilisateur u

      JOIN role r
        ON u.id_role = r.id_role

      WHERE u.nom_utilisateur = ?
      `,
      [nom_utilisateur]
    );


    // =====================================================
    // UTILISATEUR INTROUVABLE
    // =====================================================

    if (
      users.length === 0
    ) {

      return res.status(401).json({
        message: "Utilisateur introuvable"
      });

    }


    const user =
      users[0];


    // =====================================================
    // VERIFICATION MOT DE PASSE
    // =====================================================

    if (
      mot_de_passe !==
      user.mot_de_passe
    ) {

      return res.status(401).json({
        message: "Mot de passe incorrect"
      });

    }


    // =====================================================
    // CREATION TOKEN JWT
    // =====================================================

    const token = jwt.sign(

      {

        id_utilisateur:
          user.id_utilisateur,

        nom_utilisateur:
          user.nom_utilisateur,

        nom:
          user.nom,

        prenom:
          user.prenom,

        id_role:
          user.id_role,

        role:
          user.nom_role

      },

      process.env.JWT_SECRET,

      {
        expiresIn: "8h"
      }

    );


    // =====================================================
    // REPONSE FRONTEND
    // =====================================================

    return res.json({

      message:
        "Connexion réussie",

      token,

      utilisateur: {

        id_utilisateur:
          user.id_utilisateur,

        nom_utilisateur:
          user.nom_utilisateur,

        nom:
          user.nom,

        prenom:
          user.prenom,

        id_role:
          user.id_role,

        role:
          user.nom_role

      }

    });


  }

  catch (error) {

    console.error(
      "ERREUR LOGIN :",
      error
    );


    return res.status(500).json({
      message: "Erreur serveur"
    });

  }

};



// =========================================================
// UTILISATEUR CONNECTE
// =========================================================

exports.getMe = async (req, res) => {

  return res.json(
    req.user
  );

};