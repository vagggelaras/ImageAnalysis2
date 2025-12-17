import { useState, useContext } from "react"
import { ImageContext } from "../src/App"
import { getBorderTextureFeatures, getAllTilesBorderTextureFeatures } from "../src/services/imageApi"

export default function BorderTextureFeatures() {
    const { tiles, borderWidth, setBorderWidth } = useContext(ImageContext)
    const [borderTextureFeatures, setBorderTextureFeatures] = useState([])
    const [loading, setLoading] = useState(false)
    const [simplified, setSimplified] = useState(true)

    const calculateAllBorderTextureFeatures = async () => {
        if (tiles.length === 0) {
            alert('Κάνε πρώτα shuffle την εικόνα!')
            return
        }

        setLoading(true)
        try {
            const results = await getAllTilesBorderTextureFeatures(tiles, borderWidth, simplified)
            setBorderTextureFeatures(results)
            console.log('Border Texture Features calculated:', results)
            console.log('Example - Tile 0:', results[0])
        } catch (error) {
            alert('Σφάλμα! Σιγουρέψου ότι το Python backend τρέχει.')
            console.error(error)
        } finally {
            setLoading(false)
        }
    }

    const calculateSingleTileBorderTexture = async (tile) => {
        setLoading(true)
        try {
            const features = await getBorderTextureFeatures(tile.url, borderWidth, simplified)
            console.log(`Border Texture Features for tile ${tile.id}:`)
            console.log('Top:', features.top)
            console.log('Bottom:', features.bottom)
            console.log('Left:', features.left)
            console.log('Right:', features.right)
            alert(`Border texture features υπολογίστηκαν για tile ${tile.id}! Δες το console.`)
        } catch (error) {
            alert('Σφάλμα! Σιγουρέψου ότι το Python backend τρέχει.')
            console.error(error)
        } finally {
            setLoading(false)
        }
    }

    const getBorderDescription = (borderFeatures) => {
        if (!borderFeatures || borderFeatures.error) {
            return "Error"
        }

        if (simplified) {
            // Simplified features
            if (borderFeatures.homogeneity > 0.8) {
                return "Ομοιόμορφο"
            } else if (borderFeatures.contrast > 100) {
                return "Τραχύ"
            } else {
                return "Μέτριο"
            }
        } else {
            // Full features
            if (borderFeatures.glcm.homogeneity > 0.8) {
                return "Ομοιόμορφο"
            } else if (borderFeatures.glcm.contrast > 100) {
                return "Τραχύ"
            } else {
                return "Μέτριο"
            }
        }
    }

    return (
        <div style={{ marginTop: '20px', padding: '20px', border: '2px solid #FF5722', backgroundColor: '#fff3e0' }}>
            <h2>🎯 Border Texture Features</h2>
            <p style={{ color: '#666', fontSize: '14px' }}>
                Texture features για κάθε border strip - Χρησιμοποιείται για matching γειτονικών tiles!
            </p>

            <div style={{ marginBottom: '15px', display: 'flex', gap: '20px', alignItems: 'center' }}>
                <label>
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
                    <input
                        type="checkbox"
                        checked={simplified}
                        onChange={(e) => setSimplified(e.target.checked)}
                        style={{ marginRight: '5px' }}
                    />
                    Simplified Mode (πιο γρήγορο)
                </label>
            </div>

            <div style={{ marginBottom: '15px' }}>
                <button
                    onClick={calculateAllBorderTextureFeatures}
                    disabled={loading || tiles.length === 0}
                    style={{
                        padding: '10px 20px',
                        backgroundColor: loading ? '#ccc' : '#FF5722',
                        color: 'white',
                        border: 'none',
                        cursor: loading ? 'not-allowed' : 'pointer',
                        fontSize: '16px'
                    }}
                >
                    {loading ? 'Calculating...' : `Calculate for ${tiles.length} tiles`}
                </button>
            </div>

            {borderTextureFeatures.length > 0 && (
                <div style={{ marginTop: '20px' }}>
                    <h3>✓ Border Texture Features: {borderTextureFeatures.length} tiles</h3>
                    <p style={{ fontSize: '14px', color: '#666' }}>
                        {simplified ? 'Simplified mode: 6 features per border' : 'Full mode: 20+ features per border'}.
                        Δες το console για πλήρη δεδομένα.
                    </p>

                    <div style={{ maxHeight: '500px', overflowY: 'auto', marginTop: '10px', border: '1px solid #FF5722', padding: '10px' }}>
                        {borderTextureFeatures.slice(0, 3).map((item, index) => (
                            <div key={index} style={{ marginBottom: '20px', padding: '15px', backgroundColor: '#fff', border: '1px solid #FF5722', borderRadius: '5px' }}>
                                <h4 style={{ color: '#FF5722' }}>Tile ID: {item.tileId}</h4>

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', fontSize: '12px', marginTop: '10px' }}>
                                    {/* Top Border */}
                                    <div style={{ padding: '10px', backgroundColor: '#ffccbc', borderRadius: '5px' }}>
                                        <strong>⬆️ Top Border</strong>
                                        <p style={{ fontStyle: 'italic', color: '#666' }}>
                                            {getBorderDescription(item.borderTextureFeatures.top)}
                                        </p>
                                        {simplified && !item.borderTextureFeatures.top.error ? (
                                            <>
                                                <p>Contrast: {item.borderTextureFeatures.top.contrast?.toFixed(2)}</p>
                                                <p>Homogeneity: {item.borderTextureFeatures.top.homogeneity?.toFixed(3)}</p>
                                                <p>Entropy: {item.borderTextureFeatures.top.entropy?.toFixed(2)}</p>
                                            </>
                                        ) : item.borderTextureFeatures.top.error ? (
                                            <p style={{ color: 'red' }}>{item.borderTextureFeatures.top.error}</p>
                                        ) : null}
                                    </div>

                                    {/* Bottom Border */}
                                    <div style={{ padding: '10px', backgroundColor: '#ffccbc', borderRadius: '5px' }}>
                                        <strong>⬇️ Bottom Border</strong>
                                        <p style={{ fontStyle: 'italic', color: '#666' }}>
                                            {getBorderDescription(item.borderTextureFeatures.bottom)}
                                        </p>
                                        {simplified && !item.borderTextureFeatures.bottom.error ? (
                                            <>
                                                <p>Contrast: {item.borderTextureFeatures.bottom.contrast?.toFixed(2)}</p>
                                                <p>Homogeneity: {item.borderTextureFeatures.bottom.homogeneity?.toFixed(3)}</p>
                                                <p>Entropy: {item.borderTextureFeatures.bottom.entropy?.toFixed(2)}</p>
                                            </>
                                        ) : item.borderTextureFeatures.bottom.error ? (
                                            <p style={{ color: 'red' }}>{item.borderTextureFeatures.bottom.error}</p>
                                        ) : null}
                                    </div>

                                    {/* Left Border */}
                                    <div style={{ padding: '10px', backgroundColor: '#ffe0b2', borderRadius: '5px' }}>
                                        <strong>⬅️ Left Border</strong>
                                        <p style={{ fontStyle: 'italic', color: '#666' }}>
                                            {getBorderDescription(item.borderTextureFeatures.left)}
                                        </p>
                                        {simplified && !item.borderTextureFeatures.left.error ? (
                                            <>
                                                <p>Contrast: {item.borderTextureFeatures.left.contrast?.toFixed(2)}</p>
                                                <p>Homogeneity: {item.borderTextureFeatures.left.homogeneity?.toFixed(3)}</p>
                                                <p>Entropy: {item.borderTextureFeatures.left.entropy?.toFixed(2)}</p>
                                            </>
                                        ) : item.borderTextureFeatures.left.error ? (
                                            <p style={{ color: 'red' }}>{item.borderTextureFeatures.left.error}</p>
                                        ) : null}
                                    </div>

                                    {/* Right Border */}
                                    <div style={{ padding: '10px', backgroundColor: '#ffe0b2', borderRadius: '5px' }}>
                                        <strong>➡️ Right Border</strong>
                                        <p style={{ fontStyle: 'italic', color: '#666' }}>
                                            {getBorderDescription(item.borderTextureFeatures.right)}
                                        </p>
                                        {simplified && !item.borderTextureFeatures.right.error ? (
                                            <>
                                                <p>Contrast: {item.borderTextureFeatures.right.contrast?.toFixed(2)}</p>
                                                <p>Homogeneity: {item.borderTextureFeatures.right.homogeneity?.toFixed(3)}</p>
                                                <p>Entropy: {item.borderTextureFeatures.right.entropy?.toFixed(2)}</p>
                                            </>
                                        ) : item.borderTextureFeatures.right.error ? (
                                            <p style={{ color: 'red' }}>{item.borderTextureFeatures.right.error}</p>
                                        ) : null}
                                    </div>
                                </div>
                            </div>
                        ))}
                        {borderTextureFeatures.length > 3 && (
                            <p style={{ fontStyle: 'italic', textAlign: 'center', marginTop: '10px' }}>
                                Showing first 3 of {borderTextureFeatures.length} tiles. Check console for all data.
                            </p>
                        )}
                    </div>
                </div>
            )}

            {tiles.length > 0 && (
                <div style={{ marginTop: '20px' }}>
                    <h3>Test Individual Tiles:</h3>
                    <p style={{ fontSize: '12px', color: '#666' }}>Click on a tile to see its border texture features</p>
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
                                        border: '2px solid #FF5722',
                                        borderRadius: '5px',
                                        transform: `rotate(${tile.rotation}deg)`
                                    }}
                                    onClick={() => calculateSingleTileBorderTexture(tile)}
                                    title={`Click to calculate border texture features for tile ${tile.id}`}
                                />
                                <p style={{ fontSize: '12px', margin: '5px 0' }}>Tile {tile.id}</p>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <div style={{ marginTop: '20px', padding: '15px', backgroundColor: '#e3f2fd', border: '1px solid #2196F3', borderRadius: '5px' }}>
                <h4>💡 Για Matching Tiles:</h4>
                <ul style={{ fontSize: '13px', margin: '10px 0', paddingLeft: '20px' }}>
                    <li>Το <strong>right border</strong> του Tile A πρέπει να ταιριάζει με το <strong>left border</strong> του Tile B</li>
                    <li>Χρησιμοποίησε <strong>Contrast</strong> + <strong>Homogeneity</strong> + <strong>Entropy</strong> για σύγκριση</li>
                    <li>Συνδύασε με <strong>Color Histograms</strong> για καλύτερα αποτελέσματα!</li>
                    <li><strong>Simplified mode</strong>: Πιο γρήγορο, 6 features ανά border</li>
                    <li><strong>Full mode</strong>: Πιο ακριβές, 20+ features ανά border</li>
                </ul>
            </div>
        </div>
    )
}
