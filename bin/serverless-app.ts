#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib/core';
import { ServerlessAppStack } from '../lib/serverless-app-stack';

// デプロイ前に環境変数を指定し、紐づけるパラメータファイルを制御する
const envName = process.env.NODE_ENV;
if (envName == null){
  console.error(
    "環境変数'NODE_ENV'が設定されていません。"
  );
  process.exit(1);
}

// パラメータファイル読み込み
const config = require("../config/" + envName);
// CDKアプリケーション作成
const app = new cdk.App();

// Stack作成
const serverlessAppStack = new ServerlessAppStack(app, `${envName}-ServerlessAppStack`, {
  env: {
    account: config.accountId,
    region: config.regionId
  },
  nodeEnv: envName,
});

// App内リソースに共通tagを付与
cdk.Tags.of(app).add("Project", config.common.project);
cdk.Tags.of(app).add("Environment", config.common.env);