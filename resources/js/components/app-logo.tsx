import { usePage } from '@inertiajs/react';

type SiteProps = {
    site?: {
        title?: string;
        icon_url?: string | null;
        logo_url?: string | null;
    };
};

/**
 * Brand mark for the admin sidebar (sidebar header + auth layouts). Always
 * renders the square icon from /public/resources/icon.png. The horizontal
 * banner (logo.png) is reserved for the public landing navbar — it doesn't
 * fit in the 32x32 admin slot, so we ignore site.logo_url here on purpose.
 */
export default function AppLogo() {
    const { props } = usePage<SiteProps>();
    const site = props.site;
    const title = site?.title ?? 'HostBol';
    const iconUrl = site?.icon_url ?? '/resources/icon.png';

    return (
        <>
            <div className="flex aspect-square size-8 items-center justify-center overflow-hidden rounded-md bg-sidebar-primary text-sidebar-primary-foreground">
                <img
                    src={iconUrl}
                    alt={title}
                    className="h-full w-full object-cover"
                />
            </div>
            <div className="ml-1 grid flex-1 text-left text-sm">
                <span className="mb-0.5 truncate leading-tight font-semibold">
                    {title}
                </span>
            </div>
        </>
    );
}