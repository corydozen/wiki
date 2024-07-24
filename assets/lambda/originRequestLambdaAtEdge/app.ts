import { CloudFrontRequestHandler } from "aws-lambda";

export const handler: CloudFrontRequestHandler = async (event) => {
  const eventRecord = event.Records[0];
  const request = eventRecord.cf.request;
  const uri = request.uri;

  // if URI includes ".", indicates file extension, return early and don't modify URI
  if (uri.includes(".")) {
    return request;
  }

  // if URI doesn't end with "/" slash, then we need to add the slash first before appending index.html
  if (!uri.endsWith("/")) {
    request.uri += "/";
  }

  request.uri += "index.html";
  console.log(`Request URI: ${request.uri}`);
  return request;
};
