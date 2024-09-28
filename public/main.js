async function fetchMessages(isIndiaRelated = false) {
    try {
        const response = await fetch(`/api/messages${isIndiaRelated ? '?isIndiaRelated=true' : ''}`);
        const messages = await response.json();
        const tableBody = document.getElementById('messagesTableBody');
        tableBody.innerHTML = '';  // Clear the table before adding new data

        messages.forEach((message, index) => {
            const row = document.createElement('tr');

            // Channel cell
            const channelCell = document.createElement('td');
            channelCell.textContent = message._source.chat_name || 'N/A';
            row.appendChild(channelCell);

            // Message preview cell (first 50 characters only)
            const textCell = document.createElement('td');
            textCell.textContent = message._source.text.slice(0, 30) + '...'; // show a preview of the message
            row.appendChild(textCell);

            // Timestamp cell
            const timestampCell = document.createElement('td');
            const timestamp = new Date(message._source.timestamp);
            const istTime = timestamp.toLocaleString("en-IN", { timeZone: "Asia/Kolkata" });
            timestampCell.textContent = istTime || 'N/A';
            row.appendChild(timestampCell);

            // India Related cell
            const indiaRelatedCell = document.createElement('td');
            indiaRelatedCell.textContent = message._source.is_india_related ? "Yes" : "No";
            row.appendChild(indiaRelatedCell);

            // Categories cell - Handle different cases
            const categoriesCell = document.createElement('td');
            const categories = message._source.categories;

            if (Array.isArray(categories)) {
                categoriesCell.textContent = categories.join(', ');
            } else if (typeof categories === 'string') {
                categoriesCell.textContent = categories;
            } else {
                categoriesCell.textContent = 'N/A';
            }
            row.appendChild(categoriesCell);

            // View Details button cell
            const detailsCell = document.createElement('td');
            const detailsButton = document.createElement('button');
            detailsButton.textContent = "View Details";
            detailsButton.setAttribute('data-index', index);  // store the message index in the button
            detailsButton.addEventListener('click', () => showModal(message._source.chat_name, message._source.text));  // Add click event
            detailsCell.appendChild(detailsButton);
            row.appendChild(detailsCell);

            tableBody.appendChild(row);
        });
    } catch (error) {
        console.error('Error fetching data:', error);
    }
}

// Function to display the modal with full message text
function showModal(channel, messageText) {
    const modal = document.getElementById('messageModal');
    const modalText = document.getElementById('modalMessageText');
    const closeButton = document.querySelector('.modal .close');

    // Set the channel and message in the modal
    modalText.innerHTML = `<strong>Threat Actor:</strong> ${channel}<br><strong>Message:</strong> ${messageText}`;
    modal.style.display = "block";  // Show the modal

    // Close the modal when the close button is clicked
    closeButton.onclick = function() {
        modal.style.display = "none";
    }

    // Close the modal when clicking outside of the modal content
    window.onclick = function(event) {
        if (event.target === modal) {
            modal.style.display = "none";
        }
    }
}

// Add event listener for the Show Alerts button
document.getElementById('alertsButton').addEventListener('click', function() {
    fetchMessages(true); // Fetch only India-related messages when this button is clicked
});

// Initial fetch without filtering
fetchMessages();
