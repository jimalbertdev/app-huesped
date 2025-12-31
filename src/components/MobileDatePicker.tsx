import React, { useState, useEffect } from "react";
import Picker from "react-mobile-picker";
import {
    Drawer,
    DrawerClose,
    DrawerContent,
    DrawerDescription,
    DrawerFooter,
    DrawerHeader,
    DrawerTitle,
    DrawerTrigger,
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Calendar as CalendarIcon } from "lucide-react";
import { format, parse, getDaysInMonth, isValid } from "date-fns";
import { es } from "date-fns/locale";

interface MobileDatePickerProps {
    value: string; // YYYY-MM-DD
    onChange: (value: string) => void;
    label?: string;
    placeholder?: string;
    id?: string;
    className?: string;
    required?: boolean;
}

const months = [
    "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
    "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
];

const MobileDatePicker: React.FC<MobileDatePickerProps> = ({
    value,
    onChange,
    label,
    placeholder,
    id,
    className,
    required
}) => {
    const [isOpen, setIsOpen] = useState(false);

    // Parse initial value or use current date
    const initialDate = value && isValid(new Date(value)) ? new Date(value) : new Date();

    const [pickerValue, setPickerValue] = useState({
        day: initialDate.getDate().toString(),
        month: months[initialDate.getMonth()],
        year: initialDate.getFullYear().toString(),
    });

    // Sync internal state when external value changes
    useEffect(() => {
        if (value && isValid(new Date(value))) {
            const date = new Date(value);
            setPickerValue({
                day: date.getDate().toString(),
                month: months[date.getMonth()],
                year: date.getFullYear().toString(),
            });
        }
    }, [value]);

    const currentYear = new Date().getFullYear();
    const years = Array.from({ length: 101 }, (_, i) => (currentYear - 80 + i).toString());

    // Get days for selected month/year
    const monthIndex = months.indexOf(pickerValue.month);
    const daysInMonth = getDaysInMonth(new Date(parseInt(pickerValue.year), monthIndex));
    const days = Array.from({ length: daysInMonth }, (_, i) => (i + 1).toString());

    const handleConfirm = () => {
        const monthIdx = months.indexOf(pickerValue.month);
        const day = parseInt(pickerValue.day);
        const year = parseInt(pickerValue.year);

        // Ensure day is valid for the selected month (e.g. Feb 30 -> Feb 28/29)
        const maxDays = getDaysInMonth(new Date(year, monthIdx));
        const validDay = Math.min(day, maxDays);

        const date = new Date(year, monthIdx, validDay);
        const formattedDate = format(date, "yyyy-MM-dd");
        onChange(formattedDate);
        setIsOpen(false);
    };

    const displayValue = value ? format(new Date(value), "dd/MM/yyyy") : "";

    return (
        <div className={className}>
            <Drawer open={isOpen} onOpenChange={setIsOpen}>
                <DrawerTrigger asChild>
                    <div className="relative cursor-pointer" onClick={() => setIsOpen(true)}>
                        <Input
                            id={id}
                            value={displayValue}
                            placeholder={placeholder}
                            readOnly
                            className="h-12 cursor-pointer pr-10"
                            required={required}
                        />
                        <CalendarIcon className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground pointer-events-none" />
                    </div>
                </DrawerTrigger>
                <DrawerContent>
                    <DrawerHeader>
                        <DrawerTitle>{label || "Seleccionar fecha"}</DrawerTitle>
                        <DrawerDescription>Desliza para cambiar el día, mes y año.</DrawerDescription>
                    </DrawerHeader>

                    <div className="px-4 py-8">
                        <Picker value={pickerValue} onChange={setPickerValue} wheelMode="natural">
                            <Picker.Column name="day">
                                {days.map(day => (
                                    <Picker.Item key={day} value={day}>
                                        {({ selected }) => (
                                            <div className={`text-xl ${selected ? 'text-primary font-bold' : 'text-muted-foreground'}`}>
                                                {day}
                                            </div>
                                        )}
                                    </Picker.Item>
                                ))}
                            </Picker.Column>
                            <Picker.Column name="month">
                                {months.map(month => (
                                    <Picker.Item key={month} value={month}>
                                        {({ selected }) => (
                                            <div className={`text-xl ${selected ? 'text-primary font-bold' : 'text-muted-foreground'}`}>
                                                {month}
                                            </div>
                                        )}
                                    </Picker.Item>
                                ))}
                            </Picker.Column>
                            <Picker.Column name="year">
                                {years.map(year => (
                                    <Picker.Item key={year} value={year}>
                                        {({ selected }) => (
                                            <div className={`text-xl ${selected ? 'text-primary font-bold' : 'text-muted-foreground'}`}>
                                                {year}
                                            </div>
                                        )}
                                    </Picker.Item>
                                ))}
                            </Picker.Column>
                        </Picker>
                    </div>

                    <DrawerFooter className="flex-row gap-3">
                        <DrawerClose asChild>
                            <Button variant="outline" className="flex-1">Cancelar</Button>
                        </DrawerClose>
                        <Button className="flex-1 bg-gradient-primary" onClick={handleConfirm}>
                            Confirmar
                        </Button>
                    </DrawerFooter>
                </DrawerContent>
            </Drawer>
        </div>
    );
};

export default MobileDatePicker;
