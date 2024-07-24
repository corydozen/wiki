import { StackProps, Stage } from "aws-cdk-lib";
import { Construct } from "constructs";
import { HostingStack } from "./hosting";

export class HostingStage extends Stage {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    new HostingStack(this, "HostingStack");
  }
}
