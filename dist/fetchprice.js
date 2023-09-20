// console.log("step 1")
// let apiEndpoint = "";

// // Fetch the configuration
// async function fetchConfig() {
//     const response = await fetch('config.json');
//     const config = await response.json();
//     apiEndpoint = config.API_ENDPOINT;
// }



// console.log("step 2")
// // Call this function to ensure the config is loaded before any button is clicked
// fetchConfig();

async function fetchStockPrice() {
    const ticker = document.getElementById('tickerInput').value;
    console.log(ticker)
    try {
        const response = await fetch(`https://c00cqwhin7.execute-api.us-east-1.amazonaws.com/prod/stockprice?ticker=${ticker}`);
        const data = await response.json();
        document.getElementById('stockPrice').innerText = data.price;
        document.getElementById('popup').style.display = 'block';
    } catch (error) {
        console.error('Error fetching stock price:', error);
    }
}
