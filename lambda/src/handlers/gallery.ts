import { QueryCommand } from '@aws-sdk/lib-dynamodb';
import type { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from 'aws-lambda';
import { ddb, PHOTOS_TABLE, ok } from '../lib/photoShared';

export async function getGallery(event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2> {
  const eventId = event.queryStringParameters?.eventId;

  const result = await ddb.send(new QueryCommand({
    TableName: PHOTOS_TABLE,
    IndexName: 'byOrder',
    KeyConditionExpression: 'entity = :e',
    FilterExpression: eventId
      ? 'visible = :v AND eventId = :eid'
      : 'visible = :v',
    ExpressionAttributeValues: {
      ':e': 'PHOTO',
      ':v': true,
      ...(eventId ? { ':eid': eventId } : {}),
    },
    ScanIndexForward: true,
  }));

  return ok({ photos: result.Items ?? [] });
}
