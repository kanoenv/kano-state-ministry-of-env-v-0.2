import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { TreePine, Users, MapPin, CheckCircle, Sprout, Eye } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';

interface TrackerStats {
  totalOrganizations: number;
  totalPlanters: number;
  totalTreesPlanted: number;
  totalRecords: number;
  verifiedRecords: number;
  totalSeedsAllocated: number;
}

const TreePlantingTracker = () => {
  const [stats, setStats] = useState<TrackerStats>({
    totalOrganizations: 0,
    totalPlanters: 0,
    totalTreesPlanted: 0,
    totalRecords: 0,
    verifiedRecords: 0,
    totalSeedsAllocated: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTrackerStats();
  }, []);

  const fetchTrackerStats = async () => {
    try {
      // Fetch five million trees campaign application stats
      const { data: campaignData } = await supabase
        .from('five_million_trees_applications')
        .select('*');

      // Fetch approved organization stats from tree_organizations (created from approved applications)
      const { data: orgData } = await supabase
        .from('tree_organizations')
        .select('seeds_allocated, seeds_planted')
        .eq('status', 'approved');

      // Fetch planter stats
      const { data: planterData } = await supabase
        .from('tree_planters_new')
        .select('trees_planted')
        .eq('is_active', true);

      // Fetch planting records stats
      const { data: recordsData } = await supabase
        .from('tree_planting_records')
        .select('trees_count, verified');

      const totalOrganizations = orgData?.length || 0;
      const totalPlanters = planterData?.length || 0;
      const totalSeedsAllocated = orgData?.reduce((sum, org) => sum + (org.seeds_allocated || 0), 0) || 0;
      const totalTreesPlanted = recordsData?.reduce((sum, record) => sum + (record.trees_count || 0), 0) || 0;
      const totalRecords = recordsData?.length || 0;
      const verifiedRecords = recordsData?.filter(record => record.verified).length || 0;
      
      // Campaign specific stats
      const totalApplications = campaignData?.length || 0;
      const approvedApplications = campaignData?.filter(app => app.status === 'Approved').length || 0;
      const totalSeedlingsRequested = campaignData?.reduce((sum, app) => sum + (app.seedlings_requested || 0), 0) || 0;

      setStats({
        totalOrganizations,
        totalPlanters,
        totalTreesPlanted,
        totalRecords,
        verifiedRecords,
        totalSeedsAllocated: totalSeedlingsRequested // Use seedlings from applications as this is the real campaign data
      });
    } catch (error) {
      console.error('Error fetching tracker stats:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <div className="container mx-auto px-4 py-8">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-green-600 to-emerald-600 rounded-full mb-6">
            <TreePine className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-foreground mb-4">
            Five Million Trees Campaign Tracker
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Real-time monitoring of the Five Million Trees Campaign progress across Kano State. 
            Track applications, approved organizations, active planters, and verified tree plantings 
            in our historic environmental restoration initiative.
          </p>
          
          {/* Brief Campaign Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8 max-w-4xl mx-auto">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="text-2xl font-bold text-green-700">
                {loading ? '...' : stats.totalSeedsAllocated.toLocaleString()}
              </div>
              <div className="text-sm text-green-600">Seeds Allocated</div>
            </div>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="text-2xl font-bold text-blue-700">
                {loading ? '...' : stats.totalOrganizations}
              </div>
              <div className="text-sm text-blue-600">Active Organizations</div>
            </div>
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
              <div className="text-2xl font-bold text-purple-700">
                {loading ? '...' : stats.totalPlanters}
              </div>
              <div className="text-sm text-purple-600">Tree Planters</div>
            </div>
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
              <div className="text-2xl font-bold text-orange-700">
                {loading ? '...' : stats.totalTreesPlanted.toLocaleString()}
              </div>
              <div className="text-sm text-orange-600">Trees Planted</div>
            </div>
          </div>
        </div>

        {/* Live Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Trees Planted</CardTitle>
              <TreePine className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-700">
                {loading ? '...' : stats.totalTreesPlanted.toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground">
                {loading ? '' : `${((stats.totalTreesPlanted / 5000000) * 100).toFixed(2)}% of 5M goal`}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Organizations</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {loading ? '...' : stats.totalOrganizations}
              </div>
              <p className="text-xs text-muted-foreground">
                Approved organizations
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Planters</CardTitle>
              <Sprout className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {loading ? '...' : stats.totalPlanters}
              </div>
              <p className="text-xs text-muted-foreground">
                Registered tree planters
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Planting Records</CardTitle>
              <MapPin className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {loading ? '...' : stats.totalRecords}
              </div>
              <p className="text-xs text-muted-foreground">
                Total planting activities
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Verified Records</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {loading ? '...' : stats.verifiedRecords}
              </div>
              <p className="text-xs text-muted-foreground">
                {loading ? '' : `${((stats.verifiedRecords / Math.max(stats.totalRecords, 1)) * 100).toFixed(1)}% verified`}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Seeds Allocated</CardTitle>
              <Sprout className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">
                {loading ? '...' : stats.totalSeedsAllocated.toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground">
                Total seeds distributed
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Campaign Process Explanation */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-2xl">How the Five Million Trees Campaign Works</CardTitle>
            <CardDescription>
              Understanding the campaign process from application to tree planting
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-primary">1. Organization Application</h3>
                <p className="text-muted-foreground">
                  Organizations apply through our Five Million Trees Campaign application form, 
                  providing details about their capacity, experience, and commitment to tree planting.
                </p>
                
                <h3 className="text-lg font-semibold text-primary">2. Admin Review & Approval</h3>
                <p className="text-muted-foreground">
                  Applications are reviewed by our admin team who assess the organization's 
                  capability and approve suitable candidates for participation.
                </p>
                
                <h3 className="text-lg font-semibold text-primary">3. Organization Access</h3>
                <p className="text-muted-foreground">
                  Once approved, organizations receive access to the tree planting dashboard 
                  where they can manage their allocated seeds and register tree planters.
                </p>
              </div>
              
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-primary">4. Planter Registration</h3>
                <p className="text-muted-foreground">
                  Organizations register individual tree planters who will be responsible 
                  for planting activities and recording their progress.
                </p>
                
                <h3 className="text-lg font-semibold text-primary">5. Tree Planting & Recording</h3>
                <p className="text-muted-foreground">
                  Planters document their tree planting activities with GPS coordinates, 
                  photos, and species information for verification and tracking.
                </p>
                
                <h3 className="text-lg font-semibold text-primary">6. Verification & Tracking</h3>
                <p className="text-muted-foreground">
                  All planting records are verified by our team and contribute to the 
                  overall campaign progress toward the five million tree goal.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Main Article */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-2xl">About the Five Million Trees Initiative</CardTitle>
            <CardDescription>
              A comprehensive reforestation program for environmental sustainability in Kano State
            </CardDescription>
          </CardHeader>
          <CardContent className="prose max-w-none">
            <div className="space-y-6 text-foreground">
              <p className="text-lg leading-relaxed">
                The Five Million Trees Initiative represents Kano State's most ambitious environmental 
                restoration program to date. This transformative campaign aims to plant five million trees 
                across the state, creating a green revolution that will combat desertification, improve air 
                quality, and restore the ecological balance of our region.
              </p>

              <h3 className="text-xl font-semibold">Why Five Million Trees Matter</h3>
              <p>
                Kano State faces significant environmental challenges including desertification, soil erosion, 
                and declining air quality. The Five Million Trees Campaign addresses these challenges head-on 
                by creating a massive carbon sink, restoring degraded lands, and providing long-term 
                environmental benefits for current and future generations.
              </p>

              <h3 className="text-xl font-semibold">Campaign Objectives</h3>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li><strong>Environmental Restoration:</strong> Combat desertification and soil erosion across Kano State</li>
                <li><strong>Climate Action:</strong> Reduce carbon footprint and improve air quality in urban and rural areas</li>
                <li><strong>Economic Opportunities:</strong> Create sustainable livelihood opportunities for local communities</li>
                <li><strong>Biodiversity Conservation:</strong> Enhance wildlife habitat restoration and ecosystem diversity</li>
                <li><strong>Education & Awareness:</strong> Promote environmental consciousness and sustainable practices</li>
                <li><strong>Agricultural Support:</strong> Improve soil fertility and create windbreaks for farming activities</li>
              </ul>

              <h3 className="text-xl font-semibold">The Digital Tracking Revolution</h3>
              <p>
                Our state-of-the-art tracking system sets a new standard for transparency and accountability 
                in environmental restoration projects. Every tree planted is documented with:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li><strong>GPS Coordinates:</strong> Precise location mapping for each planting site</li>
                <li><strong>Species Documentation:</strong> Detailed records of tree species and their characteristics</li>
                <li><strong>Photo Evidence:</strong> Visual documentation of planting activities and growth progress</li>
                <li><strong>Planter Information:</strong> Track individual and organizational contributions</li>
                <li><strong>Verification System:</strong> Multi-level verification to ensure planting authenticity</li>
                <li><strong>Progress Monitoring:</strong> Real-time tracking toward the five million tree goal</li>
              </ul>

              <h3 className="text-xl font-semibold">Community Participation & Impact</h3>
              <p>
                The success of this initiative depends on the active participation of organizations, 
                communities, and individuals across Kano State. Organizations undergo a comprehensive 
                approval process that evaluates their:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Organizational capacity and experience</li>
                <li>Commitment to training and proper planting techniques</li>
                <li>Access to suitable planting sites</li>
                <li>Volunteer mobilization capabilities</li>
                <li>Long-term maintenance and care plans</li>
              </ul>

              <h3 className="text-xl font-semibold">Expected Environmental Impact</h3>
              <p>
                When fully implemented, the Five Million Trees Campaign will deliver transformative 
                environmental benefits including:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li><strong>Carbon Sequestration:</strong> Capture millions of tons of CO2 from the atmosphere</li>
                <li><strong>Soil Restoration:</strong> Prevent erosion and improve soil fertility across the state</li>
                <li><strong>Microclimate Creation:</strong> Establish cooler, more humid conditions that support agriculture</li>
                <li><strong>Water Conservation:</strong> Improve groundwater recharge and reduce surface runoff</li>
                <li><strong>Biodiversity Enhancement:</strong> Create habitats for wildlife and preserve native species</li>
                <li><strong>Economic Benefits:</strong> Generate income through sustainable forestry and eco-tourism</li>
              </ul>

              <p className="text-lg leading-relaxed font-medium">
                Each tree planted represents hope for a greener, more sustainable future. Together, 
                we are not just planting trees – we are planting the seeds of environmental restoration, 
                economic opportunity, and climate resilience for Kano State.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Call to Action */}
        <Card className="bg-gradient-to-r from-green-50 to-emerald-50 border-green-200">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl text-green-800">Participate in the Campaign</CardTitle>
            <CardDescription className="text-green-700">
              Join the Five Million Trees Campaign and make a lasting environmental impact
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center space-y-6">
            <p className="text-green-700 max-w-2xl mx-auto">
              Ready to be part of this historic environmental restoration initiative? 
              Organizations can apply to participate in the campaign, while approved 
              organizations can access their tracking dashboard to manage tree planting activities.
            </p>
            
            <div className="grid md:grid-cols-2 gap-4 max-w-lg mx-auto">
              <div className="bg-white/50 border border-green-300 rounded-lg p-4">
                <h4 className="font-semibold text-green-800 mb-2">New Organizations</h4>
                <p className="text-sm text-green-700 mb-3">
                  Apply to join the Five Million Trees Campaign
                </p>
                <Button asChild variant="outline" size="sm" className="border-green-600 text-green-600 hover:bg-green-50 w-full">
                  <Link to="/programs/five-million-trees-apply">
                    <Eye className="mr-2 h-4 w-4" />
                    Apply Now
                  </Link>
                </Button>
              </div>
              
              <div className="bg-white/50 border border-green-300 rounded-lg p-4">
                <h4 className="font-semibold text-green-800 mb-2">Approved Organizations</h4>
                <p className="text-sm text-green-700 mb-3">
                  Access your tree planting dashboard
                </p>
                <Button asChild size="sm" className="bg-green-600 hover:bg-green-700 w-full">
                  <Link to="/tree-planting-login">
                    <TreePine className="mr-2 h-4 w-4" />
                    Login to Dashboard
                  </Link>
                </Button>
              </div>
            </div>
            
            <div className="text-sm text-green-600">
              <p>Questions about the campaign? Contact our team for more information.</p>
            </div>
          </CardContent>
        </Card>
      </div>
      
      <Footer />
    </div>
  );
};

export default TreePlantingTracker;
