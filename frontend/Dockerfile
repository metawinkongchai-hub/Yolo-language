# ใช้ Node.js
FROM node:18

# working directory
WORKDIR /app

# copy package.json และติดตั้ง dependencies
COPY package*.json ./
RUN npm install

# copy source code
COPY . .

# เปิด port
EXPOSE 8080

# รัน dev server และ bind 0.0.0.0
CMD ["npm", "run", "start"]
