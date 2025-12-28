import { useContext, useState } from "react"
import { AppContext } from "../src/App"

export default function CnnFeatures() {
    const { histogramData } = useContext(AppContext)
    const [selectedTileIndex, setSelectedTileIndex] = useState(0)
    const [selectedRotation, setSelectedRotation] = useState(0)
    const [viewMode, setViewMode] = useState('tile') // 'tile' or 'borders'
    const [selectedLayer, setSelectedLayer] = useState(0)

    const handleTileChange = (e) => {
        setSelectedTileIndex(parseInt(e.target.value))
    }

    const handleRotationChange = (e) => {
        setSelectedRotation(parseInt(e.target.value))
    }

    const handleLayerChange = (e) => {
        setSelectedLayer(parseInt(e.target.value))
    }

    if (!histogramData) {
        return (
            <div>
                <h2>Deep CNN Features (MobileNetV2)</h2>
                <p style={{ color: 'orange' }}>
                    Πρέπει πρώτα να κάνεις "Send to Backend" για να εξαχθούν τα CNN features!
                </p>
            </div>
        )
    }

    const currentTileData = histogramData.results[selectedTileIndex]
    const currentTile = currentTileData ? currentTileData.rotationFeatures[String(selectedRotation)] : null

    if (!currentTile) {
        return (
            <div>
                <h2>Deep CNN Features (MobileNetV2)</h2>
                <p style={{ color: 'orange' }}>
                    Δεν υπάρχουν διαθέσιμα δεδομένα για το επιλεγμένο tile!
                </p>
            </div>
        )
    }

    return (
        <div style={{ padding: '20px', backgroundColor: '#f5f5f5', borderRadius: '8px', marginTop: '20px' }}>
            <h2 style={{ color: '#333', borderBottom: '2px solid #FF5722', paddingBottom: '10px' }}>
                Deep CNN Features - MobileNetV2 Intermediate Layers
            </h2>

            <div style={{ backgroundColor: '#fff', padding: '15px', borderRadius: '5px', marginBottom: '20px' }}>
                <h3>Πληροφορίες</h3>
                <p>
                    <strong>Συνολικά Tiles:</strong> {histogramData.totalTiles} |
                    <strong> Grid:</strong> {histogramData.gridSize}x{histogramData.gridSize}
                </p>
                <p style={{ fontSize: '13px', color: '#666', marginTop: '10px' }}>
                    Εξαγωγή deep features από 5 intermediate layers του MobileNetV2 (pre-trained στο ImageNet).
                    Κάθε layer ανιχνεύει διαφορετικού επιπέδου features: από basic edges έως complex patterns.
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
                        border: '2px solid #FF5722',
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

                <div style={{ marginTop: '10px', padding: '10px', backgroundColor: '#ffebee', borderRadius: '5px' }}>
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
                            backgroundColor: viewMode === 'tile' ? '#FF5722' : '#ddd',
                            color: viewMode === 'tile' ? 'white' : '#333'
                        }}
                    >
                        Tile CNN Features
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
                            backgroundColor: viewMode === 'borders' ? '#FF5722' : '#ddd',
                            color: viewMode === 'borders' ? 'white' : '#333'
                        }}
                    >
                        Border CNN Features
                    </button>
                </div>
            </div>

            {viewMode === 'tile' && (
                <div style={{ backgroundColor: '#fff', padding: '15px', borderRadius: '5px' }}>
                    <h3>CNN Features για το Tile (5 intermediate layers)</h3>

                    <div style={{ overflowX: 'auto', marginTop: '15px' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                            <thead>
                                <tr style={{ backgroundColor: '#FF5722', color: 'white' }}>
                                    <th style={{ padding: '10px', border: '1px solid #ddd' }}>Layer Index</th>
                                    <th style={{ padding: '10px', border: '1px solid #ddd' }}>Layer Name</th>
                                    <th style={{ padding: '10px', border: '1px solid #ddd' }}>Shape (H×W×C)</th>
                                    <th style={{ padding: '10px', border: '1px solid #ddd' }}>Channels</th>
                                    <th style={{ padding: '10px', border: '1px solid #ddd' }}>Mean</th>
                                    <th style={{ padding: '10px', border: '1px solid #ddd' }}>Std</th>
                                    <th style={{ padding: '10px', border: '1px solid #ddd' }}>Min</th>
                                    <th style={{ padding: '10px', border: '1px solid #ddd' }}>Max</th>
                                </tr>
                            </thead>
                            <tbody>
                                {currentTile.tileCnnFeatures.map((layer, idx) => (
                                    <tr key={idx} style={{ backgroundColor: idx % 2 === 0 ? '#f9f9f9' : 'white' }}>
                                        <td style={{ padding: '8px', border: '1px solid #ddd', textAlign: 'center' }}>{layer.layer_index}</td>
                                        <td style={{ padding: '8px', border: '1px solid #ddd', fontFamily: 'monospace', fontSize: '11px' }}>{layer.layer_name}</td>
                                        <td style={{ padding: '8px', border: '1px solid #ddd', textAlign: 'center' }}>
                                            {layer.shape[0]}×{layer.shape[1]}×{layer.shape[2]}
                                        </td>
                                        <td style={{ padding: '8px', border: '1px solid #ddd', textAlign: 'center' }}>{layer.num_channels}</td>
                                        <td style={{ padding: '8px', border: '1px solid #ddd', textAlign: 'center' }}>{layer.mean.toFixed(4)}</td>
                                        <td style={{ padding: '8px', border: '1px solid #ddd', textAlign: 'center' }}>{layer.std.toFixed(4)}</td>
                                        <td style={{ padding: '8px', border: '1px solid #ddd', textAlign: 'center' }}>{layer.min.toFixed(4)}</td>
                                        <td style={{ padding: '8px', border: '1px solid #ddd', textAlign: 'center' }}>{layer.max.toFixed(4)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    <div style={{ marginTop: '20px', padding: '15px', backgroundColor: '#e3f2fd', borderRadius: '5px' }}>
                        <h4 style={{ marginTop: 0 }}>Επιλογή Layer για Feature Vector</h4>
                        <select
                            value={selectedLayer}
                            onChange={handleLayerChange}
                            style={{
                                padding: '8px',
                                fontSize: '14px',
                                borderRadius: '5px',
                                border: '2px solid #2196F3',
                                width: '100%',
                                cursor: 'pointer'
                            }}
                        >
                            {currentTile.tileCnnFeatures.map((layer, idx) => (
                                <option key={idx} value={idx}>
                                    Layer {idx}: {layer.layer_name} ({layer.num_channels} channels)
                                </option>
                            ))}
                        </select>

                        <div style={{ marginTop: '15px', padding: '10px', backgroundColor: '#fff', borderRadius: '5px', fontFamily: 'monospace', fontSize: '11px', maxHeight: '150px', overflowY: 'auto' }}>
                            <strong>Feature Vector ({currentTile.tileCnnFeatures[selectedLayer].num_channels} διαστάσεων):</strong>
                            <div style={{ marginTop: '8px', wordBreak: 'break-all' }}>
                                [{currentTile.tileCnnFeatures[selectedLayer].feature_vector.slice(0, 20).map(v => v.toFixed(4)).join(', ')}...
                                (showing first 20 of {currentTile.tileCnnFeatures[selectedLayer].num_channels} values)]
                            </div>
                        </div>

                        <button
                            onClick={() => console.log('Full CNN Features:', currentTile.tileCnnFeatures)}
                            style={{ padding: '8px 16px', cursor: 'pointer', marginTop: '10px' }}
                        >
                            Εμφάνισε ολόκληρα τα features στο console
                        </button>
                    </div>

                    <div style={{ marginTop: '15px', padding: '10px', backgroundColor: '#e8f5e9', borderRadius: '5px' }}>
                        <p style={{ margin: 0, fontSize: '12px' }}>
                            <strong>Layers επεξήγηση:</strong><br/>
                            • <strong>block_1_expand_relu</strong>: Early features (basic edges, colors)<br/>
                            • <strong>block_3_expand_relu</strong>: Low-level textures<br/>
                            • <strong>block_6_expand_relu</strong>: Mid-level patterns<br/>
                            • <strong>block_13_expand_relu</strong>: High-level structures<br/>
                            • <strong>out_relu</strong>: Complex abstract features
                        </p>
                    </div>
                </div>
            )}

            {viewMode === 'borders' && (
                <div style={{ backgroundColor: '#fff', padding: '15px', borderRadius: '5px' }}>
                    <h3>CNN Features για τα Borders</h3>

                    {['top', 'right', 'bottom', 'left'].map((border) => (
                        <div key={border} style={{ marginBottom: '30px', borderBottom: '2px solid #ddd', paddingBottom: '20px' }}>
                            <h4 style={{ textTransform: 'uppercase', color: '#555', backgroundColor: '#f0f0f0', padding: '10px', borderRadius: '5px' }}>
                                Border: {border}
                            </h4>

                            <div style={{ overflowX: 'auto', marginTop: '10px' }}>
                                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                                    <thead>
                                        <tr style={{ backgroundColor: '#FF9800', color: 'white' }}>
                                            <th style={{ padding: '8px', border: '1px solid #ddd' }}>Layer</th>
                                            <th style={{ padding: '8px', border: '1px solid #ddd' }}>Layer Name</th>
                                            <th style={{ padding: '8px', border: '1px solid #ddd' }}>Shape</th>
                                            <th style={{ padding: '8px', border: '1px solid #ddd' }}>Channels</th>
                                            <th style={{ padding: '8px', border: '1px solid #ddd' }}>Mean</th>
                                            <th style={{ padding: '8px', border: '1px solid #ddd' }}>Std</th>
                                            <th style={{ padding: '8px', border: '1px solid #ddd' }}>Min</th>
                                            <th style={{ padding: '8px', border: '1px solid #ddd' }}>Max</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {currentTile.borderCnnFeatures[border].map((layer, idx) => (
                                            <tr key={idx} style={{ backgroundColor: idx % 2 === 0 ? '#f9f9f9' : 'white' }}>
                                                <td style={{ padding: '6px', border: '1px solid #ddd', textAlign: 'center' }}>{layer.layer_index}</td>
                                                <td style={{ padding: '6px', border: '1px solid #ddd', fontFamily: 'monospace', fontSize: '10px' }}>{layer.layer_name}</td>
                                                <td style={{ padding: '6px', border: '1px solid #ddd', textAlign: 'center', fontSize: '10px' }}>
                                                    {layer.shape[0]}×{layer.shape[1]}×{layer.shape[2]}
                                                </td>
                                                <td style={{ padding: '6px', border: '1px solid #ddd', textAlign: 'center' }}>{layer.num_channels}</td>
                                                <td style={{ padding: '6px', border: '1px solid #ddd', textAlign: 'center' }}>{layer.mean.toFixed(4)}</td>
                                                <td style={{ padding: '6px', border: '1px solid #ddd', textAlign: 'center' }}>{layer.std.toFixed(4)}</td>
                                                <td style={{ padding: '6px', border: '1px solid #ddd', textAlign: 'center' }}>{layer.min.toFixed(4)}</td>
                                                <td style={{ padding: '6px', border: '1px solid #ddd', textAlign: 'center' }}>{layer.max.toFixed(4)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            <button
                                onClick={() => console.log(`Border ${border} CNN Features:`, currentTile.borderCnnFeatures[border])}
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
                    <li><strong>MobileNetV2</strong>: Lightweight CNN architecture, pre-trained στο ImageNet</li>
                    <li><strong>Feature Vector</strong>: Global Average Pooling των spatial dimensions - ένα compact representation</li>
                    <li><strong>Early Layers</strong>: Ανιχνεύουν basic features (edges, colors, simple textures)</li>
                    <li><strong>Deep Layers</strong>: Ανιχνεύουν complex patterns και high-level semantic features</li>
                    <li><strong>Channels</strong>: Κάθε channel είναι ένα διαφορετικό "feature detector"</li>
                    <li>Όλες οι εικόνες γίνονται resize σε 224×224 pixels για το network</li>
                </ul>
            </div>
        </div>
    )
}
