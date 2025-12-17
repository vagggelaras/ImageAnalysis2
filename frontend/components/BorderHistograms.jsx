import { useState, useContext } from "react"
import { ImageContext } from "../src/App"
import { getBorderHistograms, getAllTilesBorderHistograms, checkBackendHealth } from "../src/services/imageApi"

export default function BorderHistograms() {
    const { tiles, bins, setBins, borderWidth, setBorderWidth } = useContext(ImageContext)
    const [borderHistograms, setBorderHistograms] = useState([])
    const [loading, setLoading] = useState(false)

    const calculateAllBorderHistograms = async () => {
        if (tiles.length === 0) {
            alert('Κάνε πρώτα shuffle την εικόνα!')
            return
        }

        setLoading(true)
        try {
            const results = await getAllTilesBorderHistograms(tiles, borderWidth, bins)
            setBorderHistograms(results)
            console.log('Border Histograms calculated:', results)
            console.log('Example - Tile 0 borders:', results[0])
        } catch (error) {
            alert('Σφάλμα! Σιγουρέψου ότι το Python backend τρέχει.')
            console.error(error)
        } finally {
            setLoading(false)
        }
    }

    const calculateSingleTileBorders = async (tile) => {
        setLoading(true)
        try {
            const borderHist = await getBorderHistograms(tile.url, borderWidth, bins)
            console.log(`Border Histograms for tile ${tile.id}:`)
            console.log('Top border:', borderHist.top)
            console.log('Bottom border:', borderHist.bottom)
            console.log('Left border:', borderHist.left)
            console.log('Right border:', borderHist.right)
            alert(`Border histograms υπολογίστηκαν για tile ${tile.id}! Δες το console.`)
        } catch (error) {
            alert('Σφάλμα! Σιγουρέψου ότι το Python backend τρέχει.')
            console.error(error)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div style={{ marginTop: '20px', padding: '20px', border: '2px solid #4CAF50', backgroundColor: '#f0f8f0' }}>
            <h2>Border Histograms</h2>
            <p style={{ color: '#666', fontSize: '14px' }}>
                Υπολογίζει ιστογράμματα για κάθε πλευρά του tile (top, bottom, left, right)
            </p>

            <div style={{ marginBottom: '15px' }}>
                <label style={{ marginRight: '15px' }}>
                    Border Width (pixels):
                    <input
                        type="number"
                        value={borderWidth}
                        onChange={(e) => setBorderWidth(parseInt(e.target.value) || 5)}
                        min="1"
                        max="50"
                        style={{ marginLeft: '10px', width: '80px' }}
                    />
                </label>

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
                    onClick={calculateAllBorderHistograms}
                    disabled={loading || tiles.length === 0}
                    style={{
                        padding: '10px 20px',
                        backgroundColor: loading ? '#ccc' : '#4CAF50',
                        color: 'white',
                        border: 'none',
                        cursor: loading ? 'not-allowed' : 'pointer',
                        fontSize: '16px'
                    }}
                >
                    {loading ? 'Calculating...' : `Calculate Border Histograms for ${tiles.length} tiles`}
                </button>
            </div>

            {borderHistograms.length > 0 && (
                <div style={{ marginTop: '20px' }}>
                    <h3>✓ Border Histograms Calculated: {borderHistograms.length} tiles</h3>
                    <p style={{ fontSize: '14px', color: '#666' }}>
                        Κάθε tile έχει 4 borders (top, bottom, left, right). Κάθε border έχει 3 channels (blue, green, red).
                        Δες το console για τα πλήρη δεδομένα.
                    </p>

                    <div style={{ maxHeight: '400px', overflowY: 'auto', marginTop: '10px', border: '1px solid #ddd', padding: '10px' }}>
                        {borderHistograms.slice(0, 3).map((item, index) => (
                            <div key={index} style={{ marginBottom: '20px', padding: '15px', backgroundColor: '#fff', border: '1px solid #4CAF50' }}>
                                <h4>Tile ID: {item.tileId}</h4>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', fontSize: '12px' }}>
                                    <div style={{ padding: '10px', backgroundColor: '#e8f5e9' }}>
                                        <strong>Top Border</strong>
                                        <p>Blue: {item.borderHistograms.top.blue.length} values</p>
                                        <p>Green: {item.borderHistograms.top.green.length} values</p>
                                        <p>Red: {item.borderHistograms.top.red.length} values</p>
                                    </div>
                                    <div style={{ padding: '10px', backgroundColor: '#e8f5e9' }}>
                                        <strong>Bottom Border</strong>
                                        <p>Blue: {item.borderHistograms.bottom.blue.length} values</p>
                                        <p>Green: {item.borderHistograms.bottom.green.length} values</p>
                                        <p>Red: {item.borderHistograms.bottom.red.length} values</p>
                                    </div>
                                    <div style={{ padding: '10px', backgroundColor: '#e8f5e9' }}>
                                        <strong>Left Border</strong>
                                        <p>Blue: {item.borderHistograms.left.blue.length} values</p>
                                        <p>Green: {item.borderHistograms.left.green.length} values</p>
                                        <p>Red: {item.borderHistograms.left.red.length} values</p>
                                    </div>
                                    <div style={{ padding: '10px', backgroundColor: '#e8f5e9' }}>
                                        <strong>Right Border</strong>
                                        <p>Blue: {item.borderHistograms.right.blue.length} values</p>
                                        <p>Green: {item.borderHistograms.right.green.length} values</p>
                                        <p>Red: {item.borderHistograms.right.red.length} values</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                        {borderHistograms.length > 3 && (
                            <p style={{ fontStyle: 'italic', textAlign: 'center' }}>
                                Showing first 3 of {borderHistograms.length} tiles. Check console for all data.
                            </p>
                        )}
                    </div>
                </div>
            )}

            {tiles.length > 0 && (
                <div style={{ marginTop: '20px' }}>
                    <h3>Test Individual Tiles:</h3>
                    <p style={{ fontSize: '12px', color: '#666' }}>Click on a tile to see its border histograms</p>
                    <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginTop: '10px' }}>
                        {tiles.slice(0, 9).map((tile) => (
                            <div key={tile.id} style={{ textAlign: 'center' }}>
                                <img
                                    src={tile.url}
                                    alt={`Tile ${tile.id}`}
                                    style={{
                                        width: '80px',
                                        height: '80px',
                                        cursor: 'pointer',
                                        border: '2px solid #4CAF50',
                                        transform: `rotate(${tile.rotation}deg)`
                                    }}
                                    onClick={() => calculateSingleTileBorders(tile)}
                                    title={`Click to calculate border histograms for tile ${tile.id}`}
                                />
                                <p style={{ fontSize: '12px', margin: '5px 0' }}>Tile {tile.id}</p>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    )
}
