import { useContext, useRef, useState, useEffect } from "react"
import { AppContext } from "../src/App"

export default function ImageReconstruction() {
    const { file, shuffleData, adjacencyData } = useContext(AppContext)

    const greedyCanvasRef = useRef(null)
    const annealingCanvasRef = useRef(null)
    const originalCanvasRef = useRef(null)
    const shuffledCanvasRef = useRef(null)
    const imageRef = useRef(new Image())

    const [imageLoaded, setImageLoaded] = useState(false)
    const [greedyGrid, setGreedyGrid] = useState(null)
    const [annealingGrid, setAnnealingGrid] = useState(null)
    const [greedyAccuracy, setGreedyAccuracy] = useState(null)
    const [annealingAccuracy, setAnnealingAccuracy] = useState(null)
    const [annealingParams, setAnnealingParams] = useState({
        initialTemp: 100,
        coolingRate: 0.95,
        iterations: 1000
    })

    // Load image
    useEffect(() => {
        if (file) {
            imageRef.current.src = file
            imageRef.current.onload = () => {
                setImageLoaded(true)
            }
        }
    }, [file])

    // Greedy Puzzle Solver (όπως στο AdjacencyMatrixViewer)
    const solvePuzzle = () => {
        if (!adjacencyData || !shuffleData) return null

        const { adjacencyMatrix, gridSize, totalTiles } = adjacencyData
        const grid = Array(gridSize).fill(null).map(() => Array(gridSize).fill(null))
        const usedTiles = new Set()

        // Start from tile 0 at position (0,0)
        const startTile = 0
        grid[0][0] = { tileIndex: startTile, rotation: 0 }
        usedTiles.add(startTile)

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
                        changed = true
                    }
                }
            }
        }

        return grid
    }

    // Simulated Annealing Solver
    const solveWithSimulatedAnnealing = () => {
        if (!adjacencyData || !shuffleData) return null

        const { adjacencyMatrix, gridSize, totalTiles } = adjacencyData

        // Helper: Calculate total energy (cost) of a configuration
        const calculateEnergy = (grid) => {
            let totalEnergy = 0
            let validPairs = 0

            for (let row = 0; row < gridSize; row++) {
                for (let col = 0; col < gridSize; col++) {
                    const cell = grid[row][col]
                    if (!cell) continue

                    // Check right neighbor
                    if (col < gridSize - 1 && grid[row][col + 1]) {
                        const rightCell = grid[row][col + 1]

                        // Find compatibility score
                        const match = adjacencyMatrix.find(m =>
                            m.tileA === cell.tileIndex &&
                            m.borderA === 'right' &&
                            m.tileB === rightCell.tileIndex &&
                            m.borderB === 'left' &&
                            m.rotation === rightCell.rotation
                        )

                        if (match) {
                            // Lower energy = better match (invert compatibility score)
                            totalEnergy -= match.compatibilityScore
                            validPairs++
                        } else {
                            totalEnergy += 1 // Penalty for no match
                        }
                    }

                    // Check bottom neighbor
                    if (row < gridSize - 1 && grid[row + 1][col]) {
                        const bottomCell = grid[row + 1][col]

                        const match = adjacencyMatrix.find(m =>
                            m.tileA === cell.tileIndex &&
                            m.borderA === 'bottom' &&
                            m.tileB === bottomCell.tileIndex &&
                            m.borderB === 'top' &&
                            m.rotation === bottomCell.rotation
                        )

                        if (match) {
                            totalEnergy -= match.compatibilityScore
                            validPairs++
                        } else {
                            totalEnergy += 1
                        }
                    }
                }
            }

            return totalEnergy
        }

        // Initialize with random configuration
        const initializeRandomGrid = () => {
            const tiles = Array.from({ length: totalTiles }, (_, i) => i)
            const shuffledTiles = [...tiles].sort(() => Math.random() - 0.5)

            const grid = Array(gridSize).fill(null).map(() => Array(gridSize).fill(null))

            for (let i = 0; i < totalTiles; i++) {
                const row = Math.floor(i / gridSize)
                const col = i % gridSize
                const rotation = [0, 90, 180, 270][Math.floor(Math.random() * 4)]

                grid[row][col] = {
                    tileIndex: shuffledTiles[i],
                    rotation: rotation
                }
            }

            return grid
        }

        // Clone grid
        const cloneGrid = (grid) => {
            return grid.map(row => row.map(cell => cell ? { ...cell } : null))
        }

        // Swap two random tiles or rotate a random tile
        const perturb = (grid) => {
            const newGrid = cloneGrid(grid)

            if (Math.random() < 0.5) {
                // Swap two tiles
                const pos1 = Math.floor(Math.random() * totalTiles)
                const pos2 = Math.floor(Math.random() * totalTiles)

                const row1 = Math.floor(pos1 / gridSize)
                const col1 = pos1 % gridSize
                const row2 = Math.floor(pos2 / gridSize)
                const col2 = pos2 % gridSize

                const temp = newGrid[row1][col1]
                newGrid[row1][col1] = newGrid[row2][col2]
                newGrid[row2][col2] = temp
            } else {
                // Rotate a random tile
                const pos = Math.floor(Math.random() * totalTiles)
                const row = Math.floor(pos / gridSize)
                const col = pos % gridSize

                if (newGrid[row][col]) {
                    const rotations = [0, 90, 180, 270]
                    newGrid[row][col].rotation = rotations[Math.floor(Math.random() * 4)]
                }
            }

            return newGrid
        }

        // Simulated Annealing main loop
        let currentGrid = initializeRandomGrid()
        let currentEnergy = calculateEnergy(currentGrid)
        let bestGrid = cloneGrid(currentGrid)
        let bestEnergy = currentEnergy

        let temperature = annealingParams.initialTemp

        console.log('Starting Simulated Annealing...')
        console.log(`Initial energy: ${currentEnergy.toFixed(4)}`)

        for (let i = 0; i < annealingParams.iterations; i++) {
            // Generate neighbor
            const newGrid = perturb(currentGrid)
            const newEnergy = calculateEnergy(newGrid)

            // Calculate energy difference
            const deltaE = newEnergy - currentEnergy

            // Accept or reject
            if (deltaE < 0 || Math.random() < Math.exp(-deltaE / temperature)) {
                // Accept new solution
                currentGrid = newGrid
                currentEnergy = newEnergy

                // Update best if better
                if (newEnergy < bestEnergy) {
                    bestGrid = cloneGrid(newGrid)
                    bestEnergy = newEnergy
                    console.log(`Iteration ${i}: New best energy = ${bestEnergy.toFixed(4)}`)
                }
            }

            // Cool down
            temperature *= annealingParams.coolingRate

            // Log progress every 100 iterations
            if (i % 100 === 0) {
                console.log(`Iteration ${i}: Temp = ${temperature.toFixed(2)}, Energy = ${currentEnergy.toFixed(4)}`)
            }
        }

        console.log(`Final best energy: ${bestEnergy.toFixed(4)}`)
        return bestGrid
    }

    // Calculate accuracy
    const calculateAccuracy = (grid) => {
        if (!grid || !shuffleData) return null

        const gridSize = shuffleData.gridSize
        let correctPositions = 0
        let correctRotations = 0
        let totalTiles = gridSize * gridSize

        for (let row = 0; row < gridSize; row++) {
            for (let col = 0; col < gridSize; col++) {
                if (grid[row][col]) {
                    const predicted = grid[row][col]

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

        return {
            positionAccuracy: (correctPositions / totalTiles * 100).toFixed(1),
            rotationAccuracy: (correctRotations / totalTiles * 100).toFixed(1),
            correctPositions,
            correctRotations,
            totalTiles
        }
    }

    // Draw reconstructed image on canvas
    const drawReconstructedImage = (grid, canvasRef) => {
        if (!imageLoaded || !grid || !shuffleData) return

        const canvas = canvasRef.current
        if (!canvas) return

        const ctx = canvas.getContext('2d')
        const img = imageRef.current
        const gridSize = shuffleData.gridSize

        canvas.width = img.width
        canvas.height = img.height

        const tileWidth = img.width / gridSize
        const tileHeight = img.height / gridSize

        ctx.clearRect(0, 0, canvas.width, canvas.height)

        // Draw each tile according to reconstruction grid
        for (let row = 0; row < gridSize; row++) {
            for (let col = 0; col < gridSize; col++) {
                const cell = grid[row][col]

                if (!cell) {
                    // Draw empty cell
                    ctx.fillStyle = '#ddd'
                    ctx.fillRect(col * tileWidth, row * tileHeight, tileWidth, tileHeight)
                    ctx.strokeStyle = '#999'
                    ctx.strokeRect(col * tileWidth, row * tileHeight, tileWidth, tileHeight)
                    continue
                }

                // Get the shuffled tile info
                const shuffledTileInfo = shuffleData.tiles.find(
                    t => t.destPosition === cell.tileIndex
                )

                if (!shuffledTileInfo) continue

                // Source position (original tile position in the original image)
                const sourceIndex = shuffledTileInfo.sourceIndex
                const sourceRow = Math.floor(sourceIndex / gridSize)
                const sourceCol = sourceIndex % gridSize

                // Destination position on canvas
                const destX = col * tileWidth
                const destY = row * tileHeight

                ctx.save()

                // Move to center of destination tile
                ctx.translate(destX + tileWidth / 2, destY + tileHeight / 2)

                // Apply rotation from reconstruction (UNDO the shuffle rotation, then apply reconstruction rotation)
                // Total rotation = reconstruction rotation - shuffle rotation
                const totalRotation = (cell.rotation - shuffledTileInfo.rotation + 360) % 360
                const rotationRadians = (totalRotation * Math.PI) / 180
                ctx.rotate(rotationRadians)

                // Draw the source tile
                ctx.drawImage(
                    img,
                    sourceCol * tileWidth, sourceRow * tileHeight, tileWidth, tileHeight,
                    -tileWidth / 2, -tileHeight / 2, tileWidth, tileHeight
                )

                ctx.restore()

                // Draw border to show correctness
                const predictedSourceIndex = sourceIndex
                const correctSourceIndex = row * gridSize + col
                const isCorrect = predictedSourceIndex === correctSourceIndex

                ctx.strokeStyle = isCorrect ? '#4CAF50' : '#F44336'
                ctx.lineWidth = 3
                ctx.strokeRect(destX, destY, tileWidth, tileHeight)
            }
        }
    }

    // Draw original image
    const drawOriginalImage = () => {
        if (!imageLoaded) return

        const canvas = originalCanvasRef.current
        if (!canvas) return

        const ctx = canvas.getContext('2d')
        const img = imageRef.current

        canvas.width = img.width
        canvas.height = img.height

        ctx.drawImage(img, 0, 0)
    }

    // Draw shuffled image (από το shuffleData)
    const drawShuffledImage = () => {
        if (!imageLoaded || !shuffleData) return

        const canvas = shuffledCanvasRef.current
        if (!canvas) return

        const ctx = canvas.getContext('2d')
        const img = imageRef.current
        const gridSize = shuffleData.gridSize

        canvas.width = img.width
        canvas.height = img.height

        const tileWidth = img.width / gridSize
        const tileHeight = img.height / gridSize

        ctx.clearRect(0, 0, canvas.width, canvas.height)

        // Draw each shuffled tile
        shuffleData.tiles.forEach(tile => {
            const sourceIndex = tile.sourceIndex
            const destPosition = tile.destPosition
            const rotation = tile.rotation

            const sourceRow = Math.floor(sourceIndex / gridSize)
            const sourceCol = sourceIndex % gridSize

            const destRow = Math.floor(destPosition / gridSize)
            const destCol = destPosition % gridSize

            const destX = destCol * tileWidth
            const destY = destRow * tileHeight

            ctx.save()

            // Move to center of destination tile
            ctx.translate(destX + tileWidth / 2, destY + tileHeight / 2)

            // Apply rotation
            const rotationRadians = (rotation * Math.PI) / 180
            ctx.rotate(rotationRadians)

            // Draw the source tile
            ctx.drawImage(
                img,
                sourceCol * tileWidth, sourceRow * tileHeight, tileWidth, tileHeight,
                -tileWidth / 2, -tileHeight / 2, tileWidth, tileHeight
            )

            ctx.restore()
        })
    }

    // Greedy Reconstruct button handler
    const handleGreedyReconstruct = () => {
        console.log('Starting Greedy Solver...')
        const grid = solvePuzzle()
        if (grid) {
            setGreedyGrid(grid)
            const acc = calculateAccuracy(grid)
            setGreedyAccuracy(acc)
            console.log('Greedy Grid:', grid)
            console.log('Greedy Accuracy:', acc)
        }
    }

    // Simulated Annealing Reconstruct button handler
    const handleAnnealingReconstruct = () => {
        console.log('Starting Simulated Annealing Solver...')
        const grid = solveWithSimulatedAnnealing()
        if (grid) {
            setAnnealingGrid(grid)
            const acc = calculateAccuracy(grid)
            setAnnealingAccuracy(acc)
            console.log('Annealing Grid:', grid)
            console.log('Annealing Accuracy:', acc)
        }
    }

    // Draw images when data changes
    useEffect(() => {
        if (imageLoaded) {
            drawOriginalImage()
        }
    }, [imageLoaded])

    useEffect(() => {
        if (imageLoaded && shuffleData) {
            drawShuffledImage()
        }
    }, [imageLoaded, shuffleData])

    useEffect(() => {
        if (imageLoaded && greedyGrid) {
            drawReconstructedImage(greedyGrid, greedyCanvasRef)
        }
    }, [imageLoaded, greedyGrid])

    useEffect(() => {
        if (imageLoaded && annealingGrid) {
            drawReconstructedImage(annealingGrid, annealingCanvasRef)
        }
    }, [imageLoaded, annealingGrid])

    // Check if we have all required data
    if (!file) {
        return (
            <div style={{ padding: '20px', backgroundColor: '#f5f5f5', borderRadius: '8px', marginTop: '20px' }}>
                <h2 style={{ color: '#333', borderBottom: '2px solid #FF5722', paddingBottom: '10px' }}>
                    Image Reconstruction (Phase 4)
                </h2>
                <p style={{ color: 'orange' }}>
                    Πρέπει πρώτα να ανεβάσεις μια εικόνα!
                </p>
            </div>
        )
    }

    if (!shuffleData) {
        return (
            <div style={{ padding: '20px', backgroundColor: '#f5f5f5', borderRadius: '8px', marginTop: '20px' }}>
                <h2 style={{ color: '#333', borderBottom: '2px solid #FF5722', paddingBottom: '10px' }}>
                    Image Reconstruction (Phase 4)
                </h2>
                <p style={{ color: 'orange' }}>
                    Πρέπει πρώτα να κάνεις shuffle την εικόνα!
                </p>
            </div>
        )
    }

    if (!adjacencyData) {
        return (
            <div style={{ padding: '20px', backgroundColor: '#f5f5f5', borderRadius: '8px', marginTop: '20px' }}>
                <h2 style={{ color: '#333', borderBottom: '2px solid #FF5722', paddingBottom: '10px' }}>
                    Image Reconstruction (Phase 4)
                </h2>
                <p style={{ color: 'orange' }}>
                    Πρέπει πρώτα να υπολογίσεις το Adjacency Matrix!
                </p>
            </div>
        )
    }

    return (
        <div style={{ padding: '20px', backgroundColor: '#f5f5f5', borderRadius: '8px', marginTop: '20px' }}>
            <h2 style={{ color: '#333', borderBottom: '2px solid #FF5722', paddingBottom: '10px' }}>
                Image Reconstruction - Ανακατασκευή Εικόνας
            </h2>

            {/* Algorithm Selection and Controls */}
            <div style={{ backgroundColor: '#fff', padding: '15px', borderRadius: '5px', marginBottom: '20px' }}>
                <h3>Reconstruction Algorithms</h3>

                <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap', marginBottom: '20px' }}>
                    {/* Greedy Solver */}
                    <div style={{ flex: '1', minWidth: '300px' }}>
                        <h4 style={{ color: '#2196F3', marginTop: 0 }}>Greedy Solver</h4>
                        <p style={{ fontSize: '13px', color: '#666' }}>
                            Τοποθετεί tiles βήμα-βήμα με βάση το καλύτερο local match. Γρήγορος αλλά μπορεί να κολλήσει σε local minima.
                        </p>
                        <button
                            onClick={handleGreedyReconstruct}
                            style={{
                                padding: '12px 24px',
                                fontSize: '14px',
                                fontWeight: 'bold',
                                backgroundColor: '#2196F3',
                                color: 'white',
                                border: 'none',
                                borderRadius: '5px',
                                cursor: 'pointer'
                            }}
                        >
                            Run Greedy Solver
                        </button>
                    </div>

                    {/* Simulated Annealing */}
                    <div style={{ flex: '1', minWidth: '300px' }}>
                        <h4 style={{ color: '#FF5722', marginTop: 0 }}>Simulated Annealing</h4>
                        <p style={{ fontSize: '13px', color: '#666' }}>
                            Πιθανοτικός αλγόριθμος που δέχεται χειρότερες λύσεις για να αποφύγει local minima. Πιο αργός αλλά καλύτερα αποτελέσματα.
                        </p>

                        {/* Annealing Parameters */}
                        <div style={{ marginBottom: '10px' }}>
                            <label style={{ display: 'block', fontSize: '12px', marginBottom: '5px' }}>
                                Initial Temperature: {annealingParams.initialTemp}
                                <input
                                    type="range"
                                    min="10"
                                    max="500"
                                    value={annealingParams.initialTemp}
                                    onChange={(e) => setAnnealingParams({...annealingParams, initialTemp: parseInt(e.target.value)})}
                                    style={{ width: '100%' }}
                                />
                            </label>
                            <label style={{ display: 'block', fontSize: '12px', marginBottom: '5px' }}>
                                Cooling Rate: {annealingParams.coolingRate.toFixed(3)}
                                <input
                                    type="range"
                                    min="0.8"
                                    max="0.99"
                                    step="0.01"
                                    value={annealingParams.coolingRate}
                                    onChange={(e) => setAnnealingParams({...annealingParams, coolingRate: parseFloat(e.target.value)})}
                                    style={{ width: '100%' }}
                                />
                            </label>
                            <label style={{ display: 'block', fontSize: '12px', marginBottom: '5px' }}>
                                Iterations: {annealingParams.iterations}
                                <input
                                    type="range"
                                    min="100"
                                    max="5000"
                                    step="100"
                                    value={annealingParams.iterations}
                                    onChange={(e) => setAnnealingParams({...annealingParams, iterations: parseInt(e.target.value)})}
                                    style={{ width: '100%' }}
                                />
                            </label>
                        </div>

                        <button
                            onClick={handleAnnealingReconstruct}
                            style={{
                                padding: '12px 24px',
                                fontSize: '14px',
                                fontWeight: 'bold',
                                backgroundColor: '#FF5722',
                                color: 'white',
                                border: 'none',
                                borderRadius: '5px',
                                cursor: 'pointer'
                            }}
                        >
                            Run Simulated Annealing
                        </button>
                    </div>
                </div>
            </div>

            {/* Accuracy Metrics Comparison */}
            {(greedyAccuracy || annealingAccuracy) && (
                <div style={{ backgroundColor: '#e3f2fd', padding: '15px', borderRadius: '5px', marginBottom: '20px' }}>
                    <h3 style={{ marginTop: 0 }}>Accuracy Comparison</h3>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                        {/* Greedy Accuracy */}
                        {greedyAccuracy && (
                            <div style={{ backgroundColor: '#fff', padding: '15px', borderRadius: '5px', border: '2px solid #2196F3' }}>
                                <h4 style={{ marginTop: 0, color: '#2196F3' }}>Greedy Solver</h4>
                                <div style={{ marginBottom: '10px' }}>
                                    <strong>Position Accuracy:</strong>
                                    <div style={{
                                        padding: '8px',
                                        backgroundColor: greedyAccuracy.correctPositions === greedyAccuracy.totalTiles ? '#e8f5e9' : '#fff3e0',
                                        borderRadius: '5px',
                                        marginTop: '5px'
                                    }}>
                                        {greedyAccuracy.positionAccuracy}% ({greedyAccuracy.correctPositions}/{greedyAccuracy.totalTiles})
                                    </div>
                                </div>
                                <div>
                                    <strong>Rotation Accuracy:</strong>
                                    <div style={{
                                        padding: '8px',
                                        backgroundColor: greedyAccuracy.correctRotations === greedyAccuracy.totalTiles ? '#e8f5e9' : '#fff3e0',
                                        borderRadius: '5px',
                                        marginTop: '5px'
                                    }}>
                                        {greedyAccuracy.rotationAccuracy}% ({greedyAccuracy.correctRotations}/{greedyAccuracy.totalTiles})
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Annealing Accuracy */}
                        {annealingAccuracy && (
                            <div style={{ backgroundColor: '#fff', padding: '15px', borderRadius: '5px', border: '2px solid #FF5722' }}>
                                <h4 style={{ marginTop: 0, color: '#FF5722' }}>Simulated Annealing</h4>
                                <div style={{ marginBottom: '10px' }}>
                                    <strong>Position Accuracy:</strong>
                                    <div style={{
                                        padding: '8px',
                                        backgroundColor: annealingAccuracy.correctPositions === annealingAccuracy.totalTiles ? '#e8f5e9' : '#fff3e0',
                                        borderRadius: '5px',
                                        marginTop: '5px'
                                    }}>
                                        {annealingAccuracy.positionAccuracy}% ({annealingAccuracy.correctPositions}/{annealingAccuracy.totalTiles})
                                    </div>
                                </div>
                                <div>
                                    <strong>Rotation Accuracy:</strong>
                                    <div style={{
                                        padding: '8px',
                                        backgroundColor: annealingAccuracy.correctRotations === annealingAccuracy.totalTiles ? '#e8f5e9' : '#fff3e0',
                                        borderRadius: '5px',
                                        marginTop: '5px'
                                    }}>
                                        {annealingAccuracy.rotationAccuracy}% ({annealingAccuracy.correctRotations}/{annealingAccuracy.totalTiles})
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Winner Display */}
                    {greedyAccuracy && annealingAccuracy && (
                        <div style={{ marginTop: '15px', padding: '10px', backgroundColor: '#fffacd', borderRadius: '5px' }}>
                            <strong>Winner: </strong>
                            {parseFloat(annealingAccuracy.positionAccuracy) > parseFloat(greedyAccuracy.positionAccuracy) ? (
                                <span style={{ color: '#FF5722', fontWeight: 'bold' }}>Simulated Annealing 🏆</span>
                            ) : parseFloat(greedyAccuracy.positionAccuracy) > parseFloat(annealingAccuracy.positionAccuracy) ? (
                                <span style={{ color: '#2196F3', fontWeight: 'bold' }}>Greedy Solver 🏆</span>
                            ) : (
                                <span style={{ fontWeight: 'bold' }}>Tie! 🤝</span>
                            )}
                        </div>
                    )}
                </div>
            )}

            {/* Image Comparison */}
            <div style={{ backgroundColor: '#fff', padding: '15px', borderRadius: '5px' }}>
                <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', justifyContent: 'center' }}>

                    {/* Greedy Reconstructed Image */}
                    {greedyGrid && (
                        <div style={{ textAlign: 'center' }}>
                            <h3 style={{ color: '#2196F3' }}>Greedy Reconstructed</h3>
                            <canvas
                                ref={greedyCanvasRef}
                                style={{
                                    maxWidth: '300px',
                                    height: 'auto',
                                    border: '3px solid #2196F3',
                                    borderRadius: '5px'
                                }}
                            />
                            <p style={{ fontSize: '12px', color: '#666', marginTop: '8px' }}>
                                Green = σωστή θέση, Red = λάθος
                            </p>
                            {greedyAccuracy && (
                                <p style={{ fontSize: '12px', fontWeight: 'bold', color: '#2196F3' }}>
                                    {greedyAccuracy.positionAccuracy}% position accuracy
                                </p>
                            )}
                        </div>
                    )}

                    {/* Annealing Reconstructed Image */}
                    {annealingGrid && (
                        <div style={{ textAlign: 'center' }}>
                            <h3 style={{ color: '#FF5722' }}>Annealing Reconstructed</h3>
                            <canvas
                                ref={annealingCanvasRef}
                                style={{
                                    maxWidth: '300px',
                                    height: 'auto',
                                    border: '3px solid #FF5722',
                                    borderRadius: '5px'
                                }}
                            />
                            <p style={{ fontSize: '12px', color: '#666', marginTop: '8px' }}>
                                Green = σωστή θέση, Red = λάθος
                            </p>
                            {annealingAccuracy && (
                                <p style={{ fontSize: '12px', fontWeight: 'bold', color: '#FF5722' }}>
                                    {annealingAccuracy.positionAccuracy}% position accuracy
                                </p>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Explanation */}
            <div style={{ marginTop: '20px', padding: '15px', backgroundColor: '#fffacd', borderRadius: '5px' }}>
                <h4 style={{ marginTop: 0 }}>Πώς λειτουργούν οι αλγόριθμοι:</h4>

                <div style={{ marginBottom: '15px' }}>
                    <strong style={{ color: '#2196F3' }}>Greedy Solver:</strong>
                    <ul style={{ margin: '5px 0', paddingLeft: '20px', fontSize: '13px' }}>
                        <li>Ξεκινάει από το Tile 0 στην πάνω αριστερή γωνία</li>
                        <li>Για κάθε κενή θέση, βρίσκει το tile με το υψηλότερο compatibility score με τους γείτονες</li>
                        <li>Τοποθετεί το tile και συνεχίζει (δεν επιστρέφει ποτέ πίσω)</li>
                        <li><strong>Πλεονεκτήματα:</strong> Γρήγορος, απλός, προβλέψιμος</li>
                        <li><strong>Μειονεκτήματα:</strong> Μπορεί να κολλήσει σε local minima</li>
                    </ul>
                </div>

                <div>
                    <strong style={{ color: '#FF5722' }}>Simulated Annealing:</strong>
                    <ul style={{ margin: '5px 0', paddingLeft: '20px', fontSize: '13px' }}>
                        <li>Ξεκινάει από μια τυχαία διάταξη και σταδιακά τη βελτιώνει</li>
                        <li>Δέχεται και χειρότερες λύσεις με πιθανότητα που εξαρτάται από τη "θερμοκρασία"</li>
                        <li>Η θερμοκρασία μειώνεται σταδιακά (cooling), κάνοντας τον αλγόριθμο πιο συντηρητικό</li>
                        <li><strong>Πλεονεκτήματα:</strong> Αποφεύγει local minima, βρίσκει καλύτερες λύσεις</li>
                        <li><strong>Μειονεκτήματα:</strong> Πιο αργός, χρειάζεται tuning παραμέτρων</li>
                    </ul>
                </div>

                <p style={{ marginTop: '15px', fontSize: '13px', fontStyle: 'italic' }}>
                    <strong>Σημείωση:</strong> Green borders = σωστή θέση, Red borders = λάθος θέση
                </p>
            </div>
        </div>
    )
}
