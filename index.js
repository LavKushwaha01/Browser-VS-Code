import express from "express";
import 'dotenv/config';
import cors from "cors";

import {
  AutoScalingClient,
  SetDesiredCapacityCommand,
  DescribeAutoScalingInstancesCommand,
  TerminateInstanceInAutoScalingGroupCommand,
} from "@aws-sdk/client-auto-scaling";

import {
  EC2Client,
  DescribeInstancesCommand
} from "@aws-sdk/client-ec2";

const app = express();
app.use(express.json());
app.use(cors());

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

let ALL_MACHINES = [];
const TERMINATE_TIMEOUTS = {}; // tab close ke baad 10 sec ke liye track karne ke liye

async function refershInstances() {
  try {
    const autoScalingData = await client.send(new DescribeAutoScalingInstancesCommand());
    const instanceIds = autoScalingData.AutoScalingInstances?.map(x => x.InstanceId).filter(Boolean);

    if (!instanceIds || instanceIds.length === 0) return;

    const ec2Response = await ec2Client.send(
      new DescribeInstancesCommand({ InstanceIds: instanceIds })
    );

    const updatedMachines = [];

    ec2Response.Reservations.forEach((reservation) => {
      reservation.Instances.forEach((instance) => {
        if (instance.PublicIpAddress) {
          const oldMachine = ALL_MACHINES.find(m => m.instanceId === instance.InstanceId);
          updatedMachines.push({
            instanceId: instance.InstanceId,
            ip: instance.PublicIpAddress,
            isUsed: oldMachine?.isUsed || false
          });
        }
      });
    });

    ALL_MACHINES = updatedMachines;
    console.log("Machines refreshed:", ALL_MACHINES);
  } catch (err) {
    console.error(" Error refreshing instances:", err);
  }
}

refershInstances();
setInterval(refershInstances, 10000); 

app.get("/:projectId", async (req, res) => {
  const idleMachine = ALL_MACHINES.find(x => x.isUsed === false);

  if (!idleMachine) {
    // koi idle machine nahi hai, naya machine start karna padega
    const newDesiredCapacity = ALL_MACHINES.length + 1;
    await client.send(new SetDesiredCapacityCommand({
      AutoScalingGroupName: "vs-code-asg",
      DesiredCapacity: newDesiredCapacity,
    }));

    return res.status(200).json({
      status: "starting"
    });
  }

  idleMachine.isUsed = true;

  // cheak kre ki agar idle machines ki count 1 se kam hai, to desired capacity increase kre
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

app.post("/destroy", async (req, res) => {
  const machineId = req.body.machineId;

  if (!machineId) {
    return res.status(400).json({ error: "machineId is required" });
  }

  
  if (TERMINATE_TIMEOUTS[machineId]) {
    clearTimeout(TERMINATE_TIMEOUTS[machineId]);
  }

  TERMINATE_TIMEOUTS[machineId] = setTimeout(async () => {
    try {
      await client.send(new TerminateInstanceInAutoScalingGroupCommand({
        InstanceId: machineId,
        ShouldDecrementDesiredCapacity: true,
      }));

      ALL_MACHINES = ALL_MACHINES.filter(m => m.instanceId !== machineId);
      delete TERMINATE_TIMEOUTS[machineId];

      console.log(` Machine ${machineId} terminated after tab close.`);
    } catch (err) {
      console.error(` Error terminating machine ${machineId}:`, err);
    }
  }, 10000); // 10 sec delay termination ke liye

  return res.json({ message: "Machine will be terminated in 10 seconds." });
});

app.listen(9092, '0.0.0.0', () => {
  console.log(" Server running on port 9092");
});
