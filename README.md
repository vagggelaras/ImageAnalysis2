# AnalyshEikonas - Image Analysis & Tile Matching System

Σύστημα ανάλυσης εικόνων και matching κομματιών (tiles) με χρήση color histograms και texture features.

## 📋 Περιεχόμενα

- [Περιγραφή](#περιγραφή)
- [Προαπαιτούμενα](#προαπαιτούμενα)
- [Εγκατάσταση](#εγκατάσταση)
- [Εκτέλεση](#εκτέλεση)
- [Χρήση](#χρήση)
- [Δομή Project](#δομή-project)

---

## 📖 Περιγραφή

Αυτό το project περιλαμβάνει:
- **Frontend (React)**: Web εφαρμογή για ανέβασμα εικόνας, shuffle σε tiles, και ανάλυση
- **Backend (Python FastAPI)**: API server για επεξεργασία εικόνων και υπολογισμό features

**Δυνατότητες:**
- Upload εικόνων με drag & drop
- Κοπή εικόνας σε grid (2x2 έως 20x20)
- Shuffle tiles με τυχαία περιστροφή (0°, 90°, 180°, 270°)
- Εξαγωγή border strips από κάθε tile (configurable width)
- **Color histogram analysis** (RGB channels - 256 bins)
  - Histogram για ολόκληρο κάθε tile
  - Histogram για κάθε border (top, right, bottom, left)
- Interactive visualization των histograms
- Real-time αναπαράσταση των αποτελεσμάτων

---

## 🔧 Προαπαιτούμενα

Πρέπει να εγκαταστήσεις τα παρακάτω στον υπολογιστή σου:

### 1. **Python 3.11+** (3.13 supported)

#### Windows:
1. Πήγαινε στο [python.org/downloads](https://www.python.org/downloads/)
2. Κατέβασε Python 3.11, 3.12 ή 3.13
3. **ΣΗΜΑΝΤΙΚΟ**: Κατά την εγκατάσταση, τσέκαρε το "Add Python to PATH"
4. Εγκατάσταση
5. Έλεγχος:
   ```bash
   python --version
   ```

#### Mac/Linux:
```bash
# Mac (με Homebrew)
brew install python3

# Linux (Ubuntu/Debian)
sudo apt update
sudo apt install python3 python3-pip

# Έλεγχος
python3 --version
```

### 2. **Node.js 16+** (για React)

#### Windows:
1. Πήγαινε στο [nodejs.org](https://nodejs.org/)
2. Κατέβασε το "LTS" version
3. Εγκατάσταση (κάνε "Next" σε όλα)
4. Έλεγχος:
   ```bash
   node --version
   npm --version
   ```

#### Mac/Linux:
```bash
# Mac (με Homebrew)
brew install node

# Linux (Ubuntu/Debian)
curl -fsSL https://deb.nodesource.com/setup_lts.x | sudo -E bash -
sudo apt install -y nodejs

# Έλεγχος
node --version
npm --version
```

---

## 📥 Εγκατάσταση

### Βήμα 1: Clone το Repository

```bash
git clone https://github.com/vagggelaras/AnalyshEikonas.git
cd AnalyshEikonas
```

### Βήμα 2: Backend Setup (Python)

```bash
# Μετάβαση στο backend folder
cd backend

# (Προαιρετικό αλλά συνιστάται) Δημιουργία virtual environment
python -m venv venv

# Ενεργοποίηση virtual environment
# Windows:
venv\Scripts\activate
# Mac/Linux:
source venv/bin/activate

# Εγκατάσταση dependencies
pip install -r requirements.txt

# Επιστροφή στο root folder
cd ..
```

### Βήμα 3: Frontend Setup (React)

```bash
# Μετάβαση στο frontend folder
cd frontend

# Εγκατάσταση dependencies
npm install

# Επιστροφή στο root folder
cd ..
```

---

## 🚀 Εκτέλεση

Χρειάζεται να τρέξεις **2 terminals ταυτόχρονα** (ένα για backend, ένα για frontend).

### Terminal 1: Backend (Python)

```bash
cd backend

# Αν χρησιμοποιείς virtual environment, ενεργοποίησέ το πρώτα
# Windows:
venv\Scripts\activate
# Mac/Linux:
source venv/bin/activate

# Εκτέλεση backend server
python main.py
```

Το backend θα τρέχει στο: **http://localhost:8000**

Μπορείς να δεις το API documentation στο: **http://localhost:8000/docs**

### Terminal 2: Frontend (React)

```bash
cd frontend

# Εκτέλεση frontend dev server
npm run dev
```

Το frontend θα τρέχει στο: **http://localhost:5173**

**Άνοιξε το browser και πήγαινε στο: http://localhost:5173**

---

## 🎮 Χρήση

1. **Upload Image**: Ανέβασε μια εικόνα (θα γίνει αυτόματα resize σε 200x200 pixels)

2. **Global Settings**: Όρισε:
   - `Histogram Bins` (default: 256)
   - `Border Width` (default: 5 pixels)

3. **Shuffle Image**:
   - Όρισε το grid size (π.χ. 3x3, 4x4)
   - Πάτα "Shuffle Image"
   - Τα tiles θα κοπούν και θα ανακατευτούν με τυχαία περιστροφή

4. **Ανάλυση**:
   - **Tile Histograms**: Color histogram για κάθε tile
   - **Border Histograms**: Color histogram για κάθε border (top, bottom, left, right)
   - **Texture Features**: GLCM, LBP, Edge, Statistical features
   - **Border Texture Features**: Texture analysis για borders
   - **Tile Distances**: Υπολογισμός ομοιότητας μεταξύ όλων των tiles

5. **Αποτελέσματα**:
   - Όλα τα αποτελέσματα εμφανίζονται στο UI
   - Αναλυτικά δεδομένα στο browser console (F12)

---

## 📁 Δομή Project

```
AnalyshEikonas/
├── backend/                          # Python FastAPI Backend
│   ├── main.py                       # FastAPI server
│   ├── tile_histogram.py             # Tile color histograms
│   ├── border_histogram.py           # Border color histograms
│   ├── texture_features.py           # Texture features (GLCM, LBP, etc.)
│   ├── border_texture_features.py    # Border texture features
│   ├── tile_distances.py             # Tile similarity/distance calculation
│   ├── requirements.txt              # Python dependencies
│   ├── README.md                     # Backend documentation
│   └── TEXTURE_FEATURES_GUIDE.md     # Texture features explanation
│
├── frontend/                         # React Frontend
│   ├── src/
│   │   ├── App.jsx                   # Main application
│   │   ├── services/
│   │   │   └── imageApi.js           # API communication layer
│   │   └── ...
│   ├── components/
│   │   ├── InsertImage.jsx           # Image upload component
│   │   ├── ShuffleImage.jsx          # Tile shuffling
│   │   ├── GlobalVariables.jsx       # Global settings
│   │   ├── TileHistograms.jsx        # Tile color histograms
│   │   ├── BorderHistograms.jsx      # Border color histograms
│   │   ├── TextureFeatures.jsx       # Texture features
│   │   ├── BorderTextureFeatures.jsx # Border texture features
│   │   └── TileDistances.jsx         # Distance calculation
│   ├── package.json                  # Node dependencies
│   └── ...
│
├── IMAGE_ANALYSIS.pdf                # Project documentation
└── README.md                         # This file
```

---

## 🛠️ Troubleshooting

### Backend δεν ξεκινάει

**Error: "No module named 'fastapi'"**
- Λύση: `pip install -r requirements.txt`

**Error: pip install αποτυγχάνει με compilation errors**
- Λύση 1 (Συνιστάται): Upgrade pip και εγκατάσταση νεότερων εκδόσεων
  ```bash
  python -m pip install --upgrade pip
  pip install -r requirements.txt
  ```
- Λύση 2: Αν έχεις Python 3.13, βεβαιώσου ότι έχεις τις νεότερες εκδόσεις των packages (το requirements.txt έχει ενημερωθεί)

**Error: "Address already in use" (port 8000)**
- Λύση: Κλείσε άλλες εφαρμογές που χρησιμοποιούν το port 8000, ή άλλαξε το port στο `main.py`

### Frontend δεν ξεκινάει

**Error: "command not found: npm"**
- Λύση: Εγκατάστησε το Node.js

**Error: "Cannot find module"**
- Λύση: `npm install`

### API Errors στο Frontend

**Error: "Failed to fetch" ή "404"**
- Έλεγξε ότι το backend τρέχει στο `http://localhost:8000`
- Πάτα "Check Backend Status" στο TileHistograms component

---

## 📊 API Endpoints

Όλα τα endpoints είναι διαθέσιμα στο `http://localhost:8000/docs` (Swagger UI)

**Κύρια Endpoints:**
- `GET /` - Health check
- `POST /api/tile-histogram` - Tile color histogram
- `POST /api/border-histograms` - Border color histograms
- `POST /api/texture-features` - Texture features
- `POST /api/border-texture-features` - Border texture features
- `POST /api/calculate-distances` - Calculate tile distances

---

## 📝 Dependencies

### Backend (Python)
- Python 3.11+ (3.13 supported)
- fastapi >= 0.115.0
- uvicorn >= 0.24.0
- opencv-python >= 4.10.0
- numpy >= 2.1.0
- pillow >= 10.0.0
- scikit-image >= 0.24.0

### Frontend (JavaScript)
- react ^18.3.1
- vite ^6.0.5

---

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

---

## 📧 Contact

Για ερωτήσεις ή προβλήματα, άνοιξε ένα issue στο GitHub.

---

## 📄 License

This project is open source.
