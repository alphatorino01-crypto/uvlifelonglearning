import { usePage } from '@inertiajs/react';
import { Breadcrumbs } from '@/components/breadcrumbs';
import { SidebarTrigger } from '@/components/ui/sidebar';
import type { BreadcrumbItem as BreadcrumbItemType } from '@/types';

type BreadcrumbPageProps = {
    course?: {
        title: string;
        slug: string;
        module?: { title: string; slug: string } | null;
    };
    lesson?: { title: string; slug: string };
    module?: { title: string; slug: string };
};

export function AppSidebarHeader({
    breadcrumbs = [],
}: {
    breadcrumbs?: BreadcrumbItemType[];
}) {
    const page = usePage<BreadcrumbPageProps>();
    const { course, lesson, module } = page.props;
    let pageBreadcrumbs = breadcrumbs;
    if (pageBreadcrumbs.length === 0 && course) {
        pageBreadcrumbs = [
            {
                title: course.module?.title ?? 'Courses',
                href: course.module
                    ? `/modules/${course.module.slug}`
                    : '/courses',
            },
            { title: course.title, href: `/courses/${course.slug}` },
        ];
        if (lesson) {
            pageBreadcrumbs.push({
                title: lesson.title,
                href: `/courses/${course.slug}/lessons/${lesson.slug}`,
            });
        }
    } else if (pageBreadcrumbs.length === 0 && module) {
        pageBreadcrumbs = [
            { title: 'Learning modules', href: '/modules' },
            { title: module.title, href: `/modules/${module.slug}` },
        ];
    } else if (pageBreadcrumbs.length === 0) {
        const path = page.url.split('?')[0];
        const pathBreadcrumbs: Record<string, BreadcrumbItemType> = {
            '/': { title: 'My learning', href: '/' },
            '/courses': { title: 'Explore courses', href: '/courses' },
            '/modules': { title: 'Learning modules', href: '/modules' },
            '/progress': { title: 'My progress', href: '/progress' },
            '/my-materials': {
                title: 'Study materials',
                href: '/my-materials',
            },
        };
        const breadcrumb = pathBreadcrumbs[path];
        pageBreadcrumbs = breadcrumb ? [breadcrumb] : [];
    }

    return (
        <header className="flex h-16 shrink-0 items-center gap-2 border-b border-sidebar-border/50 px-6 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12 md:px-4">
            <div className="flex items-center gap-2">
                <SidebarTrigger className="-ml-1" />
                <Breadcrumbs breadcrumbs={pageBreadcrumbs} />
            </div>
        </header>
    );
}
