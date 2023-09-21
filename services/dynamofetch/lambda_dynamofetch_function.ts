const { DynamoDB } = require('aws-sdk');

exports.handler = async (event:any) => {
    const dynamodb = new DynamoDB.DocumentClient();
    const TableName = 'StockTable'; 
    
    try {
        const results = await dynamodb.scan({
            TableName,
            Limit: 10, // Fetch the latest 10 entries. Adjust as needed.
            ScanIndexForward: false, // To get the items in descending order based on the timestamp
        }).promise();

        return {
            statusCode: 200,
            body: JSON.stringify(results.Items),
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*' // Necessary for CORS. Adjust this as needed.
            }
        };
    } catch (error) {
        console.error('Error fetching data from DynamoDB:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Failed to fetch stock history' }),
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*' // Necessary for CORS. Adjust this as needed.
            }
        };
    }
};
