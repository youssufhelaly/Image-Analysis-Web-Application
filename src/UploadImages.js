import React, { useState } from 'react';
import axios from 'axios';

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


  return (
    <div>
      <h1>Upload Images</h1>
      <form onSubmit={handleSubmit}>
        <input 
          type="file" 
          multiple // Allow multiple file selection
          onChange={handleFileChange} // Set handler for file input changes
        />
        <button type="submit" disabled={uploading}>Upload</button> {/* Disable button while uploading */}
      </form>
      <div>
        {filePreviews.map((preview, index) => (
          <img key={index} src={preview} alt={`preview-${index}`} style={{ maxWidth: '100px', maxHeight: '100px' }} />
        ))}
      </div>
      <div>
        {uploadResponses.map((response, index) => (
          <div key={index}>
            <h3>{response.filename}</h3>
            {response.responseData ? (
              // Display formatted response data if available
              <pre>{JSON.stringify(response.responseData, null, 2)}</pre>
            ) : (
              // Display error message if response data is not available
              <p>{response.msg}</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default UploadImages;
