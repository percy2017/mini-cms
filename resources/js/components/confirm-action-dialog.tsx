import { router } from '@inertiajs/react';
import { Loader2 } from 'lucide-react';
import * as React from 'react';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';

export type ConfirmActionDialogProps = {
    /** Render-prop for the trigger button. Receives `{ open, openDialog }` so
     *  the caller can both reflect state and trigger the dialog from arbitrary
     *  children (avoids breakage when stacking Tooltip/DropdownMenu wrappers).
     *  Optional when the dialog is externally controlled via `open`. */
    children?: (props: { open: boolean; openDialog: () => void }) => React.ReactNode;
    /** Externally control the open state. When provided, `children` is not
     *  required and the parent decides when to show the dialog. */
    open?: boolean;
    /** Called when the dialog wants to open/close (backdrop click, escape, X). */
    onOpenChange?: (open: boolean) => void;
    /** Headline shown above the description. */
    title: string;
    /** Body copy explaining the consequence. */
    description: React.ReactNode;
    /** Action label, defaults to "Eliminar". */
    confirmLabel?: string;
    /** Cancel label, defaults to "Cancelar". */
    cancelLabel?: string;
    /** Variant of the confirm button. Defaults to "destructive" so destructive
     *  actions stay visually distinct; pass "default" for non-destructive
     *  confirmations (e.g. save changes). */
    confirmVariant?: 'default' | 'destructive';
    /**
     * Endpoint to call on confirm. If provided, the dialog performs a DELETE
     * with `router.delete`. If omitted, you must provide `onConfirm`.
     */
    actionUrl?: string;
    /** HTTP method, defaults to DELETE. */
    method?: 'delete' | 'post';
    /**
     * Called after the user confirms. Receives a `done()` callback to close the
     * dialog. Useful when the action needs custom logic instead of a plain URL.
     */
    onConfirm?: (done: () => void) => void | Promise<void>;
    /** Extra success callback (e.g. reload list). */
    onSuccess?: () => void;
};

/**
 * Theme-aware (shadcn Dialog) confirmation dialog reusable across the dashboard.
 *
 * Uses an external-controlled trigger via render-prop instead of `asChild`
 * so callers can compose other Radix wrappers (Tooltip, DropdownMenu, etc.)
 * around the trigger without losing the open handler.
 *
 * @example
 *  <ConfirmActionDialog
 *      actionUrl={destroyConversation.url({ conversation: id })}
 *      onSuccess={() => { setActive(null); }}
 *      title="¿Eliminar esta conversación?"
 *      description={<>Se borrarán también los mensajes...</>}
 *  >
 *      {({ openDialog }) => (
 *          <Tooltip>
 *              <TooltipTrigger asChild>
 *                  <Button onClick={openDialog} variant="ghost" size="icon">
 *                      <Trash2 />
 *                  </Button>
 *              </TooltipTrigger>
 *              <TooltipContent>Eliminar conversación</TooltipContent>
 *          </Tooltip>
 *      )}
 *  </ConfirmActionDialog>
 */
export function ConfirmActionDialog({
    children,
    open: openProp,
    onOpenChange: onOpenChangeProp,
    title,
    description,
    confirmLabel = 'Eliminar',
    cancelLabel = 'Cancelar',
    confirmVariant = 'destructive',
    actionUrl,
    method = 'delete',
    onConfirm,
    onSuccess,
}: ConfirmActionDialogProps) {
    const [internalOpen, setInternalOpen] = React.useState(false);
    const [processing, setProcessing] = React.useState(false);

    const isControlled = openProp !== undefined;
    const open = isControlled ? openProp : internalOpen;

    const setOpen = React.useCallback(
        (next: boolean) => {
            if (!isControlled) setInternalOpen(next);
            onOpenChangeProp?.(next);
        },
        [isControlled, onOpenChangeProp],
    );

    const close = React.useCallback(() => setOpen(false), [setOpen]);

    const handleConfirm = async () => {
        if (onConfirm) {
            setProcessing(true);
            try {
                await onConfirm(close);
                onSuccess?.();
            } finally {
                setProcessing(false);
            }
            return;
        }

        if (!actionUrl) return;
        setProcessing(true);
        // Use router.visit() directly instead of the method-shorthand helpers
        // (router.delete / router.post). The shorthands can be undefined in
        // the production bundle due to prototype-binding nuances across
        // treeshaken exports; visit() is the universal method in Inertia v3.
        router.visit(actionUrl, {
            method,
            preserveScroll: true,
            onSuccess: () => {
                onSuccess?.();
                close();
            },
            onFinish: () => setProcessing(false),
        });
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            {children?.({ open, openDialog: () => setOpen(true) })}
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{title}</DialogTitle>
                    <DialogDescription>{description}</DialogDescription>
                </DialogHeader>
                <DialogFooter className="gap-2">
                    <DialogClose asChild>
                        <Button variant="outline" disabled={processing}>
                            {cancelLabel}
                        </Button>
                    </DialogClose>
                    <Button
                        variant={confirmVariant}
                        onClick={handleConfirm}
                        disabled={processing}
                    >
                        {processing && (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        )}
                        {confirmLabel}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

export default ConfirmActionDialog;
