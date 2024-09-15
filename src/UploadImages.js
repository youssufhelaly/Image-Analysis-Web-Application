import React, { useState } from 'react';
import JSZip from 'jszip';
import axios from 'axios';
import { Box, Button, TextField, Grid, Typography, CircularProgress, Card, CardMedia, CardContent, Chip } from '@mui/material';
import { useDropzone } from 'react-dropzone';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './UploadImages.css'; // Import CSS for additional styling

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

  const onDrop = async (acceptedFiles) => {
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
        const files = (await Promise.all(filePromises)).filter(file => file !== null);
        newFiles.push(...files);
      } else {
        newFiles.push(file);
      }
    }
    const newFilePreviews = newFiles.map(file => URL.createObjectURL(file));
    setSelectedFiles(prevFiles => [...prevFiles, ...newFiles]);
    setFilePreviews(prevPreviews => [...prevPreviews, ...newFilePreviews]);
  };

  const { getRootProps, getInputProps } = useDropzone({ onDrop });

  const FindTargetObject = async (data, file) => {
    try {
      const promises = objectInputs.map(obj =>
        axios.post('http://localhost:5000/find-object', {
          data,
          object: obj.object,
          count: obj.count
        })
      );

      const responses = await Promise.all(promises);

      const allFiltersMet = objectInputs.every((obj, index) => {
        const response = responses[index].data;
        const numberOfObjectsFound = response.number_of_objects_found || 0;
        if (parseInt(obj.count) === 0) {
          return !response.found;
        } else {
          return response.found;
        }
      });

      if (allFiltersMet) {
        setTargetResponses(prevResponses => [
          ...prevResponses,
          {
            preview: URL.createObjectURL(file),
            filename: file.name,
            number_of_objects_found: responses[0].data.number_of_objects_found || 0
          }
        ]);
      }
      
    } catch (error) {
      if (error.response) {
        toast.error(`Error finding target object: ${error.response.data}`);
      } else if (error.request) {
        toast.error('No response received from the server.');
      } else {
        toast.error('Error setting up the request.');
      }
    }
  };

  const handleUpload = async (file) => {
    const formData = new FormData();
    formData.append('files', file);

    try {
      setUploading(true);
      const response = await axios.post('http://localhost:5000/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      await FindTargetObject(response.data, file);
    } catch (error) {
      toast.error('Error uploading file: ' + (error.response ? error.response.data : error.message));
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
  
    await Promise.all(selectedFiles.map(file => handleUpload(file)));

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
    setSelectedFiles([]);
    setFilePreviews([]);
  };

  const handleAddObject = () => {
    if (currentObject && currentCount >= 0) {
      setObjectInputs([...objectInputs, { object: currentObject, count: currentCount }]);
      setCurrentObject('');
      setCurrentCount('');
    } else {
      toast.error('Please enter both object and count.');
    }
  };

  const handleRemoveObject = (index) => {
    const updatedObjects = [...objectInputs];
    updatedObjects.splice(index, 1);
    setObjectInputs(updatedObjects);
  };

  const handleCountChange = (e) => {
    const newValue = Number(e.target.value);
    // Ensure new value is not less than 0
    if (newValue >= 0) {
      setCurrentCount(newValue);
    }
  };
  
  return (
    <Box sx={{ padding: 4 }}>
      <Typography variant="h4" gutterBottom>
        Multi-Object Search
      </Typography>

      <form onSubmit={handleSubmit}>
        <Box
          {...getRootProps()}
          sx={{ border: '2px dashed #ccc', padding: 4, textAlign: 'center', marginBottom: 2 }}
        >
          <input {...getInputProps()} />
          <Typography variant="body1">
            Drag & drop some files here, or click to select files
          </Typography>
        </Box>

        <TextField
          label="Object to find"
          value={currentObject}
          onChange={(e) => setCurrentObject(e.target.value)}
          sx={{ marginBottom: 2 }}
        />
        <TextField
          label="Count"
          type="number"
          value={currentCount}
          onChange={handleCountChange}
          sx={{ marginBottom: 2, marginLeft: 2 }}
        />
        <Button
          variant="contained"
          onClick={handleAddObject}
          sx={{ marginBottom: 2, padding: '15px', marginLeft: "10px" }}
        >
          Add
        </Button>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', marginBottom: 2 }}>
          {objectInputs.map((obj, index) => (
            <Chip
              key={index}
              label={obj.count == 0 ? `Without ${obj.object}` : `At least ${obj.count} ${obj.object}`}
              onDelete={() => handleRemoveObject(index)}
              sx={{ marginRight: 1, marginBottom: 1 }}
            />
          ))}
        </Box>

        {uploading ? <CircularProgress /> : <Button variant="contained" type="submit">Find</Button>}
      </form>

      <Button variant="contained" color="secondary" onClick={handleRemoveAllFiles} sx={{ marginTop: 2 }}>
        Remove All
      </Button>

      <Grid container spacing={2} sx={{ marginTop: 2 }}>
        {filePreviews.map((preview, index) => (
          <Grid item xs={12} md={4} key={index}>
            <Card className="response-card">
              <CardMedia
                component="img"
                height="140"
                image={preview}
                alt={`preview-${index}`}
                sx={{ objectFit: 'cover' }} // Ensure proper image scaling
              />
              <CardContent className="card-content">
                <Typography variant="body2" noWrap>
                  {selectedFiles[index] ? selectedFiles[index].name : 'File Removed'}
                </Typography>
                <Button className="remove-button" onClick={() => handleRemoveFile(index)} sx={{ marginTop: 2 }}>
                  Remove
                </Button>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {searchPerformed && !searchCompletion && (
        <Typography variant="h6" sx={{ marginTop: 2 }}>
          Processing your images, please wait...
        </Typography>
      )}

      {searchPerformed && searchCompletion && (
        <Grid container spacing={2} sx={{ marginTop: 2 }}>
          {targetResponses.length > 0 ? (
            targetResponses.map((response, index) => (
              <Grid item xs={12} md={4} key={index}>
                <Card className="response-card">
                  <CardMedia
                    component="img"
                    height="140"
                    image={response.preview}
                    alt={`result-${index}`}
                    sx={{ objectFit: 'cover' }}
                  />
                  <CardContent className="card-content">
                    <Typography variant="body2" noWrap>
                      {response.filename}
                    </Typography>
                    <Typography key={objIndex} variant="body2">
                        {obj.object}: {obj.count}
                      </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))
          ) : (
            <Typography variant="body2" sx={{ marginTop: 2 }}>
              No images met the criteria.
            </Typography>
          )}
        </Grid>
      )}

      <ToastContainer />
    </Box>
  );
};

export default UploadImages;
