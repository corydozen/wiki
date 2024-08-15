import * as cdk from "aws-cdk-lib";
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
import { Construct } from "constructs";
import { config } from "../config";

const { repo, connectionArn, repoOwner } = config;

export class Codebuild extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
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

    pipeline.addStage({
      stageName: "Build",
      actions: [
        new CodeBuildAction({
          actionName: "Build",
          project: new PipelineProject(this, "BuildProject", {
            buildSpec: BuildSpec.fromSourceFilename("buildspec.yml"),
            environment: {
              buildImage: LinuxBuildImage.STANDARD_7_0,
            },
          }),
          input: artifact,
        }),
      ],
    });

    // const pipeline = new CodePipeline(this, "WikiPipeline", {
    //   synth: new ShellStep("Synth", {
    //     input: CodePipelineSource.connection(`${REPO_OWNER}/${REPO}`, "main", {
    //       connectionArn: CONNECTION_ARN,
    //       triggerOnPush: true,
    //     }),
    //     commands: [
    //       "npm ci",
    //       "cd src",
    //       "npx dendron publish export",
    //       "cd ..",
    //       "npm run build",
    //       "npx cdk synth",
    //     ],
    //   }),
    // });

    // const hostingStage = new HostingStage(this, "HostingStage", {
    //   env: { region: "us-east-1" },
    // });

    // pipeline.addStage(hostingStage);
  }
}
