import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminLayout from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAdminAuth } from '@/context/AdminAuthContext';
import { Trash2, Eye, CheckCircle, XCircle, Plus, MapPin, TreePine, Users, Sprout } from 'lucide-react';

interface TreeOrganization {
  id: string;
  organization_name: string;
  email: string;
  contact_person: string;
  phone_number: string;
  address: string;
  login_code: string;
  seeds_allocated: number;
  seeds_planted: number;
  status: string;
  created_at: string;
  approved_at?: string;
  approved_by?: string;
}

interface TreePlantingRecord {
  id: string;
  trees_count: number;
  species: string;
  planting_date: string;
  latitude?: number;
  longitude?: number;
  location_description?: string;
  verified: boolean;
  planter_name?: string;
  organization_name?: string;
  created_at: string;
}

interface NewOrganization {
  organization_name: string;
  email: string;
  password: string;
  contact_person: string;
  phone_number: string;
  address: string;
  seeds_allocated: number;
}

const TreePlantingManagement = () => {
  const { adminUser } = useAdminAuth();
  const navigate = useNavigate();
  const [organizations, setOrganizations] = useState<TreeOrganization[]>([]);
  const [plantingRecords, setPlantingRecords] = useState<TreePlantingRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newOrganization, setNewOrganization] = useState<NewOrganization>({
    organization_name: '',
    email: '',
    password: '',
    contact_person: '',
    phone_number: '',
    address: '',
    seeds_allocated: 0
  });
  const [selectedOrg, setSelectedOrg] = useState<TreeOrganization | null>(null);
  const [seedsToAllocate, setSeedsToAllocate] = useState(0);

  useEffect(() => {
    if (!adminUser) {
      navigate('/admin/login');
      return;
    }
    fetchData();
  }, [adminUser, navigate]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch tree organizations
      const { data: orgsData, error: orgsError } = await supabase
        .from('tree_organizations')
        .select('*')
        .order('created_at', { ascending: false });

      if (orgsError) throw orgsError;
      setOrganizations((orgsData || []) as TreeOrganization[]);

      // Fetch planting records with joins
      const { data: recordsData, error: recordsError } = await supabase
        .from('tree_planting_records')
        .select(`
          *,
          tree_planters_new(name),
          tree_organizations(organization_name)
        `)
        .order('created_at', { ascending: false });

      if (recordsError) throw recordsError;
      
      const formattedRecords = recordsData?.map(record => ({
        ...record,
        planter_name: record.tree_planters_new?.name || 'Unknown',
        organization_name: record.tree_organizations?.organization_name || 'Unknown'
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

  const createOrganization = async () => {
    if (!newOrganization.organization_name || !newOrganization.email || !newOrganization.password) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    try {
      // Generate login code
      const { data: codeData } = await supabase.rpc('generate_login_code');
      const loginCode = codeData || `TREE${Math.random().toString(36).substr(2, 8).toUpperCase()}`;

      // Hash password
      const { data: orgData, error } = await supabase
        .from('tree_organizations')
        .insert({
          organization_name: newOrganization.organization_name,
          email: newOrganization.email,
          password_hash: `crypt('${newOrganization.password}', gen_salt('bf', 12))`,
          contact_person: newOrganization.contact_person,
          phone_number: newOrganization.phone_number,
          address: newOrganization.address,
          login_code: loginCode,
          seeds_allocated: newOrganization.seeds_allocated,
          status: 'approved',
          approved_by: adminUser?.id,
          approved_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Success",
        description: `Organization created with login code: ${loginCode}`,
      });

      setIsCreateDialogOpen(false);
      setNewOrganization({
        organization_name: '',
        email: '',
        password: '',
        contact_person: '',
        phone_number: '',
        address: '',
        seeds_allocated: 0
      });
      fetchData();
    } catch (error: any) {
      console.error('Error creating organization:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to create organization",
        variant: "destructive"
      });
    }
  };

  const approveOrganization = async (orgId: string) => {
    try {
      // Generate login code
      const { data: codeData } = await supabase.rpc('generate_login_code');
      const loginCode = codeData || `TREE${Math.random().toString(36).substr(2, 8).toUpperCase()}`;

      const { error } = await supabase
        .from('tree_organizations')
        .update({
          status: 'approved',
          approved_by: adminUser?.id,
          approved_at: new Date().toISOString(),
          login_code: loginCode
        })
        .eq('id', orgId);

      if (error) throw error;

      toast({
        title: "Success",
        description: `Organization approved with login code: ${loginCode}`,
      });
      
      fetchData();
    } catch (error: any) {
      console.error('Error approving organization:', error);
      toast({
        title: "Error",
        description: "Failed to approve organization",
        variant: "destructive"
      });
    }
  };

  const allocateSeeds = async () => {
    if (!selectedOrg || seedsToAllocate <= 0) return;

    try {
      const { error } = await supabase
        .from('tree_organizations')
        .update({
          seeds_allocated: selectedOrg.seeds_allocated + seedsToAllocate
        })
        .eq('id', selectedOrg.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: `${seedsToAllocate} seeds allocated to ${selectedOrg.organization_name}`,
      });
      
      setSelectedOrg(null);
      setSeedsToAllocate(0);
      fetchData();
    } catch (error: any) {
      console.error('Error allocating seeds:', error);
      toast({
        title: "Error",
        description: "Failed to allocate seeds",
        variant: "destructive"
      });
    }
  };

  const verifyPlantingRecord = async (recordId: string) => {
    try {
      const { error } = await supabase
        .from('tree_planting_records')
        .update({
          verified: true,
          verified_by: adminUser?.id,
          verified_at: new Date().toISOString()
        })
        .eq('id', recordId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Planting record verified",
      });
      
      fetchData();
    } catch (error: any) {
      console.error('Error verifying record:', error);
      toast({
        title: "Error",
        description: "Failed to verify record",
        variant: "destructive"
      });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <Badge className="bg-success text-success-foreground">Approved</Badge>;
      case 'pending':
        return <Badge variant="secondary">Pending</Badge>;
      case 'rejected':
        return <Badge variant="destructive">Rejected</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const totalTreesPlanted = plantingRecords.reduce((sum, record) => sum + record.trees_count, 0);
  const totalOrganizations = organizations.filter(org => org.status === 'approved').length;
  const totalSeedsAllocated = organizations.reduce((sum, org) => sum + org.seeds_allocated, 0);
  const totalSeedsPlanted = organizations.reduce((sum, org) => sum + org.seeds_planted, 0);

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-screen">
          <div className="text-lg">Loading...</div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Five Million Trees Management</h1>
            <p className="text-muted-foreground">Manage tree planting organizations and track progress</p>
          </div>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Create Organization
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Create New Organization</DialogTitle>
                <DialogDescription>Add a new tree planting organization</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="org_name">Organization Name *</Label>
                  <Input
                    id="org_name"
                    value={newOrganization.organization_name}
                    onChange={(e) => setNewOrganization({...newOrganization, organization_name: e.target.value})}
                    placeholder="Enter organization name"
                  />
                </div>
                <div>
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={newOrganization.email}
                    onChange={(e) => setNewOrganization({...newOrganization, email: e.target.value})}
                    placeholder="Enter email"
                  />
                </div>
                <div>
                  <Label htmlFor="password">Password *</Label>
                  <Input
                    id="password"
                    type="password"
                    value={newOrganization.password}
                    onChange={(e) => setNewOrganization({...newOrganization, password: e.target.value})}
                    placeholder="Enter password"
                  />
                </div>
                <div>
                  <Label htmlFor="contact_person">Contact Person</Label>
                  <Input
                    id="contact_person"
                    value={newOrganization.contact_person}
                    onChange={(e) => setNewOrganization({...newOrganization, contact_person: e.target.value})}
                    placeholder="Enter contact person"
                  />
                </div>
                <div>
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    value={newOrganization.phone_number}
                    onChange={(e) => setNewOrganization({...newOrganization, phone_number: e.target.value})}
                    placeholder="Enter phone number"
                  />
                </div>
                <div>
                  <Label htmlFor="address">Address</Label>
                  <Textarea
                    id="address"
                    value={newOrganization.address}
                    onChange={(e) => setNewOrganization({...newOrganization, address: e.target.value})}
                    placeholder="Enter address"
                  />
                </div>
                <div>
                  <Label htmlFor="seeds">Seeds to Allocate</Label>
                  <Input
                    id="seeds"
                    type="number"
                    min="0"
                    value={newOrganization.seeds_allocated}
                    onChange={(e) => setNewOrganization({...newOrganization, seeds_allocated: parseInt(e.target.value) || 0})}
                    placeholder="Number of seeds"
                  />
                </div>
                <Button onClick={createOrganization} className="w-full">
                  Create Organization
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Trees Planted</CardTitle>
              <TreePine className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-success">{totalTreesPlanted.toLocaleString()}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Organizations</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">{totalOrganizations}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Seeds Allocated</CardTitle>
              <Sprout className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-accent">{totalSeedsAllocated.toLocaleString()}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Seeds Planted</CardTitle>
              <TreePine className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-success">{totalSeedsPlanted.toLocaleString()}</div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="organizations" className="w-full">
          <TabsList>
            <TabsTrigger value="organizations">Organizations</TabsTrigger>
            <TabsTrigger value="records">Planting Records</TabsTrigger>
          </TabsList>
          
          <TabsContent value="organizations" className="space-y-4">
            <div className="grid gap-4">
              {organizations.map((org) => (
                <Card key={org.id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-lg">{org.organization_name}</CardTitle>
                        <CardDescription>{org.email} • {org.contact_person}</CardDescription>
                      </div>
                      <div className="flex items-center gap-2">
                        {getStatusBadge(org.status)}
                        {org.status === 'pending' && (
                          <Button
                            size="sm"
                            onClick={() => approveOrganization(org.id)}
                            className="bg-success hover:bg-success/80"
                          >
                            <CheckCircle className="mr-2 h-4 w-4" />
                            Approve
                          </Button>
                        )}
                        {org.status === 'approved' && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setSelectedOrg(org);
                              setSeedsToAllocate(0);
                            }}
                          >
                            <Sprout className="mr-2 h-4 w-4" />
                            Allocate Seeds
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <strong>Login Code:</strong> {org.login_code}
                      </div>
                      <div>
                        <strong>Seeds Allocated:</strong> {org.seeds_allocated.toLocaleString()}
                      </div>
                      <div>
                        <strong>Seeds Planted:</strong> {org.seeds_planted.toLocaleString()}
                      </div>
                      <div>
                        <strong>Progress:</strong> {org.seeds_allocated > 0 ? Math.round((org.seeds_planted / org.seeds_allocated) * 100) : 0}%
                      </div>
                    </div>
                    <div className="mt-2">
                      <strong>Address:</strong> {org.address}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
          
          <TabsContent value="records" className="space-y-4">
            <div className="grid gap-4">
              {plantingRecords.map((record) => (
                <Card key={record.id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-lg">{record.trees_count} {record.species} Trees</CardTitle>
                        <CardDescription>
                          Planted by {record.planter_name} • {record.organization_name}
                        </CardDescription>
                      </div>
                      <div className="flex items-center gap-2">
                        {record.verified ? (
                          <Badge className="bg-success text-success-foreground">Verified</Badge>
                        ) : (
                          <Button
                            size="sm"
                            onClick={() => verifyPlantingRecord(record.id)}
                            className="bg-success hover:bg-success/80"
                          >
                            <CheckCircle className="mr-2 h-4 w-4" />
                            Verify
                          </Button>
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
                        <strong>GPS:</strong> {record.latitude && record.longitude ? `${record.latitude}, ${record.longitude}` : 'Not available'}
                      </div>
                      <div>
                        <strong>Created:</strong> {new Date(record.created_at).toLocaleDateString()}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>

        {/* Seed Allocation Dialog */}
        {selectedOrg && (
          <Dialog open={!!selectedOrg} onOpenChange={() => setSelectedOrg(null)}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Allocate Seeds to {selectedOrg.organization_name}</DialogTitle>
                <DialogDescription>
                  Current allocation: {selectedOrg.seeds_allocated} seeds
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="seeds_amount">Number of Seeds to Allocate</Label>
                  <Input
                    id="seeds_amount"
                    type="number"
                    min="1"
                    value={seedsToAllocate}
                    onChange={(e) => setSeedsToAllocate(parseInt(e.target.value) || 0)}
                    placeholder="Enter number of seeds"
                  />
                </div>
                <Button onClick={allocateSeeds} disabled={seedsToAllocate <= 0} className="w-full">
                  Allocate {seedsToAllocate} Seeds
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>
    </AdminLayout>
  );
};

export default TreePlantingManagement;
