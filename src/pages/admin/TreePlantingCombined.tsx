import React, { Suspense } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TreePine, Users, BarChart3 } from 'lucide-react';
import AdminLayout from '@/components/admin/AdminLayout';
import TreeCampaignApplications from './TreeCampaignApplications';
import TreePlantingManagement from './TreePlantingManagement';
const TreePlantingTracker = React.lazy(() => import('./TreePlantingTracker'));

const TreePlantingCombined = () => {
  return (
    <AdminLayout>
      <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl p-6 mb-8">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-gradient-to-br from-green-600 to-emerald-600 rounded-xl shadow-lg">
            <TreePine className="w-8 h-8 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-1">Five Million Trees Campaign & Tracker</h1>
            <p className="text-muted-foreground">Manage applications, organizations, and track tree planting progress</p>
          </div>
        </div>
      </div>

      <Tabs defaultValue="applications" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="applications" className="flex items-center gap-2">
            <TreePine className="h-4 w-4" />
            Campaign Applications
          </TabsTrigger>
          <TabsTrigger value="organizations" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Organization Management
          </TabsTrigger>
          <TabsTrigger value="tracker" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Planting Tracker
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="applications" className="mt-6">
          <TreeCampaignApplications />
        </TabsContent>
        
        <TabsContent value="organizations" className="mt-6">
          <TreePlantingManagement />
        </TabsContent>
        
        <TabsContent value="tracker" className="mt-6">
          <Suspense fallback={<div>Loading tracker...</div>}>
            <TreePlantingTracker />
          </Suspense>
        </TabsContent>
      </Tabs>
    </AdminLayout>
  );
};

export default TreePlantingCombined;
