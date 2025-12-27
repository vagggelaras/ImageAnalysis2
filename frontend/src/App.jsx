import React, { useState, useEffect, createContext } from 'react'
import UploadImage from '../components/UploadImage'
import ShuffleAndRotateImage from '../components/ShuffleAndRotateImage'
import BorderStripsEctractor from '../components/BorderStripsExtractor'
import ColorHistogram from '../components/ColorHistogram'
import GaborFeatures from '../components/GaborFeatures'
import CnnFeatures from '../components/CnnFeatures'
import AdjacencyMatrixViewer from '../components/AdjacencyMatrixViewer'

export const AppContext = createContext()

export default function App() {
  const [message, setMessage] = useState('')
  const [file, setFile] = useState("/test2.jpg")
  const [shuffleData, setShuffleData] = useState(null)
  const [histogramData, setHistogramData] = useState(null)

  useEffect(() => {
    // GET request στο backend
    fetch('/api/hello')
      .then(res => res.json())
      .then(data => setMessage(data.message));
  }, [])

  const sendData = async () => {
    const response = await fetch('/api/data', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Vaggelis', age: 25 })
    });
    const data = await response.json();
    console.log(data);
  }

  const values = { message, setMessage, sendData, file, setFile, shuffleData, setShuffleData, histogramData, setHistogramData }

  return (
    <AppContext.Provider value={values}>
      <UploadImage/>
      <ShuffleAndRotateImage/>
      <BorderStripsEctractor/>
      <ColorHistogram/>
      <GaborFeatures/>
      <CnnFeatures/>
      <AdjacencyMatrixViewer/>
    </AppContext.Provider>
  )
}