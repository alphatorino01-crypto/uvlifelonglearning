import { Link, usePage } from '@inertiajs/react';
import {
    BookOpen,
    BookPlus,
    ClipboardList,
    LayoutGrid,
    FileText,
    ChartNoAxesColumnIncreasing,
    UsersRound,
} from 'lucide-react';
import AppLogo from '@/components/app-logo';
import { NavMain } from '@/components/nav-main';
import { NavUser } from '@/components/nav-user';
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from '@/components/ui/sidebar';
import type { NavItem } from '@/types';

const mainNavItems: NavItem[] = [
    {
        title: 'My learning',
        href: '/',
        icon: LayoutGrid,
    },
    {
        title: 'Explore courses',
        href: '/courses',
        icon: BookOpen,
    },
    {
        title: 'My progress',
        href: '/progress',
        icon: ChartNoAxesColumnIncreasing,
    },
    {
        title: 'Study materials',
        href: '/my-materials',
        icon: FileText,
    },
];

const adminNavItems: NavItem[] = [
    { title: 'Dashboard', href: '/admin/dashboard', icon: LayoutGrid },
    { title: 'Manage courses', href: '/admin/catalog', icon: BookPlus },
    { title: 'Enrollments', href: '/admin/enrollments', icon: ClipboardList },
    { title: 'Users', href: '/admin/users', icon: UsersRound },
];

export function AppSidebar() {
    const { auth } = usePage().props;
    const isAdmin = auth.user?.role === 'admin';
    const navItems = isAdmin
        ? adminNavItems
        : auth.user
          ? mainNavItems
          : mainNavItems.slice(0, 2);

    return (
        <Sidebar collapsible="icon" variant="inset">
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" asChild>
                            <Link
                                href={isAdmin ? '/admin/dashboard' : '/'}
                                prefetch
                            >
                                <AppLogo />
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            <SidebarContent>
                <NavMain
                    items={navItems}
                    label={isAdmin ? 'Administration' : 'Learning'}
                />
            </SidebarContent>

            <SidebarFooter>
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}
