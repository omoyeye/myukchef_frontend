import { Clock, CheckCircle2, XCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface KitchenStatusProps {
    isOpen?: boolean;
    deliveryTime?: string;
}

export const KitchenStatus = ({ isOpen = true, deliveryTime = "25-35" }: KitchenStatusProps) => {
    return (
        <div className="inline-flex items-center gap-2 bg-background/80 backdrop-blur-md p-2 rounded-full shadow-sm border border-border/50">
            <Badge variant={isOpen ? "default" : "destructive"} className={`${isOpen ? 'bg-green-600 hover:bg-green-700' : ''}`}>
                {isOpen ? (
                    <><CheckCircle2 className="w-3 h-3 mr-1" /> Open Now</>
                ) : (
                    <><XCircle className="w-3 h-3 mr-1" /> Closed</>
                )}
            </Badge>
            {isOpen && (
                <span className="text-sm font-medium flex items-center text-foreground px-2">
                    <Clock className="w-3 h-3 mr-1 text-primary" />
                    {deliveryTime} min delivery
                </span>
            )}
        </div>
    );
};
