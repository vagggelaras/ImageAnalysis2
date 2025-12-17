import { useState, useContext } from "react"
import { ImageContext } from "../src/App"
import { getBorderHistograms, getBorderTextureFeatures } from "../src/services/imageApi"

const API_BASE_URL = 'http://localhost:8000'

export default function TileDistances() {
    const { tiles, borderWidth, bins } = useContext(ImageContext)
    const [distances, setDistances] = useState(null)
    const [loading, setLoading] = useState(false)
    const [colorWeight, setColorWeight] = useState(0.6)
    const [textureWeight, setTextureWeight] = useState(0.4)

    const calculateDistances = async () => {
        if (tiles.length === 0) {
            alert('Κάνε πρώτα shuffle την εικόνα!')
            return
        }

        setLoading(true)
        try {
            // Βήμα 1: Συλλογή border histograms και texture features για όλα τα tiles
            console.log('Συλλογή δεδομένων για', tiles.length, 'tiles...')

            const tilesData = await Promise.all(
                tiles.map(async (tile) => {
                    const [histograms, textures] = await Promise.all([
                        getBorderHistograms(tile.url, borderWidth, bins),
                        getBorderTextureFeatures(tile.url, borderWidth, true) // simplified=true
                    ])

                    return {
                        tile_id: tile.id,
                        borders: {
                            top: {
                                histogram: histograms.top,
                                texture: textures.top
                            },
                            bottom: {
                                histogram: histograms.bottom,
                                texture: textures.bottom
                            },
                            left: {
                                histogram: histograms.left,
                                texture: textures.left
                            },
                            right: {
                                histogram: histograms.right,
                                texture: textures.right
                            }
                        }
                    }
                })
            )

            console.log('Δεδομένα συλλέχθηκαν. Υπολογισμός αποστάσεων...')

            // Βήμα 2: Αποστολή στο backend για υπολογισμό αποστάσεων
            const response = await fetch(`${API_BASE_URL}/api/calculate-distances?color_weight=${colorWeight}&texture_weight=${textureWeight}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    tiles_data: tilesData
                })
            })

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`)
            }

            const result = await response.json()
            setDistances(result.data)

            console.log('Αποστάσεις υπολογίστηκαν:', result.data)
            console.log('Best matches:', result.data.best_matches)

        } catch (error) {
            alert('Σφάλμα! Σιγουρέψου ότι το Python backend τρέχει.')
            console.error(error)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div style={{ marginTop: '20px', padding: '20px', border: '2px solid #00BCD4', backgroundColor: '#e0f7fa' }}>
            <h2>📏 Tile Distances / Similarities</h2>
            <p style={{ color: '#666', fontSize: '14px' }}>
                Υπολογίζει αποστάσεις μεταξύ όλων των ζευγών tiles για να βρούμε ποια είναι γειτονικά
            </p>

            <div style={{ marginBottom: '15px', display: 'flex', gap: '20px', alignItems: 'center', flexWrap: 'wrap' }}>
                <label>
                    Color Weight:
                    <input
                        type="number"
                        value={colorWeight}
                        onChange={(e) => {
                            const val = parseFloat(e.target.value)
                            if (val >= 0 && val <= 1) {
                                setColorWeight(val)
                                setTextureWeight(1 - val)
                            }
                        }}
                        min="0"
                        max="1"
                        step="0.1"
                        style={{ marginLeft: '10px', width: '80px' }}
                    />
                </label>

                <label>
                    Texture Weight:
                    <input
                        type="number"
                        value={textureWeight}
                        onChange={(e) => {
                            const val = parseFloat(e.target.value)
                            if (val >= 0 && val <= 1) {
                                setTextureWeight(val)
                                setColorWeight(1 - val)
                            }
                        }}
                        min="0"
                        max="1"
                        step="0.1"
                        style={{ marginLeft: '10px', width: '80px' }}
                    />
                </label>

                <span style={{ fontSize: '12px', color: '#666' }}>
                    (Άθροισμα = 1.0)
                </span>
            </div>

            <div style={{ marginBottom: '15px' }}>
                <button
                    onClick={calculateDistances}
                    disabled={loading || tiles.length === 0}
                    style={{
                        padding: '10px 20px',
                        backgroundColor: loading ? '#ccc' : '#00BCD4',
                        color: 'white',
                        border: 'none',
                        cursor: loading ? 'not-allowed' : 'pointer',
                        fontSize: '16px'
                    }}
                >
                    {loading ? 'Calculating...' : `Calculate Distances for ${tiles.length} tiles`}
                </button>
            </div>

            {loading && (
                <div style={{ padding: '15px', backgroundColor: '#fff9c4', borderRadius: '5px', marginBottom: '15px' }}>
                    <p style={{ margin: 0 }}>
                        ⏳ Υπολογισμός... Αυτό μπορεί να πάρει λίγο χρόνο για {tiles.length} tiles
                        ({tiles.length * tiles.length} συγκρίσεις).
                    </p>
                </div>
            )}

            {distances && (
                <div style={{ marginTop: '20px' }}>
                    <h3>✓ Αποστάσεις υπολογίστηκαν!</h3>

                    <div style={{ marginBottom: '15px', padding: '10px', backgroundColor: '#f5f5f5', borderRadius: '5px' }}>
                        <p><strong>Στατιστικά:</strong></p>
                        <p>• Συνολικές συγκρίσεις: {distances.stats.total_comparisons}</p>
                        <p>• Tiles: {distances.stats.n_tiles}</p>
                        <p>• Color weight: {distances.stats.color_weight} | Texture weight: {distances.stats.texture_weight}</p>
                    </div>

                    <h3>🎯 Best Matches για κάθε Tile:</h3>
                    <p style={{ fontSize: '13px', color: '#666', marginBottom: '10px' }}>
                        Για κάθε border, δείχνει ποιο tile ταιριάζει καλύτερα (lower distance = better match)
                    </p>

                    <div style={{ maxHeight: '600px', overflowY: 'auto', border: '1px solid #00BCD4', padding: '10px' }}>
                        {Object.entries(distances.best_matches).slice(0, 10).map(([tileId, matches]) => (
                            <div key={tileId} style={{ marginBottom: '20px', padding: '15px', backgroundColor: '#fff', border: '1px solid #00BCD4', borderRadius: '5px' }}>
                                <h4 style={{ color: '#00BCD4', marginBottom: '10px' }}>Tile {tileId}</h4>

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', fontSize: '13px' }}>
                                    {/* Top */}
                                    <div style={{ padding: '10px', backgroundColor: '#e0f2f1', borderRadius: '5px' }}>
                                        <strong>⬆️ Top → Bottom</strong>
                                        <p>Best match: Tile <strong>{matches.top.tile_id}</strong></p>
                                        <p>Distance: <span style={{ color: matches.top.distance < 0.3 ? 'green' : matches.top.distance < 0.6 ? 'orange' : 'red' }}>
                                            {matches.top.distance.toFixed(3)}
                                        </span></p>
                                        <p>Similarity: {(matches.top.similarity * 100).toFixed(1)}%</p>
                                    </div>

                                    {/* Bottom */}
                                    <div style={{ padding: '10px', backgroundColor: '#e0f2f1', borderRadius: '5px' }}>
                                        <strong>⬇️ Bottom → Top</strong>
                                        <p>Best match: Tile <strong>{matches.bottom.tile_id}</strong></p>
                                        <p>Distance: <span style={{ color: matches.bottom.distance < 0.3 ? 'green' : matches.bottom.distance < 0.6 ? 'orange' : 'red' }}>
                                            {matches.bottom.distance.toFixed(3)}
                                        </span></p>
                                        <p>Similarity: {(matches.bottom.similarity * 100).toFixed(1)}%</p>
                                    </div>

                                    {/* Left */}
                                    <div style={{ padding: '10px', backgroundColor: '#b2ebf2', borderRadius: '5px' }}>
                                        <strong>⬅️ Left → Right</strong>
                                        <p>Best match: Tile <strong>{matches.left.tile_id}</strong></p>
                                        <p>Distance: <span style={{ color: matches.left.distance < 0.3 ? 'green' : matches.left.distance < 0.6 ? 'orange' : 'red' }}>
                                            {matches.left.distance.toFixed(3)}
                                        </span></p>
                                        <p>Similarity: {(matches.left.similarity * 100).toFixed(1)}%</p>
                                    </div>

                                    {/* Right */}
                                    <div style={{ padding: '10px', backgroundColor: '#b2ebf2', borderRadius: '5px' }}>
                                        <strong>➡️ Right → Left</strong>
                                        <p>Best match: Tile <strong>{matches.right.tile_id}</strong></p>
                                        <p>Distance: <span style={{ color: matches.right.distance < 0.3 ? 'green' : matches.right.distance < 0.6 ? 'orange' : 'red' }}>
                                            {matches.right.distance.toFixed(3)}
                                        </span></p>
                                        <p>Similarity: {(matches.right.similarity * 100).toFixed(1)}%</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                        {Object.keys(distances.best_matches).length > 10 && (
                            <p style={{ fontStyle: 'italic', textAlign: 'center', marginTop: '10px' }}>
                                Showing first 10 of {Object.keys(distances.best_matches).length} tiles. Check console for all data.
                            </p>
                        )}
                    </div>
                </div>
            )}

            <div style={{ marginTop: '20px', padding: '15px', backgroundColor: '#fff9c4', border: '1px solid #fbc02d', borderRadius: '5px' }}>
                <h4>💡 Πώς να διαβάσεις τα αποτελέσματα:</h4>
                <ul style={{ fontSize: '13px', margin: '10px 0', paddingLeft: '20px' }}>
                    <li><strong>Distance 0.0-0.3</strong> (πράσινο): Πολύ όμοια - πιθανώς γειτονικά tiles!</li>
                    <li><strong>Distance 0.3-0.6</strong> (πορτοκαλί): Μέτρια ομοιότητα</li>
                    <li><strong>Distance 0.6-1.0</strong> (κόκκινο): Πολύ διαφορετικά</li>
                    <li><strong>Similarity</strong>: 1 - Distance (πόσο % όμοια είναι)</li>
                    <li>Για κάθε tile, βλέπεις ποιο άλλο tile ταιριάζει καλύτερα σε κάθε πλευρά</li>
                </ul>
            </div>
        </div>
    )
}
