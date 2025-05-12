
import React, { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { ClientFolder, DockerService } from "@/types/docker";
import ServiceTable from "./ServiceTable";
import { apiClient } from "@/services/api";
import { Button } from "./ui/button";
import { RefreshCw } from "lucide-react";

interface ClientTabsProps {
  clients: ClientFolder[];
  onRefresh: () => void;
  isLoading: boolean;
}

const ClientTabs: React.FC<ClientTabsProps> = ({ clients, onRefresh, isLoading }) => {
  const [activeClient, setActiveClient] = useState<string | null>(null);
  const [clientServices, setClientServices] = useState<DockerService[]>([]);
  const [loadingServices, setLoadingServices] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (clients.length > 0 && !activeClient) {
      setActiveClient(clients[0].name);
    }
  }, [clients, activeClient]);

  useEffect(() => {
    const fetchServices = async () => {
      if (activeClient) {
        setLoadingServices(true);
        try {
          const services = await apiClient.getClientServices(activeClient);
          setClientServices(services);
        } catch (error) {
          console.error("Error fetching services:", error);
          setClientServices([]);
        } finally {
          setLoadingServices(false);
        }
      }
    };

    fetchServices();
  }, [activeClient]);

  const handleTabChange = (value: string) => {
    setActiveClient(value);
  };

  const handleRefreshClient = async () => {
    if (!activeClient) return;
    
    setRefreshing(true);
    try {
      const services = await apiClient.refreshClient(activeClient);
      setClientServices(services);
    } catch (error) {
      console.error("Error refreshing client:", error);
    } finally {
      setRefreshing(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <RefreshCw className="animate-spin-slow text-docker-blue w-10 h-10" />
        <span className="ml-2 text-lg">Loading clients...</span>
      </div>
    );
  }

  if (!clients.length) {
    return (
      <div className="text-center py-10 border rounded-lg bg-muted/20">
        <h3 className="text-lg font-medium mb-2">No Clients Found</h3>
        <p className="text-gray-500 mb-4">
          No client folders with docker-compose.yml files were detected.
        </p>
        <Button onClick={onRefresh} className="bg-docker-blue hover:bg-docker-blue/90">
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>
    );
  }

  return (
    <Tabs value={activeClient || undefined} onValueChange={handleTabChange}>
      <div className="flex items-center justify-between mb-4">
        <TabsList className="bg-muted/50">
          {clients.map((client) => (
            <TabsTrigger key={client.name} value={client.name} className="data-[state=active]:bg-docker-blue data-[state=active]:text-white">
              {client.name}
            </TabsTrigger>
          ))}
        </TabsList>
        <Button
          variant="outline"
          size="sm"
          onClick={handleRefreshClient}
          disabled={refreshing || !activeClient}
          className="border-docker-blue text-docker-blue hover:bg-docker-lightBlue"
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
          {refreshing ? 'Refreshing...' : 'Refresh Client'}
        </Button>
      </div>

      {clients.map((client) => (
        <TabsContent key={client.name} value={client.name}>
          <ServiceTable 
            clientName={client.name}
            services={clientServices}
            onServiceUpdate={handleRefreshClient}
            isLoading={loadingServices}
          />
        </TabsContent>
      ))}
    </Tabs>
  );
};

export default ClientTabs;
