# =========================
# 1. Flask + Model + Prediction
# =========================
from flask import Flask, request, jsonify
import tensorflow as tf
import numpy as np
from PIL import Image, ImageOps
import io
import os
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

# =========================
# 2. Config
# =========================
IMG_WIDTH, IMG_HEIGHT = 160, 160          # ลดขนาดเพื่อเร็วขึ้น
MODEL_PATH = 'models/sign_model.h5'

# =========================
# 3. Load Model
# =========================
try:
    tf.keras.mixed_precision.set_global_policy("mixed_float16")  # เร็วขึ้นบน GPU รุ่นใหม่
    model = tf.keras.models.load_model(MODEL_PATH)
    print("✅ Model loaded successfully.")
except Exception as e:
    print(f"❌ Error loading model: {e}")
    model = None

# Load labels
class_labels = sorted(os.listdir('dataset/train')) if os.path.exists('dataset/train') else []
print(f"Class labels: {class_labels}")

# =========================
# 4. Helper: Preprocess Image
# =========================
def preprocess_image(file):
    try:
        image = Image.open(io.BytesIO(file.read()))
        image = ImageOps.exif_transpose(image).convert("RGB")
        image = image.resize((IMG_WIDTH, IMG_HEIGHT))
        image_array = np.array(image, dtype=np.float32) / 255.0
        image_array = np.expand_dims(image_array, axis=0)
        return image_array
    except Exception as e:
        raise ValueError(f"Image preprocess failed: {str(e)}")

# =========================
# 5. Routes
# =========================
@app.route('/')
def index():
    return '''
    <h1>Sign Language Prediction API</h1>
    <p>✅ API is running successfully.</p>
    <p>Go to <a href="/upload">/upload</a> to test image upload.</p>
    '''

@app.route('/upload', methods=['GET'])
def upload_form():
    return '''
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <title>Sign Language Prediction</title>
        <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
        <style>
            body { font-family: Arial, sans-serif; text-align: center; margin: 40px; }
            h2 { color: #2c3e50; }
            .preview { margin: 20px auto; }
            img { max-width: 300px; margin-top: 10px; border-radius: 10px; box-shadow: 0px 4px 8px rgba(0,0,0,0.2); }
            .result { margin-top: 20px; font-size: 18px; font-weight: bold; color: #27ae60; }
            .error { color: red; margin-top: 20px; }
            button { background: #27ae60; color: white; padding: 10px 20px; border: none; border-radius: 8px; cursor: pointer; font-size: 16px; }
            button:hover { background: #219150; }
            canvas { max-width: 400px; margin: 20px auto; }
        </style>
    </head>
    <body>
        <h2>Sign Language Prediction</h2>
        <p>Upload an image of a hand sign to predict.</p>

        <input type="file" id="fileInput" accept="image/*" />
        <div class="preview">
            <img id="previewImage" src="" alt="Preview" style="display:none;"/>
        </div>
        <button onclick="predict()">Predict</button>

        <div id="output"></div>
        <canvas id="top3Chart" style="display:none;"></canvas>

        <script>
            // แสดง preview
            document.getElementById("fileInput").addEventListener("change", function(e) {
                const file = e.target.files[0];
                if (file) {
                    const reader = new FileReader();
                    reader.onload = function(ev) {
                        const img = document.getElementById("previewImage");
                        img.src = ev.target.result;
                        img.style.display = "block";
                    }
                    reader.readAsDataURL(file);
                }
            });

            let chart; // Chart instance

            async function predict() {
                const fileInput = document.getElementById("fileInput").files[0];
                if (!fileInput) {
                    document.getElementById("output").innerHTML = '<p class="error">❌ Please select an image first.</p>';
                    return;
                }

                const formData = new FormData();
                formData.append("file", fileInput);

                document.getElementById("output").innerHTML = "<p>⏳ Predicting...</p>";
                document.getElementById("top3Chart").style.display = "none";

                try {
                    const response = await fetch("/predict", { method: "POST", body: formData });
                    const data = await response.json();

                    if (data.error) {
                        document.getElementById("output").innerHTML = '<p class="error">❌ ' + data.error + '</p>';
                    } else {
                        let top3HTML = "<ul>";
                        let labels = [];
                        let confidences = [];
                        data.top3.forEach(t => {
                            top3HTML += `<li>${t.label}: ${(t.confidence*100).toFixed(2)}%</li>`;
                            labels.push(t.label);
                            confidences.push((t.confidence*100).toFixed(2));
                        });
                        top3HTML += "</ul>";

                        document.getElementById("output").innerHTML = `
                            <div class="result">
                                ✅ Prediction: <b>${data.prediction}</b><br>
                                Confidence: ${(data.confidence*100).toFixed(2)}% <br>
                                <br><b>Top 3:</b> ${top3HTML}
                            </div>
                        `;

                        // แสดงกราฟ Top-3
                        const ctx = document.getElementById('top3Chart').getContext('2d');
                        document.getElementById("top3Chart").style.display = "block";
                        if(chart) chart.destroy();
                        chart = new Chart(ctx, {
                            type: 'bar',
                            data: {
                                labels: labels,
                                datasets: [{
                                    label: 'Confidence (%)',
                                    data: confidences,
                                    backgroundColor: '#27ae60'
                                }]
                            },
                            options: {
                                scales: {
                                    y: { beginAtZero: true, max: 100 }
                                }
                            }
                        });
                    }
                } catch (err) {
                    document.getElementById("output").innerHTML = '<p class="error">❌ Prediction request failed.</p>';
                }
            }
        </script>
    </body>
    </html>
    '''

@app.route('/predict', methods=['POST'])
def predict():
    if model is None:
        return jsonify({'error': 'Model not loaded'}), 500

    if 'file' not in request.files:
        return jsonify({'error': 'No file part in the request'}), 400

    file = request.files['file']
    if file.filename == '':
        return jsonify({'error': 'No selected file'}), 400

    try:
        image_array = preprocess_image(file)
    except Exception as e:
        return jsonify({'error': str(e)}), 400

    try:
        prediction = model.predict(image_array)[0]

        # Top-1
        top1_index = int(np.argmax(prediction))
        top1_label = class_labels[top1_index] if class_labels else str(top1_index)
        top1_conf = float(prediction[top1_index])

        # Top-3
        top3_indices = prediction.argsort()[-3:][::-1]
        top3 = [{"label": class_labels[i] if class_labels else str(i),
                 "confidence": float(prediction[i])} for i in top3_indices]

        return jsonify({
            "prediction": top1_label,
            "confidence": round(top1_conf, 4),
            "top3": top3
        })
    except Exception as e:
        return jsonify({'error': f'Prediction failed: {str(e)}'}), 500

# =========================
# Run server
# =========================
if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5001, debug=True)
