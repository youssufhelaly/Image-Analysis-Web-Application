import React, { useState } from 'react';
import axios from 'axios';
import './UploadImages.css'; // Import CSS for styling

/**
 * UploadImages Component
 * Handles image file uploads, searches for objects in the images,
 * and displays file previews and responses.
 */
const UploadImages = () => {
  // State to keep track of selected files
  const [selectedFiles, setSelectedFiles] = useState([]);

  // State to store responses or error messages for each uploaded file
  const [uploadResponses, setUploadResponses] = useState([]);

  // State to indicate if an upload is in progress
  const [uploading, setUploading] = useState(false);

  // State to store file previews
  const [filePreviews, setFilePreviews] = useState([]);

  // State to store the target object to search for
  const [targetObject, setTargetObject] = useState("");

  // State to store the responses for target object searches
  const [targetResponses, setTargetResponses] = useState([]);

  /**
   * Handles changes to the file input element.
   * Adds new files to the selected files state and generates previews.
   * @param {Event} event - The file input change event.
   */
  const handleFileChange = (event) => {
    // Convert FileList to an array
    const newFiles = Array.from(event.target.files);

    // Check for duplicate files by comparing file names
    const existingFileNames = new Set(selectedFiles.map(file => file.name));
    const filteredNewFiles = newFiles.filter(file => !existingFileNames.has(file.name));

    // Combine existing files with new files
    setSelectedFiles(prevFiles => [...prevFiles, ...filteredNewFiles]);

    // Generate previews for the new files
    const newFilePreviews = filteredNewFiles.map(file => URL.createObjectURL(file));
    setFilePreviews(prevPreviews => [...prevPreviews, ...newFilePreviews]);
  };

  /**
   * Sends a POST request to search for the target object within the image data.
   * Updates the target responses state with the results.
   * @param {string} targetObject - The object to search for.
   * @param {Object} data - The image data from the upload response.
   * @param {File} file - The file being processed.
   */
  const FindTargetObject = async (targetObject, data, file) => {
    try {
      const response = await axios.post('http://localhost:5000/find-object', {
        targetObject,
        data
      });

      if (response.data.found) {
        console.log('Object found:', data);
        setTargetResponses(prevResponses => [
          ...prevResponses,
          { filename: file.name, responseData: data, preview: URL.createObjectURL(file) }
        ]);
      } else {
        console.log('Object not found:', data);
      }
    } catch (error) {
      console.error('Error finding target object:', error);
      setTargetResponses(prevResponses => [
        ...prevResponses,
        { filename: file.name, msg: "Error finding target object: " + (error.response ? error.response.data : error.message) }
      ]);
    }
  };

  /**
   * Uploads a single file to the server.
   * Handles form submission and performs the upload and target object search.
   * @param {File} file - The file to upload.
   */
  const handleUpload = async (file) => {
    // Create FormData object to send file in the POST request
    const formData = new FormData();
    formData.append('files', file);

    try {
      setUploading(true);

      // Perform the file upload request
      const response = await axios.post('http://localhost:5000/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data' // Specify the content type
        }
      });

      // Search for the target object in the uploaded data
      await FindTargetObject(targetObject, response.data, file);
    } catch (error) {
      setUploadResponses(prevResponses => [
        ...prevResponses,
        { filename: file.name, msg: "Error uploading file: " + (error.response ? error.response.data : error.message) }
      ]);
    } finally {
      // Reset uploading state regardless of success or failure
      setUploading(false);
    }
  };

  /**
   * Handles form submission for uploading files.
   * Iterates over selected files and uploads each one, prompting the user to upload more.
   * @param {Event} event - The form submit event.
   */
  const handleSubmit = async (event) => {
    event.preventDefault();

    if (selectedFiles.length === 0) {
      setUploadResponses([{ filename: "", msg: "Please select files first." }]);
      return;
    }

    for (const file of selectedFiles) {
      await handleUpload(file);

      // Prompt user to decide if they want to upload another file
      const continueUploading = window.confirm("Do you want to upload another file?");
      if (!continueUploading) {
        break;
      }
    }

    // Clear selected files and previews after the upload process
    setSelectedFiles([]);
    setFilePreviews([]);
  };

  /**
   * Removes a file and its preview from the selected files and previews.
   * @param {number} index - The index of the file to remove.
   */
  const handleRemoveFile = (index) => {
    const updateFiles = [...selectedFiles];
    const updatesPreviews = [...filePreviews];  

    updateFiles.splice(index, 1);
    updatesPreviews.splice(index, 1);
    setSelectedFiles(updateFiles);
    setFilePreviews(updatesPreviews);
  };

  return (
    <div>
      <h1>Upload Images</h1>
      <form onSubmit={handleSubmit}>
        <input 
          type="file" 
          multiple
          onChange={handleFileChange} 
        />
        <button type="submit" disabled={uploading}>Find</button>
      </form>
      <input 
        className='target-object' 
        value={targetObject} 
        placeholder="Enter object to find" 
        onChange={(event) => setTargetObject(event.target.value)}
      />
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
        {targetResponses.map((response, index) => (
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
