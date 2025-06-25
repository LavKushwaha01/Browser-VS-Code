import express from "express";
import 'dotenv/config';

import {
  AutoScalingClient,
  SetDesiredCapacityCommand,
  DescribeAutoScalingInstancesCommand,
  TerminateInstanceInAutoScalingGroupCommand,
} from "@aws-sdk/client-auto-scaling";

import { EC2Client, DescribeInstancesCommand } from "@aws-sdk/client-ec2";

const app = express();
app.use(express.json());

// AWS Clients
const client = new AutoScalingClient({
  region: "ap-south-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY,
    secretAccessKey: process.env.AWS_ACCESS_SECRET,
  },
});

const ec2Client = new EC2Client({
  region: "ap-south-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY,
    secretAccessKey: process.env.AWS_ACCESS_SECRET,
  },
});

// Track machine list
const ALL_MACHINES = [];

/** Refresh EC2 instances and update ALL_MACHINES */
async function refershInstances() {
  try {
    const autoScalingData = await client.send(new DescribeAutoScalingInstancesCommand());
    const instanceIds = autoScalingData.AutoScalingInstances?.map(x => x.InstanceId).filter(Boolean);

    if (!instanceIds || instanceIds.length === 0) return;

    const ec2Response = await ec2Client.send(
      new DescribeInstancesCommand({ InstanceIds: instanceIds })
    );

    ALL_MACHINES.length = 0; // clear old

    ec2Response.Reservations.forEach((reservation) => {
      reservation.Instances.forEach((instance) => {
        const publicIp = instance.PublicIpAddress;
        if (publicIp) {
          ALL_MACHINES.push({
            instanceId: instance.InstanceId,
            ip: publicIp,
            isUsed: false,
          });
        }
      });
    });

    console.log("Machines refreshed:", ALL_MACHINES);
  } catch (err) {
    console.error("Error refreshing instances:", err);
  }
}

// Initial load
refershInstances();
setInterval(refershInstances, 10000); // every 10s

/** Assign idle machine to a project */
app.get("/:projectId", async (req, res) => {
  const idleMachine = ALL_MACHINES.find(x => x.isUsed === false);

  if (!idleMachine) {
    // Scale up
    const newDesiredCapacity = ALL_MACHINES.length + 1;
    await client.send(new SetDesiredCapacityCommand({
      AutoScalingGroupName: "vs-code-asg",
      DesiredCapacity: newDesiredCapacity,
    }));

    return res.status(503).json({
      message: "No idle machine available. Scaling up...",
    });
  }

  // Mark machine busy
  idleMachine.isUsed = true;

  // Optional: scale preemptively
  const unusedCount = ALL_MACHINES.filter(x => !x.isUsed).length;
  if (unusedCount <= 1) {
    await client.send(new SetDesiredCapacityCommand({
      AutoScalingGroupName: "vs-code-asg",
      DesiredCapacity: ALL_MACHINES.length + 1,
    }));
  }

  return res.json({
    url: `http://${idleMachine.ip}:8080`,
    instanceId: idleMachine.instanceId
  });
});

/** Terminate machine manually */
app.post("/destroy", async (req, res) => {
  const machineId = req.body.machineId;

  await client.send(new TerminateInstanceInAutoScalingGroupCommand({
    InstanceId: machineId,
    ShouldDecrementDesiredCapacity: true,
  }));

  return res.json({ message: "Machine termination started." });
});

// Start server
app.listen(9092, '0.0.0.0', () => {
  console.log("🚀 Server running on port 9092");
});
