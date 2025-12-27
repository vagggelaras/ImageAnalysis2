import { useContext, useRef, useState, useEffect } from "react"
import { AppContext } from "../src/App"

import "../styles/ShuffledImage.css" //styles

export default function ShuffleAndRotateImage(){

    const { file, setShuffleData } = useContext(AppContext)
    const originalCanvasRef = useRef(null)
    const shuffledCanvasRef = useRef(null)
    const [gridSize, setGridSize] = useState(2)
    const [imageLoaded, setImageLoaded] = useState(false)
    const imageRef = useRef(new Image())

    useEffect(() => {
        if (file) {
            imageRef.current.src = file
            imageRef.current.onload = () => {
                setImageLoaded(true)
                drawGrid(originalCanvasRef, false)
            }
        }
    }, [file])

    // Fisher-Yates shuffle algorithm
    const shuffleArray = (array) => {
        const shuffled = [...array]
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
        }
        return shuffled
    }

    const drawGrid = (canvasRef, shuffle = false) => {
        if (!imageLoaded || !canvasRef.current) return

        const canvas = canvasRef.current
        const ctx = canvas.getContext('2d')
        const img = imageRef.current

        canvas.width = img.width
        canvas.height = img.height

        const tileWidth = img.width / gridSize
        const tileHeight = img.height / gridSize

        ctx.clearRect(0, 0, canvas.width, canvas.height)

        // Δημιουργώ array με όλες τις θέσεις
        const totalTiles = gridSize * gridSize
        let positions = Array.from({ length: totalTiles }, (_, i) => i)
console.log(positions)
        // Μετατροπή 1D array σε 2D για console log
        const convertTo2D = (arr) => {
            const result = []
            for (let i = 0; i < gridSize; i++) {
                result.push(arr.slice(i * gridSize, (i + 1) * gridSize))
            }
            return result
        }

        // Console.log για αρχικές θέσεις
        console.log('Αρχικές θέσεις (Initial Positions):')
        console.table(convertTo2D(positions))

        // Αν shuffle, ανακατεύω τις θέσεις
        if (shuffle) {
            positions = shuffleArray(positions)

            // Console.log για shuffled θέσεις
            console.log('Shuffled θέσεις (Shuffled Positions):')
            console.table(convertTo2D(positions))
        }

        // Array για rotations και tiles metadata
        const rotations = []
        const tilesMetadata = []

        // Ζωγραφίζω κάθε tile
        for (let i = 0; i < totalTiles; i++) {
            const sourceRow = Math.floor(i / gridSize)
            const sourceCol = i % gridSize

            const destIndex = positions[i]
            const destRow = Math.floor(destIndex / gridSize)
            const destCol = destIndex % gridSize

            const destX = destCol * tileWidth
            const destY = destRow * tileHeight

            ctx.save()

            // Μετακινούμαι στο κέντρο του destination tile
            ctx.translate(destX + tileWidth / 2, destY + tileHeight / 2)

            // Τυχαίο rotation αν shuffle = true
            let rotationDegrees = 0
            if (shuffle) {
                const randomRotation = Math.floor(Math.random() * 4)
                rotationDegrees = randomRotation * 90 // 0, 90, 180, 270 degrees
                const rotation = (randomRotation * Math.PI) / 2
                ctx.rotate(rotation)
            }
            rotations.push(rotationDegrees)

            // Αποθηκεύω metadata για το tile
            if (shuffle) {
                tilesMetadata.push({
                    sourceIndex: i,
                    destPosition: destIndex,
                    rotation: rotationDegrees
                })
            }

            // Ζωγραφίζω το source tile στο destination
            ctx.drawImage(
                img,
                sourceCol * tileWidth, sourceRow * tileHeight, tileWidth, tileHeight,
                -tileWidth / 2, -tileHeight / 2, tileWidth, tileHeight
            )

            ctx.restore()
        }

        // Console.log για rotations
        if (shuffle) {
            console.log('Rotations (σε μοίρες):')
            console.table(convertTo2D(rotations))

            // Αποθηκεύω το shuffleData στο Context
            setShuffleData({
                gridSize: gridSize,
                tiles: tilesMetadata
            })

            console.log('Shuffle Data αποθηκεύτηκε στο Context:', {
                gridSize: gridSize,
                tiles: tilesMetadata
            })
        }
    }

    const handleShuffle = () => {
        drawGrid(shuffledCanvasRef, true)
    }

    const handleGridChange = (e) => {
        const value = parseInt(e.target.value) || 2
        setGridSize(value)
    }

    useEffect(() => {
        if (imageLoaded) {
            drawGrid(originalCanvasRef, false)
        }
    }, [gridSize, imageLoaded])

    return (
        <div>
            <section>
                <label htmlFor="gridDimensions">Enter grid dimensions  </label>
                <input
                    type="number"
                    name="gridDimensions"
                    className="gridDimensions"
                    defaultValue={2}
                    onChange={handleGridChange}
                    min={2}
                    max={20}
                />
            </section>

            <section style={{ display: 'flex', gap: '20px' }}>
                <div>
                    <h3>Original Grid</h3>
                    <canvas ref={originalCanvasRef} className="shuffledImage"></canvas>
                </div>
                <div>
                    <h3>Shuffled Grid</h3>
                    <canvas ref={shuffledCanvasRef} className="shuffledImage"></canvas>
                </div>
            </section>

            <section>
                <button onClick={handleShuffle}>Shuffle</button>
            </section>
        </div>
    )
}