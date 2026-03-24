import React, { useState, useEffect, useMemo } from "react";
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
import { format, getDaysInMonth, isValid } from "date-fns";
import { useLanguage } from "@/hooks/useLanguage";

interface MobileDatePickerProps {
    value: string; // YYYY-MM-DD
    onChange: (value: string) => void;
    label?: string;
    placeholder?: string;
    id?: string;
    className?: string;
    required?: boolean;
    maxDate?: string; // YYYY-MM-DD - limita la fecha máxima seleccionable
}

const MobileDatePicker: React.FC<MobileDatePickerProps> = ({
    value,
    onChange,
    label,
    placeholder,
    id,
    className,
    required,
    maxDate
}) => {
    const { t } = useLanguage();
    const [isOpen, setIsOpen] = useState(false);

    const months = useMemo(() => [
        t('months.january'), t('months.february'), t('months.march'), t('months.april'),
        t('months.may'), t('months.june'), t('months.july'), t('months.august'),
        t('months.september'), t('months.october'), t('months.november'), t('months.december')
    ], [t]);

    // Parse initial value or use current date
    const initialDate = value && isValid(new Date(value + "T12:00:00")) ? new Date(value + "T12:00:00") : new Date();

    const [pickerValue, setPickerValue] = useState({
        day: initialDate.getDate().toString(),
        month: months[initialDate.getMonth()],
        year: initialDate.getFullYear().toString(),
    });

    // Sync internal state when external value changes
    useEffect(() => {
        if (value && isValid(new Date(value + "T12:00:00"))) {
            const date = new Date(value + "T12:00:00");
            setPickerValue({
                day: date.getDate().toString(),
                month: months[date.getMonth()],
                year: date.getFullYear().toString(),
            });
        }
    }, [value, months]);

    const currentYear = new Date().getFullYear();
    const maxDateObj = maxDate ? new Date(maxDate + "T23:59:59") : null;
    const maxYear = maxDateObj ? maxDateObj.getFullYear() : currentYear + 20;
    const minYear = currentYear - 120;
    const years = Array.from({ length: maxYear - minYear + 1 }, (_, i) => (minYear + i).toString());

    // Get days for selected month/year
    const monthIndex = months.indexOf(pickerValue.month);
    const selectedYear = parseInt(pickerValue.year);

    // Filter months based on maxDate
    const availableMonths = useMemo(() => {
        if (!maxDateObj || selectedYear < maxDateObj.getFullYear()) return months;
        if (selectedYear > maxDateObj.getFullYear()) return months.slice(0, 0);
        return months.slice(0, maxDateObj.getMonth() + 1);
    }, [months, selectedYear, maxDateObj]);

    // Filter days based on maxDate
    const daysInMonth = getDaysInMonth(new Date(selectedYear, monthIndex === -1 ? 0 : monthIndex));
    const availableDays = useMemo(() => {
        const allDays = Array.from({ length: daysInMonth }, (_, i) => (i + 1).toString());
        if (!maxDateObj || selectedYear < maxDateObj.getFullYear()) return allDays;
        if (selectedYear > maxDateObj.getFullYear()) return allDays.slice(0, 0);
        if (monthIndex < maxDateObj.getMonth()) return allDays;
        if (monthIndex === maxDateObj.getMonth()) return allDays.slice(0, maxDateObj.getDate());
        return allDays.slice(0, 0);
    }, [daysInMonth, selectedYear, monthIndex, maxDateObj]);

    const handleConfirm = () => {
        const monthIdx = months.indexOf(pickerValue.month);
        const day = parseInt(pickerValue.day);
        const year = parseInt(pickerValue.year);

        if (monthIdx === -1) return;

        // Ensure day is valid for the selected month (e.g. Feb 30 -> Feb 28/29)
        const maxDays = getDaysInMonth(new Date(year, monthIdx));
        const validDay = Math.min(day, maxDays);

        const date = new Date(year, monthIdx, validDay, 12, 0, 0);

        // Validar que no supere la fecha máxima
        if (maxDateObj && date > maxDateObj) {
            const formattedMax = format(maxDateObj, "dd/MM/yyyy");
            alert(`La fecha no puede ser posterior a ${formattedMax}`);
            return;
        }

        const formattedDate = format(date, "yyyy-MM-dd");
        onChange(formattedDate);
        setIsOpen(false);
    };

    const displayValue = value ? format(new Date(value + "T12:00:00"), "dd/MM/yyyy") : "";

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
                        <DrawerTitle>{label || t('register.selectDate')}</DrawerTitle>
                        <DrawerDescription>{t('register.swipeToChange')}</DrawerDescription>
                    </DrawerHeader>

                    <div className="px-4 py-8" data-vaul-no-drag>
                        <Picker value={pickerValue} onChange={(newValue) => setPickerValue(newValue as typeof pickerValue)} wheelMode="natural">
                            <Picker.Column name="day">
                                {availableDays.map(day => (
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
                                {availableMonths.map(month => (
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
                            <Button variant="outline" className="flex-1">{t('register.cancel')}</Button>
                        </DrawerClose>
                        <Button className="flex-1 bg-gradient-primary" onClick={handleConfirm}>
                            {t('register.confirm')}
                        </Button>
                    </DrawerFooter>
                </DrawerContent>
            </Drawer>
        </div>
    );
};

export default MobileDatePicker;
