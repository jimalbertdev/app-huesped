import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/hooks/useLanguage";
import { useReservationParams } from "@/hooks/useReservationParams";
import { toast } from "@/hooks/use-toast";

interface ShareDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const ShareDialog = ({ open, onOpenChange }: ShareDialogProps) => {
  const { t } = useLanguage();
  const { buildPathWithReservation } = useReservationParams();

  const handleCopyLink = () => {
    const basename = import.meta.env.PROD ? '/web/site' : '';
    const url = window.location.origin + basename + buildPathWithReservation("/register");
    navigator.clipboard.writeText(url);
    toast({
      title: t('share.copied'),
      duration: 2000,
    });
  };

  const handleWhatsApp = () => {
    const basename = import.meta.env.PROD ? '/web/site' : '';
    const url = window.location.origin + basename + buildPathWithReservation("/register");
    const message = encodeURIComponent(`${t('share.message')}: ${url}`);
    window.open(`https://wa.me/?text=${message}`, '_blank');
  };

  const handleEmail = () => {
    const basename = import.meta.env.PROD ? '/web/site' : '';
    const url = window.location.origin + basename + buildPathWithReservation("/register");
    const subject = encodeURIComponent(t('share.message'));
    const body = encodeURIComponent(`${t('share.message')}: ${url}`);
    window.location.href = `mailto:?subject=${subject}&body=${body}`;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('share.title')}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <Button 
            variant="outline" 
            className="w-full justify-start gap-2"
            onClick={handleCopyLink}
          >
            📋 {t('share.copy')}
          </Button>
          <Button 
            variant="outline" 
            className="w-full justify-start gap-2"
            onClick={handleWhatsApp}
          >
            💬 {t('share.whatsapp')}
          </Button>
          <Button 
            variant="outline" 
            className="w-full justify-start gap-2"
            onClick={handleEmail}
          >
            📧 {t('share.email')}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
