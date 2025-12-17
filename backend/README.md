# Backend - Image Analysis API

Python backend για ανάλυση εικόνων και υπολογισμό color histograms.

## Εγκατάσταση

1. **Δημιουργία virtual environment** (προτείνεται):
```bash
python -m venv venv
```

2. **Ενεργοποίηση virtual environment**:

Windows:
```bash
venv\Scripts\activate
```

Linux/Mac:
```bash
source venv/bin/activate
```

3. **Εγκατάσταση dependencies**:
```bash
pip install -r requirements.txt
```

## Εκτέλεση

```bash
python main.py
```

Ή με uvicorn:
```bash
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

Το API θα τρέχει στο: `http://localhost:8000`

## API Endpoints

### `GET /`
Health check - επιστρέφει status του API

**Response:**
```json
{
  "message": "Image Analysis API is running",
  "status": "ok"
}
```

### `POST /api/tile-histogram`
Υπολογίζει το color histogram για ένα tile/εικόνα

**Request:**
- `file`: Image file (multipart/form-data)
- `bins`: Αριθμός bins (optional, default: 256)

**Response:**
```json
{
  "status": "success",
  "data": {
    "blue": [0, 12, 45, ...],
    "green": [5, 23, 67, ...],
    "red": [3, 18, 52, ...],
    "bins": 256
  }
}
```

### `POST /api/tile-histogram-normalized`
Υπολογίζει normalized histogram (0-1) για ένα tile

Χρήσιμο για σύγκριση histograms μεταξύ tiles

**Request:**
- `file`: Image file (multipart/form-data)
- `bins`: Αριθμός bins (optional, default: 256)

**Response:**
```json
{
  "status": "success",
  "data": {
    "blue": [0.0, 0.12, 0.45, ...],
    "green": [0.05, 0.23, 0.67, ...],
    "red": [0.03, 0.18, 0.52, ...],
    "bins": 256,
    "normalized": true
  }
}
```

## Χρήση tile_histogram.py

Το module `tile_histogram.py` παρέχει functions για υπολογισμό histogram σε tiles:

```python
from tile_histogram import calculate_tile_histogram, compare_tile_histograms
import cv2

# Φόρτωση tile
tile = cv2.imread('tile.jpg')

# Υπολογισμός histogram
histogram = calculate_tile_histogram(tile, bins=256)

# Σύγκριση δύο histograms
similarity = compare_tile_histograms(hist1, hist2, method='correlation')
```

## API Documentation

Μετά την εκτέλεση, μπορείς να δεις το automatic API documentation στο:
- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`

## Σύνδεση με Frontend

Το backend έχει CORS enabled για:
- `http://localhost:5173` (Vite)
- `http://localhost:3000` (Create React App)
