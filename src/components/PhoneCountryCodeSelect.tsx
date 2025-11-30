import { useState } from "react";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { COUNTRY_CODES } from "@/lib/phoneValidation";

interface PhoneCountryCodeSelectProps {
    value: string;
    onChange: (value: string) => void;
    id?: string;
}

export function PhoneCountryCodeSelect({
    value,
    onChange,
    id,
}: PhoneCountryCodeSelectProps) {
    const [open, setOpen] = useState(false);

    // Encontrar el país seleccionado
    const selectedCountry = COUNTRY_CODES.find((country) => country.code === value);

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    id={id}
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    className="w-full h-12 justify-between"
                >
                    {selectedCountry ? (
                        <span className="flex items-center gap-2">
                            <span className="text-lg">{selectedCountry.flag}</span>
                            <span>{selectedCountry.code}</span>
                        </span>
                    ) : (
                        <span className="text-muted-foreground">Seleccionar código...</span>
                    )}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[300px] p-0" align="start">
                <Command>
                    <CommandInput placeholder="Buscar país o código..." />
                    <CommandList>
                        <CommandEmpty>No se encontró ningún país.</CommandEmpty>
                        <CommandGroup>
                            {COUNTRY_CODES.map((country, index) => (
                                <CommandItem
                                    key={`${country.code}-${country.country}-${index}`}
                                    value={`${country.name} ${country.code} ${country.country}`}
                                    onSelect={() => {
                                        onChange(country.code);
                                        setOpen(false);
                                    }}
                                >
                                    <Check
                                        className={cn(
                                            "mr-2 h-4 w-4",
                                            value === country.code ? "opacity-100" : "opacity-0"
                                        )}
                                    />
                                    <span className="flex items-center gap-2">
                                        <span className="text-lg">{country.flag}</span>
                                        <span className="font-medium">{country.code}</span>
                                        <span className="text-muted-foreground">{country.name}</span>
                                    </span>
                                </CommandItem>
                            ))}
                        </CommandGroup>
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    );
}
