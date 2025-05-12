
import React, { useState, useEffect } from 'react';
import { ClientFolder } from '@/types/docker';
import { apiClient } from '@/services/api';
import ClientTabs from '@/components/ClientTabs';
import DashboardHeader from '@/components/DashboardHeader';
import { Card } from '@/components/ui/card';
import { toast } from '@/components/ui/sonner';

const Index = () => {
  const [clients, setClients] = useState<ClientFolder[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchClients = async () => {
    if (refreshing) return;
    
    try {
      setRefreshing(true);
      const fetchedClients = await apiClient.getClients();
      setClients(fetchedClients);
      
      // Show success message only during refresh, not initial load
      if (!loading) {
        toast.success("Client data refreshed successfully");
      }
    } catch (error) {
      console.error("Error fetching clients:", error);
      toast.error("Failed to fetch client data");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchClients();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <div className="container py-8">
        <DashboardHeader onRefresh={fetchClients} isRefreshing={refreshing} />
        
        <Card className="p-6">
          <ClientTabs 
            clients={clients}
            onRefresh={fetchClients}
            isLoading={loading}
          />
        </Card>
        
        <footer className="mt-8 text-center text-sm text-gray-500">
          <p>Docker Compose Manager &copy; 2025 - Lovable</p>
        </footer>
      </div>
    </div>
  );
};

export default Index;
