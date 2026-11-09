console.log("Interface Al-Shifa chargée");

document.addEventListener("DOMContentLoaded", () => {

  document
    .querySelectorAll("[data-delete]")
    .forEach((button) => {

      button.addEventListener("click", () => {

        const confirmation = confirm(
          "Voulez-vous vraiment supprimer cet élément ?"
        );

        if (confirmation) {
          alert("Suppression simulée.");
        }

      });

    });


  document
    .querySelectorAll("[data-demo-form]")
    .forEach((form) => {

      form.addEventListener("submit", (event) => {

        event.preventDefault();

        alert(
          "Enregistrement effectué avec succès."
        );

      });

    });

});