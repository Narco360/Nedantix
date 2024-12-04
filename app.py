import spacy
from flask import Flask, render_template, request, jsonify
import os

app = Flask(__name__)

# Charger le modèle pré-entraîné de spaCy pour le français
nlp = spacy.load("fr_core_news_md")

# Mot cible à deviner (utilisation de la variable d'environnement)
TARGET_WORD = os.getenv("TARGET_WORD", "vomir")  # Valeur par défaut "banc"
# Indice personnalisé
HINT = "L'une des meilleures anecdote de notre couple."

# Historique des propositions
history = []

@app.route('/')
def home():
    """
    Route principale servant la page HTML.
    """
    return render_template('index.html')

@app.route('/compare', methods=['POST'])
def compare_word():
    """
    Compare la proposition de l'utilisateur avec le mot cible
    et renvoie un score de similarité ou un message de victoire.
    """
    data = request.json
    user_word = data.get("phrase", "").strip().lower()  # Nettoie les espaces et rend le mot minuscule

    if not user_word:
        return jsonify({"error": "Aucun mot fourni!"}), 400

    try:
        # Créer des objets spaCy pour calculer la similarité
        target_doc = nlp(TARGET_WORD)
        user_doc = nlp(user_word)

        # Calculer la similarité sémantique entre les mots
        similarity_score = target_doc.similarity(user_doc)

    except Exception as e:
        return jsonify({"error": f"Erreur lors du calcul de similarité : {str(e)}"}), 500

    # Ajouter l'historique avec un score de 100% si le mot est trouvé
    if user_word == TARGET_WORD.lower():
        history.append({
            "user_word": user_word,
            "similarity_score": 1.0,  # Score de 100%
            "message": "Félicitations ! Tu as trouvé le mot mon coeur."
        })

        # Tri l'historique après ajout
        history.sort(key=lambda x: x["similarity_score"], reverse=True)

        return jsonify({
            "user_word": user_word,
            "similarity_score": 1.0,
            "message": "Félicitations ! Tu as trouvé le mot mon coeur.",
            "history": history
        }), 200

    # Si le mot n'est pas correct, retourne le score de similarité
    history.append({
        "user_word": user_word,
        "similarity_score": similarity_score,
        "message": "Essayez encore !"
    })

    # Tri l'historique après ajout
    history.sort(key=lambda x: x["similarity_score"], reverse=True)

    return jsonify({
        "user_word": user_word,
        "similarity_score": similarity_score,
        "message": "Essayez encore !",
        "history": history
    }), 200

@app.route('/get_hint', methods=['GET'])
def get_hint():
    """
    Route pour fournir un indice personnalisé.
    """
    return jsonify({"hint": HINT}), 200

@app.route('/history', methods=['GET'])
def get_history():
    """
    Retourne l'historique des propositions trié par similarité.
    """
    return jsonify({"history": history}), 200

# Lancer l'application Flask en mode debug local
if __name__ == '__main__':
    app.run(debug=True)
