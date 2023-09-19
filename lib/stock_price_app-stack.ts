import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as s3deploy from 'aws-cdk-lib/aws-s3-deployment';
import * as fs from 'fs';
import * as path from 'path';



export class StockPriceAppStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=IBM&apikey=API_KEY

    // IAM Role for Lambda

    const lambdaRole = new iam.Role(this, 'LambdaRole', {
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
      description: 'Lambda Role to fetch Stock Price',
      roleName: 'StockPriceLambdaRole'
  })
    lambdaRole.addManagedPolicy(iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonDynamoDBFullAccess'));
    lambdaRole.addManagedPolicy(iam.ManagedPolicy.fromAwsManagedPolicyName('SecretsManagerReadWrite'));
    lambdaRole.addManagedPolicy(iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonS3FullAccess'));

    // Lambda Functions

    const stockPriceFetchLambda = new lambda.Function(this, 'StockPriceFetchLambda', {
      runtime: lambda.Runtime.NODEJS_18_X,
      code: lambda.Code.fromAsset('./services'),
      handler: 'lambda_fetch_function.handler',
      functionName: 'StockPriceFetchLambda',
      role: lambdaRole
    })

    // const stockPriceStoreLambda = new lambda.Function(this, 'StockPriceStoreLambda', {
    //   runtime: lambda.Runtime.NODEJS_18_X,
    //   code: lambda.Code.fromAsset('../services/'),
    //   handler: 'lambda_store_function.handler',
    //   functionName: 'StockPriceStoreLambda',
    //   role: lambdaRole
    // })

    // API Gatway

    const stockApiGateway = new apigateway.LambdaRestApi(this, 'StockApiGateway', {
      handler: stockPriceFetchLambda,
      proxy: false,
      restApiName: 'StockApiGateway',
      deploy: true

})
    const stockprice = stockApiGateway.root.addResource('stockprice');
    stockprice.addMethod('GET', new apigateway.LambdaIntegration(stockPriceFetchLambda));

    // Fetch the API Gateway endpoint
    const apiEndpoint = stockApiGateway.url;

    // Read index.html and replace the placeholder
    const indexPath = path.join(__dirname, '../dist/index.html');
    let indexContent = fs.readFileSync(indexPath, 'utf8');
    indexContent = indexContent.replace('{{API_ENDPOINT}}', apiEndpoint);
    fs.writeFileSync(indexPath, indexContent);

    // Create an S3 bucket for your site
    const websiteBucket = new s3.Bucket(this, 'WebsiteBucket', {
      // bucketName: 'brianshand-testbucket-stockpriceapp01',
      versioned: true,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      websiteIndexDocument: 'index.html',
      publicReadAccess: true,  
    });

    // Deploy your site to the S3 bucket
    new s3deploy.BucketDeployment(this, 'DeployWebsite', {
      sources: [s3deploy.Source.asset(path.join(__dirname, '../dist'))],
      destinationBucket: websiteBucket,
      role: lambdaRole,
      // distributionOptions: {
      //   cacheControl: [s3deploy.CacheControl.fromString('max-age=31536000,public')],
      // },
      accessControl: s3.BucketAccessControl.PUBLIC_READ
      
    });
}

}

