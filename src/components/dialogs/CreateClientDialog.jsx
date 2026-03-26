import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

export default function CreateClientDialog({
  open,
  onOpenChange,
  newClientData,
  setNewClientData,
  creatingClient,
  onCreateClient,
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md rounded-2xl backdrop-blur-xl bg-white/10 border border-white/20 text-white shadow-2xl">
        <DialogHeader>
          <DialogTitle className="text-white">Create New Client</DialogTitle>
          <DialogDescription className="text-blue-200">
            Add a new client to your property management system
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="new_first_name" className="text-white">
              First Name <span className="text-red-400">*</span>
            </Label>
            <Input
              id="new_first_name"
              value={newClientData.first_name}
              onChange={(e) =>
                setNewClientData((prev) => ({
                  ...prev,
                  first_name: e.target.value,
                }))
              }
              placeholder="John"
              className="bg-white/10 border-white/20 text-white placeholder:text-white/40"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="new_last_name" className="text-white">
              Last Name <span className="text-red-400">*</span>
            </Label>
            <Input
              id="new_last_name"
              value={newClientData.last_name}
              onChange={(e) =>
                setNewClientData((prev) => ({
                  ...prev,
                  last_name: e.target.value,
                }))
              }
              placeholder="Doe"
              className="bg-white/10 border-white/20 text-white placeholder:text-white/40"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="new_email" className="text-white">
              Email <span className="text-red-400">*</span>
            </Label>
            <Input
              id="new_email"
              type="email"
              value={newClientData.email}
              onChange={(e) =>
                setNewClientData((prev) => ({
                  ...prev,
                  email: e.target.value,
                }))
              }
              placeholder="john@example.com"
              className="bg-white/10 border-white/20 text-white placeholder:text-white/40"
            />
          </div>
          <div className="flex gap-3 justify-end pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={creatingClient}
              className="bg-white/10 border-white/20 text-white hover:bg-white/20"
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={onCreateClient}
              disabled={creatingClient}
              className="bg-green-500 hover:bg-green-600 text-white font-semibold"
            >
              {creatingClient ? "Creating..." : "Create Client"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}