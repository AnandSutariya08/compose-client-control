
export interface DockerService {
  name: string;
  image: string;
  ports: string[];
  status: ContainerStatus;
}

export type ContainerStatus = 'running' | 'stopped' | 'missing';

export interface ClientFolder {
  name: string;
  services: DockerService[];
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface ContainerActionResponse {
  name: string;
  action: 'start' | 'stop' | 'fetch';
  success: boolean;
  message: string;
}
