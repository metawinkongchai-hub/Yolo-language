# # backend/Dockerfile
 FROM node:18

# WORKDIR /app

# COPY package*.json ./
RUN npm install

# COPY . .

# EXPOSE 5000
CMD ["node", "server.js"]

# ใช้ Python image
FROM python:3.10

# ตั้ง working dir
WORKDIR /app

# copy requirements.txt และติดตั้ง dependency
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# copy source code ทั้งหมด
COPY . .

# เปิดพอร์ต 5000
EXPOSE 5000

# คำสั่งรัน app
CMD ["python", "app.py"]
