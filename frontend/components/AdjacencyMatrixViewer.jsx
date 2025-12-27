import { useContext, useState } from "react"
import { AppContext } from "../src/App"

export default function AdjacencyMatrixViewer() {
    const { histogramData, shuffleData, setAdjacencyData: setContextAdjacencyData } = useContext(AppContext)

    // State
    const [adjacencyData, setAdjacencyData] = useState(null)
    const [loading, setLoading] = useState(false)
    const [weights, setWeights] = useState({ color: 0.4, gabor: 0.3, cnn: 0.3 })
    const [cnnLayer, setCnnLayer] = useState('block_6_expand_relu')
    const [topK, setTopK] = useState(20)
    const [selectedTile, setSelectedTile] = useState(0)
    const [viewMode, setViewMode] = useState('statistics') // 'statistics', 'matches', 'heatmap', 'reconstruction'

    const calculateAdjacencyMatrix = async () => {
        if (!histogramData) {
            alert('Πρέπει πρώτα να υπολογίσεις τα features!')
            return
        }

        setLoading(true)

        try {
            const response = await fetch('/api/calculate-adjacency-matrix', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    histogramData: histogramData,
                    weights: weights,
                    cnnLayer: cnnLayer,
                    topK: topK
                })
            })

            const data = await response.json()

            if (data.status === 'success') {
                setAdjacencyData(data) // Local state for this component
                setContextAdjacencyData(data) // Save to context for ImageReconstruction component
                console.log('Adjacency Matrix calculated:', data)
                alert(`Success! Calculated ${data.statistics.totalComparisons} comparisons, filtered to ${data.statistics.filteredMatches} top matches.`)
            } else {
                console.error('Backend error:', data)
                alert('Error calculating adjacency matrix')
            }
        } catch (error) {
            console.error('Network error:', error)
            alert('Network error: ' + error.message)
        } finally {
            setLoading(false)
        }
    }

    const handleWeightChange = (metric, value) => {
        const newWeights = { ...weights, [metric]: parseFloat(value) }
        setWeights(newWeights)
    }

    if (!histogramData) {
        return (
            <div style={{ padding: '20px', backgroundColor: '#f5f5f5', borderRadius: '8px', marginTop: '20px' }}>
                <h2 style={{ color: '#333', borderBottom: '2px solid #9C27B0', paddingBottom: '10px' }}>
                    Adjacency Matrix (Phase 3)
                </h2>
                <p style={{ color: 'orange' }}>
                    Πρέπει πρώτα να κάνεις "Send to Backend" για να εξαχθούν τα features!
                </p>
            </div>
        )
    }

    return (
        <div style={{ padding: '20px', backgroundColor: '#f5f5f5', borderRadius: '8px', marginTop: '20px' }}>
            <h2 style={{ color: '#333', borderBottom: '2px solid #9C27B0', paddingBottom: '10px' }}>
                Adjacency Matrix - Tile Compatibility
            </h2>

            {/* Configuration Panel */}
            <div style={{ backgroundColor: '#fff', padding: '15px', borderRadius: '5px', marginBottom: '20px' }}>
                <h3>Configuration</h3>

                {/* Weights */}
                <div style={{ marginBottom: '15px' }}>
                    <h4>Feature Weights (must sum to ~1.0)</h4>

                    <label style={{ display: 'block', marginBottom: '8px' }}>
                        Color Weight: {weights.color.toFixed(2)}
                        <input
                            type="range"
                            min="0"
                            max="1"
                            step="0.05"
                            value={weights.color}
                            onChange={(e) => handleWeightChange('color', e.target.value)}
                            style={{ width: '100%' }}
                        />
                    </label>

                    <label style={{ display: 'block', marginBottom: '8px' }}>
                        Gabor Weight: {weights.gabor.toFixed(2)}
                        <input
                            type="range"
                            min="0"
                            max="1"
                            step="0.05"
                            value={weights.gabor}
                            onChange={(e) => handleWeightChange('gabor', e.target.value)}
                            style={{ width: '100%' }}
                        />
                    </label>

                    <label style={{ display: 'block', marginBottom: '8px' }}>
                        CNN Weight: {weights.cnn.toFixed(2)}
                        <input
                            type="range"
                            min="0"
                            max="1"
                            step="0.05"
                            value={weights.cnn}
                            onChange={(e) => handleWeightChange('cnn', e.target.value)}
                            style={{ width: '100%' }}
                        />
                    </label>

                    <p style={{ fontSize: '12px', color: '#666' }}>
                        Sum: {(weights.color + weights.gabor + weights.cnn).toFixed(2)}
                    </p>
                </div>

                {/* CNN Layer */}
                <div style={{ marginBottom: '15px' }}>
                    <label>
                        <strong>CNN Layer:</strong>
                        <select
                            value={cnnLayer}
                            onChange={(e) => setCnnLayer(e.target.value)}
                            style={{ marginLeft: '10px', padding: '5px', cursor: 'pointer' }}
                        >
                            <option value="block_1_expand_relu">block_1 (Early - 96 ch)</option>
                            <option value="block_3_expand_relu">block_3 (Low - 144 ch)</option>
                            <option value="block_6_expand_relu">block_6 (Mid - 192 ch) - Recommended</option>
                            <option value="block_13_expand_relu">block_13 (High - 576 ch)</option>
                            <option value="out_relu">out_relu (Deep - 1280 ch)</option>
                        </select>
                    </label>
                </div>

                {/* Top K */}
                <div style={{ marginBottom: '15px' }}>
                    <label>
                        <strong>Top K Matches per border:</strong>
                        <input
                            type="number"
                            value={topK}
                            onChange={(e) => setTopK(parseInt(e.target.value) || 10)}
                            min={1}
                            max={50}
                            style={{ marginLeft: '10px', padding: '5px', width: '80px' }}
                        />
                    </label>
                </div>

                {/* Calculate Button */}
                <button
                    onClick={calculateAdjacencyMatrix}
                    disabled={loading}
                    style={{
                        padding: '12px 24px',
                        fontSize: '16px',
                        fontWeight: 'bold',
                        backgroundColor: loading ? '#ccc' : '#9C27B0',
                        color: 'white',
                        border: 'none',
                        borderRadius: '5px',
                        cursor: loading ? 'not-allowed' : 'pointer'
                    }}
                >
                    {loading ? 'Calculating...' : 'Calculate Adjacency Matrix'}
                </button>
            </div>

            {/* Results */}
            {adjacencyData && (
                <>
                    {/* View Mode Selector */}
                    <div style={{ backgroundColor: '#fff', padding: '15px', borderRadius: '5px', marginBottom: '20px' }}>
                        <h3>View Mode</h3>
                        <div style={{ display: 'flex', gap: '10px' }}>
                            <button
                                onClick={() => setViewMode('statistics')}
                                style={{
                                    padding: '10px 20px',
                                    fontSize: '14px',
                                    fontWeight: 'bold',
                                    border: 'none',
                                    borderRadius: '5px',
                                    cursor: 'pointer',
                                    backgroundColor: viewMode === 'statistics' ? '#9C27B0' : '#ddd',
                                    color: viewMode === 'statistics' ? 'white' : '#333'
                                }}
                            >
                                Statistics
                            </button>
                            <button
                                onClick={() => setViewMode('matches')}
                                style={{
                                    padding: '10px 20px',
                                    fontSize: '14px',
                                    fontWeight: 'bold',
                                    border: 'none',
                                    borderRadius: '5px',
                                    cursor: 'pointer',
                                    backgroundColor: viewMode === 'matches' ? '#9C27B0' : '#ddd',
                                    color: viewMode === 'matches' ? 'white' : '#333'
                                }}
                            >
                                Best Matches
                            </button>
                            <button
                                onClick={() => setViewMode('heatmap')}
                                style={{
                                    padding: '10px 20px',
                                    fontSize: '14px',
                                    fontWeight: 'bold',
                                    border: 'none',
                                    borderRadius: '5px',
                                    cursor: 'pointer',
                                    backgroundColor: viewMode === 'heatmap' ? '#9C27B0' : '#ddd',
                                    color: viewMode === 'heatmap' ? 'white' : '#333'
                                }}
                            >
                                Heatmap
                            </button>
                            <button
                                onClick={() => setViewMode('reconstruction')}
                                style={{
                                    padding: '10px 20px',
                                    fontSize: '14px',
                                    fontWeight: 'bold',
                                    border: 'none',
                                    borderRadius: '5px',
                                    cursor: 'pointer',
                                    backgroundColor: viewMode === 'reconstruction' ? '#9C27B0' : '#ddd',
                                    color: viewMode === 'reconstruction' ? 'white' : '#333'
                                }}
                            >
                                Reconstruction
                            </button>
                        </div>
                    </div>

                    {/* Statistics View */}
                    {viewMode === 'statistics' && (
                        <div style={{ backgroundColor: '#fff', padding: '15px', borderRadius: '5px' }}>
                            <h3>Statistics</h3>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                                <div style={{ padding: '10px', backgroundColor: '#f0f0f0', borderRadius: '5px' }}>
                                    <strong>Grid Size:</strong> {adjacencyData.gridSize}×{adjacencyData.gridSize}
                                </div>
                                <div style={{ padding: '10px', backgroundColor: '#f0f0f0', borderRadius: '5px' }}>
                                    <strong>Total Tiles:</strong> {adjacencyData.totalTiles}
                                </div>
                                <div style={{ padding: '10px', backgroundColor: '#f0f0f0', borderRadius: '5px' }}>
                                    <strong>Total Comparisons:</strong> {adjacencyData.statistics.totalComparisons}
                                </div>
                                <div style={{ padding: '10px', backgroundColor: '#f0f0f0', borderRadius: '5px' }}>
                                    <strong>Filtered Matches:</strong> {adjacencyData.statistics.filteredMatches}
                                </div>
                                <div style={{ padding: '10px', backgroundColor: '#e3f2fd', borderRadius: '5px' }}>
                                    <strong>Avg Compatibility:</strong> {adjacencyData.statistics.averageCompatibility.toFixed(4)}
                                </div>
                                <div style={{ padding: '10px', backgroundColor: '#e3f2fd', borderRadius: '5px' }}>
                                    <strong>Std Dev:</strong> {adjacencyData.statistics.stdCompatibility.toFixed(4)}
                                </div>
                                <div style={{ padding: '10px', backgroundColor: '#ffebee', borderRadius: '5px' }}>
                                    <strong>Min Compatibility:</strong> {adjacencyData.statistics.minCompatibility.toFixed(4)}
                                </div>
                                <div style={{ padding: '10px', backgroundColor: '#e8f5e9', borderRadius: '5px' }}>
                                    <strong>Max Compatibility:</strong> {adjacencyData.statistics.maxCompatibility.toFixed(4)}
                                </div>
                            </div>

                            {/* Best Match */}
                            {adjacencyData.statistics.bestMatch && (
                                <div style={{ marginTop: '20px', padding: '15px', backgroundColor: '#e8f5e9', borderRadius: '5px', border: '2px solid #4CAF50' }}>
                                    <h4 style={{ marginTop: 0 }}>Best Overall Match</h4>
                                    <p>
                                        <strong>Tile {adjacencyData.statistics.bestMatch.tileA}</strong> ({adjacencyData.statistics.bestMatch.borderA})
                                        {' → '}
                                        <strong>Tile {adjacencyData.statistics.bestMatch.tileB}</strong> ({adjacencyData.statistics.bestMatch.borderB})
                                        {' with '}
                                        <strong>{adjacencyData.statistics.bestMatch.rotation}° rotation</strong>
                                    </p>
                                    <p>
                                        <strong>Score:</strong> {adjacencyData.statistics.bestMatch.compatibilityScore.toFixed(4)}
                                    </p>
                                    <p style={{ fontSize: '12px' }}>
                                        Color: {adjacencyData.statistics.bestMatch.scores.color.toFixed(4)} |
                                        Gabor: {adjacencyData.statistics.bestMatch.scores.gabor.toFixed(4)} |
                                        CNN: {adjacencyData.statistics.bestMatch.scores.cnn.toFixed(4)}
                                    </p>
                                </div>
                            )}

                            <div style={{ marginTop: '20px', padding: '10px', backgroundColor: '#fffacd', borderRadius: '5px' }}>
                                <p style={{ margin: 0, fontSize: '13px' }}>
                                    <strong>Weights used:</strong> Color: {adjacencyData.weights.color} | Gabor: {adjacencyData.weights.gabor} | CNN: {adjacencyData.weights.cnn}
                                    <br />
                                    <strong>CNN Layer:</strong> {adjacencyData.cnnLayer}
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Best Matches View */}
                    {viewMode === 'matches' && (
                        <div style={{ backgroundColor: '#fff', padding: '15px', borderRadius: '5px' }}>
                            <h3>Best Matches per Tile</h3>

                            {/* Tile Selector */}
                            <div style={{ marginBottom: '15px' }}>
                                <label>
                                    <strong>Select Tile:</strong>
                                    <select
                                        value={selectedTile}
                                        onChange={(e) => setSelectedTile(parseInt(e.target.value))}
                                        style={{ marginLeft: '10px', padding: '8px', cursor: 'pointer' }}
                                    >
                                        {Array.from({ length: adjacencyData.totalTiles }).map((_, i) => (
                                            <option key={i} value={i}>Tile {i}</option>
                                        ))}
                                    </select>
                                </label>
                            </div>

                            {/* Matches for selected tile */}
                            {['top', 'right', 'bottom', 'left'].map(border => {
                                const matches = adjacencyData.adjacencyMatrix.filter(
                                    m => m.tileA === selectedTile && m.borderA === border
                                )

                                return (
                                    <div key={border} style={{ marginBottom: '30px' }}>
                                        <h4 style={{ textTransform: 'uppercase', color: '#9C27B0' }}>
                                            Border: {border} ({matches.length} matches)
                                        </h4>

                                        <div style={{ overflowX: 'auto' }}>
                                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                                                <thead>
                                                    <tr style={{ backgroundColor: '#9C27B0', color: 'white' }}>
                                                        <th style={{ padding: '8px', border: '1px solid #ddd' }}>#</th>
                                                        <th style={{ padding: '8px', border: '1px solid #ddd' }}>Matches Tile</th>
                                                        <th style={{ padding: '8px', border: '1px solid #ddd' }}>Border</th>
                                                        <th style={{ padding: '8px', border: '1px solid #ddd' }}>Rotation</th>
                                                        <th style={{ padding: '8px', border: '1px solid #ddd' }}>Combined Score</th>
                                                        <th style={{ padding: '8px', border: '1px solid #ddd' }}>Color</th>
                                                        <th style={{ padding: '8px', border: '1px solid #ddd' }}>Gabor</th>
                                                        <th style={{ padding: '8px', border: '1px solid #ddd' }}>CNN</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {matches.map((match, idx) => (
                                                        <tr key={idx} style={{ backgroundColor: idx % 2 === 0 ? '#f9f9f9' : 'white' }}>
                                                            <td style={{ padding: '6px', border: '1px solid #ddd', textAlign: 'center' }}>{idx + 1}</td>
                                                            <td style={{ padding: '6px', border: '1px solid #ddd', textAlign: 'center', fontWeight: 'bold' }}>{match.tileB}</td>
                                                            <td style={{ padding: '6px', border: '1px solid #ddd', textAlign: 'center' }}>{match.borderB}</td>
                                                            <td style={{ padding: '6px', border: '1px solid #ddd', textAlign: 'center' }}>{match.rotation}°</td>
                                                            <td style={{ padding: '6px', border: '1px solid #ddd', textAlign: 'center', fontWeight: 'bold', color: '#9C27B0' }}>
                                                                {match.compatibilityScore.toFixed(4)}
                                                            </td>
                                                            <td style={{ padding: '6px', border: '1px solid #ddd', textAlign: 'center' }}>{match.scores.color.toFixed(3)}</td>
                                                            <td style={{ padding: '6px', border: '1px solid #ddd', textAlign: 'center' }}>{match.scores.gabor.toFixed(3)}</td>
                                                            <td style={{ padding: '6px', border: '1px solid #ddd', textAlign: 'center' }}>{match.scores.cnn.toFixed(3)}</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    )}

                    {/* Heatmap View */}
                    {viewMode === 'heatmap' && (
                        <div style={{ backgroundColor: '#fff', padding: '15px', borderRadius: '5px' }}>
                            <h3>Compatibility Heatmap</h3>
                            <p style={{ fontSize: '13px', color: '#666' }}>
                                Heatmap showing average compatibility between each pair of tiles (across all borders and rotations).
                                Green = high compatibility, Red = low compatibility.
                            </p>

                            <HeatmapVisualization adjacencyData={adjacencyData} />
                        </div>
                    )}

                    {/* Reconstruction View */}
                    {viewMode === 'reconstruction' && (
                        <div style={{ backgroundColor: '#fff', padding: '15px', borderRadius: '5px' }}>
                            <h3>Puzzle Reconstruction (Greedy Solver)</h3>
                            <p style={{ fontSize: '13px', color: '#666' }}>
                                Αυτόματη ανακατασκευή του puzzle χρησιμοποιώντας τα best matches.
                                Ο solver ξεκινάει από ένα τυχαίο tile και τοποθετεί τα υπόλοιπα με βάση τα υψηλότερα compatibility scores.
                            </p>

                            <PuzzleReconstruction adjacencyData={adjacencyData} shuffleData={shuffleData} />
                        </div>
                    )}
                </>
            )}
        </div>
    )
}

// Heatmap Component
function HeatmapVisualization({ adjacencyData }) {
    const { totalTiles, adjacencyMatrix } = adjacencyData

    // Calculate average compatibility for each tile pair
    const tileScores = {}

    adjacencyMatrix.forEach(match => {
        const key = `${match.tileA}-${match.tileB}`
        if (!tileScores[key]) {
            tileScores[key] = []
        }
        tileScores[key].push(match.compatibilityScore)
    })

    // Create average scores
    const avgScores = {}
    for (const key in tileScores) {
        const scores = tileScores[key]
        avgScores[key] = scores.reduce((a, b) => a + b, 0) / scores.length
    }

    const cellSize = 50
    const fontSize = 10

    const getColorForScore = (score) => {
        // score is 0-1
        // 0-0.5: red to yellow (hsl: 0° to 60°)
        // 0.5-1: yellow to green (hsl: 60° to 120°)
        const hue = score * 120
        return `hsl(${hue}, 80%, 50%)`
    }

    return (
        <div style={{ overflowX: 'auto', marginTop: '15px' }}>
            <svg width={totalTiles * cellSize} height={totalTiles * cellSize}>
                {/* Grid cells */}
                {Array.from({ length: totalTiles }).map((_, i) =>
                    Array.from({ length: totalTiles }).map((_, j) => {
                        const key = `${i}-${j}`
                        const scores = tileScores[key] || []
                        const avgScore = scores.length > 0
                            ? scores.reduce((a, b) => a + b, 0) / scores.length
                            : 0

                        const color = i === j ? '#888' : getColorForScore(avgScore)

                        return (
                            <g key={`${i}-${j}`}>
                                <rect
                                    x={j * cellSize}
                                    y={i * cellSize}
                                    width={cellSize}
                                    height={cellSize}
                                    fill={color}
                                    stroke="#333"
                                    strokeWidth={1}
                                />
                                {i !== j && (
                                    <text
                                        x={j * cellSize + cellSize / 2}
                                        y={i * cellSize + cellSize / 2}
                                        fontSize={fontSize}
                                        fill="white"
                                        textAnchor="middle"
                                        dominantBaseline="middle"
                                        style={{ fontWeight: 'bold', textShadow: '1px 1px 2px #000' }}
                                    >
                                        {avgScore.toFixed(2)}
                                    </text>
                                )}
                            </g>
                        )
                    })
                )}

                {/* Row labels */}
                {Array.from({ length: totalTiles }).map((_, i) => (
                    <text
                        key={`row-${i}`}
                        x={-5}
                        y={i * cellSize + cellSize / 2}
                        fontSize={fontSize}
                        fill="#333"
                        textAnchor="end"
                        dominantBaseline="middle"
                    >
                        {i}
                    </text>
                ))}

                {/* Column labels */}
                {Array.from({ length: totalTiles }).map((_, j) => (
                    <text
                        key={`col-${j}`}
                        x={j * cellSize + cellSize / 2}
                        y={-5}
                        fontSize={fontSize}
                        fill="#333"
                        textAnchor="middle"
                    >
                        {j}
                    </text>
                ))}
            </svg>

            <div style={{ marginTop: '15px', padding: '10px', backgroundColor: '#f0f0f0', borderRadius: '5px' }}>
                <strong>Legend:</strong>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                        <div style={{ width: '30px', height: '20px', backgroundColor: 'hsl(0, 80%, 50%)', border: '1px solid #333' }}></div>
                        <span style={{ fontSize: '12px' }}>Low (0.0)</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                        <div style={{ width: '30px', height: '20px', backgroundColor: 'hsl(60, 80%, 50%)', border: '1px solid #333' }}></div>
                        <span style={{ fontSize: '12px' }}>Medium (0.5)</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                        <div style={{ width: '30px', height: '20px', backgroundColor: 'hsl(120, 80%, 50%)', border: '1px solid #333' }}></div>
                        <span style={{ fontSize: '12px' }}>High (1.0)</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                        <div style={{ width: '30px', height: '20px', backgroundColor: '#888', border: '1px solid #333' }}></div>
                        <span style={{ fontSize: '12px' }}>Self (diagonal)</span>
                    </div>
                </div>
            </div>
        </div>
    )
}

// Puzzle Reconstruction Component
function PuzzleReconstruction({ adjacencyData, shuffleData }) {
    const { adjacencyMatrix, gridSize, totalTiles } = adjacencyData

    // Greedy Puzzle Solver
    const solvePuzzle = () => {
        const grid = Array(gridSize).fill(null).map(() => Array(gridSize).fill(null))
        const usedTiles = new Set()
        const reconstructedTiles = []

        // Start from tile 0 at position (0,0)
        const startTile = 0
        grid[0][0] = { tileIndex: startTile, rotation: 0 }
        usedTiles.add(startTile)
        reconstructedTiles.push({ tileIndex: startTile, row: 0, col: 0, rotation: 0 })

        // Keep placing tiles until we can't place anymore
        let changed = true
        while (changed && usedTiles.size < totalTiles) {
            changed = false

            // For each position in the grid
            for (let row = 0; row < gridSize; row++) {
                for (let col = 0; col < gridSize; col++) {
                    if (grid[row][col]) continue // Already filled

                    let bestMatch = null
                    let bestScore = -1

                    // Check neighbors
                    const neighbors = []

                    // Top neighbor
                    if (row > 0 && grid[row - 1][col]) {
                        neighbors.push({
                            tile: grid[row - 1][col].tileIndex,
                            border: 'bottom',
                            myBorder: 'top'
                        })
                    }

                    // Left neighbor
                    if (col > 0 && grid[row][col - 1]) {
                        neighbors.push({
                            tile: grid[row][col - 1].tileIndex,
                            border: 'right',
                            myBorder: 'left'
                        })
                    }

                    // Right neighbor
                    if (col < gridSize - 1 && grid[row][col + 1]) {
                        neighbors.push({
                            tile: grid[row][col + 1].tileIndex,
                            border: 'left',
                            myBorder: 'right'
                        })
                    }

                    // Bottom neighbor
                    if (row < gridSize - 1 && grid[row + 1][col]) {
                        neighbors.push({
                            tile: grid[row + 1][col].tileIndex,
                            border: 'top',
                            myBorder: 'bottom'
                        })
                    }

                    if (neighbors.length === 0) continue

                    // For each unused tile, calculate average compatibility with neighbors
                    for (let candidateTile = 0; candidateTile < totalTiles; candidateTile++) {
                        if (usedTiles.has(candidateTile)) continue

                        let totalScore = 0
                        let matchCount = 0

                        neighbors.forEach(neighbor => {
                            // Find best match for this neighbor
                            const matches = adjacencyMatrix.filter(m =>
                                m.tileA === neighbor.tile &&
                                m.borderA === neighbor.border &&
                                m.tileB === candidateTile
                            )

                            if (matches.length > 0) {
                                const bestNeighborMatch = matches.reduce((best, current) =>
                                    current.compatibilityScore > best.compatibilityScore ? current : best
                                )
                                totalScore += bestNeighborMatch.compatibilityScore
                                matchCount++
                            }
                        })

                        const avgScore = matchCount > 0 ? totalScore / matchCount : 0

                        if (avgScore > bestScore) {
                            bestScore = avgScore
                            // Find rotation for best match
                            const firstNeighbor = neighbors[0]
                            const matches = adjacencyMatrix.filter(m =>
                                m.tileA === firstNeighbor.tile &&
                                m.borderA === firstNeighbor.border &&
                                m.tileB === candidateTile
                            )
                            const rotation = matches.length > 0 ? matches[0].rotation : 0

                            bestMatch = { tileIndex: candidateTile, rotation }
                        }
                    }

                    if (bestMatch && bestScore > 0.3) { // Threshold
                        grid[row][col] = bestMatch
                        usedTiles.add(bestMatch.tileIndex)
                        reconstructedTiles.push({
                            tileIndex: bestMatch.tileIndex,
                            row,
                            col,
                            rotation: bestMatch.rotation
                        })
                        changed = true
                    }
                }
            }
        }

        return { grid, reconstructedTiles }
    }

    const { grid: reconstructedGrid, reconstructedTiles } = solvePuzzle()

    // Get ground truth from shuffleData
    const groundTruthGrid = Array(gridSize).fill(null).map(() => Array(gridSize).fill(null))

    shuffleData.tiles.forEach(tile => {
        const row = Math.floor(tile.destPosition / gridSize)
        const col = tile.destPosition % gridSize
        groundTruthGrid[row][col] = {
            tileIndex: tile.sourceIndex,
            rotation: tile.rotation
        }
    })

    // Calculate accuracy
    let correctPositions = 0
    let correctRotations = 0

    for (let row = 0; row < gridSize; row++) {
        for (let col = 0; col < gridSize; col++) {
            if (reconstructedGrid[row][col]) {
                const predicted = reconstructedGrid[row][col]

                // Convert solver's tile index (which is destPosition in shuffled grid)
                // to source index (original position)
                const predictedSourceIndex = shuffleData.tiles.find(
                    t => t.destPosition === predicted.tileIndex
                )?.sourceIndex

                // This position should have this source index to be correct
                const correctSourceIndex = row * gridSize + col

                if (predictedSourceIndex === correctSourceIndex) {
                    correctPositions++

                    // Check rotation too
                    const correctRotation = 0 // Original tiles have 0° rotation
                    if (predicted.rotation === correctRotation) {
                        correctRotations++
                    }
                }
            }
        }
    }

    const positionAccuracy = (correctPositions / totalTiles * 100).toFixed(1)
    const rotationAccuracy = (correctRotations / totalTiles * 100).toFixed(1)

    const cellSize = 100

    return (
        <div>
            {/* Accuracy Metrics */}
            <div style={{ marginBottom: '20px', padding: '15px', backgroundColor: '#e3f2fd', borderRadius: '5px' }}>
                <h4 style={{ marginTop: 0 }}>Accuracy Metrics</h4>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    <div style={{ padding: '10px', backgroundColor: correctPositions === totalTiles ? '#e8f5e9' : '#fff3e0', borderRadius: '5px' }}>
                        <strong>Position Accuracy:</strong> {positionAccuracy}% ({correctPositions}/{totalTiles} correct)
                    </div>
                    <div style={{ padding: '10px', backgroundColor: correctRotations === totalTiles ? '#e8f5e9' : '#fff3e0', borderRadius: '5px' }}>
                        <strong>Rotation Accuracy:</strong> {rotationAccuracy}% ({correctRotations}/{totalTiles} correct)
                    </div>
                </div>
            </div>

            <div style={{ display: 'flex', gap: '30px', flexWrap: 'wrap' }}>
                {/* Predicted Grid */}
                <div>
                    <h4>Predicted Reconstruction</h4>
                    <svg width={gridSize * cellSize} height={gridSize * cellSize} style={{ border: '2px solid #9C27B0' }}>
                        {reconstructedGrid.map((row, rowIdx) =>
                            row.map((cell, colIdx) => {
                                const x = colIdx * cellSize
                                const y = rowIdx * cellSize

                                if (!cell) {
                                    return (
                                        <g key={`pred-${rowIdx}-${colIdx}`}>
                                            <rect
                                                x={x}
                                                y={y}
                                                width={cellSize}
                                                height={cellSize}
                                                fill="#ddd"
                                                stroke="#999"
                                                strokeWidth={3}
                                            />
                                        </g>
                                    )
                                }

                                // Convert solver's tile index to source index
                                const predictedSourceIndex = shuffleData.tiles.find(
                                    t => t.destPosition === cell.tileIndex
                                )?.sourceIndex

                                // This position should have this source index to be correct
                                const correctSourceIndex = rowIdx * gridSize + colIdx

                                const isCorrectPosition = predictedSourceIndex === correctSourceIndex
                                const borderColor = isCorrectPosition ? '#4CAF50' : '#F44336'

                                return (
                                    <g key={`pred-${rowIdx}-${colIdx}`}>
                                        <rect
                                            x={x}
                                            y={y}
                                            width={cellSize}
                                            height={cellSize}
                                            fill='#f0f0f0'
                                            stroke={borderColor}
                                            strokeWidth={3}
                                        />
                                        <text
                                            x={x + cellSize / 2}
                                            y={y + cellSize / 2 - 10}
                                            fontSize={24}
                                            fontWeight="bold"
                                            fill={isCorrectPosition ? '#4CAF50' : '#F44336'}
                                            textAnchor="middle"
                                            dominantBaseline="middle"
                                        >
                                            {predictedSourceIndex !== undefined ? predictedSourceIndex : '?'}
                                        </text>
                                        <text
                                            x={x + cellSize / 2}
                                            y={y + cellSize / 2 + 15}
                                            fontSize={14}
                                            fill="#666"
                                            textAnchor="middle"
                                            dominantBaseline="middle"
                                        >
                                            {cell.rotation}°
                                        </text>
                                    </g>
                                )
                            })
                        )}
                    </svg>
                    <p style={{ fontSize: '12px', marginTop: '8px', color: '#666' }}>
                        Green border = correct position, Red border = wrong position
                    </p>
                </div>

                {/* Ground Truth Grid */}
                <div>
                    <h4>Ground Truth (Original)</h4>
                    <svg width={gridSize * cellSize} height={gridSize * cellSize} style={{ border: '2px solid #4CAF50' }}>
                        {Array.from({ length: gridSize }).map((_, rowIdx) =>
                            Array.from({ length: gridSize }).map((_, colIdx) => {
                                const x = colIdx * cellSize
                                const y = rowIdx * cellSize

                                // This is the SOURCE index (original position)
                                const sourceIndex = rowIdx * gridSize + colIdx

                                return (
                                    <g key={`truth-${rowIdx}-${colIdx}`}>
                                        <rect
                                            x={x}
                                            y={y}
                                            width={cellSize}
                                            height={cellSize}
                                            fill="#e8f5e9"
                                            stroke="#4CAF50"
                                            strokeWidth={2}
                                        />
                                        <text
                                            x={x + cellSize / 2}
                                            y={y + cellSize / 2}
                                            fontSize={24}
                                            fontWeight="bold"
                                            fill="#4CAF50"
                                            textAnchor="middle"
                                            dominantBaseline="middle"
                                        >
                                            {sourceIndex}
                                        </text>
                                        <text
                                            x={x + cellSize / 2}
                                            y={y + cellSize / 2 + 25}
                                            fontSize={12}
                                            fill="#666"
                                            textAnchor="middle"
                                        >
                                            (original)
                                        </text>
                                    </g>
                                )
                            })
                        )}
                    </svg>
                    <p style={{ fontSize: '12px', marginTop: '8px', color: '#666' }}>
                        This is how the tiles were arranged BEFORE shuffle
                    </p>
                </div>
            </div>

            {/* Explanation */}
            <div style={{ marginTop: '20px', padding: '15px', backgroundColor: '#fffacd', borderRadius: '5px' }}>
                <h4 style={{ marginTop: 0 }}>Πώς λειτουργεί ο Solver:</h4>
                <ol style={{ margin: '8px 0', paddingLeft: '20px', fontSize: '13px' }}>
                    <li>Ξεκινάει τοποθετώντας το Tile 0 στην πάνω αριστερή γωνία</li>
                    <li>Για κάθε κενή θέση, κοιτάει τους γείτονες (πάνω, κάτω, αριστερά, δεξιά)</li>
                    <li>Βρίσκει ποιο tile έχει το υψηλότερο μέσο compatibility score με τους γείτονες</li>
                    <li>Τοποθετεί το tile με το rotation που προτείνεται από τα best matches</li>
                    <li>Επαναλαμβάνει μέχρι να μην μπορεί να βρει άλλα matches</li>
                </ol>
                <p style={{ margin: '8px 0', fontSize: '13px' }}>
                    <strong>Σημείωση:</strong> Ο greedy solver δεν είναι πάντα 100% ακριβής γιατί κάνει local decisions.
                    Για καλύτερα αποτελέσματα χρειάζεται πιο προηγμένος αλγόριθμος (π.χ. genetic algorithm, simulated annealing).
                </p>
            </div>
        </div>
    )
}
