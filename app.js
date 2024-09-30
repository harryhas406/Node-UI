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
    res.sendFile(path.join(__dirname, 'public', 'logo1.png'));
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
        <link rel="stylesheet" href="/phishingStyle.css">
        <script>
            // Function to toggle between dark mode and light mode
            function toggleTheme() {
                const body = document.body;
                body.classList.toggle('light-mode');

                const themeToggleBtn = document.getElementById('theme-toggle-btn');
                if (body.classList.contains('light-mode')) {
                    themeToggleBtn.innerText = 'Dark Mode';
                } else {
                    themeToggleBtn.innerText = 'Light Mode';
                }
            }
            // Function to highlight active link
            function highlightActiveLink() {
                const currentPath = window.location.pathname;
                const links = document.querySelectorAll('.nav-links a');
                links.forEach(link => {
                    // Remove 'active' class from all links
                    link.classList.remove('active');
                    // Add 'active' class to the current page's link
                    if (link.getAttribute('href') === currentPath) {
                        link.classList.add('active');
                    }
                });
            }    

            window.onload = function() {
                // Highlight the active link
                highlightActiveLink();
            };

            // Form validation
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
            <div class="header-content">
                <!-- Search Form to search data from the CSV -->
                <form class="small-search-form" action="/searchCSV" method="GET" style="display: inline;">
                    <input type="text" name="query" placeholder="Search in CSV..." style="width: 150px; height: 30px;">
                    <input type="image" src="/searchlogo1.png" alt="Submit" style="width: 40px; height: auto;vertical-align: bottom;">
                </form>
                <button class="theme-toggle" id="theme-toggle-btn" onclick="toggleTheme()">Dark Mode</button>
                <a href="/"><img class="logo" src="/CDOT_logo.jpg" alt="Logo"></a>
                <form class="form-container" action="/submit" method="post" onsubmit="validateForm(event)">
                    <input type="text" name="input_string" placeholder="Enter Domain here">
                    <input type="image" src="/searchlogo1.png" alt="Submit" style="width: 50px; height: auto;vertical-align: bottom;">
                    <div id="error-message" class="error-message">*Please Enter a valid domain</div>
                </form>
                <div class="nav-links">
                    <a href="/drkweb">DarkWeb</a>
                    <a href="/telegram">Hactivist_Terrorism</a>
                    <a href="/ransomware">RansomWare</a>
                    <a href="/phishing">Phishing</a>
                </div>
            </div>
            <div class="line"></div>
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
                <link rel="stylesheet" href="/phishingStyle.css">
                <script>
                    // Function to toggle between dark mode and light mode
                    function toggleTheme() {
                        const body = document.body;
                        body.classList.toggle('light-mode');

                        const themeToggleBtn = document.getElementById('theme-toggle-btn');
                        if (body.classList.contains('light-mode')) {
                            themeToggleBtn.innerText = 'Dark Mode';
                        } else {
                            themeToggleBtn.innerText = 'Light Mode';
                        }
                    }
                    // Active link detection
                    const currentPath = window.location.pathname;
                    const links = document.querySelectorAll('.nav-links a');
                    links.forEach(link => {
                        if (link.getAttribute('href') === currentPath) {
                            link.classList.add('active');
                        }
                    });

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

                <script>
                    // Function to highlight active link
                    function highlightActiveLink() {
                        const currentPath = window.location.pathname;
                        const links = document.querySelectorAll('.nav-links a');
                        links.forEach(link => {
                            // Remove 'active' class from all links
                            link.classList.remove('active');
                            // Add 'active' class to the current page's link
                            if (link.getAttribute('href') === currentPath) {
                                link.classList.add('active');
                            }
                        });
                    }    

                    window.onload = function() {
                        // Highlight the active link
                        highlightActiveLink();
                    };

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
                    <div class="header-content">
                        <button class="theme-toggle" id="theme-toggle-btn" onclick="toggleTheme()">Dark Mode</button>
                        <a href="/"><img class="logo" src="/CDOT_logo.jpg" alt="Logo"></a>
                        <form class="form-container" action="/submit" method="post" onsubmit="validateForm(event)">
                            <input type="text" name="input_string" placeholder="Enter Domain here">
                            <input type="image" src="/searchlogo1.png" alt="Submit" style="width: 50px; height: auto;vertical-align: bottom;">
                            <div id="error-message" class="error-message">*Please Enter a valid domain</div>
                        </form>
                        <div class="nav-links">
                            <a href="/drkweb">DarkWeb</a>
                            <a href="/telegram">Hactivist_Terrorism</a>
                            <a href="/ransomware">RansomWare</a>
                            <a href="/phishing">Phishing</a>
                        </div>              
                    </div>
                    <div class="line"></div>
                    <h2 class="results-heading">No Record Found for: ${inputString}</h2>
                </div>
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
                Object.keys(row).forEach(key => {
                    // Check if the value contains multiple entries (IPs, etc.)
                    const value = row[key].includes(';') ? row[key].split(';').join('<br>') : row[key];
                    tableHtml += `<td>${value}</td>`;  // Insert <br> to break lines
                });
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
                        <link rel="stylesheet" href="/phishingStyle.css">
                        <script>
                            // Function to toggle between dark mode and light mode
                            function toggleTheme() {
                                const body = document.body;
                                body.classList.toggle('light-mode');

                                const themeToggleBtn = document.getElementById('theme-toggle-btn');
                                if (body.classList.contains('light-mode')) {
                                    themeToggleBtn.innerText = 'Dark Mode';
                                } else {
                                    themeToggleBtn.innerText = 'Light Mode';
                                }
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

                        <script>
                            // Function to highlight active link
                            function highlightActiveLink() {
                                const currentPath = window.location.pathname;
                                const links = document.querySelectorAll('.nav-links a');
                                links.forEach(link => {
                                    // Remove 'active' class from all links
                                    link.classList.remove('active');
                                    // Add 'active' class to the current page's link
                                    if (link.getAttribute('href') === currentPath) {
                                        link.classList.add('active');
                                    }
                                });
                            }    
                            window.onload = function() {
                                // Highlight the active link
                                highlightActiveLink();
                            };

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
                            <div class="header-content">
                                <button class="theme-toggle" id="theme-toggle-btn" onclick="toggleTheme()">Dark Mode</button>
                                <a href="/"><img class="logo" src="/CDOT_logo.jpg" alt="Logo"></a>
                                <form class="form-container" action="/submit" method="post" onsubmit="validateForm(event)">
                                    <input type="text" name="input_string" placeholder="Enter Domain here" value="${inputString}">
                                    <input type="image" src="/searchlogo1.png" alt="Submit" style="width: 50px; height: auto;vertical-align: bottom;">
                                    <div id="error-message" class="error-message">*Please Enter a valid domain</div>
                                </form>
                                <div class="nav-links">
                                    <a href="/drkweb">DarkWeb</a>
                                    <a href="/telegram">Hactivist_Terrorism</a>
                                    <a href="/ransomware">RansomWare</a>
                                    <a href="/phishing">Phishing</a>
                                </div>
                            </div>
                            <div class="line"></div>
                            <h2 class="results-heading">Results for: ${inputString}</h2>
                            <div class="table-container">
                                ${tableHtml}
                            </div>
                        </div>
                    </body>
                    </html>
                `);
            });
    });
});
app.get('/searchCSV', (req, res) => {
    const query = req.query.query.toLowerCase();
    const results = [];

    // Path to the CSV file on your local system
    const csvFilePath = path.join(__dirname, 'tsocData', 'data.csv');

    // Read and search the CSV
    fs.createReadStream(csvFilePath)
        .pipe(csv())
        .on('data', (row) => {
            // Check if the query exists in any of the row fields
            if (Object.values(row).some(value => value.toLowerCase().includes(query))) {
                results.push(row); // Add matching row to results
            }
        })
        .on('end', () => {
            if (results.length > 0) {
                res.send(`
                    <h1>Search Results</h1>
                    <ul>
                        ${results.map(result => `<li>${JSON.stringify(result)}</li>`).join('')}
                    </ul>
                    <a href="/phishing">Back to Phishing Page</a>
                `);
            } else {
                res.send(`
                    <h1>No results found for "${query}"</h1>
                    <a href="/phishing">Back to Phishing Page</a>
                `);
            }
        })
        .on('error', (err) => {
            console.error(err);
            res.status(500).send('Error reading CSV file.');
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
// Route to read the CSV file and filter by Is-India-related for telegram
app.get('/api/data', (req, res) => {
    const results = [];
    fs.createReadStream('teleg_final.csv') // Adjust to your CSV file path
        .pipe(csv())
        .on('data', (data) => {
            // Check if Is-India-related is true (case-insensitive)
            if (data['Is-India-related'] && data['Is-India-related'].toLowerCase() === 'true') {
                results.push(data);
            }
        })
        .on('end', () => {
            res.json(results);
        });
});
app.get('/hactivism', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'hactivism.html'));
});

const minioClient = new Minio.Client({
    endPoint: 'localhost',
    port: 9000,
    useSSL: false,
    accessKey: 'admin',
    secretKey: 'password'
});

app.get('/list/:prefix?', (req, res) => {
    const bucketName = 'darkwebleaks';  // Your bucket name
    const prefix = req.params.prefix || '';  // Folder path, empty means root

    let objects = [];

    const stream = minioClient.listObjectsV2(bucketName, prefix, true);

    stream.on('data', (obj) => {
        if (obj.prefix) {
            // Handle folders (if any)
            return;  // Skip prefixes if you are only interested in files
        }
        if (obj.name) {
            objects.push(obj.name);
        }
    });

    stream.on('end', () => {
        // Organize the objects into a folder-based hierarchy
        const folderStructure = {};

        objects.forEach(objectName => {
            const [folder, ...fileParts] = objectName.split('/');  // Split on '-'
            const fileName = fileParts.join('/');  // Join the remaining parts as the file name

            // Initialize folder if not already present
            if (!folderStructure[folder]) {
                folderStructure[folder] = [];
            }

            // Push the file into the corresponding folder
            if (fileName) {
                folderStructure[folder].push(fileName);
            }
        });

        res.json(folderStructure);  // Send the folder-structured data as JSON
    });

    stream.on('error', (err) => {
        console.error('Error listing objects:', err);
        res.status(500).json({ error: 'Error listing objects' });
    });
});

// Route to fetch an object (image/data) from a folder
app.get('/fetch/*', (req, res) => {
    const bucketName = 'darkwebleaks';  // Change to your bucket name
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
// Route to serve static HTML page for Darkweb browser
app.get('/drkweb', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'darkweb.html'));
});
// Search feature for darkweb
app.get('/search', (req, res) => {
    const keyword = req.query.keyword.toLowerCase();  // Get the keyword from query parameters
    const bucketName = 'darkwebleaks';  // Your bucket name
    let matchingFiles = [];

    const stream = minioClient.listObjectsV2(bucketName, '', true);

    stream.on('data', (obj) => {
        if (!obj.prefix && obj.name.toLowerCase().includes(keyword)) {
            matchingFiles.push(obj.name);  // Collect matching file names
        }
    });

    stream.on('end', () => {
        res.json(matchingFiles);  // Send the matching files as JSON
    });

    stream.on('error', (err) => {
        console.error('Error listing objects:', err);
        res.status(500).json({ error: 'Error listing objects' });
    });
});

// Route to serve the ransomware data page
app.get('/ransomware', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'ransomposts.html'));  // Serve the HTML page
});

// Route to serve and display the  ransomware posts
app.get('/ransomware-posts', (req, res) => {
    const postsFilePath = path.join(__dirname, 'posts.json');

    fs.readFile(postsFilePath, 'utf8', (err, data) => {
        if (err) {
            console.error('Error reading posts.json:', err);
            res.status(500).send('Error loading data');
            return;
        }

        try {
            const posts = JSON.parse(data);

            // Sort posts in descending order by date (assuming UTC format)
            const sortedPosts = posts.sort((a, b) => {
                const dateA = new Date(a.discovered).getTime();
                const dateB = new Date(b.discovered).getTime();

                return dateB - dateA;  // Descending order
            });

            // Limit to the latest 200 posts
            const latestPosts = sortedPosts.slice(0, 100);

            res.json(latestPosts);
        } catch (parseError) {
            console.error('Error parsing JSON data:', parseError);
            res.status(500).send('Error processing data');
        }
    });
});

app.get('/files/:folderName', (req, res) => {
    const bucketName = 'darkwebleaks'; // Your bucket name
    const folderName = req.params.folderName || ''; // Folder path

    let files = [];

    const stream = minioClient.listObjectsV2(bucketName, folderName, true);

    stream.on('data', (obj) => {
        if (!obj.prefix) {
            files.push(obj.name); // Collect file names
        }
    });

    stream.on('end', () => {
        res.json(files); // Send the file list as JSON
    });

    stream.on('error', (err) => {
        console.error('Error listing files:', err);
        res.status(500).json({ error: 'Error listing files' });
    });
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
    const bucketName = 'darkwebleaks';
    const folderPrefix = req.params.prefix; // The folder path where images are stored

    try {
        const files = await listFiles(bucketName, folderPrefix);
        res.json(files);
    } catch (err) {
        console.error('Error fetching MinIO files:', err);
        res.status(500).json({ error: 'Failed to fetch file names from MinIO.' });
    }
});

// app.post('/api/search', async (req, res) => {
//     const keyword = req.body.input_string?.trim(); // Get input and trim whitespace

//     // Check if the keyword is empty
//     if (!keyword) {
//         return res.status(400).json({ error: 'No keyword provided' });
//     }

//     try {
//         // Search in Elasticsearch for messages
//         const esResponse = await client.search({
//             index: 'telegram_messages',
//             body: {
//                 query: {
//                     multi_match: {
//                         query: keyword,
//                         fields: ['text', 'categories']
//                     }
//                 }
//             }
//         });

//         // Search in MinIO for files matching the keyword
//         const minioFiles = await listFiles('darkwebleaks');  // A function to list MinIO files
//         const filteredFiles = minioFiles.filter(file => file.includes(keyword));

//         // Format the results
//         const formattedResults = {
//             elasticsearchResults: esResponse.hits.hits.map(hit => ({
//                 id: hit._id,
//                 text: hit._source.text,
//                 categories: hit._source.categories,
//                 date: hit._source.timestamp || 'Unknown Date' // Add more fields as needed
//             })),
//             minioFiles: filteredFiles.map(file => ({
//                 name: file,
//                 link: `/fetch/${file}` // Adjust the link as necessary
//             }))
//         };

//         // Send formatted results back to the client
//         res.json(formattedResults);

//     } catch (error) {
//         console.error(error);
//         res.status(500).json({ error: 'An error occurred while searching' });
//     }
// });


// Fetching Data from Elasticsearch for pie chart
async function fetchElasticData() {
    try {
        const result = await client.search({
            index: 'telegram_messages',
            body: {
                size: 0, // No need for documents, just the aggregation
                aggs: {
                    threat_categories: {
                        terms: {
                            field: 'categories.keyword', // Assuming 'category' is a keyword field
                            size: 10
                        }
                    }
                }
            }
        });

        return result.aggregations.threat_categories.buckets;
    } catch (err) {
        console.error('Error fetching data from Elasticsearch', err);
    }
}

// Once the data is fetched, you need to prepare it in the format suitable for the pie chart.
app.get('/pie-chart-data', async (req, res) => {
    try {
        const buckets = await fetchElasticData(); // Assuming fetchElasticData is your function
        res.json(buckets);
    } catch (err) {
        console.error('Error fetching pie chart data:', err);
        res.status(500).json({ error: 'Failed to fetch data' });
    }
});

// New route to fetch folder count data from MinIO for pie chart
app.get('/folder-count', async (req, res) => {
    try {
        const bucketName = 'darkwebleaks';  // Replace with your actual MinIO bucket name
        const stream = minioClient.listObjectsV2(bucketName, '', true);  // List all objects
        const files = [];

        // Collect all files in the bucket
        for await (const obj of stream) {
            files.push(obj);
        }

        // Create an object to hold folder counts
        const folderCounts = {};

        files.forEach(file => {
            // Extract the folder name from the file path
            const folder = file.name.split('/')[0];  // Split by '/' and take the first part as folder name

            if (folder) {
                // Increment the count for the folder
                folderCounts[folder] = (folderCounts[folder] || 0) + 1;
            }
        });

        // Log the folder counts for debugging purposes
        // console.log('Folder Counts:', folderCounts);

        // Respond with the folder count data
        res.json(folderCounts);
    } catch (error) {
        console.error('Error fetching folder count:', error);
        res.status(500).json({ error: 'Failed to fetch folder counts' });
    }
});

// Serve the files page
app.get('/files-page', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'files-page.html')); // Make sure the path is correct
});

// Displaying bar graph for phishing
// Directory containing the CSV files
const csvDirectory = path.join(__dirname, 'dynamic');

// Function to get file modification times
function getRecentCsvFiles(directory, limit = 15) {
    // Read all files in the directory
    const files = fs.readdirSync(directory)
        .filter(file => file.endsWith('.csv'))
        .map(file => {
            const filePath = path.join(directory, file);
            return {
                file: file,
                mtime: fs.statSync(filePath).mtime // Get last modified time
            };
        })
        .sort((a, b) => b.mtime - a.mtime) // Sort by modification time (descending)
        .slice(0, limit); // Get the most recent files

    return files.map(f => f.file);
}

// Endpoint to get phishing data
app.get('/get_phishing_data', (req, res) => {
    const phishingData = [];

    // Get the 15 most recent CSV files
    const recentCsvFiles = getRecentCsvFiles(csvDirectory, 15);

    let fileCount = recentCsvFiles.length;

    recentCsvFiles.forEach(file => {
        // Extract domain name from the file name
        const domainName = file.replace('phishoutput_', '').replace('.csv', '');  // Extract the part after phishing_

        // Count the number of entries in the CSV file
        const filePath = path.join(csvDirectory, file);
        let entryCount = 0;

        fs.createReadStream(filePath)
            .pipe(csv())
            .on('data', () => {
                entryCount++;  // Increment entry count for each row
            })
            .on('end', () => {
                phishingData.push({
                    domain: domainName,  // Use domainName for the bar graph label
                    entries: entryCount
                });

                // When all files are processed, send the response
                if (--fileCount === 0) {
                    res.json(phishingData);
                }
            });
    });
});

// Route to Read Files and Send CSV Data to Frontend
// app.get('/csv-data', (req, res) => {
//     const folderPath = path.join(__dirname, 'dynamic'); // CSV folder path

//     fs.readdir(folderPath, (err, files) => {
//         if (err) {
//             return res.status(500).send('Unable to scan folder');
//         }

//         const allData = [];
//         let processedFiles = 0; // Track processed CSV files

//         // Filter to process only CSV files
//         const csvFiles = files.filter(file => path.extname(file) === '.csv');

//         if (csvFiles.length === 0) {
//             return res.json(allData); // Return empty array if no CSV files found
//         }

//         csvFiles.forEach((file) => {
//             const domainName = path.basename(file).replace('phishoutput_', '').replace('.csv', '');
//             const filePath = path.join(folderPath, file);

//             const data = { domain: domainName, phishingDomains: [] };

//             fs.createReadStream(filePath)
//                 .pipe(csv())
//                 .on('data', (row) => {
//                     // Assuming phishing domains start from the 3rd entry (first two are headers/original domain)
//                     data.phishingDomains.push(row);
//                 })
//                 .on('end', () => {
//                     allData.push(data); // Push data once the stream for this file ends
//                     processedFiles++; // Increment processed file count

//                     // When all files are processed, send the response
//                     if (processedFiles === csvFiles.length) {
//                         res.json(allData); // Send all CSV data to frontend once done
//                     }
//                 })
//                 .on('error', (error) => {
//                     console.error(`Error processing file ${file}:`, error);
//                     processedFiles++; // Still increment to avoid hanging
//                     if (processedFiles === csvFiles.length) {
//                         res.json(allData); // Send partial data if an error occurs
//                     }
//                 });
//         });
//     });
// });

// Unified Search on the home page from different data sources
app.get('/unified-search', async (req, res) => {
    const query = req.query.query.toLowerCase();
    
    // Initialize results object for each source
    const results = {
        elasticResults: [],
        csvResults: [],
        jsonResults: [],
        minioResults: []
    };

    // 1. Search Elasticsearch
    try {
        const elasticResults = await client.search({
            index: 'telegram_messages',
            body: {
                query: {
                    bool: {
                        must: {
                            multi_match: {
                                query: query,
                                fields: ['message', 'categories', 'threat_actor']
                            }
                        }
                    }
                }
            }
        });
        results.elasticResults = elasticResults.hits.hits.map(hit => ({
            source: 'Elasticsearch',
            data: hit._source
        }));
    } catch (err) {
        console.error('Error fetching Elasticsearch results:', err);
    }

    // 2. Search CSV (data.csv)
    const csvFilePath = path.join(__dirname, 'tsocData', 'data.csv');
    try {
        await new Promise((resolve, reject) => {
            const csvResults = [];
            fs.createReadStream(csvFilePath)
                .pipe(csv())
                .on('data', (row) => {
                    if (Object.values(row).some(value => value.toLowerCase().includes(query))) {
                        csvResults.push({ source: 'CSV', data: row });
                    }
                })
                .on('end', () => {
                    results.csvResults = csvResults;
                    resolve();
                })
                .on('error', (err) => {
                    reject(err);
                });
        });
    } catch (err) {
        console.error('Error reading CSV file:', err);
    }

    // 3. Search posts.json
    try {
        const postsFilePath = path.join(__dirname, 'posts.json');
        const postsData = JSON.parse(fs.readFileSync(postsFilePath, 'utf8'));

        const postMatches = postsData.filter(post => {
            const postTitle = post.post_title?.toLowerCase() || '';
            const groupName = post.group_name?.toLowerCase() || '';
            const discovered = post.discovered?.toLowerCase() || '';
            return postTitle.includes(query) || groupName.includes(query) || discovered.includes(query);
        });

        results.jsonResults = postMatches.map(post => ({
            source: 'JSON',
            data: post
        }));
    } catch (jsonError) {
        console.error("Error reading or parsing posts.json:", jsonError);
    }

    // 4. Search MinIO
    try {
        const bucketName = 'darkwebleaks';
        const stream = minioClient.listObjectsV2(bucketName, '', true);
        const minioResults = [];

        stream.on('data', (obj) => {
            if (obj.name.toLowerCase().includes(query)) {
                minioResults.push({ source: 'MinIO', data: obj.name });
            }
        });

        stream.on('end', () => {
            results.minioResults = minioResults;
            // Send all results as a unified response
            res.json(results);
        });

        stream.on('error', (err) => {
            console.error('Error searching MinIO:', err);
            res.status(500).send('Error searching MinIO');
        });
    } catch (err) {
        console.error('Error initializing MinIO search:', err);
        res.status(500).send('Error initializing MinIO search');
    }
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running at http://localhost:${PORT}`);
});
