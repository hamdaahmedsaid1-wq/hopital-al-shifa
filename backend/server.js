require("dotenv").config();

const app = require("./app");

const db =
  require("./config/database");


const PORT =
  process.env.PORT || 3000;


async function startServer() {

  try {

    const connection =
      await db.getConnection();


    console.log(
      "✅ Connexion MySQL réussie"
    );

    console.log(
      "✅ Base utilisée :",
      process.env.DB_NAME
    );


    connection.release();


    app.listen(
      PORT,
      () => {

        console.log(
          `✅ Serveur lancé sur http://localhost:${PORT}`
        );

      }
    );


  } catch (error) {

    console.error(
      "❌ Erreur connexion MySQL :",
      error.message
    );

  }

}


startServer();