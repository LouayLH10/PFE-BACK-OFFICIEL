# Importation de Flask pour créer l'API web
from flask import Flask, request, jsonify

# Importation du modèle Faster-Whisper pour la transcription audio
from faster_whisper import WhisperModel

# Permet de créer des fichiers temporaires pour stocker l'audio
import tempfile
# Permet de manipuler les fichiers et variables d'environnement
import os


# Création de l'application Flask
app = Flask(__name__)


# Chargement du modèle Whisper au démarrage de l'application
print("Loading model...")

model = WhisperModel(
    "base",          # Taille du modèle Whisper utilisée
    device="cpu",    # Exécution du modèle sur le processeur
    compute_type="int8"  # Optimisation des calculs pour réduire la consommation mémoire
)

# Confirmation que le modèle est correctement chargé
print("Model loaded.")


# Définition de la route POST permettant de recevoir un fichier audio
@app.post("/transcribe")
def transcribe():

    # Vérification de la présence du fichier audio dans la requête
    if "audio" not in request.files:
        return jsonify({"error": "No audio"}), 400

    # Récupération du fichier audio envoyé par le backend NestJS
    audio = request.files["audio"]


    # Création d'un fichier temporaire pour sauvegarder l'audio reçu
    with tempfile.NamedTemporaryFile(
        delete=False,       # Le fichier reste disponible après la fermeture
        suffix=".webm"      # Extension temporaire utilisée pour le fichier audio
    ) as temp:

        # Sauvegarde du fichier audio dans le fichier temporaire
        audio.save(temp.name)

        # Transcription du fichier audio avec Faster-Whisper
        segments, info = model.transcribe(temp.name)

        # Variable permettant de stocker le texte transcrit
        text = ""

        # Parcours de tous les segments retournés par Whisper
        for segment in segments:

            # Ajout du texte de chaque segment au résultat final
            text += segment.text


    # Suppression du fichier temporaire après la transcription
    os.remove(temp.name)


    # Retour des résultats sous forme de réponse JSON
    return jsonify({
        "language": info.language,   # Langue détectée par Whisper
        "text": text.strip()         # Texte transcrit sans espaces inutiles
    })


# Point d'entrée principal de l'application
# Ce bloc est exécuté uniquement lorsque le fichier app.py est lancé directement
if __name__ == "__main__":

    # Démarrage du serveur Flask
    app.run(
        host="127.0.0.1",  # Serveur accessible uniquement depuis la machine locale
        port=5000           # Port utilisé par l'API Flask
    )