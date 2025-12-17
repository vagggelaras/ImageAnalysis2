import cv2
import numpy as np
from typing import Dict, List

def calculate_tile_histogram(tile_image: np.ndarray, bins: int = 256) -> Dict:
    """
    Υπολογίζει το color histogram για ένα tile

    Args:
        tile_image: Η εικόνα του tile σε BGR format (numpy array)
        bins: Αριθμός bins για το histogram (default: 256)

    Returns:
        Dictionary με το histogram για κάθε κανάλι χρώματος
    """
    # Υπολογισμός histogram για κάθε κανάλι (Blue, Green, Red)
    hist_blue = cv2.calcHist([tile_image], [0], None, [bins], [0, 256])
    hist_green = cv2.calcHist([tile_image], [1], None, [bins], [0, 256])
    hist_red = cv2.calcHist([tile_image], [2], None, [bins], [0, 256])

    return {
        'blue': hist_blue.flatten().tolist(),
        'green': hist_green.flatten().tolist(),
        'red': hist_red.flatten().tolist(),
        'bins': bins
    }

def calculate_tile_histogram_normalized(tile_image: np.ndarray, bins: int = 256) -> Dict:
    """
    Υπολογίζει normalized histogram (0-1) για ένα tile
    """
    hist_blue = cv2.calcHist([tile_image], [0], None, [bins], [0, 256])
    hist_green = cv2.calcHist([tile_image], [1], None, [bins], [0, 256])
    hist_red = cv2.calcHist([tile_image], [2], None, [bins], [0, 256])

    # Normalize
    cv2.normalize(hist_blue, hist_blue, 0, 1, cv2.NORM_MINMAX)
    cv2.normalize(hist_green, hist_green, 0, 1, cv2.NORM_MINMAX)
    cv2.normalize(hist_red, hist_red, 0, 1, cv2.NORM_MINMAX)

    return {
        'blue': hist_blue.flatten().tolist(),
        'green': hist_green.flatten().tolist(),
        'red': hist_red.flatten().tolist(),
        'bins': bins,
        'normalized': True
    }

def compare_tile_histograms(hist1: Dict, hist2: Dict, method: str = 'correlation') -> float:
    """
    Συγκρίνει δύο histograms και επιστρέφει similarity score

    Args:
        hist1: Πρώτο histogram
        hist2: Δεύτερο histogram
        method: Μέθοδος σύγκρισης ('correlation', 'chi_square', 'intersection', 'bhattacharyya')

    Returns:
        Similarity score (για correlation και intersection: όσο πιο κοντά στο 1, τόσο πιο όμοια)
    """
    methods = {
        'correlation': cv2.HISTCMP_CORREL,
        'chi_square': cv2.HISTCMP_CHISQR,
        'intersection': cv2.HISTCMP_INTERSECT,
        'bhattacharyya': cv2.HISTCMP_BHATTACHARYYA
    }

    if method not in methods:
        raise ValueError(f"Invalid method. Choose from: {list(methods.keys())}")

    # Σύγκριση για κάθε κανάλι
    scores = []
    for color in ['blue', 'green', 'red']:
        h1 = np.array(hist1[color], dtype=np.float32)
        h2 = np.array(hist2[color], dtype=np.float32)
        score = cv2.compareHist(h1, h2, methods[method])
        scores.append(score)

    # Μέσος όρος των 3 καναλιών
    return float(np.mean(scores))
