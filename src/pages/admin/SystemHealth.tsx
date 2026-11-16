import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Activity, AlertTriangle, Clock, Cpu, Database, Gauge, Loader2, RefreshCw, Search } from 'lucide-react';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MiniBarChart } from '@/components/reports/MiniBarChart';
import { WeeklyReport } from '@/components/reports/WeeklyReport';
import { cn } from '@/lib/utils';

interface Totals { requests: number; errors: number; slow: number; averageMs: number; errorRate: number }
interface RouteRow { route: string; requests: number; errors: number; averageMs: number; p95Ms: number; maxMs: number }
interface Metrics {
    uptimeSeconds: number;
    memoryMb: { used: number; heap: number };
    eventLoopDelayMs: { mean: number; p99: number; max: number };
    databaseMs: number | null;
    node: string;
    lastHour: Totals;
    last24Hours: Totals;
    hourly: (Totals & { hour: string })[];
    slowestRoutes: RouteRow[];
    busiestRoutes: RouteRow[];
    failingRoutes: RouteRow[];
    slowRequests: { at: string; route: string; status: number; ms: number }[];
}
interface Logs {
    total: number;
    groups: { message: string; where: string; source: string; count: number; lastAt: string; firstAt: string }[];
    byDay: { day: string; count: number }[];
}

const uptime = (s: number) => (s < 3600 ? `${Math.round(s / 60)} min` : s < 86400 ? `${Math.round(s / 3600)} h` : `${Math.round(s / 86400)} days`);
const when = (iso: string) => new Date(iso).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });

/** Is everything working? Response times, errors, the error log, and the weekly report. */
const SystemHealth = () => {
    return (
        <div className="max-w-6xl space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">System health</h1>
                <p className="mt-1 text-muted-foreground">How fast MYUKCHEF is answering, what's failing, and how the week is going. You're alerted when an error is new, and again if errors suddenly pile up.</p>
            </div>
            <Tabs defaultValue="performance">
                <TabsList>
                    <TabsTrigger value="performance">Performance</TabsTrigger>
                    <TabsTrigger value="logs">Error log</TabsTrigger>
                    <TabsTrigger value="weekly">Weekly report</TabsTrigger>
                </TabsList>
                <TabsContent value="performance" className="pt-4"><Performance /></TabsContent>
                <TabsContent value="logs" className="pt-4"><ErrorLog /></TabsContent>
                <TabsContent value="weekly" className="pt-4"><WeeklyReport who="admin" /></TabsContent>
            </Tabs>
        </div>
    );
};

function Tile({ icon: Icon, label, value, hint, bad }: { icon: typeof Activity; label: string; value: string; hint?: string; bad?: boolean }) {
    return (
        <Card>
            <CardContent className="p-4">
                <div className="flex items-center justify-between text-sm text-muted-foreground">{label}<Icon className="h-4 w-4" /></div>
                <p className={cn('mt-1 text-2xl font-bold', bad && 'text-red-600')}>{value}</p>
                {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
            </CardContent>
        </Card>
    );
}

function RouteTable({ rows, empty }: { rows: RouteRow[]; empty: string }) {
    if (!rows.length) return <p className="text-sm text-muted-foreground">{empty}</p>;
    return (
        <div className="overflow-x-auto">
            <table className="w-full text-sm">
                <thead><tr className="border-b text-left text-muted-foreground"><th className="py-2 pr-2 font-medium">Route</th><th className="px-2 text-right font-medium">Requests</th><th className="px-2 text-right font-medium">Average</th><th className="px-2 text-right font-medium">Slowest 5%</th><th className="pl-2 text-right font-medium">Errors</th></tr></thead>
                <tbody>
                    {rows.map((r) => (
                        <tr key={r.route} className="border-b last:border-0">
                            <td className="max-w-[18rem] truncate py-2 pr-2 font-mono text-xs" title={r.route}>{r.route}</td>
                            <td className="px-2 text-right">{r.requests}</td>
                            <td className="px-2 text-right">{r.averageMs} ms</td>
                            <td className={cn('px-2 text-right', r.p95Ms > 1000 && 'font-semibold text-orange-600')}>{r.p95Ms} ms</td>
                            <td className={cn('pl-2 text-right', r.errors > 0 && 'font-semibold text-red-600')}>{r.errors}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

function Performance() {
    const { data: m, isLoading, refetch, isFetching } = useQuery<Metrics>({ queryKey: ['metrics'], queryFn: () => api.get('/health/metrics'), refetchInterval: 30_000 });
    if (isLoading || !m) return <div className="flex justify-center py-16"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
    const hourLabel = (iso: string) => new Date(iso).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between gap-2">
                <p className="text-sm text-muted-foreground">Running for {uptime(m.uptimeSeconds)} on Node {m.node}. Figures reset when the server restarts. Refreshes every 30 seconds.</p>
                <Button size="sm" variant="outline" onClick={() => refetch()} disabled={isFetching}><RefreshCw className={cn('mr-1.5 h-4 w-4', isFetching && 'animate-spin')} />Refresh</Button>
            </div>
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                <Tile icon={Activity} label="Requests, last hour" value={String(m.lastHour.requests)} hint={`${m.last24Hours.requests} in 24 hours`} />
                <Tile icon={Gauge} label="Average response" value={`${m.lastHour.averageMs} ms`} hint={`${m.lastHour.slow} slow (over 1 second)`} bad={m.lastHour.averageMs > 800} />
                <Tile icon={AlertTriangle} label="Server errors, last hour" value={`${m.lastHour.errors}`} hint={`${m.lastHour.errorRate}% of requests`} bad={m.lastHour.errorRate > 2} />
                <Tile icon={Database} label="Database" value={m.databaseMs === null ? 'Not answering' : `${m.databaseMs} ms`} hint="Time to answer a simple query" bad={m.databaseMs === null || m.databaseMs > 200} />
                <Tile icon={Cpu} label="Memory" value={`${m.memoryMb.used} MB`} hint={`${m.memoryMb.heap} MB in use by the app`} bad={m.memoryMb.used > 900} />
                <Tile icon={Clock} label="Server busy delay" value={`${m.eventLoopDelayMs.p99} ms`} hint="Under 100 ms is healthy" bad={m.eventLoopDelayMs.p99 > 200} />
            </div>
            <Card>
                <CardHeader><CardTitle className="text-base">Last 24 hours</CardTitle></CardHeader>
                <CardContent className="grid gap-6 md:grid-cols-2 [&>*]:min-w-0">
                    <MiniBarChart label="Requests per hour" data={m.hourly.map((h) => ({ date: h.hour, value: h.requests }))} labelOf={hourLabel} format={(n) => `${n} requests`} />
                    <MiniBarChart label="Average response time" data={m.hourly.map((h) => ({ date: h.hour, value: h.averageMs }))} labelOf={hourLabel} format={(n) => `${n} ms`} />
                </CardContent>
            </Card>
            <div className="grid gap-6 lg:grid-cols-2 [&>*]:min-w-0">
                <Card><CardHeader><CardTitle className="text-base">Slowest routes</CardTitle><CardDescription>Routes with at least 3 requests, slowest first.</CardDescription></CardHeader><CardContent><RouteTable rows={m.slowestRoutes} empty="Not enough traffic yet." /></CardContent></Card>
                <Card><CardHeader><CardTitle className="text-base">Failing routes</CardTitle><CardDescription>Server errors (5xx) since the last restart.</CardDescription></CardHeader><CardContent><RouteTable rows={m.failingRoutes} empty="No server errors. 🎉" /></CardContent></Card>
                <Card><CardHeader><CardTitle className="text-base">Busiest routes</CardTitle></CardHeader><CardContent><RouteTable rows={m.busiestRoutes} empty="No traffic yet." /></CardContent></Card>
                <Card>
                    <CardHeader><CardTitle className="text-base">Recent slow requests</CardTitle><CardDescription>Requests that took over a second.</CardDescription></CardHeader>
                    <CardContent>
                        {m.slowRequests.length === 0 ? <p className="text-sm text-muted-foreground">None.</p> : (
                            <ul className="space-y-1.5 text-sm">
                                {m.slowRequests.slice(0, 15).map((r, i) => (
                                    <li key={i} className="flex justify-between gap-2"><span className="truncate font-mono text-xs" title={r.route}>{r.route}</span><span className="shrink-0 text-muted-foreground">{(r.ms / 1000).toFixed(1)} s · {when(r.at)}</span></li>
                                ))}
                            </ul>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

function ErrorLog() {
    const [source, setSource] = useState('');
    const [q, setQ] = useState('');
    const [search, setSearch] = useState('');
    const [days, setDays] = useState(7);
    const { data, isLoading } = useQuery<Logs>({
        queryKey: ['logs', source, search, days],
        queryFn: () => api.get(`/health/logs?days=${days}&source=${source}&q=${encodeURIComponent(search)}`),
        refetchInterval: 60_000,
    });
    return (
        <div className="space-y-4">
            <form className="flex flex-col gap-2 sm:flex-row" onSubmit={(e) => { e.preventDefault(); setSearch(q); }}>
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search errors" className="pl-9" aria-label="Search errors" />
                </div>
                <select value={source} onChange={(e) => setSource(e.target.value)} className="h-10 rounded-md border bg-background px-2 text-sm" aria-label="Where from">
                    <option value="">Everywhere</option><option value="server">Server</option><option value="browser">Website</option><option value="app">App</option>
                </select>
                <select value={days} onChange={(e) => setDays(Number(e.target.value))} className="h-10 rounded-md border bg-background px-2 text-sm" aria-label="How far back">
                    <option value={1}>Last 24 hours</option><option value={7}>Last 7 days</option><option value={30}>Last 30 days</option><option value={90}>Last 90 days</option>
                </select>
                <Button type="submit">Search</Button>
            </form>
            {isLoading || !data ? <div className="flex justify-center py-16"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div> : (
                <>
                    <Card>
                        <CardContent className="p-4">
                            <MiniBarChart label={`${data.total} errors`} data={data.byDay.map((d) => ({ date: d.day, value: d.count }))} format={(n) => `${n} errors`} />
                        </CardContent>
                    </Card>
                    {data.groups.length === 0 ? <p className="py-10 text-center text-muted-foreground">No errors logged. 🎉</p> : (
                        <div className="space-y-2">
                            {data.groups.map((g, i) => (
                                <Card key={i}>
                                    <CardContent className="space-y-1 p-4">
                                        <div className="flex flex-wrap items-center gap-2">
                                            <Badge variant={g.source === 'server' ? 'destructive' : 'secondary'}>{g.source === 'browser' ? 'Website' : g.source === 'app' ? 'App' : 'Server'}</Badge>
                                            <Badge variant="outline">{g.count}×</Badge>
                                            <span className="text-xs text-muted-foreground">Last {when(g.lastAt)}{g.count > 1 ? `, first ${when(g.firstAt)}` : ''}</span>
                                        </div>
                                        <p className="break-words font-mono text-sm">{g.message}</p>
                                        {g.where && <p className="break-words text-xs text-muted-foreground">{g.where}</p>}
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    )}
                </>
            )}
        </div>
    );
}

export default SystemHealth;
