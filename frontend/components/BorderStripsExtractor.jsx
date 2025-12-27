import { useContext, useRef, useState, useEffect } from "react"
import { AppContext } from "../src/App"

export default function BorderStripsExtractor() {
    const { file, shuffleData, setHistogramData } = useContext(AppContext)
    const [borderWidth, setBorderWidth] = useState(5)
    const [bins, setBins] = useState(16)
    const [imageLoaded, setImageLoaded] = useState(false)
    const [borderStrips, setBorderStrips] = useState(null)
    const imageRef = useRef(new Image())
    const canvasRef = useRef(null)

    useEffect(() => {
        if (file) {
            imageRef.current.src = file
            imageRef.current.onload = () => {
                setImageLoaded(true)
            }
        }
    }, [file])

    const extractBorderStrips = () => {
        if (!imageLoaded || !shuffleData) {
            console.warn('Image not loaded or no shuffle data available')
            return
        }

        const img = imageRef.current
        const { gridSize, tiles } = shuffleData

        const tileWidth = img.width / gridSize
        const tileHeight = img.height / gridSize

        const allBorderStrips = []

        // Για κάθε tile
        tiles.forEach((tile, index) => {
            // Δημιουργώ temporary canvas για το tile
            const tempCanvas = document.createElement('canvas')
            const tempCtx = tempCanvas.getContext('2d')

            tempCanvas.width = tileWidth
            tempCanvas.height = tileHeight

            // Υπολογίζω source position
            const sourceRow = Math.floor(tile.sourceIndex / gridSize)
            const sourceCol = tile.sourceIndex % gridSize

            // Ζωγραφίζω το tile με rotation
            tempCtx.save()
            tempCtx.translate(tileWidth / 2, tileHeight / 2)
            tempCtx.rotate((tile.rotation * Math.PI) / 180)
            tempCtx.drawImage(
                img,
                sourceCol * tileWidth, sourceRow * tileHeight, tileWidth, tileHeight,
                -tileWidth / 2, -tileHeight / 2, tileWidth, tileHeight
            )
            tempCtx.restore()

            // Εξάγω τα 4 border strips
            const top = tempCtx.getImageData(0, 0, tileWidth, borderWidth)
            const bottom = tempCtx.getImageData(0, tileHeight - borderWidth, tileWidth, borderWidth)
            const left = tempCtx.getImageData(0, 0, borderWidth, tileHeight)
            const right = tempCtx.getImageData(tileWidth - borderWidth, 0, borderWidth, tileHeight)

            allBorderStrips.push({
                tileIndex: index,
                sourceIndex: tile.sourceIndex,
                destPosition: tile.destPosition,
                rotation: tile.rotation,
                borders: {
                    top: top,
                    right: right,
                    bottom: bottom,
                    left: left
                }
            })
        })

        setBorderStrips(allBorderStrips)
        console.log('Border Strips εξάχθηκαν:', allBorderStrips)

        // Εμφάνιση preview
        visualizeBorderStrips(allBorderStrips)
    }

    const visualizeBorderStrips = (strips) => {
        if (!canvasRef.current) return

        const canvas = canvasRef.current
        const ctx = canvas.getContext('2d')

        const { gridSize } = shuffleData
        const tileWidth = imageRef.current.width / gridSize
        const tileHeight = imageRef.current.height / gridSize

        // Canvas για preview (θα δείξουμε τα borders γύρω από κάθε tile)
        canvas.width = imageRef.current.width
        canvas.height = imageRef.current.height

        ctx.clearRect(0, 0, canvas.width, canvas.height)

        strips.forEach((strip) => {
            const destRow = Math.floor(strip.destPosition / gridSize)
            const destCol = strip.destPosition % gridSize

            const x = destCol * tileWidth
            const y = destRow * tileHeight

            // Ζωγραφίζω τα borders
            ctx.putImageData(strip.borders.top, x, y)
            ctx.putImageData(strip.borders.bottom, x, y + tileHeight - borderWidth)
            ctx.putImageData(strip.borders.left, x, y)
            ctx.putImageData(strip.borders.right, x + tileWidth - borderWidth, y)
        })
    }

    const handleBorderWidthChange = (e) => {
        const value = parseInt(e.target.value) || 5
        setBorderWidth(value)
    }

    const handleBinsChange = (e) => {
        const value = parseInt(e.target.value) || 16
        setBins(value)
    }

    const sendToBackend = async () => {
        if (!borderStrips || !shuffleData) {
            console.warn('No border strips or shuffle data available')
            return
        }

        try {
            // Δημιουργία FormData
            const formData = new FormData()

            // Fetch της εικόνας και μετατροπή σε Blob
            const imageResponse = await fetch(file)
            const imageBlob = await imageResponse.blob()

            // Προσθήκη δεδομένων στο FormData
            formData.append('image', imageBlob, 'image.jpg')
            formData.append('gridSize', shuffleData.gridSize.toString())
            formData.append('borderWidth', borderWidth.toString())
            formData.append('bins', bins.toString())
            formData.append('tiles', JSON.stringify(shuffleData.tiles))

            console.log('Sending to backend:', {
                gridSize: shuffleData.gridSize,
                borderWidth: borderWidth,
                bins: bins,
                totalTiles: shuffleData.tiles.length
            })

            // API call
            const response = await fetch('/api/calculate-histograms', {
                method: 'POST',
                body: formData
            })

            const data = await response.json()

            if (data.status === 'success') {
                console.log('Border strips saved, histograms, Gabor and CNN features calculated:', data)

                // Αποθήκευση των histogram data στο Context
                setHistogramData(data)

                alert(`Success! Saved ${data.totalImages} border strip images and calculated:\n- Color Histograms\n- Gabor Texture Features\n- Deep CNN Features (MobileNetV2)\nfor ${data.totalTiles} tiles`)
            } else {
                console.error('Backend error:', data)
                alert('Error saving border strips')
            }

        } catch (error) {
            console.error('Error sending to backend:', error)
            alert('Network error: ' + error.message)
        }
    }

    return (
        <div>
            <h2>Border Strips Extractor</h2>

            {!shuffleData && (
                <p style={{ color: 'orange' }}>
                    Πρέπει πρώτα να κάνεις Shuffle στην εικόνα!
                </p>
            )}

            <section>
                <label htmlFor="borderWidth">Border Width (pixels): </label>
                <input
                    type="number"
                    name="borderWidth"
                    id="borderWidth"
                    value={borderWidth}
                    onChange={handleBorderWidthChange}
                    min={1}
                    max={50}
                />
            </section>

            <section style={{ marginTop: '10px' }}>
                <label htmlFor="bins">Histogram Bins (συμπίεση): </label>
                <select
                    name="bins"
                    id="bins"
                    value={bins}
                    onChange={handleBinsChange}
                    style={{ padding: '5px', cursor: 'pointer' }}
                >
                    <option value={16}>16 bins (πολύ συμπιεσμένο)</option>
                    <option value={32}>32 bins (συμπιεσμένο)</option>
                    <option value={64}>64 bins (μέτριο)</option>
                    <option value={128}>128 bins (ελαφρύ)</option>
                    <option value={256}>256 bins (χωρίς συμπίεση)</option>
                </select>
                <span style={{ marginLeft: '10px', fontSize: '12px', color: '#666' }}>
                    Λιγότερα bins = μικρότερο μέγεθος δεδομένων
                </span>
            </section>

            <section>
                <button
                    onClick={extractBorderStrips}
                    disabled={!imageLoaded || !shuffleData}
                >
                    Extract Border Strips
                </button>

                <button
                    onClick={sendToBackend}
                    disabled={!borderStrips}
                    style={{ marginLeft: '10px' }}
                >
                    Send to Backend
                </button>
            </section>

            {shuffleData && (
                <p>
                    Grid: {shuffleData.gridSize}x{shuffleData.gridSize}
                    ({shuffleData.tiles.length} tiles)
                </p>
            )}

            <section>
                <h3>Border Strips Preview</h3>
                <canvas ref={canvasRef} style={{ border: '1px solid #ccc' }}></canvas>
            </section>
        </div>
    )
}
