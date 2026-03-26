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
      <DialogContent className="sm:max-w-md bg-gradient-to-br from-blue-900/80 to-blue-950/80 border-blue-800/50 backdrop-blur-xl text-white shadow-2xl">
        <DialogHeader>
          <DialogTitle className="text-white">Create New Client</DialogTitle>
          <DialogDescription className="text-blue-200">
            Add a new client to your property management system
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="new_first_name" className="text-blue-100">
              First Name *
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
              className="bg-white/10 border-blue-700/50 text-white placeholder-blue-300"
            />
          </div>
          <div>
            <Label htmlFor="new_last_name" className="text-blue-100">
              Last Name *
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
              className="bg-white/10 border-blue-700/50 text-white placeholder-blue-300"
            />
          </div>
          <div>
            <Label htmlFor="new_email" className="text-blue-100">
              Email *
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
              className="bg-white/10 border-blue-700/50 text-white placeholder-blue-300"
            />
          </div>
          <div className="flex gap-3 justify-end pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={creatingClient}
              className="border-blue-600/50 text-blue-100 hover:bg-blue-800/50"
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={onCreateClient}
              disabled={creatingClient}
              className="bg-blue-600 hover:bg-blue-500 text-white shadow-lg"
            >
              {creatingClient ? "Creating..." : "Create Client"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}