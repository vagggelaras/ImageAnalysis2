import cv2
import numpy as np
from typing import Dict
from texture_features import (
    calculate_glcm_features,
    calculate_lbp_features,
    calculate_edge_features,
    calculate_statistical_features
)

def calculate_border_texture_features(tile_image: np.ndarray, border_width: int = 5) -> Dict:
    """
    Υπολογίζει texture features για κάθε border strip του tile

    Args:
        tile_image: BGR image (numpy array)
        border_width: Πλάτος του border σε pixels (default: 5)

    Returns:
        Dictionary με texture features για κάθε border:
        {
            'top': {glcm, lbp, edges, statistical},
            'bottom': {...},
            'left': {...},
            'right': {...}
        }
    """
    h, w = tile_image.shape[:2]

    # Εξαγωγή κάθε border strip
    borders = {
        'top': tile_image[:border_width, :],
        'bottom': tile_image[h-border_width:, :],
        'left': tile_image[:, :border_width],
        'right': tile_image[:, w-border_width:]
    }

    result = {}

    # Υπολογισμός texture features για κάθε border
    for border_name, border_img in borders.items():
        # Έλεγχος αν το border είναι αρκετά μεγάλο
        if border_img.shape[0] < 3 or border_img.shape[1] < 3:
            # Πολύ μικρό border για texture analysis
            result[border_name] = {
                'error': 'Border too small for texture analysis',
                'border_width': border_width
            }
            continue

        try:
            result[border_name] = {
                'glcm': calculate_glcm_features(border_img),
                'lbp': calculate_lbp_features(border_img, radius=1, n_points=8),
                'edges': calculate_edge_features(border_img),
                'statistical': calculate_statistical_features(border_img),
                'border_width': border_width
            }
        except Exception as e:
            result[border_name] = {
                'error': str(e),
                'border_width': border_width
            }

    return result

def calculate_simplified_border_texture(tile_image: np.ndarray, border_width: int = 5) -> Dict:
    """
    Υπολογίζει απλοποιημένα texture features για borders (πιο γρήγορο)

    Χρησιμοποιεί μόνο τα πιο σημαντικά features για matching

    Args:
        tile_image: BGR image
        border_width: Πλάτος του border

    Returns:
        Dictionary με απλοποιημένα features
    """
    h, w = tile_image.shape[:2]

    borders = {
        'top': tile_image[:border_width, :],
        'bottom': tile_image[h-border_width:, :],
        'left': tile_image[:, :border_width],
        'right': tile_image[:, w-border_width:]
    }

    result = {}

    for border_name, border_img in borders.items():
        if border_img.shape[0] < 3 or border_img.shape[1] < 3:
            result[border_name] = {'error': 'Border too small'}
            continue

        try:
            # Μόνο τα πιο σημαντικά features
            glcm = calculate_glcm_features(border_img)
            statistical = calculate_statistical_features(border_img)

            result[border_name] = {
                'contrast': glcm['contrast'],
                'homogeneity': glcm['homogeneity'],
                'energy': glcm['energy'],
                'mean': statistical['mean'],
                'std': statistical['std'],
                'entropy': statistical['entropy'],
                'border_width': border_width
            }
        except Exception as e:
            result[border_name] = {'error': str(e)}

    return result

def compare_border_textures(border1_features: Dict, border2_features: Dict) -> float:
    """
    Συγκρίνει texture features δύο borders

    Args:
        border1_features: Features του πρώτου border
        border2_features: Features του δεύτερου border

    Returns:
        Similarity score (0-1, όπου 1 = πολύ όμοια)
    """
    # Έλεγχος για errors
    if 'error' in border1_features or 'error' in border2_features:
        return 0.0

    # Αν έχουμε απλοποιημένα features
    if 'contrast' in border1_features and 'glcm' not in border1_features:
        keys = ['contrast', 'homogeneity', 'energy', 'mean', 'std', 'entropy']
        differences = []

        for key in keys:
            if key in border1_features and key in border2_features:
                val1 = border1_features[key]
                val2 = border2_features[key]
                max_val = max(abs(val1), abs(val2), 1e-10)
                diff = abs(val1 - val2) / max_val
                differences.append(diff)

        if differences:
            return float(1 - np.mean(differences))
        else:
            return 0.0

    # Αν έχουμε πλήρη features
    if 'glcm' in border1_features and 'glcm' in border2_features:
        # Σύγκριση GLCM
        glcm_keys = ['contrast', 'homogeneity', 'energy', 'correlation']
        glcm_diffs = []

        for key in glcm_keys:
            val1 = border1_features['glcm'][key]
            val2 = border2_features['glcm'][key]
            max_val = max(abs(val1), abs(val2), 1e-10)
            diff = abs(val1 - val2) / max_val
            glcm_diffs.append(diff)

        # Σύγκριση Statistical
        stat_keys = ['mean', 'std', 'entropy']
        stat_diffs = []

        for key in stat_keys:
            val1 = border1_features['statistical'][key]
            val2 = border2_features['statistical'][key]
            max_val = max(abs(val1), abs(val2), 1e-10)
            diff = abs(val1 - val2) / max_val
            stat_diffs.append(diff)

        # Weighted average
        glcm_similarity = 1 - np.mean(glcm_diffs)
        stat_similarity = 1 - np.mean(stat_diffs)
        total_similarity = 0.7 * glcm_similarity + 0.3 * stat_similarity

        return float(total_similarity)

    return 0.0

def find_matching_borders_by_texture(tiles_border_features: list, tile_id: int, border_side: str, threshold: float = 0.7) -> list:
    """
    Βρίσκει ποια tiles έχουν matching borders βάσει texture

    Args:
        tiles_border_features: List με border texture features όλων των tiles
                              Κάθε στοιχείο: {'tile_id': X, 'border_features': {...}}
        tile_id: Το ID του tile που ψάχνουμε
        border_side: Ποια πλευρά ψάχνουμε ('top', 'bottom', 'left', 'right')
        threshold: Minimum similarity score για match (0-1)

    Returns:
        List με matching tiles ταξινομημένα κατά similarity
        [{'tile_id': X, 'score': 0.85}, ...]
    """
    # Βρες το tile που ψάχνουμε
    target_tile = next((t for t in tiles_border_features if t['tile_id'] == tile_id), None)
    if not target_tile:
        return []

    target_border = target_tile['border_features'][border_side]

    # Αντίθετες πλευρές για matching
    opposite = {'top': 'bottom', 'bottom': 'top', 'left': 'right', 'right': 'left'}
    opposite_side = opposite[border_side]

    matches = []

    # Σύγκριση με όλα τα άλλα tiles
    for tile in tiles_border_features:
        if tile['tile_id'] == tile_id:
            continue

        other_border = tile['border_features'][opposite_side]
        score = compare_border_textures(target_border, other_border)

        if score >= threshold:
            matches.append({
                'tile_id': tile['tile_id'],
                'score': score,
                'border_compared': f"{border_side} <-> {opposite_side}"
            })

    # Ταξινόμηση κατά score (descending)
    matches.sort(key=lambda x: x['score'], reverse=True)

    return matches

def calculate_combined_border_score(color_histogram_score: float, texture_score: float,
                                   color_weight: float = 0.6, texture_weight: float = 0.4) -> float:
    """
    Συνδυάζει color histogram score και texture score για τελικό matching score

    Args:
        color_histogram_score: Score από σύγκριση color histograms (0-1)
        texture_score: Score από σύγκριση texture features (0-1)
        color_weight: Βάρος του color score (default: 0.6)
        texture_weight: Βάρος του texture score (default: 0.4)

    Returns:
        Combined score (0-1)
    """
    return float(color_weight * color_histogram_score + texture_weight * texture_score)
