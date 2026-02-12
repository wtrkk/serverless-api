import * as cdk from 'aws-cdk-lib/core';
import { Construct } from 'constructs';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as nodejs from 'aws-cdk-lib/aws-lambda-nodejs';
import * as apigw from 'aws-cdk-lib/aws-apigateway';
import * as path from 'path';

interface ServerlessApiStackProps extends cdk.StackProps {
  // パラメータファイル読み込み時に紐づける環境名
  nodeEnv: string;
}

export class ServerlessApiStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: ServerlessApiStackProps) {
    super(scope, id, props);

    /**
     * 事前定義
     */
    // パラメータファイル読み込み（用途に応じて変更する可能性のあるパラメータは外部ファイルに記述）
    const config = require("../config/" + props.nodeEnv);

    /**
     * DynamoDB
     */
    const table = new dynamodb.Table(this, "ItemsTable", {
      tableName: `${config.common.project}-${config.common.env}-items-table`,
      partitionKey: { name: 'id', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    /**
     * Lambda
     */
    const fn = new lambda.Function(this, "ApiFunction", {
      functionName: `${config.common.project}-${config.common.env}-api-function`,
      runtime: lambda.Runtime.PYTHON_3_14,
      handler: "lambda_function.lambda_handler",
      code: lambda.Code.fromAsset(path.join(__dirname, "../lambda")),
      environment: {
        TABLE_NAME: table.tableName,
      },
    });
    // Lambda→DynamoDBへのReadWrite権限付与
    table.grantReadWriteData(fn);

    /**
     * API GateWay
     */
    const api = new apigw.LambdaRestApi(this, "ServerlessApi", {
      restApiName: `${config.common.project}-${config.common.env}-serverless-api`,
      handler: fn,
      proxy: true
    });


  }
}
