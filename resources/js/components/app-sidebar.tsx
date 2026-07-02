import { Link } from '@inertiajs/react';
import {
    LayoutGrid,
    ImageIcon,
    Users as UsersIcon,
    MessageCircle,
    ChevronRight,
} from 'lucide-react';
import { useState } from 'react';
import { index as chatIndex } from '@/actions/App/Http/Controllers/Admin/ChatController';
import { index as chatSettings } from '@/actions/App/Http/Controllers/Admin/ChatSettingsController';
import { index as mediaIndex } from '@/actions/App/Http/Controllers/Admin/MediaController';
import { index as rolesIndex } from '@/actions/App/Http/Controllers/Admin/RoleController';
import { index as usersIndex } from '@/actions/App/Http/Controllers/Admin/UserController';
import AppLogo from '@/components/app-logo';
import { NavUser } from '@/components/nav-user';
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarGroup,
    SidebarGroupContent,
    SidebarGroupLabel,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarMenuSub,
    SidebarMenuSubButton,
    SidebarMenuSubItem,
    useSidebar,
} from '@/components/ui/sidebar';
import { useCurrentUrl } from '@/hooks/use-current-url';
import { admin } from '@/routes';

type SubItem = {
    label: string;
    href: string;
    active: boolean;
};

type CollapsibleNavItemProps = {
    icon: React.ReactNode;
    label: string;
    defaultOpen: boolean;
    items: SubItem[];
};

/**
 * Sidebar parent entry with nested children.
 *
 * Expanded state: renders as a `Collapsible` so children expand inline with
 * a rotating chevron.
 *
 * Collapsed state (icon-only): children would normally be hidden by the
 * `SidebarMenuSub` stylesheet. To keep them reachable we mount the same
 * entries inside a Radix `DropdownMenu` that opens to the right of the
 * trigger button.
 */
function CollapsibleNavItem({ icon, label, defaultOpen, items }: CollapsibleNavItemProps) {
    const { state, isMobile } = useSidebar();
    const [open, setOpen] = useState(defaultOpen);
    const collapsed = state === 'collapsed' && !isMobile;

    if (collapsed) {
        return (
            <SidebarMenuItem>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <SidebarMenuButton tooltip={label}>{icon}</SidebarMenuButton>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent side="right" align="start" className="min-w-44">
                        {items.map((item) => (
                            <DropdownMenuItem
                                key={item.label}
                                asChild
                                data-active={item.active}
                            >
                                <Link
                                    href={item.href}
                                    prefetch
                                    className={item.active ? 'font-medium text-foreground' : ''}
                                >
                                    {item.label}
                                </Link>
                            </DropdownMenuItem>
                        ))}
                    </DropdownMenuContent>
                </DropdownMenu>
            </SidebarMenuItem>
        );
    }

    return (
        <Collapsible
            open={open}
            onOpenChange={setOpen}
            className="group/collapsible"
        >
            <SidebarMenuItem>
                <CollapsibleTrigger asChild>
                    <SidebarMenuButton tooltip={label}>
                        {icon}
                        <span>{label}</span>
                        <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                    </SidebarMenuButton>
                </CollapsibleTrigger>
                <CollapsibleContent>
                    <SidebarMenuSub>
                        {items.map((item) => (
                            <SidebarMenuSubItem key={item.label}>
                                <SidebarMenuSubButton asChild isActive={item.active}>
                                    <Link href={item.href} prefetch>
                                        <span>{item.label}</span>
                                    </Link>
                                </SidebarMenuSubButton>
                            </SidebarMenuSubItem>
                        ))}
                    </SidebarMenuSub>
                </CollapsibleContent>
            </SidebarMenuItem>
        </Collapsible>
    );
}

export function AppSidebar() {
    const { isCurrentUrl } = useCurrentUrl();

    const usersItems: SubItem[] = [
        { label: 'Todos', href: usersIndex().url, active: isCurrentUrl(usersIndex()) },
        { label: 'Roles', href: rolesIndex().url, active: isCurrentUrl(rolesIndex()) },
    ];
    const chatItems: SubItem[] = [
        { label: 'Todos', href: chatIndex().url, active: isCurrentUrl(chatIndex()) },
        { label: 'Config', href: chatSettings().url, active: isCurrentUrl(chatSettings()) },
    ];

    return (
        <Sidebar collapsible="icon" variant="inset">
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" asChild>
                            <Link href={admin()} prefetch>
                                <AppLogo />
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            <SidebarContent>
                <SidebarGroup className="px-2 py-0">
                    <SidebarGroupLabel>Plataforma</SidebarGroupLabel>
                    <SidebarGroupContent>
                        <SidebarMenu>
                            <SidebarMenuItem>
                                <SidebarMenuButton
                                    asChild
                                    isActive={isCurrentUrl(admin())}
                                    tooltip={{ children: 'Admin' }}
                                >
                                    <Link href={admin()} prefetch>
                                        <LayoutGrid />
                                        <span>Admin</span>
                                    </Link>
                                </SidebarMenuButton>
                            </SidebarMenuItem>

                            <SidebarMenuItem>
                                <SidebarMenuButton
                                    asChild
                                    isActive={isCurrentUrl(mediaIndex())}
                                    tooltip={{ children: 'Medios' }}
                                >
                                    <Link href={mediaIndex()} prefetch>
                                        <ImageIcon />
                                        <span>Medios</span>
                                    </Link>
                                </SidebarMenuButton>
                            </SidebarMenuItem>

                            <CollapsibleNavItem
                                icon={<UsersIcon />}
                                label="Usuarios"
                                defaultOpen={
                                    isCurrentUrl(usersIndex()) || isCurrentUrl(rolesIndex())
                                }
                                items={usersItems}
                            />

                            <CollapsibleNavItem
                                icon={<MessageCircle />}
                                label="Chat en Vivo"
                                defaultOpen={
                                    isCurrentUrl(chatIndex()) || isCurrentUrl(chatSettings())
                                }
                                items={chatItems}
                            />
                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>
            </SidebarContent>

            <SidebarFooter>
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}