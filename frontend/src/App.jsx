import './App.css'
import { createContext, useState, useContext } from 'react'
import InsertImage from "../components/InsertImage"
import ShuffleImage from '../components/ShuffleImage'
import BorderStrips from '../components/BorderStrips'
import TileHistograms from '../components/TileHistograms'
import BorderHistograms from '../components/BorderHistograms'
import TextureFeatures from '../components/TextureFeatures'
import BorderTextureFeatures from '../components/BorderTextureFeatures'
import TileDistances from '../components/TileDistances'
import GlobalVariables from '../components/GlobalVariables'

const ImageContext = createContext()

export default function App() {

  const [image, setImage] = useState(null)
  const [originalPositions, setOriginalPositions] = useState([]) // Αρχικές θέσεις tiles
  const [currentPositions, setCurrentPositions] = useState([]) // Θέσεις μετά το shuffle
  const [tiles, setTiles] = useState([]) // Τα tiles μετά το shuffle

  // Global settings για histograms
  const [bins, setBins] = useState(256)
  const [borderWidth, setBorderWidth] = useState(5)

console.log(tiles)
  // Helper function για να εμφανίζει τον πίνακα σε μορφή grid
  const displayGrid = (positions, gridSize, showRotation = false) => {
    if (positions.length === 0) return

    const grid = Array(gridSize).fill(null).map(() => Array(gridSize).fill(null))

    positions.forEach(pos => {
      grid[pos.row][pos.col] = showRotation ? pos.rotation : pos.id
    })

    console.table(grid)
  }

  // Εμφάνιση όταν αλλάζουν οι θέσεις
  if (originalPositions.length > 0) {
    const gridSize = Math.sqrt(originalPositions.length)
    console.log('Original Positions (IDs):')
    displayGrid(originalPositions, gridSize, false)
    console.log('Current Positions - IDs (Shuffled):')
    displayGrid(currentPositions, gridSize, false)
    console.log('Current Positions - Rotations (Shuffled):')
    displayGrid(currentPositions, gridSize, true)
  }
  return (
    <ImageContext.Provider
      value={{
        image,
        setImage,
        originalPositions,
        setOriginalPositions,
        currentPositions,
        setCurrentPositions,
        tiles,
        setTiles,
        bins,
        setBins,
        borderWidth,
        setBorderWidth
      }}
    >
      <GlobalVariables/>
      <InsertImage />
      <ShuffleImage />
      <BorderStrips />
      <TileHistograms />
      <BorderHistograms />
      <TextureFeatures />
      <BorderTextureFeatures />
      <TileDistances />
    </ImageContext.Provider>
  )
}

export {ImageContext}