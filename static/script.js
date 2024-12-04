let history = []; // Liste pour stocker l'historique des propositions
let hintGiven = false; // Variable pour vérifier si l'indice a déjà été donné

// Logique pour gérer l'indice
document.getElementById("hintButton").addEventListener("click", async function () {
    if (hintGiven) {
        return; // Si l'indice a déjà été donné, ne rien faire
    }

    try {
        const response = await fetch("/get_hint");
        if (!response.ok) {
            console.error("Erreur lors de la récupération de l'indice.");
            return;
        }

        const data = await response.json();
        document.getElementById("hint").textContent = data.hint; // Affiche l'indice
        document.getElementById("hint").style.display = 'block'; // Rend l'indice visible
        hintGiven = true; // Marque l'indice comme donné
    } catch (error) {
        console.error("Erreur lors de la récupération de l'indice : ", error);
    }
});

document.getElementById("guessForm").addEventListener("submit", async function (e) {
    e.preventDefault();

    const userWord = document.getElementById("userPhrase").value.trim().toLowerCase();
    const feedback = document.getElementById("feedback");

    if (!userWord) {
        feedback.textContent = "Veuillez entrer un mot.";
        return;
    }

    try {
        const response = await fetch("/compare", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ phrase: userWord }),
        });

        if (!response.ok) {
            feedback.textContent = "Erreur lors de la soumission.";
            console.error("Erreur réseau : ", response.statusText);
            return;
        }

        const data = await response.json();
        feedback.textContent = data.message;

        // Mise à jour de l'historique avec le tri renvoyé par le serveur
        if (data.history) {
            history = data.history.map(item => ({
                phrase: item.user_word,
                score: (item.similarity_score * 100).toFixed(2)
            }));
            updateHistory();
        }

        if (data.message === "Félicitations ! Tu as trouvé le mot mon coeur.") {
            document.getElementById("userPhrase").disabled = true;
            document.querySelector("button[type='submit']").disabled = true;
        }

        document.getElementById("userPhrase").value = ""; // Effacer le champ

    } catch (error) {
        feedback.textContent = "Erreur de communication avec le serveur.";
        console.error("Erreur de communication : ", error);
    }
});

function updateHistory() {
    const historyList = document.getElementById("historyList");
    historyList.innerHTML = ""; // Réinitialise la liste
    history.forEach(item => {
        const li = document.createElement("li");
        li.textContent = `${item.phrase} - Similarité : ${item.score}%`;

        // Appliquer des couleurs en fonction du score
        if (item.score > 80) {
            li.style.color = "green";  // Très proche
        } else if (item.score > 50) {
            li.style.color = "orange";  // Moyennement proche
        } else {
            li.style.color = "red";  // Loin
        }

        // Ajouter une barre de progression pour le score
        const progressBarContainer = document.createElement("div");
        progressBarContainer.style.width = "100%";
        progressBarContainer.style.backgroundColor = "#e0e0e0";
        progressBarContainer.style.marginTop = "5px";
        progressBarContainer.style.borderRadius = "5px";

        const progressBar = document.createElement("div");
        progressBar.style.height = "10px";
        progressBar.style.width = `${item.score}%`;
        progressBar.style.backgroundColor = li.style.color;
        progressBar.style.borderRadius = "5px";

        progressBarContainer.appendChild(progressBar);
        li.appendChild(progressBarContainer);

        historyList.appendChild(li);
    });
}

document.getElementById("resetButton").addEventListener("click", function () {
    history = []; // Vide l'historique
    document.getElementById("historyList").innerHTML = ""; // Efface la liste de l'interface
    document.getElementById("userPhrase").value = ""; // Vide le champ texte
    document.getElementById("userPhrase").disabled = false; // Réactive le champ texte
    document.querySelector("button[type='submit']").disabled = false; // Réactive le bouton de soumission
    document.getElementById("feedback").textContent = "Essaye de deviner le mot mystère !"; // Réinitialise le feedback
    document.getElementById("hint").style.display = 'none'; // Cache l'indice
    hintGiven = false; // Réinitialise la variable d'indice
});
