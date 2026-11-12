import { Link, usePage } from '@inertiajs/react';
import {
    BookOpen,
    BookPlus,
    ClipboardList,
    LayoutGrid,
    LibraryBig,
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
        title: 'Courses',
        href: '/courses',
        icon: BookOpen,
    },
    {
        title: 'Modules',
        href: '/modules',
        icon: LibraryBig,
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
    const navItems = isAdmin ? adminNavItems : mainNavItems;

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
