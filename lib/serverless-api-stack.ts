import * as cdk from 'aws-cdk-lib/core';
import { Construct } from 'constructs';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apigwv2 from 'aws-cdk-lib/aws-apigatewayv2';
import * as integrations from 'aws-cdk-lib/aws-apigatewayv2-integrations';
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
    const itemsTable = new dynamodb.Table(this, "ItemsTable", {
      tableName: `${config.common.project}-${config.common.env}-items-table`,
      partitionKey: { name: 'id', type: dynamodb.AttributeType.STRING },
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    /**
     * Lambda
     */
    const apiFunction = new lambda.Function(this, "ApiFunction", {
      functionName: `${config.common.project}-${config.common.env}-api-function`,
      runtime: lambda.Runtime.PYTHON_3_14,
      handler: "lambda_function.lambda_handler",
      code: lambda.Code.fromAsset(path.join(__dirname, "../lambda")),
      environment: {
        TABLE_NAME: itemsTable.tableName,
      },
    });
    // Lambda→DynamoDBへのReadWrite権限付与
    itemsTable.grantReadWriteData(apiFunction);

    /**
     * API GateWay
     */
    const httpApi = new apigwv2.HttpApi(this, "HttpApiApi", {
      apiName: `${config.common.project}-${config.common.env}-http-api`,
    });
    
    // Lambda統合を作成
    const integration = new integrations.HttpLambdaIntegration(
      "LambdaIntegration",
      apiFunction
    );

    const routes = [
      { method: apigwv2.HttpMethod.GET, path: '/items/{id}' },
      { method: apigwv2.HttpMethod.GET, path: '/items' },
      { method: apigwv2.HttpMethod.PUT, path: '/items' },
      { method: apigwv2.HttpMethod.DELETE, path: '/items/{id}' },
    ];

    routes.forEach(route => {
      httpApi.addRoutes({
        path: route.path,
        methods: [route.method],
        integration
      });
    });

  }
}
