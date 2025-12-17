import numpy as np
from typing import Dict, List, Tuple
import cv2

def calculate_histogram_similarity(hist1: Dict, hist2: Dict) -> float:
    """
    Υπολογίζει ομοιότητα μεταξύ δύο color histograms

    Args:
        hist1: Histogram του πρώτου border
        hist2: Histogram του δεύτερου border

    Returns:
        Similarity score (0-1, όπου 1 = πανομοιότυπα)
    """
    try:
        # Correlation για κάθε κανάλι
        scores = []
        for color in ['blue', 'green', 'red']:
            h1 = np.array(hist1[color], dtype=np.float32)
            h2 = np.array(hist2[color], dtype=np.float32)

            # Normalize histograms
            h1 = h1 / (np.sum(h1) + 1e-10)
            h2 = h2 / (np.sum(h2) + 1e-10)

            score = cv2.compareHist(h1, h2, cv2.HISTCMP_CORREL)
            scores.append(score)

        # Μέσος όρος των 3 καναλιών
        # Μετατροπή από [-1, 1] σε [0, 1]
        mean_score = np.mean(scores)
        normalized_score = (mean_score + 1) / 2

        return float(max(0, min(1, normalized_score)))
    except:
        return 0.0

def calculate_texture_similarity(texture1: Dict, texture2: Dict) -> float:
    """
    Υπολογίζει ομοιότητα μεταξύ δύο texture features

    Args:
        texture1: Texture features του πρώτου border
        texture2: Texture features του δεύτερου border

    Returns:
        Similarity score (0-1)
    """
    try:
        # Έλεγχος για errors
        if 'error' in texture1 or 'error' in texture2:
            return 0.0

        # Simplified features
        if 'contrast' in texture1 and 'glcm' not in texture1:
            keys = ['contrast', 'homogeneity', 'energy', 'mean', 'std', 'entropy']
            differences = []

            for key in keys:
                if key in texture1 and key in texture2:
                    val1 = texture1[key]
                    val2 = texture2[key]

                    # Normalize by max value to get percentage difference
                    max_val = max(abs(val1), abs(val2), 1e-10)
                    diff = abs(val1 - val2) / max_val
                    differences.append(diff)

            if differences:
                similarity = 1 - np.mean(differences)
                return float(max(0, min(1, similarity)))

        return 0.0
    except:
        return 0.0

def calculate_border_distance(tile1_border: Dict, tile2_border: Dict,
                              color_weight: float = 0.6, texture_weight: float = 0.4) -> float:
    """
    Υπολογίζει την "απόσταση" μεταξύ δύο borders (lower = πιο όμοια)

    Args:
        tile1_border: Border του πρώτου tile με 'histogram' και 'texture'
        tile2_border: Border του δεύτερου tile με 'histogram' και 'texture'
        color_weight: Βάρος του color histogram
        texture_weight: Βάρος του texture

    Returns:
        Distance (0-1, όπου 0 = πανομοιότυπα, 1 = πολύ διαφορετικά)
    """
    # Υπολογισμός similarities
    color_sim = 0.0
    texture_sim = 0.0

    if 'histogram' in tile1_border and 'histogram' in tile2_border:
        color_sim = calculate_histogram_similarity(tile1_border['histogram'], tile2_border['histogram'])

    if 'texture' in tile1_border and 'texture' in tile2_border:
        texture_sim = calculate_texture_similarity(tile1_border['texture'], tile2_border['texture'])

    # Combined similarity
    combined_similarity = color_weight * color_sim + texture_weight * texture_sim

    # Μετατροπή από similarity σε distance
    distance = 1 - combined_similarity

    return float(distance)

def calculate_all_tile_distances(tiles_data: List[Dict], color_weight: float = 0.6,
                                 texture_weight: float = 0.4) -> Dict:
    """
    Υπολογίζει αποστάσεις μεταξύ όλων των ζευγών tiles

    Args:
        tiles_data: List με δεδομένα για κάθε tile:
                   [{
                       'tile_id': 0,
                       'borders': {
                           'top': {'histogram': {...}, 'texture': {...}},
                           'bottom': {...},
                           'left': {...},
                           'right': {...}
                       }
                   }, ...]
        color_weight: Βάρος color histogram
        texture_weight: Βάρος texture

    Returns:
        Dictionary με αποστάσεις:
        {
            'distances': {
                '0_right->1_left': 0.23,
                '0_bottom->2_top': 0.45,
                ...
            },
            'best_matches': {
                0: {'right': {'tile_id': 5, 'distance': 0.12}, ...},
                1: {...},
                ...
            }
        }
    """
    n_tiles = len(tiles_data)
    distances = {}
    best_matches = {}

    # Mapping borders to their opposites
    opposite = {'top': 'bottom', 'bottom': 'top', 'left': 'right', 'right': 'left'}

    # Για κάθε tile
    for i, tile1 in enumerate(tiles_data):
        tile1_id = tile1['tile_id']
        best_matches[tile1_id] = {}

        # Για κάθε border του tile
        for border1_side in ['top', 'bottom', 'left', 'right']:
            best_distance = float('inf')
            best_match_id = None

            tile1_border = tile1['borders'][border1_side]
            opposite_side = opposite[border1_side]

            # Σύγκριση με όλα τα άλλα tiles
            for j, tile2 in enumerate(tiles_data):
                tile2_id = tile2['tile_id']

                # Skip το ίδιο tile
                if tile1_id == tile2_id:
                    continue

                tile2_border = tile2['borders'][opposite_side]

                # Υπολογισμός απόστασης
                distance = calculate_border_distance(tile1_border, tile2_border,
                                                    color_weight, texture_weight)

                # Αποθήκευση
                key = f"{tile1_id}_{border1_side}->{tile2_id}_{opposite_side}"
                distances[key] = distance

                # Ενημέρωση best match
                if distance < best_distance:
                    best_distance = distance
                    best_match_id = tile2_id

            # Αποθήκευση best match για αυτό το border
            best_matches[tile1_id][border1_side] = {
                'tile_id': best_match_id,
                'distance': best_distance,
                'similarity': 1 - best_distance
            }

    return {
        'distances': distances,
        'best_matches': best_matches,
        'stats': {
            'total_comparisons': len(distances),
            'n_tiles': n_tiles,
            'color_weight': color_weight,
            'texture_weight': texture_weight
        }
    }

def get_top_k_matches(tiles_data: List[Dict], tile_id: int, border_side: str,
                      k: int = 5, color_weight: float = 0.6, texture_weight: float = 0.4) -> List[Dict]:
    """
    Βρίσκει τα top-k καλύτερα matches για ένα συγκεκριμένο border

    Args:
        tiles_data: Δεδομένα όλων των tiles
        tile_id: ID του tile που ψάχνουμε
        border_side: Ποιο border ('top', 'bottom', 'left', 'right')
        k: Πόσα matches να επιστρέψει
        color_weight: Βάρος color
        texture_weight: Βάρος texture

    Returns:
        List με top-k matches:
        [
            {'tile_id': 5, 'distance': 0.12, 'similarity': 0.88},
            {'tile_id': 3, 'distance': 0.18, 'similarity': 0.82},
            ...
        ]
    """
    # Βρες το target tile
    target_tile = next((t for t in tiles_data if t['tile_id'] == tile_id), None)
    if not target_tile:
        return []

    target_border = target_tile['borders'][border_side]
    opposite = {'top': 'bottom', 'bottom': 'top', 'left': 'right', 'right': 'left'}
    opposite_side = opposite[border_side]

    matches = []

    # Σύγκριση με όλα τα άλλα tiles
    for tile in tiles_data:
        if tile['tile_id'] == tile_id:
            continue

        other_border = tile['borders'][opposite_side]
        distance = calculate_border_distance(target_border, other_border, color_weight, texture_weight)

        matches.append({
            'tile_id': tile['tile_id'],
            'distance': distance,
            'similarity': 1 - distance
        })

    # Ταξινόμηση κατά distance (ascending - πιο κοντά = καλύτερο)
    matches.sort(key=lambda x: x['distance'])

    # Επιστροφή top-k
    return matches[:k]

def create_distance_matrix(tiles_data: List[Dict], border_pair: Tuple[str, str] = ('right', 'left'),
                           color_weight: float = 0.6, texture_weight: float = 0.4) -> np.ndarray:
    """
    Δημιουργεί distance matrix για ένα συγκεκριμένο border pair

    Args:
        tiles_data: Δεδομένα tiles
        border_pair: Tuple με (border1, border2), π.χ. ('right', 'left')
        color_weight: Βάρος color
        texture_weight: Βάρος texture

    Returns:
        numpy array NxN όπου matrix[i][j] = distance από tile i border1 -> tile j border2
    """
    n_tiles = len(tiles_data)
    matrix = np.zeros((n_tiles, n_tiles))

    border1_side, border2_side = border_pair

    for i, tile1 in enumerate(tiles_data):
        tile1_border = tile1['borders'][border1_side]

        for j, tile2 in enumerate(tiles_data):
            if i == j:
                matrix[i][j] = float('inf')  # Ίδιο tile
                continue

            tile2_border = tile2['borders'][border2_side]
            distance = calculate_border_distance(tile1_border, tile2_border, color_weight, texture_weight)
            matrix[i][j] = distance

    return matrix
