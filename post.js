const http = require('http');
const fs = require('fs');

const filePath = './pdf.pdf'; // Replace with your PDF file path
const url = 'http://localhost:4000/upload-pdf'; // Replace with your server URL

// Read the PDF file
fs.readFile(filePath, (err, data) => {
  if (err) {
    console.error('Error reading file:', err);
    return;
  }
console.log(data);
  const options = {
    method: 'POST',
    headers: {
      'Content-Type': 'application/pdf',
    },
  };

  const req = http.request(url, options, (res) => {
    let responseBody = '';

    res.on('data', (chunk) => {
      responseBody += chunk;
    });

    res.on('end', () => {
      console.log('Response:', responseBody);
    });
  });

  req.on('error', (error) => {
    console.error('Request error:', error);
  });

  // Send the file data in the request body
  req.write(data);
  req.end();
});
