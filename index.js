const core = require("@actions/core");
const github = require("@actions/github");
const aws = require("aws-sdk");

async function getStack(stackNameOrId) {
  try {
    const cf = new aws.CloudFormation();
    const stacks = await cf
      .describeStacks({
        StackName: stackNameOrId,
      })
      .promise();
    return stacks.Stacks && stacks.Stacks[0];
  } catch (e) {
    if (e.code === "ValidationError" && e.message.match(/does not exist/)) {
      return undefined;
    }
    throw e;
  }
}

async function run() {
  try {
    const name = core.getInput("name");
    const stack = await getStack(name);

    core.setOutput("name", name);
    if (stack && stack.Outputs) {
      for (const output of stack.Outputs) {
        if (output.OutputKey && output.OutputValue) {
          core.setOutput(output.OutputKey, output.OutputValue);
        }
      }
    }

    // Get the JSON webhook payload for the event that triggered the workflow
    const payload = JSON.stringify(github.context.payload, undefined, 2);
    console.log(`The event payload: ${payload}`);
  } catch (error) {
    core.setFailed(error.message);
  }
}

module.exports = run;

/* istanbul ignore next */
if (require.main === module) {
  run();
}
