import { useContext } from "react"
import { ImageContext } from "../src/App"

export default function GlobalVariables(){
    const {bins, borderWidth, setBins} = useContext(ImageContext)
    return (
        <div style={{ padding: '20px', backgroundColor: '#fff3cd', border: '2px solid #ffc107', marginBottom: '20px' }}>
            <h3>⚙️ Global Settings</h3>
            <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
                <label>
                    Histogram Bins:
                    <input
                        type="number"
                        value={bins}
                        onChange={(e) => setBins(parseInt(e.target.value) || 256)}
                        min="8"
                        max="256"
                        style={{ marginLeft: '10px', width: '80px', padding: '5px' }}
                    />
                </label>
                <label>
                    Border Width (pixels):
                    <input
                        type="number"
                        value={borderWidth}
                        onChange={(e) => setBorderWidth(parseInt(e.target.value) || 5)}
                        min="1"
                        max="50"
                        style={{ marginLeft: '10px', width: '80px', padding: '5px' }}
                    />
                </label>
                <span style={{ fontSize: '12px', color: '#666' }}>
                    These settings are shared across all components
                </span>
            </div>
        </div>
    )
}