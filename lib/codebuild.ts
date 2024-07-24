import * as cdk from "aws-cdk-lib";
import {
  CodePipeline,
  CodePipelineSource,
  ShellStep,
} from "aws-cdk-lib/pipelines";
import { Construct } from "constructs";
import { HostingStage } from "./hosting-stage";

export class Codebuild extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const REPO_OWNER = "murribu";
    const REPO = "wiki";
    const CONNECTION_ARN = `arn:aws:codestar-connections:us-east-1:${this.account}:connection/26f04c1c-348b-433a-9156-3bf04922e21c`;

    const pipeline = new CodePipeline(this, "WikiPipeline", {
      synth: new ShellStep("Synth", {
        input: CodePipelineSource.connection(`${REPO_OWNER}/${REPO}`, "main", {
          connectionArn: CONNECTION_ARN,
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
