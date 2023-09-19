const { SecretsManagerClient, GetSecretValueCommand } = require("@aws-sdk/client-secrets-manager");
const fetcher = require('node-fetch'); // You might need to add 'node-fetch' to your Lambda's dependencies

exports.handler = async (event) => {
    // 1. Access the API key from AWS Secrets Manager
    const client = new SecretsManagerClient({ region: "us-east-1" });
    let apiKey;
    
    try {
        const response = await client.send(new GetSecretValueCommand({
            SecretId: "stock_checker_api",
            VersionStage: "AWSCURRENT",
        }));
        apiKey = JSON.parse(response.SecretString).apikey;
    } catch (error) {
        console.error('Error retrieving secret:', error);
        throw new Error('Failed to retrieve API key.');
    }
    
    // 2. Use the API key to request stock data from `alphavantage.co`
    const ticker = event.queryStringParameters.ticker; // Extracting the ticker from the incoming request
    const stockEndpoint = `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${ticker}&apikey=${apiKey}`;
    let stockData;
    
    try {
        const response = await fetcher(stockEndpoint);
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
