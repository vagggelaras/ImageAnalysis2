const API_BASE_URL = 'http://localhost:8000'

/**
 * Μετατρέπει data URL σε File object
 */
function dataURLtoFile(dataUrl, filename) {
    const arr = dataUrl.split(',')
    const mime = arr[0].match(/:(.*?);/)[1]
    const bstr = atob(arr[1])
    let n = bstr.length
    const u8arr = new Uint8Array(n)
    while (n--) {
        u8arr[n] = bstr.charCodeAt(n)
    }
    return new File([u8arr], filename, { type: mime })
}

/**
 * Υπολογίζει histogram για ένα tile
 *
 * @param {string} imageDataUrl - Data URL της εικόνας (π.χ. από canvas.toDataURL())
 * @param {number} bins - Αριθμός bins για το histogram (default: 256)
 * @returns {Promise} - Επιστρέφει το histogram data
 */
export async function getTileHistogram(imageDataUrl, bins = 256) {
    try {
        // Μετατροπή data URL σε File
        const file = dataURLtoFile(imageDataUrl, 'tile.png')

        // Δημιουργία FormData
        const formData = new FormData()
        formData.append('file', file)

        // API call
        const response = await fetch(`${API_BASE_URL}/api/tile-histogram?bins=${bins}`, {
            method: 'POST',
            body: formData
        })

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`)
        }

        const result = await response.json()
        return result.data

    } catch (error) {
        console.error('Error getting tile histogram:', error)
        throw error
    }
}

/**
 * Υπολογίζει normalized histogram για ένα tile
 *
 * @param {string} imageDataUrl - Data URL της εικόνας
 * @param {number} bins - Αριθμός bins (default: 256)
 * @returns {Promise} - Επιστρέφει το normalized histogram data
 */
export async function getTileHistogramNormalized(imageDataUrl, bins = 256) {
    try {
        const file = dataURLtoFile(imageDataUrl, 'tile.png')
        const formData = new FormData()
        formData.append('file', file)

        const response = await fetch(`${API_BASE_URL}/api/tile-histogram-normalized?bins=${bins}`, {
            method: 'POST',
            body: formData
        })

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`)
        }

        const result = await response.json()
        return result.data

    } catch (error) {
        console.error('Error getting normalized histogram:', error)
        throw error
    }
}

/**
 * Υπολογίζει histograms για όλα τα tiles
 *
 * @param {Array} tiles - Array με tiles που έχουν property 'url' (data URL)
 * @param {number} bins - Αριθμός bins
 * @returns {Promise<Array>} - Array με histograms για κάθε tile
 */
export async function getAllTilesHistograms(tiles, bins = 256) {
    try {
        const histogramPromises = tiles.map(tile =>
            getTileHistogram(tile.url, bins)
                .then(histogram => ({
                    tileId: tile.id,
                    histogram: histogram
                }))
        )

        return await Promise.all(histogramPromises)

    } catch (error) {
        console.error('Error getting all tiles histograms:', error)
        throw error
    }
}

/**
 * Υπολογίζει histograms για κάθε πλευρά του tile (top, bottom, left, right)
 *
 * @param {string} imageDataUrl - Data URL της εικόνας του tile
 * @param {number} borderWidth - Πλάτος του border σε pixels (default: 5)
 * @param {number} bins - Αριθμός bins (default: 256)
 * @returns {Promise} - Επιστρέφει histograms για κάθε border
 */
export async function getBorderHistograms(imageDataUrl, borderWidth = 5, bins = 256) {
    try {
        const file = dataURLtoFile(imageDataUrl, 'tile.png')
        const formData = new FormData()
        formData.append('file', file)

        const response = await fetch(`${API_BASE_URL}/api/border-histograms?border_width=${borderWidth}&bins=${bins}`, {
            method: 'POST',
            body: formData
        })

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`)
        }

        const result = await response.json()
        return result.data

    } catch (error) {
        console.error('Error getting border histograms:', error)
        throw error
    }
}

/**
 * Υπολογίζει normalized histograms για κάθε πλευρά του tile
 *
 * @param {string} imageDataUrl - Data URL της εικόνας
 * @param {number} borderWidth - Πλάτος του border σε pixels
 * @param {number} bins - Αριθμός bins
 * @returns {Promise} - Επιστρέφει normalized histograms για κάθε border
 */
export async function getBorderHistogramsNormalized(imageDataUrl, borderWidth = 5, bins = 256) {
    try {
        const file = dataURLtoFile(imageDataUrl, 'tile.png')
        const formData = new FormData()
        formData.append('file', file)

        const response = await fetch(`${API_BASE_URL}/api/border-histograms-normalized?border_width=${borderWidth}&bins=${bins}`, {
            method: 'POST',
            body: formData
        })

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`)
        }

        const result = await response.json()
        return result.data

    } catch (error) {
        console.error('Error getting normalized border histograms:', error)
        throw error
    }
}

/**
 * Υπολογίζει border histograms για όλα τα tiles
 *
 * @param {Array} tiles - Array με tiles που έχουν property 'url'
 * @param {number} borderWidth - Πλάτος του border
 * @param {number} bins - Αριθμός bins
 * @returns {Promise<Array>} - Array με border histograms για κάθε tile
 */
export async function getAllTilesBorderHistograms(tiles, borderWidth = 5, bins = 256) {
    try {
        const histogramPromises = tiles.map(tile =>
            getBorderHistograms(tile.url, borderWidth, bins)
                .then(borderHistograms => ({
                    tileId: tile.id,
                    borderHistograms: borderHistograms
                }))
        )

        return await Promise.all(histogramPromises)

    } catch (error) {
        console.error('Error getting all tiles border histograms:', error)
        throw error
    }
}

/**
 * Υπολογίζει texture features για ένα tile
 *
 * @param {string} imageDataUrl - Data URL της εικόνας του tile
 * @returns {Promise} - Επιστρέφει texture features (GLCM, LBP, edges, statistical)
 */
export async function getTextureFeatures(imageDataUrl) {
    try {
        const file = dataURLtoFile(imageDataUrl, 'tile.png')
        const formData = new FormData()
        formData.append('file', file)

        const response = await fetch(`${API_BASE_URL}/api/texture-features`, {
            method: 'POST',
            body: formData
        })

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`)
        }

        const result = await response.json()
        return result.data

    } catch (error) {
        console.error('Error getting texture features:', error)
        throw error
    }
}

/**
 * Υπολογίζει texture features για όλα τα tiles
 *
 * @param {Array} tiles - Array με tiles που έχουν property 'url'
 * @returns {Promise<Array>} - Array με texture features για κάθε tile
 */
export async function getAllTilesTextureFeatures(tiles) {
    try {
        const featurePromises = tiles.map(tile =>
            getTextureFeatures(tile.url)
                .then(features => ({
                    tileId: tile.id,
                    textureFeatures: features
                }))
        )

        return await Promise.all(featurePromises)

    } catch (error) {
        console.error('Error getting all tiles texture features:', error)
        throw error
    }
}

/**
 * Υπολογίζει texture features για κάθε border strip του tile
 *
 * @param {string} imageDataUrl - Data URL της εικόνας του tile
 * @param {number} borderWidth - Πλάτος του border σε pixels
 * @param {boolean} simplified - Αν true, επιστρέφει μόνο βασικά features (πιο γρήγορο)
 * @returns {Promise} - Επιστρέφει texture features για κάθε border
 */
export async function getBorderTextureFeatures(imageDataUrl, borderWidth = 5, simplified = false) {
    try {
        const file = dataURLtoFile(imageDataUrl, 'tile.png')
        const formData = new FormData()
        formData.append('file', file)

        const response = await fetch(`${API_BASE_URL}/api/border-texture-features?border_width=${borderWidth}&simplified=${simplified}`, {
            method: 'POST',
            body: formData
        })

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`)
        }

        const result = await response.json()
        return result.data

    } catch (error) {
        console.error('Error getting border texture features:', error)
        throw error
    }
}

/**
 * Υπολογίζει border texture features για όλα τα tiles
 *
 * @param {Array} tiles - Array με tiles
 * @param {number} borderWidth - Πλάτος του border
 * @param {boolean} simplified - Αν true, χρησιμοποιεί simplified version
 * @returns {Promise<Array>} - Array με border texture features για κάθε tile
 */
export async function getAllTilesBorderTextureFeatures(tiles, borderWidth = 5, simplified = true) {
    try {
        const featurePromises = tiles.map(tile =>
            getBorderTextureFeatures(tile.url, borderWidth, simplified)
                .then(borderFeatures => ({
                    tileId: tile.id,
                    borderTextureFeatures: borderFeatures
                }))
        )

        return await Promise.all(featurePromises)

    } catch (error) {
        console.error('Error getting all tiles border texture features:', error)
        throw error
    }
}

/**
 * Health check του backend
 *
 * @returns {Promise<boolean>} - true αν το backend τρέχει
 */
export async function checkBackendHealth() {
    try {
        const response = await fetch(`${API_BASE_URL}/`)
        const data = await response.json()
        return data.status === 'ok'
    } catch (error) {
        console.error('Backend is not running:', error)
        return false
    }
}
