from flask import Flask, request, jsonify
from ultralytics import YOLO
import cv2
import numpy as np
import torch
from flask_cors import CORS
import os

app = Flask(__name__)
CORS(app)

# โหลดโมเดล YOLO ที่เทรนไว้
model = YOLO(r"C:\Users\Gigabyte\OneDrive\เดสก์ท็อป\CODE\backend\runs\detect\hand_pose_fasttrain\weights\best.pt")
# ใส่ path ของไฟล์โมเดลที่เทรนไว้

@app.route("/predict", methods=["POST"])
def predict():
    if "file" not in request.files:
        return jsonify({"error": "No file uploaded"}), 400

    file = request.files["file"]
    img_bytes = file.read()

    # แปลง byte → image
    npimg = np.frombuffer(img_bytes, np.uint8)
    img = cv2.imdecode(npimg, cv2.IMREAD_COLOR) 

    # รัน YOLO
    results = model(img)

    # หาชื่อ class ที่ detect ได้
    names = model.names
    detected = []
    for r in results[0].boxes:
        cls = int(r.cls[0])
        detected.append(names[cls])

    if len(detected) == 0:
        return jsonify({"prediction": "ไม่พบผลลัพธ์"})

    # เอาเฉพาะอันแรก (หรือรวมทั้งหมดก็ได้)
    prediction = ", ".join(detected)

    return jsonify({"prediction": prediction})

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5001))
    app.run(host="0.0.0.0", port=port, debug=True)
