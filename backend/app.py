from fastapi import FastAPI, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import cv2
import numpy as np
from typing import List, Dict
import json
from io import BytesIO
from PIL import Image
import os
import shutil
from pathlib import Path
import tensorflow as tf
from tensorflow.keras.applications import MobileNetV2
from tensorflow.keras.applications.mobilenet_v2 import preprocess_input
from tensorflow.keras.models import Model

from PIL import Image # gia debug


app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000", "http://localhost:8000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Φόρτωση MobileNetV2 model (φορτώνεται μία φορά κατά την εκκίνηση)
print("Loading MobileNetV2 model...")
base_model = MobileNetV2(weights='imagenet', include_top=False, input_shape=(224, 224, 3))

# Επιλογή intermediate layers για feature extraction
# Παίρνουμε features από διάφορα depths του network
layer_names = [
    'block_1_expand_relu',   # Early features (56x56)
    'block_3_expand_relu',   # Mid-low features (28x28)
    'block_6_expand_relu',   # Mid features (14x14)
    'block_13_expand_relu',  # Mid-high features (7x7)
    'out_relu'               # Final features (7x7)
]

# Δημιουργία feature extractor model
layer_outputs = [base_model.get_layer(name).output for name in layer_names]
feature_extractor = Model(inputs=base_model.input, outputs=layer_outputs)
print(f"MobileNetV2 loaded with {len(layer_names)} intermediate layers")

class Item(BaseModel):
    name: str
    age: int

class TileMetadata(BaseModel):
    sourceIndex: int
    destPosition: int
    rotation: int

@app.get("/api/hello")
def hello():
    return {"message": "Hello from FastAPI!"}

@app.post("/api/data")
def receive_data(item: Item):
    return {"received": item.dict(), "status": "success"}


def calculate_color_histogram(image_region, bins=256):
    """
    Υπολογίζει color histogram για μια περιοχή εικόνας (BGR).

    Args:
        image_region: numpy array με shape (height, width, 3) - BGR (OpenCV format)
        bins: αριθμός bins για το histogram (default: 256)

    Returns:
        dict με histograms για R, G, B κανάλια (normalized) - σε RGB σειρά
    """
    if len(image_region.shape) == 2:
        # Grayscale - μετατροπή σε BGR
        image_region = cv2.cvtColor(image_region, cv2.COLOR_GRAY2BGR)

    # OpenCV αποθηκεύει σε BGR format, οπότε:
    # channel 0 = Blue, channel 1 = Green, channel 2 = Red
    hist_b = cv2.calcHist([image_region], [0], None, [bins], [0, 256])
    hist_g = cv2.calcHist([image_region], [1], None, [bins], [0, 256])
    hist_r = cv2.calcHist([image_region], [2], None, [bins], [0, 256])

    # Normalize (ώστε το άθροισμα να είναι 1)
    hist_r = hist_r.flatten() / (hist_r.sum() + 1e-7)
    hist_g = hist_g.flatten() / (hist_g.sum() + 1e-7)
    hist_b = hist_b.flatten() / (hist_b.sum() + 1e-7)

    # Επιστρέφουμε σε RGB σειρά για ευκολία
    return {
        'r': hist_r.tolist(),
        'g': hist_g.tolist(),
        'b': hist_b.tolist()
    }


def extract_tile_with_rotation(image, source_index, rotation, grid_size):
    """
    Εξάγει ένα tile από την εικόνα και το περιστρέφει.

    Args:
        image: numpy array της εικόνας
        source_index: index του tile στην αρχική εικόνα
        rotation: γωνία περιστροφής σε μοίρες (0, 90, 180, 270)
        grid_size: μέγεθος grid (π.χ. 4 για 4x4)

    Returns:
        numpy array του rotated tile
    """
    height, width = image.shape[:2]
    tile_height = height // grid_size
    tile_width = width // grid_size

    # Υπολογισμός source position
    source_row = source_index // grid_size
    source_col = source_index % grid_size

    # Εξαγωγή tile
    y1 = source_row * tile_height
    y2 = y1 + tile_height
    x1 = source_col * tile_width
    x2 = x1 + tile_width

    tile = image[y1:y2, x1:x2].copy()

    # Περιστροφή tile
    if rotation == 90:
        tile = cv2.rotate(tile, cv2.ROTATE_90_CLOCKWISE)
    elif rotation == 180:
        tile = cv2.rotate(tile, cv2.ROTATE_180)
    elif rotation == 270:
        tile = cv2.rotate(tile, cv2.ROTATE_90_COUNTERCLOCKWISE)

    return tile


def extract_border_strips(tile, border_width):
    """
    Εξάγει τα 4 border strips από ένα tile.

    Args:
        tile: numpy array του tile
        border_width: πλάτος border σε pixels

    Returns:
        dict με τα 4 borders (top, right, bottom, left)
    """
    height, width = tile.shape[:2]

    return {
        'top': tile[0:border_width, :],
        'bottom': tile[height-border_width:height, :],
        'left': tile[:, 0:border_width],
        'right': tile[:, width-border_width:width]
    }


def apply_gabor_filters(image_region, num_orientations=4, num_frequencies=3):
    """
    Εφαρμόζει Gabor filters για texture και edge detection.

    Args:
        image_region: numpy array (BGR ή grayscale)
        num_orientations: πόσες διαφορετικές γωνίες (0, 45, 90, 135 κλπ)
        num_frequencies: πόσες διαφορετικές συχνότητες

    Returns:
        dict με filtered images και extracted features
    """
    # Μετατροπή σε grayscale αν είναι BGR
    if len(image_region.shape) == 3:
        gray = cv2.cvtColor(image_region, cv2.COLOR_BGR2GRAY)
    else:
        gray = image_region

    # Normalize στο [0, 1]
    gray = gray.astype(np.float32) / 255.0

    # Παράμετροι Gabor filter
    ksize = 31  # Μέγεθος kernel
    sigma = 4.0  # Standard deviation
    lambd_values = [5, 10, 15][:num_frequencies]  # Wavelengths (συχνότητες)
    gamma = 0.5  # Spatial aspect ratio
    psi = 0  # Phase offset

    gabor_responses = []
    gabor_features = []

    # Για κάθε γωνία
    for i in range(num_orientations):
        theta = i * np.pi / num_orientations  # 0, π/4, π/2, 3π/4 για 4 orientations

        # Για κάθε συχνότητα
        for lambd in lambd_values:
            # Δημιουργία Gabor kernel
            kernel = cv2.getGaborKernel(
                (ksize, ksize), sigma, theta, lambd, gamma, psi, ktype=cv2.CV_32F
            )

            # Εφαρμογή φίλτρου
            filtered = cv2.filter2D(gray, cv2.CV_32F, kernel)

            # Υπολογισμός features από το filtered image
            mean = np.mean(filtered)
            std = np.std(filtered)
            energy = np.sum(filtered ** 2)

            gabor_responses.append(filtered)
            gabor_features.append({
                'orientation': float(theta * 180 / np.pi),  # Σε μοίρες
                'wavelength': lambd,
                'mean': float(mean),
                'std': float(std),
                'energy': float(energy)
            })

    return {
        'responses': gabor_responses,
        'features': gabor_features,
        'num_filters': len(gabor_responses)
    }


def extract_cnn_features(image_region):
    """
    Εξάγει deep CNN features από το MobileNetV2.

    Args:
        image_region: numpy array (BGR format)

    Returns:
        dict με features από intermediate layers
    """
    # Μετατροπή από BGR σε RGB (για το TensorFlow)
    rgb_image = cv2.cvtColor(image_region, cv2.COLOR_BGR2RGB)

    # Resize στο 224x224 (input size του MobileNetV2)
    resized = cv2.resize(rgb_image, (224, 224))

    # Προσθήκη batch dimension
    img_array = np.expand_dims(resized, axis=0)

    # Preprocessing για MobileNetV2
    preprocessed = preprocess_input(img_array)

    # Εξαγωγή features από intermediate layers
    layer_features = feature_extractor.predict(preprocessed, verbose=0)

    # Υπολογισμός statistics για κάθε layer
    features_summary = []
    for i, (layer_name, features) in enumerate(zip(layer_names, layer_features)):
        # Global Average Pooling για να πάρουμε ένα feature vector
        gap = np.mean(features, axis=(1, 2))  # Shape: (1, channels)

        # Statistics
        feature_stats = {
            'layer_name': layer_name,
            'layer_index': i,
            'shape': list(features.shape[1:]),  # (height, width, channels)
            'num_channels': int(features.shape[-1]),
            'mean': float(np.mean(gap)),
            'std': float(np.std(gap)),
            'min': float(np.min(gap)),
            'max': float(np.max(gap)),
            'feature_vector': gap.flatten().tolist()  # Πλήρες feature vector
        }

        features_summary.append(feature_stats)

    return {
        'num_layers': len(features_summary),
        'layers': features_summary
    }


# ============================================================================
# ADJACENCY MATRIX - DISTANCE METRICS
# ============================================================================

def chi_square_distance(hist1, hist2):
    """
    Calculate Chi-Square distance between two color histograms.

    Args:
        hist1: dict with keys 'r', 'g', 'b' (normalized histograms)
        hist2: dict with keys 'r', 'g', 'b' (normalized histograms)

    Returns:
        float: Chi-square distance (lower is better, 0 = identical)
    """
    distance = 0.0

    for channel in ['r', 'g', 'b']:
        h1 = np.array(hist1[channel])
        h2 = np.array(hist2[channel])

        # Chi-square formula: sum((h1[i] - h2[i])^2 / (h1[i] + h2[i] + eps))
        chi_sq = np.sum((h1 - h2) ** 2 / (h1 + h2 + 1e-10))
        distance += chi_sq

    # Average across 3 channels
    return distance / 3.0


def cosine_similarity(vec1, vec2):
    """
    Calculate cosine similarity between two feature vectors.

    Args:
        vec1: list or numpy array (CNN feature vector)
        vec2: list or numpy array (CNN feature vector)

    Returns:
        float: Cosine similarity (0-1, higher is better, 1 = identical direction)
    """
    v1 = np.array(vec1)
    v2 = np.array(vec2)

    # Cosine similarity: dot(v1, v2) / (||v1|| * ||v2||)
    dot_product = np.dot(v1, v2)
    norm1 = np.linalg.norm(v1)
    norm2 = np.linalg.norm(v2)

    if norm1 == 0 or norm2 == 0:
        return 0.0

    similarity = dot_product / (norm1 * norm2)

    # Clamp to [0, 1] range (cosine can be negative for opposite directions)
    return max(0.0, min(1.0, similarity))


def euclidean_distance(features1, features2):
    """
    Calculate Euclidean (L2) distance between two Gabor feature sets.

    Args:
        features1: list of dicts with keys 'mean', 'std', 'energy' (12 filters)
        features2: list of dicts with keys 'mean', 'std', 'energy' (12 filters)

    Returns:
        float: Euclidean distance (lower is better, 0 = identical)
    """
    # Flatten all features into vectors
    vec1 = []
    vec2 = []

    for f1, f2 in zip(features1, features2):
        vec1.extend([f1['mean'], f1['std'], f1['energy']])
        vec2.extend([f2['mean'], f2['std'], f2['energy']])

    v1 = np.array(vec1)
    v2 = np.array(vec2)

    # L2 distance
    return np.linalg.norm(v1 - v2)


def normalize_to_similarity(distance, max_distance):
    """
    Normalize a distance metric to similarity score in [0, 1].
    Lower distance = higher similarity.

    Args:
        distance: Raw distance value
        max_distance: Maximum possible distance (for normalization)

    Returns:
        float: Similarity score (0-1, higher is better, 1 = identical)
    """
    # Avoid division by zero
    if max_distance == 0:
        return 1.0

    # Convert distance to similarity: similarity = 1 - (distance / max_distance)
    similarity = 1.0 - min(distance / max_distance, 1.0)
    return max(0.0, similarity)


# ============================================================================
# ADJACENCY MATRIX - BORDER MATCHING LOGIC
# ============================================================================

def get_opposite_border(border, rotation):
    """
    Get which border of tileB should match with border of tileA,
    considering rotation.

    Args:
        border: Border name of tile A ('top', 'right', 'bottom', 'left')
        rotation: Rotation in degrees (0, 90, 180, 270) to apply to tile B

    Returns:
        str: Border name of tile B that would match

    Examples:
        - If A.right matches B.left at 0°: get_opposite_border('right', 0) = 'left'
        - If A.right matches B.top at 90°: get_opposite_border('right', 90) = 'top'

    Rotation Logic:
        0°:   opposite borders match (top↔bottom, right↔left)
        90°:  borders rotate clockwise (top→right, right→bottom, bottom→left, left→top)
        180°: same borders match (top↔top, right↔right)
        270°: borders rotate counter-clockwise (top→left, right→top, bottom→right, left→bottom)
    """
    # Mapping: which border should match which border at different rotations
    rotation_map = {
        0: {
            'top': 'bottom',
            'right': 'left',
            'bottom': 'top',
            'left': 'right'
        },
        90: {
            'top': 'right',
            'right': 'bottom',
            'bottom': 'left',
            'left': 'top'
        },
        180: {
            'top': 'top',
            'right': 'right',
            'bottom': 'bottom',
            'left': 'left'
        },
        270: {
            'top': 'left',
            'right': 'top',
            'bottom': 'right',
            'left': 'bottom'
        }
    }

    return rotation_map[rotation][border]


def get_border_compatibility(borderA_features, borderB_features, weights, cnn_layer_name):
    """
    Calculate compatibility between two borders using multiple metrics.

    Args:
        borderA_features: dict with 'histogram', 'gabor', 'cnn' keys
        borderB_features: dict with 'histogram', 'gabor', 'cnn' keys
        weights: dict with metric weights {'color': float, 'gabor': float, 'cnn': float}
        cnn_layer_name: which CNN layer to use for comparison (e.g., 'block_6_expand_relu')

    Returns:
        dict: {
            'combined': float (weighted average, 0-1, higher = better match),
            'color': float (0-1, higher = better),
            'gabor': float (0-1, higher = better),
            'cnn': float (0-1, higher = better)
        }
    """
    scores = {}

    # 1. Color Histogram - Chi-Square Distance
    color_dist = chi_square_distance(
        borderA_features['histogram'],
        borderB_features['histogram']
    )
    # Normalize chi-square distance (typical max ~2.0 for normalized histograms)
    scores['color'] = normalize_to_similarity(color_dist, max_distance=2.0)

    # 2. Gabor Features - Euclidean Distance
    gabor_dist = euclidean_distance(
        borderA_features['gabor'],
        borderB_features['gabor']
    )
    # Normalize (empirical max based on typical Gabor feature ranges)
    # 12 filters * 3 features = 36 values, typical range ~0-100 each
    scores['gabor'] = normalize_to_similarity(gabor_dist, max_distance=200.0)

    # 3. CNN Features - Cosine Similarity
    # Find the specified layer
    cnn_vectorA = None
    cnn_vectorB = None

    for layer in borderA_features['cnn']:
        if layer['layer_name'] == cnn_layer_name:
            cnn_vectorA = layer['feature_vector']
            break

    for layer in borderB_features['cnn']:
        if layer['layer_name'] == cnn_layer_name:
            cnn_vectorB = layer['feature_vector']
            break

    if cnn_vectorA and cnn_vectorB:
        scores['cnn'] = cosine_similarity(cnn_vectorA, cnn_vectorB)
    else:
        scores['cnn'] = 0.0

    # 4. Combined weighted score
    scores['combined'] = (
        weights['color'] * scores['color'] +
        weights['gabor'] * scores['gabor'] +
        weights['cnn'] * scores['cnn']
    )

    return scores


@app.post("/api/calculate-histograms")
async def calculate_histograms(
    image: UploadFile = File(...),
    gridSize: int = Form(...),
    borderWidth: int = Form(...),
    bins: int = Form(256),  # Αριθμός bins για histograms (default: 256)
    tiles: str = Form(...)  # JSON string με tile metadata
):
    """
    Endpoint που:
    1. Δέχεται εικόνα + metadata
    2. Για κάθε tile, υπολογίζει features για ΟΛΕΣ τις πιθανές rotations (0°, 90°, 180°, 270°)
    3. Εξάγει border strips για κάθε rotation
    4. Αποθηκεύει τα border strips ως εικόνες στο tempPhotos
    5. Υπολογίζει color histograms, Gabor features και CNN features για κάθε border
    """
    # Διάβασμα εικόνας
    contents = await image.read()
    nparr = np.frombuffer(contents, np.uint8)
    img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
    # Η εικόνα είναι σε BGR format (cv2.imdecode επιστρέφει BGR)
    # ΔΕΝ μετατρέπουμε σε RGB γιατί όλες οι συναρτήσεις μας δουλεύουν με BGR

    # Parse tile metadata
    tiles_data = json.loads(tiles)

    # Δημιουργία φακέλου tempPhotos στο root
    # Το backend τρέχει από τον φάκελο backend, οπότε πάμε ένα επίπεδο πάνω
    base_path = Path(__file__).parent.parent  # Πάει από backend/ στο root
    temp_photos_dir = base_path / "tempPhotos"

    # Διαγραφή παλιού φακέλου αν υπάρχει και δημιουργία νέου
    if temp_photos_dir.exists():
        shutil.rmtree(temp_photos_dir)
    temp_photos_dir.mkdir(exist_ok=True)

    saved_images = []
    results = []

    # Δημιουργία υποφακέλου για Gabor filtered images
    gabor_dir = temp_photos_dir / "gabor_filters"
    gabor_dir.mkdir(exist_ok=True)

    # Για κάθε tile (sourceIndex), υπολογίζουμε features για όλες τις rotations
    for idx, tile_meta in enumerate(tiles_data):
        source_index = tile_meta['sourceIndex']
        dest_position = tile_meta['destPosition']
        shuffle_rotation = tile_meta['rotation']  # Η rotation από το shuffle (για reference)

        # Dictionary για να αποθηκεύσουμε features για κάθε rotation
        rotation_features = {}

        # Υπολογισμός features για όλες τις πιθανές rotations
        for rotation_angle in [0, 90, 180, 270]:
            # Εξαγωγή tile με αυτή τη rotation
            tile = extract_tile_with_rotation(img, source_index, rotation_angle, gridSize)

            # Υπολογισμός histogram για ολόκληρο το tile
            tile_histogram = calculate_color_histogram(tile, bins=bins)

            # Εφαρμογή Gabor filters στο tile
            tile_gabor = apply_gabor_filters(tile, num_orientations=4, num_frequencies=3)

            # Εξαγωγή CNN features από το tile
            tile_cnn = extract_cnn_features(tile)

            # Αποθήκευση Gabor filtered images για το tile
            for filter_idx, gabor_response in enumerate(tile_gabor['responses']):
                # Normalize στο [0, 255] για αποθήκευση
                gabor_normalized = cv2.normalize(gabor_response, None, 0, 255, cv2.NORM_MINMAX)
                gabor_uint8 = gabor_normalized.astype(np.uint8)

                # Αποθήκευση
                gabor_filename = f"tile_{idx}_rot{rotation_angle}_gabor_{filter_idx}.jpg"
                gabor_filepath = gabor_dir / gabor_filename
                cv2.imwrite(str(gabor_filepath), gabor_uint8)

            # Εξαγωγή border strips
            borders = extract_border_strips(tile, borderWidth)

            # Υπολογισμός histogram, Gabor και CNN features για κάθε border
            border_histograms = {}
            border_gabor_features = {}
            border_cnn_features = {}

            # Αποθήκευση κάθε border strip ως εικόνα
            for border_name, border_img in borders.items():
                # Υπολογισμός histogram για το border
                border_histograms[border_name] = calculate_color_histogram(border_img, bins=bins)

                # Εφαρμογή Gabor filters στο border
                border_gabor = apply_gabor_filters(border_img, num_orientations=4, num_frequencies=3)
                border_gabor_features[border_name] = border_gabor['features']

                # Εξαγωγή CNN features από το border
                border_cnn = extract_cnn_features(border_img)
                border_cnn_features[border_name] = border_cnn['layers']

                # Αποθήκευση Gabor filtered images για το border
                for filter_idx, gabor_response in enumerate(border_gabor['responses']):
                    # Normalize στο [0, 255]
                    gabor_normalized = cv2.normalize(gabor_response, None, 0, 255, cv2.NORM_MINMAX)
                    gabor_uint8 = gabor_normalized.astype(np.uint8)

                    # Αποθήκευση
                    gabor_filename = f"tile_{idx}_rot{rotation_angle}_{border_name}_gabor_{filter_idx}.jpg"
                    gabor_filepath = gabor_dir / gabor_filename
                    cv2.imwrite(str(gabor_filepath), gabor_uint8)

                # Όνομα αρχείου: tile_0_rot90_top.jpg, κλπ.
                filename = f"tile_{idx}_src{source_index}_rot{rotation_angle}_{border_name}.jpg"
                filepath = temp_photos_dir / filename

                # Αποθήκευση εικόνας (ήδη σε BGR format)
                cv2.imwrite(str(filepath), border_img)

                saved_images.append(filename)

            # Αποθήκευση features για αυτή τη rotation
            # Use string keys for JSON compatibility
            rotation_features[str(rotation_angle)] = {
                'tileHistogram': tile_histogram,
                'borderHistograms': border_histograms,
                'tileGaborFeatures': tile_gabor['features'],
                'borderGaborFeatures': border_gabor_features,
                'tileCnnFeatures': tile_cnn['layers'],
                'borderCnnFeatures': border_cnn_features
            }

        # Αποθήκευση αποτελεσμάτων με rotation-invariant features
        results.append({
            'sourceIndex': source_index,
            'destPosition': dest_position,
            'shuffleRotation': shuffle_rotation,  # Η αρχική rotation από το shuffle
            'rotationFeatures': rotation_features  # Features για όλες τις rotations
        })

    return {
        'status': 'success',
        'gridSize': gridSize,
        'borderWidth': borderWidth,
        'bins': bins,
        'totalTiles': len(tiles_data),
        'totalRotations': 4,  # Για κάθε tile υπολογίζουμε 4 rotations
        'totalImages': len(saved_images),
        'message': f'Calculated rotation-invariant features for {len(tiles_data)} tiles (4 rotations each). Saved {len(saved_images)} border strip images to tempPhotos/',
        'outputPath': str(temp_photos_dir),
        'results': results
    }


@app.post("/api/calculate-adjacency-matrix")
async def calculate_adjacency_matrix(data: dict):
    """
    Calculate adjacency matrix showing compatibility between tile borders.

    Input (JSON):
        {
            "histogramData": dict (full response from /api/calculate-histograms),
            "weights": dict (optional, default: {"color": 0.4, "gabor": 0.3, "cnn": 0.3}),
            "cnnLayer": str (optional, default: "block_6_expand_relu"),
            "topK": int (optional, default: 10 - top K matches per tile-border pair)
        }

    Output (JSON):
        {
            "status": "success",
            "gridSize": int,
            "totalTiles": int,
            "weights": dict,
            "cnnLayer": str,
            "topK": int,
            "adjacencyMatrix": [
                {
                    "tileA": int,
                    "borderA": str,
                    "tileB": int,
                    "borderB": str,
                    "rotation": int,
                    "compatibilityScore": float,
                    "scores": {"color": float, "gabor": float, "cnn": float}
                },
                ...
            ],
            "statistics": {
                "totalComparisons": int,
                "filteredMatches": int,
                "averageCompatibility": float,
                "minCompatibility": float,
                "maxCompatibility": float,
                "stdCompatibility": float,
                "bestMatch": dict
            }
        }
    """
    # Extract parameters with defaults
    histogram_data = data.get('histogramData')
    weights = data.get('weights', {'color': 0.4, 'gabor': 0.3, 'cnn': 0.3})
    cnn_layer = data.get('cnnLayer', 'block_6_expand_relu')
    top_k = data.get('topK', 10)

    # Validation
    if not histogram_data or 'results' not in histogram_data:
        return {"status": "error", "message": "Invalid histogram data"}

    tiles = histogram_data['results']
    grid_size = histogram_data['gridSize']

    # Check if data has new rotation-aware structure
    if len(tiles) > 0:
        first_tile = tiles[0]
        if 'rotationFeatures' not in first_tile:
            return {
                "status": "error",
                "message": "Histogram data has old structure. Please recalculate histograms with 'Send to Backend' button first!"
            }

    print(f"Calculating adjacency matrix for {len(tiles)} tiles with rotation-aware features...")
    print(f"Weights: {weights}, CNN Layer: {cnn_layer}, TopK: {top_k}")

    # Store all compatibility scores
    all_matches = []

    # Opposite borders (για rotation=0 case - τα borders που πρέπει να ταιριάζουν)
    opposite_borders = {
        'top': 'bottom',
        'right': 'left',
        'bottom': 'top',
        'left': 'right'
    }

    # Για κάθε tile A
    for i, tileA in enumerate(tiles):
        # Για κάθε rotation του A (use string keys)
        for rotA in ['0', '90', '180', '270']:
            # Για κάθε border του A
            for borderA in ['top', 'right', 'bottom', 'left']:
                # Παίρνουμε τα features του A με rotation rotA
                borderA_data = {
                    'histogram': tileA['rotationFeatures'][rotA]['borderHistograms'][borderA],
                    'gabor': tileA['rotationFeatures'][rotA]['borderGaborFeatures'][borderA],
                    'cnn': tileA['rotationFeatures'][rotA]['borderCnnFeatures'][borderA]
                }

                # Συγκρίνουμε με κάθε άλλο tile B
                for j, tileB in enumerate(tiles):
                    if i == j:
                        continue  # Don't compare tile with itself

                    # Για κάθε rotation του B (use string keys)
                    for rotB in ['0', '90', '180', '270']:
                        # Το opposite border που πρέπει να ταιριάξει
                        borderB = opposite_borders[borderA]

                        # Παίρνουμε τα features του B με rotation rotB
                        borderB_data = {
                            'histogram': tileB['rotationFeatures'][rotB]['borderHistograms'][borderB],
                            'gabor': tileB['rotationFeatures'][rotB]['borderGaborFeatures'][borderB],
                            'cnn': tileB['rotationFeatures'][rotB]['borderCnnFeatures'][borderB]
                        }

                        # Calculate compatibility
                        scores = get_border_compatibility(
                            borderA_data,
                            borderB_data,
                            weights,
                            cnn_layer
                        )

                        match_entry = {
                            'tileA': i,
                            'rotationA': int(rotA),  # Convert string to int for frontend
                            'borderA': borderA,
                            'tileB': j,
                            'rotationB': int(rotB),  # Convert string to int for frontend
                            'borderB': borderB,
                            'compatibilityScore': float(scores['combined']),
                            'scores': {
                                'color': float(scores['color']),
                                'gabor': float(scores['gabor']),
                                'cnn': float(scores['cnn'])
                            }
                        }

                        all_matches.append(match_entry)

    print(f"Total comparisons: {len(all_matches)} (with rotation-aware features)")

    # Sort by compatibility score (descending)
    all_matches.sort(key=lambda x: x['compatibilityScore'], reverse=True)

    # Calculate statistics
    scores_list = [m['compatibilityScore'] for m in all_matches]
    best_match = all_matches[0] if all_matches else None

    # For each tile-rotation-border combination, keep only top K matches
    filtered_matches = []
    tile_rotation_border_counts = {}

    for match in all_matches:
        # Key: (tileA, rotationA, borderA)
        trio_key = (match['tileA'], match['rotationA'], match['borderA'])

        if trio_key not in tile_rotation_border_counts:
            tile_rotation_border_counts[trio_key] = 0

        if tile_rotation_border_counts[trio_key] < top_k:
            filtered_matches.append(match)
            tile_rotation_border_counts[trio_key] += 1

    print(f"Filtered to {len(filtered_matches)} top matches (topK={top_k} per tile-rotation-border)")

    return {
        'status': 'success',
        'gridSize': grid_size,
        'totalTiles': len(tiles),
        'weights': weights,
        'cnnLayer': cnn_layer,
        'topK': top_k,
        'adjacencyMatrix': filtered_matches,
        'statistics': {
            'totalComparisons': len(all_matches),
            'filteredMatches': len(filtered_matches),
            'averageCompatibility': float(np.mean(scores_list)),
            'minCompatibility': float(np.min(scores_list)),
            'maxCompatibility': float(np.max(scores_list)),
            'stdCompatibility': float(np.std(scores_list)),
            'bestMatch': best_match
        }
    }