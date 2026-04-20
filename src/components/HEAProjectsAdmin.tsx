import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Edit, Send, FileText, RefreshCw, Loader2, Check, Trash2, Download, Mail } from "lucide-react";

interface HEAProject {
  id: string;
  full_name: string;
  email: string;
  address: string | null;
  price: string;
  terms: string | null;
  details: string | null;
  number_of_revisions: number;
  status: string;
  assigned_producer_id: string | null;
  contract_signed: boolean;
  contract_signed_at: string | null;
  contract_signature_name: string | null;
  contract_token: string | null;
  receipt_sent: boolean;
  created_at: string;
  updated_at: string;
}

interface Producer {
  id: string;
  name: string;
  email: string | null;
}

const statusOptions = [
  { value: "draft", label: "Draft" },
  { value: "contract_sent", label: "Contract Sent" },
  { value: "contract_signed", label: "Contract Signed" },
  { value: "in_progress", label: "In Progress" },
  { value: "delivered", label: "Delivered" },
  { value: "completed", label: "Completed" },
];

const statusColors: Record<string, string> = {
  draft: "bg-gray-500",
  contract_sent: "bg-yellow-500",
  contract_signed: "bg-blue-500",
  in_progress: "bg-purple-500",
  delivered: "bg-green-500",
  completed: "bg-emerald-600",
};

export const HEAProjectsAdmin = () => {
  const { toast } = useToast();
  const [projects, setProjects] = useState<HEAProject[]>([]);
  const [producers, setProducers] = useState<Producer[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [editingProject, setEditingProject] = useState<HEAProject | null>(null);
  const [saving, setSaving] = useState(false);
  const [sendingContract, setSendingContract] = useState<string | null>(null);
  const [sendingSignedContract, setSendingSignedContract] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    full_name: "",
    email: "",
    address: "",
    price: "",
    terms: "",
    details: "",
    number_of_revisions: 0,
    assigned_producer_id: "",
    status: "draft",
  });

  useEffect(() => {
    fetchProjects();
    fetchProducers();
  }, []);

  const fetchProjects = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("hea_projects")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching HEA projects:", error);
      toast({ title: "Error", description: "Failed to load projects", variant: "destructive" });
    } else {
      setProjects((data as unknown as HEAProject[]) || []);
    }
    setLoading(false);
  };

  const fetchProducers = async () => {
    // Only fetch producers who are admins
    const { data: adminIds } = await supabase.rpc("get_admin_producer_ids");
    if (adminIds && adminIds.length > 0) {
      const ids = adminIds.map((r: any) => r);
      const { data } = await supabase
        .from("producers")
        .select("id, name, email")
        .in("id", ids);
      if (data) setProducers(data);
    } else {
      setProducers([]);
    }
  };

  const openNewProject = () => {
    setEditingProject(null);
    setFormData({
      full_name: "",
      email: "",
      address: "",
      price: "",
      terms: "This agreement is between Hecho En America (\"HEA\") and the Client for music production services. The Client agrees to the terms outlined herein including project scope, payment, and delivery timeline.",
      details: "",
      number_of_revisions: 0,
      assigned_producer_id: "",
      status: "draft",
    });
    setShowDialog(true);
  };

  const openEditProject = (project: HEAProject) => {
    setEditingProject(project);
    setFormData({
      full_name: project.full_name,
      email: project.email,
      address: project.address || "",
      price: project.price,
      terms: project.terms || "",
      details: project.details || "",
      number_of_revisions: project.number_of_revisions,
      assigned_producer_id: project.assigned_producer_id || "",
      status: project.status,
    });
    setShowDialog(true);
  };

  const handleSave = async () => {
    if (!formData.full_name || !formData.email || !formData.price) {
      toast({ title: "Missing fields", description: "Name, email, and price are required.", variant: "destructive" });
      return;
    }

    setSaving(true);
    const payload = {
      full_name: formData.full_name,
      email: formData.email,
      address: formData.address || null,
      price: formData.price,
      terms: formData.terms || null,
      details: formData.details || null,
      number_of_revisions: formData.number_of_revisions,
      assigned_producer_id: formData.assigned_producer_id || null,
      status: formData.status,
    };

    let error;
    if (editingProject) {
      ({ error } = await supabase.from("hea_projects").update(payload as any).eq("id", editingProject.id));
    } else {
      // Generate a contract token for new projects
      const token = crypto.randomUUID();
      ({ error } = await supabase.from("hea_projects").insert({ ...payload, contract_token: token } as any));
    }

    if (error) {
      console.error("Error saving project:", error);
      toast({ title: "Error", description: "Failed to save project", variant: "destructive" });
    } else {
      toast({ title: "Success", description: editingProject ? "Project updated" : "Project created" });
      setShowDialog(false);
      fetchProjects();
    }
    setSaving(false);
  };

  const handleSendContract = async (project: HEAProject) => {
    setSendingContract(project.id);
    try {
      const { data, error } = await supabase.functions.invoke("send-hea-contract", {
        body: {
          projectId: project.id,
        },
      });

      if (error) throw error;

      toast({ title: "Contract Sent", description: `Contract and receipt emailed to ${project.email}` });
      fetchProjects();
    } catch (err: any) {
      console.error("Error sending contract:", err);
      toast({ title: "Error", description: "Failed to send contract email", variant: "destructive" });
    } finally {
      setSendingContract(null);
    }
  };

  const handleDownloadContract = (project: HEAProject) => {
    const producerName = getProducerName(project.assigned_producer_id);
    const signedDate = project.contract_signed_at
      ? new Date(project.contract_signed_at).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })
      : "";

    const html = `<!DOCTYPE html>
<html><head><meta charset="utf-8"/><title>HEA Contract - ${project.full_name}</title>
<style>
  body{font-family:Arial,Helvetica,sans-serif;margin:40px;color:#222;line-height:1.6}
  h1{font-size:24px;margin-bottom:4px}h2{font-size:16px;margin-top:24px;border-bottom:1px solid #ccc;padding-bottom:4px}
  table{width:100%;border-collapse:collapse;margin:12px 0}td{padding:6px 0;font-size:14px}
  .label{color:#666;width:140px}.sig-box{border:1px solid #ccc;border-radius:8px;padding:16px;margin-top:24px;background:#f9f9f9}
  .footer{margin-top:40px;font-size:12px;color:#888;text-align:center;border-top:1px solid #eee;padding-top:12px}
  @media print{body{margin:20px}button{display:none!important}}
</style></head><body>
<h1>HECHO EN AMERICA</h1>
<p style="color:#666;font-size:14px;">Music Production Contract & Receipt</p>
<h2>Project Details</h2>
<table>
  <tr><td class="label">Client:</td><td>${project.full_name}</td></tr>
  <tr><td class="label">Email:</td><td>${project.email}</td></tr>
  ${project.address ? `<tr><td class="label">Address:</td><td>${project.address}</td></tr>` : ""}
  <tr><td class="label">Producer:</td><td>${producerName}</td></tr>
  <tr><td class="label">Revisions:</td><td>${project.number_of_revisions}</td></tr>
</table>
<h2>Receipt</h2>
<table>
  <tr style="border-bottom:1px solid #ddd"><td>Music Production Services</td><td style="text-align:right">$${project.price}</td></tr>
  <tr><td><strong>Total</strong></td><td style="text-align:right"><strong>$${project.price}</strong></td></tr>
</table>
${project.details ? `<h2>Scope of Work</h2><p style="white-space:pre-wrap">${project.details}</p>` : ""}
${project.terms ? `<h2>Terms & Conditions</h2><p style="white-space:pre-wrap;font-size:13px">${project.terms}</p>` : ""}
<div class="sig-box">
  <h2 style="border:none;margin-top:0">Signature</h2>
  <p><strong>Signed by:</strong> ${project.contract_signature_name || "—"}</p>
  <p><strong>Date:</strong> ${signedDate}</p>
  <p style="color:green;font-weight:bold">✓ Contract Electronically Signed</p>
</div>
<div class="footer">© ${new Date().getFullYear()} Hecho En America. All rights reserved. • team@hechoenamericastudio.com</div>
</body></html>`;

    const printWindow = window.open("", "_blank");
    if (printWindow) {
      printWindow.document.write(html);
      printWindow.document.close();
      setTimeout(() => printWindow.print(), 500);
    }
  };

  const handleSendSignedContract = async (project: HEAProject) => {
    setSendingSignedContract(project.id);
    try {
      const { error } = await supabase.functions.invoke("send-hea-contract", {
        body: { projectId: project.id, sendSigned: true },
      });
      if (error) throw error;
      toast({ title: "Sent", description: `Signed contract emailed to ${project.email}` });
    } catch (err: any) {
      console.error("Error sending signed contract:", err);
      toast({ title: "Error", description: "Failed to send signed contract", variant: "destructive" });
    } finally {
      setSendingSignedContract(null);
    }
  };

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    const { error } = await supabase.from("hea_projects").delete().eq("id", id);
    if (error) {
      toast({ title: "Error", description: "Failed to delete project", variant: "destructive" });
    } else {
      toast({ title: "Deleted", description: "Project removed" });
      fetchProjects();
    }
    setDeletingId(null);
  };

  const getProducerName = (id: string | null) => {
    if (!id) return "Unassigned";
    return producers.find((p) => p.id === id)?.name || "Unknown";
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              HEA Projects
            </CardTitle>
            <CardDescription>
              Create and manage direct client projects with contracts
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={fetchProjects}>
              <RefreshCw className="h-4 w-4 mr-1" />
              Refresh
            </Button>
            <Button size="sm" onClick={openNewProject}>
              <Plus className="h-4 w-4 mr-1" />
              New Project
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : projects.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">No HEA projects yet. Click "New Project" to create one.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Client</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Revisions</TableHead>
                <TableHead>Producer</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Contract</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {projects.map((project) => (
                <TableRow key={project.id}>
                  <TableCell>
                    <div>
                      <p className="font-medium">{project.full_name}</p>
                      <p className="text-xs text-muted-foreground">{project.email}</p>
                    </div>
                  </TableCell>
                  <TableCell>${project.price}</TableCell>
                  <TableCell>{project.number_of_revisions}</TableCell>
                  <TableCell>{getProducerName(project.assigned_producer_id)}</TableCell>
                  <TableCell>
                    <Badge className={statusColors[project.status] || "bg-gray-500"}>
                      {statusOptions.find((s) => s.value === project.status)?.label || project.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {project.contract_signed ? (
                      <Badge className="bg-green-600">
                        <Check className="h-3 w-3 mr-1" />
                        Signed
                      </Badge>
                    ) : (
                      <Badge variant="secondary">Unsigned</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" onClick={() => openEditProject(project)} title="Edit">
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleSendContract(project)}
                        disabled={sendingContract === project.id}
                        title="Send Contract Email"
                      >
                        {sendingContract === project.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Send className="h-4 w-4" />
                        )}
                      </Button>
                      {project.contract_signed && (
                        <>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDownloadContract(project)}
                            title="Download Signed Contract PDF"
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleSendSignedContract(project)}
                            disabled={sendingSignedContract === project.id}
                            title="Email Signed Contract"
                          >
                            {sendingSignedContract === project.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Mail className="h-4 w-4" />
                            )}
                          </Button>
                        </>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(project.id)}
                        disabled={deletingId === project.id}
                        title="Delete"
                        className="text-destructive hover:text-destructive"
                      >
                        {deletingId === project.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}

        {/* Create/Edit Dialog */}
        <Dialog open={showDialog} onOpenChange={setShowDialog}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingProject ? "Edit HEA Project" : "Create HEA Project"}</DialogTitle>
              <DialogDescription>
                {editingProject ? "Update client project details" : "Add a new direct client project"}
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Full Name *</Label>
                  <Input
                    value={formData.full_name}
                    onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                    placeholder="Client full name"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Email *</Label>
                  <Input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="client@email.com"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Address</Label>
                <Input
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="Client address"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Price *</Label>
                  <Input
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    placeholder="e.g. 500"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Number of Revisions</Label>
                  <Input
                    type="number"
                    min={0}
                    value={formData.number_of_revisions}
                    onChange={(e) => setFormData({ ...formData, number_of_revisions: parseInt(e.target.value) || 0 })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Assigned Producer</Label>
                <Select
                  value={formData.assigned_producer_id}
                  onValueChange={(value) => setFormData({ ...formData, assigned_producer_id: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select producer" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Unassigned</SelectItem>
                    {producers.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) => setFormData({ ...formData, status: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {statusOptions.map((s) => (
                      <SelectItem key={s.value} value={s.value}>
                        {s.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Project Details</Label>
                <Textarea
                  value={formData.details}
                  onChange={(e) => setFormData({ ...formData, details: e.target.value })}
                  placeholder="Describe the project scope, deliverables, timeline..."
                  rows={4}
                />
              </div>

              <div className="space-y-2">
                <Label>Contract Terms</Label>
                <Textarea
                  value={formData.terms}
                  onChange={(e) => setFormData({ ...formData, terms: e.target.value })}
                  placeholder="Terms and conditions for the contract..."
                  rows={6}
                />
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setShowDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={saving}>
                {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                {editingProject ? "Save Changes" : "Create Project"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
};
