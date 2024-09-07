import React, { useState } from 'react';
import axios from 'axios';
import './UploadImages.css'; // Import CSS for styling

// Define the UploadImages component
const UploadImages = () => {
  // State to keep track of selected files
  const [selectedFiles, setSelectedFiles] = useState([]);
  
  // State to store responses or error messages for each uploaded file
  const [uploadResponses, setUploadResponses] = useState([]);
  
  // State to indicate if an upload is in progress
  const [uploading, setUploading] = useState(false);

  const [filePreviews, setFilePreviews] = useState([]);
  
  // Handler for file input changes
  const handleFileChange = (event) => {
    // Convert FileList to an array
    const newFiles = Array.from(event.target.files);

    // Check for duplicate files
    const existingFileNames = new Set(selectedFiles.map(file => file.name));
    const filteredNewFiles = newFiles.filter(file => !existingFileNames.has(file.name));
    
    // Combine existing files with new files
    setSelectedFiles(prevFiles => [...prevFiles, ...filteredNewFiles]);

    // Generate previews for selected images
    const newFilePreviews = filteredNewFiles.map(file => URL.createObjectURL(file));
    setFilePreviews(prevPreviews => [...prevPreviews, ...newFilePreviews]);
  };

  // Handler to upload a single file
  const handleUpload = async (file) => {
    // Create FormData object to send file in the POST request
    const formData = new FormData();
    formData.append('files', file);

    try {
      // Indicate that uploading is in progress
      setUploading(true);
      
      // Perform the file upload request
      const response = await axios.post('http://localhost:5000/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data' // Specify the content type as multipart/form-data
        }
      });

      // Update state with the successful response data
      setUploadResponses(prevResponses => [
        ...prevResponses,
        { filename: file.name, responseData: response.data }
      ]);
    } catch (error) {
      // Update state with an error message if the upload fails
      setUploadResponses(prevResponses => [
        ...prevResponses,
        { filename: file.name, msg: "Error uploading file: " + (error.response ? error.response.data : error.message) }
      ]);
    } finally {
      // Reset uploading state regardless of success or failure
      setUploading(false);
    }
  };

  // Handler for form submission
  const handleSubmit = async (event) => {
    // Prevent the default form submission behavior
    event.preventDefault();

    // Check if any files have been selected
    if (selectedFiles.length === 0) {
      // Display a message if no files are selected
      setUploadResponses([{ filename: "", msg: "Please select files first." }]);
      return;
    }

    // Iterate over each selected file and upload it
    for (const file of selectedFiles) {
      await handleUpload(file);
      
      // Prompt user to decide if they want to upload another file
      const continueUploading = window.confirm("Do you want to upload another file?");
      if (!continueUploading) {
        break;
      }
    }

    // Clear selected files after the upload process
    setSelectedFiles([]);
    setFilePreviews([]);
  };

  const handleRemoveFile = (index) => {
    // Remove file and preview at specified index
    const updateFiles = [...selectedFiles];
    const updatesPreviews = [...filePreviews];  

    updateFiles.splice(index, 1);
    updatesPreviews.splice(index, 1);
    setSelectedFiles(updateFiles);
    setFilePreviews(updatesPreviews);
  }

  return (
    <div>
      <h1>Upload Images</h1>
      <form onSubmit={handleSubmit}>
        <input 
          type="file" 
          multiple
          onChange={handleFileChange} 
        />
        <button type="submit" disabled={uploading}>Upload</button>
      </form>
      <div className="preview-container">
        {filePreviews.map((preview, index) => (
          <div key={index} className="preview-item">
            <img src={preview} alt={`preview-${index}`} className="preview-image" />
            <button 
              className="remove-button" 
              onClick={() => handleRemoveFile(index)}
            >
              X
            </button>
          </div>
        ))}
      </div>
      <div>
        {uploadResponses.map((response, index) => (
          <div key={index} className="upload-response">
            <div className="response-item">
              {response.preview && (
                <img src={response.preview} alt={`preview-${index}`} className="response-image" />
              )}
              <div className="response-info">
                <h3>{response.filename}</h3>
                {response.responseData ? (
                  <pre>{JSON.stringify(response.responseData, null, 2)}</pre>
                ) : (
                  <p>{response.msg}</p>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default UploadImages;