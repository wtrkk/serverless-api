import json
import os
import uuid
import boto3
from boto3.dynamodb.conditions import Key

dynamodb = boto3.resource("dynamodb")
table = dynamodb.Table(os.environ["TABLE_NAME"])


def lambda_handler(event, context):
    method = event["httpMethod"]

    try:
        if method == "POST":
            return create_item(event)

        elif method == "GET":
            return get_item(event)

        elif method == "PUT":
            return update_item(event)

        elif method == "DELETE":
            return delete_item(event)

        else:
            return response(400, {"message": "Unsupported method"})

    except Exception as e:
        return response(500, {"error": str(e)})


# =========================
# CREATE
# =========================
def create_item(event):
    body = json.loads(event["body"])

    # idが無ければ自動生成
    if "id" not in body:
        body["id"] = str(uuid.uuid4())

    table.put_item(
        Item=body,
        ConditionExpression="attribute_not_exists(id)"
    )

    return response(200, body)


# =========================
# READ
# =========================
def get_item(event):
    params = event.get("queryStringParameters") or {}
    item_id = params.get("id")

    # ----- 1件取得 -----
    if item_id:
        result = table.get_item(Key={"id": item_id})
        return response(200, result.get("Item"))

    # ----- 全件取得 -----
    result = table.scan()
    return response(200, result.get("Items", []))


# =========================
# UPDATE
# =========================
def update_item(event):
    body = json.loads(event["body"])

    item_id = body.get("id")
    if not item_id:
        return response(400, {"message": "id is required"})

    # id以外を更新対象にする
    update_expr = []
    expr_attr_values = {}

    for key, value in body.items():
        if key == "id":
            continue
        update_expr.append(f"{key} = :{key}")
        expr_attr_values[f":{key}"] = value

    if not update_expr:
        return response(400, {"message": "No fields to update"})

    table.update_item(
        Key={"id": item_id},
        UpdateExpression="SET " + ", ".join(update_expr),
        ExpressionAttributeValues=expr_attr_values,
        ReturnValues="ALL_NEW"
    )

    return response(200, {"message": "Updated"})


# =========================
# DELETE
# =========================
def delete_item(event):
    params = event.get("queryStringParameters") or {}
    item_id = params.get("id")

    if not item_id:
        return response(400, {"message": "id is required"})

    table.delete_item(Key={"id": item_id})

    return response(200, {"message": "Deleted"})


# =========================
# 共通レスポンス
# =========================
def response(status, body):
    return {
        "statusCode": status,
        "headers": {
            "Content-Type": "application/json"
        },
        "body": json.dumps(body)
    }