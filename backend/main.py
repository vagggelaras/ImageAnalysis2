from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import io
from PIL import Image
import numpy as np
import cv2
from tile_histogram import calculate_tile_histogram, calculate_tile_histogram_normalized
from border_histogram import calculate_border_histograms, calculate_border_histograms_normalized
from texture_features import calculate_all_texture_features
from border_texture_features import calculate_border_texture_features, calculate_simplified_border_texture
from tile_distances import calculate_all_tile_distances, get_top_k_matches

app = FastAPI(title="Image Analysis API", version="1.0.0")

# CORS middleware για επικοινωνία με React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def root():
    return {"message": "Image Analysis API is running", "status": "ok"}

@app.post("/api/tile-histogram")
async def get_tile_histogram(file: UploadFile = File(...), bins: int = 256):
    """
    Υπολογίζει το color histogram για ένα tile/εικόνα

    Args:
        file: Image file (tile)
        bins: Αριθμός bins για το histogram (default: 256)

    Returns:
        Color histogram για κάθε κανάλι (B, G, R)
    """
    try:
        # Διάβασμα εικόνας
        contents = await file.read()
        image = Image.open(io.BytesIO(contents))

        # Μετατροπή σε numpy array για OpenCV (BGR)
        img_array = np.array(image.convert('RGB'))
        img_bgr = cv2.cvtColor(img_array, cv2.COLOR_RGB2BGR)

        # Υπολογισμός histogram
        histogram_data = calculate_tile_histogram(img_bgr, bins=bins)

        return JSONResponse({
            "status": "success",
            "data": histogram_data
        })

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error calculating histogram: {str(e)}")

@app.post("/api/tile-histogram-normalized")
async def get_tile_histogram_normalized(file: UploadFile = File(...), bins: int = 256):
    """
    Υπολογίζει normalized histogram (0-1) για ένα tile

    Χρήσιμο για σύγκριση histograms
    """
    try:
        contents = await file.read()
        image = Image.open(io.BytesIO(contents))
        img_array = np.array(image.convert('RGB'))
        img_bgr = cv2.cvtColor(img_array, cv2.COLOR_RGB2BGR)

        histogram_data = calculate_tile_histogram_normalized(img_bgr, bins=bins)

        return JSONResponse({
            "status": "success",
            "data": histogram_data
        })

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error calculating normalized histogram: {str(e)}")

@app.post("/api/border-histograms")
async def get_border_histograms(file: UploadFile = File(...), border_width: int = 5, bins: int = 256):
    """
    Υπολογίζει histograms για κάθε πλευρά του tile (top, bottom, left, right)

    Args:
        file: Image file (tile)
        border_width: Πλάτος του border σε pixels (default: 5)
        bins: Αριθμός bins για το histogram (default: 256)

    Returns:
        Histograms για κάθε border (top, bottom, left, right)
    """
    try:
        contents = await file.read()
        image = Image.open(io.BytesIO(contents))
        img_array = np.array(image.convert('RGB'))
        img_bgr = cv2.cvtColor(img_array, cv2.COLOR_RGB2BGR)

        border_histograms = calculate_border_histograms(img_bgr, border_width=border_width, bins=bins)

        return JSONResponse({
            "status": "success",
            "data": border_histograms
        })

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error calculating border histograms: {str(e)}")

@app.post("/api/border-histograms-normalized")
async def get_border_histograms_normalized(file: UploadFile = File(...), border_width: int = 5, bins: int = 256):
    """
    Υπολογίζει normalized histograms (0-1) για κάθε πλευρά του tile

    Χρήσιμο για σύγκριση borders μεταξύ tiles
    """
    try:
        contents = await file.read()
        image = Image.open(io.BytesIO(contents))
        img_array = np.array(image.convert('RGB'))
        img_bgr = cv2.cvtColor(img_array, cv2.COLOR_RGB2BGR)

        border_histograms = calculate_border_histograms_normalized(img_bgr, border_width=border_width, bins=bins)

        return JSONResponse({
            "status": "success",
            "data": border_histograms
        })

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error calculating normalized border histograms: {str(e)}")

@app.post("/api/texture-features")
async def get_texture_features(file: UploadFile = File(...)):
    """
    Υπολογίζει texture features για ένα tile

    Returns:
        Dictionary με όλα τα texture features:
        - glcm: GLCM features (contrast, homogeneity, energy, correlation, etc.)
        - lbp: Local Binary Pattern features
        - edges: Edge-based features
        - statistical: Statistical features (mean, std, entropy, etc.)
    """
    try:
        contents = await file.read()
        image = Image.open(io.BytesIO(contents))
        img_array = np.array(image.convert('RGB'))
        img_bgr = cv2.cvtColor(img_array, cv2.COLOR_RGB2BGR)

        texture_features = calculate_all_texture_features(img_bgr)

        return JSONResponse({
            "status": "success",
            "data": texture_features
        })

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error calculating texture features: {str(e)}")

@app.post("/api/border-texture-features")
async def get_border_texture_features(file: UploadFile = File(...), border_width: int = 5, simplified: bool = False):
    """
    Υπολογίζει texture features για κάθε border strip του tile

    Args:
        file: Image file (tile)
        border_width: Πλάτος του border σε pixels (default: 5)
        simplified: Αν True, επιστρέφει μόνο τα βασικά features (πιο γρήγορο)

    Returns:
        Texture features για κάθε border (top, bottom, left, right)
    """
    try:
        contents = await file.read()
        image = Image.open(io.BytesIO(contents))
        img_array = np.array(image.convert('RGB'))
        img_bgr = cv2.cvtColor(img_array, cv2.COLOR_RGB2BGR)

        if simplified:
            border_features = calculate_simplified_border_texture(img_bgr, border_width=border_width)
        else:
            border_features = calculate_border_texture_features(img_bgr, border_width=border_width)

        return JSONResponse({
            "status": "success",
            "data": border_features,
            "simplified": simplified
        })

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error calculating border texture features: {str(e)}")

@app.post("/api/calculate-distances")
async def calculate_tile_distances_endpoint(request: dict, color_weight: float = 0.6, texture_weight: float = 0.4):
    """
    Υπολογίζει αποστάσεις μεταξύ όλων των ζευγών tiles

    Request body:
    {
        "tiles_data": [
            {
                "tile_id": 0,
                "borders": {
                    "top": {"histogram": {...}, "texture": {...}},
                    "bottom": {...},
                    "left": {...},
                    "right": {...}
                }
            },
            ...
        ]
    }

    Returns:
        Αποστάσεις και best matches για κάθε tile
    """
    try:
        tiles_data = request.get('tiles_data', [])

        if not tiles_data:
            raise HTTPException(status_code=400, detail="No tiles data provided")

        # Υπολογισμός αποστάσεων
        result = calculate_all_tile_distances(tiles_data, color_weight, texture_weight)

        return JSONResponse({
            "status": "success",
            "data": result
        })

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error calculating distances: {str(e)}")

@app.post("/api/get-top-matches")
async def get_top_matches_endpoint(request: dict, k: int = 5, color_weight: float = 0.6, texture_weight: float = 0.4):
    """
    Βρίσκει τα top-k καλύτερα matches για ένα συγκεκριμένο border

    Request body:
    {
        "tiles_data": [...],
        "tile_id": 0,
        "border_side": "right"
    }

    Returns:
        List με top-k matches
    """
    try:
        tiles_data = request.get('tiles_data', [])
        tile_id = request.get('tile_id')
        border_side = request.get('border_side')

        if not tiles_data or tile_id is None or not border_side:
            raise HTTPException(status_code=400, detail="Missing required parameters")

        # Βρες top matches
        matches = get_top_k_matches(tiles_data, tile_id, border_side, k, color_weight, texture_weight)

        return JSONResponse({
            "status": "success",
            "data": {
                "tile_id": tile_id,
                "border_side": border_side,
                "top_matches": matches
            }
        })

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error getting top matches: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
