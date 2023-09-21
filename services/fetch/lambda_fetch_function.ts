console.log("LAMBDA FUCNTION EXECUTED")

import { SecretsManagerClient, GetSecretValueCommand } from "@aws-sdk/client-secrets-manager";
import fetch from 'node-fetch';
// import * as dynamodb from '@aws-cdk/aws-dynamodb';
import { DynamoDB } from 'aws-sdk';
// const fetcher = import('node-fetch'); 

exports.handler = async (event:any) => {
    console.log("running lambda with event:", event)
    console.log(event.queryStringParameters.symbol)
    // 1. Access the API key from AWS Secrets Manager
    const client = new SecretsManagerClient({ region: "us-east-1" });
    console.log("client: " , client)

    let apiKey;
    
    
    try {
        const response = await client.send(new GetSecretValueCommand({
            SecretId: "stock_checker_api",
            VersionStage: "AWSCURRENT",
        }));
        console.log("response: " , response)
        apiKey = response.SecretString ? JSON.parse(response.SecretString).apikey : '';
        console.log("apiKey: " , apiKey)
    } catch (error) {
        console.error('Error retrieving secret:', error);
        throw new Error('Failed to retrieve API key.');
    }

    
    
    // 2. Use the API key to request stock data from `alphavantage.co`
    const ticker = event.queryStringParameters.ticker; // Extracting the ticker from the incoming request
    const stockEndpoint = `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${ticker}&apikey=${apiKey}`;
    let stockData:any;
    
    try {
        const response = await fetch(stockEndpoint);
        console.log("response: " , response)
        stockData = await response.json();
        console.log("stockData: " , stockData)
    } catch (error) {
        console.error('Error fetching stock data:', error);
        throw new Error('Failed to fetch stock data.');
    }

    // 3. Parse and return the required information
    console.log("stockData: " , stockData["Global Quote"]["05. price"])

    let price = stockData["Global Quote"]["05. price"]

    // Insert into DynamoDB
    

    const dynamodb = new DynamoDB.DocumentClient();

    await dynamodb.put({
        TableName: 'StockTable',
        Item: {
            ticker: ticker,
            price: price,
            timestamp: new Date().toISOString()
        }
    }).promise();

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
}
