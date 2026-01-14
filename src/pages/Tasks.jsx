import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Link, useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { format, isPast, isToday, parseISO } from 'date-fns';
import { 
  FileText, Search, Plus, Building2, Calendar,
  MoreVertical, CheckCircle2, Clock, AlertTriangle,
  User, Filter
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import PageHeader from '@/components/shared/PageHeader';
import StatusBadge from '@/components/shared/StatusBadge';
import EmptyState from '@/components/shared/EmptyState';

export default function Tasks() {
  const navigate = useNavigate();
  const [tasks, setTasks] = useState([]);
  const [properties, setProperties] = useState([]);
  const [clients, setClients] = useState([]);
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('pending');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [companyId, setCompanyId] = useState(null);
  
  // New task dialog
  const [showNewDialog, setShowNewDialog] = useState(false);
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    property_id: '',
    priority: 'medium',
    type: 'custom',
    due_date: format(new Date(), 'yyyy-MM-dd'),
    assigned_to: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const user = await base44.auth.me();
      const members = await base44.entities.CompanyMember.filter({ user_email: user.email });
      
      if (members.length > 0) {
        const cId = members[0].company_id;
        setCompanyId(cId);
        
        const [tasksData, propertiesData, clientsData, staffData] = await Promise.all([
          base44.entities.Task.filter({ company_id: cId }, '-created_date'),
          base44.entities.Property.filter({ company_id: cId, is_active: true }),
          base44.entities.Client.filter({ company_id: cId }),
          base44.entities.CompanyMember.filter({ company_id: cId, is_active: true })
        ]);
        
        setTasks(tasksData);
        setProperties(propertiesData);
        setClients(clientsData);
        setStaff(staffData);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getProperty = (propertyId) => properties.find(p => p.id === propertyId);
  const getClient = (clientId) => clients.find(c => c.id === clientId);

  const filteredTasks = tasks.filter(task => {
    const matchesSearch = task.title?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || task.status === statusFilter;
    const matchesPriority = priorityFilter === 'all' || task.priority === priorityFilter;
    return matchesSearch && matchesStatus && matchesPriority;
  });

  const handleCreateTask = async () => {
    if (!companyId || !newTask.title) return;

    const property = getProperty(newTask.property_id);
    const staffMember = staff.find(s => s.user_email === newTask.assigned_to);

    const data = {
      company_id: companyId,
      property_id: newTask.property_id || null,
      client_id: property?.client_id || null,
      title: newTask.title,
      description: newTask.description,
      priority: newTask.priority,
      type: newTask.type,
      due_date: newTask.due_date || null,
      assigned_to: newTask.assigned_to || null,
      assigned_to_name: staffMember?.user_name || null,
      status: 'pending'
    };

    await base44.entities.Task.create(data);
    setShowNewDialog(false);
    setNewTask({
      title: '',
      description: '',
      property_id: '',
      priority: 'medium',
      type: 'custom',
      due_date: format(new Date(), 'yyyy-MM-dd'),
      assigned_to: ''
    });
    loadData();
  };

  const toggleTaskComplete = async (task) => {
    const newStatus = task.status === 'completed' ? 'pending' : 'completed';
    await base44.entities.Task.update(task.id, { 
      status: newStatus,
      completed_at: newStatus === 'completed' ? new Date().toISOString() : null
    });
    loadData();
  };

  const isOverdue = (task) => {
    if (!task.due_date || task.status === 'completed') return false;
    return isPast(parseISO(task.due_date)) && !isToday(parseISO(task.due_date));
  };

  const getDueDateLabel = (dateStr) => {
    if (!dateStr) return null;
    const date = parseISO(dateStr);
    if (isToday(date)) return 'Today';
    if (isPast(date)) return 'Overdue';
    return format(date, 'MMM d');
  };

  return (
    <div>
      <PageHeader
        title="Tasks"
        subtitle={`${tasks.filter(t => t.status === 'pending').length} pending tasks`}
        action={() => setShowNewDialog(true)}
        actionLabel="Add Task"
      />

      {/* Filters */}
      <Card className="mb-6 p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Search tasks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-36">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="in_progress">In Progress</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
            </SelectContent>
          </Select>
          <Select value={priorityFilter} onValueChange={setPriorityFilter}>
            <SelectTrigger className="w-full sm:w-36">
              <SelectValue placeholder="Priority" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Priority</SelectItem>
              <SelectItem value="urgent">Urgent</SelectItem>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="low">Low</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </Card>

      {/* Tasks List */}
      {tasks.length === 0 && !loading ? (
        <Card>
          <EmptyState
            icon={FileText}
            title="No tasks yet"
            description="Create tasks to track work that needs to be done."
            action={() => setShowNewDialog(true)}
            actionLabel="Add Task"
          />
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredTasks.map((task) => {
            const property = getProperty(task.property_id);
            const overdue = isOverdue(task);
            
            return (
              <Card 
                key={task.id} 
                className={`${
                  task.status === 'completed' ? 'opacity-60' : ''
                } ${overdue ? 'border-red-200' : ''}`}
              >
                <CardContent className="p-4">
                  <div className="flex items-start gap-4">
                    <Checkbox
                      checked={task.status === 'completed'}
                      onCheckedChange={() => toggleTaskComplete(task)}
                      className="mt-1"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h3 className={`font-medium ${task.status === 'completed' ? 'line-through text-slate-500' : 'text-slate-900'}`}>
                            {task.title}
                          </h3>
                          {task.description && (
                            <p className="text-sm text-slate-500 mt-1 line-clamp-2">{task.description}</p>
                          )}
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <StatusBadge status={task.priority} />
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => toggleTaskComplete(task)}>
                                <CheckCircle2 className="h-4 w-4 mr-2" />
                                {task.status === 'completed' ? 'Mark Pending' : 'Mark Complete'}
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                      <div className="flex flex-wrap items-center gap-3 mt-3 text-sm text-slate-500">
                        {property && (
                          <div className="flex items-center gap-1">
                            <Building2 className="h-3.5 w-3.5" />
                            {property.name || property.address}
                          </div>
                        )}
                        {task.due_date && (
                          <div className={`flex items-center gap-1 ${overdue ? 'text-red-600 font-medium' : ''}`}>
                            {overdue && <AlertTriangle className="h-3.5 w-3.5" />}
                            <Calendar className="h-3.5 w-3.5" />
                            {getDueDateLabel(task.due_date)}
                          </div>
                        )}
                        {task.assigned_to_name && (
                          <div className="flex items-center gap-1">
                            <User className="h-3.5 w-3.5" />
                            {task.assigned_to_name}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* New Task Dialog */}
      <Dialog open={showNewDialog} onOpenChange={setShowNewDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Create Task</DialogTitle>
            <DialogDescription>
              Add a new task or work item
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div>
              <Label>Title *</Label>
              <Input
                value={newTask.title}
                onChange={(e) => setNewTask(prev => ({ ...prev, title: e.target.value }))}
                placeholder="What needs to be done?"
              />
            </div>

            <div>
              <Label>Description</Label>
              <Textarea
                value={newTask.description}
                onChange={(e) => setNewTask(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Add details..."
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Priority</Label>
                <Select
                  value={newTask.priority}
                  onValueChange={(value) => setNewTask(prev => ({ ...prev, priority: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Due Date</Label>
                <Input
                  type="date"
                  value={newTask.due_date}
                  onChange={(e) => setNewTask(prev => ({ ...prev, due_date: e.target.value }))}
                />
              </div>
            </div>

            <div>
              <Label>Property (optional)</Label>
              <Select
                value={newTask.property_id}
                onValueChange={(value) => setNewTask(prev => ({ ...prev, property_id: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select property" />
                </SelectTrigger>
                <SelectContent>
                  {properties.map((property) => (
                    <SelectItem key={property.id} value={property.id}>
                      {property.name || property.address}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Assign To</Label>
              <Select
                value={newTask.assigned_to}
                onValueChange={(value) => setNewTask(prev => ({ ...prev, assigned_to: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select staff member" />
                </SelectTrigger>
                <SelectContent>
                  {staff.map((member) => (
                    <SelectItem key={member.id} value={member.user_email}>
                      {member.user_name || member.user_email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Type</Label>
              <Select
                value={newTask.type}
                onValueChange={(value) => setNewTask(prev => ({ ...prev, type: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="custom">General Task</SelectItem>
                  <SelectItem value="maintenance">Maintenance</SelectItem>
                  <SelectItem value="repair">Repair</SelectItem>
                  <SelectItem value="arrival_prep">Arrival Prep</SelectItem>
                  <SelectItem value="departure">Departure</SelectItem>
                  <SelectItem value="storm_prep">Storm Prep</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNewDialog(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleCreateTask}
              disabled={!newTask.title}
              className="bg-slate-900 hover:bg-slate-800"
            >
              Create Task
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}