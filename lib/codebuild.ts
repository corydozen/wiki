import { Stack, StackProps } from "aws-cdk-lib";
import {
  BuildSpec,
  LinuxBuildImage,
  PipelineProject,
} from "aws-cdk-lib/aws-codebuild";
import {
  Artifact,
  CfnPipeline,
  ExecutionMode,
  Pipeline,
  PipelineType,
} from "aws-cdk-lib/aws-codepipeline";
import {
  CodeBuildAction,
  CodeStarConnectionsSourceAction,
} from "aws-cdk-lib/aws-codepipeline-actions";
import { PolicyStatement } from "aws-cdk-lib/aws-iam";
import { Construct } from "constructs";
import { config } from "../config";

const { repo, connectionArn, repoOwner } = config;

const actionName = "GitHub";

export class Codebuild extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const pipeline = new Pipeline(this, "WikiDemoPipeline", {
      pipelineName: "WikiDemoPipeline",
      pipelineType: PipelineType.V2,
      executionMode: ExecutionMode.QUEUED,
    });

    const artifact = new Artifact();

    const cfnPipeline = pipeline.node.defaultChild as CfnPipeline;

    cfnPipeline.addPropertyOverride("Triggers", [
      {
        GitConfiguration: {
          Push: [
            {
              Branches: {
                Includes: ["main"],
              },
              FilePaths: {
                Includes: ["src/**"],
              },
            },
          ],
          SourceActionName: actionName,
        },
        ProviderType: "CodeStarSourceConnection",
      },
    ]);

    pipeline.addStage({
      stageName: "Source",
      actions: [
        new CodeStarConnectionsSourceAction({
          actionName,
          owner: repoOwner,
          repo,
          output: artifact,
          connectionArn,
          branch: "main",
        }),
      ],
    });

    const project = new PipelineProject(this, "BuildProject", {
      buildSpec: BuildSpec.fromSourceFilename("buildspec.yml"),
      environment: {
        buildImage: LinuxBuildImage.STANDARD_7_0,
      },
    });

    project.role?.addToPrincipalPolicy(
      new PolicyStatement({
        actions: [
          "secretsmanager:GetSecretValue",
          "cloudfront:*",
          "s3:*",
          "acm:GetAccountConfiguration",
          "acm:DescribeCertificate",
          "acm:GetCertificate",
          "acm:ListCertificates",
          "acm:ListTagsForCertificate",
          "ssm:GetParameter",
          "cloudformation:*",
          "iam:PassRole",
        ],
        resources: ["*"],
      })
    );

    const action = new CodeBuildAction({
      actionName: "Build",
      project,
      input: artifact,
    });

    pipeline.addStage({
      stageName: "Build",
      actions: [action],
    });
  }
}
