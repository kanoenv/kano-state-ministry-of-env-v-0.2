import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { LogOut, Plus, TreePine, MapPin, Camera, Map } from 'lucide-react';

interface PlanterSession {
  id: string;
  name: string;
  email: string;
  organization_id: string;
  trees_planted: number;
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
  created_at: string;
  notes?: string;
}

interface NewPlantingRecord {
  trees_count: string;
  species: string;
  location_description: string;
  notes: string;
}

const PlanterDashboard = () => {
  const navigate = useNavigate();
  const [planterSession, setPlanterSession] = useState<PlanterSession | null>(null);
  const [plantingRecords, setPlantingRecords] = useState<PlantingRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRecordDialogOpen, setIsRecordDialogOpen] = useState(false);
  const [newRecord, setNewRecord] = useState<NewPlantingRecord>({
    trees_count: '',
    species: '',
    location_description: '',
    notes: ''
  });
  const [currentLocation, setCurrentLocation] = useState<{latitude: number, longitude: number} | null>(null);
  const [locationLoading, setLocationLoading] = useState(false);

  useEffect(() => {
    const sessionData = localStorage.getItem('tree_planter_session');
    if (!sessionData) {
      navigate('/tree-planting-login');
      return;
    }

    try {
      const session = JSON.parse(sessionData);
      setPlanterSession(session);
      fetchData(session.id);
    } catch (error) {
      console.error('Invalid session data:', error);
      navigate('/tree-planting-login');
    }
  }, [navigate]);

  const fetchData = async (planterId: string) => {
    setLoading(true);
    try {
      // Note: Using direct queries instead of RLS context

      // Fetch planting records
      const { data: recordsData, error: recordsError } = await supabase
        .from('tree_planting_records')
        .select('*')
        .eq('planter_id', planterId)
        .order('created_at', { ascending: false });

      if (recordsError) throw recordsError;
      setPlantingRecords(recordsData || []);
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

  const getCurrentLocation = () => {
    setLocationLoading(true);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setCurrentLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          });
          setLocationLoading(false);
          toast({
            title: "Location Captured",
            description: "GPS coordinates have been recorded"
          });
        },
        (error) => {
          console.error('Error getting location:', error);
          setLocationLoading(false);
          toast({
            title: "Location Error",
            description: "Unable to get current location. Please ensure location services are enabled.",
            variant: "destructive"
          });
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
      );
    } else {
      setLocationLoading(false);
      toast({
        title: "Location Not Supported",
        description: "Your browser doesn't support location services",
        variant: "destructive"
      });
    }
  };

  const createPlantingRecord = async () => {
    if (!newRecord.trees_count || !newRecord.species || !planterSession) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    try {
      const recordData = {
        planter_id: planterSession.id,
        organization_id: planterSession.organization_id,
        trees_count: parseInt(newRecord.trees_count),
        species: newRecord.species,
        location_description: newRecord.location_description,
        notes: newRecord.notes,
        latitude: currentLocation?.latitude,
        longitude: currentLocation?.longitude,
        planting_date: new Date().toISOString().split('T')[0]
      };

      const { error } = await supabase
        .from('tree_planting_records')
        .insert(recordData);

      if (error) throw error;

      // Update planter's trees planted count
      const { error: updateError } = await supabase
        .from('tree_planters_new')
        .update({
          trees_planted: planterSession.trees_planted + parseInt(newRecord.trees_count)
        })
        .eq('id', planterSession.id);

      if (updateError) throw updateError;

      toast({
        title: "Success",
        description: `Recorded planting of ${newRecord.trees_count} ${newRecord.species} trees`,
      });

      setIsRecordDialogOpen(false);
      setNewRecord({ trees_count: '', species: '', location_description: '', notes: '' });
      setCurrentLocation(null);
      
      // Update session data
      const updatedSession = {
        ...planterSession,
        trees_planted: planterSession.trees_planted + parseInt(newRecord.trees_count)
      };
      setPlanterSession(updatedSession);
      localStorage.setItem('tree_planter_session', JSON.stringify(updatedSession));
      
      fetchData(planterSession.id);
    } catch (error: any) {
      console.error('Error creating record:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to record planting",
        variant: "destructive"
      });
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('tree_planter_session');
    navigate('/tree-planting-login');
  };

  const totalTreesPlanted = plantingRecords.reduce((sum, record) => sum + record.trees_count, 0);
  const verifiedRecords = plantingRecords.filter(r => r.verified).length;
  const recordsWithGPS = plantingRecords.filter(r => r.latitude && r.longitude).length;

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  if (!planterSession) {
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
                Welcome, {planterSession.name}
              </h1>
              <p className="text-muted-foreground">Tree Planting Dashboard</p>
            </div>
            <div className="flex items-center gap-4">
              <Dialog open={isRecordDialogOpen} onOpenChange={setIsRecordDialogOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    Record Planting
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>Record Tree Planting</DialogTitle>
                    <DialogDescription>
                      Log your tree planting activity with GPS location
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="trees_count">Number of Trees *</Label>
                      <Input
                        id="trees_count"
                        type="number"
                        min="1"
                        value={newRecord.trees_count}
                        onChange={(e) => setNewRecord({...newRecord, trees_count: e.target.value})}
                        placeholder="Enter number of trees planted"
                      />
                    </div>
                    <div>
                      <Label htmlFor="species">Tree Species *</Label>
                      <Input
                        id="species"
                        value={newRecord.species}
                        onChange={(e) => setNewRecord({...newRecord, species: e.target.value})}
                        placeholder="e.g., Neem, Baobab, Eucalyptus"
                      />
                    </div>
                    <div>
                      <Label htmlFor="location_desc">Location Description</Label>
                      <Input
                        id="location_desc"
                        value={newRecord.location_description}
                        onChange={(e) => setNewRecord({...newRecord, location_description: e.target.value})}
                        placeholder="Describe the planting location"
                      />
                    </div>
                    <div>
                      <Label htmlFor="notes">Notes</Label>
                      <Textarea
                        id="notes"
                        value={newRecord.notes}
                        onChange={(e) => setNewRecord({...newRecord, notes: e.target.value})}
                        placeholder="Additional notes about the planting"
                        rows={3}
                      />
                    </div>
                    
                    <div className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <Label>GPS Location</Label>
                        <Button
                          type="button"
                          size="sm"
                          onClick={getCurrentLocation}
                          disabled={locationLoading}
                        >
                          <MapPin className="mr-2 h-4 w-4" />
                          {locationLoading ? 'Getting Location...' : 'Capture GPS'}
                        </Button>
                      </div>
                      {currentLocation ? (
                        <div className="text-sm text-success">
                          ✓ Location captured: {currentLocation.latitude.toFixed(6)}, {currentLocation.longitude.toFixed(6)}
                        </div>
                      ) : (
                        <div className="text-sm text-muted-foreground">
                          No GPS location captured yet
                        </div>
                      )}
                    </div>
                    
                    <Button onClick={createPlantingRecord} className="w-full">
                      Record Planting
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
              
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
              <CardTitle className="text-sm font-medium">Trees Planted</CardTitle>
              <TreePine className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-success">
                {totalTreesPlanted}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Records</CardTitle>
              <TreePine className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">
                {plantingRecords.length}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Verified Records</CardTitle>
              <TreePine className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-accent">{verifiedRecords}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">GPS Records</CardTitle>
              <Map className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-success">{recordsWithGPS}</div>
            </CardContent>
          </Card>
        </div>

        {/* Planting Records */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Your Planting Records</h2>
          
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
                        Planted on {new Date(record.planting_date).toLocaleDateString()}
                      </CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      {record.verified ? (
                        <Badge className="bg-success text-success-foreground">Verified</Badge>
                      ) : (
                        <Badge variant="secondary">Pending</Badge>
                      )}
                      {record.latitude && record.longitude && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => window.open(`https://maps.google.com/?q=${record.latitude},${record.longitude}`, '_blank')}
                        >
                          <MapPin className="mr-2 h-4 w-4" />
                          View on Map
                        </Button>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                    <div>
                      <strong>Location:</strong> {record.location_description || 'Not specified'}
                    </div>
                    <div>
                      <strong>GPS:</strong> {record.latitude && record.longitude ? 'Available' : 'Not recorded'}
                    </div>
                    <div>
                      <strong>Recorded:</strong> {new Date(record.created_at).toLocaleDateString()}
                    </div>
                  </div>
                  {record.notes && (
                    <div className="mt-2">
                      <strong>Notes:</strong> {record.notes}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
            
            {plantingRecords.length === 0 && (
              <Card>
                <CardContent className="text-center py-8">
                  <TreePine className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No planting records yet</p>
                  <p className="text-sm text-muted-foreground mt-2">
                    Start recording your tree planting activities to track your contribution
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PlanterDashboard;
