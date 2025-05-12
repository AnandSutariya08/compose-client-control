
import { ContainerStatus } from "@/types/docker";
import React from "react";

interface StatusBadgeProps {
  status: ContainerStatus;
}

const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  const getBadgeColor = () => {
    switch (status) {
      case "running":
        return "bg-docker-green";
      case "stopped":
        return "bg-docker-amber";
      case "missing":
        return "bg-docker-red";
      default:
        return "bg-gray-400";
    }
  };

  const getBadgeText = () => {
    switch (status) {
      case "running":
        return "Running";
      case "stopped":
        return "Stopped";
      case "missing":
        return "Image Missing";
      default:
        return "Unknown";
    }
  };

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium text-white ${getBadgeColor()}`}>
      {status === "running" && (
        <span className="w-2 h-2 mr-1.5 bg-white rounded-full opacity-75 animate-pulse"></span>
      )}
      {getBadgeText()}
    </span>
  );
};

export default StatusBadge;
