import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
  Legend,
} from "recharts";
import data from "@/data/dashboard.json";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Dashboard de Leads — Checkout · Abril/2026" },
      {
        name: "description",
        content:
          "Dashboard interativo de leads do checkout: período, campanha, origem e etapa do funil.",
      },
    ],
  }),
  component: Dashboard,
});

type Etapa = { etapa: string; leads: number };
type Dia = { data: string; leads: number; vendas: number; abandonos: number };
type Origem = { origem: string; leads: number; vendas: number };
type Campanha = {
  campaign: string;
  medium: string;
  leads: number;
  vendas: number;
  abandonos: number;
  erros: number;
};

const STAGE_COLORS: Record<string, string> = {
  "Abandono de carrinho": "#990c3d",
  "Aprovado pelo Motor de crédito": "#00a27c",
  "Encaminhado para área logada": "#1f4b6e",
  "Erro ao verificar CNPJ": "#f07d00",
  "Erro ao validar dados de pagamento": "#c54408",
  "Aprovados em observação": "#b3e2ea",
  "Reprovado pelo Motor de crédito": "#dc3545",
  "Venda confirmada": "#d60b52",
  "Erro ao finalizar pedido": "#e4087e",
};

const fmt = (n: number) => n.toLocaleString("pt-BR");
const pct = (n: number, d: number) =>
  d === 0 ? "0,00%" : `${((n / d) * 100).toFixed(2).replace(".", ",")}%`;

function Dashboard() {
  const etapa = data.etapa as Etapa[];
  const dia = data.dia as Dia[];
  const origem = data.origem as Origem[];
  const campanha = data.campanha as Campanha[];

  const total = etapa.reduce((s, e) => s + e.leads, 0);
  const vendas = etapa.find((e) => e.etapa === "Venda confirmada")?.leads ?? 0;
  const abandonos =
    etapa.find((e) => e.etapa === "Abandono de carrinho")?.leads ?? 0;
  const erros = etapa
    .filter((e) => e.etapa.startsWith("Erro"))
    .reduce((s, e) => s + e.leads, 0);

  const [search, setSearch] = useState("");
  const [mediumFilter, setMediumFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"leads" | "vendas" | "conv">("leads");

  const mediums = useMemo(
    () => Array.from(new Set(campanha.map((c) => c.medium))),
    [campanha],
  );

  const filteredCampanhas = useMemo(() => {
    let rows = campanha.filter(
      (c) =>
        c.campaign.toLowerCase().includes(search.toLowerCase()) &&
        (mediumFilter === "all" || c.medium === mediumFilter),
    );
    rows = [...rows].sort((a, b) => {
      if (sortBy === "leads") return b.leads - a.leads;
      if (sortBy === "vendas") return b.vendas - a.vendas;
      return b.vendas / Math.max(b.leads, 1) - a.vendas / Math.max(a.leads, 1);
    });
    return rows;
  }, [campanha, search, mediumFilter, sortBy]);

  return (
    <div className="min-h-screen bg-background">
      <header
        className="border-b text-white"
        style={{ background: "linear-gradient(135deg,#990c3d,#d60b52)" }}
      >
        <div className="mx-auto max-w-7xl px-6 py-8">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-white/80">
                Sem Parar Empresas
              </p>
              <h1 className="font-display text-4xl md:text-5xl font-extrabold uppercase leading-none mt-2">
                Dashboard de Leads · Checkout
              </h1>
              <p className="text-sm text-white/85 mt-3">
                Período: 01/04/2026 — 30/04/2026 · Fonte: Pipe Tag
              </p>
            </div>
            <Badge className="text-sm bg-white text-primary hover:bg-white rounded-full px-4 py-1.5">
              {fmt(total)} leads no período
            </Badge>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 py-8 space-y-8">
        {/* KPIs */}
        <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <KPI label="Leads totais" value={fmt(total)} hint="checkout iniciado" />
          <KPI
            label="Vendas confirmadas"
            value={fmt(vendas)}
            hint={`${pct(vendas, total)} de conversão`}
            tone="success"
          />
          <KPI
            label="Abandono de carrinho"
            value={fmt(abandonos)}
            hint={pct(abandonos, total)}
            tone="danger"
          />
          <KPI
            label="Erros operacionais"
            value={fmt(erros)}
            hint={`${pct(erros, total)} (CNPJ + pgto + pedido)`}
            tone="warning"
          />
        </section>

        {/* Funnel + Distribuição */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Funil por etapa</CardTitle>
            </CardHeader>
            <CardContent className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={[...etapa].sort((a, b) => b.leads - a.leads)}
                  layout="vertical"
                  margin={{ left: 40, right: 24 }}
                >
                  <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                  <XAxis type="number" tickFormatter={(v) => fmt(v as number)} />
                  <YAxis
                    type="category"
                    dataKey="etapa"
                    width={220}
                    tick={{ fontSize: 11 }}
                  />
                  <Tooltip formatter={(v) => fmt(v as number)} />
                  <Bar dataKey="leads" radius={[0, 6, 6, 0]}>
                    {etapa.map((e) => (
                      <Cell
                        key={e.etapa}
                        fill={STAGE_COLORS[e.etapa] ?? "#757575"}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Mix de etapas</CardTitle>
            </CardHeader>
            <CardContent className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={etapa}
                    dataKey="leads"
                    nameKey="etapa"
                    innerRadius={50}
                    outerRadius={90}
                    paddingAngle={2}
                  >
                    {etapa.map((e) => (
                      <Cell
                        key={e.etapa}
                        fill={STAGE_COLORS[e.etapa] ?? "#757575"}
                      />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v) => fmt(v as number)} />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </section>

        {/* Série temporal */}
        <Card>
          <CardHeader>
            <CardTitle>Evolução diária</CardTitle>
          </CardHeader>
          <CardContent className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={dia} margin={{ left: 8, right: 24 }}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                <XAxis
                  dataKey="data"
                  tickFormatter={(v) => (v as string).slice(5)}
                  tick={{ fontSize: 11 }}
                />
                <YAxis
                  yAxisId="L"
                  tickFormatter={(v) => fmt(v as number)}
                  tick={{ fontSize: 11 }}
                />
                <YAxis
                  yAxisId="R"
                  orientation="right"
                  tick={{ fontSize: 11 }}
                />
                <Tooltip formatter={(v) => fmt(v as number)} />
                <Legend />
                <Line
                  yAxisId="L"
                  type="monotone"
                  dataKey="leads"
                  stroke="#d60b52"
                  strokeWidth={2}
                  dot={false}
                  name="Leads"
                />
                <Line
                  yAxisId="L"
                  type="monotone"
                  dataKey="abandonos"
                  stroke="#990c3d"
                  strokeWidth={2}
                  dot={false}
                  name="Abandonos"
                />
                <Line
                  yAxisId="R"
                  type="monotone"
                  dataKey="vendas"
                  stroke="#00a27c"
                  strokeWidth={2}
                  dot={{ r: 3 }}
                  name="Vendas"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Tabs: Origem / Campanha */}
        <Tabs defaultValue="campanhas" className="w-full">
          <TabsList>
            <TabsTrigger value="campanhas">Campanhas</TabsTrigger>
            <TabsTrigger value="origens">Origens / Mídia</TabsTrigger>
          </TabsList>

          <TabsContent value="campanhas" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Campanhas — leads, vendas e conversão</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-wrap gap-3">
                  <Input
                    placeholder="Buscar campanha..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="max-w-xs"
                  />
                  <Select value={mediumFilter} onValueChange={setMediumFilter}>
                    <SelectTrigger className="w-44">
                      <SelectValue placeholder="Medium" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos os mediums</SelectItem>
                      {mediums.map((m) => (
                        <SelectItem key={m} value={m}>
                          {m}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select
                    value={sortBy}
                    onValueChange={(v) => setSortBy(v as typeof sortBy)}
                  >
                    <SelectTrigger className="w-44">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="leads">Ordenar por leads</SelectItem>
                      <SelectItem value="vendas">Ordenar por vendas</SelectItem>
                      <SelectItem value="conv">Ordenar por conversão</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="overflow-x-auto rounded-md border">
                  <table className="w-full text-sm">
                    <thead className="bg-muted/50 text-left">
                      <tr>
                        <th className="px-3 py-2 font-medium">Campanha</th>
                        <th className="px-3 py-2 font-medium">Medium</th>
                        <th className="px-3 py-2 font-medium text-right">Leads</th>
                        <th className="px-3 py-2 font-medium text-right">
                          Abandonos
                        </th>
                        <th className="px-3 py-2 font-medium text-right">Erros</th>
                        <th className="px-3 py-2 font-medium text-right">Vendas</th>
                        <th className="px-3 py-2 font-medium text-right">Conv.</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredCampanhas.map((c) => {
                        const conv = c.vendas / Math.max(c.leads, 1);
                        return (
                          <tr key={c.campaign + c.medium} className="border-t">
                            <td className="px-3 py-2 max-w-[360px] truncate">
                              {c.campaign}
                            </td>
                            <td className="px-3 py-2">
                              <Badge variant="outline">{c.medium}</Badge>
                            </td>
                            <td className="px-3 py-2 text-right tabular-nums">
                              {fmt(c.leads)}
                            </td>
                            <td className="px-3 py-2 text-right tabular-nums text-muted-foreground">
                              {fmt(c.abandonos)}
                            </td>
                            <td className="px-3 py-2 text-right tabular-nums text-muted-foreground">
                              {fmt(c.erros)}
                            </td>
                            <td className="px-3 py-2 text-right tabular-nums font-medium">
                              {fmt(c.vendas)}
                            </td>
                            <td className="px-3 py-2 text-right tabular-nums">
                              <span
                                className={
                                  conv >= 0.025
                                    ? "text-emerald-600 font-medium"
                                    : conv >= 0.015
                                      ? "text-foreground"
                                      : "text-destructive"
                                }
                              >
                                {(conv * 100).toFixed(2).replace(".", ",")}%
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                      {filteredCampanhas.length === 0 && (
                        <tr>
                          <td
                            colSpan={7}
                            className="px-3 py-8 text-center text-muted-foreground"
                          >
                            Nenhuma campanha corresponde aos filtros.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="origens">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Origem / Mídia — Volume</CardTitle>
                </CardHeader>
                <CardContent className="h-96">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={origem}
                      layout="vertical"
                      margin={{ left: 16, right: 16 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                      <XAxis
                        type="number"
                        tickFormatter={(v) => fmt(v as number)}
                      />
                      <YAxis
                        type="category"
                        dataKey="origem"
                        width={170}
                        tick={{ fontSize: 11 }}
                      />
                      <Tooltip formatter={(v) => fmt(v as number)} />
                      <Bar
                        dataKey="leads"
                        fill="#d60b52"
                        radius={[0, 6, 6, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Conversão por origem</CardTitle>
                </CardHeader>
                <CardContent className="h-96">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={origem.map((o) => ({
                        ...o,
                        conv: Number(
                          ((o.vendas / Math.max(o.leads, 1)) * 100).toFixed(2),
                        ),
                      }))}
                      layout="vertical"
                      margin={{ left: 16, right: 16 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                      <XAxis
                        type="number"
                        tickFormatter={(v) => `${v}%`}
                      />
                      <YAxis
                        type="category"
                        dataKey="origem"
                        width={170}
                        tick={{ fontSize: 11 }}
                      />
                      <Tooltip formatter={(v) => `${v}%`} />
                      <Bar
                        dataKey="conv"
                        fill="#00a27c"
                        radius={[0, 6, 6, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}

function KPI({
  label,
  value,
  hint,
  tone,
}: {
  label: string;
  value: string;
  hint?: string;
  tone?: "success" | "warning" | "danger";
}) {
  const toneClass =
    tone === "success"
      ? "text-[color:var(--success)]"
      : tone === "warning"
        ? "text-[color:var(--warning)]"
        : tone === "danger"
          ? "text-primary"
          : "text-foreground";
  return (
    <Card className="shadow-[var(--shadow-card-soft)] border-border/60">
      <CardContent className="pt-6">
        <p className="text-xs uppercase tracking-[0.15em] text-muted-foreground font-semibold">
          {label}
        </p>
        <p className={`font-display text-4xl font-extrabold mt-2 tabular-nums ${toneClass}`}>
          {value}
        </p>
        {hint && (
          <p className="text-xs text-muted-foreground mt-1">{hint}</p>
        )}
      </CardContent>
    </Card>
  );
}
