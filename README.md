# Browser VS Code Launcher 🌐

This project lets you launch a cloud-hosted version of VS Code (`code-server`) in your browser with one click, using an AWS Auto Scaling Group (ASG) to manage EC2 instances efficiently.

> ⚡ **Each user gets a separate VS Code machine**, which increases **data isolation**, improves **security**, and ensures **true scalability** for large teams or multiple sessions.

> 💡 Performance Optimization:

- We always keep one backup VS Code engine running at all times.
  This ensures new users can instantly access the IDE without waiting for a machine to boot up.
- After a user closes the VS Code tab, their machine is automatically terminated after 30 seconds.
  This helps in reducing AWS billing costs and ensures efficient resource usage.


---

## 🔧 Technologies Used

- **Docker** – Containerized VS Code (`code-server`)
- **AWS EC2 + Auto Scaling Group** – Scalable instance management
- **GitHub Actions** – Continuous deployment on every push
- **Node.js + Express (optional)** – Backend API logic
- **HTML/CSS/JavaScript** – Lightweight frontend
- **Cloud-Init (UserData)** – Auto-starting `code-server` on EC2 boot

## 🚀 What It Does

- Instantly launches a browser-based VS Code tab.
- Uses AWS Auto Scaling Group to create/destroy EC2 instances.
- Shows a "Please wait" screen if no instances are ready.
- Automatically shuts down unused machines after the tab is closed (with a short delay).
- Saves cloud cost by running instances only when needed.

---

## ⚙️ How It Works

1. User clicks "Launch VS Code" button.
2. The backend checks if a running EC2 instance is ready.
3. If none is available, the app waits until one is created by the Auto Scaling Group.
4. Once ready, it opens `code-server` (VS Code in browser) in a new tab.
5. When the tab is closed, the instance is scheduled to terminate after 30 seconds.

---### 🐳 Dockerfile

Your `Dockerfile` builds a frontend container that runs a static site to trigger VS Code launches:

```dockerfile
FROM nginx:alpine
COPY ./build /usr/share/nginx/html
EXPOSE 80
```



## 🛠️ Getting Started

1. **Clone the repository**

   ```bash
   git clone https://github.com/LavKushwaha01/Browser-VS-Code.git
   cd Browser-VS-Code
   Install dependencies

2. **Install dependencies**
   ```bash
   npm install
   
3. **Configure AWS CLI**
   ```bash
   aws configure
   

4. **Create and configure your Auto Scaling Group**
 -  Create and configure your Auto Scaling Group
 -  Make sure your Launch Template uses an AMI with code-server pre-installed.
 -  Open port 8080 in your Security Group (or whichever your code-server uses).
 -  Health check should wait for code-server to become available

**CI/CD Setup (GitHub Actions)**
-  This project includes a GitHub Actions workflow for deploying your frontend using Docker.
    Important:
- Replace the http://13.233.249.83:8080 URL in .github/workflows/cd_frontend.yml with your own public IP or DNS of your EC2 machine running code-server.

Example:
```bash      - name: Deploy to Server
                run: |
                      curl http://<your-public-ip>:8080
```

## ⚙️ GitHub Actions CI/CD (`cd_frontend.yml`)

This project includes a GitHub Actions workflow to deploy your frontend Docker image **automatically** when you push to the `main` branch.

### 🔄 What Happens on Push

1. ✅ Your repository code is **checked out**.
2. 🐳 A **Docker image is built** from your frontend files.
3. 📦 The image is **pushed to Docker Hub**.
4. 🌐 A **`curl` command triggers a refresh** on your live server by calling its IP address.

> ⚠️ **Note:** Make sure to update the hardcoded IP (`http://13.233.249.83:8080`) in `.github/workflows/cd_frontend.yml` to your **own public IP or domain name**.

Example:

```yml
      - name: Deploy to Server
        run: |
          curl http://<your-public-ip>:8080
```


> Built with ❤️ by Lav



