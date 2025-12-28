import { useContext, useState } from "react"
import { AppContext } from "../src/App"

export default function ColorHistogram() {
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

    const formatArray = (arr) => {
        // Δείχνω μόνο τις πρώτες 10 τιμές για να μην είναι τεράστιο
        const preview = arr.slice(0, 10).map(val => val.toFixed(6))
        return `[${preview.join(', ')}... (${arr.length} values total)]`
    }

    if (!histogramData) {
        return (
            <div>
                <h2>Color Histograms Data</h2>
                <p style={{ color: 'orange' }}>
                    Πρέπει πρώτα να κάνεις "Send to Backend" για να υπολογιστούν τα histograms!
                </p>
            </div>
        )
    }

    const currentTileData = histogramData.results[selectedTileIndex]
    const currentTile = currentTileData ? currentTileData.rotationFeatures[String(selectedRotation)] : null

    if (!currentTile) {
        return (
            <div>
                <h2>Color Histograms Data</h2>
                <p style={{ color: 'orange' }}>
                    Δεν υπάρχουν διαθέσιμα δεδομένα για το επιλεγμένο tile!
                </p>
            </div>
        )
    }

    return (
        <div style={{ padding: '20px', backgroundColor: '#f5f5f5', borderRadius: '8px', marginTop: '20px' }}>
            <h2 style={{ color: '#333', borderBottom: '2px solid #4CAF50', paddingBottom: '10px' }}>
                Color Histograms Data
            </h2>

            <div style={{ backgroundColor: '#fff', padding: '15px', borderRadius: '5px', marginBottom: '20px' }}>
                <h3>Πληροφορίες</h3>
                <p>
                    <strong>Συνολικά Tiles:</strong> {histogramData.totalTiles} |
                    <strong> Grid:</strong> {histogramData.gridSize}x{histogramData.gridSize} |
                    <strong> Border Width:</strong> {histogramData.borderWidth}px |
                    <strong> Histogram Bins:</strong> {histogramData.bins}
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
                        Tile Histogram
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
                        Border Histograms
                    </button>
                </div>
            </div>

            {viewMode === 'tile' && (
                <div style={{ backgroundColor: '#fff', padding: '15px', borderRadius: '5px' }}>
                    <h3>Tile Histogram (ολόκληρο το tile)</h3>
                    <div style={{ fontFamily: 'monospace', fontSize: '12px', backgroundColor: '#f5f5f5', padding: '10px', borderRadius: '5px', marginBottom: '10px' }}>
                        <div style={{ marginBottom: '10px' }}>
                            <strong style={{ color: 'red' }}>Red Channel:</strong>
                            <div style={{ marginTop: '5px', wordBreak: 'break-all' }}>
                                {formatArray(currentTile.tileHistogram.r)}
                            </div>
                        </div>
                        <div style={{ marginBottom: '10px' }}>
                            <strong style={{ color: 'green' }}>Green Channel:</strong>
                            <div style={{ marginTop: '5px', wordBreak: 'break-all' }}>
                                {formatArray(currentTile.tileHistogram.g)}
                            </div>
                        </div>
                        <div>
                            <strong style={{ color: 'blue' }}>Blue Channel:</strong>
                            <div style={{ marginTop: '5px', wordBreak: 'break-all' }}>
                                {formatArray(currentTile.tileHistogram.b)}
                            </div>
                        </div>
                    </div>
                    <button
                        onClick={() => console.log('Full Tile Histogram:', currentTile.tileHistogram)}
                        style={{ padding: '8px 16px', cursor: 'pointer' }}
                    >
                        Εμφάνισε ολόκληρο τον πίνακα στο console
                    </button>
                </div>
            )}

            {viewMode === 'borders' && (
                <div style={{ backgroundColor: '#fff', padding: '15px', borderRadius: '5px' }}>
                    <h3>Border Histograms</h3>

                    {['top', 'right', 'bottom', 'left'].map((border) => (
                        <div key={border} style={{ marginBottom: '20px', borderBottom: '1px solid #ddd', paddingBottom: '15px' }}>
                            <h4 style={{ textTransform: 'uppercase', color: '#555' }}>Border: {border}</h4>
                            <div style={{ fontFamily: 'monospace', fontSize: '12px', backgroundColor: '#f5f5f5', padding: '10px', borderRadius: '5px' }}>
                                <div style={{ marginBottom: '10px' }}>
                                    <strong style={{ color: 'red' }}>Red:</strong>
                                    <div style={{ marginTop: '5px', wordBreak: 'break-all' }}>
                                        {formatArray(currentTile.borderHistograms[border].r)}
                                    </div>
                                </div>
                                <div style={{ marginBottom: '10px' }}>
                                    <strong style={{ color: 'green' }}>Green:</strong>
                                    <div style={{ marginTop: '5px', wordBreak: 'break-all' }}>
                                        {formatArray(currentTile.borderHistograms[border].g)}
                                    </div>
                                </div>
                                <div>
                                    <strong style={{ color: 'blue' }}>Blue:</strong>
                                    <div style={{ marginTop: '5px', wordBreak: 'break-all' }}>
                                        {formatArray(currentTile.borderHistograms[border].b)}
                                    </div>
                                </div>
                            </div>
                            <button
                                onClick={() => console.log(`Border ${border} Histogram:`, currentTile.borderHistograms[border])}
                                style={{ padding: '6px 12px', cursor: 'pointer', marginTop: '8px' }}
                            >
                                Εμφάνισε ολόκληρο τον πίνακα στο console
                            </button>
                        </div>
                    ))}
                </div>
            )}

            <div style={{ backgroundColor: '#fffacd', padding: '15px', borderRadius: '5px', marginTop: '20px' }}>
                <p style={{ margin: 0, fontSize: '13px' }}>
                    <strong>Σημείωση:</strong> Κάθε histogram έχει {histogramData.bins} τιμές (bins).
                    Οι τιμές είναι normalized (άθροισμα = 1). Δείχνουν την πιθανότητα εμφάνισης κάθε χρώματος.
                    Λιγότερα bins = πιο συμπιεσμένα δεδομένα.
                </p>
            </div>
        </div>
    )
}
