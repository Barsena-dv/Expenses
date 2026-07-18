import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from "recharts";

const ACCOUNTS = {
  BOB:    { color: "#F5C518", label: "BOB" },
  Kotak:  { color: "#22C55E", label: "Kotak" },
  Airtel: { color: "#60A5FA", label: "Airtel" },
  Cash:   { color: "#A78BFA", label: "Cash" },
};

const CustomTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  const { name, value } = payload[0].payload;
  return (
    <div style={{
      background: "#13161F", border: "1px solid #2C3250",
      borderRadius: 10, padding: "8px 14px", fontSize: 12,
    }}>
      <span style={{ color: ACCOUNTS[name]?.color, fontFamily: "JetBrains Mono, monospace", fontWeight: 700 }}>
        {name}: ₹{value.toLocaleString("en-IN")}
      </span>
    </div>
  );
};

export default function AccountPieChart({ earning }) {
  const data = Object.entries(earning)
    .map(([name, value]) => ({ name, value }))
    .filter((d) => d.value > 0);
  
  const total = data.reduce((s, d) => s + d.value, 0);

  return (
    <div className="chart-card">
      <div className="chart-card-header">
        <span className="chart-title">Account Split</span>
      </div>
      <div style={{ position: "relative" }}>
        <ResponsiveContainer width="100%" height={200}>
          <PieChart>
            <Pie
              data={data.length ? data : [{ name: "None", value: 1 }]}
              dataKey="value" nameKey="name"
              innerRadius={56} outerRadius={82}
              paddingAngle={3} startAngle={90} endAngle={-270}
            >
              {(data.length ? data : [{ name: "None" }]).map((entry) => (
                <Cell
                  key={entry.name}
                  fill={ACCOUNTS[entry.name]?.color || "#232840"}
                />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
          </PieChart>
        </ResponsiveContainer>
        {/* Center label */}
        <div style={{
          position: "absolute", top: "50%", left: "50%",
          transform: "translate(-50%, -50%)",
          textAlign: "center", pointerEvents: "none",
        }}>
          <div style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 16, fontWeight: 700, color: "#F5C518" }}>
            ₹{total.toLocaleString("en-IN")}
          </div>
          <div style={{ fontSize: 10, color: "#9DA3C0", marginTop: 2 }}>Total</div>
        </div>
      </div>
      {/* Legend */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: "8px 14px", marginTop: 10, paddingTop: 10, borderTop: "1px solid #232840" }}>
        {Object.entries(ACCOUNTS).map(([key, { color }]) => (
          <div key={key} style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11 }}>
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: color }} />
            <span style={{ color: "#9DA3C0" }}>{key}</span>
            <span style={{ fontFamily: "JetBrains Mono, monospace", fontWeight: 600, color: "#EDF0FF" }}>
              ₹{(earning[key] || 0).toLocaleString("en-IN")}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
