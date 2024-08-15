#!/usr/bin/env node
import { App } from "aws-cdk-lib";
import "source-map-support/register";
import { Codebuild } from "../lib/codebuild";
import { HostingStack } from "../lib/hosting";

const region = "us-east-1";

const app = new App();

new Codebuild(app, "WikiCodebuildStack", { env: { region } });
new HostingStack(app, "WikiHostingStack", { env: { region } });
