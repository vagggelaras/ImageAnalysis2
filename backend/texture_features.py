import cv2
import numpy as np
from typing import Dict
from skimage.feature import graycomatrix, graycoprops, local_binary_pattern
from skimage import img_as_ubyte

def calculate_glcm_features(tile_image: np.ndarray, distances=[1], angles=[0, np.pi/4, np.pi/2, 3*np.pi/4]) -> Dict:
    """
    Υπολογίζει GLCM (Gray-Level Co-occurrence Matrix) texture features

    GLCM features περιγράφουν την υφή της εικόνας βάσει των spatial relationships των pixels

    Args:
        tile_image: BGR image (numpy array)
        distances: Αποστάσεις για GLCM (default: [1])
        angles: Γωνίες σε radians (default: 0°, 45°, 90°, 135°)

    Returns:
        Dictionary με texture features:
        - contrast: Μετρά την τοπική variation (υψηλό = πολλές αλλαγές)
        - dissimilarity: Παρόμοιο με contrast
        - homogeneity: Ομοιογένεια (υψηλό = ομοιόμορφη υφή)
        - energy: Ομοιομορφία (υψηλό = επαναλαμβανόμενα patterns)
        - correlation: Γραμμική εξάρτηση γειτονικών pixels
        - ASM (Angular Second Moment): Ενέργεια^2
    """
    # Μετατροπή σε grayscale
    if len(tile_image.shape) == 3:
        gray = cv2.cvtColor(tile_image, cv2.COLOR_BGR2GRAY)
    else:
        gray = tile_image

    # Υπολογισμός GLCM
    glcm = graycomatrix(gray, distances=distances, angles=angles, levels=256, symmetric=True, normed=True)

    # Εξαγωγή features
    features = {
        'contrast': float(np.mean(graycoprops(glcm, 'contrast'))),
        'dissimilarity': float(np.mean(graycoprops(glcm, 'dissimilarity'))),
        'homogeneity': float(np.mean(graycoprops(glcm, 'homogeneity'))),
        'energy': float(np.mean(graycoprops(glcm, 'energy'))),
        'correlation': float(np.mean(graycoprops(glcm, 'correlation'))),
        'ASM': float(np.mean(graycoprops(glcm, 'ASM')))
    }

    return features

def calculate_lbp_features(tile_image: np.ndarray, radius=1, n_points=8) -> Dict:
    """
    Υπολογίζει Local Binary Pattern (LBP) features

    LBP περιγράφει την τοπική υφή γύρω από κάθε pixel

    Args:
        tile_image: BGR image
        radius: Ακτίνα γύρω από το pixel (default: 1)
        n_points: Αριθμός σημείων για σύγκριση (default: 8)

    Returns:
        Dictionary με LBP histogram και statistics
    """
    # Μετατροπή σε grayscale
    if len(tile_image.shape) == 3:
        gray = cv2.cvtColor(tile_image, cv2.COLOR_BGR2GRAY)
    else:
        gray = tile_image

    # Υπολογισμός LBP
    lbp = local_binary_pattern(gray, n_points, radius, method='uniform')

    # Histogram του LBP
    n_bins = n_points + 2  # uniform LBP has n_points + 2 bins
    hist, _ = np.histogram(lbp.ravel(), bins=n_bins, range=(0, n_bins), density=True)

    return {
        'histogram': hist.tolist(),
        'mean': float(np.mean(lbp)),
        'std': float(np.std(lbp)),
        'min': float(np.min(lbp)),
        'max': float(np.max(lbp))
    }

def calculate_edge_features(tile_image: np.ndarray) -> Dict:
    """
    Υπολογίζει edge-based texture features

    Edges (άκρες) είναι σημαντικά χαρακτηριστικά της υφής

    Args:
        tile_image: BGR image

    Returns:
        Dictionary με edge statistics
    """
    # Μετατροπή σε grayscale
    if len(tile_image.shape) == 3:
        gray = cv2.cvtColor(tile_image, cv2.COLOR_BGR2GRAY)
    else:
        gray = tile_image

    # Sobel edges (horizontal και vertical)
    sobelx = cv2.Sobel(gray, cv2.CV_64F, 1, 0, ksize=3)
    sobely = cv2.Sobel(gray, cv2.CV_64F, 0, 1, ksize=3)

    # Edge magnitude
    edge_magnitude = np.sqrt(sobelx**2 + sobely**2)

    # Canny edges
    edges_canny = cv2.Canny(gray, 50, 150)
    edge_density = np.sum(edges_canny > 0) / (edges_canny.shape[0] * edges_canny.shape[1])

    return {
        'edge_magnitude_mean': float(np.mean(edge_magnitude)),
        'edge_magnitude_std': float(np.std(edge_magnitude)),
        'edge_density': float(edge_density),  # Ποσοστό pixels που είναι edges
        'horizontal_edges_mean': float(np.mean(np.abs(sobelx))),
        'vertical_edges_mean': float(np.mean(np.abs(sobely)))
    }

def calculate_statistical_features(tile_image: np.ndarray) -> Dict:
    """
    Υπολογίζει statistical texture features

    Args:
        tile_image: BGR image

    Returns:
        Dictionary με statistical measures
    """
    # Μετατροπή σε grayscale
    if len(tile_image.shape) == 3:
        gray = cv2.cvtColor(tile_image, cv2.COLOR_BGR2GRAY)
    else:
        gray = tile_image

    # Βασικά statistics
    mean = np.mean(gray)
    std = np.std(gray)

    # Skewness (ασυμμετρία κατανομής)
    skewness = np.mean(((gray - mean) / std) ** 3) if std > 0 else 0

    # Kurtosis (μυτερότητα κατανομής)
    kurtosis = np.mean(((gray - mean) / std) ** 4) if std > 0 else 0

    # Entropy (πολυπλοκότητα)
    hist, _ = np.histogram(gray.ravel(), bins=256, range=(0, 256), density=True)
    hist = hist[hist > 0]  # Remove zero values
    entropy = -np.sum(hist * np.log2(hist))

    return {
        'mean': float(mean),
        'std': float(std),
        'variance': float(std ** 2),
        'skewness': float(skewness),
        'kurtosis': float(kurtosis),
        'entropy': float(entropy),
        'min': float(np.min(gray)),
        'max': float(np.max(gray)),
        'range': float(np.max(gray) - np.min(gray))
    }

def calculate_all_texture_features(tile_image: np.ndarray) -> Dict:
    """
    Υπολογίζει ΟΛΑ τα texture features για ένα tile

    Args:
        tile_image: BGR image (numpy array)

    Returns:
        Dictionary με όλα τα texture features:
        - glcm: GLCM-based features
        - lbp: Local Binary Pattern features
        - edges: Edge-based features
        - statistical: Statistical features
    """
    return {
        'glcm': calculate_glcm_features(tile_image),
        'lbp': calculate_lbp_features(tile_image),
        'edges': calculate_edge_features(tile_image),
        'statistical': calculate_statistical_features(tile_image)
    }

def compare_texture_features(features1: Dict, features2: Dict) -> float:
    """
    Συγκρίνει δύο sets of texture features

    Args:
        features1: Texture features του πρώτου tile
        features2: Texture features του δεύτερου tile

    Returns:
        Similarity score (0-1, όπου 1 = πανομοιότυπα)
    """
    # Normalize και σύγκριση GLCM features
    glcm_keys = ['contrast', 'dissimilarity', 'homogeneity', 'energy', 'correlation']
    glcm_diffs = []

    for key in glcm_keys:
        val1 = features1['glcm'][key]
        val2 = features2['glcm'][key]
        # Normalized difference
        max_val = max(abs(val1), abs(val2), 1e-10)
        diff = abs(val1 - val2) / max_val
        glcm_diffs.append(diff)

    glcm_similarity = 1 - np.mean(glcm_diffs)

    # Σύγκριση LBP histogram (cosine similarity)
    hist1 = np.array(features1['lbp']['histogram'])
    hist2 = np.array(features2['lbp']['histogram'])

    dot_product = np.dot(hist1, hist2)
    norm1 = np.linalg.norm(hist1)
    norm2 = np.linalg.norm(hist2)
    lbp_similarity = dot_product / (norm1 * norm2) if norm1 > 0 and norm2 > 0 else 0

    # Συνολικό similarity (weighted average)
    total_similarity = 0.6 * glcm_similarity + 0.4 * lbp_similarity

    return float(total_similarity)
