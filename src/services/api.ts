
import { ClientFolder, ContainerActionResponse, DockerService } from "../types/docker";
import { toast } from "@/hooks/use-toast";

const API_URL = 'http://localhost:3001/api';

export const apiClient = {
  async getClients(): Promise<ClientFolder[]> {
    try {
      const response = await fetch(`${API_URL}/clients`);
      if (!response.ok) {
        throw new Error('Failed to fetch clients');
      }
      return response.json();
    } catch (error) {
      console.error('Error fetching clients:', error);
      toast({
        title: "Error",
        description: "Failed to fetch client folders",
        variant: "destructive",
      });
      return [];
    }
  },

  async getClientServices(clientName: string): Promise<DockerService[]> {
    try {
      const response = await fetch(`${API_URL}/clients/${clientName}`);
      if (!response.ok) {
        throw new Error(`Failed to fetch services for client ${clientName}`);
      }
      return response.json();
    } catch (error) {
      console.error(`Error fetching services for client ${clientName}:`, error);
      toast({
        title: "Error",
        description: `Failed to fetch services for ${clientName}`,
        variant: "destructive",
      });
      return [];
    }
  },

  async refreshClient(clientName: string): Promise<DockerService[]> {
    try {
      const response = await fetch(`${API_URL}/clients/${clientName}/refresh`, {
        method: 'POST',
      });
      if (!response.ok) {
        throw new Error(`Failed to refresh client ${clientName}`);
      }
      return response.json();
    } catch (error) {
      console.error(`Error refreshing client ${clientName}:`, error);
      toast({
        title: "Error",
        description: `Failed to refresh ${clientName}`,
        variant: "destructive",
      });
      return [];
    }
  },

  async startContainer(clientName: string, serviceName: string): Promise<ContainerActionResponse> {
    try {
      const response = await fetch(`${API_URL}/clients/${clientName}/services/${serviceName}/start`, {
        method: 'POST',
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || `Failed to start ${serviceName}`);
      }
      
      toast({
        title: "Container Started",
        description: `Successfully started ${serviceName}`,
      });
      
      return result;
    } catch (error) {
      console.error(`Error starting container ${serviceName}:`, error);
      
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : `Failed to start ${serviceName}`,
        variant: "destructive",
      });
      
      return {
        name: serviceName,
        action: 'start',
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  },

  async stopContainer(clientName: string, serviceName: string): Promise<ContainerActionResponse> {
    try {
      const response = await fetch(`${API_URL}/clients/${clientName}/services/${serviceName}/stop`, {
        method: 'POST',
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || `Failed to stop ${serviceName}`);
      }
      
      toast({
        title: "Container Stopped",
        description: `Successfully stopped ${serviceName}`,
      });
      
      return result;
    } catch (error) {
      console.error(`Error stopping container ${serviceName}:`, error);
      
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : `Failed to stop ${serviceName}`,
        variant: "destructive",
      });
      
      return {
        name: serviceName,
        action: 'stop',
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  },

  async fetchImage(clientName: string, serviceName: string): Promise<ContainerActionResponse> {
    try {
      const response = await fetch(`${API_URL}/clients/${clientName}/services/${serviceName}/fetch`, {
        method: 'POST',
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || `Failed to fetch image for ${serviceName}`);
      }
      
      toast({
        title: "Image Fetched",
        description: `Successfully fetched image for ${serviceName}`,
      });
      
      return result;
    } catch (error) {
      console.error(`Error fetching image for ${serviceName}:`, error);
      
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : `Failed to fetch image for ${serviceName}`,
        variant: "destructive",
      });
      
      return {
        name: serviceName,
        action: 'fetch',
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
};
