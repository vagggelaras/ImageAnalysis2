import { useState, useContext } from "react"
import { ImageContext } from "../src/App"

export default function ShuffleImage() {
    const { image, setOriginalPositions, setCurrentPositions, tiles, setTiles } = useContext(ImageContext)
    const [gridSize, setGridSize] = useState(3)
// console.log(image)
    const splitImage = () => {
        if (!image) {
            alert('Επέλεξε πρώτα εικόνα!')
            return
        }

        const img = new Image()
        img.src = image

        img.onload = () => {
            const canvas = document.createElement('canvas')
            const ctx = canvas.getContext('2d')

            const tileWidth = img.width / gridSize
            const tileHeight = img.height / gridSize

            canvas.width = tileWidth
            canvas.height = tileHeight

            const tilesArray = []
            const originalPos = [] // Αρχικές θέσεις

            for (let row = 0; row < gridSize; row++) {
                for (let col = 0; col < gridSize; col++) {
                    ctx.clearRect(0, 0, tileWidth, tileHeight)

                    ctx.drawImage(
                        img,
                        col * tileWidth,
                        row * tileHeight,
                        tileWidth,
                        tileHeight,
                        0,
                        0,
                        tileWidth,
                        tileHeight
                    )

                    const tileId = row * gridSize + col

                    tilesArray.push({
                        id: tileId,
                        url: canvas.toDataURL(),
                        row,
                        col
                    })

                    // Αποθήκευση αρχικής θέσης (rotation πάντα 0)
                    originalPos.push({
                        id: tileId,
                        row: row,
                        col: col,
                        rotation: 0
                    })
                }
            }

            // Shuffle τα tiles
            const shuffled = [...tilesArray].sort(() => Math.random() - 0.5)

            // Προσθήκη τυχαίας περιστροφής σε κάθε tile
            const rotations = [0, 90, 180, 270]
            const shuffledWithRotation = shuffled.map(tile => ({
                ...tile,
                rotation: rotations[Math.floor(Math.random() * rotations.length)]
            }))

            // Δημιουργία πίνακα με θέσεις μετά το shuffle
            const currentPos = shuffledWithRotation.map((tile, index) => ({
                id: tile.id,
                row: Math.floor(index / gridSize),
                col: index % gridSize,
                rotation: tile.rotation
            }))

            // Ενημέρωση του context
            setOriginalPositions(originalPos)
            setCurrentPositions(currentPos)
            setTiles(shuffledWithRotation)
        }
    }

    return (
        <div>
            <input
                type="number"
                placeholder="Select grid template"
                value={gridSize}
                onChange={(e) => setGridSize(parseInt(e.target.value) || 3)}
                min="2"
                max="10"
            />
            <button onClick={splitImage}>
                Shuffle Image
            </button>

            {tiles.length > 0 && (
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: `repeat(${gridSize}, 1fr)`,
                    gap: '5px',
                    marginTop: '20px'
                }}>
                    {tiles.map(tile => (
                        <img
                            key={tile.id}
                            src={tile.url}
                            alt={`Tile ${tile.id}`}
                            style={{
                                width: '100%',
                                transform: `rotate(${tile.rotation}deg)`
                            }}
                        />
                    ))}
                </div>
            )}
        </div>
    )
}