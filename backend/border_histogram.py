import cv2
import numpy as np
from typing import Dict

def calculate_border_histograms(tile_image: np.ndarray, border_width: int = 5, bins: int = 256) -> Dict:
    """
    Υπολογίζει το color histogram για κάθε πλευρά του tile (top, bottom, left, right)

    Args:
        tile_image: Η εικόνα του tile σε BGR format (numpy array)
        border_width: Πλάτος του border σε pixels (default: 5)
        bins: Αριθμός bins για το histogram (default: 256)

    Returns:
        Dictionary με histograms για κάθε border:
        {
            'top': {'blue': [...], 'green': [...], 'red': [...], 'bins': 256},
            'bottom': {...},
            'left': {...},
            'right': {...}
        }
    """
    h, w = tile_image.shape[:2]

    # Εξαγωγή κάθε border strip
    top_border = tile_image[:border_width, :]           # Πάνω πλευρά
    bottom_border = tile_image[h-border_width:, :]      # Κάτω πλευρά
    left_border = tile_image[:, :border_width]          # Αριστερή πλευρά
    right_border = tile_image[:, w-border_width:]       # Δεξιά πλευρά

    # Dictionary για όλα τα borders
    borders = {
        'top': top_border,
        'bottom': bottom_border,
        'left': left_border,
        'right': right_border
    }

    result = {}

    # Υπολογισμός histogram για κάθε border
    for border_name, border_img in borders.items():
        # Histogram για Blue channel
        hist_b = cv2.calcHist([border_img], [0], None, [bins], [0, 256])
        # Histogram για Green channel
        hist_g = cv2.calcHist([border_img], [1], None, [bins], [0, 256])
        # Histogram για Red channel
        hist_r = cv2.calcHist([border_img], [2], None, [bins], [0, 256])

        result[border_name] = {
            'blue': hist_b.flatten().tolist(),
            'green': hist_g.flatten().tolist(),
            'red': hist_r.flatten().tolist(),
            'bins': bins,
            'border_width': border_width
        }

    return result

def calculate_border_histograms_normalized(tile_image: np.ndarray, border_width: int = 5, bins: int = 256) -> Dict:
    """
    Υπολογίζει normalized histograms (0-1) για κάθε πλευρά του tile

    Χρήσιμο για σύγκριση borders μεταξύ διαφορετικών tiles
    """
    h, w = tile_image.shape[:2]

    # Εξαγωγή borders
    borders = {
        'top': tile_image[:border_width, :],
        'bottom': tile_image[h-border_width:, :],
        'left': tile_image[:, :border_width],
        'right': tile_image[:, w-border_width:]
    }

    result = {}

    for border_name, border_img in borders.items():
        hist_b = cv2.calcHist([border_img], [0], None, [bins], [0, 256])
        hist_g = cv2.calcHist([border_img], [1], None, [bins], [0, 256])
        hist_r = cv2.calcHist([border_img], [2], None, [bins], [0, 256])

        # Normalize histograms
        cv2.normalize(hist_b, hist_b, 0, 1, cv2.NORM_MINMAX)
        cv2.normalize(hist_g, hist_g, 0, 1, cv2.NORM_MINMAX)
        cv2.normalize(hist_r, hist_r, 0, 1, cv2.NORM_MINMAX)

        result[border_name] = {
            'blue': hist_b.flatten().tolist(),
            'green': hist_g.flatten().tolist(),
            'red': hist_r.flatten().tolist(),
            'bins': bins,
            'border_width': border_width,
            'normalized': True
        }

    return result

def compare_borders(border_hist1: Dict, border_hist2: Dict, method: str = 'correlation') -> float:
    """
    Συγκρίνει δύο border histograms και επιστρέφει similarity score

    Args:
        border_hist1: Histogram του πρώτου border
        border_hist2: Histogram του δεύτερου border
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
        h1 = np.array(border_hist1[color], dtype=np.float32)
        h2 = np.array(border_hist2[color], dtype=np.float32)
        score = cv2.compareHist(h1, h2, methods[method])
        scores.append(score)

    # Μέσος όρος των 3 καναλιών
    return float(np.mean(scores))

def find_matching_borders(tiles_borders: list, tile_id: int, border_side: str, threshold: float = 0.8) -> list:
    """
    Βρίσκει ποια tiles έχουν matching borders με το δοθέν tile

    Args:
        tiles_borders: List με border histograms όλων των tiles
                      Κάθε στοιχείο: {'tile_id': X, 'borders': {...}}
        tile_id: Το ID του tile που ψάχνουμε
        border_side: Ποια πλευρά ψάχνουμε ('top', 'bottom', 'left', 'right')
        threshold: Minimum similarity score για match (0-1)

    Returns:
        List με matching tiles ταξινομημένα κατά similarity
        [{'tile_id': X, 'score': 0.95}, ...]
    """
    # Βρες το tile που ψάχνουμε
    target_tile = next((t for t in tiles_borders if t['tile_id'] == tile_id), None)
    if not target_tile:
        return []

    target_border = target_tile['borders'][border_side]
    matches = []

    # Σύγκριση με όλα τα άλλα tiles
    # Για matching, συγκρίνουμε με την αντίθετη πλευρά
    opposite = {'top': 'bottom', 'bottom': 'top', 'left': 'right', 'right': 'left'}
    opposite_side = opposite[border_side]

    for tile in tiles_borders:
        if tile['tile_id'] == tile_id:
            continue  # Skip το ίδιο το tile

        other_border = tile['borders'][opposite_side]
        score = compare_borders(target_border, other_border, method='correlation')

        if score >= threshold:
            matches.append({
                'tile_id': tile['tile_id'],
                'score': score,
                'border_compared': f"{border_side} <-> {opposite_side}"
            })

    # Ταξινόμηση κατά score (descending)
    matches.sort(key=lambda x: x['score'], reverse=True)

    return matches
