# Πώς να χρησιμοποιήσεις το Python Backend API από το React

## Βήμα 1: Ξεκίνα το Backend

Πρώτα πρέπει να τρέχει το Python backend:

```bash
cd backend
python main.py
```

Το API θα είναι διαθέσιμο στο `http://localhost:8000`

## Βήμα 2: Import το API Service

Στο component σου:

```javascript
import { getTileHistogram, getAllTilesHistograms } from "../src/services/imageApi"
```

## Βήμα 3: Χρήση

### Παράδειγμα 1: Histogram για ένα tile

```javascript
import { getTileHistogram } from "../src/services/imageApi"

const MyComponent = () => {
    const handleCalculate = async (tileUrl) => {
        try {
            const histogram = await getTileHistogram(tileUrl, 256)
            console.log('Blue channel:', histogram.blue)
            console.log('Green channel:', histogram.green)
            console.log('Red channel:', histogram.red)
        } catch (error) {
            console.error('Error:', error)
        }
    }

    return <button onClick={() => handleCalculate(tile.url)}>Calculate</button>
}
```

### Παράδειγμα 2: Histograms για όλα τα tiles

```javascript
import { getAllTilesHistograms } from "../src/services/imageApi"
import { useContext } from "react"
import { ImageContext } from "../src/App"

const MyComponent = () => {
    const { tiles } = useContext(ImageContext)

    const handleCalculateAll = async () => {
        try {
            const results = await getAllTilesHistograms(tiles, 256)
            // results = [{tileId: 0, histogram: {...}}, ...]
            results.forEach(item => {
                console.log(`Tile ${item.tileId}:`, item.histogram)
            })
        } catch (error) {
            console.error('Error:', error)
        }
    }

    return <button onClick={handleCalculateAll}>Calculate All</button>
}
```

### Παράδειγμα 3: Check αν το backend τρέχει

```javascript
import { checkBackendHealth } from "../src/services/imageApi"

const checkStatus = async () => {
    const isHealthy = await checkBackendHealth()
    if (isHealthy) {
        console.log('Backend is running!')
    } else {
        console.log('Backend is not running. Start it with: python main.py')
    }
}
```

## Δομή του Histogram Response

```javascript
{
    blue: [0, 12, 45, 67, ...],    // 256 τιμές (ή όσα bins έχεις ορίσει)
    green: [5, 23, 67, 89, ...],   // 256 τιμές
    red: [3, 18, 52, 71, ...],     // 256 τιμές
    bins: 256
}
```

Κάθε array περιέχει το count των pixels για κάθε intensity level (0-255).

## TileHistograms Component

Υπάρχει ήδη ένα έτοιμο component (`TileHistograms.jsx`) που:
- Ελέγχει αν το backend τρέχει
- Υπολογίζει histograms για όλα τα tiles
- Εμφανίζει preview των tiles και μπορείς να κάνεις click για να δεις το histogram του καθενός

Το component είναι ήδη προσθετημένο στο `App.jsx`.

## Troubleshooting

**Error: "Failed to fetch"**
- Σιγουρέψου ότι το Python backend τρέχει στο port 8000
- Τσέκαρε αν υπάρχει CORS error στο console

**Error: "HTTP 500"**
- Δες το terminal του backend για το error message
- Σιγουρέψου ότι έχεις εγκαταστήσει όλα τα dependencies (`pip install -r requirements.txt`)
