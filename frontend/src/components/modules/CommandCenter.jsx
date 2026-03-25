import { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "sonner";
import {
  MapPin, Calendar, DollarSign, Users, AlertTriangle, CheckCircle, Clock,
  ArrowUpRight, ArrowDownRight, Plus, MoreHorizontal, FileText, Sparkles,
  ClipboardList, X, Loader2, Trash2, Edit2, Check
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { EmptyState } from "@/components/ui/InlineEdit";
import QuickSetupWizard from "@/components/QuickSetupWizard";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const CommandCenter = ({ profile, summary, onRefresh }) => {
  const [tasks, setTasks] = useState([]);
  const [team, setTeam] = useState([]);
  const [budget, setBudget] = useState([]);
  const [showAddTask, setShowAddTask] = useState(false);
  const [showAddTeam, setShowAddTeam] = useState(false);
  const [showEditTask, setShowEditTask] = useState(false);
  const [showEditMember, setShowEditMember] = useState(false);
  const [showQuickSetup, setShowQuickSetup] = useState(false);
  const [newTask, setNewTask] = useState({ title: '', status: 'pending', priority: 'medium', due_date: '' });
  const [newMember, setNewMember] = useState({ name: '', role: '', email: '' });
  const [editingTask, setEditingTask] = useState(null);
  const [editingMember, setEditingMember] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (profile?.profile_id) {
      fetchTasks();
      fetchTeam();
      fetchBudget();
    }
  }, [profile?.profile_id]);

  const fetchTasks = async () => {
    try {
      const response = await axios.get(`${API}/tasks`);
      setTasks(response.data);
    } catch (error) {
      console.error("Error fetching tasks:", error);
    }
  };

  const fetchTeam = async () => {
    try {
      const response = await axios.get(`${API}/team`);
      setTeam(response.data);
    } catch (error) {
      console.error("Error fetching team:", error);
    }
  };

  const fetchBudget = async () => {
    try {
      const response = await axios.get(`${API}/budget`);
      setBudget(response.data);
    } catch (error) {
      console.error("Error fetching budget:", error);
    }
  };

  // Determine phase based on onboarding completion and operational status
  const determinePhase = () => {
    if (!profile?.onboarding_completed) return "concept";
    if (!profile?.location?.address) return "site";
    if (!profile?.operational?.target_open_date) return "construction";
    const targetDate = new Date(profile?.operational?.target_open_date);
    const now = new Date();
    if (targetDate > now) return "opening";
    return "live";
  };

  const currentPhase = determinePhase();
  const phases = [
    { id: "concept", label: "Concept", complete: currentPhase !== "concept" },
    { id: "site", label: "Site", complete: ["construction", "opening", "live"].includes(currentPhase) },
    { id: "construction", label: "Construction", complete: ["opening", "live"].includes(currentPhase) },
    { id: "opening", label: "Opening", complete: currentPhase === "live" },
    { id: "live", label: "Live", complete: currentPhase === "live" },
  ];

  const currentPhaseIndex = phases.findIndex(p => p.id === currentPhase);

  // Add task handler
  const handleAddTask = async () => {
    if (!newTask.title.trim()) {
      toast.error('Please enter a task title');
      return;
    }
    setSaving(true);
    try {
      await axios.post(`${API}/tasks`, {
        ...newTask,
        project_id: profile?.profile_id || 'default'
      });
      toast.success('Task added');
      setShowAddTask(false);
      setNewTask({ title: '', status: 'pending', priority: 'medium', due_date: '' });
      fetchTasks();
    } catch (error) {
      toast.error('Failed to add task');
    } finally {
      setSaving(false);
    }
  };

  // Add team member handler
  const handleAddTeamMember = async () => {
    if (!newMember.name.trim() || !newMember.role.trim()) {
      toast.error('Please enter name and role');
      return;
    }
    setSaving(true);
    try {
      await axios.post(`${API}/team`, newMember);
      toast.success('Team member added');
      setShowAddTeam(false);
      setNewMember({ name: '', role: '', email: '' });
      fetchTeam();
    } catch (error) {
      toast.error('Failed to add team member');
    } finally {
      setSaving(false);
    }
  };

  // Update task handler
  const handleUpdateTask = async () => {
    if (!editingTask?.title?.trim()) {
      toast.error('Please enter a task title');
      return;
    }
    setSaving(true);
    try {
      await axios.put(`${API}/tasks/${editingTask.task_id}`, editingTask);
      toast.success('Task updated');
      setShowEditTask(false);
      setEditingTask(null);
      fetchTasks();
    } catch (error) {
      toast.error('Failed to update task');
    } finally {
      setSaving(false);
    }
  };

  // Delete task handler
  const handleDeleteTask = async (taskId) => {
    try {
      await axios.delete(`${API}/tasks/${taskId}`);
      toast.success('Task deleted');
      fetchTasks();
    } catch (error) {
      toast.error('Failed to delete task');
    }
  };

  // Mark task complete handler
  const handleToggleTaskComplete = async (task) => {
    try {
      const newStatus = task.status === 'completed' ? 'pending' : 'completed';
      await axios.put(`${API}/tasks/${task.task_id}`, { status: newStatus });
      toast.success(newStatus === 'completed' ? 'Task completed!' : 'Task reopened');
      fetchTasks();
    } catch (error) {
      toast.error('Failed to update task');
    }
  };

  // Update team member handler
  const handleUpdateTeamMember = async () => {
    if (!editingMember?.name?.trim() || !editingMember?.role?.trim()) {
      toast.error('Please enter name and role');
      return;
    }
    setSaving(true);
    try {
      await axios.put(`${API}/team/${editingMember.member_id}`, editingMember);
      toast.success('Team member updated');
      setShowEditMember(false);
      setEditingMember(null);
      fetchTeam();
    } catch (error) {
      toast.error('Failed to update team member');
    } finally {
      setSaving(false);
    }
  };

  // Delete team member handler
  const handleDeleteTeamMember = async (memberId) => {
    try {
      await axios.delete(`${API}/team/${memberId}`);
      toast.success('Team member removed');
      fetchTeam();
    } catch (error) {
      toast.error('Failed to remove team member');
    }
  };

  // Check if we have any data
  const hasData = tasks.length > 0 || team.length > 0 || budget.length > 0;

  // Use actual data, not sample data
  const displayTasks = tasks;
  const displayTeam = team;
  const displayBudget = budget.length > 0 ? budget : [];

  const totalBudget = displayBudget.reduce((acc, item) => acc + (item.planned || 0), 0) || 
                      profile?.financial?.total_budget || 0;
  const totalSpent = displayBudget.reduce((acc, item) => acc + (item.spent || 0), 0);
  const variance = totalBudget - totalSpent;

  const getStatusBadge = (status) => {
    switch (status) {
      case "urgent":
        return <Badge className="badge-fire">Urgent</Badge>;
      case "active":
        return <Badge className="badge-blue">Active</Badge>;
      case "pending":
        return <Badge className="badge-amber">Pending</Badge>;
      case "completed":
        return <Badge className="badge-green">Completed</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getAvatarColor = (color) => {
    const colors = {
      purple: "bg-gradient-to-br from-purple-600 to-purple-800",
      cyan: "bg-gradient-to-br from-cyan-500 to-cyan-700",
      amber: "bg-gradient-to-br from-amber-500 to-amber-700",
      emerald: "bg-gradient-to-br from-emerald-500 to-emerald-700",
    };
    return colors[color] || colors.purple;
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Project Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-heading font-bold text-zinc-100">
            {profile?.concept?.restaurant_name || "Your Restaurant"}
          </h1>
          <div className="flex items-center gap-4 mt-2 text-sm text-zinc-400">
            <span className="flex items-center gap-1">
              <MapPin className="w-4 h-4" />
              {profile?.location?.city && profile?.location?.state 
                ? `${profile.location.city}, ${profile.location.state}` 
                : "Location TBD"}
            </span>
            <span className="flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              Phase: {currentPhase.charAt(0).toUpperCase() + currentPhase.slice(1)}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right">
            <div className="text-3xl font-heading font-bold text-[#d4af37]">
              {profile?.onboarding_completed ? Math.min(100, 15 + (currentPhaseIndex * 20)) : 5}%
            </div>
            <div className="text-xs text-zinc-500 uppercase tracking-wider">Complete</div>
          </div>
        </div>
      </div>

      {/* Phase Stepper */}
      <Card className="bg-[#18181b] border-zinc-800/50">
        <CardContent className="p-6">
          <div className="flex items-center justify-between relative">
            {/* Progress line */}
            <div className="absolute top-5 left-0 right-0 h-0.5 bg-zinc-800" />
            <div 
              className="absolute top-5 left-0 h-0.5 bg-[#d4af37] transition-all duration-500"
              style={{ width: `${(currentPhaseIndex / (phases.length - 1)) * 100}%` }}
            />
            
            {phases.map((phase, index) => (
              <div key={phase.id} className="relative flex flex-col items-center z-10">
                <div
                  data-testid={`phase-${phase.id}`}
                  className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
                    index <= currentPhaseIndex
                      ? "bg-[#d4af37] text-zinc-900"
                      : "bg-zinc-800 text-zinc-500"
                  }`}
                >
                  {index < currentPhaseIndex ? (
                    <CheckCircle className="w-5 h-5" />
                  ) : (
                    <span className="text-sm font-bold">{index + 1}</span>
                  )}
                </div>
                <span className={`mt-2 text-xs font-medium ${
                  index <= currentPhaseIndex ? "text-zinc-100" : "text-zinc-500"
                }`}>
                  {phase.label}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column - Tasks */}
        <div className="lg:col-span-8 space-y-6">
          {/* Critical Path Tasks */}
          <Card className="bg-[#18181b] border-zinc-800/50">
            <CardHeader className="flex flex-row items-center justify-between pb-4">
              <CardTitle className="text-lg font-heading text-zinc-100">
                Critical Path Tasks
              </CardTitle>
              <div className="flex gap-2">
                {!hasData && (
                  <Button
                    data-testid="quick-setup-btn"
                    size="sm"
                    onClick={() => setShowQuickSetup(true)}
                    className="bg-[#d4af37] text-zinc-900 hover:bg-[#c4a030]"
                  >
                    <Sparkles className="w-4 h-4 mr-1" />
                    Quick Setup
                  </Button>
                )}
                <Button
                  data-testid="add-task-btn"
                  size="sm"
                  onClick={() => setShowAddTask(true)}
                  className="bg-zinc-800 text-zinc-100 hover:bg-zinc-700"
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Add Task
                </Button>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              {displayTasks.length === 0 ? (
                <EmptyState 
                  icon={ClipboardList}
                  title="No tasks yet"
                  description="Add your first task to start tracking your restaurant project progress"
                  action={() => setShowAddTask(true)}
                  actionLabel="Add First Task"
                />
              ) : (
                <div className="space-y-3">
                  {displayTasks.map((task) => (
                    <div
                      key={task.task_id}
                      data-testid={`task-${task.task_id}`}
                      className={`flex items-center justify-between p-4 rounded-lg bg-zinc-900/50 hover:bg-zinc-900 transition-colors group ${task.status === 'completed' ? 'opacity-60' : ''}`}
                    >
                      <div className="flex items-center gap-4">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleToggleTaskComplete(task)}
                          className={`h-6 w-6 rounded-full border ${task.status === 'completed' ? 'bg-emerald-500/20 border-emerald-500 text-emerald-500' : 'border-zinc-600 text-zinc-500 hover:border-zinc-400'}`}
                        >
                          {task.status === 'completed' && <Check className="w-3 h-3" />}
                        </Button>
                        {getStatusBadge(task.status)}
                        <div>
                          <p className={`text-sm font-medium ${task.status === 'completed' ? 'line-through text-zinc-500' : 'text-zinc-100'}`}>{task.title}</p>
                          <p className="text-xs text-zinc-500">{task.priority} priority</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-zinc-500">{task.due_date || 'No date'}</span>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="opacity-0 group-hover:opacity-100 transition-opacity text-zinc-400 hover:text-zinc-100 h-8 w-8"
                            >
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent className="bg-zinc-900 border-zinc-800">
                            <DropdownMenuItem
                              onClick={() => { setEditingTask(task); setShowEditTask(true); }}
                              className="text-zinc-100 focus:bg-zinc-800"
                            >
                              <Edit2 className="w-4 h-4 mr-2" /> Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleDeleteTask(task.task_id)}
                              className="text-red-400 focus:bg-zinc-800"
                            >
                              <Trash2 className="w-4 h-4 mr-2" /> Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Budget & Team */}
        <div className="lg:col-span-4 space-y-6">
          {/* Budget Health */}
          <Card className="bg-[#18181b] border-zinc-800/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-heading text-zinc-100 flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-[#d4af37]" />
                Budget Health
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div>
                  <p className="text-xs text-zinc-500 uppercase tracking-wider mb-1">Total Budget</p>
                  <p className="text-2xl font-heading font-bold text-zinc-100">
                    ${(totalBudget / 1000).toFixed(0)}K
                  </p>
                </div>
                <div>
                  <p className="text-xs text-zinc-500 uppercase tracking-wider mb-1">Spent</p>
                  <p className={`text-2xl font-heading font-bold flex items-center gap-1 ${
                    totalSpent <= totalBudget ? "text-green-500" : "text-red-500"
                  }`}>
                    ${(totalSpent / 1000).toFixed(0)}K
                  </p>
                </div>
              </div>

              {displayBudget.length > 0 ? (
                <div className="space-y-4">
                  {displayBudget.map((item) => (
                    <div key={item.budget_id}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-zinc-400">{item.category}</span>
                        <span className="text-zinc-100">
                          ${((item.spent || 0) / 1000).toFixed(0)}K / ${((item.planned || 0) / 1000).toFixed(0)}K
                        </span>
                      </div>
                      <Progress
                        value={item.planned > 0 ? ((item.spent || 0) / item.planned) * 100 : 0}
                        className="h-2 bg-zinc-800"
                      />
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-zinc-500 text-center py-4">
                  No budget items yet. Use Quick Setup to add sample data.
                </p>
              )}

              <Button
                data-testid="generate-report-btn"
                className="w-full mt-6 bg-zinc-800 text-zinc-100 hover:bg-zinc-700"
              >
                <FileText className="w-4 h-4 mr-2" />
                Generate Financial Report
              </Button>
            </CardContent>
          </Card>

          {/* On-Site Team */}
          <Card className="bg-[#18181b] border-zinc-800/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-heading text-zinc-100 flex items-center gap-2">
                <Users className="w-5 h-5 text-azure" />
                On-Site Team
              </CardTitle>
            </CardHeader>
            <CardContent>
              {displayTeam.length > 0 ? (
                <div className="grid grid-cols-1 gap-3">
                  {displayTeam.map((member) => (
                    <div
                      key={member.member_id}
                      data-testid={`team-member-${member.member_id}`}
                      className="flex items-center justify-between p-3 rounded-lg bg-zinc-900/50 hover:bg-zinc-900 transition-colors group"
                    >
                      <div className="flex items-center gap-3">
                        <Avatar className="w-10 h-10">
                          <AvatarFallback className={`${getAvatarColor(member.avatar_color)} text-white text-sm font-medium`}>
                            {member.name.split(" ").map(n => n[0]).join("")}
                          </AvatarFallback>
                        </Avatar>
                        <div className="overflow-hidden">
                          <p className="text-sm font-medium text-zinc-100 truncate">{member.name}</p>
                          <p className="text-xs text-zinc-500 truncate">{member.role}</p>
                        </div>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="opacity-0 group-hover:opacity-100 transition-opacity text-zinc-400 hover:text-zinc-100 h-8 w-8"
                          >
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="bg-zinc-900 border-zinc-800">
                          <DropdownMenuItem
                            onClick={() => { setEditingMember(member); setShowEditMember(true); }}
                            className="text-zinc-100 focus:bg-zinc-800"
                          >
                            <Edit2 className="w-4 h-4 mr-2" /> Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleDeleteTeamMember(member.member_id)}
                            className="text-red-400 focus:bg-zinc-800"
                          >
                            <Trash2 className="w-4 h-4 mr-2" /> Remove
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-zinc-500 text-center py-4">
                  No team members yet
                </p>
              )}

              <Button
                data-testid="add-expert-btn"
                variant="outline"
                onClick={() => setShowAddTeam(true)}
                className="w-full mt-4 border-dashed border-zinc-700 text-zinc-400 hover:text-zinc-100 hover:border-zinc-600 hover:bg-zinc-800/50"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Team Member
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Add Task Dialog */}
      <Dialog open={showAddTask} onOpenChange={setShowAddTask}>
        <DialogContent className="bg-zinc-900 border-zinc-800">
          <DialogHeader>
            <DialogTitle className="text-zinc-100">Add New Task</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Task Title *</Label>
              <Input
                value={newTask.title}
                onChange={(e) => setNewTask(prev => ({ ...prev, title: e.target.value }))}
                placeholder="e.g., Finalize kitchen layout"
                className="bg-zinc-800 border-zinc-700"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Status</Label>
                <Select
                  value={newTask.status}
                  onValueChange={(value) => setNewTask(prev => ({ ...prev, status: value }))}
                >
                  <SelectTrigger className="bg-zinc-800 border-zinc-700">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-zinc-800 border-zinc-700">
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Priority</Label>
                <Select
                  value={newTask.priority}
                  onValueChange={(value) => setNewTask(prev => ({ ...prev, priority: value }))}
                >
                  <SelectTrigger className="bg-zinc-800 border-zinc-700">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-zinc-800 border-zinc-700">
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Due Date</Label>
              <Input
                type="date"
                value={newTask.due_date}
                onChange={(e) => setNewTask(prev => ({ ...prev, due_date: e.target.value }))}
                className="bg-zinc-800 border-zinc-700"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddTask(false)} className="border-zinc-700">
              Cancel
            </Button>
            <Button onClick={handleAddTask} disabled={saving} className="bg-[#d4af37] text-zinc-900">
              {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
              Add Task
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Team Member Dialog */}
      <Dialog open={showAddTeam} onOpenChange={setShowAddTeam}>
        <DialogContent className="bg-zinc-900 border-zinc-800">
          <DialogHeader>
            <DialogTitle className="text-zinc-100">Add Team Member</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Name *</Label>
              <Input
                value={newMember.name}
                onChange={(e) => setNewMember(prev => ({ ...prev, name: e.target.value }))}
                placeholder="e.g., John Smith"
                className="bg-zinc-800 border-zinc-700"
              />
            </div>
            <div className="space-y-2">
              <Label>Role *</Label>
              <Input
                value={newMember.role}
                onChange={(e) => setNewMember(prev => ({ ...prev, role: e.target.value }))}
                placeholder="e.g., Head Chef"
                className="bg-zinc-800 border-zinc-700"
              />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input
                type="email"
                value={newMember.email}
                onChange={(e) => setNewMember(prev => ({ ...prev, email: e.target.value }))}
                placeholder="john@example.com"
                className="bg-zinc-800 border-zinc-700"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddTeam(false)} className="border-zinc-700">
              Cancel
            </Button>
            <Button onClick={handleAddTeamMember} disabled={saving} className="bg-[#d4af37] text-zinc-900">
              {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
              Add Member
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Quick Setup Wizard */}
      <QuickSetupWizard
        profile={profile}
        open={showQuickSetup}
        onOpenChange={setShowQuickSetup}
        onComplete={() => {
          fetchTasks();
          fetchTeam();
          fetchBudget();
          onRefresh?.();
        }}
      />

      {/* Edit Task Dialog */}
      <Dialog open={showEditTask} onOpenChange={setShowEditTask}>
        <DialogContent className="bg-zinc-900 border-zinc-800">
          <DialogHeader>
            <DialogTitle className="text-zinc-100">Edit Task</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Task Title *</Label>
              <Input
                value={editingTask?.title || ''}
                onChange={(e) => setEditingTask(prev => ({ ...prev, title: e.target.value }))}
                className="bg-zinc-800 border-zinc-700"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Status</Label>
                <Select
                  value={editingTask?.status || 'pending'}
                  onValueChange={(value) => setEditingTask(prev => ({ ...prev, status: value }))}
                >
                  <SelectTrigger className="bg-zinc-800 border-zinc-700">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-zinc-800 border-zinc-700">
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Priority</Label>
                <Select
                  value={editingTask?.priority || 'medium'}
                  onValueChange={(value) => setEditingTask(prev => ({ ...prev, priority: value }))}
                >
                  <SelectTrigger className="bg-zinc-800 border-zinc-700">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-zinc-800 border-zinc-700">
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Due Date</Label>
              <Input
                type="date"
                value={editingTask?.due_date || ''}
                onChange={(e) => setEditingTask(prev => ({ ...prev, due_date: e.target.value }))}
                className="bg-zinc-800 border-zinc-700"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditTask(false)} className="border-zinc-700">
              Cancel
            </Button>
            <Button onClick={handleUpdateTask} disabled={saving} className="bg-[#d4af37] text-zinc-900">
              {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Team Member Dialog */}
      <Dialog open={showEditMember} onOpenChange={setShowEditMember}>
        <DialogContent className="bg-zinc-900 border-zinc-800">
          <DialogHeader>
            <DialogTitle className="text-zinc-100">Edit Team Member</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Name *</Label>
              <Input
                value={editingMember?.name || ''}
                onChange={(e) => setEditingMember(prev => ({ ...prev, name: e.target.value }))}
                className="bg-zinc-800 border-zinc-700"
              />
            </div>
            <div className="space-y-2">
              <Label>Role *</Label>
              <Input
                value={editingMember?.role || ''}
                onChange={(e) => setEditingMember(prev => ({ ...prev, role: e.target.value }))}
                className="bg-zinc-800 border-zinc-700"
              />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input
                type="email"
                value={editingMember?.email || ''}
                onChange={(e) => setEditingMember(prev => ({ ...prev, email: e.target.value }))}
                className="bg-zinc-800 border-zinc-700"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditMember(false)} className="border-zinc-700">
              Cancel
            </Button>
            <Button onClick={handleUpdateTeamMember} disabled={saving} className="bg-[#d4af37] text-zinc-900">
              {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CommandCenter;
