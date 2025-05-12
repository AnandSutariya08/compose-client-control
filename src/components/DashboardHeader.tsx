
import React from 'react';
import DockerLogo from './DockerLogo';
import { Button } from './ui/button';
import { RefreshCw } from 'lucide-react';

interface DashboardHeaderProps {
  onRefresh: () => void;
  isRefreshing: boolean;
}

const DashboardHeader: React.FC<DashboardHeaderProps> = ({ onRefresh, isRefreshing }) => {
  return (
    <div className="flex flex-col md:flex-row justify-between items-center mb-6 pb-4 border-b">
      <div className="flex items-center mb-4 md:mb-0">
        <DockerLogo />
        <div className="ml-3">
          <h1 className="text-2xl font-semibold">Docker Compose Manager</h1>
          <p className="text-sm text-gray-500">Manage your Docker containers across multiple clients</p>
        </div>
      </div>
      
      <Button 
        onClick={onRefresh}
        disabled={isRefreshing}
        className="bg-docker-blue hover:bg-docker-blue/90"
      >
        <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
        {isRefreshing ? 'Refreshing...' : 'Refresh All'}
      </Button>
    </div>
  );
};

export default DashboardHeader;
