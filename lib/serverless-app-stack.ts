import * as cdk from 'aws-cdk-lib/core';
import { Construct } from 'constructs';
// import * as sqs from 'aws-cdk-lib/aws-sqs';

interface ServerlessAppStackProps extends cdk.StackProps {
  // パラメータファイル読み込み時に紐づける環境名
  nodeEnv: string;
}

export class ServerlessAppStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: ServerlessAppStackProps) {
    super(scope, id, props);

    /**
     * 事前定義
     */
    // パラメータファイル読み込み（用途に応じて変更する可能性のあるパラメータは外部ファイルに記述）
    const config = require("../config/" + props.nodeEnv);








    
  }
}
