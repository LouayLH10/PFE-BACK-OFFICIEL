from faster_whisper import WhisperModel

model = WhisperModel("base", device="cpu", compute_type="int8")

segments, info = model.transcribe("audio.mp3")

print("Language:", info.language)

for segment in segments:
    print(segment.text)