import { useState, useContext } from "react"
import { ImageContext } from "../src/App"
import { getTextureFeatures, getAllTilesTextureFeatures } from "../src/services/imageApi"

export default function TextureFeatures() {
    const { tiles } = useContext(ImageContext)
    const [textureFeatures, setTextureFeatures] = useState([])
    const [loading, setLoading] = useState(false)

    const calculateAllTextureFeatures = async () => {
        if (tiles.length === 0) {
            alert('Κάνε πρώτα shuffle την εικόνα!')
            return
        }

        setLoading(true)
        try {
            const results = await getAllTilesTextureFeatures(tiles)
            setTextureFeatures(results)
            console.log('Texture Features calculated:', results)
            console.log('Example - Tile 0 features:', results[0])
        } catch (error) {
            alert('Σφάλμα! Σιγουρέψου ότι το Python backend τρέχει και έχει εγκατασταθεί το scikit-image.')
            console.error(error)
        } finally {
            setLoading(false)
        }
    }

    const calculateSingleTileFeatures = async (tile) => {
        setLoading(true)
        try {
            const features = await getTextureFeatures(tile.url)
            console.log(`Texture Features for tile ${tile.id}:`)
            console.log('GLCM:', features.glcm)
            console.log('LBP:', features.lbp)
            console.log('Edges:', features.edges)
            console.log('Statistical:', features.statistical)
            alert(`Texture features υπολογίστηκαν για tile ${tile.id}! Δες το console.`)
        } catch (error) {
            alert('Σφάλμα! Σιγουρέψου ότι το Python backend τρέχει.')
            console.error(error)
        } finally {
            setLoading(false)
        }
    }

    const getTextureDescription = (features) => {
        const { glcm, edges, statistical } = features

        let description = []

        // Homogeneity
        if (glcm.homogeneity > 0.8) {
            description.push("Πολύ ομοιόμορφη υφή")
        } else if (glcm.homogeneity < 0.5) {
            description.push("Ετερογενής υφή")
        }

        // Contrast
        if (glcm.contrast > 100) {
            description.push("Έντονες αλλαγές")
        } else if (glcm.contrast < 30) {
            description.push("Ομαλή υφή")
        }

        // Edge Density
        if (edges.edge_density > 0.3) {
            description.push("Πολλά edges")
        } else if (edges.edge_density < 0.1) {
            description.push("Λίγα edges")
        }

        // Entropy
        if (statistical.entropy > 6) {
            description.push("Πολύπλοκη")
        } else if (statistical.entropy < 4) {
            description.push("Απλή")
        }

        return description.length > 0 ? description.join(", ") : "Μέτρια υφή"
    }

    return (
        <div style={{ marginTop: '20px', padding: '20px', border: '2px solid #9C27B0', backgroundColor: '#f3e5f5' }}>
            <h2>🔬 Texture Features</h2>
            <p style={{ color: '#666', fontSize: '14px' }}>
                Αναλύει την υφή (texture) κάθε tile: GLCM, LBP, Edges, Statistical features
            </p>

            <div style={{ marginBottom: '15px' }}>
                <button
                    onClick={calculateAllTextureFeatures}
                    disabled={loading || tiles.length === 0}
                    style={{
                        padding: '10px 20px',
                        backgroundColor: loading ? '#ccc' : '#9C27B0',
                        color: 'white',
                        border: 'none',
                        cursor: loading ? 'not-allowed' : 'pointer',
                        fontSize: '16px'
                    }}
                >
                    {loading ? 'Calculating...' : `Calculate Texture Features for ${tiles.length} tiles`}
                </button>
            </div>

            {textureFeatures.length > 0 && (
                <div style={{ marginTop: '20px' }}>
                    <h3>✓ Texture Features Calculated: {textureFeatures.length} tiles</h3>
                    <p style={{ fontSize: '14px', color: '#666' }}>
                        Κάθε tile έχει: GLCM features (6), LBP features, Edge features (5), Statistical features (9).
                        Δες το console για πλήρη δεδομένα.
                    </p>

                    <div style={{ maxHeight: '500px', overflowY: 'auto', marginTop: '10px', border: '1px solid #9C27B0', padding: '10px' }}>
                        {textureFeatures.slice(0, 5).map((item, index) => (
                            <div key={index} style={{ marginBottom: '20px', padding: '15px', backgroundColor: '#fff', border: '1px solid #9C27B0', borderRadius: '5px' }}>
                                <h4 style={{ color: '#9C27B0' }}>Tile ID: {item.tileId}</h4>

                                <p style={{ fontStyle: 'italic', color: '#666', fontSize: '14px', marginBottom: '10px' }}>
                                    "{getTextureDescription(item.textureFeatures)}"
                                </p>

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', fontSize: '12px' }}>
                                    {/* GLCM Features */}
                                    <div style={{ padding: '10px', backgroundColor: '#f3e5f5', borderRadius: '5px' }}>
                                        <strong style={{ color: '#9C27B0' }}>GLCM Features</strong>
                                        <p>Contrast: {item.textureFeatures.glcm.contrast.toFixed(2)}</p>
                                        <p>Homogeneity: {item.textureFeatures.glcm.homogeneity.toFixed(3)}</p>
                                        <p>Energy: {item.textureFeatures.glcm.energy.toFixed(3)}</p>
                                        <p>Correlation: {item.textureFeatures.glcm.correlation.toFixed(3)}</p>
                                    </div>

                                    {/* Edge Features */}
                                    <div style={{ padding: '10px', backgroundColor: '#e1bee7', borderRadius: '5px' }}>
                                        <strong style={{ color: '#9C27B0' }}>Edge Features</strong>
                                        <p>Edge Density: {(item.textureFeatures.edges.edge_density * 100).toFixed(2)}%</p>
                                        <p>Edge Magnitude: {item.textureFeatures.edges.edge_magnitude_mean.toFixed(2)}</p>
                                        <p>Horizontal: {item.textureFeatures.edges.horizontal_edges_mean.toFixed(2)}</p>
                                        <p>Vertical: {item.textureFeatures.edges.vertical_edges_mean.toFixed(2)}</p>
                                    </div>

                                    {/* Statistical Features */}
                                    <div style={{ padding: '10px', backgroundColor: '#f3e5f5', borderRadius: '5px' }}>
                                        <strong style={{ color: '#9C27B0' }}>Statistical</strong>
                                        <p>Mean: {item.textureFeatures.statistical.mean.toFixed(2)}</p>
                                        <p>Std Dev: {item.textureFeatures.statistical.std.toFixed(2)}</p>
                                        <p>Entropy: {item.textureFeatures.statistical.entropy.toFixed(2)}</p>
                                        <p>Skewness: {item.textureFeatures.statistical.skewness.toFixed(2)}</p>
                                    </div>

                                    {/* LBP Features */}
                                    <div style={{ padding: '10px', backgroundColor: '#e1bee7', borderRadius: '5px' }}>
                                        <strong style={{ color: '#9C27B0' }}>LBP (Local Binary Patterns)</strong>
                                        <p>Histogram bins: {item.textureFeatures.lbp.histogram.length}</p>
                                        <p>Mean: {item.textureFeatures.lbp.mean.toFixed(2)}</p>
                                        <p>Std: {item.textureFeatures.lbp.std.toFixed(2)}</p>
                                        <p>Range: {item.textureFeatures.lbp.min.toFixed(0)} - {item.textureFeatures.lbp.max.toFixed(0)}</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                        {textureFeatures.length > 5 && (
                            <p style={{ fontStyle: 'italic', textAlign: 'center', marginTop: '10px' }}>
                                Showing first 5 of {textureFeatures.length} tiles. Check console for all data.
                            </p>
                        )}
                    </div>
                </div>
            )}

            {tiles.length > 0 && (
                <div style={{ marginTop: '20px' }}>
                    <h3>Test Individual Tiles:</h3>
                    <p style={{ fontSize: '12px', color: '#666' }}>Click on a tile to see its texture features</p>
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
                                        border: '2px solid #9C27B0',
                                        borderRadius: '5px',
                                        transform: `rotate(${tile.rotation}deg)`
                                    }}
                                    onClick={() => calculateSingleTileFeatures(tile)}
                                    title={`Click to calculate texture features for tile ${tile.id}`}
                                />
                                <p style={{ fontSize: '12px', margin: '5px 0' }}>Tile {tile.id}</p>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <div style={{ marginTop: '20px', padding: '15px', backgroundColor: '#fff9c4', border: '1px solid #fbc02d', borderRadius: '5px' }}>
                <h4>📖 Πώς να ερμηνεύσεις τα features:</h4>
                <ul style={{ fontSize: '13px', margin: '10px 0', paddingLeft: '20px' }}>
                    <li><strong>Contrast:</strong> Υψηλό = τραχιά υφή, Χαμηλό = ομαλή υφή</li>
                    <li><strong>Homogeneity:</strong> Υψηλό = ομοιόμορφη, Χαμηλό = ετερογενής</li>
                    <li><strong>Energy:</strong> Υψηλό = επαναληπτικά patterns</li>
                    <li><strong>Edge Density:</strong> Ποσοστό pixels που είναι edges (υψηλό = πολύπλοκη εικόνα)</li>
                    <li><strong>Entropy:</strong> Μέτρο πολυπλοκότητας (0-8, υψηλό = πολύπλοκη)</li>
                </ul>
                <p style={{ fontSize: '12px', fontStyle: 'italic', color: '#666' }}>
                    Για αναλυτικό οδηγό, δες το backend/TEXTURE_FEATURES_GUIDE.md
                </p>
            </div>
        </div>
    )
}
