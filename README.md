
# Docker Compose Manager

A full-stack web application to manage Docker containers defined in multiple docker-compose.yml files across different client folders.

## Features

- 📁 Dynamically loads client folders and their docker-compose.yml files
- 🔍 Displays services, images, ports, and container statuses
- 🚀 Start, stop, and fetch Docker containers with one click
- 🔄 Real-time status updates
- 🧩 Clean, intuitive UI with tab-based navigation

## Project Structure

```
.
├── files/           # Client folders with docker-compose.yml files
│   ├── client1/
│   │   └── docker-compose.yml
│   ├── client2/
│   │   └── docker-compose.yml
│   └── ...
├── src/
│   ├── components/  # React components
│   ├── server/      # Express.js backend
│   ├── services/    # API services
│   └── types/       # TypeScript type definitions
└── ...
```

## Getting Started

1. **Clone the repository**

```bash
git clone <repository-url>
cd docker-compose-manager
```

2. **Install dependencies**

```bash
npm install
```

3. **Create the files directory structure**

Create a `files` directory in the root of the project and add client subdirectories with docker-compose.yml files:

```bash
mkdir -p files/client1
mkdir -p files/client2
# Add docker-compose.yml files to each client directory
```

4. **Start the backend server**

```bash
node src/server/startServer.js
```

5. **Start the frontend development server**

```bash
npm run dev
```

6. **Access the application**

Open your browser and navigate to [http://localhost:8080](http://localhost:8080)

## Requirements

- Node.js 18+
- Docker Engine running on the host machine

## License

MIT
