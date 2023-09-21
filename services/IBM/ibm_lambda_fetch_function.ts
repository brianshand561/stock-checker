console.log("IBM LAMBDA FUNCTION EXECUTED")
import fetch from 'node-fetch';


exports.handler = async (event:any) => {
    console.log("running lambda with event:", event)
    
    // const apiKey = '3U31896RG615ZMFY'
    
    // console.log(apiKey)
    
    // 2. Use the API key to request stock data from `alphavantage.co`
    // const ticker = 'IBM'; // Extracting the ticker from the incoming request

    const stockEndpoint = `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=IBM&apikey=3U31896RG615ZMFY`;
    let stockData:any;
    
    try {
        const response = await fetch(stockEndpoint);
        stockData = await response.json();
    } catch (error) {
        console.error('Error fetching stock data:', error);
        throw new Error('Failed to fetch stock data.');
    }

    // 3. Parse and return the required information
    return {
        statusCode: 200,
        body: JSON.stringify({
            price: stockData["Global Quote"]["05. price"]
        }),
        headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*' // Necessary for CORS. Adjust this as needed.
        }
    };
};
