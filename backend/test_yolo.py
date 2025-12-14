from ultralytics import YOLO
import cv2

# โหลดโมเดลที่เทรนเสร็จ (ใช้ best.pt)
model = YOLO(r"C:\Users\Gigabyte\OneDrive\เดสก์ท็อป\CODE\backend\runs\detect\hand_pose_model\weights\best.pt")

# เอาภาพจาก dataset ที่อยากลองมาเทส
image_path = r"C:\Users\Gigabyte\OneDrive\เดสก์ท็อป\CODE\backend\dataset\train\hello\hello (1).jpg"

# ตรวจจับภาพ
results = model.predict(source=image_path, save=True, show=True, imgsz=640, conf=0.25)

# แสดงผลใน console
for r in results:
    for box in r.boxes:
        cls = int(box.cls[0])
        conf = float(box.conf[0])
        label = model.names[cls]
        print(f"{label}: {conf:.2f}")
