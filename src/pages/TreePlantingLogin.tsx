import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { TreePine, Users, ArrowLeft } from 'lucide-react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';

const TreePlantingLogin = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [orgCredentials, setOrgCredentials] = useState({ email: '' });
  const [planterCredentials, setPlanterCredentials] = useState({ email: '' });

  const handleOrganizationLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data, error } = await supabase.rpc('verify_tree_organization_email_login', {
        org_email: orgCredentials.email
      });

      if (error) throw error;

      if (data && data.length > 0) {
        const orgData = data[0];
        
        // Store organization session data
        localStorage.setItem('tree_org_session', JSON.stringify({
          id: orgData.id,
          organization_name: orgData.organization_name,
          email: orgData.email,
          login_code: orgData.login_code,
          seeds_allocated: orgData.seeds_allocated,
          seeds_planted: orgData.seeds_planted,
          loginTime: new Date().toISOString()
        }));

        toast({
          title: "Login Successful",
          description: `Welcome ${orgData.organization_name}!`
        });

        navigate('/organization-tree-dashboard');
      } else {
        throw new Error('Email not found or organization not approved');
      }
    } catch (error: any) {
      console.error('Login error:', error);
      toast({
        title: "Login Failed",
        description: error.message || 'Email not found or organization not approved',
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePlanterLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data, error } = await supabase.rpc('verify_tree_planter_email_login', {
        planter_email: planterCredentials.email
      });

      if (error) throw error;

      if (data && data.length > 0) {
        const planterData = data[0];
        
        // Store planter session data
        localStorage.setItem('tree_planter_session', JSON.stringify({
          id: planterData.id,
          name: planterData.name,
          email: planterData.email,
          organization_id: planterData.organization_id,
          trees_planted: planterData.trees_planted,
          loginTime: new Date().toISOString()
        }));

        toast({
          title: "Login Successful",
          description: `Welcome ${planterData.name}!`
        });

        navigate('/planter-dashboard');
      } else {
        throw new Error('Email not found or planter account not active');
      }
    } catch (error: any) {
      console.error('Login error:', error);
      toast({
        title: "Login Failed",
        description: error.message || 'Email not found or planter account not active',
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-md mx-auto">
          <div className="mb-6">
            <Link 
              to="/programs/five-million-trees" 
              className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors mb-4"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Five Million Trees Program
            </Link>
            
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-foreground mb-2">Tree Planting Login</h1>
              <p className="text-muted-foreground">
                Access your organization dashboard or planter account
              </p>
            </div>
          </div>

          <Tabs defaultValue="organization" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="organization" className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                Organization
              </TabsTrigger>
              <TabsTrigger value="planter" className="flex items-center gap-2">
                <TreePine className="h-4 w-4" />
                Planter
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="organization">
              <Card>
                <CardHeader>
                  <CardTitle>Organization Login</CardTitle>
                  <CardDescription>
                    Access your organization dashboard with just your email - no password required
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleOrganizationLogin} className="space-y-4">
                    <div>
                      <Label htmlFor="org-email">Email Address</Label>
                      <Input
                        id="org-email"
                        type="email"
                        value={orgCredentials.email}
                        onChange={(e) => setOrgCredentials({email: e.target.value})}
                        placeholder="Enter your organization email"
                        required
                      />
                    </div>
                    
                    <Button 
                      type="submit" 
                      className="w-full"
                      disabled={loading}
                    >
                      {loading ? 'Logging in...' : 'Login as Organization'}
                    </Button>
                  </form>
                  
                  <div className="mt-4 text-center text-sm text-muted-foreground">
                    Don't have an account? Apply through the{' '}
                    <Link to="/programs/five-million-trees-apply" className="text-primary hover:underline">
                      Five Million Trees Application
                    </Link>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="planter">
              <Card>
                <CardHeader>
                  <CardTitle>Tree Planter Login</CardTitle>
                  <CardDescription>
                    Access your planting dashboard with just your email - no password required
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handlePlanterLogin} className="space-y-4">
                    <div>
                      <Label htmlFor="planter-email">Email Address</Label>
                      <Input
                        id="planter-email"
                        type="email"
                        value={planterCredentials.email}
                        onChange={(e) => setPlanterCredentials({email: e.target.value})}
                        placeholder="Enter your planter email"
                        required
                      />
                    </div>
                    
                    <Button 
                      type="submit" 
                      className="w-full"
                      disabled={loading}
                    >
                      {loading ? 'Logging in...' : 'Login as Planter'}
                    </Button>
                  </form>
                  
                  <div className="mt-4 text-center text-sm text-muted-foreground">
                    Planter accounts are created by organizations.{' '}
                    <br />
                    Contact your organization administrator for access.
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
      
      <Footer />
    </div>
  );
};

export default TreePlantingLogin;
