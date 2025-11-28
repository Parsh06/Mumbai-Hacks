import { Link } from "react-router-dom";
import { ArrowUpRight, BellRing, Brain, Download, Shield, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ResponsiveContainer, AreaChart, Area, XAxis, Tooltip } from "recharts";

const portfolioTrend = [
  { label: "Mon", value: 6.8 },
  { label: "Tue", value: 7.1 },
  { label: "Wed", value: 7.35 },
  { label: "Thu", value: 7.5 },
  { label: "Fri", value: 7.62 },
];

const watchlist = [
  { ticker: "TCS", price: "₹3,845", change: "+2.3%", signal: "Strong Buy" },
  { ticker: "INFY", price: "₹1,678", change: "+1.1%", signal: "Buy" },
  { ticker: "RELIANCE", price: "₹2,456", change: "-0.4%", signal: "Hold" },
];

const automations = [
  {
    title: "Deal Room Briefing",
    description: "Summarize overnight macro events at 8:00 AM IST",
    status: "Active",
  },
  {
    title: "AI Risk Guard",
    description: "Alert if volatility exceeds 2.5σ on watchlist",
    status: "Monitoring",
  },
];

export default function Dashboard() {
  return (
    <div className="container mx-auto px-4 py-10 space-y-10">
      <section
        className="brutal-card-lg p-8 relative overflow-hidden"
        style={{
          backgroundImage:
            "linear-gradient(120deg, rgba(0,0,0,0.7), rgba(15,118,110,0.8)), url('https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=1600&q=80')",
          backgroundSize: "cover",
        }}
      >
        <div className="relative z-10 max-w-3xl space-y-4">
          <p className="text-sm uppercase tracking-[0.5em] text-muted-foreground">
            Mission Control
          </p>
          <h1 className="text-display-sm font-display leading-tight">
            Personalized intelligence cockpit for{" "}
            <span className="text-primary">FinSightAi</span> power users.
          </h1>
          <p className="text-muted-foreground text-lg font-medium">
            Monitor mandates, automate alerts, and collaborate with AI agents that work the way
            you do.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link to="/companies">
              <Button className="brutal-button bg-primary text-primary-foreground">
                Explore Signals
                <ArrowUpRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
            <Button variant="outline" className="brutal-button">
              <Download className="w-4 h-4 mr-2" />
              Export Daily Brief
            </Button>
          </div>
        </div>
        <div className="absolute inset-0 opacity-30 bg-[radial-gradient(circle_at_20%_20%,rgba(59,130,246,0.4),transparent_60%)]" />
      </section>

      <section className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "AUM under watch", value: "₹7.6T", sub: "+4.3% WoW" },
          { label: "Active mandates", value: "12", sub: "4 in diligence" },
          { label: "AI playbooks", value: "28", sub: "Updated today" },
          { label: "Alerts resolved", value: "19", sub: "Last 24h" },
        ].map((metric) => (
          <div key={metric.label} className="brutal-card p-5 bg-gradient-to-br from-card to-primary/5">
            <p className="text-sm font-semibold text-muted-foreground">{metric.label}</p>
            <p className="text-3xl font-bold">{metric.value}</p>
            <p className="text-xs font-semibold text-success">{metric.sub}</p>
          </div>
        ))}
      </section>

      <section className="grid lg:grid-cols-3 gap-8">
        <div className="brutal-card-lg p-6 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold">Portfolio Pulse</h2>
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-[0.35em]">
              Real-time
            </span>
          </div>
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={portfolioTrend}>
              <defs>
                <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="label" stroke="hsl(var(--muted-foreground))" />
              <Tooltip contentStyle={{ background: "rgba(15,23,42,0.9)", borderRadius: 12 }} />
              <Area
                type="monotone"
                dataKey="value"
                stroke="hsl(var(--primary))"
                fillOpacity={1}
                fill="url(#colorValue)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="brutal-card-lg p-6 space-y-4">
          <div className="flex items-center gap-3">
            <BellRing className="w-6 h-6 text-secondary" />
            <div>
              <p className="text-lg font-bold">Signal Inbox</p>
              <p className="text-sm text-muted-foreground font-medium">
                3 priority triggers awaiting review
              </p>
            </div>
          </div>
          <div className="space-y-3">
            {automations.map((item) => (
              <div key={item.title} className="p-4 rounded-xl bg-muted/30 border border-border">
                <p className="font-semibold flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-primary" />
                  {item.title}
                </p>
                <p className="text-sm text-muted-foreground">{item.description}</p>
                <p className="text-xs font-bold text-success mt-2">{item.status}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="grid lg:grid-cols-2 gap-8">
        <div className="brutal-card-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <Brain className="w-5 h-5 text-primary" />
              AI Watchlist
            </h2>
            <Shield className="w-5 h-5 text-muted-foreground" />
          </div>
          <div className="space-y-3">
            {watchlist.map((item) => (
              <div
                key={item.ticker}
                className="flex items-center justify-between p-4 rounded-xl border border-border bg-gradient-to-r from-card to-card/40"
              >
                <div>
                  <p className="text-lg font-bold">{item.ticker}</p>
                  <p className="text-sm text-muted-foreground">{item.price}</p>
                </div>
                <div className="text-right">
                  <p className={cnText(item.change)}>{item.change}</p>
                  <p className="text-xs font-semibold uppercase tracking-wide text-primary">
                    {item.signal}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="brutal-card-lg p-6 space-y-4">
          <h2 className="text-xl font-bold">Next best actions</h2>
          <ul className="space-y-3 text-sm font-medium">
            <li className="flex items-start gap-3">
              <span className="w-2 h-2 rounded-full bg-success mt-2" />
              Recommend trimming low conviction holdings to free ₹150Cr liquidity.
            </li>
            <li className="flex items-start gap-3">
              <span className="w-2 h-2 rounded-full bg-secondary mt-2" />
              Setup AI scout to watch energy transition deals in SE Asia.
            </li>
            <li className="flex items-start gap-3">
              <span className="w-2 h-2 rounded-full bg-accent mt-2" />
              Share the INFY vs TCS deep dive with the credit committee.
            </li>
          </ul>
        </div>
      </section>
    </div>
  );
}

function cnText(change: string) {
  return change.startsWith("+")
    ? "text-success font-bold"
    : change.startsWith("-")
    ? "text-destructive font-bold"
    : "font-bold";
}

