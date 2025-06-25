import React, { useState } from "react";

function App() {
  const [loading, setLoading] = useState(false);
  const [usedMachines, setUsedMachines] = useState([]);
  const [statusMessage, setStatusMessage] = useState("");

  const handleClick = async () => {
    setLoading(true);
    setStatusMessage("Checking for available machine...");

    try {
      const response = await fetch("http://localhost:9092/myproject");
      const data = await response.json();

      if (data.status === "starting") {
        setStatusMessage("No idle machine. Starting a new one, please wait...");
        setLoading(false);
        return;
      }

      const machineUrl = data.url;
      const instanceId = data.instanceId;

      
      if (usedMachines.some((m) => m.instanceId === instanceId)) {
        setStatusMessage("This machine was already used. Try again shortly.");
        setLoading(false);
        return;
      }

     
      const tab = window.open(machineUrl, "_blank");
      setUsedMachines((prev) => [...prev, { instanceId, url: machineUrl }]);
      setStatusMessage(`Machine launched at ${machineUrl}`);

      
      const interval = setInterval(() => {
        if (tab.closed) {
          clearInterval(interval);
          setStatusMessage(`Tab closed. Machine will terminate in 30 seconds...`);

          setTimeout(() => {
            fetch("http://localhost:9092/destroy", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({ machineId: instanceId }),
            })
              .then(() => {
                setStatusMessage("Machine terminated.");
              })
              .catch((err) => {
                console.error("Error terminating machine:", err);
                setStatusMessage("Error while terminating machine.");
              });
          }, 30000); 
        }
      }, 2000);
    } catch (error) {
      console.error("Error:", error);
      setStatusMessage("Something went wrong!");
    }

    setLoading(false);
  };

  return (
    <div style={{ padding: 40, fontFamily: "sans-serif", textAlign: "center" }}>
      <h1>Launch Your Browser VS Code</h1>
      <button
        onClick={handleClick}
        disabled={loading}
        style={{
          padding: "10px 20px",
          fontSize: "18px",
          cursor: "pointer",
          backgroundColor: "#4CAF50",
          color: "#fff",
          border: "none",
          borderRadius: "5px",
        }}
      >
        {loading ? "Please wait..." : "Launch VS Code"}
      </button>
      <p style={{ marginTop: "20px", color: "#333" }}>{statusMessage}</p>
    </div>
  );
}

export default App;
