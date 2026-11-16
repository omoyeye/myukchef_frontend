import { Link } from 'react-router-dom';
import { Bell, CalendarDays, CheckCircle2, Download, MapPin, MonitorSmartphone, PlusSquare, Share, ShieldCheck, Smartphone, WifiOff, Zap } from 'lucide-react';
import SEO from '@/components/common/SEO';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { useInstallApp } from '@/lib/pwa';
import { cn } from '@/lib/utils';

const BENEFITS = [
    { icon: Zap, title: 'Order in two taps', body: 'Opens straight from your home screen, full screen, with your basket and addresses ready.' },
    { icon: Bell, title: 'Know when dinner arrives', body: 'Notifications when your chef starts cooking, when it leaves the kitchen and when it\'s at your door.' },
    { icon: MapPin, title: 'Live tracking', body: 'Follow your delivery on the map, and message your chef if you need to.' },
    { icon: CalendarDays, title: 'Your meal plans, sorted', body: 'Change, skip or pause any week of a plan, from 1 week to 6 months.' },
    { icon: WifiOff, title: 'Works on a weak signal', body: 'The menu and your recent pages still open when your connection drops.' },
    { icon: ShieldCheck, title: 'Small and safe', body: 'No app store download. It takes up almost no space and updates itself.' },
];

const SHOTS = [
    { src: '/app/screen-order.webp', alt: 'The MYUKCHEF app: real chefs, real food, order home-cooked dishes in two taps' },
    { src: '/app/screen-track.webp', alt: 'Live order tracking in the MYUKCHEF app, with each step from cooking to delivery' },
    { src: '/app/screen-plans.webp', alt: 'A meal plan calendar in the MYUKCHEF app, from 1 week to 6 months' },
];

function Phone({ src, alt, className }: { src: string; alt: string; className?: string }) {
    return (
        <div className={cn('relative w-[11.5rem] shrink-0 rounded-[2.2rem] border-[6px] border-ink bg-ink p-1 shadow-2xl sm:w-56', className)}>
            <div className="absolute left-1/2 top-2 z-10 h-4 w-16 -translate-x-1/2 rounded-full bg-ink" />
            <img src={src} alt={alt} width={1080} height={1920} loading="lazy" className="aspect-[9/16] w-full rounded-[1.7rem] object-cover" />
        </div>
    );
}

/** Steps for the person's own device. */
function HowTo() {
    const { installed, canInstall, install, device, iosSafari } = useInstallApp();
    if (installed) {
        return (
            <div className="flex items-center gap-3 rounded-3xl bg-emerald-50 p-5 text-emerald-950">
                <CheckCircle2 className="h-6 w-6 shrink-0" />
                <p className="font-semibold">You're using the MYUKCHEF app. Enjoy!</p>
            </div>
        );
    }
    if (canInstall) {
        return (
            <div className="space-y-3">
                <Button size="lg" className="h-14 w-full rounded-full text-base font-bold sm:w-auto sm:px-10" onClick={() => void install()}>
                    <Download className="mr-2 h-5 w-5" />Install the MYUKCHEF app
                </Button>
                <p className="text-sm text-ink-foreground/70">Free. Adds MYUKCHEF to your {device === 'desktop' ? 'computer' : 'home screen'} in a few seconds.</p>
            </div>
        );
    }
    if (device === 'ios') {
        return (
            <ol className="space-y-3 rounded-3xl bg-ink-foreground/10 p-5 text-left">
                {!iosSafari && <li className="text-sm font-semibold text-amber-200">First, open this page in Safari. Other browsers on iPhone can't add apps to the Home Screen.</li>}
                <li className="flex items-center gap-3"><span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary font-bold">1</span>Tap <Share className="mx-1 inline h-5 w-5" aria-label="Share" /> Share at the bottom of Safari</li>
                <li className="flex items-center gap-3"><span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary font-bold">2</span>Scroll down and tap <PlusSquare className="mx-1 inline h-5 w-5" aria-hidden /> Add to Home Screen</li>
                <li className="flex items-center gap-3"><span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary font-bold">3</span>Tap Add. MYUKCHEF is now on your Home Screen</li>
            </ol>
        );
    }
    return (
        <div className="space-y-2 rounded-3xl bg-ink-foreground/10 p-5 text-left text-sm">
            <p className="font-semibold">Install from your browser's menu</p>
            {device === 'android'
                ? <p className="text-ink-foreground/75">In Chrome, tap ⋮ at the top right, then <strong>Install app</strong> or <strong>Add to Home screen</strong>.</p>
                : <p className="text-ink-foreground/75">In Chrome or Edge, click the install icon <MonitorSmartphone className="mx-1 inline h-4 w-4" aria-hidden /> at the right of the address bar, or open the ⋮ menu and choose <strong>Install MYUKCHEF</strong>. Safari on a Mac: File, then <strong>Add to Dock</strong>.</p>}
        </div>
    );
}

const GetApp = () => (
    <Layout>
        <SEO title="Get the MYUKCHEF App" description="Install MYUKCHEF on your phone or computer: order home-cooked food in two taps, track deliveries live and manage your meal plans. Free, no app store needed." />

        <section className="relative overflow-hidden bg-ink text-ink-foreground">
            <div className="absolute -right-32 -top-32 h-[28rem] w-[28rem] rounded-full bg-primary/30 blur-[120px]" />
            <div className="container relative grid items-center gap-10 py-14 md:grid-cols-2 md:py-20">
                <div className="space-y-6">
                    <p className="inline-flex items-center gap-2 rounded-full bg-ink-foreground/10 px-3 py-1.5 text-sm font-semibold"><Smartphone className="h-4 w-4 text-primary" />Free · No app store needed</p>
                    <h1 className="font-display text-4xl font-extrabold leading-[1.05] md:text-6xl">MYUKCHEF,<br />right on your phone</h1>
                    <p className="max-w-lg text-lg text-ink-foreground/75">Home-cooked food from local chefs, live delivery tracking and your meal plans, one tap from your home screen. Works on iPhone, Android and computers.</p>
                    <HowTo />
                </div>
                <div className="flex justify-center gap-4 md:justify-end" aria-label="What the app looks like">
                    <Phone src={SHOTS[1].src} alt={SHOTS[1].alt} className="mt-12 hidden sm:block" />
                    <Phone src={SHOTS[0].src} alt={SHOTS[0].alt} />
                    <Phone src={SHOTS[2].src} alt={SHOTS[2].alt} className="mt-12 hidden lg:block" />
                </div>
            </div>
        </section>

        <section className="container py-14 md:py-20">
            <h2 className="max-w-2xl font-display text-3xl font-extrabold md:text-5xl">Everything MYUKCHEF does, made quicker</h2>
            <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {BENEFITS.map(({ icon: Icon, title, body }) => (
                    <div key={title} className="rounded-3xl border bg-card p-6">
                        <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10"><Icon className="h-6 w-6 text-primary" /></span>
                        <h3 className="mt-4 text-lg font-bold">{title}</h3>
                        <p className="mt-1 text-muted-foreground">{body}</p>
                    </div>
                ))}
            </div>
        </section>

        <section className="bg-secondary/60 py-14 md:py-20">
            <div className="container grid items-center gap-10 md:grid-cols-2">
                <img src="/app/screen-wide.webp" alt="MYUKCHEF open in its own window on a computer" width={1920} height={1080} loading="lazy" className="w-full rounded-3xl shadow-xl" />
                <div className="space-y-4">
                    <h2 className="font-display text-3xl font-extrabold md:text-4xl">On your computer too</h2>
                    <p className="text-lg text-muted-foreground">Install MYUKCHEF in Chrome or Edge and it opens in its own window, with a shortcut on your desktop or dock. Handy for ordering for the office or planning the family's week.</p>
                    <ul className="space-y-2">
                        {['Your account, basket and plans stay in sync everywhere', 'Notifications when orders are on their way', 'Remove it any time, like any other app'].map((t) => (
                            <li key={t} className="flex gap-2"><CheckCircle2 className="h-5 w-5 shrink-0 text-primary" />{t}</li>
                        ))}
                    </ul>
                </div>
            </div>
        </section>

        <section className="container py-14 md:py-20">
            <h2 className="font-display text-3xl font-extrabold md:text-4xl">Questions</h2>
            <dl className="mt-6 grid gap-6 md:grid-cols-2">
                {[
                    ['Is it free?', 'Yes. Installing the app costs nothing, and prices are the same as on the website.'],
                    ['Do I need the App Store or Google Play?', 'No. It installs straight from this website, so there\'s nothing big to download and it always has the latest updates.'],
                    ['Will I lose my account?', 'No. Sign in with the same email and password, and everything is there: orders, addresses, plans and points.'],
                    ['How do I remove it?', 'Like any app: press and hold its icon and choose Remove (phone), or uninstall it from the app\'s menu (computer).'],
                ].map(([q, a]) => (
                    <div key={q}><dt className="font-bold">{q}</dt><dd className="mt-1 text-muted-foreground">{a}</dd></div>
                ))}
            </dl>
            <div className="mt-10 flex flex-wrap gap-3">
                <Button asChild size="lg" className="h-12 rounded-full font-bold"><Link to="/menu">Browse the menu</Link></Button>
                <Button asChild size="lg" variant="outline" className="h-12 rounded-full font-bold"><Link to="/meal-plans">See meal plans</Link></Button>
            </div>
        </section>
    </Layout>
);

export default GetApp;
