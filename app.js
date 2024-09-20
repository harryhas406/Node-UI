const express = require('express');
const { Client } = require('@elastic/elasticsearch');
const path = require('path');
const fs = require('fs');
const csv = require('csv-parser');
const { spawn } = require('child_process');
const Minio = require('minio');

const app = express();

// Elasticsearch client setup
const client = new Client({ node: 'http://localhost:9200' });

// Use dynamic import to load the mime module
async function getMime() {
    const mime = (await import('mime')).default;
    return mime;
}

// Example usage
getMime().then(mime => {
    // Now you can use the mime module
    console.log(mime.getType('example.jpg'));
}).catch(error => {
    console.error('Error importing mime module:', error);
});

// Middleware to parse form data
app.use(express.urlencoded({ extended: true }));

// Serve static files (like images, CSS, and JavaScript)
// app.use('/static', express.static(path.join(__dirname, 'static')));

// Serve static files from the "public" directory
app.use(express.static(path.join(__dirname, 'public')));

// Serve the favicon
app.get('/favicon.ico', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'favicon.ico'));
});

app.get('/', (req, res) => {
    res.send(`
    
    `);
});
// Route to home page
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// GET route to render the HTML form
app.get('/phishing', (req, res) => {
    res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>CDOT Phishing Assessment</title>
        <style>
            body {
                --background-color: #1e1e1e;
                --text-color: #fff;
                --line-color: #fff;
                --button-background-color: #1669D3;
                --button-hover-color: #1669D3;
                --table-header-bg: #2C3E50;
                --table-row-bg: rgba(255, 255, 255, 0.1);
                --table-row-hover-bg: #333;
                background-color: var(--background-color);
                color: var(--text-color);
                font-family: Arial, sans-serif;
                margin: 0;
                padding: 0;
                height: 100vh;
                transition: background-color 0.5s ease, color 0.5s ease;
                overflow: hidden;
            }
            .background {
                position: absolute;
                top: 12%;
                left: 0;
                width: 100%;
                height: 100%;
                background: url('/background.png') no-repeat center center;
                /*background-size: cover;*/
                background-size: contain; /* Ensures the image fits within the viewport */
                opacity: 0.08;  /* 10% opacity */
                z-index: -1;
            }
            .container {
                position: relative;
                height: 75vh;
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: flex-start;
                padding-top: 20px;
                overflow: auto;  /* Enable scrolling for the container */
            }
            .logo {
                position: absolute;
                top: 30px;
                left: 30px;
                width: 45px; /* Adjust the logo size */
            }
            .head-image {
                position: absolute;
                top: 32px;
                right: 175px;
                width: 70px;
                opacity:0.45;
                box-shadow: 2px 6px 10px rgba(255, 255, 255, 0.6);
            }
            .head-text {
                position: absolute;
                top: 17px;
                right: 10px;
                font-size: 20px;
                color:#1F618D;
                width: 160px;
                word-wrap: break-word;
                text-shadow: 3px 3px 6px rgba(255, 255, 255, 0.3); /* Subtle shadow for depth */
            }
            .line {
                position: absolute;
                top: 120px;
                width: 100%; /* 75% of the screen width */
                height: 2px; /* Thickness of the line */
                background-color: #1F618D; /* English Blue color */ 
                /*background-color: var(--line-color);*/
            }
            .form-container {
                position: absolute;
                top: 40px;
                right: 42%;
                /*border: 1px solid white;*/
                /*padding: 10px;
                border-style: ridge;
                border-color: grey;
                box-shadow: 0px 4px 8px rgba(255,255, 255, 0.4);*/
            }
            .form-container input[type="text"] {
                padding: 10px;
                font-size: 16px;
                /*border-style: ridge;
                border-color: grey;*/
                width: 250px;
                border-radius: 6px;
                box-shadow: 4px 8px 12px rgba(255,255, 255, 0.5);
            }
            .form-container input[type="submit"] {
                padding: 8px 10px;
                font-size: 20px;
                cursor: pointer;
                color: var(--text-color);
                background-color: var(--button-background-color); /* Change submit button background in dark mode */
                border: none;
                border-radius: 5px;
                transition: background-color 0.3s ease;
            }
            .form-container input[type="submit"]:hover {
                background-color: var(--button-hover-color);
            }
            .error-message {
                color: red;
                font-size: 14px;
                margin-top: 1px;
                display: none;  /* Initially hidden */
            }
            .table-container {
                margin-top: 180px; /* Adjusted margin to ensure table is positioned below the form */
                padding: 10px;
                max-height: 70vh; /* Set the maximum height of the scrollable area */
                overflow-y: auto;  /* Enable vertical scroll */
                width: 98%; /* Table takes 90% width */
                margin-left: auto;
                margin-right: auto;
                border-radius: 10px;
                box-shadow: 0px 4px 8px rgba(0, 0, 0, 0.6);
            }
            table {
                width: 100%;
                border-collapse: collapse;
                margin: 10px 0;
            }
            th {
                padding: 10px;
                background-color: #4CAF50;
                color: white;
                text-align: center;
                position: sticky;
                top: 0;
                z-index: 1;
            }
            td {
                padding: 8px;
                border: 1px solid white;
                /*background-color: rgba(199, 245, 245, 0.25);*/
                background-color: var(--table-row-bg);
            }
            tr:nth-child(even) {
               /* background-color: #f2f2f2; */
                background-color: var(--table-row-bg);
            }
            tr:hover {
                /* background-color: #ddd; */
                background-color: var(--table-row-hover-bg);
            }
            tr:nth-child(2) {
                background-color: #ADD8E6; /* Light blue color */
            }

        </style>
        <script>
            function toggleTheme() {
                const body = document.body;
                const isDarkMode = body.classList.toggle('dark-mode');
                localStorage.setItem('theme', isDarkMode ? 'dark' : 'light');
                updateButtonText(isDarkMode);
            }

            function updateButtonText(isDarkMode) {
                const toggleButton = document.getElementById('theme-toggle-btn');
                toggleButton.textContent = isDarkMode ? 'Light Mode' : 'Dark Mode';
            }

            window.onload = function() {
                const savedTheme = localStorage.getItem('theme');
                if (savedTheme === 'dark') {
                    document.body.classList.add('dark-mode');
                }
                updateButtonText(savedTheme === 'dark');
            }

            function validateForm(event) {
                const input = document.querySelector('input[name="input_string"]');
                const errorMessage = document.getElementById('error-message');
                
                if (input.value.trim() === "") {
                    event.preventDefault();
                    errorMessage.style.display = 'block';
                } else {
                    errorMessage.style.display = 'none';
                }
            }
        </script>
    </head>
    <body>
        <div class="background"></div>
        <div class="container">
            <a href="/"><img class="logo" src="/logo.png" alt="Logo"></a>
            <img class="head-image" src="/suspicious.png" alt="Logo">
            <h1 class="head-text">Comprehensive Phishing Assessment</h1>
            <div class="line"></div>
            <form class="form-container" action="/submit" method="post" onsubmit="validateForm(event)">
                <input type="text" name="input_string" placeholder="Enter Domain here">
                <input type="image" src="/searchlogo1.png" alt="Submit" style="width: 60px; height: auto;vertical-align: bottom;">
                <div id="error-message" class="error-message">*Please Enter a valid domain</div>
            </form>
        </div>
    </body>
    </html>
    `);
});

// POST route to handle the form submission
app.post('/submit', (req, res) => {
    let inputString = req.body.input_string;
    
    // Remove 'www.' if present
    if (inputString.startsWith('www.')) {
        inputString = inputString.substring(4);
    }

    const fileName = `phishoutput_${inputString}.csv`;
    const filePath = path.join(__dirname, 'dynamic', fileName);

    // Execute a Python script as a subprocess
    const pythonProcess = spawn('python3', ['process_script.py', inputString]);

    pythonProcess.on('close', (code) => {
        if (!fs.existsSync(filePath)) {
            return res.send(`
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>No Record Found</title>
            </head>
            <body>
                <h1>No Record Found for: ${inputString}</h1>
            </body>
            </html>
            `);
        }

        // Read the CSV file and send it back as a table
        let tableHtml = '<table border="1"><tr>';

        fs.createReadStream(filePath)
            .pipe(csv())
            .on('headers', (headers) => {
                headers.forEach(header => {
                    tableHtml += `<th>${header}</th>`;
                });
            })
            .on('data', (row) => {
                tableHtml += '<tr>';
                for (const key in row) {
                    tableHtml += `<td>${row[key]}</td>`;
                }
                tableHtml += '</tr>';
            })
            .on('end', () => {
                tableHtml += '</table>';

                res.send(`
                    <!DOCTYPE html>
                    <html lang="en">
                    <head>
                        <meta charset="UTF-8">
                        <meta name="viewport" content="width=device-width, initial-scale=1.0">
                        <title>Phishing Assessment Result</title>
                        <link rel="stylesheet" href="/submitstyle.css">
                    </head>
                    <body>
                        <div class="background"></div>
                        <div class="container">
                            <a href="/"><img class="logo" src="/logo.png" alt="logo"></a>
                            <h1 class="heading">Results for: ${inputString}</h1>
                            <div class="line"></div>
                            <div class="table-container">${tableHtml}</div>
                        </div>
                        <script>
                            function toggleTheme() {
                                document.body.classList.toggle('dark-mode);
                            }
                        </script>
                    </body>
                    </html>
                `);
            });
    });
});

// Endpoint to fetch messages
app.get('/api/messages', async (req, res) => {
    const isIndiaRelated = req.query.isIndiaRelated === 'true';

    try {
        const result = await client.search({
            index: 'telegram_messages',
            body: {
                query: {
                    bool: {
                        must: [
                            {
                                match_all: {}
                            }
                        ],
                        filter: isIndiaRelated ? [
                            {
                                term: { is_india_related: true }
                            }
                        ] : []
                    }
                },
                size: 200,
                sort: [{ "timestamp": { "order": "desc" } }]
            }
        });

        res.json(result.hits.hits);
    } catch (error) {
        console.error(error);
        res.status(500).send('Error fetching data from Elasticsearch');
    }
});
// Default route to serve the telegram.html page
app.get('/telegram', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'telegram.html'));
});

const minioClient = new Minio.Client({
    endPoint: 'localhost',
    port: 9000,
    useSSL: false,
    accessKey: 'admin',
    secretKey: 'password'
});

app.get('/list/:prefix?', (req, res) => {
    const bucketName = 'leaks';  // Change to your bucket name
    const prefix = req.params.prefix || '';  // Folder path, empty means root

    let objects = [];

    const stream = minioClient.listObjectsV2(bucketName, prefix, true);

    stream.on('data', (obj) => {
        objects.push(obj);
    });

    stream.on('end', () => {
        res.json(objects);  // Send list of objects as JSON
    });

    stream.on('error', (err) => {
        console.error('Error listing objects:', err);
        res.status(500).json({ error: 'Error listing objects' });
    });
});

// Route to fetch an object (image/data) from a folder
app.get('/fetch/*', (req, res) => {
    const bucketName = 'leaks';  // Change to your bucket name
    const objectPath = req.params[0];  // Capture the full path after /fetch/

    minioClient.getObject(bucketName, objectPath, (err, dataStream) => {
        if (err) {
            console.error('Error fetching file:', err);
            return res.status(500).send(`Error fetching file: ${err.message}`);
        }

        // Determine content type based on file extension
        let contentType = 'application/octet-stream';  // Default

        if (objectPath.match(/\.(jpg|jpeg)$/)) {
            contentType = 'image/jpeg';
        } else if (objectPath.match(/\.png$/)) {
            contentType = 'image/png';
        } else if (objectPath.match(/\.gif$/)) {
            contentType = 'image/gif';
        } else if (objectPath.match(/\.odt$/)) {
            contentType = 'application/vnd.oasis.opendocument.text';
        }

        res.setHeader('Content-Type', contentType);

        // Stream the file to the client
        dataStream.pipe(res);
    });
});
// Route to serve static HTML page for MinIO browser
app.get('/drkweb', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'minio.html'));
});

// Utility function to fetch files recursively
async function listFiles(bucketName, prefix) {
    let fileList = [];
    let stream = minioClient.listObjects(bucketName, prefix, true);
    
    for await (const obj of stream) {
        if (obj.name.endsWith('.jpg') || obj.name.endsWith('.png') || obj.name.endsWith('.jpeg') || obj.name.endsWith('.gif')) {
            fileList.push(obj.name);
        }
    }
    
    return fileList;
}

app.get('/minio-files', async (req, res) => {
    const bucketName = 'leaks';
    const folderPrefix = 'gov/'; // The folder path where images are stored

    try {
        const files = await listFiles(bucketName, folderPrefix);
        res.json(files);
    } catch (err) {
        console.error('Error fetching MinIO files:', err);
        res.status(500).json({ error: 'Failed to fetch file names from MinIO.' });
    }
});

app.post('/api/search', async (req, res) => {
    const keyword = req.body.input_string;

    try {
        // Search in Elasticsearch for messages
        const esResponse = await client.search({
            index: 'telegram_messages',
            body: {
                query: {
                    multi_match: {
                        query: keyword,
                        fields: ['text', 'categories']
                    }
                }
            }
        });

        // Search in MinIO for files matching the keyword
        const minioFiles = await listFiles();  // A function to list MinIO files
        const filteredFiles = minioFiles.filter(file => file.includes(keyword));

        // Combine results
        res.json({
            elasticsearchResults: esResponse.hits.hits,
            minioFiles: filteredFiles
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'An error occurred while searching' });
    }
});


// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running at http://localhost:${PORT}`);
});
