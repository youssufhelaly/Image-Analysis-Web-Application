import React, { useState } from 'react';
import axios from 'axios';

const UploadImages = () => {
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [uploadResponses, setUploadResponses] = useState([]);
  const [uploading, setUploading] = useState(false);

  const handleFileChange = (event) => {
    const files = Array.from(event.target.files);
    setSelectedFiles(files);
  };   

  const handleUpload = async (file) => {
    const formData = new FormData();
    formData.append('files', file);

    try {
      setUploading(true);
      const response = await axios.post('http://localhost:5000/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      // Add successful response data to state
      setUploadResponses(prevResponses => [
        ...prevResponses,
        { filename: file.name, responseData: response.data }
      ]);
    } catch (error) {
      // Add error message to state
      setUploadResponses(prevResponses => [
        ...prevResponses,
        { filename: file.name, msg: "Error uploading file: " + (error.response ? error.response.data : error.message) }
      ]);
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (selectedFiles.length === 0) {
      setUploadResponses([{ filename: "", msg: "Please select files first." }]);
      return;
    }

    for (const file of selectedFiles) {
      await handleUpload(file);
      const continueUploading = window.confirm("Do you want to upload another file?");
      if (!continueUploading) {
        break;
      }
    }

    setSelectedFiles([]);
  };

  return (
    <div>
      <h1>Upload Images</h1>
      <form onSubmit={handleSubmit}>
        <input 
          type="file" 
          multiple
          webkitdirectory=""
          onChange={handleFileChange} 
        />
        <button type="submit" disabled={uploading}>Upload</button>
      </form>
      <div>
        {uploadResponses.map((response, index) => (
          <div key={index}>
            <h3>{response.filename}</h3>
            {response.responseData ? (
              <pre>{JSON.stringify(response.responseData, null, 2)}</pre>
            ) : (
              <p>{response.msg}</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default UploadImages;
