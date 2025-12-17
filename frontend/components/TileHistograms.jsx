import { useState, useContext } from "react"
import { ImageContext } from "../src/App"
import { getTileHistogram, getAllTilesHistograms, checkBackendHealth } from "../src/services/imageApi"

export default function TileHistograms() {
    const { tiles, bins, setBins } = useContext(ImageContext)
    const [histograms, setHistograms] = useState([])
    const [loading, setLoading] = useState(false)
    const [backendStatus, setBackendStatus] = useState(null)

    const checkBackend = async () => {
        const isHealthy = await checkBackendHealth()
        setBackendStatus(isHealthy ? 'Running ✓' : 'Not running ✗')
    }

    const calculateHistograms = async () => {
        if (tiles.length === 0) {
            alert('Κάνε πρώτα shuffle την εικόνα!')
            return
        }

        setLoading(true)
        try {
            const results = await getAllTilesHistograms(tiles, bins)
            setHistograms(results)
            console.log('Histograms calculated:', results)
        } catch (error) {
            alert('Σφάλμα! Σιγουρέψου ότι το Python backend τρέχει στο http://localhost:8000')
            console.error(error)
        } finally {
            setLoading(false)
        }
    }

    const calculateSingleTileHistogram = async (tile) => {
        setLoading(true)
        try {
            const histogram = await getTileHistogram(tile.url, bins)
            console.log(`Histogram for tile ${tile.id}:`, histogram)
            alert(`Histogram υπολογίστηκε για tile ${tile.id}! Δες το console.`)
        } catch (error) {
            alert('Σφάλμα! Σιγουρέψου ότι το Python backend τρέχει.')
            console.error(error)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div style={{ marginTop: '20px', padding: '20px', border: '2px solid #ddd' }}>
            <h2>Tile Histograms</h2>

            <div style={{ marginBottom: '15px' }}>
                <button onClick={checkBackend} style={{ marginRight: '10px' }}>
                    Check Backend Status
                </button>
                {backendStatus && <span>{backendStatus}</span>}
            </div>

            <div style={{ marginBottom: '15px' }}>
                <label>
                    Histogram Bins:
                    <input
                        type="number"
                        value={bins}
                        onChange={(e) => setBins(parseInt(e.target.value) || 256)}
                        min="8"
                        max="256"
                        style={{ marginLeft: '10px', width: '80px' }}
                    />
                </label>
            </div>

            <div style={{ marginBottom: '15px' }}>
                <button
                    onClick={calculateHistograms}
                    disabled={loading || tiles.length === 0}
                    style={{
                        padding: '10px 20px',
                        backgroundColor: loading ? '#ccc' : '#4CAF50',
                        color: 'white',
                        border: 'none',
                        cursor: loading ? 'not-allowed' : 'pointer'
                    }}
                >
                    {loading ? 'Calculating...' : `Calculate Histograms for ${tiles.length} tiles`}
                </button>
            </div>

            {histograms.length > 0 && (
                <div>
                    <h3>Results: {histograms.length} histograms calculated</h3>
                    <p style={{ fontSize: '14px', color: '#666' }}>
                        Δες το console για τα πλήρη δεδομένα. Κάθε histogram έχει 3 arrays (blue, green, red) με {bins} τιμές το καθένα.
                    </p>

                    <div style={{ maxHeight: '400px', overflowY: 'auto', marginTop: '10px' }}>
                        {histograms.slice(0, 5).map((item, index) => {
                            // Υπολογισμός μέσης έντασης για κάθε κανάλι (weighted average)
                            const calculateMeanIntensity = (histogram) => {
                                const totalPixels = histogram.reduce((a, b) => a + b, 0)
                                const weightedSum = histogram.reduce((sum, count, intensity) => sum + (intensity * count), 0)
                                return (weightedSum / totalPixels).toFixed(2)
                            }

                            const totalPixels = item.histogram.blue.reduce((a, b) => a + b, 0)
                            const meanBlue = calculateMeanIntensity(item.histogram.blue)
                            const meanGreen = calculateMeanIntensity(item.histogram.green)
                            const meanRed = calculateMeanIntensity(item.histogram.red)
                            const brightness = ((parseFloat(meanRed) + parseFloat(meanGreen) + parseFloat(meanBlue)) / 3).toFixed(2)

                            return (
                                <div key={index} style={{ marginBottom: '15px', padding: '10px', backgroundColor: '#f5f5f5', border: '1px solid #ccc' }}>
                                    <h4>Tile ID: {item.tileId}</h4>
                                    <div style={{ fontSize: '12px' }}>
                                        <p><strong>Histogram Info:</strong></p>
                                        <p>• Bins: {item.histogram.blue.length} | Total pixels: {totalPixels}</p>

                                        <p style={{ marginTop: '10px' }}><strong>Mean Intensity (0-255):</strong></p>
                                        <p style={{ color: 'blue' }}>• Blue: {meanBlue}</p>
                                        <p style={{ color: 'green' }}>• Green: {meanGreen}</p>
                                        <p style={{ color: 'red' }}>• Red: {meanRed}</p>

                                        <p style={{ marginTop: '10px' }}><strong>Overall Brightness:</strong> {brightness}</p>
                                        <div style={{
                                            width: '100%',
                                            height: '10px',
                                            backgroundColor: '#ddd',
                                            marginTop: '5px'
                                        }}>
                                            <div style={{
                                                width: `${(brightness / 255) * 100}%`,
                                                height: '100%',
                                                backgroundColor: brightness > 128 ? '#4CAF50' : '#FF9800'
                                            }}></div>
                                        </div>
                                    </div>
                                </div>
                            )
                        })}
                        {histograms.length > 5 && (
                            <p style={{ fontStyle: 'italic' }}>
                                Showing first 5 of {histograms.length} tiles. Check console for all data.
                            </p>
                        )}
                    </div>
                </div>
            )}

            {tiles.length > 0 && (
                <div style={{ marginTop: '20px' }}>
                    <h3>Test Individual Tiles:</h3>
                    <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                        {tiles.slice(0, 9).map((tile) => (
                            <div key={tile.id} style={{ textAlign: 'center' }}>
                                <img
                                    src={tile.url}
                                    alt={`Tile ${tile.id}`}
                                    style={{
                                        width: '80px',
                                        height: '80px',
                                        cursor: 'pointer',
                                        border: '2px solid #ccc',
                                        transform: `rotate(${tile.rotation}deg)`
                                    }}
                                    onClick={() => calculateSingleTileHistogram(tile)}
                                />
                                <p style={{ fontSize: '12px' }}>Tile {tile.id}</p>
                            </div>
                        ))}
                    </div>
                    <p style={{ fontSize: '12px', color: '#666', marginTop: '10px' }}>
                        Click on a tile to calculate its histogram
                    </p>
                </div>
            )}
        </div>
    )
}
