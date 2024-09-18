// Import necessary libraries and components
import React, { useState, useCallback } from 'react'; // Import React and hooks for state and callbacks
import JSZip from 'jszip'; // Library for handling ZIP file extraction
import axios from 'axios'; // HTTP client for making API requests
import {
  Box,
  Button,
  TextField,
  Grid,
  Typography,
  CircularProgress,
  Card,
  CardMedia,
  CardContent,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Tooltip,
  Paper,
} from '@mui/material'; // Material-UI components for styling
import { useDropzone } from 'react-dropzone'; // Hook for drag-and-drop file handling
import { ToastContainer, toast } from 'react-toastify'; // Notification library for alerts
import 'react-toastify/dist/ReactToastify.css'; // Import default styles for toast notifications
import DeleteIcon from '@mui/icons-material/Delete'; // Icon for delete actions
import './UploadImages.css'; // Import CSS file for component-specific styles

// Component to preview uploaded files
const FilePreview = ({ preview, filename, onRemove, isRemovable, objectsFound }) => (
  <Grid item xs={12} md={4}>
    <Card className="response-card">
      <CardMedia
        component="img"
        height="140"
        image={preview}
        alt={`preview-${filename}`}
        sx={{ objectFit: 'cover' }}
      />
      <CardContent className="card-content">
        <Typography variant="body2" noWrap>
          {filename}
        </Typography>
        {objectsFound && objectsFound.length > 0 && (
          <Box sx={{ marginTop: 1 }}>
            {objectsFound.map((obj, index) => (
              <Typography key={index} variant="body2">
                {`${obj.object.toLowerCase()}: ${obj.count} found`}
              </Typography>
            ))}
          </Box>
        )}
        {isRemovable && (
          <Button className="remove-button" onClick={onRemove} sx={{ marginTop: 2 }}>
            Remove
          </Button>
        )}
      </CardContent>
    </Card>
  </Grid>
);

// Main component for uploading and analyzing images
const UploadImages = () => {
  // State variables
  const [selectedFiles, setSelectedFiles] = useState([]); // Stores selected files
  const [uploading, setUploading] = useState(false); // Indicates if files are being uploaded
  const [filePreviews, setFilePreviews] = useState([]); // Stores file previews
  const [objectInputs, setObjectInputs] = useState([]); // Stores object search criteria
  const [currentObject, setCurrentObject] = useState(''); // Current object input
  const [currentCount, setCurrentCount] = useState(''); // Current count input
  const [targetResponses, setTargetResponses] = useState([]); // Stores results of object searches
  const [searchPerformed, setSearchPerformed] = useState(false); // Indicates if a search has been performed
  const [searchCompletion, setSearchCompletion] = useState(false); // Indicates if search has completed
  const [openDialog, setOpenDialog] = useState(false); // Controls the dialog for confirming removal of all files

  // Handles file drop and ZIP extraction
  const onDrop = useCallback(async (acceptedFiles) => {
    // Reset search results and statuses
    setTargetResponses([]);
    setSearchPerformed(false);
    setSearchCompletion(false);

    const newFiles = [];
    for (const file of acceptedFiles) {
      if (file.type === 'application/zip') {
        // Handle ZIP files
        const zip = new JSZip();
        const zipContent = await file.arrayBuffer();
        const unzipped = await zip.loadAsync(zipContent);
        const filePromises = Object.keys(unzipped.files).map(async (filename) => {
          const file = unzipped.files[filename];
          if (!file.dir) {
            const fileBlob = await file.async('blob');
            return new File([fileBlob], filename);
          }
          return null;
        });
        const files = (await Promise.all(filePromises)).filter((file) => file !== null);
        newFiles.push(...files);
      } else {
        newFiles.push(file);
      }
    }
    // Create previews for new files
    const newFilePreviews = newFiles.map((file) => URL.createObjectURL(file));
    setSelectedFiles((prevFiles) => [...prevFiles, ...newFiles]);
    setFilePreviews((prevPreviews) => [...prevPreviews, ...newFilePreviews]);
  }, []);

  // Dropzone hook for handling file drag-and-drop
  const { getRootProps, getInputProps } = useDropzone({ onDrop });

  // Function to find target objects in a file
  const FindTargetObject = async (data, file) => {
    const token = localStorage.getItem('authToken'); // Retrieve token from localStorage

    try {
      // Create an array of promises to find objects in the image
      const promises = objectInputs.map((obj) =>
        axios.post('http://localhost:5000/images/find-object', {
          data,
          object: obj.object,
          count: obj.count,
        }, {
          headers: { 'Authorization': `Bearer ${token}` } // Add Authorization header
        })
      );

      // Wait for all promises to resolve
      const responses = await Promise.all(promises);

      // Collect found objects with their counts
      const foundObjects = responses.map((response, index) => ({
        object: objectInputs[index].object,
        count: response.data.number_of_objects_found || 0,
      }));

      // Check if all search criteria are met
      const allFiltersMet = objectInputs.every((obj, index) => {
        const foundObject = foundObjects.find((o) => o.object === obj.object);
        if (obj.count === 0) {
          return !foundObject || foundObject.count === 0;
        }
        return foundObject && foundObject.count >= obj.count;
      });

      if (allFiltersMet) {
        // Update responses with found objects
        setTargetResponses((prevResponses) => [
          ...prevResponses,
          {
            preview: URL.createObjectURL(file),
            filename: file.name,
            objectsFound: foundObjects,
          },
        ]);
      }

    } catch (error) {
      // Handle errors
      toast.error(
        error.response
          ? `Error finding target object: ${error.response.data}`
          : error.message
      );
    }
  };

  // Function to upload a file and analyze it
  const handleUpload = async (file) => {
    const formData = new FormData();
    formData.append('files', file);

    const token = localStorage.getItem('authToken'); // Retrieve token from localStorage

    try {
      setUploading(true);
      const response = await axios.post('http://localhost:5000/images/upload-and-analyze', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${token}` // Add Authorization header
        },
      });
      await FindTargetObject(response.data, file);
    } catch (error) {
      toast.error(
        `Error uploading file: ${error.response ? error.response.data : error.message}`
      );
    } finally {
      setUploading(false);
    }
  };

  // Function to handle form submission
  const handleSubmit = async (event) => {
    event.preventDefault();

    // Check if files and search objects are provided
    if (selectedFiles.length === 0) {
      toast.error('Please select files first.');
      return;
    }

    if (objectInputs.length === 0) {
      toast.error('Please enter at least one object.');
      return;
    }

    setSearchPerformed(true);
    setSearchCompletion(false);

    // Upload and analyze all selected files
    await Promise.all(selectedFiles.map((file) => handleUpload(file)));

    setSearchCompletion(true);
    toast.success('All files processed successfully!');
    setSelectedFiles([]);
    setFilePreviews([]);
  };

  // Function to handle removing a specific file
  const handleRemoveFile = (index) => {
    const updatedFiles = [...selectedFiles];
    const updatedPreviews = [...filePreviews];
    updatedFiles.splice(index, 1);
    updatedPreviews.splice(index, 1);
    setSelectedFiles(updatedFiles);
    setFilePreviews(updatedPreviews);
  };

  // Function to handle removing all files and opening confirmation dialog
  const handleRemoveAllFiles = () => {
    setOpenDialog(true);
  };

  // Function to confirm removal of all files
  const confirmRemoveAllFiles = () => {
    setSelectedFiles([]);
    setFilePreviews([]);
    setOpenDialog(false);
  };

  // Function to cancel removal of all files
  const cancelRemoveAllFiles = () => {
    setOpenDialog(false);
  };

  // Function to add a new object to search criteria
  const handleAddObject = () => {
    const trimmedCount = currentCount.trim();

    // Validate input fields
    if (currentObject.trim() === '' || trimmedCount === '') {
      toast.error('Please enter both object and count.');
      return;
    }

    const countValue = Number(trimmedCount);

    if (isNaN(countValue)) {
      toast.error('Count must be a valid number.');
      return;
    }

    // Add object and count to the list
    setObjectInputs([...objectInputs, { object: currentObject.trim(), count: countValue }]);
    setCurrentObject('');
    setCurrentCount('');
  };

  // Function to remove a specific object from search criteria
  const handleRemoveObject = (index) => {
    const updatedObjects = [...objectInputs];
    updatedObjects.splice(index, 1);
    setObjectInputs(updatedObjects);
  };

  // Function to handle changes in the count input field
  const handleCountChange = (e) => {
    const newValue = e.target.value;
    if (newValue >= 0) {
      setCurrentCount(newValue);
    }
  };

  return (
    // Main container for the entire component layout with background styling and padding
    <Box sx={{ padding: 15, background: 'linear-gradient(135deg, rgba(173, 216, 230, 0.5), rgba(240, 248, 255, 0.3))' }}>
      
      {/* Title of the component with gradient background and text styling */}
      <Typography 
        variant="h3"
        sx={{
          fontWeight: 'bold',
          fontSize: '3rem',
          textAlign: 'center',
          background: 'linear-gradient(90deg, #2193b0, #6dd5ed)',  // Gradient background
          WebkitBackgroundClip: 'text',  // Clip background for text
          letterSpacing: '2px',  // Spacing between letters
          color: 'transparent'  // Text color is transparent to reveal the gradient
        }}
      >
        Upload and Analyze Images
      </Typography>
  
      {/* Paper component for elevation and padding of the file upload area */}
      <Paper elevation={3} sx={{ padding: 4, marginTop: 4 }}>
        
        {/* File upload area with drag & drop functionality */}
        <Box {...getRootProps()} sx={{ border: '2px dashed #2196F3', borderRadius: 2, padding: 4, textAlign: 'center' }}>
          <input {...getInputProps()} />
          <Typography variant="h6" gutterBottom>
            Drag & Drop images or zip files here, or click to select files
          </Typography>
          
          {/* Button for selecting files manually */}
          <Button variant="contained" color="primary" sx={{ marginTop: 2 }}>
            Select Files
          </Button>
        </Box>
  
        {/* Tooltip with an icon button to remove all uploaded files */}
        <Tooltip title="Remove All Files">
          <IconButton
            color="error"
            onClick={handleRemoveAllFiles}  // Calls the function to remove all files
            sx={{ position: 'fixed', bottom: 16, right: 16 }}  // Fixed positioning at the bottom right
          >
            <DeleteIcon />
          </IconButton>
        </Tooltip>
  
        {/* Grid container to display file previews if files are uploaded */}
        {filePreviews.length > 0 && (
          <Grid container spacing={2} sx={{ marginTop: 2 }}>
            {filePreviews.map((preview, index) => (
              <FilePreview
                key={index}
                preview={preview}  // File preview passed as a prop
                filename={selectedFiles[index].name}  // File name passed as a prop
                onRemove={() => handleRemoveFile(index)}  // Remove handler for individual files
                isRemovable={true}  // Allow the removal of files
              />
            ))}
          </Grid>
        )}
  
        {/* Dialog box for confirming the removal of all files */}
        <Dialog open={openDialog} onClose={cancelRemoveAllFiles}>
          <DialogTitle>Confirm</DialogTitle>
          <DialogContent>
            <Typography>Are you sure you want to remove all files?</Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={cancelRemoveAllFiles}>Cancel</Button>
            <Button onClick={confirmRemoveAllFiles} color="primary">
              Confirm
            </Button>
          </DialogActions>
        </Dialog>
  
        {/* Form to allow users to input search criteria for objects */}
        <Box component="form" onSubmit={handleSubmit} sx={{ marginTop: 4 }}>
          <Typography variant="h6" gutterBottom>
            Search for Objects
          </Typography>
  
          {/* Input for object name */}
          <TextField
            label="Object"
            value={currentObject}  // Current object input value
            onChange={(e) => setCurrentObject(e.target.value)}  // Updates the input value
            fullWidth
            sx={{ marginBottom: 2 }}
          />
  
          {/* Input for object count */}
          <TextField
            label="Count"
            type="number"
            value={currentCount}  // Current count input value
            onChange={handleCountChange}  // Updates the count value
            fullWidth
            sx={{ marginBottom: 2 }}
          />
  
          {/* Button to add the object input */}
          <Button variant="contained" color="primary" onClick={handleAddObject}>
            Add Object
          </Button>
  
          {/* Displays added objects as chips */}
          <Box sx={{ marginTop: 2 }}>
            {objectInputs.map((obj, index) => (
              <Chip
                key={index}
                label={`${obj.object} (Count: ${obj.count})`}  // Display object and its count
                onDelete={() => handleRemoveObject(index)}  // Allows deleting the chip
                sx={{ marginRight: 1, marginBottom: 1 }}
              />
            ))}
          </Box>
  
          {/* Submit button to upload and analyze images, with a circular progress indicator if uploading */}
          <Button
            type="submit"
            variant="contained"
            color="secondary"
            disabled={uploading || objectInputs.length === 0 || filePreviews.length === 0}  // Disabled if conditions not met
            sx={{ marginTop: 2 }}
          >
            {uploading ? <CircularProgress size={24} /> : 'Upload and Analyze'}
          </Button>
        </Box>
      </Paper>
  
      {/* Display search results or a message if no results are found */}
      {searchPerformed && searchCompletion && targetResponses.length > 0 ? (
        <Paper elevation={3} sx={{ padding: 4, marginTop: 4 }}>
          <Typography variant="h6" gutterBottom>
            Search Results
          </Typography>
          
          {/* Grid container for displaying search results */}
          <Grid container spacing={2}>
            {targetResponses.map((response, index) => (
              <FilePreview
                key={index}
                preview={response.preview}  // Preview of the analyzed file
                filename={response.filename}  // Filename from the analysis
                objectsFound={response.objectsFound}  // Objects found in the file
                isRemovable={false}  // Files are not removable after search
              />
            ))}
          </Grid>
        </Paper>
      ) : (
        <Paper elevation={3} sx={{ padding: 4, marginTop: 4 }}>
          <Typography variant="h6" gutterBottom>
            No Results
          </Typography>
          <Typography variant="body2">
            {searchPerformed && searchCompletion
              ? 'No images matched the search criteria.'  // Message if no matches found
              : 'Please perform a search to see results.'}
          </Typography>
        </Paper>
      )}
  
      {/* Toast notifications for success/failure messages */}
      <ToastContainer />
    </Box>
  );
}
export default UploadImages;