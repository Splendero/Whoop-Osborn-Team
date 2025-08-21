import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmergencyContact } from "@/types/health";
import { Phone, MessageSquare, UserCheck, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

interface EmergencyContactsProps {
  contacts: EmergencyContact[];
  onAddContact?: () => void;
  className?: string;
}

export const EmergencyContacts = ({ contacts, onAddContact, className }: EmergencyContactsProps) => {
  const primaryContact = contacts.find(c => c.isPrimary);
  const secondaryContacts = contacts.filter(c => !c.isPrimary);

  return (
    <Card className={cn("bg-card border-border", className)}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <UserCheck className="w-5 h-5 text-chart-accent" />
            Emergency Contacts
          </div>
          {onAddContact && (
            <Button variant="outline" size="sm" onClick={onAddContact}>
              <Plus className="w-4 h-4" />
            </Button>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {contacts.length === 0 ? (
          <div className="text-center py-4">
            <p className="text-sm text-muted-foreground mb-2">
              No emergency contacts configured
            </p>
            {onAddContact && (
              <Button variant="outline" size="sm" onClick={onAddContact}>
                Add Contact
              </Button>
            )}
          </div>
        ) : (
          <>
            {primaryContact && (
              <div className="p-3 rounded-lg bg-gradient-primary/10 border border-primary/20">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <p className="font-medium text-sm">{primaryContact.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {primaryContact.relationship} • Primary
                    </p>
                  </div>
                  <Badge variant="default" className="text-xs">
                    PRIMARY
                  </Badge>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" className="flex items-center gap-1">
                    <Phone className="w-3 h-3" />
                    Call
                  </Button>
                  <Button variant="outline" size="sm" className="flex items-center gap-1">
                    <MessageSquare className="w-3 h-3" />
                    Text
                  </Button>
                </div>
              </div>
            )}

            {secondaryContacts.map((contact) => (
              <div key={contact.id} className="p-3 rounded-lg bg-muted/30 border border-border/50">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <p className="font-medium text-sm">{contact.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {contact.relationship}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" className="flex items-center gap-1">
                    <Phone className="w-3 h-3" />
                    Call
                  </Button>
                  <Button variant="outline" size="sm" className="flex items-center gap-1">
                    <MessageSquare className="w-3 h-3" />
                    Text
                  </Button>
                </div>
              </div>
            ))}
          </>
        )}

        <div className="pt-2 border-t border-border/50">
          <p className="text-xs text-muted-foreground text-center">
            Contacts will be notified automatically during emergencies
          </p>
        </div>
      </CardContent>
    </Card>
  );
};