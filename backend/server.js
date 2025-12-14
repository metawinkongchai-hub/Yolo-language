// // ===== server.js =====
// const express = require('express');
// const multer = require('multer');
// const path = require('path');
// const fs = require('fs');
// const cors = require('cors');
// const knex = require('knex');
// const mqtt = require('mqtt');

// const app = express();
// app.use(cors());
// app.use(express.json());
// app.use('/saved_images', express.static(path.join(__dirname, 'saved_images')));

// // ================= MySQL =================
// const db = knex({
//     client: 'mysql2',
//     connection: {
//         host: 'localhost',
//         user: 'root',
//         password: 'root_password',
//         database: 'sign_lang_db',
//         port: 3306
//     }
// });

// // ================= MQTT =================
// const mqttClient = mqtt.connect('mqtt://broker.hivemq.com:1883');

// mqttClient.on('connect', () => {
//     console.log("✅ MQTT connected");

//     mqttClient.subscribe("hand_sign/translation/#", (err) => {
//         if (!err) console.log("📡 Subscribed to hand_sign/translation/#");
//     });
// });

// mqttClient.on('message', (topic, message) => {
//     console.log("📩 MQTT received:", topic, message.toString());
// });

// mqttClient.on('error', err => console.error("MQTT error:", err));

// // ================= Multer =================
// const storage = multer.diskStorage({
//     destination: (req, file, cb) => {
//         const folderPath = path.join(__dirname, 'saved_images');
//         fs.mkdirSync(folderPath, { recursive: true });
//         cb(null, folderPath);
//     },
//     filename: (req, file, cb) => {
//         cb(null, Date.now() + path.extname(file.originalname));
//     }
// });
// const upload = multer({ storage });

// // ================= REST API =================
// // POST /server → save image + translation + MQTT
// app.post('/server', upload.single('file'), async (req, res) => {
//     try {
//         if (!req.file) return res.status(400).json({ success: false, error: 'No file uploaded' });

//         const predictedText = req.body.predicted_text || 'No Data';
//         const relativePath = path.join('saved_images', req.file.filename).replace(/\\/g, '/');

//         const [insertId] = await db('translations').insert({
//             image_path: relativePath,
//             predicted_text: predictedText
//         });

//         const payload = {
//             id: insertId,
//             predicted_text: predictedText,
//             image_path: relativePath,
//             created_at: new Date().toISOString()
//         };

//         // MQTT publish (ข้อความ + JSON)
//         mqttClient.publish('hand_sign/translation', predictedText, { qos: 1, retain: true });
//         mqttClient.publish('hand_sign/translation/json', JSON.stringify(payload), { qos: 1, retain: true });

//         res.json({ success: true, payload });
//     } catch (err) {
//         console.error(err);
//         res.status(500).json({ success: false, error: err.message });
//     }
// });

// // GET /server → load all translations
// app.get('/server', async (req, res) => {
//     try {
//         const rows = await db('translations').select('*').orderBy('created_at', 'desc');
//         res.json({ status: 'success', rows });
//     } catch (err) {
//         console.error(err);
//         res.status(500).json({ success: false, error: err.message });
//     }
// });

// app.listen(5000, () => console.log('🚀 Server running on port 5000'));



// const express = require('express');
// const multer = require('multer');
// const path = require('path');
// const fs = require('fs');
// const cors = require('cors');
// const knex = require('knex');
// const mqtt = require('mqtt');

// const app = express();
// app.use(cors());
// app.use(express.json());
// app.use('/saved_images', express.static(path.join(__dirname, 'saved_images')));

// // ================= MySQL =================
// const db = knex({
//     client: 'mysql2',
//     connection: {
//         host: 'localhost',
//         user: 'root',
//         password: 'root_password', // เปลี่ยนตาม DB ของมึง
//         database: 'sign_lang_db',
//         port: 3306,
//         timezone: '+07:00' // 🕒 ใช้เวลาไทย
//     },
//     pool: {
//         afterCreate: (conn, done) => {
//             conn.query("SET time_zone = '+07:00';", (err) => {
//                 done(err, conn);
//             });
//         }
//     }
// });

// // ================= MQTT =================
// const mqttClient = mqtt.connect('mqtt://broker.hivemq.com:1883');

// mqttClient.on('connect', () => {
//     console.log("✅ MQTT connected");
//     mqttClient.subscribe("hand_sign/translation/#", err => {
//         if (!err) console.log("📡 Subscribed to hand_sign/translation/#");
//     });
// });

// mqttClient.on('message', (topic, message) => {
//     console.log("📩 MQTT received:", topic, message.toString());
// });
// mqttClient.on('error', err => console.error("MQTT error:", err));

// // ================= Multer =================
// const storage = multer.diskStorage({
//     destination: (req, file, cb) => {
//         const folderPath = path.join(__dirname, 'saved_images');
//         fs.mkdirSync(folderPath, { recursive: true });
//         cb(null, folderPath);
//     },
//     filename: (req, file, cb) => {
//         cb(null, Date.now() + path.extname(file.originalname));
//     }
// });
// const upload = multer({ storage });

// // ================= Helper =================
// // คืนค่าเวลาไทย (Asia/Bangkok)
// function getBangkokTime() {
//     const now = new Date();
//     return new Date(now.getTime() + 7 * 60 * 60 * 1000);
// }

// // ================= REST API =================

// // POST /server → save image + translation + MQTT
// app.post('/server', upload.single('file'), async (req, res) => {
//     try {
//         if (!req.file) return res.status(400).json({ success: false, error: 'No file uploaded' });

//         const predictedText = req.body.predicted_text || 'No Data';
//         const relativePath = path.join('saved_images', req.file.filename).replace(/\\/g, '/');

//         const [insertId] = await db('translations').insert({
//             image_path: relativePath,
//             predicted_text: predictedText,
//             created_at: getBangkokTime() // ⏰ บันทึกเวลาไทยลง DB
//         });

//         const payload = {
//             id: insertId,
//             predicted_text: predictedText,
//             image_path: relativePath,
//             created_at: getBangkokTime().toISOString() // ⏰ ส่งเวลาไทยกลับ
//         };

//         mqttClient.publish('hand_sign/translation', predictedText, { qos: 1, retain: true });
//         mqttClient.publish('hand_sign/translation/json', JSON.stringify(payload), { qos: 1, retain: true });

//         res.json({ success: true, payload });
//     } catch (err) {
//         console.error(err);
//         res.status(500).json({ success: false, error: err.message });
//     }
// });

// // GET /server → load all translations
// app.get('/server', async (req, res) => {
//     try {
//         const rows = await db('translations').select('*').orderBy('created_at', 'desc');
//         res.json({ status: 'success', rows });
//     } catch (err) {
//         console.error(err);
//         res.status(500).json({ success: false, error: err.message });
//     }
// });

// // DELETE /server/:id → delete translation + image
// app.delete('/server/:id', async (req, res) => {
//     const { id } = req.params;
//     try {
//         const rows = await db('translations').where({ id }).select('image_path');
//         if (rows.length === 0) return res.status(404).json({ success: false, error: 'Record not found' });

//         const imagePath = path.join(__dirname, rows[0].image_path);
//         if (fs.existsSync(imagePath)) fs.unlinkSync(imagePath);

//         await db('translations').where({ id }).del();
//         res.json({ success: true, message: 'Deleted successfully' });
//     } catch (err) {
//         console.error(err);
//         res.status(500).json({ success: false, error: err.message });
//     }
// });

// app.listen(5000, () => console.log('🚀 Server running on port 5000'));











// const express = require('express');
// const multer = require('multer');
// const path = require('path');
// const fs = require('fs');
// const cors = require('cors');
// const knex = require('knex');
// const mqtt = require('mqtt');

// const app = express();
// app.use(cors());
// app.use(express.json());
// app.use('/saved_images', express.static(path.join(__dirname, 'saved_images')));

// // ================= MySQL =================
// const db = knex({
//     client: 'mysql2',
//     connection: {
//         host: 'localhost',
//         user: 'root',
//         password: 'root_password', // <-- แก้ไขรหัสผ่านของคุณตรงนี้
//         database: 'sign_lang_db',
//         port: 3306,
//         timezone: '+07:00'
//     },
//     pool: {
//         afterCreate: (conn, done) => {
//             conn.query("SET time_zone = '+07:00';", (err) => {
//                 done(err, conn);
//             });
//         }
//     }
// });

// // ================= MQTT =================
// const mqttClient = mqtt.connect('mqtt://broker.hivemq.com:1883');

// mqttClient.on('connect', () => {
//     console.log("✅ MQTT connected");
//     mqttClient.subscribe("hand_sign/translation/#", err => {
//         if (!err) console.log("📡 Subscribed to hand_sign/translation/#");
//     });
// });
// mqttClient.on('message', (topic, message) => console.log("📩 MQTT received:", topic, message.toString()));
// mqttClient.on('error', err => console.error("MQTT error:", err));

// // ================= Multer =================
// const storage = multer.diskStorage({
//     destination: (req, file, cb) => {
//         const folderPath = path.join(__dirname, 'saved_images');
//         fs.mkdirSync(folderPath, { recursive: true });
//         cb(null, folderPath);
//     },
//     filename: (req, file, cb) => {
//         cb(null, Date.now() + path.extname(file.originalname));
//     }
// });
// const upload = multer({ storage });

// // ================= REST API =================

// // POST /server → บันทึกข้อมูลการแปลใหม่
// app.post('/server', upload.single('file'), async (req, res) => {
//     try {
//         if (!req.file) return res.status(400).json({ success: false, error: 'No file uploaded' });

//         const predictedText = req.body.predicted_text || 'No Data';
//         const relativePath = path.join('saved_images', req.file.filename).replace(/\\/g, '/');

//         const [insertId] = await db('translations').insert({
//             image_path: relativePath,
//             predicted_text: predictedText,
//             created_at: new Date()
//         });

//         const payload = {
//             id: insertId,
//             predicted_text: predictedText,
//             image_path: relativePath,
//             created_at: new Date().toISOString()
//         };

//         mqttClient.publish('hand_sign/translation', predictedText, { qos: 1, retain: true });
//         mqttClient.publish('hand_sign/translation/json', JSON.stringify(payload), { qos: 1, retain: true });

//         res.json({ success: true, payload });
//     } catch (err) {
//         console.error(err);
//         res.status(500).json({ success: false, error: err.message });
//     }
// });

// // GET /server → โหลดข้อมูลการแปลทั้งหมด
// app.get('/server', async (req, res) => {
//     try {
//         const rows = await db('translations').select('*').orderBy('created_at', 'desc');
//         res.json({ status: 'success', rows });
//     } catch (err) {
//         console.error(err);
//         res.status(500).json({ success: false, error: err.message });
//     }
// });

// // DELETE /server/:id → ลบ 1 รายการ
// app.delete('/server/:id', async (req, res) => {
//     const { id } = req.params;
//     try {
//         const rows = await db('translations').where({ id }).select('image_path');
//         if (rows.length === 0) return res.status(404).json({ success: false, error: 'Record not found' });

//         const imagePath = path.join(__dirname, rows[0].image_path);
//         if (fs.existsSync(imagePath)) fs.unlinkSync(imagePath);

//         await db('translations').where({ id }).del();
//         res.json({ success: true, message: 'Deleted successfully' });
//     } catch (err) {
//         console.error(err);
//         res.status(500).json({ success: false, error: err.message });
//     }
// });

// // POST /server/delete-bulk → ลบหลายรายการตาม IDs
// app.post('/server/delete-bulk', async (req, res) => {
//     const { ids } = req.body;
//     if (!ids || !Array.isArray(ids) || ids.length === 0) {
//         return res.status(400).json({ success: false, error: 'IDs are required' });
//     }
//     try {
//         const rows = await db('translations').whereIn('id', ids).select('image_path');
//         rows.forEach(row => {
//             const imagePath = path.join(__dirname, row.image_path);
//             if (fs.existsSync(imagePath)) {
//                 fs.unlinkSync(imagePath);
//             }
//         });
//         await db('translations').whereIn('id', ids).del();
//         res.json({ success: true, message: 'Selected items deleted successfully' });
//     } catch (err) {
//         console.error(err);
//         res.status(500).json({ success: false, error: err.message });
//     }
// });

// // DELETE /server/all → ลบประวัติทั้งหมด
// app.delete('/server/all', async (req, res) => {
//     try {
//         const rows = await db('translations').select('image_path');
//         rows.forEach(row => {
//             const imagePath = path.join(__dirname, row.image_path);
//             if (fs.existsSync(imagePath)) {
//                 fs.unlinkSync(imagePath);
//             }
//         });
//         await db('translations').truncate();
//         res.json({ success: true, message: 'All items deleted successfully' });
//     } catch (err)
//  {
//         console.error(err);
//         res.status(500).json({ success: false, error: err.message });
//     }
// });

// app.listen(5000, () => console.log('🚀 Server running on port 5000'));


// const express = require('express');
// const multer = require('multer');
// const path = require('path');
// const fs = require('fs');
// const cors = require('cors');
// const knex = require('knex');
// const mqtt = require('mqtt');

// const app = express();
// app.use(cors());
// app.use(express.json());
// app.use('/saved_images', express.static(path.join(__dirname, 'saved_images')));

// // ================= MySQL =================
// const db = knex({
//     client: 'mysql2',
//     connection: {
//         host: 'localhost',
//         user: 'root',
//         password: 'root_password', // <-- แก้ไขรหัสผ่านของคุณตรงนี้
//         database: 'sign_lang_db',
//         port: 3306,
//         timezone: '+07:00'
//     },
//     pool: {
//         afterCreate: (conn, done) => {
//             conn.query("SET time_zone = '+07:00';", (err) => {
//                 done(err, conn);
//             });
//         }
//     }
// });

// // ================= MQTT =================
// const mqttClient = mqtt.connect('mqtt://broker.hivemq.com:1883');

// mqttClient.on('connect', () => {
//     console.log("✅ MQTT connected");
//     mqttClient.subscribe("hand_sign/translation/#", err => {
//         if (!err) console.log("📡 Subscribed to hand_sign/translation/#");
//     });
// });
// mqttClient.on('message', (topic, message) => console.log("📩 MQTT received:", topic, message.toString()));
// mqttClient.on('error', err => console.error("MQTT error:", err));

// // ================= Multer =================
// const storage = multer.diskStorage({
//     destination: (req, file, cb) => {
//         const folderPath = path.join(__dirname, 'saved_images');
//         fs.mkdirSync(folderPath, { recursive: true });
//         cb(null, folderPath);
//     },
//     filename: (req, file, cb) => {
//         cb(null, Date.now() + path.extname(file.originalname));
//     }
// });
// const upload = multer({ storage });

// // ================= REST API =================

// // POST /server → บันทึกข้อมูลการแปลใหม่
// app.post('/server', upload.single('file'), async (req, res) => {
//     try {
//         if (!req.file) return res.status(400).json({ success: false, error: 'No file uploaded' });

//         const predictedText = req.body.predicted_text || 'No Data';
//         const relativePath = path.join('saved_images', req.file.filename).replace(/\\/g, '/');

//         const [insertId] = await db('translations').insert({
//             image_path: relativePath,
//             predicted_text: predictedText,
//             created_at: new Date()
//         });

//         const payload = {
//             id: insertId,
//             predicted_text: predictedText,
//             image_path: relativePath,
//             created_at: new Date().toISOString()
//         };

//         mqttClient.publish('hand_sign/translation', predictedText, { qos: 1, retain: true });
//         mqttClient.publish('hand_sign/translation/json', JSON.stringify(payload), { qos: 1, retain: true });

//         res.json({ success: true, payload });
//     } catch (err) {
//         console.error(err);
//         res.status(500).json({ success: false, error: err.message });
//     }
// });

// // GET /server → โหลดข้อมูลการแปลทั้งหมด
// app.get('/server', async (req, res) => {
//     try {
//         const rows = await db('translations').select('*').orderBy('created_at', 'desc');
//         res.json({ status: 'success', rows });
//     } catch (err) {
//         console.error(err);
//         res.status(500).json({ success: false, error: err.message });
//     }
// });

// // DELETE /server/:id → ลบ 1 รายการ
// app.delete('/server/:id', async (req, res) => {
//     const { id } = req.params;
//     try {
//         const rows = await db('translations').where({ id }).select('image_path');
//         if (rows.length === 0) return res.status(404).json({ success: false, error: 'Record not found' });

//         const imagePath = path.join(__dirname, rows[0].image_path);
//         if (fs.existsSync(imagePath)) fs.unlinkSync(imagePath);

//         await db('translations').where({ id }).del();
//         res.json({ success: true, message: 'Deleted successfully' });
//     } catch (err) {
//         console.error(err);
//         res.status(500).json({ success: false, error: err.message });
//     }
// });

// // POST /server/delete-bulk → ลบหลายรายการตาม IDs
// app.post('/server/delete-bulk', async (req, res) => {
//     const { ids } = req.body;
//     if (!ids || !Array.isArray(ids) || ids.length === 0) {
//         return res.status(400).json({ success: false, error: 'IDs are required' });
//     }
//     try {
//         const rows = await db('translations').whereIn('id', ids).select('image_path');
//         rows.forEach(row => {
//             const imagePath = path.join(__dirname, row.image_path);
//             if (fs.existsSync(imagePath)) {
//                 fs.unlinkSync(imagePath);
//             }
//         });
//         await db('translations').whereIn('id', ids).del();
//         res.json({ success: true, message: 'Selected items deleted successfully' });
//     } catch (err) {
//         console.error(err);
//         res.status(500).json({ success: false, error: err.message });
//     }
// });

// // DELETE /server/all → ลบประวัติทั้งหมด
// app.delete('/server/all', async (req, res) => {
//     try {
//         const rows = await db('translations').select('image_path');
//         rows.forEach(row => {
//             const imagePath = path.join(__dirname, row.image_path);
//             if (fs.existsSync(imagePath)) {
//                 fs.unlinkSync(imagePath);
//             }
//         });
//         await db('translations').truncate();
//         res.json({ success: true, message: 'All items deleted successfully' });
//     } catch (err)
//  {
//         console.error(err);
//         res.status(500).json({ success: false, error: err.message });
//     }
// });

// app.listen(5000, () => console.log('🚀 Server running on port 5000'));








// // ===== server.js =====
// const express = require('express');
// const multer = require('multer');
// const path = require('path');
// const fs = require('fs');
// const cors = require('cors');
// const knex = require('knex');
// const mqtt = require('mqtt');

// const app = express();
// app.use(cors());
// app.use(express.json());
// app.use('/saved_images', express.static(path.join(__dirname, 'saved_images')));

// // ================= MySQL =================
// const db = knex({
//     client: 'mysql2',
//     connection: {
//         host: 'localhost',
//         user: 'root',
//         password: 'root_password',
//         database: 'sign_lang_db',
//         port: 3306
//     }
// });

// // ================= MQTT =================
// const mqttClient = mqtt.connect('mqtt://broker.hivemq.com:1883');

// mqttClient.on('connect', () => {
//     console.log("✅ MQTT connected");

//     mqttClient.subscribe("hand_sign/translation/#", (err) => {
//         if (!err) console.log("📡 Subscribed to hand_sign/translation/#");
//     });
// });

// mqttClient.on('message', (topic, message) => {
//     console.log("📩 MQTT received:", topic, message.toString());
// });

// mqttClient.on('error', err => console.error("MQTT error:", err));

// // ================= Multer =================
// const storage = multer.diskStorage({
//     destination: (req, file, cb) => {
//         const folderPath = path.join(__dirname, 'saved_images');
//         fs.mkdirSync(folderPath, { recursive: true });
//         cb(null, folderPath);
//     },
//     filename: (req, file, cb) => {
//         cb(null, Date.now() + path.extname(file.originalname));
//     }
// });
// const upload = multer({ storage });

// // ================= REST API =================
// // POST /server → save image + translation + MQTT
// app.post('/server', upload.single('file'), async (req, res) => {
//     try {
//         if (!req.file) return res.status(400).json({ success: false, error: 'No file uploaded' });

//         const predictedText = req.body.predicted_text || 'No Data';
//         const relativePath = path.join('saved_images', req.file.filename).replace(/\\/g, '/');

//         const [insertId] = await db('translations').insert({
//             image_path: relativePath,
//             predicted_text: predictedText
//         });

//         const payload = {
//             id: insertId,
//             predicted_text: predictedText,
//             image_path: relativePath,
//             created_at: new Date().toISOString()
//         };

//         // MQTT publish (ข้อความ + JSON)
//         mqttClient.publish('hand_sign/translation', predictedText, { qos: 1, retain: true });
//         mqttClient.publish('hand_sign/translation/json', JSON.stringify(payload), { qos: 1, retain: true });

//         res.json({ success: true, payload });
//     } catch (err) {
//         console.error(err);
//         res.status(500).json({ success: false, error: err.message });
//     }
// });

// // GET /server → load all translations
// app.get('/server', async (req, res) => {
//     try {
//         const rows = await db('translations').select('*').orderBy('created_at', 'desc');
//         res.json({ status: 'success', rows });
//     } catch (err) {
//         console.error(err);
//         res.status(500).json({ success: false, error: err.message });
//     }
// });

// app.listen(5000, () => console.log('🚀 Server running on port 5000'));



// const express = require('express');
// const multer = require('multer');
// const path = require('path');
// const fs = require('fs');
// const cors = require('cors');
// const knex = require('knex');
// const mqtt = require('mqtt');

// const app = express();
// app.use(cors());
// app.use(express.json());
// app.use('/saved_images', express.static(path.join(__dirname, 'saved_images')));

// // ================= MySQL =================
// const db = knex({
//     client: 'mysql2',
//     connection: {
//         host: 'localhost',
//         user: 'root',
//         password: 'root_password', // เปลี่ยนตาม DB ของมึง
//         database: 'sign_lang_db',
//         port: 3306,
//         timezone: '+07:00' // 🕒 ใช้เวลาไทย
//     },
//     pool: {
//         afterCreate: (conn, done) => {
//             conn.query("SET time_zone = '+07:00';", (err) => {
//                 done(err, conn);
//             });
//         }
//     }
// });

// // ================= MQTT =================
// const mqttClient = mqtt.connect('mqtt://broker.hivemq.com:1883');

// mqttClient.on('connect', () => {
//     console.log("✅ MQTT connected");
//     mqttClient.subscribe("hand_sign/translation/#", err => {
//         if (!err) console.log("📡 Subscribed to hand_sign/translation/#");
//     });
// });

// mqttClient.on('message', (topic, message) => {
//     console.log("📩 MQTT received:", topic, message.toString());
// });
// mqttClient.on('error', err => console.error("MQTT error:", err));

// // ================= Multer =================
// const storage = multer.diskStorage({
//     destination: (req, file, cb) => {
//         const folderPath = path.join(__dirname, 'saved_images');
//         fs.mkdirSync(folderPath, { recursive: true });
//         cb(null, folderPath);
//     },
//     filename: (req, file, cb) => {
//         cb(null, Date.now() + path.extname(file.originalname));
//     }
// });
// const upload = multer({ storage });

// // ================= Helper =================
// // คืนค่าเวลาไทย (Asia/Bangkok)
// function getBangkokTime() {
//     const now = new Date();
//     return new Date(now.getTime() + 7 * 60 * 60 * 1000);
// }

// // ================= REST API =================

// // POST /server → save image + translation + MQTT
// app.post('/server', upload.single('file'), async (req, res) => {
//     try {
//         if (!req.file) return res.status(400).json({ success: false, error: 'No file uploaded' });

//         const predictedText = req.body.predicted_text || 'No Data';
//         const relativePath = path.join('saved_images', req.file.filename).replace(/\\/g, '/');

//         const [insertId] = await db('translations').insert({
//             image_path: relativePath,
//             predicted_text: predictedText,
//             created_at: getBangkokTime() // ⏰ บันทึกเวลาไทยลง DB
//         });

//         const payload = {
//             id: insertId,
//             predicted_text: predictedText,
//             image_path: relativePath,
//             created_at: getBangkokTime().toISOString() // ⏰ ส่งเวลาไทยกลับ
//         };

//         mqttClient.publish('hand_sign/translation', predictedText, { qos: 1, retain: true });
//         mqttClient.publish('hand_sign/translation/json', JSON.stringify(payload), { qos: 1, retain: true });

//         res.json({ success: true, payload });
//     } catch (err) {
//         console.error(err);
//         res.status(500).json({ success: false, error: err.message });
//     }
// });

// // GET /server → load all translations
// app.get('/server', async (req, res) => {
//     try {
//         const rows = await db('translations').select('*').orderBy('created_at', 'desc');
//         res.json({ status: 'success', rows });
//     } catch (err) {
//         console.error(err);
//         res.status(500).json({ success: false, error: err.message });
//     }
// });

// // DELETE /server/:id → delete translation + image
// app.delete('/server/:id', async (req, res) => {
//     const { id } = req.params;
//     try {
//         const rows = await db('translations').where({ id }).select('image_path');
//         if (rows.length === 0) return res.status(404).json({ success: false, error: 'Record not found' });

//         const imagePath = path.join(__dirname, rows[0].image_path);
//         if (fs.existsSync(imagePath)) fs.unlinkSync(imagePath);

//         await db('translations').where({ id }).del();
//         res.json({ success: true, message: 'Deleted successfully' });
//     } catch (err) {
//         console.error(err);
//         res.status(500).json({ success: false, error: err.message });
//     }
// });

// app.listen(5000, () => console.log('🚀 Server running on port 5000'));











const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const cors = require('cors');
const knex = require('knex');
const mqtt = require('mqtt');

const app = express();
app.use(cors());
app.use(express.json());
app.use('/saved_images', express.static(path.join(__dirname, 'saved_images')));

// ================= MySQL =================
const db = knex({
    client: 'mysql2',
    connection: {
        host: 'localhost',
        user: 'root',
        password: 'root_password', // <-- แก้ไขรหัสผ่านของคุณตรงนี้
        database: 'sign_lang_db',
        port: 3306,
        timezone: '+07:00'
    },
    pool: {
        afterCreate: (conn, done) => {
            conn.query("SET time_zone = '+07:00';", (err) => {
                done(err, conn);
            });
        }
    }
});

// ================= MQTT =================
const mqttClient = mqtt.connect('mqtt://broker.hivemq.com:1883');

mqttClient.on('connect', () => {
    console.log("✅ MQTT connected");
    mqttClient.subscribe("hand_sign/translation/#", err => {
        if (!err) console.log("📡 Subscribed to hand_sign/translation/#");
    });
});
mqttClient.on('message', (topic, message) => console.log("📩 MQTT received:", topic, message.toString()));
mqttClient.on('error', err => console.error("MQTT error:", err));

// ================= Multer =================
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const folderPath = path.join(__dirname, 'saved_images');
        fs.mkdirSync(folderPath, { recursive: true });
        cb(null, folderPath);
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});
const upload = multer({ storage });

// ================= REST API =================

// POST /server → บันทึกข้อมูลการแปลใหม่
app.post('/server', upload.single('file'), async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ success: false, error: 'No file uploaded' });

        const predictedText = req.body.predicted_text || 'No Data';
        const relativePath = path.join('saved_images', req.file.filename).replace(/\\/g, '/');

        const [insertId] = await db('translations').insert({
            image_path: relativePath,
            predicted_text: predictedText,
            created_at: new Date()
        });

        const payload = {
            id: insertId,
            predicted_text: predictedText,
            image_path: relativePath,
            created_at: new Date().toISOString()
        };

        mqttClient.publish('hand_sign/translation', predictedText, { qos: 1, retain: true });
        mqttClient.publish('hand_sign/translation/json', JSON.stringify(payload), { qos: 1, retain: true });

        res.json({ success: true, payload });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, error: err.message });
    }
});

// GET /server → โหลดข้อมูลการแปลทั้งหมด
app.get('/server', async (req, res) => {
    try {
        const rows = await db('translations').select('*').orderBy('created_at', 'desc');
        res.json({ status: 'success', rows });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, error: err.message });
    }
});

// DELETE /server/:id → ลบ 1 รายการ
app.delete('/server/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const rows = await db('translations').where({ id }).select('image_path');
        if (rows.length === 0) return res.status(404).json({ success: false, error: 'Record not found' });

        const imagePath = path.join(__dirname, rows[0].image_path);
        if (fs.existsSync(imagePath)) fs.unlinkSync(imagePath);

        await db('translations').where({ id }).del();
        res.json({ success: true, message: 'Deleted successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, error: err.message });
    }
});

// POST /server/delete-bulk → ลบหลายรายการตาม IDs
app.post('/server/delete-bulk', async (req, res) => {
    const { ids } = req.body;
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
        return res.status(400).json({ success: false, error: 'IDs are required' });
    }
    try {
        const rows = await db('translations').whereIn('id', ids).select('image_path');
        rows.forEach(row => {
            const imagePath = path.join(__dirname, row.image_path);
            if (fs.existsSync(imagePath)) {
                fs.unlinkSync(imagePath);
            }
        });
        await db('translations').whereIn('id', ids).del();
        res.json({ success: true, message: 'Selected items deleted successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, error: err.message });
    }
});

// DELETE /server/all → ลบประวัติทั้งหมด
app.delete('/server/all', async (req, res) => {
    try {
        const rows = await db('translations').select('image_path');
        rows.forEach(row => {
            const imagePath = path.join(__dirname, row.image_path);
            if (fs.existsSync(imagePath)) {
                fs.unlinkSync(imagePath);
            }
        });
        await db('translations').truncate();
        res.json({ success: true, message: 'All items deleted successfully' });
    } catch (err)
 {
        console.error(err);
        res.status(500).json({ success: false, error: err.message });
    }
});

app.listen(5000, () => console.log('🚀 Server running on port 5000'));