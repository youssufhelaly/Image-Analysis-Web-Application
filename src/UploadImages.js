import React, { useState } from 'react';
import JSZip from 'jszip';
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

  // State to indicate if an upload is in progress
  const [uploading, setUploading] = useState(false);

  // State to store file previews
  const [filePreviews, setFilePreviews] = useState([]);

  // State to store the target object to search for
  const [targetObject, setTargetObject] = useState("");

  // State to store the responses for target object searches
  const [targetResponses, setTargetResponses] = useState([]);

  // State to indicate if a search has been performed
  const [searchPerformed, setSearchPerformed] = useState(false);

  // State to check if all files have been searched
  const [searchCompletion, setSearchCompletion] = useState(false);

  /**
   * Handles file drop using React Dropzone.
   * Adds new files to the selected files state and generates previews.
   * Filters out duplicate files by comparing file names.
   * @param {Array} acceptedFiles - The files dropped or selected by the user.
   */
    const onDrop = async (acceptedFiles) => {
    // Clear previous responses and file previews
    setTargetResponses([]);
    setFilePreviews([]);
    setSearchPerformed(false);
    setSearchCompletion(false);

    const newFiles = [];

    for (const file of acceptedFiles) {
      if (file.type === 'application/zip') {
        // Handle zip file
        const zip = new JSZip();
        const zipContent = await file.arrayBuffer();
        const unzipped = await zip.loadAsync(zipContent);

        // Collect all file promises
        const filePromises = Object.keys(unzipped.files).map(async (filename) => {
          const file = unzipped.files[filename];
          if (!file.dir) {
            const fileBlob = await file.async('blob');
            return new File([fileBlob], filename);
          }
          return null;
        });

        // Filter out null values and add to newFiles
        const files = (await Promise.all(filePromises)).filter(file => file !== null);
        newFiles.push(...files);
      } else {
        // Handle regular files
        newFiles.push(file);
      }
    }

    // Generate previews for the new files
    const newFilePreviews = newFiles.map(file => URL.createObjectURL(file));
    setSelectedFiles(prevFiles => [...prevFiles, ...newFiles]);
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
        setTargetResponses(prevResponses => [
          ...prevResponses,
          { filename: file.name, responseData: data, preview: URL.createObjectURL(file), number_of_objects_found: response.data.number_of_objects_found }
        ]);
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
    } catch (error) {
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

    if (targetObject === "") {
      toast.error('Please enter a target object.');
      return;
    }

    setSearchPerformed(true);
    setSearchCompletion(false);

    for (const file of selectedFiles) {
      await handleUpload(file);
    }

    setSearchCompletion(true);
    toast.success('All files  uploaded successfully!');

    // Clear selected files and previews after the upload process
    setSelectedFiles([]);
    setFilePreviews([]);
  };

  /**
   * Removes a file and its preview from the selected files and previews.
   * @param {number} index - The index of the file to remove.
   */
  const handleRemoveFile = (index) => {
    const updatedFiles = [...selectedFiles];
    const updatedPreviews = [...filePreviews];

    updatedFiles.splice(index, 1);
    updatedPreviews.splice(index, 1);
    setSelectedFiles(updatedFiles);
    setFilePreviews(updatedPreviews);
  };

  const handleRemoveAllFiles = () => {
    setSelectedFiles([]);
    setFilePreviews([]);
  };

  return (
    <Box sx={{ padding: 4 }}>
      <Typography variant="h4" gutterBottom>Upload Images</Typography>
      <form onSubmit={handleSubmit}>
        <Box {...getRootProps()} sx={{ border: '2px dashed #ccc', padding: 4, textAlign: 'center', marginBottom: 2 }}>
          <input {...getInputProps()} />
          <Typography variant="body1">Drag & drop some files here, or click to select files</Typography>
        </Box>
        <TextField 
          fullWidth 
          label="Enter object to find" 
          variant="outlined" 
          value={targetObject} 
          onChange={(e) => setTargetObject(e.target.value)} 
          sx={{ marginBottom: 2 }}
        />
        {uploading ? <CircularProgress /> : (
          <Button variant="contained" color="primary" type="submit">Find</Button>
        )}
      </form>
      <Button variant="contained" color="secondary" onClick={handleRemoveAllFiles} sx={{ marginTop: 2 }}>Remove All</Button>
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
                <Typography variant="h6">{selectedFiles[index] ? selectedFiles[index].name : 'File Removed'}</Typography>
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

      <Box sx={{ marginTop: 4 }}>
        {searchPerformed ? (
          targetResponses.length > 0 ? (
            <>
              <Typography variant="h5" gutterBottom>Pictures with the desired Object:</Typography>
              <Grid container spacing={2}>
                {targetResponses.map((response, index) => (
                  <Grid item xs={12} md={4} key={index}>
                    <Card>
                      <CardMedia
                        component="img"
                        height="140"
                        image={response.preview}
                        alt={`target-preview-${index}`}
                      />
                      <CardContent>
                        <Typography variant="h6">{response.filename}</Typography>
                        <pre>There are {response.number_of_objects_found} of your desired object in this image</pre>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            </>
          ) : (
            searchCompletion && (
              <Typography variant="h6" color="textSecondary">
                No pictures were found with the target object: "{targetObject}"
              </Typography>
            )
          )
        ) : null}
      </Box>
      <ToastContainer />
    </Box>
  );
};

export default UploadImages;
