import { Checkbox } from "@/components/ui/checkbox";
import { ALLERGENS } from "@/lib/allergens";

interface Props {
    idPrefix: string;
    value: string[];
    confirmed: boolean;
    onChange: (allergens: string[]) => void;
    onConfirmedChange: (confirmed: boolean) => void;
}

/** Every dish is checked against all 14 allergens, and someone must confirm the list before it goes on sale. */
export const AllergenPicker = ({ idPrefix, value, confirmed, onChange, onConfirmedChange }: Props) => (
    <fieldset className="space-y-3 rounded-2xl border p-4">
        <legend className="px-1 font-semibold">Allergens this dish contains</legend>
        <p className="text-sm text-muted-foreground">Check all 14, including anything in sauces, marinades and stocks.</p>
        <div className="grid grid-cols-1 gap-x-3 sm:grid-cols-2">
            {ALLERGENS.map((a) => (
                <label key={a.id} htmlFor={`${idPrefix}-${a.id}`} className="flex min-h-11 items-center gap-2 text-sm">
                    <Checkbox
                        id={`${idPrefix}-${a.id}`}
                        checked={value.includes(a.id)}
                        onCheckedChange={(on) => onChange(on ? [...value, a.id] : value.filter((x) => x !== a.id))}
                    />
                    {a.label}
                </label>
            ))}
        </div>
        <label htmlFor={`${idPrefix}-confirmed`} className="flex items-start gap-2 rounded-xl bg-secondary/70 p-3 text-sm font-medium">
            <Checkbox id={`${idPrefix}-confirmed`} className="mt-0.5" checked={confirmed} onCheckedChange={(on) => onConfirmedChange(!!on)} />
            I've checked all 14 allergens and this list is complete and correct. The dish stays off sale until this is confirmed.
        </label>
    </fieldset>
);
