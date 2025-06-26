# Browser VS Code Launcher 🌐

Launch a cloud-hosted version of VS Code (`code-server`) in your browser with one click, powered by AWS Auto Scaling Groups for efficient and scalable instance management.

> ⚡ **Each user gets a separate VS Code machine**, ensuring **data isolation**, improved **security**, and **true scalability** for large teams or multiple sessions.

---

## 🌟 Features

- **Instant-on:** Always keeps one backup VS Code engine running, so users never wait for a cold start.
- **Cost-efficient:** Unused instances are terminated 30 seconds after a user closes their VS Code tab.
- **Fully scalable:** AWS Auto Scaling Group handles automatic creation and destruction of EC2 instances.
- **Security:** Each user runs in their own isolated environment.

---

## 🔧 Technologies Used

- **Docker** – Containerized VS Code (`code-server`)
- **AWS EC2 + Auto Scaling Group** – Scalable instance management
- **GitHub Actions** – Continuous deployment on every push
- **Node.js + Express (optional)** – Backend API logic
- **HTML/CSS/JavaScript** – Lightweight frontend
- **Cloud-Init (UserData)** – Auto-starts `code-server` on EC2 boot

---

## 🚀 What It Does

- Instantly launches a browser-based VS Code tab.
- Uses AWS Auto Scaling Group to create/destroy EC2 instances.
- Shows a "Please wait" screen if no instances are ready.
- Automatically shuts down unused machines after the tab is closed (with a short delay).
- Saves cloud cost by running instances only when needed.

---

## 🛠️ Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/LavKushwaha01/Browser-VS-Code.git
cd Browser-VS-Code
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure AWS CLI

```bash
aws configure
```

### 4. Create and configure your Auto Scaling Group

- Create and configure your Auto Scaling Group in AWS.
- Use a Launch Template with an AMI that has `code-server` pre-installed.
- Open port 8080 (or your chosen `code-server` port) in your Security Group.
- Set health checks to wait for `code-server` to become available.

---

## 🐳 Dockerfile

Your frontend Dockerfile builds a container that serves a static site to trigger VS Code launches.

[View Dockerfile](./Dockerfile)

```dockerfile
FROM nginx:alpine
COPY ./build /usr/share/nginx/html
EXPOSE 80
```

---

## ⚙️ GitHub Actions CI/CD (`cd_frontend.yml`)

This project includes a GitHub Actions workflow to deploy your frontend Docker image **automatically** when you push to the `main` branch.

### Workflow steps

1. ✅ Repository code is **checked out**
2. 🐳 **Docker image is built** from your frontend files
3. 📦 Image is **pushed to Docker Hub**
4. 🌐 A **`curl` command triggers a refresh** on your live server by calling its IP address

> ⚠️ **Note:**  
> Update the hardcoded IP (`http://13.233.249.83:8080`) in `.github/workflows/cd_frontend.yml` with your **own public IP or domain name**.

Example snippet in your workflow:
```yml
      - name: Deploy to Server
        run: |
          curl http://<your-public-ip>:8080
```
[View GitHub Actions Workflow](.github/workflows/cd_frontend.yml)

---

## 💰 AWS Cost Notice

Running EC2 instances will incur AWS charges. For testing, consider using the AWS Free Tier where possible.

---

## 🙋‍♂️ Contact & Support

Questions or issues?  
Open an [issue](https://github.com/LavKushwaha01/Browser-VS-Code./issues) or reach out via GitHub.

---

> Built with ❤️ by Lav
