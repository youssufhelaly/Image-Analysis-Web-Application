import React, { useState } from 'react';
import axios from 'axios';
import { Box, Button, TextField, Grid, Typography, CircularProgress, Card, CardMedia, CardContent } from '@mui/material';
import { useDropzone } from 'react-dropzone';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './UploadImages.css'; // Import CSS for additional styling

/**
 * UploadImages Component
 * Handles image file uploads, provides drag-and-drop functionality,
 * searches for objects within the uploaded images, and displays previews and results.
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
   * Handles file drop using React Dropzone.
   * Adds new files to the selected files state and generates previews.
   * Filters out duplicate files by comparing file names.
   * @param {Array} acceptedFiles - The files dropped or selected by the user.
   */
  const onDrop = (acceptedFiles) => {
    // Filter out duplicate files by comparing file names
    const existingFileNames = new Set(selectedFiles.map(file => file.name));
    const filteredNewFiles = acceptedFiles.filter(file => !existingFileNames.has(file.name));

    // Combine existing files with new files
    setSelectedFiles(prevFiles => [...prevFiles, ...filteredNewFiles]);

    // Generate previews for the new files
    const newFilePreviews = filteredNewFiles.map(file => URL.createObjectURL(file));
    setFilePreviews(prevPreviews => [...prevPreviews, ...newFilePreviews]);
  };

  // Extract Dropzone props for drag-and-drop functionality
  const { getRootProps, getInputProps } = useDropzone({ onDrop });

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
   * Handles file upload and invokes the target object search.
   * Provides feedback using React Toastify.
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
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      // Search for the target object in the uploaded data
      await FindTargetObject(targetObject, response.data, file);
      toast.success('File uploaded successfully!');
    } catch (error) {
      setUploadResponses(prevResponses => [
        ...prevResponses,
        { filename: file.name, msg: "Error uploading file: " + (error.response ? error.response.data : error.message) }
      ]);
      toast.error('Error uploading file: ' + (error.response ? error.response.data : error.message));
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
      toast.error('Please select files first.');
      return;
    }

    for (const file of selectedFiles) {
      await handleUpload(file);
      const continueUploading = window.confirm("Do you want to upload another file?");
      if (!continueUploading) break;
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
    <Box sx={{ padding: 4 }}>
      <Typography variant="h4" gutterBottom>Upload Images</Typography>
      <form onSubmit={handleSubmit}>
        {/* Drag and drop area for file uploads */}
        <Box {...getRootProps()} sx={{ border: '2px dashed #ccc', padding: 4, textAlign: 'center', marginBottom: 2 }}>
          <input {...getInputProps()} />
          <Typography variant="body1">Drag & drop some files here, or click to select files</Typography>
        </Box>
        {/* Input for target object search */}
        <TextField 
          fullWidth 
          label="Enter object to find" 
          variant="outlined" 
          value={targetObject} 
          onChange={(e) => setTargetObject(e.target.value)} 
          sx={{ marginBottom: 2 }}
        />
        {/* Button to start the upload process */}
        {uploading ? <CircularProgress /> : (
          <Button variant="contained" color="primary" type="submit">Find</Button>
        )}
      </form>
      {/* Displaying file previews */}
      <Grid container spacing={2} sx={{ marginTop: 2 }}>
        {filePreviews.map((preview, index) => (
          <Grid item xs={12} md={4} key={index}>
            <Card>
              <CardMedia
                component="img"
                height="140"
                image={preview}
                alt={`preview-${index}`}
              />
              <CardContent>
                <Typography variant="h6">{selectedFiles[index].name}</Typography>
                <Button 
                  variant="contained" 
                  color="secondary" 
                  onClick={() => handleRemoveFile(index)}
                  sx={{ marginTop: 1 }}
                >
                  Remove
                </Button>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
      {/* Toast notifications container */}
      <ToastContainer />
    </Box>
  );
};

export default UploadImages;
