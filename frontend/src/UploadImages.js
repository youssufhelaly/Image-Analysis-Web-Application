import React, { useState, useCallback, useMemo } from 'react';
import JSZip from 'jszip';
import axios from 'axios';
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
  LinearProgress,
} from '@mui/material';
import { useDropzone } from 'react-dropzone';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import DeleteIcon from '@mui/icons-material/Delete';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import SearchIcon from '@mui/icons-material/Search';
import './UploadImages.css';

// Component to preview uploaded files
const FilePreview = React.memo(({ preview, filename, onRemove, isRemovable, objectsFound }) => (
  <Grid item xs={12} sm={6} md={4}>
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
              <Chip
                key={index}
                label={`${obj.object.toLowerCase()}: ${obj.count}`}
                size="small"
                sx={{ margin: '2px' }}
              />
            ))}
          </Box>
        )}
        {isRemovable && (
          <IconButton
            className="remove-button"
            onClick={onRemove}
            size="small"
            sx={{ marginTop: 1 }}
          >
            <DeleteIcon />
          </IconButton>
        )}
      </CardContent>
    </Card>
  </Grid>
));

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
  const [searchPerforming, setSearchPerforming] = useState(false); // Indicates if a search has been performed
  const [searchCompletion, setSearchCompletion] = useState(false); // Indicates if search has completed
  const [openDialog, setOpenDialog] = useState(false); // Controls the dialog for confirming removal of all files
  const [uploadProgress, setUploadProgress] = useState(0);
  
  // Handles file drop and ZIP extraction
  const onDrop = useCallback(async (acceptedFiles) => {
    // Reset search results and statuses
    setTargetResponses([]);
    setSearchPerforming(false);
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
      } else if (file.type.startsWith('image/')) {
        newFiles.push(file);
      } else {
        toast.warning(`Skipped unsupported file: ${file.name}`);
      }
    }
    // Create previews for new files
    const newFilePreviews = newFiles.map((file) => URL.createObjectURL(file));
    setSelectedFiles((prevFiles) => [...prevFiles, ...newFiles]);
    setFilePreviews((prevPreviews) => [...prevPreviews, ...newFilePreviews]);
  }, []);

  // Dropzone hook for handling file drag-and-drop
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': [],
      'application/zip': ['.zip'],
    },
  });

  // Function to upload a file and analyze it
  const handleUpload = async (file, index) => {
    const formData = new FormData();
    formData.append('files', file);

    const token = localStorage.getItem('authToken'); // Retrieve token from localStorage

    try {
      const response = await axios.post('http://localhost:5000/images/upload-and-analyze', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${token}` // Add Authorization header
        },
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setUploadProgress((prevProgress) => {
            const newProgress = [...prevProgress];
            newProgress[index] = percentCompleted;
            return newProgress;
          });
        },
      });
      await FindTargetObject(response.data, file);
    } catch (error) {
      toast.error(`Error uploading ${file.name}: ${error.response ? error.response.data : error.message}`);
    }
  };

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
      toast.error(`Error analyzing ${file.name}: ${error.response ? error.response.data : error.message}`);
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

    setSearchPerforming(true);
    setSearchCompletion(false);
    setUploading(true);
    setUploadProgress(new Array(selectedFiles.length).fill(0));

    // Upload and analyze all selected files
    for (let i = 0; i < selectedFiles.length; i++) {
      await handleUpload(selectedFiles[i], i);
    }

    setSearchCompletion(true);
    setUploading(false);
    toast.success('All files processed successfully!');
    setSelectedFiles([]);
    setFilePreviews([]);
    setUploadProgress([]);
  };

  // Function to handle removing a specific file
  const handleRemoveFile = (index) => {
    const updatedFiles = [...selectedFiles];
    const updatedPreviews = [...filePreviews];
    URL.revokeObjectURL(updatedPreviews[index]);
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
    filePreviews.forEach(URL.revokeObjectURL);
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
    if (newValue === '' || parseInt(newValue) >= 0) {
      setCurrentCount(newValue);
    }
  };

  const dropzoneStyle = useMemo(() => ({
    border: `2px dashed ${isDragActive ? '#4caf50' : '#2196F3'}`,
    borderRadius: 2,
    padding: 4,
    textAlign: 'center',
    transition: 'border .24s ease-in-out'
  }), [isDragActive]);

  return (
    // Main container for the entire component layout with background styling and padding
    <Box sx={{ padding: { xs: 2, sm: 4, md: 6 }, background: 'linear-gradient(135deg, rgba(173, 216, 230, 0.5), rgba(240, 248, 255, 0.3))' }}>
      <Typography 
        variant="h3"
        sx={{
          fontWeight: 'bold',
          fontSize: { xs: '2rem', sm: '2.5rem', md: '3rem' },
          textAlign: 'center',
          background: 'linear-gradient(90deg, #2193b0, #6dd5ed)',
          WebkitBackgroundClip: 'text',
          letterSpacing: '2px',
          color: 'transparent',
          marginBottom: 4
        }}
      >
        Upload and Analyze Images
      </Typography>

      <Paper elevation={3} sx={{ padding: 4, marginBottom: 4 }}>
        <Box {...getRootProps()} sx={dropzoneStyle}>
          <input {...getInputProps()} />
          <CloudUploadIcon sx={{ fontSize: 48, color: isDragActive ? '#4caf50' : '#2196F3' }} />
          <Typography variant="h6" gutterBottom>
            {isDragActive ? 'Drop the files here' : 'Drag & Drop images or ZIP files here, or click to select'}
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

          <Grid container spacing={2} alignItems="flex-end">
            <Grid item xs={12} sm={5}>
              <TextField
                label="Object"
            value={currentObject}  // Current object input value
            onChange={(e) => setCurrentObject(e.target.value)}  // Updates the input value
                fullWidth
              />
            </Grid>
            <Grid item xs={12} sm={5}>
              <TextField
                label="Count"
                type="number"
                value={currentCount}  // Current count input value
                onChange={handleCountChange}  // Updates the count value
                fullWidth
              />
            </Grid>
            <Grid item xs={12} sm={2}>
              <Button 
                variant="contained" 
                color="primary" 
                onClick={handleAddObject}
                fullWidth
                startIcon={<SearchIcon />}
              >
                Add
              </Button>
            </Grid>
          </Grid>

          {/* Displays added objects as chips */}
          <Box sx={{ marginTop: 2 }}>
            {objectInputs.map((obj, index) => (
              <Chip
                key={index}
                label={`${obj.object} (Count: ${obj.count})`}  // Display object and its count
                onDelete={() => handleRemoveObject(index)}  // Allows deleting the chip
                sx={{ margin: '4px' }}
              />
            ))}
          </Box>

          {/* Submit button to upload and analyze images, with a circular progress indicator if uploading */}
          <Button
            type="submit"
            variant="contained"
            color="secondary"
            disabled={uploading || objectInputs.length === 0 || filePreviews.length === 0}
            sx={{ marginTop: 2 }}
            startIcon={uploading ? <CircularProgress size={24} /> : null}
          >
            {uploading ? 'Processing...' : 'Upload and Analyze'}
          </Button>
        </Box>

        {uploading && (
          <Box sx={{ width: '100%', marginTop: 2 }}>
            <LinearProgress variant="determinate" value={uploadProgress.reduce((a, b) => a + b, 0) / uploadProgress.length} />
          </Box>
        )}
      </Paper>

      {searchPerforming && searchCompletion && (
        <Paper elevation={3} sx={{ padding: 4 }}>
          <Typography variant="h6" gutterBottom>
            Search Results
          </Typography>
          
          {targetResponses.length > 0 ? (
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
          ) : (
            <Typography variant="body2">
              No images matched the search criteria.
            </Typography>
          )}
        </Paper>
      )}

      {/* Toast notifications for success/failure messages */}
      <ToastContainer />
    </Box>
  );
};

export default React.memo(UploadImages);