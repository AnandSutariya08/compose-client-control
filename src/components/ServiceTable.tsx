
import React from "react";
import { DockerService } from "@/types/docker";
import StatusBadge from "./StatusBadge";
import { Button } from "./ui/button";
import { apiClient } from "@/services/api";
import { RefreshCw } from "lucide-react";

interface ServiceTableProps {
  clientName: string;
  services: DockerService[];
  onServiceUpdate: () => void;
  isLoading: boolean;
}

const ServiceTable: React.FC<ServiceTableProps> = ({ clientName, services, onServiceUpdate, isLoading }) => {
  const [loadingService, setLoadingService] = React.useState<string | null>(null);

  const handleAction = async (service: DockerService) => {
    setLoadingService(service.name);
    try {
      if (service.status === "running") {
        await apiClient.stopContainer(clientName, service.name);
      } else if (service.status === "stopped") {
        await apiClient.startContainer(clientName, service.name);
      } else if (service.status === "missing") {
        await apiClient.fetchImage(clientName, service.name);
      }
      onServiceUpdate();
    } catch (error) {
      console.error("Action error:", error);
    } finally {
      setLoadingService(null);
    }
  };

  const getActionButton = (service: DockerService) => {
    const isLoading = loadingService === service.name;
    
    if (service.status === "running") {
      return (
        <Button
          variant="destructive"
          size="sm"
          onClick={() => handleAction(service)}
          disabled={isLoading}
        >
          {isLoading ? "Stopping..." : "Stop"}
        </Button>
      );
    } else if (service.status === "stopped") {
      return (
        <Button
          variant="default"
          size="sm"
          className="bg-docker-green hover:bg-docker-green/90"
          onClick={() => handleAction(service)}
          disabled={isLoading}
        >
          {isLoading ? "Starting..." : "Start"}
        </Button>
      );
    } else if (service.status === "missing") {
      return (
        <Button
          variant="outline"
          size="sm"
          className="border-docker-blue text-docker-blue hover:bg-docker-lightBlue"
          onClick={() => handleAction(service)}
          disabled={isLoading}
        >
          {isLoading ? "Fetching..." : "Fetch"}
        </Button>
      );
    }
    
    return null;
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <RefreshCw className="animate-spin-slow text-docker-blue w-10 h-10" />
        <span className="ml-2 text-lg">Loading services...</span>
      </div>
    );
  }

  if (!services.length) {
    return (
      <div className="text-center py-10">
        <p className="text-lg text-gray-500">No services found for this client.</p>
        <p className="text-sm text-gray-400">Make sure you have a valid docker-compose.yml file.</p>
      </div>
    );
  }

  return (
    <div className="rounded-md border animate-fade-in">
      <div className="overflow-hidden overflow-x-auto">
        <table className="w-full min-w-full divide-y">
          <thead className="bg-muted/50">
            <tr>
              <th className="px-4 py-3.5 text-left text-sm font-medium text-gray-700">Service</th>
              <th className="px-4 py-3.5 text-left text-sm font-medium text-gray-700">Image</th>
              <th className="px-4 py-3.5 text-left text-sm font-medium text-gray-700">Ports</th>
              <th className="px-4 py-3.5 text-left text-sm font-medium text-gray-700">Status</th>
              <th className="px-4 py-3.5 text-right text-sm font-medium text-gray-700">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {services.map((service) => (
              <tr key={service.name} className="hover:bg-muted/20">
                <td className="px-4 py-4 whitespace-nowrap text-sm font-medium">{service.name}</td>
                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-600 font-mono">{service.image}</td>
                <td className="px-4 py-4 whitespace-nowrap text-sm">
                  {service.ports.length > 0 ? (
                    <div className="flex flex-wrap gap-1">
                      {service.ports.map((port, index) => (
                        <span key={index} className="bg-muted px-2 py-0.5 rounded text-xs">
                          {port}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <span className="text-gray-400 text-xs">No ports</span>
                  )}
                </td>
                <td className="px-4 py-4 whitespace-nowrap">
                  <StatusBadge status={service.status} />
                </td>
                <td className="px-4 py-4 whitespace-nowrap text-right">
                  {getActionButton(service)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ServiceTable;
