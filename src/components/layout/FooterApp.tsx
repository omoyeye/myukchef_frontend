import { Link } from 'react-router-dom';

/** Store badge icons, drawn simply so they stay crisp in light and dark. */
const PlayIcon = () => (
    <svg viewBox="0 0 24 24" aria-hidden className="h-6 w-6 shrink-0">
        <path d="M4 2.8v18.4c0 .7.8 1.1 1.4.7l15.4-9.2a.8.8 0 0 0 0-1.4L5.4 2.1C4.8 1.7 4 2.1 4 2.8Z" fill="currentColor" />
    </svg>
);
const AppleIcon = () => (
    <svg viewBox="0 0 24 24" aria-hidden className="h-6 w-6 shrink-0">
        <path fill="currentColor" d="M16.4 12.6c0-2.6 2.1-3.8 2.2-3.9-1.2-1.8-3.1-2-3.7-2-1.6-.2-3.1.9-3.9.9-.8 0-2-.9-3.4-.9-1.7 0-3.3 1-4.2 2.6-1.8 3.1-.5 7.7 1.3 10.2.8 1.2 1.8 2.6 3.1 2.5 1.3 0 1.7-.8 3.3-.8 1.5 0 2 .8 3.3.8 1.4 0 2.3-1.2 3.1-2.5 1-1.4 1.4-2.8 1.4-2.9 0 0-2.5-1-2.5-4Zm-2.5-7.6c.7-.9 1.2-2 1-3.2-1 0-2.2.7-3 1.6-.6.7-1.2 1.9-1 3 1.1.1 2.3-.6 3-1.4Z" />
    </svg>
);

function StoreBadge({ href, icon, small, big }: { href?: string; icon: React.ReactNode; small: string; big: string }) {
    const className = 'flex h-12 min-w-36 items-center gap-2 rounded-xl border border-white/15 bg-black px-3 text-white transition-transform hover:-translate-y-0.5 hover:border-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary';
    const body = (
        <>
            {icon}
            <span className="text-left leading-tight">
                <span className="block text-[10px] uppercase tracking-wide text-white/80">{href ? small : 'Coming soon to'}</span>
                <span className="block text-base font-semibold">{big}</span>
            </span>
        </>
    );
    // Until the store listing is live, the badge opens our "Get the app" page (install the web app today).
    return href
        ? <a href={href} target="_blank" rel="noopener noreferrer" className={className} aria-label={`${small} ${big}`}>{body}</a>
        : <Link to="/app" className={className} aria-label={`${big}: coming soon. Get the app`}>{body}</Link>;
}

/** Footer: two screens from the app, with Google Play and App Store buttons underneath. */
export function FooterApp({ googlePlay, appStore }: { googlePlay?: string; appStore?: string }) {
    const shots = [
        { src: '/app/screen-order.webp', alt: 'Ordering home-cooked dishes in the MYUKCHEF app' },
        { src: '/app/screen-track.webp', alt: 'Live order tracking in the MYUKCHEF app' },
    ];
    return (
        <div className="space-y-4">
            <h4 className="font-semibold text-foreground">Get the app</h4>
            <p className="text-sm text-muted-foreground">Order, track your delivery and manage meal plans on the go.</p>
            <Link to="/app" className="flex justify-center gap-3 sm:justify-start" aria-label="Get the MYUKCHEF app">
                {shots.map((s, i) => (
                    <span key={s.src} className={`block w-[7.5rem] overflow-hidden rounded-[1.4rem] border-[5px] border-neutral-900 bg-neutral-900 shadow-warm-lg ${i === 1 ? 'mt-6' : ''}`}>
                        <img src={s.src} alt={s.alt} loading="lazy" className="aspect-[9/19] w-full object-cover object-top" />
                    </span>
                ))}
            </Link>
            <div className="flex flex-wrap justify-center gap-2 sm:justify-start">
                <StoreBadge href={googlePlay} icon={<PlayIcon />} small="Get it on" big="Google Play" />
                <StoreBadge href={appStore} icon={<AppleIcon />} small="Download on the" big="App Store" />
            </div>
        </div>
    );
}
