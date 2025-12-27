import {useContext} from "react"
import {AppContext} from "../src/App"

import "../styles/UploadImage.css" // corresponding style

export default function UploadImage(){

    const {file, setFile} = useContext(AppContext)

    function handleChange(e){
        console.log(e.target.files[0])
        setFile(URL.createObjectURL(e.target.files[0]))
    }

    return(
        <div>
            <h2>Add Image:</h2>
            <input type="file" onChange={handleChange} />
            { file && <img src={file} className="imageUploadHolder" alt="Uploaded preview" /> }
        </div>
    )
}