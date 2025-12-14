<template>
  <div id="app">
    <header class="navbar">
      <div class="navbar-container">
        <a href="#" class="navbar-brand">
          <span class="brand-icon">🤖</span>
          <span class="brand-text">ระบบวิเคราะห์ภาษามือด้วยเทคโนโลยี AIoT</span>
        </a>
        
        <button @click="toggleTheme" class="theme-toggle-btn">
          <span class="icon">{{ theme === 'light' ? '🌙' : '☀️' }}</span>
        </button>
        <button @click="openLink" class="btn btn-gestures">
  <span class="icon">🌐</span> ติดต่อเรา
</button>

      </div>
    </header>

    <main class="container">
      <section class="main-card">
        <div class="main-card-header">
          <h1 class="main-title">ระบบวิเคราะห์ภาษามือด้วยเทคโนโลยี AIoT</h1>
          <p class="main-subtitle">เพียงเปิดกล้อง แล้วเริ่มแปลได้ทันที</p>
        </div>
        <div class="video-wrapper">
          <div class="video-container">
            <video ref="video" autoplay playsinline :class="{'active-camera': cameraOn}"></video>
            <div v-if="!cameraOn" class="camera-placeholder">
              <span class="icon">📸</span>
              <p>กรุณาเปิดกล้องเพื่อเริ่มใช้งาน</p>
            </div>
          </div>
        </div>
        <div class="controls">
          <button @click="toggleTranslate" :class="['btn', 'btn-translate', isTranslating ? 'stop' : 'start']">
            <span class="icon">{{ isTranslating ? '⏸️' : '▶️' }}</span>
            {{ isTranslating ? 'หยุดแปล' : 'เริ่มแปล' }}
          </button>
          <button @click="toggleCamera" :class="['btn', 'btn-camera', cameraOn ? 'off' : 'on']">
              <span class="icon">{{ cameraOn ? '🛑' : '📽️' }}</span>
            {{ cameraOn ? 'ปิดกล้อง' : 'เปิดกล้อง' }}
          </button>

          
        </div>
        <div class="status-area">
          <div v-if="loading" class="status-box loading-box animated-fade-in">
            <div class="spinner"></div>
            <span>กำลังประมวลผล...</span>
          </div>
          <div v-if="prediction && !loading" class="status-box result-box animated-fade-in">
            <p class="result-label">ผลลัพธ์:</p>
            <p class="result-text">{{ prediction }}</p>

            <!-- เพิ่มแสดงภาษาไทย/แปลคู่ (สไตล์อ่านง่าย) -->
            <p v-if="thaiText" class="result-thai">({{ thaiText }})</p>
          </div>
          <div v-if="errorMsg" class="status-box error-box animated-fade-in">
            <p class="error-msg">⚠️ {{ errorMsg }}</p>
          </div>
        </div>
      </section>

      <section class="history-card">
        <div class="main-card-header">
          <h2 class="section-title"><span class="icon">📜</span> ประวัติการแปลล่าสุด</h2>
        </div>
        
        <div class="history-controls" v-if="translations.length > 0">
          <div class="select-all-container">
            <input type="checkbox" id="select-all" :checked="isAllSelected" @change="toggleSelectAll">
            <label for="select-all">เลือกทั้งหมด</label>
          </div>
          <!-- <button class="btn-delete-all" @click="openDeleteModal('all')">ลบทั้งหมด</button> -->
        </div>

        <div class="history-list-wrapper">
          <ul class="history-list" v-if="translations.length > 0">
            <li v-for="(item, index) in translations" :key="item.id" class="history-item animated-fade-in" :class="{ 'selected': selectedItems.includes(item.id) }">
              <input type="checkbox" class="history-item-checkbox" :value="item.id" v-model="selectedItems" @click.stop>
              <div class="history-item-content" @click="showImageModal(item)">
                <div class="item-index">{{ translations.length - index }}</div>
                <img :src="getImageUrl(item.image_path)" alt="translation" class="history-thumb" />
                <div class="history-details">
                  <p class="history-text">{{ item.predicted_text }}</p>
                  <p class="history-time">{{ formatDate(item.created_at) }}</p>
                </div>
              </div>
              <button @click.stop="openDeleteModal('single', item.id)" class="btn-delete" title="ลบรายการนี้">
                🗑️
              </button>
            </li>
          </ul>
          <div v-else class="no-data">
            <p>ยังไม่มีประวัติการแปล</p>
          </div>
        </div>
        
        <transition name="fade">
          <div v-if="selectedItems.length > 0" class="bulk-actions-bar">
            <span>{{ selectedItems.length }} รายการที่เลือก</span>
            <button class="btn-action btn-confirm" @click="openDeleteModal('selected')">ลบที่เลือก</button>
          </div>
        </transition>

      </section>
    </main>
    
    <div v-if="isModalVisible" class="modal-overlay" @click.self="closeImageModal">
      <div class="modal-content animated-fade-in">
        <button class="modal-close-btn" @click="closeImageModal">✖</button>
        <img :src="selectedImageUrl" alt="Selected translation" class="modal-image"/>
        <div class="modal-actions">
           <button class="btn btn-download" @click="downloadImage">
             <span class="icon">📥</span> ดาวน์โหลด (.jpg)
           </button>
         </div>
      </div>
    </div>

    <div v-if="showDeleteConfirmModal" class="modal-overlay" @click.self="closeDeleteConfirmModal">
      <div class="modal-content confirm-modal-content animated-fade-in">
        <h2>ยืนยันการลบ</h2>
        <p>{{ deleteConfirmMessage }}</p>
        <div class="confirm-actions">
          <button class="btn-action btn-cancel" @click="closeDeleteConfirmModal">ยกเลิก</button>
          <button class="btn-action btn-confirm" @click="confirmDeletion">ยืนยัน</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import axios from "axios";
import mqtt from "mqtt/dist/mqtt";

export default {
  name: "App",
  data() {
    return {
      loading: false,
      prediction: "",
      thaiText: "",            // <-- ใหม่: เก็บคำแปล
      errorMsg: "",
      intervalId: null,
      isTranslating: false,
      cameraOn: false,
      stream: null,
      translations: [],
      saving: false,
      mqttClient: null,
      isModalVisible: false,
      selectedImageUrl: '',
      theme: 'light',
      showDeleteConfirmModal: false,
      itemToDeleteId: null,
      deleteMode: null,
      selectedItems: [], 
    };
  },
  computed: {
    isAllSelected() {
      return this.translations.length > 0 && this.selectedItems.length === this.translations.length;
    },
    deleteConfirmMessage() {
      if (this.deleteMode === 'single') {
        return 'คุณแน่ใจหรือไม่ว่าต้องการลบรายการนี้?';
      }
      if (this.deleteMode === 'selected') {
        return `คุณแน่ใจหรือไม่ว่าต้องการลบ ${this.selectedItems.length} รายการที่เลือก?`;
      }
      if (this.deleteMode === 'all') {
        return 'คุณแน่ใจหรือไม่ว่าต้องการลบประวัติทั้งหมด? การกระทำนี้ไม่สามารถย้อนกลับได้';
      }
      return '';
    }
  },
  watch: {
    theme(newTheme) {
      document.body.className = newTheme === 'dark' ? 'theme-dark' : '';
    }
  },
  mounted() {
    this.startCamera();
    this.loadTranslations();
    this.connectMQTT();
    const savedTheme = localStorage.getItem('app-theme');
    if (savedTheme) {
      this.theme = savedTheme;
    } else {
      const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
      this.theme = prefersDark ? 'dark' : 'light';
    }
  },
  beforeDestroy() {
    this.stopTranslation();
    this.stopCamera();
    if (this.mqttClient) this.mqttClient.end();
  },
  methods: {
    toggleTheme() {
      this.theme = this.theme === 'light' ? 'dark' : 'light';
      localStorage.setItem('app-theme', this.theme);
    },
    connectMQTT() {
      this.mqttClient = mqtt.connect("wss://broker.hivemq.com:8884/mqtt");
      this.mqttClient.on("connect", () => console.log("✅ MQTT connected (Vue)"));
      this.mqttClient.on("error", (err) => console.error("❌ MQTT error:", err));
      this.mqttClient.subscribe("hand_sign/translation", (err) => {
        if (!err) console.log("📡 Subscribed to hand_sign/translation");
      });
      this.mqttClient.on("message", async (topic, message) => {
        if (topic === "hand_sign/translation") {
          // ข้อความที่มาจาก MQTT เป็นภาษาอังกฤษตามที่ต้องการ
          const text = message.toString();
          this.prediction = text;
          this.thaiText = "";
          // แปลเป็นไทยเพื่อโชว์ (ไม่ส่งกลับไปที่อุปกรณ์)
          const translated = await this.translateAuto(text);
          if (translated) this.thaiText = translated;
          // พูดอังกฤษก่อน แล้วตามด้วยไทย (ถ้ามี)
          this.speakLang(text, 'en', () => {
            if (translated) this.speakLang(translated, 'th');
          });
        }
      });
    },
    
    async startCamera() {
      try {
        this.stream = await navigator.mediaDevices.getUserMedia({ video: true });
        this.$refs.video.srcObject = this.stream;
        this.cameraOn = true;
      } catch (err) {
        this.errorMsg = "ไม่สามารถเข้าถึงกล้องได้ กรุณาอนุญาตการเข้าถึงกล้อง";
        this.cameraOn = false;
      }
    },
    stopCamera() {
      if (this.stream) {
        this.stream.getTracks().forEach(track => track.stop());
        this.stream = null;
      }
      if (this.$refs.video) this.$refs.video.srcObject = null;
      this.cameraOn = false;
    },
    toggleCamera() {
      if (this.cameraOn) {
        this.stopCamera();
        this.stopTranslation();
      } else {
        this.startCamera();
      }
    },
    toggleTranslate() {
      if (this.isTranslating) {
        this.stopTranslation();
      } else {
        if (!this.cameraOn) {
          this.errorMsg = "กรุณาเปิดกล้องก่อนเริ่มแปล";
          setTimeout(() => this.errorMsg = "", 3000);
          return;
        }
        this.startTranslation();
      }
    },
    startTranslation() {
      if (this.intervalId) return;
      this.isTranslating = true;
      this.prediction = "";
      this.thaiText = "";
      this.errorMsg = "";
      this.intervalId = setInterval(this.sendFrame, 4000);
      this.sendFrame();
    },
    stopTranslation() {
      if (this.intervalId) {
        clearInterval(this.intervalId);
        this.intervalId = null;
      }
      this.isTranslating = false;
      this.loading = false;
    },
    async sendFrame() {
      if (this.loading || this.saving) return;
      this.loading = true;
      this.errorMsg = "";
      const video = this.$refs.video;
      if (!video || video.readyState !== 4) {
        this.loading = false;
        return;
      }
      const canvas = document.createElement("canvas");
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      canvas.getContext("2d").drawImage(video, 0, 0, canvas.width, canvas.height);
      canvas.toBlob(async (blob) => {
        if (!blob) { this.loading = false; return; }
        try {
          const formData = new FormData();
          formData.append("file", blob, "frame.jpg");

          // ---------- เรียก Flask (predict) เหมือนเดิม (รับข้อความเป็นภาษาอังกฤษ/หรือภาษาอื่น) ----------
          const response = await axios.post("http://localhost:5001/predict", formData);
          const english = response.data.prediction || "ไม่พบผลลัพธ์";

          // เก็บผลภาษาแรกไว้
          this.prediction = english;
          this.thaiText = "";

          // แปลแบบอัตโนมัติ (ถ้าเป็นอังกฤษ -> ไทย, ถ้าเป็นไทย -> อังกฤษ)
          const translated = await this.translateAuto(english);
          if (translated) this.thaiText = translated;

          // พูด: จะพูดอังกฤษก่อน (ถ้าเป็นอังกฤษ) แล้วพูดอีกภาษาหนึ่งตาม (ถ้ามี)
          // ถ้ข้อความต้นเป็นไทย (โมเดลส่งไทย) จะพูดไทยก่อนแล้วตามด้วยอังกฤษ
          // speakLang รับ callback เมื่อจบเสียงเพื่อเล่นเสียงต่อ
          if (this.isThaiText(english)) {
            // ต้นทางเป็นไทย: พูดไทยก่อน แล้วตามด้วยอังกฤษ (ถ้ามี)
            this.speakLang(english, 'th', async () => {
              if (translated) this.speakLang(translated, 'en');
            });
          } else {
            // ต้นทางเป็นอังกฤษ (ปกติ): พูดอังกฤษก่อน แล้วตามด้วยไทย (ถ้ามี)
            this.speakLang(english, 'en', async () => {
              if (translated) this.speakLang(translated, 'th');
            });
          }

          // ---------- ส่ง MQTT เฉพาะข้อความภาษาอังกฤษ (เหมือนเดิม) ----------
          // **Important**: ส่งเฉพาะตัวข้อความต้นทาง (english) — ตามโค้ดของพี่เดิม
          if (english && english !== "ไม่พบผลลัพธ์") {
            if (this.mqttClient && this.mqttClient.connected) {
              this.mqttClient.publish("hand_sign/translation", english);
            }
            // บันทึกลง server (บันทึกเฉพาะ english ตาม server.js ของคุณ)
            await this.saveTranslation(blob, english);
            await this.loadTranslations();
          }
        } catch (error) {
          console.error("เกิดข้อผิดพลาดในการแปล:", error);
          this.errorMsg = "เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์แปลภาษา";
        }
        this.loading = false;
      }, "image/jpeg");
    },
    async saveTranslation(imageBlob, predictedText) {
      if (this.saving) return;
      this.saving = true;
      const formData = new FormData();
      formData.append("file", imageBlob);
      formData.append("predicted_text", predictedText);
      try {
        await axios.post("http://localhost:5000/server", formData);
      } catch (error) {
        console.error("เกิดข้อผิดพลาดขณะบันทึก:", error);
      }
      this.saving = false;
    },

    // ---------- ฟังก์ชันแปล (auto) ----------
    // ถ้าข้อความมีตัวอักษรไทย จะเป้าหมายแปลเป็น en, ถ้าไม่มีจะเป้าหมายเป็น th
    async translateAuto(text) {
      if (!text || text === "" || text === "ไม่พบผลลัพธ์") return "";
      const target = this.isThaiText(text) ? 'en' : 'th';
      try {
        // ใช้ Google translate public endpoint (no-key). ถ้าอยากเปลี่ยนเป็นบริการอื่นบอกได้
        const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${target}&dt=t&q=${encodeURIComponent(text)}`;
        const res = await axios.get(url);
        // response shape: res.data[0][0][0]
        return (res.data && res.data[0] && res.data[0][0]) ? res.data[0][0][0] : "";
      } catch (err) {
        console.warn("ไม่สามารถแปลได้:", err);
        return "";
      }
    },

    // ตรวจว่าข้อความมีตัวอักษรภาษาไทยหรือไม่
    isThaiText(text) {
      return /[\u0E00-\u0E7F]/.test(text);
    },

    // ---------- ฟังก์ชันพูด (รองรับ en / th) ----------
    // speakLang(text, lang, onEndCallback)
    speakLang(text, lang, onEnd) {
      if (!window.speechSynthesis || !text) {
        if (typeof onEnd === 'function') onEnd();
        return;
      }
      try {
        window.speechSynthesis.cancel();
      } catch (e) {}
      const utter = new SpeechSynthesisUtterance(text);
      // map lang code
      utter.lang = (lang === 'th') ? 'th-TH' : ((lang === 'en') ? 'en-US' : lang);
      utter.rate = 1;
      utter.pitch = 1;
      utter.volume = 1;
      utter.onend = () => {
        if (typeof onEnd === 'function') onEnd();
      };
      window.speechSynthesis.speak(utter);
    },

    // เก่า: ฟังก์ชันพูดเดิม (เก็บไว้ for backward compat)
    speakText(text) {
      // ถ้าอยากเรียกแบบเดิม ให้พูดเป็นภาษาอังกฤษโดย default
      this.speakLang(text, 'en');
    },

    async loadTranslations() {
      try {
        const res = await axios.get("http://localhost:5000/server");
        this.translations = res.data.rows;
      } catch (err) { console.error("โหลดข้อมูลล้มเหลว", err); }
    },
    toggleSelectAll() {
      if (this.isAllSelected) {
        this.selectedItems = [];
      } else {
        this.selectedItems = this.translations.map(item => item.id);
      }
    },
    openDeleteModal(mode, id = null) {
      this.deleteMode = mode;
      if (mode === 'single') {
        this.itemToDeleteId = id;
      }
      this.showDeleteConfirmModal = true;
    },
    closeDeleteConfirmModal() {
      this.showDeleteConfirmModal = false;
      this.itemToDeleteId = null;
      this.deleteMode = null;
    },
    async confirmDeletion() {
      try {
        switch (this.deleteMode) {
          case 'single':
            await axios.delete(`http://localhost:5000/server/${this.itemToDeleteId}`);
            this.translations = this.translations.filter(item => item.id !== this.itemToDeleteId);
            break;
          case 'selected':
            if (this.selectedItems.length === 0) return;
            await axios.post('http://localhost:5000/server/delete-bulk', { ids: this.selectedItems });
            this.translations = this.translations.filter(item => !this.selectedItems.includes(item.id));
            this.selectedItems = [];
            break;
          case 'all':
            await axios.delete('http://localhost:5000/server/all');
            this.translations = [];
            this.selectedItems = [];
            break;
        }
      } catch (error) {
        console.error("เกิดข้อผิดพลาดในการลบ:", error);
        alert("การลบข้อมูลล้มเหลว");
      } finally {
        this.closeDeleteConfirmModal();
      }
    },
    formatDate(dateStr) {
      return new Date(dateStr).toLocaleString("th-TH", {
        dateStyle: 'medium', timeStyle: 'short'
      });
    },
    getImageUrl(path) {
      return `http://localhost:5000/${path}`;
    },
    showImageModal(item) {
      this.selectedImageUrl = this.getImageUrl(item.image_path);
      this.isModalVisible = true;
    },
    closeImageModal() {
      this.isModalVisible = false;
      this.selectedImageUrl = '';
    },
    async downloadImage() {
      try {
        const response = await fetch(this.selectedImageUrl);
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `translation-${Date.now()}.jpg`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      } catch (error) {
        console.error("Download failed:", error);
        alert("ไม่สามารถดาวน์โหลดรูปภาพได้");
      }
    },
    // ----------------- เพิ่มฟังก์ชันเปิดลิงก์ภายนอก -----------------
    openLink() {
      window.open('https://www.facebook.com/profile.php?id=100057485296390', '_blank');
      
    }
  }
};
</script>



<style>
:root {
  
  --primary-color: #2200ff; --primary-light: #00ff0d; --secondary-color: #00ff84;
  --danger-color: #ffffff;
  --text-dark: #3300ff; --text-light: #6b7280; --text-brand: var(--primary-color);
  --bg-color: #5879ff; --card-bg: rgba(255, 255, 255, 0.75); --border-color: rgba(122, 122, 122, 0.6);
  --radius-lg: 24px; --radius-md: 16px;
  --shadow-lg: 0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1);
  --shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);
  --transition-speed: 0.3s;
}
body.theme-dark {
  --primary-color: #00d5ff; --primary-light: #2bff00;
  --text-dark: #e5e7eb; --text-light: #9ca3af; --text-brand: var(--primary-color);
  --bg-color: #111827; --card-bg: rgba(31, 41, 55, 0.75); --border-color: rgba(255, 255, 255, 0.2);
  --shadow-lg: 0 20px 25px -5px rgb(0 0 0 / 0.4), 0 8px 10px -6px rgb(0 0 0 / 0.4);
}
@import url('https://fonts.googleapis.com/css2?family=Sarabun:wght@400;500;600;700&display=swap');
html, body { height: 100%; margin: 0; overflow-x: hidden; }
body {
  font-family: var(--font-family);
  background-color: var(--bg-color);
  background-image:
    radial-gradient(circle at 100% 0%, hsla(232, 84%, 95%, 1) 0px, transparent 50%),
    radial-gradient(circle at 0% 100%, hsla(282, 84%, 95%, 1) 0px, transparent 50%);
  color: var(--text-dark);
  transition: background-color var(--transition-speed) ease, color var(--transition-speed) ease;
}
body.theme-dark {
  background-image:
    radial-gradient(circle at 100% 0%, hsla(232, 40%, 20%, 1) 0px, transparent 50%),
    radial-gradient(circle at 0% 100%, hsla(282, 40%, 20%, 1) 0px, transparent 50%);
}
#app {
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  display: flex; flex-direction: column; min-height: 100vh;
}
.navbar {
  background: var(--card-bg); backdrop-filter: blur(10px);
  padding: 1rem 2rem; position: sticky; top: 0; z-index: 1000;
  border-bottom: 1px solid var(--border-color);
  flex-shrink: 0;
  transition: background-color var(--transition-speed) ease;
}
.navbar-container { max-width: 1400px; margin: auto; display: flex; justify-content: space-between; align-items: center; }
.navbar-brand { font-size: 1.5rem; font-weight: 700; color: var(--text-brand); text-decoration: none; display: flex; align-items: center; gap: 0.75rem; }
.brand-icon { font-size: 1.8rem; }
.theme-toggle-btn {
  background: var(--border-color); color: var(--text-dark); border: none;
  width: 44px; height: 44px; border-radius: 50%; cursor: pointer;
  display: flex; justify-content: center; align-items: center;
  font-size: 1.5rem; transition: all var(--transition-speed) ease;
}
.theme-toggle-btn:hover { transform: rotate(15deg) scale(1.1); }
.container {
  width: 100%; max-width: 1400px; margin: 0 auto; padding: 1.5rem;
  box-sizing: border-box; flex-grow: 1; display: grid;
  grid-template-columns: 1fr; align-items: start; gap: 1.5rem;
}
@media (min-width: 1024px) {
  .container { grid-template-columns: minmax(0, 2fr) minmax(0, 1fr); }
}
.main-card, .history-card {
  background: var(--card-bg); backdrop-filter: blur(20px);
  border-radius: var(--radius-lg); box-shadow: var(--shadow-lg);
  border: 1px solid var(--border-color); padding: 2rem;
  transition: background-color var(--transition-speed) ease, border-color var(--transition-speed) ease;
}
.main-card-header { text-align: center; margin-bottom: 1.5rem; }
.main-title, .section-title { font-size: 2rem; font-weight: 700; color: var(--text-dark); margin: 0 0 0.5rem 0; }
.main-subtitle { font-size: 1.1rem; color: var(--text-light); margin: 0; }
.section-title { font-size: 1.5rem; display: flex; align-items: center; justify-content: center; gap: 0.75rem; }
.video-wrapper { padding: 0.5rem; background: #fff; border-radius: var(--radius-md); box-shadow: inset 0 2px 8px rgba(0,0,0,0.1); }
body.theme-dark .video-wrapper { background: #000; }
.video-container { position: relative; width: 100%; aspect-ratio: 16 / 9; border-radius: calc(var(--radius-md) - 4px); overflow: hidden; background-color: #111; }
video { width: 100%; height: 100%; object-fit: cover; display: none; transform: scaleX(-1); }
video.active-camera { display: block; }
.camera-placeholder { position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); color: #9ca3af; text-align: center; }
.camera-placeholder .icon { font-size: 4rem; }
.controls { display: flex; justify-content: center; flex-wrap: wrap; gap: 1rem; margin: 1.5rem 0; }
.btn { padding: 0.8rem 2rem; font-size: 1rem; font-weight: 700; font-family: var(--font-family); border-radius: 50px; color: white; border: none; cursor: pointer; display: flex; align-items: center; gap: 0.75rem; transition: all var(--transition-speed) ease; box-shadow: var(--shadow-md); }
.btn:hover { transform: translateY(-3px); box-shadow: var(--shadow-lg); }
.btn:active { transform: translateY(-1px); }
.btn-translate.start { background: linear-gradient(45deg, var(--primary-color), var(--primary-light)); }
.btn-translate.stop { background: linear-gradient(45deg, #ef4444, #ff2dce); }
.btn-camera.on { background: linear-gradient(45deg, #10b981, #0fa7ff); }
.btn-camera.off { background: linear-gradient(45deg, #ff2326, #ff1ad1); }
.status-area { min-height: 80px; display: flex; justify-content: center; align-items: center; }
.status-box { width: 100%; max-width: 480px; margin-top: 1rem; padding: 1rem 1.5rem; border-radius: var(--radius-md); font-weight: 600; text-align: center; border: 1px solid var(--border-color); background: rgba(255, 255, 255, 0.5); box-shadow: var(--shadow-md); }
body.theme-dark .status-box { background: rgba(0,0,0,0.2); }
.loading-box { display: flex; justify-content: center; align-items: center; gap: 1rem; color: var(--text-light); }
.spinner { border: 4px solid rgba(13, 255, 0, 0.1); width: 24px; height: 24px; border-radius: 50%; border-left-color: var(--primary-color); animation: spin 1s linear infinite; }
.result-box { border-left: 6px solid var(--primary-color); }
.result-label { margin: 0; font-size: 0.9rem; color: var(--text-light); font-weight: 500; }
.result-text {
  font-size: 2.75rem;
  font-weight: 700;
  margin: 0.25rem 0 0 0;

  background: linear-gradient(90deg, #f352ff, #ff00bb, #00c3ff, #ff00b3);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;

  /* สำหรับ Firefox */
  background-clip: text;
  color: transparent;
}


.error-box { background: rgb(255, 50, 50); border-left: 6px solid var(--danger-color); color: var(--danger-color); }
.history-card { display: flex; flex-direction: column; max-height: calc(100vh - 4rem - 32px); }
.history-list-wrapper { flex-grow: 1; overflow-y: auto; padding-right: 0.5rem; }
.history-list { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 1rem; }
.history-item {
  display: flex; align-items: center; gap: 1rem;
  background: white; padding: 0.75rem; border-radius: var(--radius-md); 
  border: 1px solid var(--border-color); transition: all 0.2s ease; 
  padding-left: 1rem;
}
.history-item-content {
  display: flex; align-items: center; gap: 1rem;
  flex-grow: 1; cursor: pointer; border-radius: 8px;
}
.history-item:hover { transform: scale(1.02); box-shadow: var(--shadow-md); border-color: var(--primary-color); }
.history-item-content:hover .history-text { color: var(--primary-color); }
.btn-delete {
  background: transparent; border: none; cursor: pointer; font-size: 1.2rem;
  padding: 0.5rem; border-radius: 50%; width: 40px; height: 40px;
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0; transition: background-color 0.2s, transform 0.2s;
}
.btn-delete:hover { background-color: rgba(255, 0, 0, 0.1); color: #ef4444; transform: scale(1.1); }
body.theme-dark .history-item { background: rgba(55, 65, 81, 0.5); }

/* ✨ FIXED: นำ CSS สำหรับลำดับภาพกลับมา */
.item-index { 
  background-color: #f3f4f6; color: var(--text-light); font-weight: 700; 
  border-radius: 50%; width: 32px; height: 32px; 
  display: flex; align-items: center; justify-content: center; flex-shrink: 0; 
}
body.theme-dark .item-index { background-color: #374151; color: var(--text-dark); }

.history-thumb { width: 80px; height: 50px; border-radius: 8px; object-fit: cover; border: 1px solid #eee; }
body.theme-dark .history-thumb { border-color: #4b5563; }
.history-details { flex-grow: 1; }
.history-text { font-size: 1.1rem; font-weight: 600; color: var(--text-dark); margin: 0; transition: color 0.2s; }
.history-time { font-size: 0.8rem; color: var(--text-light); margin: 4px 0 0 0; }
.no-data { text-align: center; padding: 2rem; color: var(--text-light); }
.modal-overlay { 
  position: fixed; top: 0; left: 0; width: 100%; height: 100%; 
  background: rgba(0, 0, 0, 0.7); display: flex; align-items: center; 
  justify-content: center; z-index: 2000; backdrop-filter: blur(8px); 
}
.modal-content { 
  background: var(--card-bg); padding: 1.5rem; border-radius: var(--radius-lg); 
  box-shadow: var(--shadow-lg); max-width: 90vw;
  display: flex; flex-direction: column; position: relative;
  border: 1px solid var(--border-color);
}
.modal-image { max-width: 100%; max-height: calc(90vh - 120px); object-fit: contain; border-radius: var(--radius-md); }
.modal-close-btn { position: absolute; top: 1rem; right: 1rem; background: rgba(0,0,0,0.5); color: white; border: none; border-radius: 50%; width: 32px; height: 32px; font-size: 1rem; cursor: pointer; display: flex; align-items: center; justify-content: center; }
.modal-actions { margin-top: 1rem; text-align: center; }
/* ✨ FIXED: นำ CSS สำหรับปุ่มดาวน์โหลดกลับมา */
.btn-download { background: linear-gradient(45deg, var(--secondary-color), var(--primary-color)); }
@keyframes spin { to { transform: rotate(360deg);} }
.animated-fade-in { animation: fadeIn 0.5s ease-out forwards; }
@keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
.history-controls {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 0.5rem 1rem 0.5rem;
  border-bottom: 1px solid var(--border-color);
  margin-bottom: 1rem;
}
.select-all-container {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}
.select-all-container label {
  color: var(--text-light);
  font-weight: 500;
  cursor: pointer;
}
input[type="checkbox"] {
  width: 18px;
  height: 18px;
  cursor: pointer;
}
.btn-delete-all {
  background: none;
  border: none;
  color: #ef4444;
  font-family: var(--font-family);
  font-weight: 600;
  cursor: pointer;
  padding: 0.5rem;
  border-radius: var(--radius-md);
  transition: background-color 0.2s;
}
.btn-delete-all:hover {
  background-color: rgba(239, 68, 68, 0.1);
}
.history-item.selected {
  background-color: rgba(0, 187, 255, 0.1);
  border-color: var(--primary-color);
}
.history-item-checkbox {
  flex-shrink: 0;
}
.bulk-actions-bar {
  position: sticky;
  bottom: 0;
  left: 0;
  right: 0;
  background: var(--card-bg);
  backdrop-filter: blur(10px);
  padding: 1rem;
  margin: 1rem -2rem -2rem -2rem;
  border-top: 1px solid var(--border-color);
  border-bottom-left-radius: var(--radius-lg);
  border-bottom-right-radius: var(--radius-lg);
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-shadow: 0 -5px 15px rgba(0,0,0,0.1);
}
body.theme-dark .bulk-actions-bar {
  box-shadow: 0 -5px 15px rgba(0,0,0,0.3);
}
.bulk-actions-bar span {
  color: var(--text-dark);
  font-weight: 600;
}
.fade-enter-active, .fade-leave-active {
  transition: opacity 0.3s ease, transform 0.3s ease;
}
.fade-enter-from, .fade-leave-to {
  opacity: 0;
  transform: translateY(20px);
}
.confirm-modal-content {
  max-width: 400px;
  align-items: center;
  text-align: center;
  gap: 1rem;
}
.confirm-modal-content h2 {
  color: var(--text-dark);
  margin: 0;
}
.confirm-modal-content p {
  color: var(--text-light);
  margin: 0;
  line-height: 1.6;
  max-width: 350px;
}
.confirm-actions {
  display: flex;
  gap: 1rem;
  width: 100%;
  margin-top: 1rem;
}
.btn-action {
  flex: 1;
  padding: 0.75rem 1rem;
  font-size: 1rem;
  font-weight: 600;
  font-family: var(--font-family);
  border-radius: var(--radius-md);
  border: none;
  cursor: pointer;
  transition: all 0.2s ease;
}
.btn-cancel {
  background-color: transparent;
  color: var(--text-light);
  border: 1px solid var(--border-color);
}
.btn-cancel:hover {
  background-color: var(--border-color);
  color: var(--text-dark);
}
.btn-confirm {
  background-color: #ef4444;
  color: white;
}
.btn-confirm:hover {
  transform: scale(1.05);
}
.btn-gestures {
  background: linear-gradient(45deg, #b91081, #0fa7ff);
  color: white;
}
.btn-gestures:hover {
  transform: translateY(-3px) scale(1.05);
  box-shadow: 0 10px 15px rgba(0,0,0,0.2);
}
/* ===== Google Fonts Kanit + Mitr ===== */
@import url('https://fonts.googleapis.com/css2?family=Kanit:ital,wght@0,100;0,200;0,300;0,400;0,500;0,600;0,700;0,800;0,900;1,100;1,200;1,300;1,400;1,500;1,600;1,700;1,800;1,900&family=Mitr:wght@200;300;400;500;600;700&display=swap');

/* ===== Default Web Font ===== */
body, button, input, select, textarea {
  font-family: "Kanit", "Mitr", sans-serif;
}
.result-thai {
  font-size: 3rem;   /* ✅ ตัวใหญ่ขึ้น */
  font-weight: bold;   /* ✅ หนาขึ้น */
  color: #2b00ff;      /* ✅ สีส้มให้อ่านง่าย */
  margin-top: 8px;
  text-shadow: 1px 1px 3px rgba(95, 95, 95, 0.3);
}
</style>