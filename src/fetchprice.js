let apiEndpoint = "";

// Fetch the configuration
async function fetchConfig() {
    const response = await fetch('config.json');
    const config = await response.json();
    apiEndpoint = config.API_ENDPOINT;
    console.log("apiEndpoint: ", apiEndpoint);
}
// Call this function to ensure the config is loaded before any button is clicked
fetchConfig();



async function fetchStockPrice() {
    const ticker = document.getElementById('tickerInput').value;
    console.log(ticker)
    try {
        response = await fetch(`${apiEndpoint}stockprice?ticker=${ticker}`);
        console.log("lambda finished")
        const data = await response.json();
        console.log(data)
        document.getElementById('stockPrice').innerText = data.price;
        document.getElementById('popup').style.display = 'block';
        populateStockHistory();
    } catch (error) {
        console.error('Error fetching stock price:', error);
    }
}

function populateStockHistory() {
   
    // Call your Lambda function that reads the DynamoDB
    fetch('${apiEndpoint}dynamofetcher')
        .then(response => response.json())
        .then(data => {
            const tableBody = document.getElementById('stockHistory');
            tableBody.innerHTML = ''; // Clear previous entries

            data.forEach(stock => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${stock.ticker}</td>
                    <td>${stock.price}</td>
                    <td>${stock.timestamp}</td>
                `;
                tableBody.appendChild(row);
            });
        })
        .catch(error => {
            console.error('Error fetching stock history:', error);
        });
}

console.log('Stockprice URL:', stockpriceURL);
console.log('Dynamofetcher URL:', dynamofetcherURL);