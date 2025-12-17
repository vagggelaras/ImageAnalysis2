import { useState, useContext } from "react"
import { ImageContext } from "../src/App"

export default function BorderStrips(){
    const { image, currentPositions, borderWidth, setBorderWidth } = useContext(ImageContext)
    const [borderStrips, setBorderStrips] = useState([])

    const generateBorderStrips = () => {
        if (!image || currentPositions.length === 0) {
            alert('Κάνε πρώτα shuffle την εικόνα!')
            return
        }

        const gridSize = Math.sqrt(currentPositions.length)
        const img = new Image()
        img.src = image

        img.onload = () => {
            const tileWidth = img.width / gridSize
            const tileHeight = img.height / gridSize
            const canvas = document.createElement('canvas')
            const ctx = canvas.getContext('2d')

            const allBorderStrips = []

            currentPositions.forEach(pos => {
                // Υπολογισμός πραγματικής θέσης του tile στην αρχική εικόνα
                const originalRow = Math.floor(pos.id / gridSize)
                const originalCol = pos.id % gridSize

                const sourceX = originalCol * tileWidth
                const sourceY = originalRow * tileHeight

                // Top strip
                canvas.width = tileWidth
                canvas.height = borderWidth
                ctx.clearRect(0, 0, tileWidth, borderWidth)
                ctx.drawImage(
                    img,
                    sourceX,
                    sourceY,
                    tileWidth,
                    borderWidth,
                    0,
                    0,
                    tileWidth,
                    borderWidth
                )
                const topStrip = canvas.toDataURL()

                // Bottom strip
                canvas.width = tileWidth
                canvas.height = borderWidth
                ctx.clearRect(0, 0, tileWidth, borderWidth)
                ctx.drawImage(
                    img,
                    sourceX,
                    sourceY + tileHeight - borderWidth,
                    tileWidth,
                    borderWidth,
                    0,
                    0,
                    tileWidth,
                    borderWidth
                )
                const bottomStrip = canvas.toDataURL()

                // Left strip
                canvas.width = borderWidth
                canvas.height = tileHeight
                ctx.clearRect(0, 0, borderWidth, tileHeight)
                ctx.drawImage(
                    img,
                    sourceX,
                    sourceY,
                    borderWidth,
                    tileHeight,
                    0,
                    0,
                    borderWidth,
                    tileHeight
                )
                const leftStrip = canvas.toDataURL()

                // Right strip
                canvas.width = borderWidth
                canvas.height = tileHeight
                ctx.clearRect(0, 0, borderWidth, tileHeight)
                ctx.drawImage(
                    img,
                    sourceX + tileWidth - borderWidth,
                    sourceY,
                    borderWidth,
                    tileHeight,
                    0,
                    0,
                    borderWidth,
                    tileHeight
                )
                const rightStrip = canvas.toDataURL()

                allBorderStrips.push({
                    tileId: pos.id,
                    position: pos,
                    strips: {
                        top: topStrip,
                        bottom: bottomStrip,
                        left: leftStrip,
                        right: rightStrip
                    }
                })
            })

            setBorderStrips(allBorderStrips)
        }
    }

    return <div>
        <span>Give border's width:</span>
        <input
            type="number"
            value={borderWidth}
            onChange={(e) => setBorderWidth(parseInt(e.target.value) || 5)}
            min="1"
            max="50"
        />
        <button onClick={generateBorderStrips}>
            Generate Border Strips
        </button>

        {borderStrips.length > 0 && (
            <div style={{ marginTop: '20px' }}>
                <h3>Border Strips - Total: {borderStrips.length} tiles</h3>
                <div style={{ maxHeight: '600px', overflowY: 'auto', border: '2px solid #ccc', padding: '10px' }}>
                    {borderStrips.map(item => (
                        <div key={item.tileId} style={{ marginBottom: '20px', border: '1px solid black', padding: '10px' }}>
                            <p>Tile ID: {item.tileId} at position ({item.position.row}, {item.position.col})</p>
                            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                                <div>
                                    <p>Top</p>
                                    <img src={item.strips.top} alt="top"  />
                                </div>
                                <div>
                                    <p>Bottom</p>
                                    <img src={item.strips.bottom} alt="bottom"  />
                                </div>
                                <div>
                                    <p>Left</p>
                                    <img src={item.strips.left} alt="left"  />
                                </div>
                                <div>
                                    <p>Right</p>
                                    <img src={item.strips.right} alt="right"  />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        )}
    </div>
}