import { Duration, RemovalPolicy, Stack, StackProps } from "aws-cdk-lib";
import { Certificate } from "aws-cdk-lib/aws-certificatemanager";
import {
  AllowedMethods,
  Distribution,
  LambdaEdgeEventType,
  SecurityPolicyProtocol,
  ViewerProtocolPolicy,
  experimental,
} from "aws-cdk-lib/aws-cloudfront";
import { S3Origin } from "aws-cdk-lib/aws-cloudfront-origins";
import { Code, Runtime } from "aws-cdk-lib/aws-lambda";
import { BlockPublicAccess, Bucket } from "aws-cdk-lib/aws-s3";
import { BucketDeployment, Source } from "aws-cdk-lib/aws-s3-deployment";
import { Secret } from "aws-cdk-lib/aws-secretsmanager";
import { Construct } from "constructs";
import path = require("path");

export class HostingStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const secret = Secret.fromSecretNameV2(this, "Secret", "WIKIDEMO");

    const CERT_ARN = secret
      .secretValueFromJson("CERT_ARN")
      .unsafeUnwrap()
      .toString();
    const DOMAIN = secret
      .secretValueFromJson("DOMAIN")
      .unsafeUnwrap()
      .toString();

    const websiteBucket = new Bucket(this, "WebsiteBucket", {
      blockPublicAccess: BlockPublicAccess.BLOCK_ALL,
      publicReadAccess: false,
      removalPolicy: RemovalPolicy.DESTROY,
    });

    const lambdaAtEdgeFunction = new experimental.EdgeFunction(
      this,
      "LambdaAtEdgeFunction",
      {
        runtime: Runtime.NODEJS_LATEST,
        handler: "app.handler",
        code: Code.fromAsset(
          path.join(__dirname, "../assets/lambda/originRequestLambdaAtEdge/")
        ),
      }
    );

    const distribution = new Distribution(this, `WikiDistribution`, {
      defaultBehavior: {
        allowedMethods: AllowedMethods.ALLOW_GET_HEAD_OPTIONS,
        compress: true,
        origin: new S3Origin(websiteBucket),
        viewerProtocolPolicy: ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        edgeLambdas: [
          {
            functionVersion: lambdaAtEdgeFunction.currentVersion,
            eventType: LambdaEdgeEventType.ORIGIN_REQUEST,
          },
        ],
      },
      defaultRootObject: "index.html",
      errorResponses: [
        {
          httpStatus: 404,
          responseHttpStatus: 404,
          responsePagePath: "/404/index.html",
          ttl: Duration.minutes(30),
        },
        {
          httpStatus: 500,
          responseHttpStatus: 500,
          responsePagePath: "/500/index.html",
          ttl: Duration.minutes(30),
        },
      ],
      minimumProtocolVersion: SecurityPolicyProtocol.TLS_V1_2_2019,
      certificate: CERT_ARN
        ? Certificate.fromCertificateArn(this, "SSLCertificate", CERT_ARN)
        : undefined,
      domainNames: CERT_ARN && DOMAIN ? [DOMAIN] : undefined,
    });

    new BucketDeployment(this, "DeployWebsite", {
      sources: [Source.asset("./src/.next/out")],
      destinationBucket: websiteBucket,
      distribution,
      distributionPaths: ["/*"],
    });

    // This will not synth locally, so it'll be a manual step for now
    // new ARecord(this, "AliasRecord", {
    //   zone: HostedZone.fromLookup(this, "HostedZone", {
    //     domainName: DOMAIN,
    //   }),
    //   target: RecordTarget.fromAlias(new CloudFrontTarget(distribution)),
    //   recordName: DOMAIN,
    // });
  }
}
