echo "export const config = {
  certificateArn: \"$CERT_ARN\",
  domain: \"$DOMAIN\",
  repoOwner: \"$REPO_OWNER\",
  repo: \"$REPO\",
  connectionArn: \"$CONNECTION_ARN\",
};" > config.ts