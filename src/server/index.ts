
import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import yaml from 'js-yaml';
import Docker from 'dockerode';

const app = express();
const PORT = 3001;
const FILES_DIR = path.resolve(process.cwd(), 'files');

// Create Docker instance
const docker = new Docker();

// Middleware
app.use(cors());
app.use(express.json());

// Types
interface DockerService {
  name: string;
  image: string;
  ports: string[];
  status: 'running' | 'stopped' | 'missing';
}

interface ClientFolder {
  name: string;
  services: DockerService[];
}

// Utility functions
const getClientFolders = async (): Promise<string[]> => {
  try {
    // Create the files directory if it doesn't exist
    if (!fs.existsSync(FILES_DIR)) {
      fs.mkdirSync(FILES_DIR, { recursive: true });
      console.log(`Created files directory at ${FILES_DIR}`);
      return [];
    }
    
    const entries = await fs.promises.readdir(FILES_DIR, { withFileTypes: true });
    return entries
      .filter(entry => entry.isDirectory())
      .map(dir => dir.name);
  } catch (error) {
    console.error('Error reading client folders:', error);
    return [];
  }
};

const parseDockerComposeFile = async (clientName: string) => {
  const composeFilePath = path.join(FILES_DIR, clientName, 'docker-compose.yml');
  
  try {
    // Check if file exists
    if (!fs.existsSync(composeFilePath)) {
      console.log(`No docker-compose.yml found for ${clientName}`);
      return null;
    }

    // Read and parse docker-compose.yml
    const fileContent = await fs.promises.readFile(composeFilePath, 'utf8');
    const composeData = yaml.load(fileContent) as any;
    
    if (!composeData || !composeData.services) {
      console.log(`Invalid docker-compose.yml for ${clientName}`);
      return null;
    }
    
    return composeData;
  } catch (error) {
    console.error(`Error parsing docker-compose.yml for ${clientName}:`, error);
    return null;
  }
};

const getContainerStatus = async (imageName: string, serviceName: string): Promise<'running' | 'stopped' | 'missing'> => {
  try {
    // Check if image exists
    const images = await docker.listImages();
    const imageExists = images.some(img => 
      img.RepoTags && 
      img.RepoTags.some(tag => tag === imageName || tag.startsWith(`${imageName}:`))
    );
    
    if (!imageExists) {
      return 'missing';
    }
    
    // Check if container is running
    const containers = await docker.listContainers({ all: true });
    const container = containers.find(c => 
      c.Names && 
      c.Names.some(name => name === `/${serviceName}` || name.endsWith(`_${serviceName}`))
    );
    
    if (!container) {
      return 'stopped';
    }
    
    return container.State === 'running' ? 'running' : 'stopped';
  } catch (error) {
    console.error('Error checking container status:', error);
    return 'missing'; // Default to missing on error
  }
};

const formatPorts = (portsConfig: any): string[] => {
  if (!portsConfig) return [];
  
  // Handle different formats of ports in docker-compose
  if (Array.isArray(portsConfig)) {
    return portsConfig.map(port => {
      if (typeof port === 'string') {
        return port;
      } else if (typeof port === 'object' && port.published && port.target) {
        return `${port.published}:${port.target}`;
      }
      return String(port);
    });
  }
  
  return [];
};

const getServicesForClient = async (clientName: string): Promise<DockerService[]> => {
  const composeData = await parseDockerComposeFile(clientName);
  
  if (!composeData || !composeData.services) {
    return [];
  }
  
  const services = [];
  
  for (const [serviceName, config] of Object.entries<any>(composeData.services)) {
    if (!config.image) {
      console.log(`No image specified for service ${serviceName}`);
      continue;
    }

    const status = await getContainerStatus(config.image, serviceName);
    
    services.push({
      name: serviceName,
      image: config.image,
      ports: formatPorts(config.ports),
      status
    });
  }
  
  return services;
};

// API Routes
app.get('/api/clients', async (req, res) => {
  try {
    const clientFolders = await getClientFolders();
    const clients: ClientFolder[] = [];
    
    for (const clientName of clientFolders) {
      const services = await getServicesForClient(clientName);
      
      if (services.length > 0) {
        clients.push({
          name: clientName,
          services
        });
      }
    }
    
    res.json(clients);
  } catch (error) {
    console.error('Error getting clients:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch clients' });
  }
});

app.get('/api/clients/:clientName', async (req, res) => {
  try {
    const { clientName } = req.params;
    const services = await getServicesForClient(clientName);
    
    res.json(services);
  } catch (error) {
    console.error(`Error getting services for client ${req.params.clientName}:`, error);
    res.status(500).json({ 
      success: false, 
      error: `Failed to fetch services for ${req.params.clientName}` 
    });
  }
});

app.post('/api/clients/:clientName/refresh', async (req, res) => {
  try {
    const { clientName } = req.params;
    const services = await getServicesForClient(clientName);
    
    res.json(services);
  } catch (error) {
    console.error(`Error refreshing client ${req.params.clientName}:`, error);
    res.status(500).json({ 
      success: false, 
      error: `Failed to refresh ${req.params.clientName}` 
    });
  }
});

app.post('/api/clients/:clientName/services/:serviceName/start', async (req, res) => {
  const { clientName, serviceName } = req.params;
  
  try {
    const composeData = await parseDockerComposeFile(clientName);
    
    if (!composeData || !composeData.services || !composeData.services[serviceName]) {
      return res.status(404).json({ 
        success: false, 
        error: `Service ${serviceName} not found in ${clientName}` 
      });
    }
    
    const serviceConfig = composeData.services[serviceName];
    
    // Create and start the container
    const container = await docker.createContainer({
      Image: serviceConfig.image,
      name: serviceName,
      ExposedPorts: formatPorts(serviceConfig.ports).reduce((acc, port) => {
        const [hostPort, containerPort = hostPort] = port.split(':');
        acc[`${containerPort}/tcp`] = {};
        return acc;
      }, {} as Record<string, {}>),
      HostConfig: {
        PortBindings: formatPorts(serviceConfig.ports).reduce((acc, port) => {
          const [hostPort, containerPort = hostPort] = port.split(':');
          acc[`${containerPort}/tcp`] = [{ HostPort: hostPort }];
          return acc;
        }, {} as Record<string, { HostPort: string }[]>)
      }
    });
    
    await container.start();
    
    res.json({
      name: serviceName,
      action: 'start',
      success: true,
      message: `Container ${serviceName} started successfully`
    });
  } catch (error) {
    console.error(`Error starting container ${serviceName}:`, error);
    res.status(500).json({ 
      success: false, 
      error: `Failed to start ${serviceName}: ${error instanceof Error ? error.message : 'Unknown error'}` 
    });
  }
});

app.post('/api/clients/:clientName/services/:serviceName/stop', async (req, res) => {
  const { serviceName } = req.params;
  
  try {
    // Find the container by name
    const containers = await docker.listContainers({ all: true });
    const containerInfo = containers.find(c => 
      c.Names && 
      c.Names.some(name => name === `/${serviceName}` || name.endsWith(`_${serviceName}`))
    );
    
    if (!containerInfo) {
      return res.status(404).json({ 
        success: false, 
        error: `Container for service ${serviceName} not found` 
      });
    }
    
    const container = docker.getContainer(containerInfo.Id);
    await container.stop();
    
    res.json({
      name: serviceName,
      action: 'stop',
      success: true,
      message: `Container ${serviceName} stopped successfully`
    });
  } catch (error) {
    console.error(`Error stopping container ${serviceName}:`, error);
    res.status(500).json({ 
      success: false, 
      error: `Failed to stop ${serviceName}: ${error instanceof Error ? error.message : 'Unknown error'}` 
    });
  }
});

app.post('/api/clients/:clientName/services/:serviceName/fetch', async (req, res) => {
  const { clientName, serviceName } = req.params;
  
  try {
    const composeData = await parseDockerComposeFile(clientName);
    
    if (!composeData || !composeData.services || !composeData.services[serviceName]) {
      return res.status(404).json({ 
        success: false, 
        error: `Service ${serviceName} not found in ${clientName}` 
      });
    }
    
    const serviceConfig = composeData.services[serviceName];
    
    // Pull the image
    const stream = await docker.pull(serviceConfig.image);
    
    // Wait for the pull to complete
    await new Promise((resolve, reject) => {
      docker.modem.followProgress(stream, (err: any, output: any) => {
        if (err) {
          reject(err);
        } else {
          resolve(output);
        }
      });
    });
    
    res.json({
      name: serviceName,
      action: 'fetch',
      success: true,
      message: `Image for ${serviceName} fetched successfully`
    });
  } catch (error) {
    console.error(`Error fetching image for ${serviceName}:`, error);
    res.status(500).json({ 
      success: false, 
      error: `Failed to fetch image for ${serviceName}: ${error instanceof Error ? error.message : 'Unknown error'}` 
    });
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`Monitoring Docker Compose files in ${FILES_DIR}`);
});
