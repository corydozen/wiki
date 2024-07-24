import * as cdk from "aws-cdk-lib";
import {
  CodePipeline,
  CodePipelineSource,
  ShellStep,
} from "aws-cdk-lib/pipelines";
import { Construct } from "constructs";
import { HostingStage } from "./hosting-stage";
import { CONNECTION_ARN_UUID, REPO, REPO_OWNER } from "./constants";

export class Codebuild extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const CONNECTION_ARN = `arn:aws:codestar-connections:us-east-1:${this.account}:connection/${CONNECTION_ARN_UUID}`;

    const pipeline = new CodePipeline(this, "WikiPipeline", {
      synth: new ShellStep("Synth", {
        input: CodePipelineSource.connection(`${REPO_OWNER}/${REPO}`, "main", {
          connectionArn: CONNECTION_ARN,
          triggerOnPush: true,
        }),
        commands: [
          "npm ci",
          "cd src",
          "npx dendron publish export",
          "cd ..",
          "npm run build",
          "npx cdk synth",
        ],
      }),
    });

    const hostingStage = new HostingStage(this, "HostingStage", {
      env: { region: "us-east-1" },
    });

    pipeline.addStage(hostingStage);
  }
}
