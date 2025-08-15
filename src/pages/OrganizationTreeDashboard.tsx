import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { LogOut, Plus, TreePine, Users, Sprout, User, MapPin } from 'lucide-react';

interface OrganizationSession {
  id: string;
  organization_name: string;
  email: string;
  login_code: string;
  seeds_allocated: number;
  seeds_planted: number;
}

interface TreePlanter {
  id: string;
  name: string;
  email: string;
  phone_number: string;
  trees_planted: number;
  is_active: boolean;
  created_at: string;
}

interface PlantingRecord {
  id: string;
  trees_count: number;
  species: string;
  planting_date: string;
  latitude?: number;
  longitude?: number;
  location_description?: string;
  verified: boolean;
  planter_name: string;
  created_at: string;
}

interface NewPlanter {
  name: string;
  email: string;
  phone_number: string;
  password: string;
}

const OrganizationTreeDashboard = () => {
  const navigate = useNavigate();
  const [orgSession, setOrgSession] = useState<OrganizationSession | null>(null);
  const [planters, setPlanters] = useState<TreePlanter[]>([]);
  const [plantingRecords, setPlantingRecords] = useState<PlantingRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreatePlanterOpen, setIsCreatePlanterOpen] = useState(false);
  const [newPlanter, setNewPlanter] = useState<NewPlanter>({
    name: '',
    email: '',
    phone_number: '',
    password: ''
  });

  useEffect(() => {
    const sessionData = localStorage.getItem('tree_org_session');
    if (!sessionData) {
      navigate('/tree-planting-login');
      return;
    }

    try {
      const session = JSON.parse(sessionData);
      setOrgSession(session);
      fetchData(session.id);
    } catch (error) {
      console.error('Invalid session data:', error);
      navigate('/tree-planting-login');
    }
  }, [navigate]);

  const fetchData = async (orgId: string) => {
    setLoading(true);
    try {
      // Note: Using direct queries instead of RLS context

      // Fetch planters
      const { data: plantersData, error: plantersError } = await supabase
        .from('tree_planters_new')
        .select('*')
        .eq('organization_id', orgId)
        .order('created_at', { ascending: false });

      if (plantersError) throw plantersError;
      setPlanters(plantersData || []);

      // Fetch planting records
      const { data: recordsData, error: recordsError } = await supabase
        .from('tree_planting_records')
        .select(`
          *,
          tree_planters_new(name)
        `)
        .eq('organization_id', orgId)
        .order('created_at', { ascending: false });

      if (recordsError) throw recordsError;
      
      const formattedRecords = recordsData?.map(record => ({
        ...record,
        planter_name: record.tree_planters_new?.name || 'Unknown'
      })) || [];
      
      setPlantingRecords(formattedRecords);
    } catch (error: any) {
      console.error('Error fetching data:', error);
      toast({
        title: "Error",
        description: "Failed to fetch data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const createPlanter = async () => {
    if (!newPlanter.name || !newPlanter.email || !newPlanter.password || !orgSession) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    try {
      const { data, error } = await supabase.rpc('create_planter_for_org', {
        org_id: orgSession.id,
        planter_name: newPlanter.name,
        planter_email: newPlanter.email,
        planter_phone: newPlanter.phone_number,
        plain_password: newPlanter.password
      });

      if (error) throw error;

      const result = data?.[0];
      const loginCode = result?.login_code;

      toast({
        title: "Success",
        description: `Planter registered with login code: ${loginCode}`,
      });

      setIsCreatePlanterOpen(false);
      setNewPlanter({ name: '', email: '', phone_number: '', password: '' });
      fetchData(orgSession.id);
    } catch (error: any) {
      console.error('Error creating planter:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to register planter",
        variant: "destructive"
      });
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('tree_org_session');
    navigate('/tree-planting-login');
  };

  const totalTreesPlanted = plantingRecords.reduce((sum, record) => sum + record.trees_count, 0);
  const activePlanters = planters.filter(p => p.is_active).length;
  const verifiedRecords = plantingRecords.filter(r => r.verified).length;
  const progress = orgSession?.seeds_allocated ? Math.round((totalTreesPlanted / orgSession.seeds_allocated) * 100) : 0;

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  if (!orgSession) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-4">Session Expired</h2>
          <Button onClick={() => navigate('/tree-planting-login')}>
            Back to Login
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-foreground">
                {orgSession.organization_name}
              </h1>
              <p className="text-muted-foreground">Tree Planting Dashboard</p>
            </div>
            <div className="flex items-center gap-4">
              <Badge variant="outline">Code: {orgSession.login_code}</Badge>
              <Button variant="outline" onClick={handleLogout}>
                <LogOut className="mr-2 h-4 w-4" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Seeds Allocated</CardTitle>
              <Sprout className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">
                {orgSession.seeds_allocated.toLocaleString()}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Trees Planted</CardTitle>
              <TreePine className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-success">
                {totalTreesPlanted.toLocaleString()}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Planters</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-accent">{activePlanters}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Progress</CardTitle>
              <TreePine className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-success">{progress}%</div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="planters" className="w-full">
          <TabsList>
            <TabsTrigger value="planters">Tree Planters</TabsTrigger>
            <TabsTrigger value="records">Planting Records</TabsTrigger>
          </TabsList>
          
          <TabsContent value="planters" className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">Manage Tree Planters</h2>
              <Dialog open={isCreatePlanterOpen} onOpenChange={setIsCreatePlanterOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    Register New Planter
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>Register New Tree Planter</DialogTitle>
                    <DialogDescription>
                      Add a new tree planter to your organization
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="planter_name">Full Name *</Label>
                      <Input
                        id="planter_name"
                        value={newPlanter.name}
                        onChange={(e) => setNewPlanter({...newPlanter, name: e.target.value})}
                        placeholder="Enter full name"
                      />
                    </div>
                    <div>
                      <Label htmlFor="planter_email">Email *</Label>
                      <Input
                        id="planter_email"
                        type="email"
                        value={newPlanter.email}
                        onChange={(e) => setNewPlanter({...newPlanter, email: e.target.value})}
                        placeholder="Enter email"
                      />
                    </div>
                    <div>
                      <Label htmlFor="planter_phone">Phone Number</Label>
                      <Input
                        id="planter_phone"
                        value={newPlanter.phone_number}
                        onChange={(e) => setNewPlanter({...newPlanter, phone_number: e.target.value})}
                        placeholder="Enter phone number"
                      />
                    </div>
                    <div>
                      <Label htmlFor="planter_password">Password *</Label>
                      <Input
                        id="planter_password"
                        type="password"
                        value={newPlanter.password}
                        onChange={(e) => setNewPlanter({...newPlanter, password: e.target.value})}
                        placeholder="Enter password"
                      />
                    </div>
                    <Button onClick={createPlanter} className="w-full">
                      Register Planter
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
            
            <div className="grid gap-4">
              {planters.map((planter) => (
                <Card key={planter.id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-lg">{planter.name}</CardTitle>
                        <CardDescription>{planter.email} • {planter.phone_number}</CardDescription>
                      </div>
                      <div className="flex items-center gap-2">
                        {planter.is_active ? (
                          <Badge className="bg-success text-success-foreground">Active</Badge>
                        ) : (
                          <Badge variant="secondary">Inactive</Badge>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <strong>Trees Planted:</strong> {planter.trees_planted}
                      </div>
                      <div>
                        <strong>Joined:</strong> {new Date(planter.created_at).toLocaleDateString()}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
              
              {planters.length === 0 && (
                <Card>
                  <CardContent className="text-center py-8">
                    <User className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">No planters registered yet</p>
                    <p className="text-sm text-muted-foreground mt-2">
                      Register planters to start tracking tree planting activities
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>
          
          <TabsContent value="records" className="space-y-4">
            <h2 className="text-xl font-semibold">Planting Records</h2>
            
            <div className="grid gap-4">
              {plantingRecords.map((record) => (
                <Card key={record.id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-lg">
                          {record.trees_count} {record.species} Trees
                        </CardTitle>
                        <CardDescription>
                          Planted by {record.planter_name}
                        </CardDescription>
                      </div>
                      <div className="flex items-center gap-2">
                        {record.verified ? (
                          <Badge className="bg-success text-success-foreground">Verified</Badge>
                        ) : (
                          <Badge variant="secondary">Pending Verification</Badge>
                        )}
                        {record.latitude && record.longitude && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => window.open(`https://maps.google.com/?q=${record.latitude},${record.longitude}`, '_blank')}
                          >
                            <MapPin className="mr-2 h-4 w-4" />
                            View Location
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <strong>Date:</strong> {new Date(record.planting_date).toLocaleDateString()}
                      </div>
                      <div>
                        <strong>Location:</strong> {record.location_description || 'Not specified'}
                      </div>
                      <div>
                        <strong>GPS:</strong> {record.latitude && record.longitude ? 'Available' : 'Not available'}
                      </div>
                      <div>
                        <strong>Recorded:</strong> {new Date(record.created_at).toLocaleDateString()}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
              
              {plantingRecords.length === 0 && (
                <Card>
                  <CardContent className="text-center py-8">
                    <TreePine className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">No planting records yet</p>
                    <p className="text-sm text-muted-foreground mt-2">
                      Records will appear here when planters start logging their activities
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default OrganizationTreeDashboard;
