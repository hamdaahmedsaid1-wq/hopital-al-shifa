export async function secureFetch(url, options = {}) {

  const token =
    localStorage.getItem("alshifa_token");


  // Si aucun utilisateur n'est connecté
  if (!token) {

    window.location.replace("/");

    throw new Error(
      "Utilisateur non connecté."
    );

  }


  const headers = {

    ...(options.headers || {}),

    Authorization:
      "Bearer " + token

  };


  // Si on envoie des données JSON
  if (
    options.body &&
    !headers["Content-Type"]
  ) {

    headers["Content-Type"] =
      "application/json";

  }


  const response =
    await fetch(
      url,
      {
        ...options,
        headers
      }
    );


  // Si le token est invalide ou expiré
  if (response.status === 401) {

    localStorage.removeItem(
      "alshifa_token"
    );

    localStorage.removeItem(
      "alshifa_user"
    );


    window.location.replace("/");


    throw new Error(
      "Session expirée."
    );

  }


  return response;

}



/* =========================================================
   DECONNEXION
========================================================= */

export function deconnexion() {

  localStorage.removeItem(
    "alshifa_token"
  );

  localStorage.removeItem(
    "alshifa_user"
  );

  localStorage.removeItem(
    "alshifa_username"
  );


  window.location.replace("/");

}



/* =========================================================
   UTILISATEUR CONNECTE
========================================================= */

export function getUtilisateurConnecte() {

  const data =
    localStorage.getItem(
      "alshifa_user"
    );


  if (!data) {
    return null;
  }


  try {

    return JSON.parse(data);

  }

  catch (error) {

    console.error(
      "Utilisateur invalide :",
      error
    );

    return null;

  }

}