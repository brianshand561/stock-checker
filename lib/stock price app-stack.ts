import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
// import * as sqs from 'aws-cdk-lib/aws-sqs';

export class StockPriceAppStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // API KEY: 3U31896RG615ZMFY
    // https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=IBM&apikey=demo

    // The code that defines your stack goes here

    // example resource
    // const queue = new sqs.Queue(this, 'StockPriceAppQueue', {
    //   visibilityTimeout: cdk.Duration.seconds(300)
    // });
  }
}
