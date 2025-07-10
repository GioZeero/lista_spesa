"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

const formSchema = z.object({
  name: z.string().min(2, {
    message: "Il nome dell'articolo deve contenere almeno 2 caratteri.",
  }),
  quantity: z.coerce.number().positive({
    message: "La quantità deve essere un numero positivo.",
  }),
  unit: z.string().min(1, {
    message: "L'unità è richiesta (es. kg, L, articolo).",
  }),
});

type AddItemFormValues = z.infer<typeof formSchema>;

interface AddItemSheetProps {
  children: React.ReactNode;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAddItem: (item: AddItemFormValues) => void;
}

export function AddItemSheet({ children, open, onOpenChange, onAddItem }: AddItemSheetProps) {
  const form = useForm<AddItemFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      quantity: 1,
      unit: "",
    },
  });

  function onSubmit(values: AddItemFormValues) {
    onAddItem(values);
    form.reset();
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetTrigger asChild>{children}</SheetTrigger>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Aggiungi un nuovo articolo</SheetTitle>
          <SheetDescription>
            Inserisci i dettagli dell'articolo che vuoi aggiungere alla tua lista della spesa.
          </SheetDescription>
        </SheetHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8 py-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome Articolo</FormLabel>
                  <FormControl>
                    <Input placeholder="es. Banane Biologiche" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="flex gap-4">
              <FormField
                control={form.control}
                name="quantity"
                render={({ field }) => (
                  <FormItem className="flex-1">
                    <FormLabel>Quantità</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="1" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="unit"
                render={({ field }) => (
                  <FormItem className="flex-1">
                    <FormLabel>Unità</FormLabel>
                    <FormControl>
                      <Input placeholder="kg" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <Button type="submit" className="w-full">Aggiungi alla Lista</Button>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  );
}
