import { useQuery } from '@tanstack/react-query';
import * as api from './api';

export const useDashboardStats = () => {
  return useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: api.fetchDashboardStats,
  });
};

export const useCategories = () => {
  return useQuery({
    queryKey: ['categories'],
    queryFn: api.fetchCategories,
  });
};

export const useSpecialties = () => {
  return useQuery({
    queryKey: ['specialties'],
    queryFn: api.fetchSpecialties,
  });
};

export const useActivePlans = () => {
  return useQuery({
    queryKey: ['active-plans'],
    queryFn: api.fetchActivePlans,
  });
};

export const useNearbyWorkshops = () => {
  return useQuery({
    queryKey: ['nearby-workshops'],
    queryFn: api.fetchNearbyWorkshops,
  });
};

export const useTopSuppliers = () => {
  return useQuery({
    queryKey: ['top-suppliers'],
    queryFn: api.fetchTopSuppliers,
  });
};
