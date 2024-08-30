import { Stack, StackProps } from "aws-cdk-lib";
import {
  BuildSpec,
  LinuxBuildImage,
  PipelineProject,
} from "aws-cdk-lib/aws-codebuild";
import { Artifact, Pipeline, PipelineType } from "aws-cdk-lib/aws-codepipeline";
import {
  CodeBuildAction,
  CodeStarConnectionsSourceAction,
} from "aws-cdk-lib/aws-codepipeline-actions";
import { PolicyStatement } from "aws-cdk-lib/aws-iam";
import { Construct } from "constructs";
import { config } from "../config";

const { repo, connectionArn, repoOwner } = config;

export class Codebuild extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const pipeline = new Pipeline(this, "WikiPipeline", {
      pipelineName: "WikiPipeline",
      pipelineType: PipelineType.V2,
    });

    const artifact = new Artifact();

    pipeline.addStage({
      stageName: "Source",
      actions: [
        new CodeStarConnectionsSourceAction({
          actionName: "GitHub",
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
