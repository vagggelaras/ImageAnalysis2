import { useState, useContext, useEffect } from "react"
import { ImageContext } from "../src/App"

export default function InsertImage(){
    const { setImage } = useContext(ImageContext)
    const defaultImage = '/squares3.jpg'
    const [selectedImage, setSelectedImage] = useState(defaultImage)
    const [preview, setPreview] = useState(defaultImage)

    useEffect(() => {
        // Resize και την default εικόνα στο φόρτωμα
        const loadDefaultImage = async () => {
            const img = new Image()
            img.onload = async () => {
                const canvas = document.createElement('canvas')
                canvas.width = 200
                canvas.height = 200
                const ctx = canvas.getContext('2d')
                ctx.drawImage(img, 0, 0, 200, 200)
                const resizedDefault = canvas.toDataURL('image/jpeg', 0.95)
                setPreview(resizedDefault)
                setImage(resizedDefault)
            }
            img.src = defaultImage
        }
        loadDefaultImage()
    }, [])

    const resizeImage = (imageDataUrl, targetWidth = 200, targetHeight = 200) => {
        return new Promise((resolve) => {
            const img = new Image()
            img.onload = () => {
                // Δημιουργία canvas
                const canvas = document.createElement('canvas')
                canvas.width = targetWidth
                canvas.height = targetHeight

                const ctx = canvas.getContext('2d')

                // Σχεδίαση της resized εικόνας
                ctx.drawImage(img, 0, 0, targetWidth, targetHeight)

                // Εξαγωγή ως data URL
                resolve(canvas.toDataURL('image/jpeg', 0.95))
            }
            img.src = imageDataUrl
        })
    }

    const handleImageChange = async (e) => {
        const file = e.target.files[0]

        if (file) {
            setSelectedImage(file)

            // Διάβασμα αρχείου
            const reader = new FileReader()
            reader.onloadend = async () => {
                // Resize σε 200x200
                const resizedImage = await resizeImage(reader.result, 200, 200)

                setPreview(resizedImage)
                setImage(resizedImage)
            }
            reader.readAsDataURL(file)
        }
    }

    return (
        <div className="uploadImage">
            <input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
            />

            {preview && (
                <div>
                    <img src={preview} alt="Preview" style={{ maxWidth: '300px' }} />
                </div>
            )}
        </div>
    );
}