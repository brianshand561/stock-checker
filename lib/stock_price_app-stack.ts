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

  //   const s3DeployRole = new iam.Role(this, 'S3DeployRole', {
  //     assumedBy: new iam.ServicePrincipal('cloudformation.amazonaws.com'),
  //     description: 'Role for S3 Deployment',
  //     roleName: 'S3DeployRole'
  // });
    
  //   s3DeployRole.addManagedPolicy(iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonS3FullAccess'));

    const S3DeployRole = new iam.Role(
      this,
      "S3-Deployment-Lambda-Execution-Role",
      {
        assumedBy: new iam.ServicePrincipal("lambda.amazonaws.com"),
        roleName: 's3-deployment-lambda-execution-role',
        // permissionsBoundary: iam.ManagedPolicy.fromManagedPolicyArn(
        //     this,
        //     "IAMPermissionsBoundary for S3 Bucket Deployment Lambda Execution Role",
        //     props.appPermissionsBoundary!
        // ),
        inlinePolicies: {
            CDKPolicyForS3BucketDeployment: new iam.PolicyDocument({
              statements: [
                  new iam.PolicyStatement({
                    actions: ["s3:GetObject*", "s3:GetBucket*", "s3:List*"],
                    resources: [
                        "arn:aws:s3:::cdk-*",
                        "arn:aws:s3:::cdk-*/*",
                    ],
                  }),
                  new iam.PolicyStatement({
                    actions: [
                        "s3:GetObject*",
                        "s3:GetBucket*",
                        "s3:List*",
                        "s3:DeleteObject*",
                        "s3:PutObject",
                        "s3:PutObjectLegalHold",
                        "s3:PutObjectRetention",
                        "s3:PutObjectTagging",
                        "s3:PutObjectVersionTagging",
                        "s3:Abort*",
                    ],
                    resources: [
                        `arn:aws:s3:::**`,
                        `arn:aws:s3:::**/*`,
                    ],
                  }),
                  new iam.PolicyStatement({
                    actions: [
                        "cloudfront:GetInvalidation",
                        "cloudfront:CreateInvalidation",
                    ],
                    resources: ["*"],
                  }),
              ],
            }),
        },
      }
  );



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
      deploy: true,
      defaultCorsPreflightOptions: {
        allowOrigins: apigateway.Cors.ALL_ORIGINS,
        allowMethods: apigateway.Cors.ALL_METHODS,
      },

})
    const stockprice = stockApiGateway.root.addResource('stockprice');
    stockprice.addMethod('GET', new apigateway.LambdaIntegration(stockPriceFetchLambda));

    // Fetch the API Gateway endpoint
    // const apiEndpoint = stockApiGateway.url;

    // // Read index.html and replace the placeholder
    // const indexPath = path.join(__dirname, '../dist/fetchprice.js');
    // let indexContent = fs.readFileSync(indexPath, 'utf8');
    // indexContent = indexContent.replace('{{API_ENDPOINT}}', apiEndpoint);
    // fs.writeFileSync(indexPath, indexContent);


    // const configPath = path.join(__dirname, '../dist/config.json');
    // let configContent = fs.readFileSync(configPath, 'utf8');
    // const config = JSON.parse(configContent);
    // config.API_ENDPOINT = apiEndpoint;
    // fs.writeFileSync(configPath, JSON.stringify(config, null, 2));

    

    // Create an S3 bucket for your site
    const websiteBucket = new s3.Bucket(this, 'WebsiteBucket', {
      versioned: true,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      accessControl: s3.BucketAccessControl.PRIVATE,
      websiteIndexDocument: 'index.html',
      publicReadAccess: true,  
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ACLS,
    });

    // websiteBucket.grantReadWrite(s3DeployRole);

    // Deploy your site to the S3 bucket
    new s3deploy.BucketDeployment(this, 'DeployWebsite', {
      sources: [s3deploy.Source.asset('./dist/')],
      destinationBucket: websiteBucket,
      role: S3DeployRole,
      // distributionOptions: {
      //   cacheControl: [s3deploy.CacheControl.fromString('max-age=31536000,public')],
      // },
      // accessControl: s3.BucketAccessControl.PUBLIC_READ
      
    });
}

}

