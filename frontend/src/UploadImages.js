import React, { useState, useCallback } from 'react';
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
} from '@mui/material';
import { useDropzone } from 'react-dropzone';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import DeleteIcon from '@mui/icons-material/Delete';
import './UploadImages.css';

// FilePreview component remains unchanged
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

const UploadImages = () => {
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [filePreviews, setFilePreviews] = useState([]);
  const [objectInputs, setObjectInputs] = useState([]);
  const [currentObject, setCurrentObject] = useState('');
  const [currentCount, setCurrentCount] = useState('');
  const [targetResponses, setTargetResponses] = useState([]);
  const [searchPerformed, setSearchPerformed] = useState(false);
  const [searchCompletion, setSearchCompletion] = useState(false);
  const [openDialog, setOpenDialog] = useState(false);

  const onDrop = useCallback(async (acceptedFiles) => {
    setTargetResponses([]);
    setSearchPerformed(false);
    setSearchCompletion(false);

    const newFiles = [];
    for (const file of acceptedFiles) {
      if (file.type === 'application/zip') {
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
    const newFilePreviews = newFiles.map((file) => URL.createObjectURL(file));
    setSelectedFiles((prevFiles) => [...prevFiles, ...newFiles]);
    setFilePreviews((prevPreviews) => [...prevPreviews, ...newFilePreviews]);
  }, []);

  const { getRootProps, getInputProps } = useDropzone({ onDrop });

  const FindTargetObject = async (data, file) => {
    const token = localStorage.getItem('authToken'); // Retrieve token from localStorage

    try {
      const promises = objectInputs.map((obj) =>
        axios.post('http://localhost:5000/images/find-object', {
          data,
          object: obj.object,
          count: obj.count,
        }, {
          headers: { 'Authorization': `Bearer ${token}` } // Add Authorization header
        })
      );

      const responses = await Promise.all(promises);

      // Collect found objects with their counts
      const foundObjects = responses.map((response, index) => ({
        object: objectInputs[index].object,
        count: response.data.number_of_objects_found || 0,
      }));

      // Check if all filters are met
      const allFiltersMet = objectInputs.every((obj, index) => {
        const foundObject = foundObjects.find((o) => o.object === obj.object);
        if (obj.count === 0) {
          return !foundObject || foundObject.count === 0;
        }
        return foundObject && foundObject.count >= obj.count;
      });

      if (allFiltersMet) {
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
      toast.error(
        error.response
          ? `Error finding target object: ${error.response.data}`
          : error.message
      );
    }
  };

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

  const handleSubmit = async (event) => {
    event.preventDefault();

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

    await Promise.all(selectedFiles.map((file) => handleUpload(file)));

    setSearchCompletion(true);
    toast.success('All files processed successfully!');
    setSelectedFiles([]);
    setFilePreviews([]);
  };

  const handleRemoveFile = (index) => {
    const updatedFiles = [...selectedFiles];
    const updatedPreviews = [...filePreviews];
    updatedFiles.splice(index, 1);
    updatedPreviews.splice(index, 1);
    setSelectedFiles(updatedFiles);
    setFilePreviews(updatedPreviews);
  };

  const handleRemoveAllFiles = () => {
    setOpenDialog(true);
  };

  const confirmRemoveAllFiles = () => {
    setSelectedFiles([]);
    setFilePreviews([]);
    setOpenDialog(false);
  };

  const cancelRemoveAllFiles = () => {
    setOpenDialog(false);
  };

  const handleAddObject = () => {
    const trimmedCount = currentCount.trim();

    if (currentObject.trim() === '' || trimmedCount === '') {
      toast.error('Please enter both object and count.');
      return;
    }

    const countValue = Number(trimmedCount);

    if (isNaN(countValue)) {
      toast.error('Count must be a valid number.');
      return;
    }

    setObjectInputs([...objectInputs, { object: currentObject.trim(), count: countValue }]);
    setCurrentObject('');
    setCurrentCount('');
  };

  const handleRemoveObject = (index) => {
    const updatedObjects = [...objectInputs];
    updatedObjects.splice(index, 1);
    setObjectInputs(updatedObjects);
  };

  const handleCountChange = (e) => {
    const newValue = e.target.value;
    if (newValue >= 0) {
      setCurrentCount(newValue);
    }
  };


  return (
    <Box sx={{ padding: 15, background: 'linear-gradient(135deg, rgba(173, 216, 230, 0.5), rgba(240, 248, 255, 0.3))' }}>
      <Typography 
        variant="h3"
        sx={{
          fontWeight: 'bold',
          fontSize: '3rem',
          textAlign: 'center',
          background: 'linear-gradient(90deg, #2193b0, #6dd5ed)',
          WebkitBackgroundClip: 'text',
          letterSpacing: '2px',
          color: 'transparent'
        }}
      >
        Upload and Analyze Images
      </Typography>
      <Paper elevation={3} sx={{ padding: 4, marginTop: 4 }}>
        <Box {...getRootProps()} sx={{ border: '2px dashed #2196F3', borderRadius: 2, padding: 4, textAlign: 'center' }}>
          <input {...getInputProps()} />
          <Typography variant="h6" gutterBottom>
            Drag & Drop images or zip files here, or click to select files
          </Typography>
          <Button variant="contained" color="primary" sx={{ marginTop: 2 }}>
            Select Files
          </Button>
        </Box>
        <Tooltip title="Remove All Files">
          <IconButton
            color="error"
            onClick={handleRemoveAllFiles}
            sx={{ position: 'fixed', bottom: 16, right: 16 }}
          >
            <DeleteIcon />
          </IconButton>
        </Tooltip>
        {filePreviews.length > 0 && (
          <Grid container spacing={2} sx={{ marginTop: 2 }}>
            {filePreviews.map((preview, index) => (
              <FilePreview
                key={index}
                preview={preview}
                filename={selectedFiles[index].name}
                onRemove={() => handleRemoveFile(index)}
                isRemovable={true}  // Allow removing files
              />
            ))}
          </Grid>
        )}
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
        <Box component="form" onSubmit={handleSubmit} sx={{ marginTop: 4 }}>
          <Typography variant="h6" gutterBottom>
            Search for Objects
          </Typography>
          <TextField
            label="Object"
            value={currentObject}
            onChange={(e) => setCurrentObject(e.target.value)}
            fullWidth
            sx={{ marginBottom: 2 }}
          />
          <TextField
            label="Count"
            type="number"
            value={currentCount}
            onChange={handleCountChange}
            fullWidth
            sx={{ marginBottom: 2 }}
          />
          <Button variant="contained" color="primary" onClick={handleAddObject}>
            Add Object
          </Button>
          <Box sx={{ marginTop: 2 }}>
            {objectInputs.map((obj, index) => (
              <Chip
                key={index}
                label={`${obj.object} (Count: ${obj.count})`}
                onDelete={() => handleRemoveObject(index)}
                sx={{ marginRight: 1, marginBottom: 1 }}
              />
            ))}
          </Box>
          <Button
            type="submit"
            variant="contained"
            color="secondary"
            disabled={uploading || objectInputs.length === 0 || filePreviews.length === 0 }
            sx={{ marginTop: 2 }}
          >
            {uploading ? <CircularProgress size={24} /> : 'Upload and Analyze'}
          </Button>
        </Box>
      </Paper>
      {searchPerformed && searchCompletion && targetResponses.length > 0 ? (
  <Paper elevation={3} sx={{ padding: 4, marginTop: 4 }}>
    <Typography variant="h6" gutterBottom>
      Search Results
    </Typography>
    <Grid container spacing={2}>
      {targetResponses.map((response, index) => (
        <FilePreview
          key={index}
          preview={response.preview}
          filename={response.filename}
          objectsFound={response.objectsFound} // Pass the objectsFound prop
          isRemovable={false}  // Do not allow removing search results
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
        ? 'No images matched the search criteria.'
        : 'Please perform a search to see results.'}
    </Typography>
  </Paper>
)}
      <ToastContainer />
    </Box>
  );
};

export default UploadImages;