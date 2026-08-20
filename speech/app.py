from flask import Flask, request, jsonify
from faster_whisper import WhisperModel
import tempfile
import os

app = Flask(__name__)

print("Loading model...")

model = WhisperModel(
    "base",
    device="cpu",
    compute_type="int8"
)

print("Model loaded.")

@app.post("/transcribe")
def transcribe():

    if "audio" not in request.files:
        return jsonify({"error": "No audio"}), 400

    audio = request.files["audio"]

    with tempfile.NamedTemporaryFile(
        delete=False,
        suffix=".webm"
    ) as temp:

        audio.save(temp.name)

        segments, info = model.transcribe(temp.name)

        text = ""

        for segment in segments:
            text += segment.text

    os.remove(temp.name)

    return jsonify({
        "language": info.language,
        "text": text.strip()
    })


if __name__ == "__main__":
  #  app.run(
     #   host="127.0.0.1",
      #  port=5000
   # )
     app.run(
        host="0.0.0.0",
        port=int(os.environ.get("PORT", 5000))
    )