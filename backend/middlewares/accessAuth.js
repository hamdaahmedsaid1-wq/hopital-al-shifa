const jwt = require("jsonwebtoken");

function accessAuth(req, res, next) {

  try {

    const authorization =
      req.headers.authorization;

    if (
      !authorization ||
      !authorization.startsWith("Bearer ")
    ) {

      return res.status(401).json({
        message: "Vous devez être connecté."
      });

    }

    const token =
      authorization.split(" ")[1];

    const utilisateur =
      jwt.verify(
        token,
        process.env.JWT_SECRET
      );

    req.user =
      utilisateur;

    next();

  }

  catch (error) {

    console.error(
      "Erreur authentification :",
      error
    );

    return res.status(401).json({
      message:
        "Session invalide ou expirée."
    });

  }

}

module.exports = accessAuth;