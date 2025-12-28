import { useContext, useState } from "react"
import { AppContext } from "../src/App"

export default function GaborFeatures() {
    const { histogramData } = useContext(AppContext)
    const [selectedTileIndex, setSelectedTileIndex] = useState(0)
    const [selectedRotation, setSelectedRotation] = useState(0)
    const [viewMode, setViewMode] = useState('tile') // 'tile' or 'borders'

    const handleTileChange = (e) => {
        setSelectedTileIndex(parseInt(e.target.value))
    }

    const handleRotationChange = (e) => {
        setSelectedRotation(parseInt(e.target.value))
    }

    if (!histogramData) {
        return (
            <div>
                <h2>Gabor Texture Features</h2>
                <p style={{ color: 'orange' }}>
                    Πρέπει πρώτα να κάνεις "Send to Backend" για να υπολογιστούν τα Gabor features!
                </p>
            </div>
        )
    }

    const currentTileData = histogramData.results[selectedTileIndex]
    const currentTile = currentTileData ? currentTileData.rotationFeatures[String(selectedRotation)] : null

    if (!currentTile) {
        return (
            <div>
                <h2>Gabor Texture Features</h2>
                <p style={{ color: 'orange' }}>
                    Δεν υπάρχουν διαθέσιμα δεδομένα για το επιλεγμένο tile!
                </p>
            </div>
        )
    }

    return (
        <div style={{ padding: '20px', backgroundColor: '#f5f5f5', borderRadius: '8px', marginTop: '20px' }}>
            <h2 style={{ color: '#333', borderBottom: '2px solid #4CAF50', paddingBottom: '10px' }}>
                Gabor Texture & Edge Detection Features
            </h2>

            <div style={{ backgroundColor: '#fff', padding: '15px', borderRadius: '5px', marginBottom: '20px' }}>
                <h3>Πληροφορίες</h3>
                <p>
                    <strong>Συνολικά Tiles:</strong> {histogramData.totalTiles} |
                    <strong> Grid:</strong> {histogramData.gridSize}x{histogramData.gridSize}
                </p>
                <p style={{ fontSize: '13px', color: '#666', marginTop: '10px' }}>
                    Τα Gabor filters εξάγουν texture και edge features σε διαφορετικές γωνίες και συχνότητες.
                    Χρησιμοποιούνται 4 orientations (0°, 45°, 90°, 135°) και 3 frequencies.
                </p>
            </div>

            <div style={{ backgroundColor: '#fff', padding: '15px', borderRadius: '5px', marginBottom: '20px' }}>
                <h3>Επιλογή Tile</h3>
                <select
                    value={selectedTileIndex}
                    onChange={handleTileChange}
                    style={{
                        padding: '10px',
                        fontSize: '14px',
                        borderRadius: '5px',
                        border: '2px solid #4CAF50',
                        width: '100%',
                        cursor: 'pointer',
                        marginBottom: '10px'
                    }}
                >
                    {histogramData.results.map((tile, index) => (
                        <option key={index} value={index}>
                            Tile {index} - Source: {tile.sourceIndex} | Dest: {tile.destPosition} | Shuffle Rotation: {tile.shuffleRotation}°
                        </option>
                    ))}
                </select>

                <h3 style={{ marginTop: '15px' }}>Επιλογή Rotation</h3>
                <select
                    value={selectedRotation}
                    onChange={handleRotationChange}
                    style={{
                        padding: '10px',
                        fontSize: '14px',
                        borderRadius: '5px',
                        border: '2px solid #FF9800',
                        width: '100%',
                        cursor: 'pointer'
                    }}
                >
                    <option value={0}>0° (No Rotation)</option>
                    <option value={90}>90° (Clockwise)</option>
                    <option value={180}>180° (Upside Down)</option>
                    <option value={270}>270° (Counter-Clockwise)</option>
                </select>

                <div style={{ marginTop: '10px', padding: '10px', backgroundColor: '#e3f2fd', borderRadius: '5px' }}>
                    <p style={{ margin: 0 }}>
                        <strong>Τρέχον Tile:</strong> {selectedTileIndex} | <strong>Viewing Rotation:</strong> {selectedRotation}° |
                        <strong> Source:</strong> {currentTileData.sourceIndex} |
                        <strong> Dest:</strong> {currentTileData.destPosition} |
                        <strong> Shuffle Rotation:</strong> {currentTileData.shuffleRotation}°
                    </p>
                </div>
            </div>

            <div style={{ backgroundColor: '#fff', padding: '15px', borderRadius: '5px', marginBottom: '20px' }}>
                <h3>Τύπος Προβολής</h3>
                <div style={{ display: 'flex', gap: '10px' }}>
                    <button
                        onClick={() => setViewMode('tile')}
                        style={{
                            padding: '10px 20px',
                            fontSize: '14px',
                            fontWeight: 'bold',
                            border: 'none',
                            borderRadius: '5px',
                            cursor: 'pointer',
                            backgroundColor: viewMode === 'tile' ? '#4CAF50' : '#ddd',
                            color: viewMode === 'tile' ? 'white' : '#333'
                        }}
                    >
                        Tile Gabor Features
                    </button>
                    <button
                        onClick={() => setViewMode('borders')}
                        style={{
                            padding: '10px 20px',
                            fontSize: '14px',
                            fontWeight: 'bold',
                            border: 'none',
                            borderRadius: '5px',
                            cursor: 'pointer',
                            backgroundColor: viewMode === 'borders' ? '#4CAF50' : '#ddd',
                            color: viewMode === 'borders' ? 'white' : '#333'
                        }}
                    >
                        Border Gabor Features
                    </button>
                </div>
            </div>

            {viewMode === 'tile' && (
                <div style={{ backgroundColor: '#fff', padding: '15px', borderRadius: '5px' }}>
                    <h3>Gabor Features για το Tile (12 filters: 4 orientations × 3 frequencies)</h3>

                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                            <thead>
                                <tr style={{ backgroundColor: '#4CAF50', color: 'white' }}>
                                    <th style={{ padding: '10px', border: '1px solid #ddd' }}>Filter #</th>
                                    <th style={{ padding: '10px', border: '1px solid #ddd' }}>Orientation (°)</th>
                                    <th style={{ padding: '10px', border: '1px solid #ddd' }}>Wavelength</th>
                                    <th style={{ padding: '10px', border: '1px solid #ddd' }}>Mean</th>
                                    <th style={{ padding: '10px', border: '1px solid #ddd' }}>Std Dev</th>
                                    <th style={{ padding: '10px', border: '1px solid #ddd' }}>Energy</th>
                                </tr>
                            </thead>
                            <tbody>
                                {currentTile.tileGaborFeatures.map((feature, idx) => (
                                    <tr key={idx} style={{ backgroundColor: idx % 2 === 0 ? '#f9f9f9' : 'white' }}>
                                        <td style={{ padding: '8px', border: '1px solid #ddd', textAlign: 'center' }}>{idx}</td>
                                        <td style={{ padding: '8px', border: '1px solid #ddd', textAlign: 'center' }}>{feature.orientation.toFixed(1)}</td>
                                        <td style={{ padding: '8px', border: '1px solid #ddd', textAlign: 'center' }}>{feature.wavelength}</td>
                                        <td style={{ padding: '8px', border: '1px solid #ddd', textAlign: 'center' }}>{feature.mean.toFixed(6)}</td>
                                        <td style={{ padding: '8px', border: '1px solid #ddd', textAlign: 'center' }}>{feature.std.toFixed(6)}</td>
                                        <td style={{ padding: '8px', border: '1px solid #ddd', textAlign: 'center' }}>{feature.energy.toFixed(2)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    <div style={{ marginTop: '15px', padding: '10px', backgroundColor: '#e8f5e9', borderRadius: '5px' }}>
                        <p style={{ margin: 0, fontSize: '12px' }}>
                            <strong>Mean:</strong> Μέση τιμή της απόκρισης |
                            <strong> Std Dev:</strong> Τυπική απόκλιση (μέτρο texture variation) |
                            <strong> Energy:</strong> Συνολική ενέργεια (δύναμη του pattern)
                        </p>
                    </div>

                    <button
                        onClick={() => console.log('Tile Gabor Features:', currentTile.tileGaborFeatures)}
                        style={{ padding: '8px 16px', cursor: 'pointer', marginTop: '10px' }}
                    >
                        Εμφάνισε στο console
                    </button>
                </div>
            )}

            {viewMode === 'borders' && (
                <div style={{ backgroundColor: '#fff', padding: '15px', borderRadius: '5px' }}>
                    <h3>Gabor Features για τα Borders</h3>

                    {['top', 'right', 'bottom', 'left'].map((border) => (
                        <div key={border} style={{ marginBottom: '30px', borderBottom: '2px solid #ddd', paddingBottom: '20px' }}>
                            <h4 style={{ textTransform: 'uppercase', color: '#555', backgroundColor: '#f0f0f0', padding: '10px', borderRadius: '5px' }}>
                                Border: {border}
                            </h4>

                            <div style={{ overflowX: 'auto', marginTop: '10px' }}>
                                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                                    <thead>
                                        <tr style={{ backgroundColor: '#2196F3', color: 'white' }}>
                                            <th style={{ padding: '8px', border: '1px solid #ddd' }}>Filter #</th>
                                            <th style={{ padding: '8px', border: '1px solid #ddd' }}>Orientation (°)</th>
                                            <th style={{ padding: '8px', border: '1px solid #ddd' }}>Wavelength</th>
                                            <th style={{ padding: '8px', border: '1px solid #ddd' }}>Mean</th>
                                            <th style={{ padding: '8px', border: '1px solid #ddd' }}>Std Dev</th>
                                            <th style={{ padding: '8px', border: '1px solid #ddd' }}>Energy</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {currentTile.borderGaborFeatures[border].map((feature, idx) => (
                                            <tr key={idx} style={{ backgroundColor: idx % 2 === 0 ? '#f9f9f9' : 'white' }}>
                                                <td style={{ padding: '6px', border: '1px solid #ddd', textAlign: 'center' }}>{idx}</td>
                                                <td style={{ padding: '6px', border: '1px solid #ddd', textAlign: 'center' }}>{feature.orientation.toFixed(1)}</td>
                                                <td style={{ padding: '6px', border: '1px solid #ddd', textAlign: 'center' }}>{feature.wavelength}</td>
                                                <td style={{ padding: '6px', border: '1px solid #ddd', textAlign: 'center' }}>{feature.mean.toFixed(6)}</td>
                                                <td style={{ padding: '6px', border: '1px solid #ddd', textAlign: 'center' }}>{feature.std.toFixed(6)}</td>
                                                <td style={{ padding: '6px', border: '1px solid #ddd', textAlign: 'center' }}>{feature.energy.toFixed(2)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            <button
                                onClick={() => console.log(`Border ${border} Gabor Features:`, currentTile.borderGaborFeatures[border])}
                                style={{ padding: '6px 12px', cursor: 'pointer', marginTop: '8px', fontSize: '12px' }}
                            >
                                Εμφάνισε στο console
                            </button>
                        </div>
                    ))}
                </div>
            )}

            <div style={{ backgroundColor: '#fffacd', padding: '15px', borderRadius: '5px', marginTop: '20px' }}>
                <h4 style={{ marginTop: 0 }}>Σημειώσεις:</h4>
                <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '13px' }}>
                    <li><strong>Orientation:</strong> Η γωνία του filter (0°, 45°, 90°, 135°) - ανιχνεύει edges σε διαφορετικές κατευθύνσεις</li>
                    <li><strong>Wavelength:</strong> Το μήκος κύματος - ανιχνεύει patterns διαφορετικών μεγεθών</li>
                    <li><strong>Mean:</strong> Μέση απόκριση - υψηλότερη τιμή = περισσότερο pattern σε αυτή την κατεύθυνση</li>
                    <li><strong>Std Dev:</strong> Τυπική απόκλιση - υψηλότερη τιμή = περισσότερη texture variation</li>
                    <li><strong>Energy:</strong> Συνολική ενέργεια - υψηλότερη τιμή = ισχυρότερο texture pattern</li>
                </ul>
                <p style={{ marginTop: '10px', marginBottom: 0, fontSize: '13px' }}>
                    Οι εικόνες από τα Gabor filters αποθηκεύονται στο <code>tempPhotos/gabor_filters/</code>
                </p>
            </div>
        </div>
    )
}
